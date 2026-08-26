#!/usr/bin/env python3
"""rechunk_monoliths.py — Re-fragment monolithic chunks into section-based chunks.

Reads .md source files, splits by ## headings, generates properly-sized chunks
(~3-5K chars each) with section titles, author info, and auto-generated tags.

Replaces the existing .chunks.json for each source.

Usage:
    # Dry run (preview only)
    python scripts/rechunk_monoliths.py --dry-run

    # Execute re-chunking
    python scripts/rechunk_monoliths.py

    # Re-chunk specific sources only
    python scripts/rechunk_monoliths.py --only ferreras barragan
"""

import json
import os
import re
import sys
from pathlib import Path
from collections import Counter

# ── Configuration ──────────────────────────────────────────────────────────

BACKEND_DIR = Path(__file__).parent.parent
RAG_DIR = BACKEND_DIR.parent / "biblioteca" / "rag"
INVESTIGACIONES_DIR = RAG_DIR / "investigaciones"

# Max chars per chunk — split longer sections at paragraph boundaries
MAX_CHUNK_CHARS = 5000
# Min chars for a chunk — merge very short sections with the next
MIN_CHUNK_CHARS = 500

# Sources to re-chunk (slug → directory name under investigaciones/)
MONOLITH_SOURCES = {
    "oit-barragan": "barragan-geografia-diferencial-derechos",
    "oit-caruso-maritimo": "caruso-legislando-aguas-profundas-maritimo",
    "oit-caruso-stagnaro": "caruso-stagnaro-introduccion-historia-oit",
    "oit-ferreras": "ferreras-trabajo-esclavo-forzado-brasil",
    "oit-herrera": "herrera-colaboraciones-transatlanticas-oit",
    "oit-queirolo": "queirolo-igual-salario-trabajo-femenino",
    "oit-ramacciotti": "ramacciotti-boletin-informativo-leyes-trabajo",
    "oit-scodeller": "scodeller-educar-derechos-laborales-oit",
    "oit-stagnaro": "stagnaro-delegacion-argentina-washington-1919",
    "kb-bisceglia": "bisceglia-disciplina-laboral-control-social",
    "kb-bertolo": "bertolo-negociacion-colectiva-1918-1935",
    "kb-anapios": "anapios-jubilaciones-1924-anarquismo",
}


# ── Tag generation ──────────────────────────────────────────────────────────

# Stopwords for tag generation
STOPWORDS = {
    "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "al",
    "en", "es", "se", "no", "si", "que", "por", "para", "con", "sin", "sobre",
    "entre", "como", "más", "muy", "hay", "pero", "este", "esta", "ese", "esa",
    "su", "sus", "ha", "han", "fue", "era", "son", "tiene", "tiene", "puede",
    "desde", "hasta", "también", "además", "aunque", "cuando", "donde", "quien",
    "cual", "cuyo", "otro", "otra", "otros", "otras", "todo", "toda", "todos",
    "todas", "cada", "mismo", "misma", "estos", "estas", "eso", "aquí", "allí",
    "y", "o", "a", "e", "u", "ni", "le", "les", "me", "te", "nos", "les",
    "lo", "ya", "no", "sí", "bien", "tan", "tanto", "mucho", "poco", "nada",
    "algo", "alguien", "nadie", "ninguno", "ninguna", "cualquier", "cualquiera",
    "primero", "segundo", "tercero", "último", "nuevo", "nueva", "viejo", "vieja",
    "gran", "grande", "pequeño", "pequeña", "mayor", "menor", "mejor", "peor",
    "parte", "forma", "vez", "año", "años", "día", "días", "caso", "casos",
    "modo", "manera", "tipo", "tipos", "trabajo", "obrero", "obrera",  # too generic
    "argentina", "argentino", "argentina",  # too generic for this corpus
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
}

# Domain-specific terms that should ALWAYS be tags
DOMAIN_TERMS = {
    "oitan", "oit", "forestal", "lockout", "masacre", "convenio", "cct",
    "paritaria", "huelga", "sindicato", "delegado", "coaccion", "forzado",
    "forzoso", "esclavo", "esclavitud", "indígena", "indígenas", "mita",
    "pongueaje", "yanaconazgo", "colonial", "chaco", "tanino", "quebracho",
    "enganchador", "obraje", "salario", "smvm", "jornada", "jubilación",
    "anarquismo", "anarquista", "socialismo", "peronismo", "peronista",
    "sindicalismo", "criminología", "disciplina", "represión", "represaliado",
    "marítimo", "naval", "stt", "convención", "ratificación", "delegación",
    "conferencia", "normativa", "legislación", "derecho", "constitucional",
    "negociación", "colectiva", "bargaining", "indigenista", "andinan",
    "pedagogía", "educación", "obrera", "formación", "boletín", "informe",
    "sanitario", "salud", "higiene", "seguridad", "accidente", "enfermedad",
    "femenino", "mujer", "mujeres", "género", "igualdad", "remuneración",
    "remuneración", "discriminación", "desigualdad", "derechos",
}


def generate_tags(title: str, text_sample: str, author: str, bib: str) -> list:
    """Generate tags from title + first paragraphs + author + bib reference.

    Strategy: extract domain terms, author surnames, and frequent meaningful words.
    """
    tags = set()

    # 1. Author surname (first word before comma)
    if author:
        surname = author.split(",")[0].strip().lower()
        if surname and len(surname) > 2:
            tags.add(surname)

    # 2. Domain terms from title and text
    combined = (title + " " + text_sample[:2000]).lower()
    # Remove punctuation
    clean = re.sub(r'[^\w\sáéíóúñü]', ' ', combined)
    words = clean.split()

    for w in words:
        w = w.strip()
        if w in DOMAIN_TERMS:
            tags.add(w)
        elif len(w) > 4 and w not in STOPWORDS:
            # Count frequency — only include if appears 2+ times
            pass  # checked below

    # 3. Frequent meaningful words (appear 2+ in sample)
    word_freq = Counter(w for w in words if len(w) > 4 and w not in STOPWORDS)
    for word, count in word_freq.most_common(15):
        if count >= 2 or word in DOMAIN_TERMS:
            tags.add(word)

    # 4. Specific keyword extraction from title
    title_lower = title.lower()
    specific_patterns = {
        "trabajo forzado": "forzado",
        "trabajo esclavo": "esclavitud",
        "indígenas y trabajo": "indígenas",
        "negociación colectiva": "negociación colectiva",
        "derecho laboral": "derecho laboral",
        "derechos laborales": "derechos laborales",
        "educación obrera": "educación obrera",
        "boletín informativo": "boletín",
        "jubilaciones": "jubilación",
        "disciplina laboral": "disciplina laboral",
        "control social": "control social",
        "conferencia marítima": "marítimo",
        "delegación argentina": "delegación",
        "igual salario": "igualdad salarial",
        "trabajo femenino": "trabajo femenino",
        "colaboraciones transatlánticas": "transatlántico",
        "indigenista andino": "indigenista",
    }
    for pattern, tag in specific_patterns.items():
        if pattern in title_lower:
            tags.add(tag)

    # Limit to 15 tags, prioritize domain terms
    domain_tags = tags & DOMAIN_TERMS
    other_tags = tags - DOMAIN_TERMS
    result = sorted(domain_tags) + sorted(other_tags)
    return result[:15]


# ── MD splitting ──────────────────────────────────────────────────────────

def split_md_by_headings(md_text: str, source_title: str) -> list:
    """Split markdown text by ## headings into sections.

    Returns list of {title, text} dicts.
    Handles multi-line headings (title wraps to next # line).
    """
    lines = md_text.split('\n')
    sections = []
    current_title = None
    current_lines = []

    # First pass: detect ## heading lines and build sections
    i = 0
    while i < len(lines):
        line = lines[i]

        # Check for ## heading (not # which is document title)
        if line.startswith('## ') and not line.startswith('### '):
            # Save previous section
            if current_lines:
                text = '\n'.join(current_lines).strip()
                if text:
                    sections.append({
                        'title': current_title or 'Preámbulo',
                        'text': text,
                    })

            # Start new section
            heading_text = line[3:].strip()
            # Check if next line is also ## (multi-line heading)
            if i + 1 < len(lines) and lines[i + 1].startswith('# ') and not lines[i + 1].startswith('## '):
                # This is a continuation of the heading (title wrapped)
                heading_text += ' ' + lines[i + 1].lstrip('# ').strip()
                i += 1

            current_title = heading_text
            current_lines = []
        elif line.startswith('# ') and not line.startswith('## '):
            # # heading = document title, skip (it's metadata, not content)
            # Unless it's within a section (some PDFs extract headings as #)
            if current_title is None:
                # Document title — don't start a section
                pass
            else:
                current_lines.append(line)
        elif line.startswith('### '):
            # Sub-heading: include in current section text
            current_lines.append(line)
        else:
            current_lines.append(line)

        i += 1

    # Save last section
    if current_lines:
        text = '\n'.join(current_lines).strip()
        if text:
            sections.append({
                'title': current_title or 'Preámbulo',
                'text': text,
            })

    # If no ## headings found, split by paragraphs at ~MAX_CHUNK_CHARS
    if not sections:
        sections = split_by_paragraphs(md_text, source_title)

    return sections


def split_by_paragraphs(text: str, fallback_title: str) -> list:
    """Fallback: split text into chunks at paragraph boundaries when no headings exist."""
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    sections = []
    current_text = []
    current_len = 0
    chunk_num = 1

    for para in paragraphs:
        if current_len + len(para) > MAX_CHUNK_CHARS and current_text:
            sections.append({
                'title': f"{fallback_title} ({chunk_num})",
                'text': '\n\n'.join(current_text),
            })
            chunk_num += 1
            current_text = []
            current_len = 0
        current_text.append(para)
        current_len += len(para)

    if current_text:
        sections.append({
            'title': f"{fallback_title} ({chunk_num})",
            'text': '\n\n'.join(current_text),
        })

    return sections


def split_oversized_section(section: dict, source_title: str, section_idx: int) -> list:
    """Split a section that exceeds MAX_CHUNK_CHARS at paragraph boundaries."""
    text = section['text']
    if len(text) <= MAX_CHUNK_CHARS:
        return [section]

    # Split at paragraph boundaries (double newline)
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    chunks = []
    current_text = []
    current_len = 0
    sub_idx = 1

    for para in paragraphs:
        if current_len + len(para) > MAX_CHUNK_CHARS and current_text:
            chunks.append({
                'title': f"{section['title']} ({sub_idx})",
                'text': '\n\n'.join(current_text),
            })
            sub_idx += 1
            current_text = []
            current_len = 0
        current_text.append(para)
        current_len += len(para)

    if current_text:
        if sub_idx == 1:
            # Only one chunk — keep original title
            chunks.append({
                'title': section['title'],
                'text': '\n\n'.join(current_text),
            })
        else:
            chunks.append({
                'title': f"{section['title']} ({sub_idx})",
                'text': '\n\n'.join(current_text),
            })

    return chunks


# ── Chunk building ──────────────────────────────────────────────────────────

def build_chunks(slug: str, dir_name: str, meta: dict, sections: list) -> list:
    """Build final chunk objects from sections with metadata from .meta.json."""
    id_prefix = meta.get('id_prefix', slug)
    bib = meta.get('bib', '')
    author = ''
    if bib:
        author = bib.split(',')[0].strip() if ',' in bib else bib.split('(')[0].strip()

    # Extract book_ref (compilation) if available
    book_ref = meta.get('compilation', '')
    pages = meta.get('pages', '')
    category = meta.get('category', 'investigaciones')
    # Map legacy categories
    if category == 'academico':
        category = 'investigaciones'

    chunks = []
    chunk_num = 0

    for section in sections:
        # Split oversized sections
        sub_sections = split_oversized_section(section, '', chunk_num)

        for sub in sub_sections:
            chunk_num += 1
            chunk_id = f"{id_prefix}-{chunk_num:02d}"

            # Build title: "Section title — Author, Source"
            section_title = sub['title']
            full_title = f"{section_title} — {author}" if author else section_title

            # Build text with section header for context
            chunk_text = sub['text'].strip()

            # Auto-generate tags
            tags = generate_tags(section_title, chunk_text[:3000], author, bib)

            # Estimate page range from chunk position
            # (rough: distribute pages across chunks proportionally)

            chunk = {
                "id": chunk_id,
                "tipo": "articulo",
                "category": category,
                "tenant": "shared",
                "tags": tags,
                "title": full_title,
                "text": chunk_text,
                "sources": [bib] if bib else [],
                "quotes": [],
                "grade_access": "open",
                "vigencia": "vigente",
            }

            # Add pages if available
            if pages:
                chunk["pages"] = pages

            # Add book_ref for compilation context
            if book_ref:
                chunk["book_ref"] = book_ref

            chunks.append(chunk)

    return chunks


# ── Main ───────────────────────────────────────────────────────────────────

def main():
    dry_run = "--dry-run" in sys.argv

    # Filter to specific sources if --only flag is used
    only_sources = None
    for i, arg in enumerate(sys.argv):
        if arg == "--only" and i + 1 < len(sys.argv):
            only_sources = sys.argv[i + 1].split(",")
            break

    if only_sources:
        sources = {k: v for k, v in MONOLITH_SOURCES.items() if k in only_sources}
        print(f"Filtering to {len(sources)} sources: {', '.join(sources.keys())}")
    else:
        sources = MONOLITH_SOURCES

    total_old = 0
    total_new = 0
    results = []

    for slug, dir_name in sorted(sources.items()):
        source_dir = INVESTIGACIONES_DIR / dir_name
        if not source_dir.is_dir():
            print(f"⚠ Directory not found: {source_dir}")
            continue

        # Find .md and .meta.json
        md_file = None
        meta_file = None
        chunks_file = None

        for f in source_dir.iterdir():
            if f.suffix == '.md' and not f.name.startswith('chunk_'):
                md_file = f
            if f.suffix == '.meta.json':
                meta_file = f
            if f.suffix == '.chunks.json':
                chunks_file = f

        if not md_file:
            print(f"⚠ No .md file found in {source_dir}")
            continue

        # Load metadata
        meta = {}
        if meta_file:
            with open(meta_file, 'r', encoding='utf-8') as f:
                meta = json.load(f)

        # Read markdown source
        with open(md_file, 'r', encoding='utf-8') as f:
            md_text = f.read()

        # Count old chunks
        old_chunks = []
        if chunks_file:
            with open(chunks_file, 'r', encoding='utf-8') as f:
                old_chunks = json.load(f)

        # Split by headings
        source_title = meta.get('bib', slug).split('(')[0].strip() if meta.get('bib') else slug
        sections = split_md_by_headings(md_text, source_title)

        # Build new chunks
        new_chunks = build_chunks(slug, dir_name, meta, sections)

        old_count = len(old_chunks)
        new_count = len(new_chunks)
        total_old += old_count
        total_new += new_count

        # Stats
        old_sizes = [len(c.get('text', '')) for c in old_chunks]
        new_sizes = [len(c.get('text', '')) for c in new_chunks]
        old_avg = sum(old_sizes) // len(old_sizes) if old_sizes else 0
        new_avg = sum(new_sizes) // len(new_sizes) if new_sizes else 0
        old_max = max(old_sizes) if old_sizes else 0
        new_max = max(new_sizes) if new_sizes else 0

        results.append({
            'slug': slug,
            'dir': dir_name,
            'old_count': old_count,
            'new_count': new_count,
            'old_avg': old_avg,
            'new_avg': new_avg,
            'old_max': old_max,
            'new_max': new_max,
            'chunks': new_chunks,
            'chunks_file': chunks_file,
        })

        status = f"{old_count} → {new_count} chunks | {old_avg//1000}K → {new_avg//1000}K avg | max {old_max//1000}K → {new_max//1000}K"
        print(f"  {slug:25s} | {status}")

    # Summary
    print(f"\n{'='*70}")
    print(f"RESUMEN: {total_old} → {total_new} chunks")
    print(f"{'='*70}")

    # Show sample of new chunks
    for r in results[:2]:
        print(f"\n--- Sample chunks for {r['slug']} ---")
        for c in r['chunks'][:4]:
            tags_str = ', '.join(c['tags'][:6])
            print(f"  {c['id']}: {c['title'][:65]}")
            print(f"    {len(c['text'])} chars | tags: [{tags_str}...]")

    if dry_run:
        print("\n🔍 DRY RUN — no se escribieron archivos")
        return

    # Write new .chunks.json files (backup old ones first)
    for r in results:
        chunks_file = r['chunks_file']
        if not chunks_file:
            # Create new chunks file
            chunks_file = INVESTIGACIONES_DIR / r['dir'] / f"{r['slug']}.chunks.json"

        # Backup old file
        if chunks_file and chunks_file.exists():
            backup = chunks_file.with_suffix('.chunks.json.bak')
            with open(chunks_file, 'r', encoding='utf-8') as f:
                old_data = f.read()
            with open(backup, 'w', encoding='utf-8') as f:
                f.write(old_data)
            print(f"  📦 Backup: {backup.name}")

        # Write new chunks
        with open(chunks_file, 'w', encoding='utf-8') as f:
            json.dump(r['chunks'], f, ensure_ascii=False, indent=2)
        print(f"  ✅ {chunks_file.name}: {len(r['chunks'])} chunks written")

    # Update meta.json with new chunk count
    for r in results:
        meta_file = INVESTIGACIONES_DIR / r['dir']
        for f in meta_file.iterdir():
            if f.suffix == '.meta.json':
                with open(f, 'r', encoding='utf-8') as fh:
                    meta = json.load(fh)
                meta['num_chunks'] = r['new_count']
                with open(f, 'w', encoding='utf-8') as fh:
                    json.dump(meta, fh, ensure_ascii=False, indent=2)
                print(f"  📝 Updated {f.name}: num_chunks={r['new_count']}")
                break

    print(f"\n✅ Re-fragmentación completa: {total_old} → {total_new} chunks")


if __name__ == "__main__":
    main()
