"""Scraper legal parametrizable (fase 2). Fetch + chunk por artículo.

Agregar normas = agregar entradas a SOURCES (con su URL de InfoLeg y capa/tenant).
Los CCT sectoriales van con capa='sectorial' y tenant=<sindicato>.
"""
from chunker import fetch, html_to_text, chunk_law

# norma_id → {norma, url, tipo, capa, tenant}
# Capa GENERAL (compartida por todos los gremios). URLs verificadas en InfoLeg.
SOURCES = {
    "LCT_20744": {
        "norma": "LCT 20.744",
        "url": "http://servicios.infoleg.gob.ar/infolegInternet/anexos/25000-29999/25552/texact.htm",
        "tipo": "ley", "capa": "general", "tenant": "shared",
    },
    "LEY_11544_jornada": {
        "norma": "Ley 11.544 (Jornada)",
        "url": "http://servicios.infoleg.gob.ar/infolegInternet/anexos/60000-64999/63368/texact.htm",
        "tipo": "ley", "capa": "general", "tenant": "shared",
    },
    "LEY_23551_asoc_sindicales": {
        "norma": "Ley 23.551 (Asociaciones Sindicales)",
        "url": "http://servicios.infoleg.gob.ar/infolegInternet/anexos/20000-24999/20993/texact.htm",
        "tipo": "ley", "capa": "general", "tenant": "shared",
    },
    "LEY_24013_empleo": {
        "norma": "Ley 24.013 (Empleo)",
        "url": "http://servicios.infoleg.gob.ar/infolegInternet/anexos/0-4999/412/texact.htm",
        "tipo": "ley", "capa": "general", "tenant": "shared",
    },
    "LEY_24557_art": {
        "norma": "Ley 24.557 (Riesgos del Trabajo / ART)",
        "url": "http://servicios.infoleg.gob.ar/infolegInternet/anexos/25000-29999/27971/texact.htm",
        "tipo": "ley", "capa": "general", "tenant": "shared",
    },
    # Capa SECTORIAL (por sindicato). El CCT 420/05 aceitero va con tenant='aceiteros'.
    # Fuente HTML (evita el OCR del PDF de Min. de Trabajo): ecofield publica el texto
    # completo homologado por Res. 343/05 ST. 55 artículos (Art. 1 → 55).
    "CCT_420_05": {
        "norma": "CCT 420/05 (Aceiteros)",
        "url": "http://www.ecofield.net/Legales/CCT/res343-05_ST_cct420-05.htm",
        "tipo": "cct", "capa": "sectorial", "tenant": "aceiteros",
    },
    "CCT_130_75": {
        "norma": "CCT 130/75 (Empleados de Comercio)",
        "url": "https://www.ignacioonline.com.ar/cct-130-75-convenio-colectivo-de-empleados-de-comercio/",
        "tipo": "cct", "capa": "sectorial", "tenant": "comercio",
    },
    # Capa SECTORIAL (SIPREBA / Prensa).
    # ⚠️ URLs por verificar cuando InfoLEG vuelva a funcionar.
    "CCT_301_75": {
        "norma": "CCT 301/75 (Prensa Escrita y Oral)",
        "url": "https://servicios.infoleg.gob.ar/infolegInternet/anexos/40000-44999/42291/norma.htm",  # URL por verificar
        "tipo": "cct", "capa": "sectorial", "tenant": "prensa",
    },
    "CCT_124_75": {
        "norma": "CCT 124/75 (Prensa Televisada)",
        "url": "https://servicios.infoleg.gob.ar/infolegInternet/anexos/40000-44999/42104/norma.htm",  # URL por verificar
        "tipo": "cct", "capa": "sectorial", "tenant": "prensa",
    },
    "LEY_12908_estatuto_periodista": {
        "norma": "Ley 12.908 (Estatuto del Periodista)",
        "url": "https://servicios.infoleg.gob.ar/infolegInternet/anexos/10000-14999/11706/norma.htm",  # URL por verificar
        "tipo": "ley", "capa": "sectorial", "tenant": "prensa",
    },
}


def scrape(norma_id: str) -> list:
    s = SOURCES[norma_id]
    text = html_to_text(fetch(s["url"]))
    return chunk_law(text, norma=s["norma"], fuente="InfoLeg",
                     tipo=s["tipo"], capa=s["capa"], tenant=s["tenant"])


def scrape_all() -> list:
    out = []
    for nid in SOURCES:
        out += scrape(nid)
    return out
