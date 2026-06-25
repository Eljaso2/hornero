# Núcleo 10 — Coyuntura laboral

> Lo urgente del campo, procesado con inteligencia. No es un boletín que resume noticias: produce outputs estructurados que alimentan la App y la organización.

---

## Dos secciones

### 1. Clipping semanal

Captura periodística automatizada. No es una lista de noticias: es un producto procesado que clasifica, contextualiza y vincula conflictos entre sectores y geografías. Alimenta IS (N6) con datos de prensa.

→ `clipping/` — cada clipping: 10 noticias, bajada 3 líneas, desarrollo ~400 palabras, fuente visible, etiquetas VCE/BHR

### 2. Reporte Gremial

Función operativa de comunicación intrasindical. Se genera desde el **botón Reporte Gremial** de la App (5b), que activa cadenas de información dentro de los sindicatos.

**Grados del sistema:**

| Grado | Nivel | Se publica | Dónde se guarda |
|-------|-------|------------|-----------------|
| Input | Carga del usuario | Cada vez que un usuario carga datos via botón Reporte Gremial | **N6 (IS)** — archive por usuario, sector, organización |
| 3 | Sindicato | Cuando un directivo acepta publicar el informe | **N10 Coyuntura** → `reporte-gremial/` |
| 4 | Federación / Unión | Cuando un directivo acepta publicar el informe | **N10 Coyuntura** → `reporte-gremial/` |
| 5 | Nacional | Automático cuando hay 2+ reportes Grado 4 | **N10 Coyuntura** → `reporte-gremial/` |

→ `reporte-gremial/` — templates por grado, INDEX de reportes publicados

---

## Informes de Índices (recibidos de otros núcleos)

Los índices se actualizan periódicamente. Cuando hay una nueva actualización, la App notifica:
- **Índice ICE** (Comportamiento Empresarial, N11) — actualización por sector y empresa
- **Índice IFT** (Felicidad del Trabajador, N13) — actualización de las 6 dimensiones
- **Índice Morfología** (N9) — cambios en formas de la clase

---

## Notificaciones de la App

Esta sección trabaja con **notificaciones voluntarias**. No hay push invasivo: la App avisa si hay elementos nuevos, y el trabajador decide cuándo consultar:
- 🔔 Nuevo clipping semanal disponible
- 📊 Nuevo Reporte Gremial Grado 3 (tu sindicato)
- 📊 Nuevo Reporte Gremial Grado 4 (tu federación/unión)
- 🌐 Nuevo Reporte Gremial Grado 5 (nacional)
- ⚠️ Actualización de Índice ICE
- 🌿 Actualización de Índice IFT
- 📊 Actualización de Índice Morfología

---

## Pipeline

1. **Captura** — clipping automatizado de fuentes semanales + cargas de usuarios via botón Reporte Gremial → se archivan en N6
2. **Procesa** — IS (N6) clasifica, contextualiza, vincula conflictos entre sectores
3. **Consolida** — directivo acepta publicar → Grado 3 (sindicato), Grado 4 (federación) → Grado 5 (nacional, automático con 2+ Grado 4)
4. **Publica** — reportes aprobados se guardan en N10 Coyuntura como publicados
5. **Notifica** — la App avisa que hay nuevos outputs disponibles
6. **Archiva** — todo queda trazable, con fuente primaria vinculada

---

## Flujo interno

- Clipping automatizado alimenta IS (N6) con datos de prensa
- IS (N6) procesa y devuelve informes → Coyuntura (N10) los publica en la App
- Botón Reporte Gremial (5b) → usuario carga datos → se archiva en N6 (IS) por usuario/sector/organización
- Directivo acepta publicar → Grado 3 (sindicato) o Grado 4 (federación) → se guarda en N10 Coyuntura como publicado
- Grado 5 (nacional) se genera automáticamente con 2+ Grado 4 → se guarda en N10 Coyuntura como publicado
- Índices (N9, N11, N13) producen actualizaciones → Coyuntura (N10) las distribuye por notificación
- Outputs aprobados alimentan "Las novedades" (5f) de la App
- Capa de coyuntura separada de lo normativo permanente (N7, Mi convenio Mi Derecho)
- Noticias VCE/BHR → routear como fuente a N11 (Comportamiento Empresarial)

---

## Repositorio y documentación

- **Fuentes:** `clipping/SOURCES_CATALOG.md` — catálogo completo de medios, sindicatos, organizaciones, redes sociales, fuentes gubernamentales, preguntas analíticas VCE
- **Clipping:** `clipping/` — clippings semanales, template, índice
- **Reporte Gremial:** `reporte-gremial/` — templates por grado, índice de reportes publicados
- **Workflow:** `WORKFLOW.md` — ritmo semanal, prioridades de fuentes, categorías de análisis, routing
- **Corpus de fine-tuning (N2):** Serie temporal de coyunturas laborales etiquetadas — para entrenar detector de tendencias emergentes
