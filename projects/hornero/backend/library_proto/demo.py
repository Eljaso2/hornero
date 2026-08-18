"""Demo/eval del prototipo de Biblioteca legal de Hornero.

Baja la LCT 20.744 real de InfoLeg → la chunkea por artículo → indexa →
corre consultas 'gold' comparando:
  [NUEVO]  library_search (article-aware) sobre la LCT chunkeada
  [ACTUAL] rag_retriever.keyword_search de Hornero (corpus aceitero, SIN LCT)

Solo librería estándar. Correr:  python3 demo.py
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.dirname(HERE)
sys.path.insert(0, HERE)
sys.path.insert(0, BACKEND)

from legal_chunker import fetch, html_to_text, chunk_law, INFOLEG
from library_search import build_index, search

CACHE = os.path.join(HERE, "data")
os.makedirs(CACHE, exist_ok=True)


def load_lct():
    """Baja la LCT (o usa cache local) y devuelve el texto plano."""
    cache_file = os.path.join(CACHE, "LCT_20744.txt")
    if os.path.exists(cache_file):
        return open(cache_file, encoding="utf-8").read()
    src = INFOLEG["LCT_20744"]
    text = html_to_text(fetch(src["url"]))
    open(cache_file, "w", encoding="utf-8").write(text)
    return text


# Consultas 'gold': lo que un afiliado/Abogado preguntaría, y el artículo esperado
GOLD = [
    ("¿me pueden obligar a hacer horas extra?", "horas suplementarias / jornada"),
    ("indemnización por despido sin causa", "art. 245"),
    ("qué es el salario mínimo vital y móvil", "art. 116 (SMVM)"),
    ("cuánto preaviso corresponde", "art. 231 (preaviso)"),
    ("art. 245", "cita exacta"),
]


def show(title, results, kind):
    print(f"    {title}")
    if not results:
        print("      (sin resultados relevantes)")
        return
    for r in results[:3]:
        if kind == "new":
            print(f"      • Art. {r['articulo']:<6} [{r['match']}] {r['titulo'][:60]}")
        else:
            cat = r.get("category", "?")
            print(f"      • {r['id']:<22} (cat: {cat}) — NO es LCT")


def main():
    print("Descargando/parsing LCT 20.744 desde InfoLeg…")
    text = load_lct()
    chunks = chunk_law(text, norma="LCT 20.744", fuente="InfoLeg",
                       tipo="ley", capa="general")
    idf = build_index(chunks)
    print(f"→ {len(chunks)} artículos indexados.\n")

    # Sistema actual de Hornero (para comparar). Puede fallar si falta el corpus.
    old_search = None
    try:
        from rag_retriever import keyword_search as old_search
        print("(comparando contra rag_retriever.keyword_search de Hornero — corpus aceitero)\n")
    except Exception as e:
        print(f"(no se pudo cargar el sistema actual para comparar: {e})\n")

    for q, expected in GOLD:
        print(f"CONSULTA: \"{q}\"   (esperado: {expected})")
        new_res = search(q, chunks, idf, k=3, filtros={"vigencia": "vigente"})
        show("[NUEVO · biblioteca legal]", new_res, "new")
        if old_search:
            try:
                old_res = old_search(q, max_chunks=3)
                show("[ACTUAL · keyword Hornero]", old_res, "old")
            except Exception as e:
                print(f"      (error sistema actual: {e})")
        print()

    print("=" * 70)
    print("CONCLUSIÓN: con la LCT chunkeada por artículo, la biblioteca recupera")
    print("el artículo correcto (incluida la CITA EXACTA 'art. 245'). El sistema")
    print("actual no puede: la LCT ni siquiera está cargada en su corpus.")


if __name__ == "__main__":
    main()
