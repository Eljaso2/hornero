#!/bin/bash
# Hornero — abre la presentación integrada en el navegador (vía servidor local).
# Necesario porque los navegadores bloquean los <iframe> de archivos locales
# cuando se abre el HTML con doble clic (file://). Servido por http, funciona.
cd "$(dirname "$0")"
PORT=8123

# Despertar el backend de la app real (por si usás el botón "App en vivo")
curl -s -o /dev/null --max-time 45 https://hornero-ia.onrender.com/api/health &

# Liberar el puerto si quedó ocupado
lsof -ti tcp:$PORT | xargs kill -9 2>/dev/null

echo "Abriendo la presentación Hornero en http://localhost:$PORT/ …"
echo "(dejá esta ventana abierta mientras presentás; cerrala al terminar)"
( sleep 1 && open "http://localhost:$PORT/presentacion-hornero.html" ) &
python3 -m http.server $PORT
