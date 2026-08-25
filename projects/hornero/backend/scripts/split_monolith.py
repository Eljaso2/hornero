#!/usr/bin/env python3
"""
split_monolith.py — Split backend/kb_chunks.json into per-source .chunks.json files
inside docs/fuentes/ (later to be renamed biblioteca/fuentes/).

Usage:
    python split_monolith.py --dry-run    # preview without writing
    python split_monolith.py              # write files

Each .chunks.json file is placed next to its source material (PDF/MD)
inside the appropriate subdirectory of docs/fuentes/.
"""

import json
import os
import sys
from pathlib import Path

# ── Configuration ──────────────────────────────────────────────────────────

BACKEND_DIR = Path(__file__).parent.parent
MONOLITH_PATH = BACKEND_DIR / "kb_chunks.json"
FUENTES_DIR = BACKEND_DIR.parent / "docs" / "fuentes"

# Mapping: chunk ID prefix → (relative directory under fuentes/, output filename)
# For prefixes with wildcards, use a function matcher instead.
CHUNK_MAP = {
    # Responsabilidad empresarial (2 tomos)
    "kb-respemp-t1": ("investigaciones/responsabilidad-empresarial-lesa-humanidad", "responsabilidad-empresarial-t1.chunks.json"),
    "kb-respemp-t2": ("investigaciones/responsabilidad-empresarial-lesa-humanidad", "responsabilidad-empresarial-t2.chunks.json"),
    # Perón 1943-1944
    "kb-peron-43": ("fuentes-primarias/peron-1943-1944", "peron-1943-1944.chunks.json"),
    # Íñigo Carrera
    "kb-inigo-chaco": ("investigaciones/inigo-carrera-violencia-potencia-economica", "inigo-carrera-violencia-potencia-economica.chunks.json"),
    "kb-inigo-superpob": ("investigaciones/inigo-carrera-superpoblacion-relativa", "inigo-carrera-superpoblacion-relativa.chunks.json"),
    "kb-inigo-huelga": ("investigaciones/inigo-carrera-huelga-general", "inigo-carrera-huelga-general.chunks.json"),
    # Jasinski - La Forestal
    "kb-jasinski": ("investigaciones/jasinski-encanto-del-tanino", "jasinski-encanto-del-tanino.chunks.json"),
    # Manual salud y seguridad laboral
    "kb-manual-ssl": ("leyes-laborales/manual-salud-seguridad-laboral", "manual-salud-seguridad-laboral.chunks.json"),
    # Lorca
    "kb-lorca-01": ("investigaciones/fuentes-lorca-gestion-delegado", "fuentes-lorca-gestion-delegado.chunks.json"),
    # Vogelmann
    "kb-vogelmann-01": ("investigaciones/vogelmann-espacio-trabajo", "vogelmann-espacio-trabajo.chunks.json"),
    # Paritarias aceiteras
    "kb-par": ("convenios-colectivos/paritarias-aceiteras", "paritarias-aceiteras.chunks.json"),
    # CCT 420/05
    "kb-cct420": ("convenios-colectivos/CCT-420-05-aceiteros", "cct-420-05-aceiteros.chunks.json"),
    # Prensa aceitera
    "kb-prensa-n5": ("prensa-sindical/peron-aceitero", "el-trabajador-aceitero.chunks.json"),
    "kb-prensa-n7": ("prensa-sindical/peron-aceitero", "el-trabajador-aceitero.chunks.json"),
}

# SIPREBA / prensa-sindical chunks (all merge into one file from same pipeline)
SIPREBA_PREFIXES = [
    "prensa-cct124",
    "prensa-ley12908",
    "prensa-cct301",
    "prensa-cct541",
    "prensa-dec13839",
    "prensa-guia",
    "prensa-escala",
    "prensa-ley12908",
]
SIPREBA_TARGET = ("prensa-sindical/SIPREBA-guia-delegado", "sipreba-guia-delegado.chunks.json")

# Leyes laborales: sub-split by law number extracted from ID
# ID format: kb-ley-ley-NNNNN-N  →  map NNNNN to directory
LEY_NUMBER_MAP = {
    "20744": ("leyes-laborales/LCT-20.744", "ley-20744-lct.chunks.json"),
    "23546": ("leyes-laborales/negociacion-colectiva-23.546", "ley-23546-negociacion-colectiva.chunks.json"),
    "23551": ("leyes-laborales/asociaciones-sindicales-23.551", "ley-23551-asociaciones-sindicales.chunks.json"),
    "24013": ("leyes-laborales/empleo-24.013", "ley-24013-empleo.chunks.json"),
    "24557": ("leyes-laborales/riesgos-trabajo-24.557", "ley-24557-riesgos-trabajo.chunks.json"),
    "19587": ("leyes-laborales/higiene-seguridad-19.587", "ley-19587-higiene-seguridad.chunks.json"),
    "14250": ("leyes-laborales/convenciones-colectivas-14.250", "ley-14250-convenciones-colectivas.chunks.json"),
}
LEY_FALLBACK = ("leyes-laborales", "leyes-generales.chunks.json")


# ── Routing logic ──────────────────────────────────────────────────────────

def route_chunk(chunk_id: str) -> tuple:
    """Given a chunk ID, return (relative_dir, filename) for its .chunks.json file."""

    # SIPREBA / prensa chunks
    for prefix in SIPREBA_PREFIXES:
        if chunk_id.startswith(prefix):
            return SIPREBA_TARGET

    # Laws: extract number from kb-ley-ley-NNNNN-...
    if chunk_id.startswith("kb-ley-ley-"):
        # Extract the law number (digits after kb-ley-ley-)
        remainder = chunk_id[len("kb-ley-ley-"):]
        law_num = ""
        for ch in remainder:
            if ch.isdigit():
                law_num += ch
            else:
                break
        if law_num in LEY_NUMBER_MAP:
            return LEY_NUMBER_MAP[law_num]
        else:
            print(f"  ⚠ Ley sin mapeo: {chunk_id} (número {law_num}) → fallback")
            return LEY_FALLBACK

    # Check exact prefix matches (longest prefix first)
    for prefix in sorted(CHUNK_MAP.keys(), key=len, reverse=True):
        if chunk_id.startswith(prefix):
            return CHUNK_MAP[prefix]

    # Unknown
    print(f"  ⚠ Chunk sin mapeo: {chunk_id}")
    return None


# ── Main ───────────────────────────────────────────────────────────────────

def main():
    dry_run = "--dry-run" in sys.argv

    if not MONOLITH_PATH.exists():
        print(f"ERROR: {MONOLITH_PATH} not found")
        sys.exit(1)

    print(f"Leyendo {MONOLITH_PATH}...")
    with open(MONOLITH_PATH, "r", encoding="utf-8") as f:
        all_chunks = json.load(f)
    print(f"Total chunks: {len(all_chunks)}")

    # Group chunks by target file
    groups = {}  # (dir, filename) -> [chunks]
    unassigned = []

    for chunk in all_chunks:
        chunk_id = chunk.get("id", "")
        target = route_chunk(chunk_id)
        if target is None:
            unassigned.append(chunk)
        else:
            key = target
            if key not in groups:
                groups[key] = []
            groups[key].append(chunk)

    if unassigned:
        print(f"\n⚠ {len(unassigned)} chunks sin asignar:")
        for c in unassigned[:5]:
            print(f"  {c['id']}")
        if len(unassigned) > 5:
            print(f"  ... y {len(unassigned) - 5} más")

    # Print summary
    print(f"\n{'='*60}")
    print(f"Archivos a crear: {len(groups)}")
    print(f"{'='*60}")
    total_assigned = 0
    for (rel_dir, filename), chunks in sorted(groups.items()):
        full_path = FUENTES_DIR / rel_dir / filename
        print(f"  {rel_dir}/{filename}: {len(chunks)} chunks")
        total_assigned += len(chunks)
    print(f"\nTotal asignados: {total_assigned} / {len(all_chunks)}")

    if dry_run:
        print("\n🔍 DRY RUN — no se escribieron archivos")
        return

    # Write files
    print(f"\nEscribiendo archivos en {FUENTES_DIR}...")
    for (rel_dir, filename), chunks in sorted(groups.items()):
        target_dir = FUENTES_DIR / rel_dir
        target_dir.mkdir(parents=True, exist_ok=True)
        target_path = target_dir / filename

        with open(target_path, "w", encoding="utf-8") as f:
            json.dump(chunks, f, ensure_ascii=False, indent=2)

        print(f"  ✅ {rel_dir}/{filename} ({len(chunks)} chunks, {target_path.stat().st_size // 1024} KB)")

    print(f"\n✅ Migración completa: {total_assigned} chunks en {len(groups)} archivos")


if __name__ == "__main__":
    main()
