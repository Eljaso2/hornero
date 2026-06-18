#!/bin/bash
# Sincronización de documentos entre carpeta original del proyecto y workspace
# Carpeta original: /Users/eljaso/Documents/Investigaciones/La Forestal/Sitio El Amargo
# Workspace: /Users/eljaso/Workspace/projects/concesion-arqueologica-el-amargo

SOURCE="/Users/eljaso/Documents/Investigaciones/La Forestal/Sitio El Amargo"
DEST="/Users/eljaso/Workspace/projects/concesion-arqueologica-el-amargo/docs/ref-original"

echo "=== Sincronización Sitio El Amargo ==="
echo "Fuente: $SOURCE"
echo "Destino:  $DEST"

# Crear destino si no existe
mkdir -p "$DEST"

# Copiar archivos de referencia (sin duplicar lo que ya está en docs/normativa y docs/caso)
# Solo copiamos los PDFs originales como referencia
for f in "$SOURCE"/*.pdf "$SOURCE"/*.docx; do
    if [ -f "$f" ]; then
        base=$(basename "$f")
        echo "Copiando: $base"
        cp "$f" "$DEST/$base"
    fi
done

echo "=== Sincronización completa ==="
ls -la "$DEST"
