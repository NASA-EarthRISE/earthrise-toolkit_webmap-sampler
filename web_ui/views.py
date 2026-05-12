from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import WMSService
import json

def home(request):
    return render(request, 'index.html')

def list_wms(request):
    services = WMSService.objects.all().select_related('creator')
    data = []
    for s in services:
        data.append({
            'id': s.id,
            'url': s.url,
            'layers': s.layers,
            'label': s.label,
            'creator': s.creator.username if s.creator else 'Anonymous',
            'created_at': s.created_at.strftime('%Y-%m-%d %H:%M')
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

            # Check if this exact URL and layer set already exists
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
