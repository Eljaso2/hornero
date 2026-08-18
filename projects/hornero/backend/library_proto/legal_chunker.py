"""Chunker legal por ARTÍCULO para normas de InfoLeg (LCT, leyes, etc.).

Convierte el texto de una norma en chunks a nivel de artículo, con metadata,
para que 'Art. 245' sea una unidad recuperable (lo que el RAG keyword actual
de Hornero NO puede hacer). Solo librería estándar.

Reglas del delimitador (verificadas sobre la LCT 20.744 de InfoLeg):
  - El CUERPO usa 'Art. N.' (abreviado)  → delimitador de artículo
  - El ÍNDICE y las remisiones usan 'Artículo Nº' / 'artículo N' (palabra completa) → se ignoran
"""
import re
import html
import urllib.request

USER_AGENT = "Mozilla/5.0 (HorneroLibraryProto)"


def fetch(url: str) -> str:
    """Descarga una página de InfoLeg y devuelve el texto (latin-1)."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    raw = urllib.request.urlopen(req, timeout=30).read()
    return raw.decode("latin-1", "ignore")


def html_to_text(h: str) -> str:
    """Quita tags y normaliza espacios."""
    t = re.sub(r"<[^>]+>", " ", h)
    t = html.unescape(t)
    t = re.sub(r"[ \t\r]+", " ", t)
    return t


# 'Art. 245.' o 'Art. 92 bis.' — abreviado = cuerpo (no 'Artículo' completo, que es índice/remisión)
_ART_RE = re.compile(r"\bArt\.\s*(\d+)\s*(bis|ter|qu[aá]ter)?\s*[°ºª]?\.?", re.IGNORECASE)


def chunk_law(text: str, norma: str, fuente: str,
              tipo: str = "ley", capa: str = "general",
              tenant: str = "shared", vigencia: str = "vigente") -> list:
    """Divide el texto de una norma en chunks por artículo, con metadata.

    Dedup por número de artículo quedándose con el bloque de texto más largo
    (el artículo real vs. una remisión inline abreviada).
    """
    matches = list(_ART_RE.finditer(text))
    raw_chunks = {}
    for i, m in enumerate(matches):
        art = m.group(1) + (" " + m.group(2).lower() if m.group(2) else "")
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end].strip(" .-\n ")
        if len(body) < 25:            # descartar stubs / remisiones
            continue
        # título = primer fragmento hasta el primer punto (nombre del artículo)
        titulo = re.split(r"\.\s", body, 1)[0].strip()[:90]
        key = art
        # quedarse con el bloque más largo para ese artículo (el real)
        if key not in raw_chunks or len(body) > len(raw_chunks[key]["texto_full"]):
            raw_chunks[key] = {
                "id": f"{norma}-art-{art}".replace(" ", "_").replace(".", ""),
                "tipo": tipo, "norma": norma, "articulo": art,
                "capa": capa, "tenant": tenant, "vigencia": vigencia,
                "titulo": titulo,
                "texto": body[:1500],
                "texto_full": body,
                "fuente": fuente,
            }
    # ordenar por número de artículo
    def art_key(c):
        try:
            return int(c["articulo"].split()[0])
        except Exception:
            return 999999
    chunks = sorted(raw_chunks.values(), key=art_key)
    for c in chunks:
        c.pop("texto_full", None)
    return chunks


# Fuentes de referencia (para el scraper de la fase 2)
INFOLEG = {
    "LCT_20744": {
        "norma": "LCT 20.744",
        "url": "http://servicios.infoleg.gob.ar/infolegInternet/anexos/25000-29999/25552/texact.htm",
        "tipo": "ley", "capa": "general",
    },
}


if __name__ == "__main__":
    src = INFOLEG["LCT_20744"]
    text = html_to_text(fetch(src["url"]))
    chunks = chunk_law(text, norma=src["norma"], fuente="InfoLeg",
                       tipo=src["tipo"], capa=src["capa"])
    print(f"{src['norma']}: {len(chunks)} artículos chunkeados")
    for c in chunks[:3]:
        print(f"  [{c['articulo']}] {c['titulo']}")
