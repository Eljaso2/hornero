#!/usr/bin/env python3
"""Clean extracted PDF chunks: rejoin broken lines, remove page footers, fix formatting."""
import re
import sys
import os

def clean_chunk(text):
    # Remove repeated journal footer
    footer_pattern = r'V\. XIV, Nº 16 / Primer semestre 2017 - ISSNe 2422-6580 / ISSN 1514-3899'
    text = re.sub(footer_pattern, '', text)

    # Remove page markers but keep a clean separator
    text = re.sub(r'\n*<!-- página (\d+) -->\n*', r'\n\n---\n\n', text)

    # Remove bullet separators (• • •)
    text = re.sub(r'•\s*•\s*•\s*', '', text)

    # Rejoin lines that were broken mid-sentence (single words on separate lines)
    # Strategy: join consecutive short lines into paragraphs
    lines = text.split('\n')
    result = []
    buffer = []

    for line in lines:
        stripped = line.strip()

        # Skip empty lines - flush buffer
        if not stripped:
            if buffer:
                result.append(' '.join(buffer))
                buffer = []
            result.append('')
            continue

        # Preserve markdown headings
        if stripped.startswith('#'):
            if buffer:
                result.append(' '.join(buffer))
                buffer = []
            result.append(stripped)
            continue

        # Preserve horizontal rules
        if stripped == '---':
            if buffer:
                result.append(' '.join(buffer))
                buffer = []
            result.append(stripped)
            continue

        # Preserve bold section headers (all bold lines)
        if stripped.startswith('**') and stripped.endswith('**'):
            if buffer:
                result.append(' '.join(buffer))
                buffer = []
            result.append(stripped)
            continue

        # If line ends with period or is a footnote reference, flush buffer
        if re.match(r'^\d+\.\s', stripped) or re.match(r'^\d+\.$', stripped):
            if buffer:
                result.append(' '.join(buffer))
                buffer = []
            result.append(stripped)
            continue

        # Accumulate into buffer
        buffer.append(stripped)

    if buffer:
        result.append(' '.join(buffer))

    # Re-join the text
    text = '\n'.join(result)

    # Clean up multiple blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Fix bold text split across lines: **word\nword** -> **word word**
    text = re.sub(r'\*\*([^*]+)\*\*\s*\n\s*\*\*([^*]+)\*\*', r'**\1 \2**', text)

    # Fix URL line breaks in bibliography
    text = re.sub(r'(\w)%\n\s*0A', r'\1%\n0A', text)  # won't match but just in case
    text = re.sub(r'\n\s*(%[0-9A-F]{2})', r'\1', text)  # URL encoding line breaks

    return text.strip()

if __name__ == '__main__':
    chunks_dir = sys.argv[1] if len(sys.argv) > 1 else '.'
    for fname in sorted(os.listdir(chunks_dir)):
        if fname.startswith('chunk_') and fname.endswith('.md'):
            fpath = os.path.join(chunks_dir, fname)
            with open(fpath, 'r') as f:
                text = f.read()
            cleaned = clean_chunk(text)
            with open(fpath, 'w') as f:
                f.write(cleaned)
            print(f'✅ Limpiado: {fname} ({len(text)} → {len(cleaned)} chars)')
