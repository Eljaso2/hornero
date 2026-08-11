"""Migración de categorías RAG: tema → tipo de fuente.

Reemplaza las 10 categorías temáticas por 5 categorías de tipo de fuente:
- academico: libros, artículos, papers, efemérides
- prensa: discursos, notas de opinión, periódicos gremiales
- noticias: recortes de noticias archivados
- documentos: convenios, paritarias, CCT, SMVM, condiciones
- audiovisual: podcasts, videos, docuficción

El tema viejo se agrega como tag para no perder la granularidad.

Uso:
  python scripts/migrate_categories.py --dry-run   # Ver cambios sin guardar
  python scripts/migrate_categories.py              # Aplicar cambios
"""

import json
import sys
from pathlib import Path

# ===== Mapeo: categoría vieja → (nueva categoría, tag a agregar) =====

CATEGORY_MAP = {
    # Temáticas → académico
    "violencia-empresarial": ("academico", "violencia-empresarial"),
    "historia-obrera":       ("academico", "historia-obrera"),
    "efemeride":             ("academico", "efemeride"),
    "reforma":               ("academico", "reforma-laboral"),
    "referentes":            ("academico", "referentes"),
    # Temáticas → documentos
    "organizacion":          ("documentos", "organizacion"),
    "convenio":              ("documentos", "convenio"),
    "paritaria":             ("documentos", "paritaria"),
    "smvm":                  ("documentos", "smvm"),
    "condiciones":           ("documentos", "condiciones"),
    # Temáticas → prensa
    "prensa-sindical":       ("prensa", "prensa-sindical"),
    # Temáticas → audiovisual
    "multimedia":            ("audiovisual", "multimedia"),
}

# Tipo viejo → nueva categoría (para chunks que no tengan categoría en el map)
TIPO_MAP = {
    "academico":  "academico",
    "documento":  "documentos",
    "multimedia": "audiovisual",
}


def migrate_chunk(chunk: dict) -> dict:
    """Migrate a single chunk: change category, add topic tag."""
    old_category = chunk.get("category", "")
    mapping = CATEGORY_MAP.get(old_category)

    if mapping:
        new_category, topic_tag = mapping
    else:
        # Fallback: use tipo mapping
        old_tipo = chunk.get("tipo", "")
        new_category = TIPO_MAP.get(old_tipo, "academico")
        topic_tag = old_category  # Keep old category as tag

    # Add topic tag if not already present
    tags = chunk.get("tags", [])
    if topic_tag and topic_tag not in tags:
        tags = tags + [topic_tag]

    # Build new chunk
    new_chunk = {**chunk}
    new_chunk["category"] = new_category
    new_chunk["tags"] = tags

    return new_chunk


def main():
    dry_run = "--dry-run" in sys.argv

    backend_dir = Path(__file__).parent.parent
    kb_chunks_path = backend_dir / "kb_chunks.json"

    # 1. Migrate kb_chunks.json (PDF chunks)
    if kb_chunks_path.exists():
        with open(kb_chunks_path, "r", encoding="utf-8") as f:
            pdf_chunks = json.load(f)

        print(f"kb_chunks.json: {len(pdf_chunks)} PDF chunks")

        # Count before
        from collections import Counter
        before_cats = Counter(c.get("category", "?") for c in pdf_chunks)
        print(f"  Categorías antes: {dict(before_cats)}")

        # Migrate
        new_pdf_chunks = [migrate_chunk(c) for c in pdf_chunks]

        # Count after
        after_cats = Counter(c.get("category", "?") for c in new_pdf_chunks)
        print(f"  Categorías después: {dict(after_cats)}")

        # Verify tags were added
        tags_added = sum(1 for old, new in zip(pdf_chunks, new_pdf_chunks)
                        if len(new["tags"]) > len(old["tags"]))
        print(f"  Tags de tema agregados: {tags_added}")

        if not dry_run:
            with open(kb_chunks_path, "w", encoding="utf-8") as f:
                json.dump(new_pdf_chunks, f, ensure_ascii=False, indent=2)
            print(f"  ✅ Guardado kb_chunks.json")
        else:
            print(f"  🔍 DRY RUN — no se guardó")
    else:
        print(f"⚠️ No encontrado: {kb_chunks_path}")

    # 2. Show kb_data.py migration instructions
    print()
    print("=== kb_data.py (manual chunks) ===")
    print("Los chunks manuales de kb_data.py deben migrarse con Edit:")
    print("  - KB_CATEGORIES: reemplazar las 10 categorías por 5")
    print("  - KB_CATEGORY_META: actualizar labels e iconos")
    print("  - KB_CHUNKS: cambiar 'category' y agregar tags de tema")
    print()
    print("Mapeo de categorías:")
    for old, (new, tag) in sorted(CATEGORY_MAP.items()):
        print(f"  {old:30s} → {new:12s} (tag: +{tag})")


if __name__ == "__main__":
    main()
