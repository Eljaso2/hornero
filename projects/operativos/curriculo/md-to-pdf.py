#!/usr/bin/env python3
"""
CV Markdown → Preprocessed → HTML → PDF
Thorough preprocessing: each field line becomes its own paragraph,
sub-section headers get proper h3, bullets get proper list structure.
"""
import re
import subprocess
import os
import sys

MD_PATH = "/Users/eljaso/Workspace/projects/curriculo/reservorio/02-cv-actualizado.md"
CSS_PATH = "/Users/eljaso/Workspace/projects/curriculo/templates/cv-style.css"
OUTPUT_DIR = "/Users/eljaso/Documents/Currículos"
OUTPUT_PDF = os.path.join(OUTPUT_DIR, "CV_Jasinski_2026.pdf")
VENV_PYTHON = "/Users/eljaso/Workspace/projects/curriculo/.venv/bin/python"

# ─── READ ───
with open(MD_PATH, 'r') as f:
    raw_lines = f.readlines()

# ─── CLASSIFY EACH LINE ───
# We need to identify what each line IS so we can format it properly.

# Patterns
MAJOR_SECTION = re.compile(r'^(\d+)\.\s+[A-ZÁÉÍÓÚÑ]')
SUB_SECTION = re.compile(r'^(\d+\.\d+)\s+')
TITLE_LINE = 'ALEJANDRO JASINSKI'
SUBTITLE_PAT = re.compile(r'^Doctor y Licenciado')
FIELD_LABEL = re.compile(r'^((?:Institución|Programa|Período|Rol|Cargo|Director|Co-Director|Defensa|Calificación|Jurado|Promedio|Beca asociada|Código|Unidad de radicación|Directores|Cotitular|Co-docente|Codocente|Docente titular|Materia|Carrera|Cátedra|Modalidad|Carácter|Subtítulo|Nivel|Directores del curso|Link|Actividades|Líneas de investigación|Área|Fecha de nacimiento|Nacionalidad|DNI|WhatsApp|Correo electrónico|Instagram|ORCID|Academia\.edu|Perfil UBA|Sitio|Especial)\s*:\s*)', re.IGNORECASE)
BULLET_LINE = re.compile(r'^\s*•\s+')
SUB_LIST_A = re.compile(r'^\s*(a|b|c|d|e|f)\)\s+')
EMPTY_LINE = re.compile(r'^\s*$')

# ─── PREPROCESS ───
output_lines = []

for i, line in enumerate(raw_lines):
    stripped = line.strip()

    # Title
    if stripped == TITLE_LINE:
        output_lines.append(f'# {stripped}')
        output_lines.append('')

    # Subtitle
    elif SUBTITLE_PAT.match(stripped):
        output_lines.append(f'*{stripped}*')
        output_lines.append('')

    # Third line (universidad)
    elif stripped == 'Universidad de Buenos Aires':
        output_lines.append(stripped)
        output_lines.append('')

    # Major section headers
    elif MAJOR_SECTION.match(stripped):
        output_lines.append(f'# {stripped}')
        output_lines.append('')

    # Sub-section headers (5.1, 6.1, etc.)
    elif SUB_SECTION.match(stripped):
        output_lines.append(f'## {stripped}')
        output_lines.append('')

    # Field label lines → own paragraph with bold label
    elif FIELD_LABEL.match(stripped):
        match = FIELD_LABEL.match(stripped)
        label = match.group(1).rstrip(': ')
        value = stripped[match.end():].strip()
        # Markdown: bold label + value
        output_lines.append(f'**{label}:** {value}')
        output_lines.append('')  # blank line after each field → separate paragraph

    # Sub-list items a) b) c) → treat as h4 sub-headers within a section
    # These are topic headers like "a) Responsabilidad empresarial..."
    # followed by bullet detail items. They need to be visually distinct.
    elif SUB_LIST_A.match(stripped):
        text = SUB_LIST_A.sub('', stripped)
        output_lines.append('')
        output_lines.append(f'#### {text}')
        output_lines.append('')

    # Bullet items
    elif BULLET_LINE.match(stripped):
        text = BULLET_LINE.sub('', stripped)
        output_lines.append(f'- {text}')

    # Empty lines
    elif EMPTY_LINE.match(stripped):
        output_lines.append('')

    # Remaining lines — could be sub-sub headers or other content
    else:
        # Check if it looks like a sub-sub header
        # Short line, no colon, not a URL, after an empty line
        prev_empty = (i > 0 and EMPTY_LINE.match(raw_lines[i-1].strip()))
        is_short = len(stripped) < 60
        no_colon = ':' not in stripped
        no_url = not stripped.startswith('http')
        no_bullet = not stripped.startswith('-')

        if prev_empty and is_short and no_colon and no_url and no_bullet:
            output_lines.append(f'### {stripped}')
            output_lines.append('')
        else:
            output_lines.append(stripped)
            # Don't add blank line after regular text within a paragraph group
            # Only add blank if next line is empty or a header
            next_stripped = raw_lines[i+1].strip() if i+1 < len(raw_lines) else ''
            if EMPTY_LINE.match(next_stripped) or MAJOR_SECTION.match(next_stripped) \
               or SUB_SECTION.match(next_stripped):
                output_lines.append('')

preprocessed_md = '\n'.join(output_lines)

# ─── CONVERT TO HTML ───
html_body = subprocess.check_output([
    "pandoc", "--from", "markdown", "--to", "html5",
    "--syntax-highlighting=none",
], input=preprocessed_md, text=True)

# ─── WRAP WITH CSS ───
css_content = open(CSS_PATH).read()

full_html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<style>
{css_content}
</style>
</head>
<body>
{html_body}
</body>
</html>
"""

# ─── PDF ───
temp_html = os.path.join(OUTPUT_DIR, "_cv_temp.html")
with open(temp_html, "w") as f:
    f.write(full_html)

result = subprocess.run([
    VENV_PYTHON, "-c",
    f"""
import weasyprint
doc = weasyprint.HTML(filename='{temp_html}')
doc.write_pdf('{OUTPUT_PDF}')
print('OK')
"""
], capture_output=True, text=True)

if result.returncode != 0:
    print(f"Error: {result.stderr}")
    sys.exit(1)

print(result.stdout.strip())
os.remove(temp_html)
print(f"✓ PDF saved to {OUTPUT_PDF}")
