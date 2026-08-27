#!/usr/bin/env python3
"""
Curar citas en krotoschin.chunks.json:
1. Comillas dobles con texto citado → comillas angulares + atribución Chicago
2. Citas de OTRO autor → (Apellido, citado en Krotoschin, 1993)
3. Números de nota al pie sueltos al final de oraciones → eliminar
4. Términos legales entre comillas → comillas angulares sin atribución
5. Referencias a artículos legales → NO van entre comillas
6. NO alterar texto sustantivo
7. NO modificar book_ref
"""

import json
import re
import sys

INPUT = '/Users/eljaso/Workspace/projects/hornero/biblioteca/rag/investigaciones/krotoschin-manual-derecho-trabajo/krotoschin-manual-derecho-trabajo/krotoschin.chunks.json'

# Términos legales que NO son citas (comillas angulares sin atribución)
# Incluimos variantes OCR con guiones de salto de línea
LEGAL_TERMS_PATTERNS = [
    # Términos jurídicos latinos y castellanos
    r'ius\s+variandi',
    r'jus\s+variandi',
    r'principio\s+protector(?:io)?',
    r'tutela\s+síndical',
    r'tutela\s+sindical',
    r'deber\s+de\s+previsión',
    r'justicia\s+social',
    r'control\s+obrero',
    r'los\s+gremios',
    r'reestructuración\s+productiva',
    r'procedimiento\s+preventivo\s+de\s+crisis\s+de\s+empresas',
    r'plus(?:pe[- ])?tición\s+inexcusable',
    r'a\s+desgano',
    r'a\s+reglamento',
    r'asimiladas?',
    r'aceptada',
    r'acordar',
    r'la\s+disminución\s+voluntaria\s+y\s+premeditada\s+de\s+la\s+producción',
    r'operatividad\s+inmediata',
    r'derecho\s+del\s+trabajo',
    r'Acta\s+final',
    r'principios\s+generales\s+del\s+derecho\s+del\s+trabajo',
    r'legislativa',  # competencia "legislativa"
    r'derecho\s+a\s+la\s+vida',
    r'La\s+jornada\s+racional',
    r'La\s+mujer\s+y\s+el\s+niño',
    r'protege\s+el\s+derecho',
    r'deber\s+de\s+previsión',
    r'jornada\s+racional',
    r'derecho\s+de\s+defender',
    r'procedimientos\s+distintos',
    r'representar\s+y\s+defender',
    r'defender\s+y\s+representar',
    r'la\s+disminución\s+voluntaria',
]

# Nombres de autores que aparecen citados en el texto (ALLCAPS o Mixed Case)
# Cuando una cita está cerca de uno de estos, se atribuye a ese autor
KNOWN_AUTHORS = {
    'CABANELLAS': 'Cabanellas',
    'DE FERRARI': 'De Ferrari',
    'DEVEALI': 'Deveali',
    'KROTOSCHIN': 'Krotoschin',
    'MEILL': 'Meill',
    'MEIL': 'Meil',
    'POZZO': 'Pozzo',
    'RATTI': 'Ratti',
    'VÁZQUEZ VIALARD': 'Vázquez Vialard',
    'RAMÍREZ BOSCO': 'Ramírez Bosco',
    'LÓPEZ': 'López',
    'GONZÁLEZ': 'González',
    'BIALER MASSÉ': 'Bialer Massé',
    'WALKER LINARES': 'Walker Linares',
    'ALFREDO L. PALACIOS': 'Palacios',
    'PALACIOS': 'Palacios',
    'VON POTODSKY': 'Von Potodsky',
    'NAPOLI': 'Napoli',
    'GALLART': 'Gallart',
    'MAYER-MALY': 'Mayer-Maly',
    'MERY': 'Mery',
    'JAUREGUIBERRY': 'Jaureguiberry',
    'DESPONTÍN': 'Despontín',
    'ARGIMÓN': 'Argimón',
    'CSN': 'CSN',
    'SCBA': 'SCBA',
}

# Nombres de revistas y publicaciones (no son autores)
PUBLICATIONS = {
    'DERECHO LABORAL', 'DERECHO DEL TRABAJO', 'GACETA DEL TRABAJO',
    'JURIS', 'REVISTA DE JURISPRUDENCIA ARGENTINA', 'LA LEY',
    'LA LEY LABORAL Y PREVISIONAL', 'ENCICLOPEDIA JURÍDICA OMEBA',
    'LT', 'JA', 'LL', 'DT',
}

# Excluir estos ALLCAPS del contexto de autoría (son secciones, headers, etc.)
NON_AUTHOR_CAPS = {
    'MANUAL', 'DERECHO', 'TRABAJO', 'DEL', 'DE', 'EN', 'EL', 'LA', 'LOS',
    'LAS', 'POR', 'PARA', 'CON', 'SIN', 'SOBRE', 'OBJETO', 'FUNDAMENTO',
    'EVOLUCIÓN', 'HISTÓRICA', 'FUENTES', 'MEDIOS', 'CREACIÓN', 'APLICACIÓN',
    'ESPACIO', 'SUJETOS', 'PRESTACIÓN', 'BASE', 'LABORAL', 'CONTENIDO',
    'RELACIÓN', 'CONTRATO', 'SUSPENSIÓN', 'TRANSFERENCIA', 'EXTINCIÓN',
    'NOCIONES', 'FUNDAMENTALES', 'CONVENCIÓN', 'CONVENCIONES', 'COLECTIVAS',
    'COLECTIVOS', 'PARTICIPACIÓN', 'ADMINISTRACIÓN', 'EMPRESA',
    'ASOCIACIONES', 'SINDICALES', 'CONFLICTOS', 'PROTECCIÓN', 'INTERNACIONAL',
    'PRIVADO', 'COMO', 'NEGOCIO', 'JURÍDICO', 'JURÍDICA', 'PARTES',
    'OBLIGACIONALES', 'NORMATIVAS', 'CLÁUSULAS', 'ARGENTINA', 'BUENOS',
    'AIRES', 'DEPALMA', 'EDICIÓN', 'EDICIONES', 'TOMO', 'TOMOS',
    'PARTE', 'PRIMERA', 'SEGUNDA', 'TERCERA', 'CUARTA', 'CAPÍTULO',
    'ÍNDICE', 'INICE', 'PRÓLOGO', 'LISTA', 'ABREVIATURAS',
    'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
    'WIR', 'JUTÍARCO', 'COMP', 'COM', 'LLP', 'AFL', 'HE',
}


def is_legal_term(text):
    """Check if the quoted text is a known legal term."""
    clean = re.sub(r'\s+', ' ', text).strip()
    for pattern in LEGAL_TERMS_PATTERNS:
        if re.search(pattern, clean, re.IGNORECASE):
            return True
    # Short phrases (≤4 words) that look like legal concepts
    words = clean.split()
    if len(words) <= 4 and not any(c in clean for c in '.;:'):
        # Could be a legal term if it's a short concept phrase
        # But be conservative - only if it's clearly a term, not a sentence fragment
        pass
    return False


def find_nearby_author(text, quote_start, quote_end):
    """Look for author names near a quoted passage."""
    # Search in 200 chars before the quote
    before = text[max(0, quote_start - 200):quote_start]
    # Search in 100 chars after the quote
    after = text[quote_end:min(len(text), quote_end + 100)]

    # Look for patterns like: "SURNAME," or "According to SURNAME" or "SURNAME dice"
    # Also look for "citado en" / "citado por" patterns

    # Pattern 1: ALLCAPS surname followed by comma (bibliographic reference)
    for surname, display in KNOWN_AUTHORS.items():
        if surname in NON_AUTHOR_CAPS:
            continue
        # Check before the quote
        if re.search(r'\b' + re.escape(surname) + r'\b', before):
            return display
        # Check after the quote
        if re.search(r'\b' + re.escape(surname) + r'\b', after):
            return display

    # Pattern 2: "citado en" or "citado por"
    combined = before + after
    citado_match = re.search(r'citado\s+(en|por)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)', combined)
    if citado_match:
        return citado_match.group(2)

    return None


def is_article_reference(text, quote_start, quote_end):
    """Check if the quoted text is an article/law reference (should not have quotes)."""
    before = text[max(0, quote_start - 20):quote_start]
    # If preceded by "art." or "ley" followed by a number, it's likely a reference
    if re.search(r'(art\.|ley|decr\.)\s*$', before.strip()):
        return True
    return False


def remove_footnote_numbers(text):
    """Remove stray footnote numbers at the end of sentences."""
    # Pattern: a period or semicolon followed by whitespace and a standalone 1-2 digit number
    # that is followed by whitespace and the start of a new sentence or line
    # But NOT: page numbers, article numbers, law numbers, etc.

    result = text

    # Pattern 1: ". number" at end of clause where number is a footnote ref
    # The number should be 1-2 digits, possibly with asterisk prefix
    # Exclude numbers that are clearly page/section references

    # Replace patterns like ". 17" or ". 3" or ".* 3" at sentence boundaries
    # where the number is a footnote reference (not a page/section number)
    # We look for: period + optional asterisk + space(s) + small number + space + capitalized word or newline
    def replace_footnote(m):
        before_period = m.group(1)  # text before the period
        number = m.group(2)
        after = m.group(3)

        # Don't remove if it looks like a page number (preceded by section header patterns)
        # Don't remove numbers > 50 (unlikely to be footnotes in a manual)
        num_val = int(number) if number.isdigit() else 0
        if num_val > 50:
            return m.group(0)

        # Don't remove if preceded by "art.", "ley", "p.", "ps.", "n°", "n*"
        check_before = before_period[-30:] if len(before_period) > 30 else before_period
        if re.search(r'(art\.|ley|p\.|ps\.|n°|n\*|decr\.|inc\.)\s*$', check_before.strip()):
            return m.group(0)

        # Don't remove if the "number" is actually part of a sequence like "1. 2. 3." (TOC)
        if re.search(r'\|\s*\d+\.\s*$', check_before):
            return m.group(0)

        # Don't remove if it's a section/chapter number (like "16." or "100.")
        if re.search(r'\|\s*$', check_before):
            return m.group(0)

        # This looks like a footnote reference - remove it
        return before_period + after

    # Match: period + optional asterisk + spaces + 1-2 digit number + space + next content
    result = re.sub(
        r'(\.)\s*\*?\s*(\d{1,2})\s+(\n|[A-ZÁÉÍÓÚÑ])',
        replace_footnote,
        result
    )

    # Also handle pattern: semicolon + number (footnote refs after semicolons)
    result = re.sub(
        r'(;)\s*\*?\s*(\d{1,2})\s+(\n|[A-ZÁÉÍÓÚÑ])',
        replace_footnote,
        result
    )

    return result


def process_quoted_text(text):
    """Process all double-quoted text in a chunk according to the rules."""
    result = []
    last_end = 0

    # Find all double-quoted passages
    # Handle both simple quotes and multi-line quotes
    for m in re.finditer(r'"([^"]+?)"', text):
        quote_start = m.start()
        quote_end = m.end()
        quoted_text = m.group(1)

        # Add text before this quote
        result.append(text[last_end:quote_start])

        # Determine treatment
        if is_legal_term(quoted_text):
            # Legal term: angular quotes, no attribution
            # Clean up OCR artifacts in the term (remove line breaks, normalize spaces)
            clean_term = re.sub(r'\s+', ' ', quoted_text).strip()
            # Remove OCR noise characters
            clean_term = re.sub(r'[.*+#|_]', '', clean_term).strip()
            result.append(f'«{clean_term}»')
        elif is_article_reference(text, quote_start, quote_end):
            # Article/law reference: remove quotes entirely
            clean_ref = re.sub(r'\s+', ' ', quoted_text).strip()
            result.append(clean_ref)
        else:
            # Citation: angular quotes with attribution
            # Clean up OCR artifacts (normalize whitespace, remove noise)
            clean_quote = re.sub(r'\s+', ' ', quoted_text).strip()
            # Remove leading/trailing OCR noise
            clean_quote = re.sub(r'^[.*+#|_\s]+', '', clean_quote)
            clean_quote = re.sub(r'[.*+#|_\s]+$', '', clean_quote)

            if clean_quote:
                # Check for nearby author
                author = find_nearby_author(text, quote_start, quote_end)
                if author and author != 'Krotoschin':
                    result.append(f'«{clean_quote}» ({author}, citado en Krotoschin, 1993)')
                else:
                    result.append(f'«{clean_quote}» (Krotoschin, 1993)')

        last_end = quote_end

    # Add remaining text
    result.append(text[last_end:])

    return ''.join(result)


def process_chunk(chunk):
    """Process a single chunk according to all the rules."""
    text = chunk.get('text', '')
    excerpt = chunk.get('excerpt', '')

    # Step 1: Process double-quoted text
    text = process_quoted_text(text)

    # Step 2: Remove stray footnote numbers
    text = remove_footnote_numbers(text)

    # Update excerpt to match first part of text if it had quotes
    if excerpt and '"' in chunk.get('text', ''):
        # Re-extract excerpt from processed text
        excerpt = text[:len(excerpt)] if len(text) >= len(excerpt) else text

    chunk['text'] = text
    if excerpt:
        chunk['excerpt'] = excerpt

    return chunk


def main():
    with open(INPUT, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f'Loaded {len(data)} chunks')

    # Count before stats
    before_quotes = sum(chunk.get('text', '').count('"') // 2 for chunk in data)
    print(f'Before: ~{before_quotes} double-quoted passages')

    # Process each chunk
    modified_count = 0
    for i, chunk in enumerate(data):
        original_text = chunk.get('text', '')
        if '"' not in original_text:
            continue
        chunk = process_chunk(chunk)
        if chunk['text'] != original_text:
            modified_count += 1
            data[i] = chunk

    print(f'Modified {modified_count} chunks')

    # Count after stats
    after_quotes = sum(chunk.get('text', '').count('«') for chunk in data)
    print(f'After: {after_quotes} angular-quoted passages')

    # Check for remaining double quotes
    remaining = sum(chunk.get('text', '').count('"') for chunk in data)
    print(f'Remaining double-quote characters: {remaining}')

    # Save
    with open(INPUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f'Saved to {INPUT}')


if __name__ == '__main__':
    main()
