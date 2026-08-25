#!/usr/bin/env python3
"""PDF → Markdown pipeline for Hornero RAG.

Extracts text locally with PyMuPDF (no API calls), does smart Markdown
formatting using font-size heuristics, and splits output into chunks
that never exceed the API request body limit (6 MB).

Usage:
  # Basic: extract full text as Markdown
  python3 pdf_to_md.py /path/to/book.pdf

  # With metadata for RAG
  python3 pdf_to_md.py /path/to/book.pdf \
    --bib "Autor, Título, Editorial Año" \
    --category academico --id-prefix jasinski

  # Compilación with Registro structure
  python3 pdf_to_md.py /path/to/compilacion.pdf --mode registros

  # Custom chunk size (for very large PDFs)
  python3 pdf_to_md.py /path/to/book.pdf --chunk-size 30000

Output:
  - {output_dir}/{slug}.md          — Full Markdown file
  - {output_dir}/{slug}.chunks/     — Chunk files if MD > chunk_size
                                       (chunk_001.md, chunk_002.md, ...)
  - {output_dir}/{slug}.meta.json   — Metadata for RAG ingestion
  - {output_dir}/{slug}.chunks.json — Chunk index (paths + sizes)

After running this script, use Claude to:
  1. Review each chunk_*.md and clean up formatting
  2. Run pdf_to_chunks.py for RAG ingestion
"""

import json
import os
import re
import sys
import argparse
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    print("ERROR: PyMuPDF not installed. Run: pip3 install pymupdf")
    sys.exit(1)


# ── Configuration ──

# API limit: 6,291,456 bytes. We stay well under with generous margin.
# Each chunk file targets this many characters (~bytes for Latin text).
DEFAULT_CHUNK_SIZE = 40_000  # ~40KB per chunk, ~150 chunks for a 600-page book

# Font-size thresholds for heading detection (relative to median body text)
HEADING1_SCALE = 1.6   # ≥160% of body → # H1
HEADING2_SCALE = 1.3   # ≥130% of body → ## H2
HEADING3_SCALE = 1.1   # ≥110% of body → ### H3

# Minimum chars for a page to be considered non-blank
MIN_PAGE_CHARS = 10


# ── Text extraction with font analysis ──

def extract_pages(pdf_path: str) -> list:
    """Extract text from all pages with font-size information.

    Returns list of dicts: [{page_num, blocks: [{text, sizes, is_bold, y}]}]
    Each block is a contiguous span of same-font text (PyMuPDF 'line').
    """
    doc = fitz.open(pdf_path)
    pages = []

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        blocks = []

        # Get structured text with font info
        text_dict = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)

        for block in text_dict.get("blocks", []):
            if block.get("type") != 0:  # Skip image blocks
                continue

            for line in block.get("lines", []):
                line_text = ""
                line_sizes = []
                line_bold = False
                line_y = block.get("bbox", [0, 0, 0, 0])[1]  # top Y

                for span in line.get("spans", []):
                    text = span.get("text", "").strip()
                    if not text:
                        continue
                    size = span.get("size", 12)
                    flags = span.get("flags", 0)
                    is_bold = bool(flags & 2**4)  # bit 4 = bold

                    line_text += " " + text if line_text else text
                    line_sizes.append(size)
                    if is_bold:
                        line_bold = True

                if line_text:
                    blocks.append({
                        "text": line_text,
                        "sizes": line_sizes,
                        "is_bold": line_bold,
                        "y": line_y,
                    })

        if blocks:
            total_chars = sum(len(b["text"]) for b in blocks)
            if total_chars >= MIN_PAGE_CHARS:
                pages.append({
                    "page_num": page_idx + 1,
                    "blocks": blocks,
                })

    doc.close()
    return pages


def compute_body_size(pages: list) -> float:
    """Compute the median font size across all pages (the 'body text' size)."""
    all_sizes = []
    for page in pages:
        for block in page["blocks"]:
            all_sizes.extend(block["sizes"])

    if not all_sizes:
        return 12.0  # fallback

    all_sizes.sort()
    mid = len(all_sizes) // 2
    return all_sizes[mid]


# ── Markdown conversion ──

def pages_to_markdown(pages: list, body_size: float = None) -> str:
    """Convert extracted pages to Markdown using font-size heuristics.

    Headings are detected by relative font size:
      - ≥160% of body → # H1
      - ≥130% of body → ## H2
      - ≥110% of body + bold → ### H3
    Everything else → paragraph text.
    """
    if body_size is None:
        body_size = compute_body_size(pages)

    md_lines = []
    prev_was_heading = False

    for page in pages:
        page_num = page["page_num"]

        # Add page marker (HTML comment, invisible in rendered MD)
        md_lines.append(f"\n<!-- página {page_num} -->\n")

        for block in page["blocks"]:
            text = block["text"]
            avg_size = sum(block["sizes"]) / len(block["sizes"]) if block["sizes"] else body_size
            scale = avg_size / body_size if body_size > 0 else 1.0
            is_bold = block["is_bold"]

            # Skip page numbers (standalone small numbers)
            if re.match(r'^\d{1,4}$', text.strip()) and len(text.strip()) <= 4:
                continue

            # Skip very short lines that look like headers/footers
            if len(text.strip()) < 3:
                continue

            # Heading detection
            if scale >= HEADING1_SCALE:
                md_lines.append(f"\n# {text.strip()}\n")
                prev_was_heading = True
            elif scale >= HEADING2_SCALE:
                md_lines.append(f"\n## {text.strip()}\n")
                prev_was_heading = True
            elif scale >= HEADING3_SCALE and is_bold:
                md_lines.append(f"\n### {text.strip()}\n")
                prev_was_heading = True
            elif is_bold and len(text.strip()) < 100:
                # Short bold lines → likely sub-headings
                md_lines.append(f"\n**{text.strip()}**\n")
                prev_was_heading = True
            else:
                # Regular paragraph text
                # Add blank line before paragraph if previous was also paragraph
                if not prev_was_heading:
                    md_lines.append("")  # paragraph break
                md_lines.append(text.strip())
                prev_was_heading = False

    # Clean up excessive blank lines
    md = "\n".join(md_lines)
    md = re.sub(r'\n{4,}', '\n\n\n', md)  # max 3 consecutive newlines
    md = md.strip()

    return md


def enhance_registros(md: str) -> str:
    """Post-process Markdown for compilaciones with 'Registro N.º' structure.

    Ensures each Registro gets an H2 heading.
    """
    # Pattern: "Registro N.º X" or "Registro N.o X" → ## heading
    md = re.sub(
        r'(?m)^(Registro\s+N\.?\s*[ºo]\s*\d+)',
        r'## \1',
        md
    )
    return md


# ── Chunking ──

def chunk_markdown(md: str, max_chars: int = DEFAULT_CHUNK_SIZE) -> list:
    """Split Markdown into chunks that respect section boundaries.

    Strategy:
      1. Split at ## headings first (natural document sections)
      2. If a section is still too large, split at ### headings
      3. If still too large, split at paragraph boundaries
      4. Never split mid-paragraph

    Returns list of strings (chunks).
    """
    # First try: split at ## headings
    sections = re.split(r'(?=^## )', md, flags=re.MULTILINE)
    sections = [s for s in sections if s.strip()]

    # Check if any section exceeds max_chars
    needs_further_split = any(len(s) > max_chars for s in sections)

    if not needs_further_split:
        return merge_small_sections(sections, max_chars)

    # Second try: split oversized sections at ### headings
    refined = []
    for section in sections:
        if len(section) <= max_chars:
            refined.append(section)
        else:
            sub_sections = re.split(r'(?=^### )', section, flags=re.MULTILINE)
            sub_sections = [s for s in sub_sections if s.strip()]
            refined.extend(sub_sections)

    # Check again
    needs_further_split = any(len(s) > max_chars for s in refined)

    if not needs_further_split:
        return merge_small_sections(refined, max_chars)

    # Third try: split oversized sections at paragraph boundaries
    final = []
    for section in refined:
        if len(section) <= max_chars:
            final.append(section)
        else:
            paragraphs = section.split('\n\n')
            current_chunk = ""
            for para in paragraphs:
                if not para.strip():
                    continue
                if len(current_chunk) + len(para) + 2 > max_chars and current_chunk:
                    final.append(current_chunk.strip())
                    current_chunk = para
                else:
                    current_chunk += "\n\n" + para if current_chunk else para
            if current_chunk.strip():
                final.append(current_chunk.strip())

    return merge_small_sections(final, max_chars)


def merge_small_sections(sections: list, max_chars: int) -> list:
    """Merge adjacent small sections to reduce chunk count.

    Keeps chunks under max_chars while minimizing the number of files.
    """
    if not sections:
        return []

    merged = []
    current = sections[0]

    for section in sections[1:]:
        if len(current) + len(section) + 2 <= max_chars:
            # Check if we'd merge across an H1 boundary (don't)
            if section.startswith('# ') and not section.startswith('## '):
                merged.append(current.strip())
                current = section
            else:
                current += "\n\n" + section
        else:
            merged.append(current.strip())
            current = section

    if current.strip():
        merged.append(current.strip())

    return merged


# ── Output ──

def slugify(text: str) -> str:
    """Convert text to filesystem-safe slug."""
    text = text.lower()
    text = re.sub(r'[áàäâ]', 'a', text)
    text = re.sub(r'[éèëê]', 'e', text)
    text = re.sub(r'[íìïî]', 'i', text)
    text = re.sub(r'[óòöô]', 'o', text)
    text = re.sub(r'[úùüû]', 'u', text)
    text = re.sub(r'[ñ]', 'n', text)
    text = re.sub(r'[^a-z0-9]+', '-', text)
    text = text.strip('-')
    return text[:60]


def save_outputs(md: str, chunks: list, meta: dict, output_dir: str, slug: str):
    """Save Markdown file, chunk files, and metadata."""

    os.makedirs(output_dir, exist_ok=True)

    # 1. Full Markdown
    md_path = os.path.join(output_dir, f"{slug}.md")
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(md)
    md_size = os.path.getsize(md_path)
    print(f"✅ Markdown completo: {md_path} ({md_size:,} bytes)")

    # 2. Chunk files (only if we have multiple chunks)
    chunk_index = []
    chunks_dir = os.path.join(output_dir, f"{slug}.chunks")

    if len(chunks) > 1:
        os.makedirs(chunks_dir, exist_ok=True)

        for i, chunk in enumerate(chunks, 1):
            chunk_path = os.path.join(chunks_dir, f"chunk_{i:03d}.md")
            with open(chunk_path, 'w', encoding='utf-8') as f:
                f.write(chunk)
            chunk_size = os.path.getsize(chunk_path)
            chunk_index.append({
                "file": chunk_path,
                "bytes": chunk_size,
                "chars": len(chunk),
            })

        print(f"✅ {len(chunks)} chunks en: {chunks_dir}/")
        for ci in chunk_index:
            print(f"   chunk_{chunk_index.index(ci)+1:03d}.md  {ci['bytes']:>8,} bytes")
    else:
        chunk_index.append({
            "file": md_path,
            "bytes": md_size,
            "chars": len(md),
        })

    # 3. Metadata
    meta_path = os.path.join(output_dir, f"{slug}.meta.json")
    meta["slug"] = slug
    meta["md_path"] = md_path
    meta["md_bytes"] = md_size
    meta["num_chunks"] = len(chunks)
    meta["chunks_dir"] = chunks_dir if len(chunks) > 1 else None
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print(f"✅ Metadata: {meta_path}")

    # 4. Chunk index
    index_path = os.path.join(output_dir, f"{slug}.chunks.json")
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(chunk_index, f, ensure_ascii=False, indent=2)
    print(f"✅ Chunk index: {index_path}")

    return md_path, chunk_index


# ── CLI ──

def main():
    parser = argparse.ArgumentParser(description="PDF → Markdown pipeline for Hornero RAG")
    parser.add_argument("pdf_path", help="Path to PDF file")
    parser.add_argument("--bib", default="", help="Bibliographic reference: 'Author, Title, Publisher Year'")
    parser.add_argument("--category", default="academico",
                        choices=["academico", "prensa", "noticias", "documentos", "audiovisual"])
    parser.add_argument("--id-prefix", default="", help="Prefix for RAG chunk IDs")
    parser.add_argument("--mode", default="chapters", choices=["chapters", "registros"],
                        help="Detection mode: chapters or registros (Registro N.º structure)")
    parser.add_argument("--chunk-size", type=int, default=DEFAULT_CHUNK_SIZE,
                        help=f"Max chars per chunk file (default: {DEFAULT_CHUNK_SIZE:,})")
    parser.add_argument("--output-dir", default=None,
                        help="Output directory (default: same as PDF)")

    args = parser.parse_args()

    pdf_path = os.path.abspath(args.pdf_path)
    if not os.path.exists(pdf_path):
        print(f"ERROR: PDF not found: {pdf_path}")
        sys.exit(1)

    pdf_name = Path(pdf_path).stem
    slug = slugify(args.bib.split(',')[0] if args.bib else pdf_name)

    output_dir = args.output_dir or str(Path(pdf_path).parent)

    print(f"📖 PDF: {pdf_path}")
    print(f"📝 Ref: {args.bib or '(sin referencia bibliográfica)'}")
    print(f"🏷️  Categoría: {args.category} | Modo: {args.mode}")
    print(f"📦 Chunk size: {args.chunk_size:,} chars")
    print()

    # Step 1: Extract text with font info
    print("⏳ Extrayendo texto con PyMuPDF (local, sin API)...")
    pages = extract_pages(pdf_path)
    total_chars = sum(len(b["text"]) for p in pages for b in p["blocks"])
    print(f"✅ {len(pages)} páginas | {total_chars:,} caracteres extraídos")

    # Step 2: Compute body font size
    body_size = compute_body_size(pages)
    print(f"📐 Tamaño de cuerpo base: {body_size:.1f}pt")

    # Step 3: Convert to Markdown
    print("⏳ Convirtiendo a Markdown...")
    md = pages_to_markdown(pages, body_size)

    if args.mode == "registros":
        md = enhance_registros(md)

    print(f"✅ Markdown generado: {len(md):,} caracteres")

    # Step 4: Chunk if needed
    chunks = chunk_markdown(md, max_chars=args.chunk_size)
    print(f"✅ {len(chunks)} chunk(s) generados")

    # Step 5: Build metadata
    meta = {
        "pdf_path": pdf_path,
        "pdf_name": pdf_name,
        "bib": args.bib,
        "category": args.category,
        "id_prefix": args.id_prefix,
        "mode": args.mode,
        "pages": len(pages),
        "total_chars": total_chars,
        "md_chars": len(md),
        "num_chunks": len(chunks),
    }

    # Step 6: Save outputs
    print()
    md_path, chunk_index = save_outputs(md, chunks, meta, output_dir, slug)

    # Step 7: Print next steps
    print()
    print("=" * 60)
    print("PRÓXIMOS PASOS:")
    print("=" * 60)
    if len(chunks) > 1:
        print(f"""
1. Revisar y limpiar cada chunk con Claude:
   for chunk in {output_dir}/{slug}.chunks/chunk_*.md; do
       echo "Procesando: $chunk"
   done
   (Cada chunk pesa < {args.chunk_size:,} chars — nunca supera el límite API)

2. Una vez limpios, reconstruir el MD completo:
   cat {output_dir}/{slug}.chunks/chunk_*.md > {output_dir}/{slug}.md

3. Ingestar al RAG:
   python3 backend/scripts/pdf_to_chunks.py {pdf_path} \\
     --bib "{args.bib}" --category {args.category} \\
     --id-prefix {args.id_prefix or slug} --append
""")
    else:
        print(f"""
1. Revisar y limpiar el Markdown: {md_path}

2. Ingestar al RAG:
   python3 backend/scripts/pdf_to_chunks.py {pdf_path} \\
     --bib "{args.bib}" --category {args.category} \\
     --id-prefix {args.id_prefix or slug} --append
""")


if __name__ == "__main__":
    main()
