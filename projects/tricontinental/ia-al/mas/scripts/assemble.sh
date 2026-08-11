#!/bin/bash
# assemble.sh — Assemble newsletter sections into final document
# Usage: bash scripts/assemble.sh

SECTIONS_DIR="workspace/02.secciones"
OUTPUT_DIR="workspace/03.assembly"
FINAL_FILE="$OUTPUT_DIR/newsletter_tricontinental_ia_al.md"

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

# Create header
cat > "$FINAL_FILE" << 'HEADER'
# Del Modelo Agroexportador al Modelo Dato-Exportador: IA y colonialismo digital en América Latina

**Boletín Nuestra América | Tricontinental: Instituto de Investigaciones Sociales**
**Julio 2026**

HEADER

# Assemble sections in order
for section_file in "$SECTIONS_DIR"/00.apertura.md \
                    "$SECTIONS_DIR"/01.modelo_dato_exportador.md \
                    "$SECTIONS_DIR"/02.milei_promoter.md \
                    "$SECTIONS_DIR"/03.palantir_forestal.md \
                    "$SECTIONS_DIR"/04.tierras_data_centers.md \
                    "$SECTIONS_DIR"/05.sociedades_automatizadas.md \
                    "$SECTIONS_DIR"/06.desinformacion.md \
                    "$SECTIONS_DIR"/07.brasil_contrapunto.md \
                    "$SECTIONS_DIR"/08.resistencia.md \
                    "$SECTIONS_DIR"/09.conclusion.md; do

    if [ -f "$section_file" ]; then
        cat "$section_file" >> "$FINAL_FILE"
        # Ensure blank line between sections
        echo "" >> "$FINAL_FILE"
        echo "" >> "$FINAL_FILE"
    else
        echo "WARNING: Missing section file: $section_file" >&2
    fi
done

echo "Newsletter assembled: $FINAL_FILE"
echo "Copy to _output/ for final delivery"

# Copy to _output
mkdir -p "_output"
cp "$FINAL_FILE" "_output/newsletter_tricontinental_ia_al.md"
echo "Final newsletter copied to: _output/newsletter_tricontinental_ia_al.md"
