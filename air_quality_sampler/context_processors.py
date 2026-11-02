from django.conf import settings

from web_ui.nasa_nav import get_nasa_nav


def site_metadata(request):
    """Inject site-wide metadata and NASA global nav into every template context."""
    nav = get_nasa_nav()

    nav_context = {}
    if nav:
        css = nav.get("css", {})
        js = nav.get("js", {})
        nav_context = {
            "nasa_nav_header":         nav.get("header", ""),
            "nasa_nav_css_global_nav": css.get("global-nav", ""),
            "nasa_nav_js_global_nav":  js.get("global-nav", ""),
            "nasa_nav_js_menu_toggle": js.get("menu-toggle", ""),
        }

    return {
        "responsible_nasa_official": getattr(
            settings, "RESPONSIBLE_NASA_OFFICIAL", "TBD"
        ),
        "site_editor": getattr(settings, "SITE_EDITOR", "TBD"),
        "site_last_updated": getattr(settings, "SITE_LAST_UPDATED", ""),
        **nav_context,
    }
