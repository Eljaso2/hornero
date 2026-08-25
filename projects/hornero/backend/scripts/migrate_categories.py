"""Migración de categorías RAG: tema → tipo de fuente.

Reemplaza las 10 categorías temáticas por 5 categorías de tipo de fuente:
- academico: libros, artículos, papers, efemérides
- prensa: discursos, notas de opinión, periódicos gremiales
- noticias: recortes de noticias archivados
- documentos: convenios, paritarias, CCT, SMVM, condiciones
- audiovisual: podcasts, videos, docuficción

El tema viejo se agrega como tag para no perder la granularidad.

Ahora escanea biblioteca/fuentes/**/*.chunks.json en vez del monolito.

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

    fuentes_dir = Path(__file__).parent.parent.parent / "biblioteca" / "fuentes"

    # 1. Migrate per-source .chunks.json files
    chunks_files = sorted(fuentes_dir.rglob("*.chunks.json"))
    if not chunks_files:
        print(f"No se encontraron .chunks.json en {fuentes_dir}")
    else:
        print(f"Encontrados {len(chunks_files)} archivos .chunks.json en {fuentes_dir}")
        total_chunks = 0
        total_migrated = 0

        for chunks_path in chunks_files:
            with open(chunks_path, "r", encoding="utf-8") as f:
                chunks = json.load(f)

            old_count = len(chunks)
            new_chunks = [migrate_chunk(c) for c in chunks]
            tags_added = sum(1 for old, new in zip(chunks, new_chunks)
                            if len(new["tags"]) > len(old["tags"]))
            total_chunks += old_count
            total_migrated += tags_added

            if not dry_run:
                with open(chunks_path, "w", encoding="utf-8") as f:
                    json.dump(new_chunks, f, ensure_ascii=False, indent=2)
                print(f"  ✅ {chunks_path.relative_to(fuentes_dir.parent)}: {old_count} chunks, {tags_added} tags agregados")
            else:
                print(f"  🔍 {chunks_path.relative_to(fuentes_dir.parent)}: {old_count} chunks, {tags_added} tags agregados (DRY RUN)")

        print(f"\nTotal: {total_chunks} chunks procesados, {total_migrated} tags de tema agregados")

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
