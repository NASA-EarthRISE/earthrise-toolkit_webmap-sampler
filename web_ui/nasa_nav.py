"""
Fetches and caches NASA's global navigation from the NASA HDS WordPress API.

The /wp-json/nasa-hds/v1/site-markup-elements endpoint returns the live
header HTML plus the CSS/JS asset URLs that power it — the same markup
nasa.gov renders — so subdomain apps stay in sync automatically whenever
NASA updates their menus (Explore, News & Events, Media, etc.).

Cache TTL defaults to 4 hours so we never hammer NASA's API.  The
`refresh_nasa_nav` management command can be wired to a systemd timer or
cron job to pre-warm the cache on a fixed schedule.
"""

import logging

import requests
from django.core.cache import cache

logger = logging.getLogger(__name__)

NASA_NAV_API_URL = "https://www.nasa.gov/wp-json/nasa-hds/v1/site-markup-elements"

CACHE_KEY = "nasa_global_nav"
CACHE_TTL = 60 * 60 * 4  # 4 hours


def get_nasa_nav():
    """
    Return cached NASA navigation data, refreshing from the API when stale.

    Returns a dict with keys ``css``, ``js``, and ``header``, or ``None``
    if the API is unreachable (templates fall back to the static header).
    """
    data = cache.get(CACHE_KEY)
    if data is not None:
        return data

    try:
        response = requests.get(NASA_NAV_API_URL, timeout=5)
        response.raise_for_status()
        data = response.json()
        cache.set(CACHE_KEY, data, CACHE_TTL)
        logger.info("NASA global nav cache refreshed successfully.")
        return data
    except requests.RequestException as exc:
        logger.warning("Failed to fetch NASA global nav: %s", exc)
        return None
