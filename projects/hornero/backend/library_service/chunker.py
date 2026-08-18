"""Chunker legal por artículo (self-contained). Solo stdlib.

Robusto a las dos notaciones de InfoLeg:
  - 'Art. N.'      (abreviado, p.ej. LCT 20.744)
  - 'Artículo N°'  (palabra completa, p.ej. 23.551, 24.013, 24.557)
Detecta la DOMINANTE por documento (la que produce más artículos válidos).
Los cross-refs en minúscula ('artículo 82') NO se toman como delimitador.
"""
import re
import html
import urllib.request

USER_AGENT = "Mozilla/5.0 (HorneroLibrary)"

# Abreviado (cuerpo LCT). 'Artículo Nº' de índice/remisión se ignora en este patrón.
_PAT_ABBR = re.compile(r"\bArt\.\s*(\d+)\s*(bis|ter|qu[aá]ter)?\s*[°ºª]?\.?", re.IGNORECASE)
# Palabra completa SOLO capitalizada/mayúscula (encabezado real, no cross-ref en minúscula)
_PAT_FULL = re.compile(r"\b(?:ART[IÍ]CULO|Art[ií]culo)\s+(\d+)\s*(bis|ter|qu[aá]ter)?\s*[°ºª]?")


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as r:
        raw = r.read()
        charset = r.headers.get_content_charset()
    # 1) charset del header. 2) UTF-8 estricto (webs modernas). 3) cp1252 (InfoLeg) fallback.
    if charset:
        try:
            return raw.decode(charset, "ignore")
        except (LookupError, UnicodeDecodeError):
            pass
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        return raw.decode("cp1252", "ignore")


def html_to_text(h: str) -> str:
    # sacar script/style (incluye JSON-LD) ANTES de quitar tags, para que no se filtren al texto
    h = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", h)
    t = re.sub(r"<[^>]+>", " ", h)
    t = html.unescape(t)
    return re.sub(r"[ \t\r]+", " ", t)


def _blocks(text: str, pat) -> dict:
    """Devuelve {articulo: texto} para un patrón, dedup quedándose con el más largo."""
    ms = list(pat.finditer(text))
    best = {}
    for i, m in enumerate(ms):
        art = m.group(1) + (" " + m.group(2).lower() if m.group(2) else "")
        s = m.end()
        e = ms[i + 1].start() if i + 1 < len(ms) else len(text)
        body = text[s:e].strip(" .-\n—– ")
        if len(body) < 25:
            continue
        if art not in best or len(body) > len(best[art]):
            best[art] = body
    return best


def chunk_law(text, norma, fuente="InfoLeg", tipo="ley",
              capa="general", tenant="shared", vigencia="vigente"):
    abbr = _blocks(text, _PAT_ABBR)
    full = _blocks(text, _PAT_FULL)
    best = abbr if len(abbr) >= len(full) else full   # notación dominante

    out = []
    for art, body in best.items():
        titulo = re.split(r"\.\s", body, 1)[0].strip()[:90]
        out.append({
            "id": f"{norma}-art-{art}".replace(" ", "_").replace(".", ""),
            "tipo": tipo, "norma": norma, "articulo": art,
            "capa": capa, "tenant": tenant, "vigencia": vigencia,
            "titulo": titulo, "texto": body[:2000], "fuente": fuente,
        })

    def _k(c):
        try: return int(c["articulo"].split()[0])
        except Exception: return 10**9
    return sorted(out, key=_k)
