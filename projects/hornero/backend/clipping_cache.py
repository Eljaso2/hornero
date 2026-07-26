"""Clipping Cache — fetches news from GitHub Pages, caches in memory.

Fetches clipping JSON files from the Hornero app on GitHub Pages,
normalizes both daily and weekly formats, and caches them in memory.
Auto-refreshes every 60 minutes.
"""

import json
import time
import httpx

# GitHub Pages base URL for Hornero app data
APP_BASE_URL = "https://eljaso2.github.io/hornero"
CLIPPING_INDEX_URL = f"{APP_BASE_URL}/data/clipping-index.json"
WEEKLY_CLIPPING_URL = f"{APP_BASE_URL}/data/clipping-4.json"

# Cache: list of normalized clipping items
_cache = []
_cache_timestamp = 0
_refresh_interval = 3600  # 60 minutes


def get_clipping() -> list:
    """Return cached clipping items. Auto-refresh if expired."""
    now = time.time()
    if not _cache or (now - _cache_timestamp) > _refresh_interval:
        refresh()
    return _cache


def refresh() -> int:
    """Fetch clipping from GitHub Pages and update cache. Returns item count."""
    global _cache, _cache_timestamp

    items = []

    try:
        # Fetch daily clipping (latest edition from index)
        with httpx.Client(timeout=30.0) as client:
            # 1. Get index to find latest edition
            index_resp = client.get(CLIPPING_INDEX_URL)
            if index_resp.status_code == 200:
                index_data = index_resp.json()
                ediciones = index_data.get("ediciones", [])
                if ediciones:
                    latest = ediciones[0]  # First = most recent
                    edition_url = f"{APP_BASE_URL}/{latest['archivo']}"
                    edition_resp = client.get(edition_url)
                    if edition_resp.status_code == 200:
                        edition_data = edition_resp.json()
                        for noticia in edition_data.get("noticias", []):
                            items.append(_normalize_daily(noticia))

            # 2. Fetch weekly clipping
            weekly_resp = client.get(WEEKLY_CLIPPING_URL)
            if weekly_resp.status_code == 200:
                weekly_data = weekly_resp.json()
                for item in weekly_data.get("clipping", []):
                    items.append(_normalize_weekly(item))

    except Exception as e:
        print(f"Clipping cache: fetch failed: {e}")
        # Keep existing cache if fetch fails (don't wipe it)

    if items:
        # Sort by fecha (most recent first), keep ALL available items
        # Token cost is negligible (~$0.001/request for 40 items)
        items.sort(key=lambda x: x.get("fecha", ""), reverse=True)
        _cache = items
        _cache_timestamp = time.time()

    return len(_cache)


def _normalize_daily(noticia: dict) -> dict:
    """Normalize daily clipping format (Format A) to common schema."""
    return {
        "titulo": noticia.get("titulo", ""),
        "bajada": noticia.get("bajada", ""),
        "desarrollo": noticia.get("desarrollo", ""),
        "fuente": noticia.get("fuente", ""),
        "fecha": noticia.get("fecha", ""),
        "tags": noticia.get("tags", []),
        "tipo": "diario",
    }


def _normalize_weekly(item: dict) -> dict:
    """Normalize weekly clipping format (Format B) to common schema."""
    return {
        "titulo": item.get("titulo", ""),
        "bajada": item.get("bajada", ""),
        "desarrollo": "",  # Weekly format doesn't have desarrollo
        "fuente": item.get("fuente", ""),
        "fecha": item.get("fecha", ""),
        "tags": item.get("tags", []),
        "keywords": item.get("keywords", []),
        "tipo": "semanal",
    }
