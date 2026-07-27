"""PDF → JSON chunks pipeline for Hornero RAG.

Reads a PDF, extracts all text, chunks by chapter/section (~300-500 words),
preserves structure (chapter, section, pages), and outputs kb_chunks.json.

Usage:
  python scripts/pdf_to_chunks.py /path/to/book.pdf --bib "Jasinski, El encanto del tanino, Prometeo 2023, ISBN 978-987-816-561-5" --tipo academico --category violencia-empresarial --id-prefix jasinski

Output: backend/kb_chunks.json (merged with existing chunks from kb_data.py)
"""

import json
import re
import sys
import argparse
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    print("ERROR: PyMuPDF not installed. Run: pip install pymupdf")
    sys.exit(1)


# ===== PDF text extraction =====

def extract_pdf_text(pdf_path: str) -> list:
    """Extract text from all pages of a PDF.

    Returns list of dicts: [{page_num, text, char_count}]
    """
    doc = fitz.open(pdf_path)
    pages = []
    for i in range(len(doc)):
        text = doc[i].get_text().strip()
        if text and len(text) > 50:  # Skip near-empty pages (covers, blank)
            pages.append({
                "page_num": i + 1,  # 1-indexed for readability
                "text": text,
                "char_count": len(text),
            })
    doc.close()
    return pages


# ===== Chapter/section detection =====

def detect_chapters(pages: list) -> list:
    """Detect chapter boundaries from page text.

    Looks for patterns like "Capítulo N", "Parte I/II/III", or section headers.
    Returns list of sections: [{title, start_page, end_page}]
    """
    chapter_patterns = [
        r'(?:Capítulo|Chapter)\s+(\d+)',     # "Capítulo 1"
        r'Parte\s+(I|II|III|IV|V|1|2|3)',     # "Parte I"
        r'Prólogo',
        r'Introducción',
        r'Agradecimientos',
        r'Conclusión',
        r'Epílogo',
    ]

    sections = []
    current_section = {"title": "Pre-texto", "start_page": 1, "end_page": None}

    for page in pages:
        text = page["text"]
        # Check first 500 chars for chapter headers
        header_area = text[:500]

        for pattern in chapter_patterns:
            match = re.search(pattern, header_area, re.IGNORECASE)
            if match:
                # Close previous section
                if current_section["end_page"] is None:
                    current_section["end_page"] = page["page_num"] - 1

                # Start new section
                # Try to extract the full title line
                title_line = ""
                for line in text.split('\n')[:10]:
                    line = line.strip()
                    if re.search(pattern, line, re.IGNORECASE):
                        title_line = line
                        break
                    if len(line) > 5 and len(line) < 200:
                        # Might be the subtitle after the chapter number
                        title_line = line
                        break

                if not title_line:
                    title_line = match.group(0)

                current_section = {
                    "title": title_line,
                    "start_page": page["page_num"],
                    "end_page": None,
                }
                sections.append(current_section)
                break

    # Close last section
    if pages:
        current_section["end_page"] = pages[-1]["page_num"]
    if not sections:
        # No chapters detected — treat whole book as one section
        sections = [{"title": "Libro completo", "start_page": 1, "end_page": len(pages) + 1}]

    return sections


# ===== Chunking =====

def chunk_section(pages: list, section: dict, max_words: int = 400) -> list:
    """Split a section's text into chunks of ~max_words.

    Each chunk preserves:
    - chapter/section title
    - page range
    - coherent text flow

    Strategy: split at paragraph boundaries (double newline) when chunk exceeds max_words.
    """
    # Collect text for this section's page range
    section_pages = [p for p in pages
                     if p["page_num"] >= section["start_page"]
                     and p["page_num"] <= section.get("end_page", 999999)]

    if not section_pages:
        return []

    full_text = "\n\n".join(p["text"] for p in section_pages)

    # Split into paragraphs
    paragraphs = [p.strip() for p in full_text.split('\n\n') if p.strip() and len(p.strip()) > 30]

    # Build chunks: accumulate paragraphs until max_words, then start new chunk
    chunks = []
    current_text = ""
    current_start_page = section_pages[0]["page_num"]
    current_end_page = section_pages[0]["page_num"]

    for para in paragraphs:
        para_words = len(para.split())

        if current_text and (len(current_text.split()) + para_words) > max_words:
            # Save current chunk
            chunks.append({
                "text": current_text.strip(),
                "start_page": current_start_page,
                "end_page": current_end_page,
                "chapter": section["title"],
            })
            # Start new chunk
            current_text = para
            current_start_page = current_end_page + 1  # Approximate
            current_end_page = current_end_page + 1
        else:
            current_text += "\n\n" + para
            current_end_page = section_pages[-1]["page_num"]  # Approximate

    # Save last chunk
    if current_text.strip():
        chunks.append({
            "text": current_text.strip(),
            "start_page": current_start_page,
            "end_page": current_end_page,
            "chapter": section["title"],
        })

    return chunks


# ===== Main pipeline =====

def process_pdf(pdf_path: str, bib_ref: str, tipo: str, category: str,
                id_prefix: str, tags: list = None, grade_access: str = "open") -> list:
    """Full pipeline: PDF → extract → detect chapters → chunk → structure for RAG.

    Returns list of KB_CHUNKS-compatible dicts.
    """
    # Step 1: Extract text
    pages = extract_pdf_text(pdf_path)
    print(f"Extracted {len(pages)} pages with text")

    # Step 2: Detect chapters/sections
    sections = detect_chapters(pages)
    print(f"Detected {len(sections)} sections/chapters:")
    for s in sections:
        print(f"  {s['title']} (p.{s['start_page']}-{s.get('end_page', '?')})")

    # Step 3: Chunk each section
    all_chunks = []
    chunk_index = 0

    for section in sections:
        section_chunks = chunk_section(pages, section, max_words=400)
        for sc in section_chunks:
            chunk_id = f"kb-{id_prefix}-{chunk_index}"
            chunk_index += 1

            # Skip very short chunks (< 50 words — likely headers/footers)
            if len(sc["text"].split()) < 50:
                continue

            # Extract excerpt for UI display (first 200 chars)
            excerpt = sc["text"][:200].strip()

            # Auto-detect additional tags from content
            auto_tags = extract_auto_tags(sc["text"])

            chunk = {
                "id": chunk_id,
                "tipo": tipo,
                "category": category,
                "tags": (tags or []) + auto_tags,
                "title": f"{section['title']} (p.{sc['start_page']}-{sc['end_page']}) — {bib_ref.split(',')[0]}",
                "text": sc["text"],
                "excerpt": excerpt,
                "sources": [f"{bib_ref}, pp. {sc['start_page']}-{sc['end_page']}"],
                "quotes": [],  # Auto quote extraction could be added later
                "grade_access": grade_access,
                "vigencia": "vigente",
                "book_ref": bib_ref,
                "chapter": sc["chapter"],
                "pages": f"{sc['start_page']}-{sc['end_page']}",
            }
            all_chunks.append(chunk)

    print(f"\nGenerated {len(all_chunks)} chunks")
    return all_chunks


def extract_auto_tags(text: str) -> list:
    """Extract relevant keywords from text for auto-tagging.

    Looks for names, places, key terms that would help keyword search.
    """
    # Common sindical/historical terms to check
    tag_candidates = [
        "La Forestal", "lockout", "huelga", "sindicato", "masacre", "tanino",
        "quebracho", "Villa Ana", "Villa Guillermina", "La Gallareta",
        "Tartagal", "Chaco", "Santa Fe", "Reconquista", "obrero", "obrajero",
        "comunismo", "anarquismo", "yrigoyenismo", "paritaria", "convenio",
        "fábrica", "empresa", "capital", "patronal", "represión", "policía",
        "guardia blanca", "expulsión", "depuración", "migración", "enclave",
        "monopolio", "trust", "imperialismo", "británico", "Forestal",
        # Key names from La Forestal history
        "Lafuente", "Vargas", "Lamazón", "Yofra",
        # General terms
        "derecho", "trabajo", "salario", "jornal", "condiciones",
    ]

    text_lower = text.lower()
    found = [tag for tag in tag_candidates if tag.lower() in text_lower]
    return found


def save_chunks_json(chunks: list, output_path: str):
    """Save chunks to JSON file."""
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(chunks)} chunks to {output_path}")


# ===== CLI =====

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PDF → RAG chunks pipeline")
    parser.add_argument("pdf_path", help="Path to PDF file")
    parser.add_argument("--bib", required=True, help="Bibliographic reference: 'Author, Title, Publisher Year, ISBN'")
    parser.add_argument("--tipo", default="academico", choices=["documento", "academico", "multimedia"])
    parser.add_argument("--category", default="violencia-empresarial")
    parser.add_argument("--id-prefix", default="doc", help="Prefix for chunk IDs: kb-{prefix}-0, kb-{prefix}-1...")
    parser.add_argument("--tags", nargs="*", default=[], help="Extra tags for all chunks")
    parser.add_argument("--grade", default="open", help="Minimum grade access: open|B.a|B.b|B.c|B.d")
    parser.add_argument("--output", default=None, help="Output JSON path (default: backend/kb_chunks.json)")

    args = parser.parse_args()

    # Default output path
    if not args.output:
        script_dir = Path(__file__).parent.parent  # backend/
        args.output = str(script_dir / "kb_chunks.json")

    # Process
    chunks = process_pdf(
        pdf_path=args.pdf_path,
        bib_ref=args.bib,
        tipo=args.tipo,
        category=args.category,
        id_prefix=args.id_prefix,
        tags=args.tags,
        grade_access=args.grade,
    )

    # Save
    save_chunks_json(chunks, args.output)
