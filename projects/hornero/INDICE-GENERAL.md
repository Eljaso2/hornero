# Hornero — Índice general del sistema

> Punto de entrada a toda la documentación y los materiales de Hornero (repo `Eljaso2/hornero`).
> Organizado por propósito. Última actualización: 2026-08.

---

## 🎥 1. Para presentar (a otros sindicatos)
Demos animadas + presentación integrada, bilingües (ES/EN).
- **[Presentación integrada](presentacion-hornero.html)** — 11 demos anidadas, portada, ES/EN, cierre/CTA. **Abrir con `ABRIR-PRESENTACION.command`** (no doble clic directo — los iframes fallan por `file://`).
- **[Menú de tarjetas — ES](demos-hornero.html)** · **[EN](demos-hornero-EN.html)**
- **Demos** (`demo-*.html`, cada una + `-EN`): ¿Qué es Hornero? · Protección de datos · Reporte de un operario · Reportar por voz y foto · Consulta legal · SMVM · ICE · Clipping · Historia Obrera · Prensa y comunicación · Cómo suma tu sindicato.
- **[Deck para Gamma (EN)](PRESENTATION-EN-GAMMA.md)** — 20 slides.
- Carpeta lista para compartir: `~/Desktop/Hornero-Presentacion/`.

## 📖 2. Entender el sistema actual
- **[Documentación técnica completa](DOCUMENTACION-COMPLETA.md)** — funcionalidades, arquitectura, frontend/backend, diagramas.
- **[Backend: pipeline end-to-end ACTUAL](PLAN-BACKEND-PIPELINE-ACTUAL.md)** — cómo funciona hoy el código real + dónde acopla a un solo sindicato.

## 🚀 3. Plan de expansión y mejora
- **[PLAN maestro](PLAN-EXPANSION-MEJORA.md)** — 4 partes + secuencia por fases.
  - **[A1 · Seguridad y auth](PLAN-A1-SEGURIDAD.md)** 🔴 *(desbloqueante nº1)*
  - **[A2 · Infraestructura soberana](PLAN-A2-INFRAESTRUCTURA.md)** (VPS + Postgres)
  - **[A3 · Soberanía de modelo](PLAN-A3-MODELO.md)** (self-hosted + fine-tuning)
  - **[B · Motor de IA](PLAN-B-MOTOR-IA.md)** (RAG + corpus)
  - **[C · Funcionalidades](PLAN-C-FUNCIONALIDADES.md)** (índices, convenio vivo, multimodal…)
  - **[D · Escala multi-sindicato + protección](PLAN-D-ESCALA.md)**

## 📚 4. La Biblioteca soberana + RAG (el problema de fondo)
- **[Diseño Biblioteca + RAG](PLAN-BIBLIOTECA-RAG.md)** — adaptar meta-rag-oss; capa compartida + por sindicato; API primero, MCP después; ingesta/scraping.
- **[Scraper legal (InfoLeg/SAIJ)](PLAN-SCRAPER-LEGAL.md)** — pipeline de ingesta del derecho.
- **Guías de curación (delegables, para enviar):**
  - **[Derecho Laboral](BIBLIO-DERECHO-LABORAL-GUIA-CURACION.md)** → abogado (general + sectorial).
  - **[Historia Obrera](BIBLIO-HISTORIA-OBRERA-GUIA-CURACION.md)** → historiador.
  - **[Coyuntura económica](COYUNTURA-ECONOMICA-DISENO.md)** → analista/Mate (datos → resumen claro).
- **[Prototipo funcionando](backend/library_proto/README.md)** — LCT chunkeada por artículo + búsqueda; supera al keyword actual (probado).

## 📐 5. Referencia (diseño original del proyecto)
- `00-design-conceptual.md` · `01-architectura-tecnica.md` · `CLAUDE.md`
- Ecosistema por capas y núcleos: `../ecosistema-hornero/`
- Código: `app/` (PWA) · `backend/` (FastAPI + RAG)

---

## Estado / próximos pasos
- ✅ Presentación (11 demos ES/EN) — lista.
- ✅ Plan de expansión (A–D) + revisión del pipeline real — documentado.
- ✅ Biblioteca: diseño + guías delegables + **prototipo legal funcionando** (fase 1) + **scraper diseñado** (fase 2).
- ⏭️ **Siguiente:** enganchar embeddings/pgvector (búsqueda híbrida) al prototipo; `scrape_infoleg` parametrizable; empezar A1 (auth + `tenant_id`).

## Cómo se conecta todo
```
Scraping/curación → Biblioteca (RAG, capa compartida + por sindicato)
        │                         │
        ▼                         ▼
   guías delegables        API /library/search
   (abogado, historiador,        │
    analista)                    ▼
                         El pipeline del backend (personas responden con fuente)
                                 │
        auth + tenant_id ────────┴──── multi-sindicato (mismo pipeline, N gremios aislados)
```
