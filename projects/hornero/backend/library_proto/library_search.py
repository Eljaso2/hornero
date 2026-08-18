"""Prototipo del servicio /library/search — recuperación consciente de artículos.

Dos caminos, que es lo que le falta al RAG keyword actual de Hornero:
  1) CITA EXACTA: si la consulta menciona 'art. 245' / 'artículo 245', devuelve ese artículo.
  2) TEMÁTICO: TF-IDF léxico sobre los chunks (con bonus de título).

Contrato (lo que en producción sería POST /library/search):
    search(query, chunks, idf, k=5, filtros=None) -> [ {..chunk, score, match} ]
Filtros soportados: tenant, capa, vigencia, tipo, norma.

Nota: este prototipo NO usa embeddings (para no depender de infra). En producción,
el camino TEMÁTICO se reemplaza por búsqueda híbrida (denso + este exact-match legal).
Solo librería estándar.
"""
import re
import math
from collections import Counter

_STOP = set(
    "el la los las un una unos unas de del en y o a que se no si es son con por para "
    "su sus al como mas más muy me te lo le les mi tu un una este esta ese esa".split()
)


def _toks(s: str) -> list:
    s = s.lower()
    s = re.sub(r"[^a-záéíóúñü0-9 ]", " ", s)
    return [t for t in s.split() if len(t) > 2 and t not in _STOP]


def build_index(chunks: list):
    """Precomputa IDF sobre los chunks (una vez)."""
    n = len(chunks)
    df = Counter()
    for c in chunks:
        for t in set(_toks(c["titulo"] + " " + c["texto"])):
            df[t] += 1
    idf = {t: math.log(n / (1 + d)) for t, d in df.items()}
    return idf


def _detect_article(query: str):
    """Extrae el número si la consulta cita un artículo ('art 245', 'artículo 245')."""
    m = re.search(r"\b(?:art[íi]?culo?|art)\.?\s*(\d+)", query.lower())
    return m.group(1) if m else None


def _passes(c: dict, filtros: dict) -> bool:
    if not filtros:
        return True
    for k, v in filtros.items():
        if v in (None, "", "*"):
            continue
        if k == "tenant":
            # el tenant ve su capa + la compartida
            if c.get("tenant") not in (v, "shared"):
                return False
        elif str(c.get(k, "")).lower() != str(v).lower():
            return False
    return True


def search(query: str, chunks: list, idf: dict, k: int = 5, filtros: dict = None) -> list:
    """Recuperación: cita exacta primero, luego temático (TF-IDF)."""
    pool = [c for c in chunks if _passes(c, filtros)]

    out, seen = [], set()

    # 1) Cita exacta de artículo
    art = _detect_article(query)
    if art:
        for c in pool:
            if c["articulo"].split()[0] == art and c["id"] not in seen:
                seen.add(c["id"])
                out.append({**c, "score": 999.0, "match": "cita exacta"})

    # 2) Temático (TF-IDF + bonus de título)
    qterms = set(_toks(query))
    scored = []
    for c in pool:
        title_l = c["titulo"].lower()
        text_l = (c["titulo"] + " " + c["texto"]).lower()
        s = 0.0
        for t in qterms:
            if t in text_l:
                s += idf.get(t, 0.5)
            if t in title_l:
                s += 2.0
        if s > 0:
            scored.append({**c, "score": round(s, 2), "match": "temático"})
    scored.sort(key=lambda x: -x["score"])

    for c in scored:
        if c["id"] in seen:
            continue
        seen.add(c["id"])
        out.append(c)
        if len(out) >= k:
            break

    return out[:k]
