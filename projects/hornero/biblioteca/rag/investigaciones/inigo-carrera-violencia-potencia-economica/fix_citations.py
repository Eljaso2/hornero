#!/usr/bin/env python3
"""
Fix citations in Iñigo Carrera chunks JSON:
1. Convert double/curly quotes to angular quotes with Chicago attribution
2. Convert backtick quotes to angular quotes (terms, no attribution)
3. Remove footnote reference numbers at end of sentences
4. Terms in quotes get angular quotes without attribution
"""

import json
import re
import sys

INPUT_FILE = "/Users/eljaso/Workspace/projects/hornero/biblioteca/rag/investigaciones/inigo-carrera-violencia-potencia-economica/inigo-carrera-violencia-potencia-economica.chunks.json"

# Known authors cited in the book (not Iñigo Carrera)
KNOWN_AUTHORS = [
    # Full names (longer patterns first to avoid partial matches)
    "Bialet Massé",
    "Martínez de Hoz",
    "Lafone Quevedo",
    "José Niklison",
    "Ramón Pardal",
    "Melitón González",
    "Alejandro Figueroa",
    "Benjamín Victorica",
    "Atilio Cornejo",
    "Marcelino Buyán",
    "Emilio Schleh",
    "Alfredo Bousquet",
    "Ian Rutlege",
    "Ian Rutledge",
    "Eduardo Rostagno",
    "Cordeu-Sifredi",
    "Adolfo Girola",
    "Juan Solari",
    "Peyret",
    "Peyert",
    "Victorica",
    "Niklison",
    "Schleh",
    "Bousquet",
    "Rostagno",
    "Girola",
    "Solari",
    "Cordeu",
    "Pardal",
    "Batistel",
    "Murmis",
    "Rutlege",
    "Rutledge",
    "Garmendia",
    "Miatello",
    "Gancedo",
    "Lahitte",
    "Zeballos",
    "Olascoaga",
    "Racedo",
    "Winter",
    "Vedoya",
    "Zuccarini",
    "Bordon",
    "Bernabé",
    "Muello",
    "Terán",
    "Fontanella",
    "Arenales",
    "Verón",
    "Castelao",
    "Fra",
    "Torres",
    "Leguizamón",
    "Bonorino",
    "Cáceres",
    "Poncet",
    "Augier",
    "Bialet",
    "Buyán",
    "Vera",
]

# Institutional sources (not person names)
INST_SOURCES = [
    "Cámara de Diputados",
    "Cámara de Senadores",
    "MMI",
    "CHRI",
    "CAN",
    "Departamento Nacional del Trabajo",
    "La Prensa",
    "Censo Industrial",
    "Censo Agropecuario",
    "Dirección General de Tierras",
    "Ministerio del Interior",
]

# Attribution verb patterns before a quote
ATTR_BEFORE_PATTERNS = [
    r'(?:según|conforme)\s+({author})',
    r'(?:como)\s+(?:dice|señala|afirma|indica|expresa|observa|expone|sostiene|refiere|plantea|describe|informa|destaca|advierte|aduce|argumenta|anota|nota|explica)\s+({author})',
    r'({author})\s+(?:dice|señala|afirma|indica|expresa|observa|expone|sostiene|refiere|plantea|describe|informa|destaca|advierte|aduce|argumenta|anota|nota|explica|encuentra|estima|registra|relata|cuenta|escrib[eié]|opina|considera|advierte|denuncia)',
    r'(?:dice|señala|afirma|indica|expresa|observa|expone|sostiene|refiere|plantea|describe|informa|destaca|advierte|aduce|argumenta|anota|nota|explica)\s+({author})',
    r'({author})\s+(?:en\s+(?:su\s+)?(?:memoria|informe|obra|artículo|libro|trabajo|estudio|relación|diario|carta))',
    r'({author})\s+(?:que|cómo|cuándo|cuánto)',
    r'del\s+(?:coronel|general|capitán|doctor|dr\.|ing\.|don)\s+({author})',
    r'(?:el|la)\s+(?:coronel|general|capitán|doctor|dr\.|ing\.|don|señor)\s+({author})',
]

# Attribution pattern after a quote: (Author; year; page)
ATTR_AFTER_PATTERN = r'\(\s*({author})\s*[;,]'

# Institutional source attribution after quote
INST_AFTER_PATTERN = r'\(\s*(Cámara de Diputados|Cámara de Senadores|MMI|CHRI|CAN|Departamento Nacional del Trabajo)'

# Terms that are concepts/vocabulary, not citations
# These are typically short (1-5 words), no verbs, conceptual in nature
TERM_INDICATORS = [
    # Pure vocabulary/concepts
    "civilizar", "criquet", "obraje", "hachero", "desmonte", "quebracho",
    "modernización", "fábricas", "jornaleros", "plantadores", "fabricantes",
    "colono", "colonos", "colonización", "colonias", "gringo", "ocupantes",
    "importación", "crédito", "venta", "industria", "alimentación",
    "provista", "truck system", "INDRA", "infantería ligera",
    "población sobrante", "desalojo", "acumulación originaria", "violencia",
    "vagabundos", "choque entre dos culturas", "genocidio físico y/o cultural",
    "autóctono", "víctimas", "victimarios", "buenos", "malos",
    "avance de la civilización", "rurales", "rural", "típica", "óptima",
    "basada en el trabajo familiar", "familiar", "campo abierto",
    "manufacturera", "novedosos", "asentamientos", "ocupaciones de tierras",
    "atrasadas", "desarrolladas", "Nuevos enfoques", "movilidad espacial",
    "niveles más complejos", "enfoque más amplio del problema", "multicausal",
    "crisis de las economías regionales", "robo famélico",
    "llamados beneficios sociales", "beneficios sociales",
    "crea una población sobrante", "campaña",
    "izquierdistas", "pintoresquismo", "activistas", "agitadores", "activista", "agitador",
    "Impenetrable", "trabajador por cuenta propia",
    "albergues para braceros", "albergue para braceros",
    "capital humano", "en lugares dignos donde vivir",
    "sentada", "provedurias", "nuevos", "zona exterior", "zona interior",
    "colocarse por debajo", "enorme prensa a mano para los fardos",
    "pequeños explotadores", "latifundio Cantón", "vecinos",
    "sistema de provista", "Marcha de Avance",
    "criollos", "paisanos", "cristianos", "nación",
    "carácter o espíritu nacional", "gringos", "étnicos",
    "población obrera", "obreros y peones",
    "Construcciones", "Fibras, hilados, tejidos", "Alimentación",
    "ingenios de azúcar", "Fibras, hilados y tejidos", "Quebrachales Fusionados",
    "Curtientes", "Obrajes", "Desmotado de algodón",
    "fábricas de electricidad", "textiles", "químicos", "desmotado", "curtientes",
    "forestales", "obrajes", "sustancias alimenticias",
    "fábricas de aceite comestible",
    "Personal ocupado en industria", "Artes Manuales e Industria",
    "personas ocupadas en industria",
    "jornalero", "peón", "empleado",
    "usinas desmotadoras", "de sierras",
    "estado", "física", "físico",
    "quienes quisieran ocuparla", "por familias en lotes de 100 hectáreas",
    "labores culturales", "mano de obra requerida", "NO CLASIFICABLES",
    "radicales del pueblo", "radicales intransigentes", "neoperonistas", "cercos",
    "Nuestra Señora de la Asunción",
    "los paisanos", "los criollos", "los curas", "los de El Pintado",
    "los cristianos", "las bestias", "gente", "los muchachos", "los pobres",
    "se resistieron", "independientes", "colectivos",
    "8.000 australes mensuales",
    "porque estaba viejo, sordo y veía poco",
    "con las tierras de todos", "al partir", "grupos",
    "son todos muy ladrones", "la necesidad", "son sinvergüenzas", "mariscada",
    "norte chaqueño",
    "Los 'paisanos'xix estaban con Ramallo",
    "caudillo de la gente de acá",
    "le llevaba las alcahueterías a Ramallo",
    "eran íntimos amigos",
    "personalista", "Blancos", "Verdes",
    "se pasó a los 'verdes'", "se pasó a los 'radicales blancos'",
    "verdes", "blancos", "xxvi",
    "tenía con él al comisario",
    "por encargo de los curas",
    "es el día de los obreros",
    "por eso los gringos nos embroman",
    "va a buscar algo mas firme en la cosecha",
    "en 'shorts' y con 'walkman'",
    "Dios",
    "Las Palmas del Chaco Austral",
    "La Esperanza", "Ledesma",
    "arreglos chicos",
]


def is_term(quote_text):
    """Determine if a quoted string is a term/concept rather than a citation."""
    # Strip whitespace
    text = quote_text.strip()

    # Very short (1-4 words) - likely a term
    word_count = len(text.split())

    # Check against known term list (case-insensitive)
    text_lower = text.lower().strip()
    for t in TERM_INDICATORS:
        if text_lower == t.lower() or text == t:
            return True

    # Short expressions without verbs - likely terms
    if word_count <= 3:
        # Check if it looks like a term (no sentence structure)
        # No period, no comma, no semicolon suggesting clause structure
        if not re.search(r'[.;:]', text):
            # No conjugated verbs (rough heuristic)
            # Terms are usually noun phrases, adjectives, or concepts
            if not re.search(r'\b(es|son|tiene|puede|debe|está|están|fue|fueron|ser|haber|hacer|va|van|dice|ha|han|podía|podían|debía|debían|quería|querían|podría|podrían|estaba|estaban|sería|serían|habría|habrían)\b', text, re.IGNORECASE):
                return True

    # 4-5 word expressions that are clearly terms/concepts
    if word_count <= 5 and not re.search(r'[.;:]', text):
        if not re.search(r'\b(es|son|tiene|puede|debe|está|están|fue|fueron)\b', text, re.IGNORECASE):
            return True

    return False


def find_author_before(text, quote_start):
    """Find author attribution in text before a quote."""
    # Look at up to 300 chars before the quote
    before = text[max(0, quote_start - 300):quote_start]

    for pattern in ATTR_BEFORE_PATTERNS:
        for author in KNOWN_AUTHORS:
            pat = pattern.replace('{author}', re.escape(author))
            m = re.search(pat, before, re.IGNORECASE)
            if m:
                return author

    # Check institutional sources
    for inst in INST_SOURCES:
        for pattern in ATTR_BEFORE_PATTERNS:
            pat = pattern.replace('{author}', re.escape(inst))
            m = re.search(pat, before, re.IGNORECASE)
            if m:
                return inst

    # Simpler pattern: author name right before the quote with "que" or colon
    for author in KNOWN_AUTHORS:
        if re.search(re.escape(author) + r'\s*(?:que|:)\s*$', before):
            return author

    return None


def find_author_after(text, quote_end):
    """Find author attribution in text after a quote."""
    # Look at up to 200 chars after the quote
    after = text[quote_end:min(len(text), quote_end + 200)]

    # Check for (Author; year; page) pattern
    for author in KNOWN_AUTHORS:
        pat = r'\(\s*' + re.escape(author) + r'\s*[;,]'
        if re.search(pat, after):
            return author

    # Check for (Citado en Author) pattern
    for author in KNOWN_AUTHORS:
        if re.search(r'citado\s+en\s*' + re.escape(author), after, re.IGNORECASE):
            return author

    # Check institutional sources
    for inst in INST_SOURCES:
        pat = r'\(\s*' + re.escape(inst)
        if re.search(pat, after):
            return inst

    # Check for "op. cit." followed by author context
    # This is tricky - if there's an op.cit after the quote, the author was likely mentioned earlier

    return None


def format_attribution(author, is_inst=False):
    """Format Chicago-style attribution."""
    if is_inst or author in INST_SOURCES:
        return f'({author}, citado en Iñigo Carrera, 2010)'
    else:
        return f'({author}, citado en Iñigo Carrera, 2010)'


def remove_footnote_refs(text):
    """Remove footnote reference numbers at end of sentences."""
    # Pattern 1: Number right after closing quote (curly or straight or angular)
    # e.g. "...".3 or ...".3 or ...».3
    text = re.sub(r'["\"\”»](\d{1,3})(?=\s)', lambda m: '"' + m.group(0)[1:], text)
    # After quote + number at end of line
    text = re.sub(r'["\"\”»](\d{1,3})\s*$', '"', text, flags=re.MULTILINE)

    # Pattern 2: Period + number at end of sentence (but not decimal)
    # e.g. "...trabajo.3" -> "...trabajo."
    # But NOT "0.3" or "3.5" or "p. 73"
    def replace_period_fn(m):
        before_char = text[max(0, m.start()-1):m.start()]
        # Don't remove if it's a decimal number (preceded by a digit)
        if before_char.isdigit():
            return m.group(0)
        # Don't remove if it's a page reference (preceded by "p." or "pp.")
        if re.search(r'[Pp]\.\s*$', text[max(0, m.start()-5):m.start()]):
            return m.group(0)
        # Don't remove if it's "op. cit." or similar reference
        if re.search(r'(op\.|cit\.|ib[íi]dem)\s*$', text[max(0, m.start()-15):m.start()], re.IGNORECASE):
            return m.group(0)
        return '.'

    text = re.sub(r'\.(\d{1,3})(?=\s|$)', replace_period_fn, text)

    # Pattern 3: Closing paren + number
    # e.g. "...).3" -> "...)."
    text = re.sub(r'\)(\d{1,3})(?=\s|$)', ')', text)

    return text


def process_quotes(text):
    """Process all quotes in text: convert to angular, add attribution."""
    # First, convert backtick quotes to angular (these are always terms)
    text = re.sub(r'`([^`]+?)´', r'«\1»', text)

    # Now process curly/smart quotes and straight quotes
    # We need to be careful about matching pairs

    result = []
    i = 0
    while i < len(text):
        # Check for opening curly quote
        if text[i] == '“' or text[i] == '"':  # " or "
            # Find the matching closing quote
            if text[i] == '“':
                close_char = '”'  # ”
            else:
                close_char = '"'

            # Find closing quote (handling nested quotes is unlikely here)
            close_pos = text.find(close_char, i + 1)
            if close_pos == -1:
                # No matching close quote found - just convert opening
                result.append('«')
                i += 1
                continue

            quote_content = text[i+1:close_pos]

            # Determine if this is a term or a citation
            if is_term(quote_content):
                # Term: just angular quotes, no attribution
                result.append('«')
                result.append(quote_content)
                result.append('»')
            else:
                # Citation: angular quotes + attribution
                author = find_author_before(text, i) or find_author_after(text, close_pos + 1)

                result.append('«')
                result.append(quote_content)
                result.append('»')

                if author:
                    result.append(' ')
                    result.append(format_attribution(author))
                else:
                    result.append(' ')
                    result.append('(Iñigo Carrera, 2010)')

            i = close_pos + 1
        else:
            result.append(text[i])
            i += 1

    return ''.join(result)


def clean_footnote_text_blocks(text):
    """Remove standalone footnote text blocks at the bottom of chunks.

    These are lines like:
        1 Es casi un lugar común...
        3 Bousquet, Alfredo; "Memoria Histórica...

    They appear as blocks of source references that no longer make sense
    without their corresponding footnote numbers.
    """
    # Pattern: lines that start with a footnote number followed by author text
    # These are typically at the end of chunks
    lines = text.split('\n')
    cleaned_lines = []
    in_footnote_block = False
    footnote_block_start = -1

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # Detect footnote text line: starts with a number (1-3 digits) followed by
        # what looks like a bibliographic reference or explanatory text
        fn_match = re.match(r'^(\d{1,3})\s+([A-ZÁÉÍÓÚ]"|([A-ZÁÉÍÓÚ][a-záéíóúñ]+[\s,;.]))', line)

        # Also detect continuation patterns: "Ibídem", "op. cit.", etc.
        ibid_match = re.match(r'^(Ibídem|Ibidem|ibídem|ibidem)\s', line, re.IGNORECASE)

        if fn_match or (in_footnote_block and ibid_match):
            if not in_footnote_block:
                in_footnote_block = True
                footnote_block_start = i
            i += 1
            continue

        # Check if this is a continuation of the footnote block
        # (short line with just a page reference or "op. cit.")
        if in_footnote_block and (ibid_match or re.match(r'^(op\.\s*cit|Ver\s)', line, re.IGNORECASE)):
            i += 1
            continue

        # If we were in a footnote block and this line doesn't match, end the block
        if in_footnote_block and not fn_match and not ibid_match:
            # Check if this is a real content line or still footnote
            # Footnote lines are often indented or start with numbers
            if line and not re.match(r'^\d{1,3}\s', line):
                in_footnote_block = False

        cleaned_lines.append(lines[i])
        i += 1

    return '\n'.join(cleaned_lines)


def process_chunk(chunk):
    """Process a single chunk's text field."""
    text = chunk.get('text', '')
    if not text:
        return chunk

    # Step 1: Remove footnote reference numbers at end of sentences
    text = remove_footnote_refs(text)

    # Step 2: Convert quotes to angular with attribution
    text = process_quotes(text)

    # Step 3: Clean footnote text blocks at the bottom
    text = clean_footnote_text_blocks(text)

    # Step 4: Clean up extra whitespace that may result from removals
    # Multiple blank lines -> double blank line
    text = re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n \n \n', text)

    chunk['text'] = text
    return chunk


def main():
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        chunks = json.load(f)

    print(f"Processing {len(chunks)} chunks...")

    # Count before stats
    total_curly_before = sum(c.get('text','').count('“') for c in chunks)
    total_straight_before = sum(c.get('text','').count('"') for c in chunks)
    total_backtick_before = sum(len(re.findall(r'`[^`]+?´', c.get('text',''))) for c in chunks)

    # Process
    processed_chunks = [process_chunk(c) for c in chunks]

    # Count after stats
    total_angular_after = sum(c.get('text','').count('«') for c in processed_chunks)
    total_angular_close = sum(c.get('text','').count('»') for c in processed_chunks)
    total_curly_after = sum(c.get('text','').count('“') for c in processed_chunks)
    total_straight_after = sum(c.get('text','').count('"') for c in processed_chunks)

    # Attribution stats
    inigo_count = sum(c.get('text','').count('(Iñigo Carrera, 2010)') for c in processed_chunks)
    citado_count = sum(c.get('text','').count('citado en Iñigo Carrera, 2010)') for c in processed_chunks)

    print(f"\n=== BEFORE ===")
    print(f"  Curly opening quotes: {total_curly_before}")
    print(f"  Straight quote marks: {total_straight_before}")
    print(f"  Backtick quote pairs: {total_backtick_before}")

    print(f"\n=== AFTER ===")
    print(f"  Angular opening quotes: {total_angular_after}")
    print(f"  Angular closing quotes: {total_angular_close}")
    print(f"  Remaining curly quotes: {total_curly_after}")
    print(f"  Remaining straight quotes: {total_straight_after}")
    print(f"  Iñigo Carrera attributions: {inigo_count}")
    print(f"  'citado en' attributions: {citado_count}")

    # Save
    with open(INPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(processed_chunks, f, ensure_ascii=False, indent=2)

    print(f"\nSaved to {INPUT_FILE}")

    # Show a few sample chunks for verification
    for idx in [0, 2, 50, 85]:
        c = processed_chunks[idx]
        text = c.get('text', '')
        print(f"\n--- Sample chunk {idx} (id: {c['id']}) ---")
        # Show first 500 chars
        print(text[:500])


if __name__ == '__main__':
    main()
