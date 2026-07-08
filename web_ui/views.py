from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count, Q
from django.conf import settings
from .models import WMSService, WMSVote
import json
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET

def home(request):
    return render(request, 'index.html', {'script_name': settings.SCRIPT_NAME})

def _ensure_session(request):
    if not request.session.session_key:
        request.session.create()
    return request.session.session_key

def list_wms(request):
    session_key = _ensure_session(request)
    services = WMSService.objects.all().select_related('creator').annotate(
        thumbs_up=Count('votes', filter=Q(votes__vote='up')),
        thumbs_down=Count('votes', filter=Q(votes__vote='down')),
    )
    user_votes = {
        v.service_id: v.vote
        for v in WMSVote.objects.filter(session_key=session_key)
    }
    data = []
    for s in services:
        data.append({
            'id': s.id,
            'url': s.url,
            'layers': s.layers,
            'label': s.label,
            'creator': s.creator.username if s.creator else 'Anonymous',
            'created_at': s.created_at.strftime('%Y-%m-%d %H:%M'),
            'thumbs_up': s.thumbs_up,
            'thumbs_down': s.thumbs_down,
            'user_vote': user_votes.get(s.id),
        })
    return JsonResponse(data, safe=False)

@csrf_exempt
def save_wms(request):
    if request.method == 'POST':
        try:
            body = json.loads(request.body)
            url = body.get('url')
            layers = body.get('layers')
            label = body.get('label')

            service = WMSService.objects.filter(url=url, layers=layers).first()
            if not service:
                service = WMSService.objects.create(
                    url=url,
                    layers=layers,
                    label=label,
                    creator=request.user if request.user.is_authenticated else None
                )

            return JsonResponse({
                'id': service.id,
                'creator': service.creator.username if service.creator else 'Anonymous',
                'created_at': service.created_at.strftime('%Y-%m-%d %H:%M')
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'POST required'}, status=405)

@csrf_exempt
def vote_wms(request, service_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    try:
        body = json.loads(request.body)
        vote_value = body.get('vote')  # 'up' or 'down'
        if vote_value not in ('up', 'down'):
            return JsonResponse({'error': 'vote must be "up" or "down"'}, status=400)

        service = WMSService.objects.get(pk=service_id)
        session_key = _ensure_session(request)

        existing = WMSVote.objects.filter(service=service, session_key=session_key).first()
        if existing:
            if existing.vote == vote_value:
                # Toggle off — remove the vote
                existing.delete()
                user_vote = None
            else:
                # Switch vote
                existing.vote = vote_value
                existing.save()
                user_vote = vote_value
        else:
            WMSVote.objects.create(service=service, session_key=session_key, vote=vote_value)
            user_vote = vote_value

        thumbs_up = service.votes.filter(vote='up').count()
        thumbs_down = service.votes.filter(vote='down').count()
        return JsonResponse({
            'thumbs_up': thumbs_up,
            'thumbs_down': thumbs_down,
            'user_vote': user_vote,
        })
    except WMSService.DoesNotExist:
        return JsonResponse({'error': 'Service not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


def wms_time(request):
    """Proxy GetCapabilities and return the TIME dimension extent for a named layer."""
    url = request.GET.get('url', '').strip()
    layer_name = request.GET.get('layer', '').strip()
    if not url or not layer_name:
        return JsonResponse({'error': 'url and layer parameters required'}, status=400)

    caps_url = url.rstrip('?&')
    sep = '&' if '?' in caps_url else '?'
    caps_url += sep + urllib.parse.urlencode({
        'SERVICE': 'WMS',
        'REQUEST': 'GetCapabilities',
        'VERSION': '1.3.0',
    })

    try:
        req = urllib.request.Request(caps_url, headers={'User-Agent': 'EarthRISE-AQS/1.0'})
        with urllib.request.urlopen(req, timeout=15) as resp:
            xml_bytes = resp.read()
    except Exception as e:
        return JsonResponse({'error': f'GetCapabilities fetch failed: {e}'}, status=502)

    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError as e:
        return JsonResponse({'error': f'XML parse error: {e}'}, status=502)

    # Strip namespace for simpler search
    ns = root.tag.split('}')[0].lstrip('{') if '}' in root.tag else ''
    pfx = f'{{{ns}}}' if ns else ''

    time_extent = None
    for layer_el in root.iter(f'{pfx}Layer'):
        name_el = layer_el.find(f'{pfx}Name')
        if name_el is None or name_el.text != layer_name:
            continue
        # WMS 1.3.0: <Dimension name="time">
        for dim in layer_el.iter(f'{pfx}Dimension'):
            if (dim.get('name') or '').lower() == 'time':
                time_extent = (dim.text or '').strip()
                break
        # WMS 1.1.x: <Extent name="time">
        if not time_extent:
            for ext in layer_el.iter(f'{pfx}Extent'):
                if (ext.get('name') or '').lower() == 'time':
                    time_extent = (ext.text or '').strip()
                    break
        if time_extent:
            break

    if not time_extent:
        return JsonResponse({'time_extent': None})

    # Parse ISO 8601 period notation: start/end or start/end/period
    parts = [p.strip() for p in time_extent.split('/')]
    start = parts[0] if len(parts) >= 1 else None
    end   = parts[1] if len(parts) >= 2 else None

    # Truncate to date portion (YYYY-MM-DD) for display
    def trunc(s):
        return s[:10] if s and len(s) >= 10 else s

    return JsonResponse({
        'time_extent': time_extent,
        'start': trunc(start),
        'end':   trunc(end),
    })
