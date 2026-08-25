# Hornero — Plan de las 2 vías (captación + MVP técnico)

> Objetivo elegido: **(1) sumar sindicatos** y **(2) tener un MVP técnico mostrable**. Van en paralelo (no compiten).

---

## VÍA 1 · Captación (equipo — sin codear)
1. **Presentar / compartir** la presentación (ya lista, `~/Desktop/Hornero-Presentacion.zip`).
2. **Arrancar la curación** — mandar las guías (autocontenidas) a cada quien:
   - Abogado → [`BIBLIO-DERECHO-LABORAL-GUIA-CURACION.md`](BIBLIO-DERECHO-LABORAL-GUIA-CURACION.md)
   - Historiador → [`BIBLIO-HISTORIA-OBRERA-GUIA-CURACION.md`](BIBLIO-HISTORIA-OBRERA-GUIA-CURACION.md)
   - Analista/Mate → [`COYUNTURA-ECONOMICA-DISENO.md`](COYUNTURA-ECONOMICA-DISENO.md)
3. **Juntar 3 definiciones** con la dirección: ¿dónde corre (VPS/presupuesto)? ¿qué modelo? ¿hay un dev?

*Esto produce el contenido (el cuello de botella real) sin depender del backend.*

---

## VÍA 2 · MVP técnico mostrable
**Meta del MVP:** *"El Abogado responde una pregunta legal con la LEY REAL, citando el artículo."*
Base: el servicio de biblioteca ya funciona (`backend/library_service/`, 5 leyes reales = 581 arts, multi-sindicato).

### Paso 1 — Prender el semántico (tapa la degradación léxica)
Reusa la **DASHSCOPE_API_KEY que Hornero ya tiene** (¡sin key nueva!):
```bash
cd backend/library_service
export EMBED_PROVIDER=dashscope
export DASHSCOPE_API_KEY=<la key de Hornero>
export EMBED_MODEL=text-embedding-v3
python3 seed.py          # re-indexa; ahora "horas extra" ↔ "horas suplementarias" (Art. 201)
python3 server.py        # servicio en :8010, modo semántico
```

### Paso 2 — Enganchar la biblioteca a Hornero (feature-flag, con rollback)
En `main.py`, cambiar la llamada a `retrieve_for_query(...)` por `adapter_hornero.retrieve(...)` y:
```bash
export LIBRARY_URL=http://localhost:8010    # con esto usa la biblioteca; sin esto, keyword viejo
```
Ahora el Abogado recupera de las **leyes reales** (con cita), no del corpus aceitero pobre.

### Paso 3 (opcional) — Mostrarlo en la app real
Con el backend apuntando a la biblioteca, la pregunta "¿me pueden obligar a hacer horas extra?"
trae el artículo correcto de la LCT/Jornada. Ese es el MVP mostrable.

### Qué necesito de vos
- La **DASHSCOPE_API_KEY** para correr el semántico (lo corrés vos con los comandos de arriba, o me la pasás y lo pruebo — mejor que lo corras vos, es un secreto).

---

## Qué NO hacer todavía (para no quemar esfuerzo)
- Postgres+pgvector, servidor propio, modelo fine-tuneado (A2/A3): esperan las **3 definiciones** de la Vía 1. El prototipo actual ya alcanza para mostrar y decidir.

## Estado
- ✅ Vía 1: presentación + guías listas para enviar.
- ✅ Vía 2: servicio de biblioteca real + adaptador + embeddings (DashScope) listos. Falta correr con la key + enganchar el flag.
