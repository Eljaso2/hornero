"""MATE Cache — fetches InfoMate economic data from GitHub Pages, caches in memory.

Fetches MATE (Mirador de la Actualidad del Trabajo y la Economía) JSON files
from the Hornero app on GitHub Pages, normalizes the data, and caches in memory.
Auto-refreshes every 60 minutes.
"""

import json
import time
import httpx

# GitHub Pages base URL for Hornero app data
APP_BASE_URL = "https://eljaso2.github.io/hornero"
MATE_INDEX_URL = f"{APP_BASE_URL}/data/mate-index.json"

# Cache: list of MATE editions (most recent first)
_cache = []
_cache_timestamp = 0
_refresh_interval = 3600  # 60 minutes


def get_mate() -> list:
    """Return cached MATE editions. Auto-refresh if expired."""
    now = time.time()
    if not _cache or (now - _cache_timestamp) > _refresh_interval:
        refresh()
    return _cache


def refresh() -> int:
    """Fetch MATE data from GitHub Pages and update cache. Returns edition count."""
    global _cache, _cache_timestamp

    editions = []

    try:
        with httpx.Client(timeout=30.0) as client:
            # 1. Get index to find all available editions
            index_resp = client.get(MATE_INDEX_URL)
            if index_resp.status_code == 200:
                index_data = index_resp.json()
                ediciones = index_data.get("ediciones", [])
                for ed in ediciones:
                    edition_url = f"{APP_BASE_URL}/{ed['archivo']}"
                    edition_resp = client.get(edition_url)
                    if edition_resp.status_code == 200:
                        edition_data = edition_resp.json()
                        editions.append(_normalize(edition_data))

    except Exception as e:
        print(f"MATE cache: fetch failed: {e}")
        # Keep existing cache if fetch fails

    if editions:
        # Sort by mes (most recent first)
        editions.sort(key=lambda x: x.get("mes", ""), reverse=True)
        _cache = editions
        _cache_timestamp = time.time()

    return len(_cache)


def _normalize(data: dict) -> dict:
    """Normalize MATE edition to a standard schema."""
    meta = data.get("meta", {})
    datos_macro = data.get("datosMacro", {})
    secciones = data.get("secciones", [])

    return {
        "mes": meta.get("mes", ""),
        "fecha": meta.get("fecha", ""),
        "fuente": meta.get("fuente", "MATE"),
        "urlInforme": meta.get("urlInforme", ""),
        "datosMacro": datos_macro,
        "secciones": secciones,
    }
