"""Biblioteca de Hornero — store (SQLite, durable) + retrieval.

- Persistencia real (no efímera): SQLite con `tenant_id` y `capa` (multi-tenant).
- Recuperación: CITA EXACTA (art. N) + TF-IDF léxico.
- Hook de embeddings: `embeddings.embed()` — si hay proveedor configurado, se usa
  búsqueda semántica; si no, cae a TF-IDF (léxico). Ver embeddings.py.

Solo stdlib. Contrato de búsqueda igual al de PLAN-BIBLIOTECA-RAG.md §4.
"""
import os
import re
import math
import sqlite3
from collections import Counter
try:
    import numpy as np
except Exception:
    np = None

DB_PATH = os.path.join(os.path.dirname(__file__), "library.db")

# Backend: SQLite por defecto (local, sin infra). Si LIBRARY_DB_URL apunta a Postgres,
# usa Postgres (durable, sobrevive redeploys de Render) — mismo contrato de funciones.
DB_URL = os.getenv("LIBRARY_DB_URL", "").strip()
_PG = DB_URL.startswith("postgres")
if _PG:
    import psycopg
    from psycopg.rows import dict_row


def _ph(sql: str) -> str:
    """SQLite usa '?', Postgres usa '%s'. Todas nuestras '?' son placeholders."""
    return sql.replace("?", "%s") if _PG else sql

# ---------- Store ----------

_SCHEMA_COLS = """
    id TEXT PRIMARY KEY,
    tenant TEXT DEFAULT 'shared',
    capa TEXT DEFAULT 'general',
    tipo TEXT DEFAULT '',
    norma TEXT DEFAULT '',
    articulo TEXT DEFAULT '',
    vigencia TEXT DEFAULT 'vigente',
    titulo TEXT DEFAULT '',
    texto TEXT DEFAULT '',
    fuente TEXT DEFAULT '',
    updated_at {ts} DEFAULT CURRENT_TIMESTAMP,
    vec {blob}
"""


def _conn():
    if _PG:
        c = psycopg.connect(DB_URL, row_factory=dict_row)
        c.execute("CREATE TABLE IF NOT EXISTS chunks(" +
                  _SCHEMA_COLS.format(ts="TIMESTAMP", blob="BYTEA") + ")")
        c.execute("CREATE INDEX IF NOT EXISTS idx_tenant ON chunks(tenant)")
        c.execute("CREATE INDEX IF NOT EXISTS idx_norma ON chunks(norma)")
        c.commit()
        return c
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    c.execute("CREATE TABLE IF NOT EXISTS chunks(" +
              _SCHEMA_COLS.format(ts="TEXT", blob="BLOB") + ")")
    c.execute("CREATE INDEX IF NOT EXISTS idx_tenant ON chunks(tenant)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_norma ON chunks(norma)")
    return c


def upsert(chunks: list) -> int:
    c = _conn()
    n = 0
    for ch in chunks:
        c.execute(_ph("""
            INSERT INTO chunks(id,tenant,capa,tipo,norma,articulo,vigencia,titulo,texto,fuente)
            VALUES(?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET
                texto=excluded.texto, titulo=excluded.titulo, vigencia=excluded.vigencia,
                capa=excluded.capa, tenant=excluded.tenant, updated_at=CURRENT_TIMESTAMP
        """), (ch["id"], ch.get("tenant", "shared"), ch.get("capa", "general"),
              ch.get("tipo", ""), ch.get("norma", ""), ch.get("articulo", ""),
              ch.get("vigencia", "vigente"), ch.get("titulo", ""),
              ch.get("texto", ""), ch.get("fuente", "")))
        n += 1
    c.commit(); c.close()
    return n


def fetch(filtros: dict = None) -> list:
    """Trae chunks. Un tenant ve su colección ∪ 'shared'."""
    f = filtros or {}
    where, params = [], []
    tenant = f.get("tenant")
    if tenant:
        where.append("tenant IN (?, 'shared')"); params.append(tenant)
    for k in ("capa", "vigencia", "tipo", "norma"):
        v = f.get(k)
        if v not in (None, "", "*"):
            where.append(f"{k} = ?"); params.append(v)
    q = "SELECT * FROM chunks" + (" WHERE " + " AND ".join(where) if where else "")
    c = _conn()
    rows = c.execute(_ph(q), params).fetchall()
    c.close()
    return [dict(r) for r in rows]


def stats() -> dict:
    c = _conn()
    r = c.execute("SELECT COUNT(*) n, COUNT(DISTINCT norma) normas, COUNT(DISTINCT tenant) tenants FROM chunks").fetchone()
    by_norma = c.execute("SELECT norma, COUNT(*) n FROM chunks GROUP BY norma ORDER BY n DESC").fetchall()
    c.close()
    return {"total": r["n"], "normas": r["normas"], "tenants": r["tenants"],
            "por_norma": {row["norma"]: row["n"] for row in by_norma}}


def embed_index(batch: int = 100) -> int:
    """Precomputa y guarda embeddings de los chunks sin vector (columna vec)."""
    try:
        from embeddings import get_embedder
    except Exception:
        from library_service.embeddings import get_embedder  # type: ignore
    emb = get_embedder()
    if emb is None:
        return 0
    c = _conn()
    rows = c.execute("SELECT id, titulo, texto FROM chunks WHERE vec IS NULL").fetchall()
    n = 0
    for i in range(0, len(rows), batch):
        grp = rows[i:i + batch]
        texts = [(r["titulo"] + ". " + r["texto"])[:2000] for r in grp]
        vecs = emb(texts)
        for r, v in zip(grp, vecs):
            arr = np.asarray(v, dtype="float32")
            arr /= (np.linalg.norm(arr) + 1e-9)
            c.execute(_ph("UPDATE chunks SET vec=? WHERE id=?"), (arr.tobytes(), r["id"]))
            n += 1
        c.commit()
    c.close()
    return n


# ---------- Retrieval ----------

_STOP = set("el la los las un una unos unas de del en y o a que se no si es son con por "
            "para su sus al como mas más muy me te lo le les mi tu este esta ese esa".split())


def _toks(s: str) -> list:
    s = re.sub(r"[^a-záéíóúñü0-9 ]", " ", s.lower())
    return [t for t in s.split() if len(t) > 2 and t not in _STOP]


def _build_idf(chunks):
    n = len(chunks) or 1
    df = Counter()
    for c in chunks:
        for t in set(_toks(c["titulo"] + " " + c["texto"])):
            df[t] += 1
    return {t: math.log(n / (1 + d)) for t, d in df.items()}


def _detect_article(q):
    m = re.search(r"\b(?:art[íi]?culo?|art)\.?\s*(\d+)", q.lower())
    return m.group(1) if m else None


def search(query: str, k: int = 5, filtros: dict = None) -> list:
    """POST /library/search — cita exacta + semántico/léxico."""
    chunks = fetch(filtros)
    if not chunks:
        return []

    out, seen = [], set()

    # 1) Cita exacta de artículo
    art = _detect_article(query)
    if art:
        for c in chunks:
            if c["articulo"].split()[0:1] == [art] and c["id"] not in seen:
                seen.add(c["id"])
                out.append({**_public(c), "score": 999.0, "match": "cita exacta"})

    # 2) Semántico (si hay embeddings) o TF-IDF léxico
    try:
        from embeddings import get_embedder
    except Exception:
        from library_service.embeddings import get_embedder  # type: ignore
    embedder = get_embedder()

    has_vecs = any(c.get("vec") for c in chunks)
    if embedder is not None and has_vecs:
        scored = _semantic(query, chunks, embedder)
        mode = "semántico"
    else:
        # Sin embeddings: expandir la consulta con LLM (sinónimos legales) si hay token
        try:
            from expander import get_expander
        except Exception:
            from library_service.expander import get_expander  # type: ignore
        exp = get_expander()
        lq = exp(query) if exp else query
        scored = _lexical(lq, chunks)
        mode = "léxico+LLM" if exp else "léxico"

    for c in scored:
        if c["id"] in seen:
            continue
        seen.add(c["id"])
        out.append({**_public(c), "score": c["_score"], "match": mode})
        if len(out) >= k:
            break
    return out[:k]


def _lexical(query, chunks):
    idf = _build_idf(chunks)
    qterms = set(_toks(query))
    scored = []
    for c in chunks:
        title_l = c["titulo"].lower()
        text_l = (c["titulo"] + " " + c["texto"]).lower()
        s = 0.0
        for t in qterms:
            if t in text_l:
                s += idf.get(t, 0.5)
            if t in title_l:
                s += 2.0
        if s > 0:
            scored.append({**c, "_score": round(s, 2)})
    scored.sort(key=lambda x: -x["_score"])
    return scored


def _semantic(query, chunks, embedder):
    """Usa los vectores YA guardados (columna vec); embebe solo la consulta."""
    vecs, idx = [], []
    for i, c in enumerate(chunks):
        if c.get("vec"):
            vecs.append(np.frombuffer(c["vec"], dtype="float32"))
            idx.append(i)
    if not vecs:
        return _lexical(query, chunks)
    M = np.vstack(vecs)
    qv = np.asarray(embedder([query])[0], dtype="float32")
    qv /= (np.linalg.norm(qv) + 1e-9)
    sims = M @ qv
    order = sims.argsort()[::-1]
    return [{**chunks[idx[j]], "_score": round(float(sims[j]), 4)} for j in order]


def _public(c):
    return {kk: c[kk] for kk in ("id", "tipo", "norma", "articulo", "capa",
                                 "tenant", "vigencia", "titulo", "texto", "fuente")}
