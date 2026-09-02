#!/usr/bin/env python3
"""
Validador de .chunks.json para RAG Hornero.

Verifica que todos los chunks tengan los campos obligatorios
y reporta los que faltan. Previene KeyError en runtime.

Uso:
    python validate_chunks.py                    # valida todo
    python validate_chunks.py archivo.chunks.json  # valida uno
    python validate_chunks.py --fix               # agrega campos faltantes con defaults

Campos obligatorios: id, title, text, category, tipo, tags (list), sources (list)
Campos recomendados: tenant, grade_access
"""

import json
import sys
from pathlib import Path

REQUIRED_FIELDS = {
    "id": str,
    "title": str,
    "text": str,
    "category": str,
    "tipo": str,
    "tags": list,
    "sources": list,
}

RECOMMENDED_FIELDS = {
    "tenant": str,
    "grade_access": (int, type(None)),
}

DEFAULTS = {
    "tags": [],
    "sources": [],
    "tenant": "",
    "grade_access": None,
}


def validate_file(filepath: Path, fix: bool = False) -> dict:
    """Valida un archivo .chunks.json. Retorna dict con resultados."""
    result = {"file": str(filepath), "chunks": 0, "errors": [], "warnings": [], "fixed": 0}

    try:
        data = json.loads(filepath.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        result["errors"].append(f"JSON inválido: {e}")
        return result

    if not isinstance(data, list):
        result["errors"].append(f"Raíz no es una lista, es {type(data).__name__}")
        return result

    modified = False
    for i, chunk in enumerate(data):
        if not isinstance(chunk, dict):
            result["errors"].append(f"Chunk #{i} no es dict, es {type(chunk).__name__}")
            continue

        result["chunks"] += 1
        chunk_id = chunk.get("id", f"#{i}")

        # Check required fields
        for field, expected_type in REQUIRED_FIELDS.items():
            if field not in chunk:
                msg = f"Chunk {chunk_id}: falta campo obligatorio '{field}'"
                result["errors"].append(msg)
                if fix:
                    if field in DEFAULTS:
                        chunk[field] = DEFAULTS[field]
                        # Intentar derivar sources de otros campos
                        if field == "sources" and not chunk.get("sources"):
                            sources = []
                            for src_field in ["book_ref", "fuente", "author", "norma", "url"]:
                                if val := chunk.get(src_field):
                                    sources.append(val)
                            chunk[field] = sources
                        modified = True
                        result["fixed"] += 1
            elif not isinstance(chunk[field], expected_type):
                msg = f"Chunk {chunk_id}: '{field}' es {type(chunk[field]).__name__}, esperaba {expected_type.__name__}"
                result["errors"].append(msg)

        # Check recommended fields
        for field, expected_type in RECOMMENDED_FIELDS.items():
            if field not in chunk:
                msg = f"Chunk {chunk_id}: falta campo recomendado '{field}'"
                result["warnings"].append(msg)

    if fix and modified:
        filepath.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )

    return result


def main():
    fix = "--fix" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]

    if args:
        files = [Path(a) for a in args]
    else:
        project_dir = Path(__file__).parent
        search_dirs = [
            project_dir / "biblioteca" / "rag",
            project_dir / "backend" / "rag_chunks",
        ]
        files = []
        for d in search_dirs:
            if d.exists():
                files.extend(sorted(d.rglob("*.chunks.json")))
        # Deduplicar por nombre de archivo (biblioteca/rag y backend/rag_chunks son espejo)
        seen_names = set()
        unique_files = []
        for f in files:
            if f.name not in seen_names:
                seen_names.add(f.name)
                unique_files.append(f)
        files = unique_files

    if not files:
        print("No se encontraron archivos .chunks.json")
        sys.exit(0)

    total_chunks = 0
    total_errors = 0
    total_warnings = 0
    total_fixed = 0
    error_files = []

    for f in files:
        result = validate_file(f, fix=fix)
        total_chunks += result["chunks"]
        total_errors += len(result["errors"])
        total_warnings += len(result["warnings"])
        total_fixed += result["fixed"]

        if result["errors"]:
            error_files.append(f.name)
            print(f"\n❌ {f.name} — {result['chunks']} chunks, {len(result['errors'])} errores")
            for err in result["errors"][:10]:  # mostrar primeros 10
                print(f"   {err}")
            if len(result["errors"]) > 10:
                print(f"   ... y {len(result['errors']) - 10} más")
        elif result["warnings"]:
            print(f"⚠️  {f.name} — {result['chunks']} chunks, {len(result['warnings'])} warnings")

    print(f"\n{'='*60}")
    print(f"Total: {len(files)} archivos, {total_chunks} chunks")
    print(f"Errores: {total_errors} | Warnings: {total_warnings}")
    if fix:
        print(f"Campos agregados (--fix): {total_fixed}")

    if error_files:
        print(f"\nArchivos con errores:")
        for f in error_files:
            print(f"  - {f}")
        sys.exit(1)
    else:
        print("\n✅ Todos los chunks tienen campos obligatorios")
        sys.exit(0)


if __name__ == "__main__":
    main()
