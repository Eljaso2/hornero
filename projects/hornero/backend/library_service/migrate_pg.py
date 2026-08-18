"""Migración de la Biblioteca: SQLite (library.db) → Postgres. Idempotente.

    LIBRARY_DB_URL=postgresql://localhost:5432/hornero python3 migrate_pg.py

Copia todos los chunks (incluido el vector si existiera). Se puede correr varias veces:
usa ON CONFLICT(id) DO UPDATE. No borra nada del origen SQLite.
"""
import os
import sqlite3

DB_URL = os.getenv("LIBRARY_DB_URL", "").strip()
assert DB_URL.startswith("postgres"), "Definí LIBRARY_DB_URL apuntando a Postgres."

import psycopg

HERE = os.path.dirname(__file__)
SQLITE = os.path.join(HERE, "library.db")

COLS = ["id", "tenant", "capa", "tipo", "norma", "articulo",
        "vigencia", "titulo", "texto", "fuente", "vec"]

DDL = """
CREATE TABLE IF NOT EXISTS chunks(
    id TEXT PRIMARY KEY, tenant TEXT DEFAULT 'shared', capa TEXT DEFAULT 'general',
    tipo TEXT DEFAULT '', norma TEXT DEFAULT '', articulo TEXT DEFAULT '',
    vigencia TEXT DEFAULT 'vigente', titulo TEXT DEFAULT '', texto TEXT DEFAULT '',
    fuente TEXT DEFAULT '', updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, vec BYTEA)
"""

UPSERT = f"""
INSERT INTO chunks({",".join(COLS)}) VALUES ({",".join(["%s"] * len(COLS))})
ON CONFLICT(id) DO UPDATE SET
  tenant=EXCLUDED.tenant, capa=EXCLUDED.capa, tipo=EXCLUDED.tipo, norma=EXCLUDED.norma,
  articulo=EXCLUDED.articulo, vigencia=EXCLUDED.vigencia, titulo=EXCLUDED.titulo,
  texto=EXCLUDED.texto, fuente=EXCLUDED.fuente, vec=EXCLUDED.vec, updated_at=CURRENT_TIMESTAMP
"""


def main():
    s = sqlite3.connect(SQLITE)
    s.row_factory = sqlite3.Row
    rows = s.execute(f"SELECT {','.join(COLS)} FROM chunks").fetchall()
    s.close()
    print(f"origen SQLite: {len(rows)} chunks")

    with psycopg.connect(DB_URL) as pg:
        pg.execute(DDL)
        pg.execute("CREATE INDEX IF NOT EXISTS idx_tenant ON chunks(tenant)")
        pg.execute("CREATE INDEX IF NOT EXISTS idx_norma ON chunks(norma)")
        n = 0
        for r in rows:
            vals = [r[c] for c in COLS]
            vec = vals[-1]
            vals[-1] = bytes(vec) if vec is not None else None
            pg.execute(UPSERT, vals)
            n += 1
        pg.commit()
        total = pg.execute("SELECT COUNT(*) FROM chunks").fetchone()[0]
    print(f"upsert a Postgres: {n} · total en destino: {total}")


if __name__ == "__main__":
    main()
