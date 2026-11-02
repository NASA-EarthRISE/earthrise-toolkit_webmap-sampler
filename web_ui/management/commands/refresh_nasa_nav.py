"""
Management command: refresh_nasa_nav

Busts the NASA global navigation cache and immediately re-fetches it from
the NASA HDS API so the next page load gets the fresh nav without delay.

Typical usage
-------------
# One-off refresh:
python manage.py refresh_nasa_nav

# Wire to a systemd timer (runs every 4 hours):
#   OnCalendar=*:0/4
#   ExecStart=/earthrise_apps/<app>/venv/bin/python manage.py refresh_nasa_nav
"""

from django.core.cache import cache
from django.core.management.base import BaseCommand

from web_ui.nasa_nav import CACHE_KEY, get_nasa_nav


class Command(BaseCommand):
    help = "Bust and re-warm the NASA global navigation cache."

    def handle(self, *args, **options):
        self.stdout.write("Clearing NASA nav cache …")
        cache.delete(CACHE_KEY)

        self.stdout.write("Fetching fresh nav from NASA HDS API …")
        nav = get_nasa_nav()

        if nav:
            self.stdout.write(self.style.SUCCESS("NASA nav cache refreshed successfully."))
        else:
            self.stderr.write(
                self.style.ERROR(
                    "Failed to fetch NASA nav — check connectivity to nasa.gov. "
                    "The static fallback header will be shown until the cache is populated."
                )
            )
