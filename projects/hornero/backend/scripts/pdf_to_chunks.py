"""PDF → JSON chunks pipeline for Hornero RAG.

Reads a PDF, extracts all text, chunks by chapter/section (~300-500 words),
preserves structure (chapter, section, pages), and outputs a per-source
.chunks.json file next to the PDF in biblioteca/fuentes/.

Categorías por tipo de fuente:
  academico   — Libros, artículos, papers, efemérides de Historia Obrera
  prensa      — Prensa oficial de cada gremio: periódicos, comunicados, volantes
  noticias    — Noticias de actualidad y clipping: prensa comercial, agencias
  documentos  — Convenios, paritarias, CCT, SMVM, condiciones
  audiovisual — Podcasts, videos, docuficción, ilustraciones

Usage:
  # Libro académico
  python scripts/pdf_to_chunks.py /path/to/book.pdf \
    --bib "Jasinski, El encanto del tanino, Prometeo 2023" \
    --category academico --id-prefix jasinski

  # Artículo/paper
  python scripts/pdf_to_chunks.py /path/to/paper.pdf \
    --bib "Autor, Título, Año" \
    --category academico --id-prefix articulo-01 --append

  # Periódico oficial del gremio
  python scripts/pdf_to_chunks.py /path/to/periodico.pdf \
    --bib "El Trabajador Aceitero y Desmotador, N° XX, Mes Año" \
    --category prensa --id-prefix prensa-01 --append

  # Noticia de prensa comercial (archivada del clipping)
  python scripts/pdf_to_chunks.py /path/to/noticia.pdf \
    --bib "Sonido Gremial, 2 jul 2026" \
    --category noticias --id-prefix noticia-01 --append

  # Convenio/documento sindical
  python scripts/pdf_to_chunks.py /path/to/convenio.pdf \
    --bib "CCT 420/05" \
    --category documentos --id-prefix doc-01 --append

Output: <pdf_stem>.chunks.json in the same directory as the PDF
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

def extract_pdf_text(pdf_path: str, min_chars: int = 10) -> list:
    """Extract text from all pages of a PDF.

    Returns list of dicts: [{page_num, text, char_count}]

    min_chars: skip pages with fewer chars (likely blank/covers).
    Keep low (10) so section headers on otherwise-blank pages are captured.
    """
    doc = fitz.open(pdf_path)
    pages = []
    for i in range(len(doc)):
        text = doc[i].get_text().strip()
        if text and len(text) >= min_chars:
            pages.append({
                "page_num": i + 1,  # 1-indexed for readability
                "text": text,
                "char_count": len(text),
            })
    doc.close()
    return pages


# ===== Chapter/section detection =====

def detect_from_toc(toc_path: str, total_pages: int) -> list:
    """Load a manual table of contents from a JSON file.

    Format: [{title: str, start_page: int, author?: str, pub?: str}]
    Returns sections list compatible with detect_chapters/detect_registros.
    """
    with open(toc_path, 'r', encoding='utf-8') as f:
        toc = json.load(f)

    sections = []
    for i, entry in enumerate(toc):
        start = entry["start_page"]
        end = toc[i + 1]["start_page"] - 1 if i + 1 < len(toc) else total_pages
        sections.append({
            "title": entry["title"],
            "start_page": start,
            "end_page": end,
            "doc_type": entry.get("pub", ""),   # reuse doc_type for publication origin
            "doc_date": entry.get("author", ""),  # reuse doc_date for author info
            "registro_num": i + 1,
        })
    return sections


def detect_chapters(pages: list) -> list:
    """Detect chapter boundaries from page text.

    Looks for patterns like "Capítulo N", "Parte I/II/III", or section headers.
    Captures multi-line titles (chapter number + subtitle on next lines).
    Returns list of sections: [{title, start_page, end_page}]
    """
    chapter_patterns = [
        (r'(?:Capítulo|Capítulo|Chapter)\s+(\d+)', True),   # "Capítulo 5" (capture subtitle)
        (r'Parte\s+(I|II|III|IV|V|1|2|3|4|5)', True),       # "Parte I" (capture subtitle)
        (r'Prólogo', False),
        (r'Introducción', False),
        (r'Agradecimientos', False),
        (r'Conclusión', False),
        (r'Epílogo', False),
    ]

    sections = []
    current_section = {"title": "Pre-texto", "start_page": 1, "end_page": None}

    for page in pages:
        text = page["text"]
        # Search entire page text for chapter headers (not just first N chars)
        # because chapter titles can appear mid-page after front matter

        for pattern, capture_subtitle in chapter_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # Filter out cross-references: "ver Capítulo 5" is NOT a header.
                # A real chapter header appears at the start of a line.
                line_start = text.rfind('\n', 0, match.start()) + 1
                prefix = text[line_start:match.start()].strip()
                if len(prefix) > 15:
                    continue  # Cross-reference within a paragraph
                # Close previous section
                if current_section["end_page"] is None:
                    current_section["end_page"] = page["page_num"] - 1

                # Build title: match text + following subtitle lines
                title_parts = [match.group(0)]
                if capture_subtitle:
                    after = text[match.end():]
                    for line in after.split('\n')[:6]:
                        line = line.strip()
                        if not line or len(line) < 3:
                            continue
                        # Stop at lines that look like body text (long paragraphs)
                        if len(line) > 150:
                            break
                        # Stop at page numbers or footnote markers
                        if re.match(r'^\d{1,3}\.?$', line):
                            continue
                        # This line is part of the subtitle
                        title_parts.append(line)
                        # Stop after collecting 3 subtitle lines max
                        if len(title_parts) >= 4:
                            break

                title = ': '.join(title_parts) if len(title_parts) > 1 else title_parts[0]

                current_section = {
                    "title": title,
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


def detect_registros(pages: list, content_start_page: int = 0) -> list:
    """Detect 'Registro N.º/Registro N.o' entries across ALL page text.

    Compilaciones like the BCN Perón series use 'Registro N.o X' as document
    boundaries, with structured metadata on the following lines:
      - Título descriptivo (lugar / ocasión)
      - (Tipo de documento) — Discurso, Documento, Mensaje radial, etc.
      - Fecha — Lunes 20 de diciembre, etc.

    content_start_page: if > 0, any Registro on a page before this is treated as
    index/TOC and skipped. Set to the first page of real content (1-indexed).
    If 0, auto-detect: use heuristic based on first repeated Registro number.

    Returns list of sections with rich metadata:
      [{title, start_page, end_page, doc_type, doc_date, registro_num}]
    """
    # Pattern matches both "Registro N.º 1" and "Registro N.o 1"
    registro_pat = re.compile(r'Registro\s+N\.?\s*[ºo]\s*(\d+)', re.IGNORECASE)

    # Pattern for document type in parentheses: (Discurso), (Documento), (Mensaje radial), etc.
    doc_type_pat = re.compile(r'\(([^)]+)\)')

    # Auto-detect content_start_page if not given:
    # Find the page where "Registro N.o 1" appears that is NOT in the index.
    # Heuristic: the first page where a Registro N.o appears AND the same page
    # or nearby pages have substantial text (not just short index references).
    if content_start_page <= 0:
        # Collect all Registro 1 occurrences
        reg1_pages = []
        for page in pages:
            for match in registro_pat.finditer(page["text"]):
                if int(match.group(1)) == 1:
                    reg1_pages.append(page["page_num"])
        if len(reg1_pages) >= 2:
            # Second occurrence is the real content; first is the index
            content_start_page = reg1_pages[1] if reg1_pages[1] > reg1_pages[0] else reg1_pages[0]
            print(f"Auto-detected content start page: {content_start_page}")
        elif reg1_pages:
            content_start_page = reg1_pages[0]

    # Build set of index pages: all pages before content_start_page
    index_pages = set()
    if content_start_page > 0:
        for page in pages:
            if page["page_num"] < content_start_page:
                index_pages.add(page["page_num"])

    sections = []
    current_section = None
    seen_registro_nums = set()

    for page in pages:
        text = page["text"]
        page_num = page["page_num"]

        # Skip index pages entirely
        if page_num in index_pages:
            continue

        # Search the ENTIRE page text for Registro markers (not just header area)
        for match in registro_pat.finditer(text):
            reg_num = int(match.group(1))

            # Filter out cross-references: "ver registro N.o 77" is NOT a section header.
            # A real Registro header appears at the start of a line (or after just page number).
            # Check if there's significant text before the match on the same line.
            line_start = text.rfind('\n', 0, match.start()) + 1
            prefix = text[line_start:match.start()].strip()
            # Allow: empty, just a page number, or very short prefix (< 15 chars)
            if len(prefix) > 15:
                continue  # Cross-reference within a paragraph, not a header

            # Skip if this Registro number was already seen (first occurrence = real content)
            if reg_num in seen_registro_nums:
                continue
            seen_registro_nums.add(reg_num)

            # Close previous section
            if current_section is not None:
                current_section["end_page"] = page_num - 1

            # Extract metadata from lines following the Registro marker.
            # Structure in BCN compilaciones:
            #   Registro N.o X
            #   Título descriptivo [nota al pie]
            #   (Tipo de documento)
            #   Fecha [nota al pie]
            #   Texto del documento...
            after = text[match.end():]
            next_lines = after.split('\n')[:15]  # up to 15 lines after "Registro N.o X"

            title_line = ""
            doc_type = ""
            doc_date = ""

            for line in next_lines:
                line = line.strip()
                if not line or len(line) < 3:
                    continue

                # Skip standalone footnote numbers (e.g., "52", "130 / 131", "187", "70 / 71")
                if re.match(r'^\d+\s*[/]\s*\d+\.?$', line) or re.match(r'^\d{1,3}\.?$', line):
                    continue

                # Check for document type: (Discurso), (Documento), (Mensaje radial), etc.
                type_match = doc_type_pat.search(line)
                if type_match and not doc_type:
                    doc_type = type_match.group(1).strip()
                    # If the whole line is just the type, skip to next
                    if line.strip() == f"({doc_type})":
                        continue

                # Check if this looks like a date (before checking title)
                date_words = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes',
                              'sábado', 'domingo', 'enero', 'febrero', 'marzo',
                              'abril', 'mayo', 'junio', 'julio', 'agosto',
                              'septiembre', 'octubre', 'noviembre', 'diciembre']
                is_date_line = any(w in line.lower() for w in date_words)

                if not title_line and not is_date_line and len(line) > 5:
                    # First substantial non-date line = title
                    # Strip trailing footnote numbers from title
                    title_line = re.sub(r'\s*\d{1,3}(/?\d*)\s*$', '', line).strip()
                    continue

                if title_line and is_date_line and not doc_date:
                    # Date line — strip trailing footnote numbers
                    doc_date = re.sub(r'\s*\d{1,3}\s*$', '', line).strip()
                    break  # Got everything we need

            # Build composite title
            if title_line:
                composite = f"Registro {reg_num}: {title_line}"
            else:
                composite = f"Registro {reg_num}"
            if doc_type:
                composite += f" ({doc_type})"
            if doc_date:
                composite += f" — {doc_date}"

            current_section = {
                "title": composite,
                "start_page": page_num,
                "end_page": None,
                "doc_type": doc_type,
                "doc_date": doc_date,
                "registro_num": reg_num,
            }
            sections.append(current_section)

    # Close last section
    if current_section is not None:
        current_section["end_page"] = pages[-1]["page_num"]

    # If there are pages before the first Registro (preface, prologues, etc.),
    # add them as a "Pre-texto" section so they don't get lost
    if sections and sections[0]["start_page"] > content_start_page:
        pre_text_start = content_start_page if content_start_page > 0 else 1
        pre_section = {
            "title": "Pre-texto (Prefacio, Prólogos)",
            "start_page": pre_text_start,
            "end_page": sections[0]["start_page"] - 1,
            "doc_type": "articulo",
            "doc_date": "",
            "registro_num": 0,
        }
        sections.insert(0, pre_section)

    # If no Registros found, fall back to treating whole book as one section
    if not sections:
        sections = [{"title": "Libro completo", "start_page": 1,
                     "end_page": pages[-1]["page_num"] if pages else 1,
                     "doc_type": "", "doc_date": "", "registro_num": 0}]

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
                id_prefix: str, tags: list = None, grade_access: str = "open",
                mode: str = "chapters", toc_path: str = None,
                content_start: int = 0) -> list:
    """Full pipeline: PDF → extract → detect sections → chunk → structure for RAG.

    Modes:
      chapters  — detect Capítulo/Parte/Prólogo boundaries (default)
      registros — detect Registro N.º/Registro N.o boundaries with rich metadata
                  (for BCN-style compilations like Perón discursos)
      toc       — use manual table of contents from --toc JSON file

    Returns list of KB_CHUNKS-compatible dicts.
    """
    # Step 1: Extract text
    pages = extract_pdf_text(pdf_path)
    print(f"Extracted {len(pages)} pages with text")

    # Step 2: Detect chapters/sections
    if toc_path:
        sections = detect_from_toc(toc_path, pages[-1]["page_num"] if pages else 1)
        mode = "toc"
    elif mode == "registros":
        sections = detect_registros(pages, content_start_page=content_start)
    else:
        sections = detect_chapters(pages)
    print(f"Detected {len(sections)} sections/chapters:")
    for s in sections[:20]:  # Show first 20
        extra = ""
        if s.get("doc_type"):
            extra += f" [{s['doc_type']}]"
        if s.get("doc_date"):
            extra += f" {s['doc_date']}"
        print(f"  {s['title']}{extra} (p.{s['start_page']}-{s.get('end_page', '?')})")
    if len(sections) > 20:
        print(f"  ... and {len(sections) - 20} more")

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

            # Build title with rich metadata for registros/toc mode
            if mode == "registros" and section.get("registro_num"):
                title = sc["chapter"]  # Already has "Registro N: título (tipo) — fecha"
            elif mode == "toc" and section.get("registro_num"):
                title = sc["chapter"]
                # doc_type holds pub, doc_date holds author
                if section.get("doc_date"):
                    title += f" — {section['doc_date']}"
            else:
                title = f"{section['title']} (p.{sc['start_page']}-{sc['end_page']}) — {bib_ref.split(',')[0]}"

            chunk = {
                "id": chunk_id,
                "tipo": tipo,
                "category": category,
                "tags": (tags or []) + auto_tags,
                "title": title,
                "text": sc["text"],
                "excerpt": excerpt,
                "sources": [f"{bib_ref}, pp. {sc['start_page']}-{sc['end_page']}"],
                "quotes": [],
                "grade_access": grade_access,
                "vigencia": "vigente",
                "book_ref": bib_ref,
                "chapter": sc["chapter"],
                "pages": f"{sc['start_page']}-{sc['end_page']}",
            }

            # Add registro-specific metadata for RAG queries like "cuándo dijo Perón X"
            if mode == "registros" and section.get("registro_num"):
                chunk["doc_type"] = section.get("doc_type", "")
                chunk["doc_date"] = section.get("doc_date", "")
                chunk["registro_num"] = section["registro_num"]

            # Add toc-specific metadata (author, publication origin)
            if mode == "toc" and section.get("registro_num"):
                chunk["author"] = section.get("doc_date", "")  # doc_date reused for author
                chunk["pub_origin"] = section.get("doc_type", "")  # doc_type reused for pub
                chunk["article_num"] = section["registro_num"]

            all_chunks.append(chunk)

    print(f"\nGenerated {len(all_chunks)} chunks")
    return all_chunks


def extract_auto_tags(text: str) -> list:
    """Extract relevant keywords from text for auto-tagging.

    Uses three layers:
    1. Simple keyword matching (legacy tag_candidates)
    2. NER_ENTITY_LIST — regex patterns for organizations, institutions, concepts
    3. NER_PERSON_LIST — full names of historical figures

    Tags are added when the entity appears in the chunk text, preventing
    the retrieval gap where content exists but isn't findable (e.g., FST, CGT,
    Bentos were in the text but had no tags → retrieval missed them).
    """
    # ===== Layer 1: Simple keyword matching (preserved from legacy) =====
    tag_candidates = [
        "La Forestal", "lockout", "huelga", "sindicato", "masacre", "tanino",
        "quebracho", "Villa Ana", "Villa Guillermina", "La Gallareta",
        "Tartagal", "Chaco", "Santa Fe", "Reconquista", "obrero", "obrajero",
        "comunismo", "anarquismo", "yrigoyenismo", "paritaria", "convenio",
        "fábrica", "empresa", "capital", "patronal", "represión", "policía",
        "guardia blanca", "expulsión", "depuración", "migración", "enclave",
        "monopolio", "trust", "imperialismo", "británico", "Forestal",
        "derecho", "trabajo", "salario", "jornal", "condiciones",
        "masacre", "genocidio", "etnocidio", "pueblo originario",
        "comunidad", "territorio", "despojo", "concesión",
        "archaeologica", "patrimonio", "memoria", "verdad", "justicia",
        "reparación", "impunidad", "juicio", "testimonio",
        "comunicado", "volante", "editorial", "asamblea",
        "Federación Aceitera", "F.T.C.I.O.D", "FOEIAP",
        "El Trabajador Aceitero", "aceitero", "desmotador",
        "CIARA", "CIAVEC", "CARBIO",
    ]
    text_lower = text.lower()
    found = [tag for tag in tag_candidates if tag.lower() in text_lower]

    # ===== Layer 2: NER — organizations, institutions, concepts =====
    # Format: (regex_pattern, tag_to_add)
    # When pattern matches text, tag is added to chunk.
    NER_ENTITY_LIST = [
        # Centrales obreras
        (r'\bCGT\b', 'CGT'),
        (r'\bFORA\b', 'FORA'),
        (r'\bFACA\b', 'FACA'),
        (r'\bCOASI\b', 'COASI'),
        (r'\bCGGMA\b', 'CGGMA'),
        (r'\bCPCN\b', 'CPCN'),
        (r'\bUPCN\b', 'UPCN'),
        (r'\bMPIDS\b', 'MPIDS'),
        (r'\bATLAS\b', 'ATLAS'),
        (r'\bCTAL\b', 'CTAL'),
        (r'\bFSM\b', 'FSM'),
        (r'\bORIT\b', 'ORIT'),
        (r'\bCIOSL\b', 'CIOSL'),
        (r'\bFOIT\b', 'FOIT'),
        (r'\bAFL-?CIO\b', 'AFL-CIO'),
        (r'\bFST\b', 'FST'),
        (r'\bFOTIA\b', 'FOTIA'),
        (r'\bCGTA\b', 'CGTA'),
        (r'Federación Santafesina', 'Federación-Santafesina-del-Trabajo'),
        (r'federación provincial', 'federación-provincial'),
        # Sindicatos específicos
        (r'Unión Ferroviaria|Union Ferroviaria', 'Unión-Ferroviaria'),
        (r'La Fraternidad', 'La-Fraternidad'),
        (r'\bUOM\b', 'UOM'),
        (r'Federación.{0,15}Carne|Federacion.{0,15}Carne', 'Federación-de-la-Carne'),
        (r'FOGRA|Federación Gráfica', 'FOGRA'),
        (r'\bSOMISA\b', 'SOMISA'),
        (r'Unión Obrera Local|\bUOL\b', 'UOL'),
        # Organismos estatales
        (r'Departamento Nacional del Trabajo|\bDNT\b', 'DNT'),
        (r'Secretar[aí]a de Trabajo', 'Secretaría-de-Trabajo'),
        (r'Ministerio de Trabajo', 'Ministerio-de-Trabajo'),
        (r'Ley de Asociaciones Profesionales', 'Ley-Asociaciones-Profesionales'),
        # Conceptos sindicales
        (r'cuerpo[s]? de delegados', 'cuerpo-de-delegados'),
        (r'comisi[oó]n interna', 'comisión-interna'),
        (r'comisi[oó]n de huelga', 'comisión-de-huelga'),
        (r'personer[aí]a gremial', 'personería-gremial'),
        (r'sindicato[s]? aut[oó]nomos?', 'sindicato-autónomo'),
        # Huelgas específicas
        (r'huelga ferroviaria', 'huelga-ferroviaria'),
        (r'huelga mar[ií]tima', 'huelga-marítima'),
        (r'huelga metal[uú]rgica', 'huelga-metalúrgica'),
        (r'Marcha de la Paz', 'Marcha-de-la-Paz'),
        # Lugares
        (r'\bRosario\b', 'Rosario'),
    ]

    # ===== Layer 3: NER — historical figures =====
    # Format: (regex_pattern, tag_to_add)
    NER_PERSON_LIST = [
        # La Forestal / Norte Santa Fe (Jasinski)
        (r'Luis Bentos', 'Luis-Bentos'),
        (r'Rogelio Lamaz[oó]n', 'Rogelio-Lamazón'),
        (r'Samuel Abecasis', 'Samuel-Abecasis'),
        (r'Jos[eé] Bernab[eé] Vargas', 'José-Bernabé-Vargas'),
        (r'Ram[oó]n Ruber', 'Ramón-Ruber'),
        (r'Guillermo Romero', 'Guillermo-Romero'),
        (r'Te[oó]filo Lafuente', 'Teófilo-Lafuente'),
        (r'Manuel Almir[oó]n', 'Manuel-Almirón'),
        (r'Domingo Colomina', 'Domingo-Colomina'),
        (r'Andr[eé]s Selkis', 'Andrés-Selkis'),
        (r'Fabio Silvestre', 'Fabio-Silvestre'),
        (r'Antonio Aguilar', 'Antonio-Aguilar'),
        (r'Rogelio Gauto', 'Rogelio-Gauto'),
        # Dirigentes obreros (Contreras 2017)
        (r'Jos[eé] Espejo', 'José-Espejo'),
        (r'Dante Viel', 'Dante-Viel'),
        (r'Rubens [IÍ]scaro', 'Rubens-Íscaro'),
        (r'Carlos [IÍ]mizcoz', 'Carlos-Ímizcoz'),
        (r'Vicente Marischi', 'Vicente-Marischi'),
        (r'Eduardo Barainca', 'Eduardo-Barainca'),
        (r'Jes[uú]s Mira', 'Jesús-Mira'),
        (r'Jos[eé] Peter', 'José-Peter'),
        (r'Irma Othar', 'Irma-Othar'),
        (r'Jos[eé] Grunfeld', 'José-Grunfeld'),
        (r'Luis Danussi', 'Luis-Danussi'),
        (r'Jacinto Cimazo', 'Jacinto-Cimazo'),
        (r'Jes[uú]s Fern[aá]ndez', 'Jesús-Fernández'),
        (r'Alfredo Fidanza', 'Alfredo-Fidanza'),
        (r'C[aá]ndido Gregorio', 'Cándido-Gregorio'),
        (r'Ernesto Morier', 'Ernesto-Morier'),
        (r'Alfredo Ferreira', 'Alfredo-Ferreira'),
        (r'Luis Gay', 'Luis-Gay'),
        (r'Cipriano Reyes', 'Cipriano-Reyes'),
        (r'Juan F\. Castro', 'Juan-Castro'),
        # Internacionales
        (r'Vicente Lombardo Toledano', 'Lombardo-Toledano'),
        (r'Serafino Romualdi', 'Serafino-Romualdi'),
        (r'Rodolfo Puiggr[oó]s', 'Rodolfo-Puiggrós'),
        # Peronismo
        (r'Juan Per[oó]n', 'Juan-Perón'),
        (r'Eva Per[oó]n', 'Eva-Perón'),
        # Historiadores
        (r'Gino Germani', 'Gino-Germani'),
        (r'Louise Doyon', 'Louise-Doyon'),
        (r'Juan Carlos Torre', 'Juan-Carlos-Torre'),
        (r'Hugo del Campo', 'Hugo-del-Campo'),
        (r'Omar Acha', 'Omar-Acha'),
        (r'Hern[aá]n Camarero', 'Hernán-Camarero'),
        (r'Diego Ceruso', 'Diego-Ceruso'),
        (r'Agust[ií]n Nieto', 'Agustín-Nieto'),
        (r'Marcos Schiavi', 'Marcos-Schiavi'),
        (r'Gustavo Contreras', 'Gustavo-Contreras'),
        (r'Alejandro Jasinski', 'Alejandro-Jasinski'),
        # Movimiento obrero post-peronismo
        (r'Agust[ií]n Tosco', 'Agustín-Tosco'),
        (r'Jos[eé] Ignacio Rucci', 'José-Ignacio-Rucci'),
        (r'Raymundo Ongaro', 'Raymundo-Ongaro'),
        (r'Daniel Yofra', 'Daniel-Yofra'),
        # Última dictadura
        (r'Emilio Massera', 'Emilio-Massera'),
        # Single-word surnames (unique enough for our domain)
        (r'\bLafuente\b', 'Lafuente'),
        (r'\bBentos\b', 'Bentos'),
        (r'\bGauto\b', 'Gauto'),
        (r'\bCotta\b', 'Cotta'),
        (r'\bLamaz[oó]n\b', 'Lamazón'),
    ]

    # ===== Apply NER layers =====
    found_set = set(found)  # deduplicate

    for pattern, tag in NER_ENTITY_LIST + NER_PERSON_LIST:
        if re.search(pattern, text, re.IGNORECASE):
            found_set.add(tag)

    return list(found_set)


def save_chunks_json(chunks: list, output_path: str, append: bool = False, id_prefix: str = ""):
    """Save chunks to JSON file.

    If append=True, reads existing chunks and adds new ones (validating no ID conflicts).
    If append=False (default), overwrites the file.
    """
    if append:
        # Read existing chunks
        existing = []
        try:
            with open(output_path, 'r', encoding='utf-8') as f:
                existing = json.load(f)
            print(f"Read {len(existing)} existing chunks from {output_path}")
        except FileNotFoundError:
            print(f"No existing {output_path} — creating new file")
        except json.JSONDecodeError as e:
            print(f"ERROR: Cannot parse existing {output_path}: {e}")
            print("Use without --append to overwrite, or fix the JSON first.")
            sys.exit(1)

        # Validate no ID conflicts with the new prefix
        existing_ids = {c["id"] for c in existing}
        conflicting = [c for c in chunks if c["id"] in existing_ids]
        if conflicting:
            print(f"WARNING: {len(conflicting)} chunks with prefix 'kb-{id_prefix}-' already exist in {output_path}")
            print("Skipping duplicate chunks. Use a different --id-prefix if you want to add new ones.")
            # Filter out duplicates
            chunks = [c for c in chunks if c["id"] not in existing_ids]

        if not chunks:
            print("No new chunks to add (all duplicates). Exiting.")
            return

        # Merge: existing + new
        all_chunks = existing + chunks
        print(f"Appending {len(chunks)} new chunks to {len(existing)} existing = {len(all_chunks)} total")
    else:
        all_chunks = chunks

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_chunks, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(all_chunks)} chunks to {output_path}")


# ===== CLI =====

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PDF → RAG chunks pipeline")
    parser.add_argument("pdf_path", help="Path to PDF file")
    parser.add_argument("--bib", required=True, help="Bibliographic reference: 'Author, Title, Publisher Year, ISBN'")
    parser.add_argument("--tipo", default="articulo", choices=["articulo", "documento", "ley", "cct", "prensa", "organizacion", "entrevista", "efemeride", "audiovisual"])
    parser.add_argument("--category", default="investigaciones")
    parser.add_argument("--id-prefix", default="doc", help="Prefix for chunk IDs: kb-{prefix}-0, kb-{prefix}-1...")
    parser.add_argument("--tags", nargs="*", default=[], help="Extra tags for all chunks")
    parser.add_argument("--grade", default="open", help="Minimum grade access: open|B.a|B.b|B.c|B.d")
    parser.add_argument("--output", default=None, help="Output JSON path (default: <pdf_stem>.chunks.json next to the PDF)")
    parser.add_argument("--append", action="store_true", help="Append to existing .chunks.json instead of overwriting")
    parser.add_argument("--mode", default="chapters", choices=["chapters", "registros"],
                        help="Detection mode: 'chapters' (Capítulo/Parte) or 'registros' (Registro N.º with date/type metadata)")
    parser.add_argument("--content-start", type=int, default=0,
                        help="First page of real content (1-indexed). Registro entries on earlier pages are treated as index/TOC and skipped. 0 = auto-detect")
    parser.add_argument("--toc", default=None,
                        help="Path to a JSON file with manual table of contents. Format: [{title, start_page, author?, pub?}]")

    args = parser.parse_args()

    # Default output path: write <pdf_stem>.chunks.json next to the PDF
    if not args.output:
        pdf_stem = Path(args.pdf_path).stem
        pdf_dir = Path(args.pdf_path).parent
        args.output = str(pdf_dir / f"{pdf_stem}.chunks.json")

    # Process
    chunks = process_pdf(
        pdf_path=args.pdf_path,
        bib_ref=args.bib,
        tipo=args.tipo,
        category=args.category,
        id_prefix=args.id_prefix,
        tags=args.tags,
        grade_access=args.grade,
        mode=args.mode,
        toc_path=args.toc,
        content_start=args.content_start,
    )

    # Save
    save_chunks_json(chunks, args.output, append=args.append, id_prefix=args.id_prefix)
