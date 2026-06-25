# Template — Reporte Gremial

## Grados del sistema

| Grado | Nivel | Se publica | Dónde se guarda |
|-------|-------|------------|-----------------|
| Input | Carga del usuario | Cada vez que un usuario carga datos via botón | **N6 (IS)** — archive por usuario, sector, organización |
| 3 | Sindicato | Cuando un directivo acepta publicar el informe | **N10 Coyuntura** → `reporte-gremial/` |
| 4 | Federación / Unión | Cuando un directivo acepta publicar el informe | **N10 Coyuntura** → `reporte-gremial/` |
| 5 | Nacional | Automático cuando hay 2+ reportes Grado 4 | **N10 Coyuntura** → `reporte-gremial/` |

---

## Estructura

### Grado 3 — Sindicato

**Organización:** [Nombre del sindicato]
**Rama:** [Sector/actividad]
**Fecha:** [DD/MM/YYYY]
**Directivo que aprueba publicación:** [Nombre, cargo]
**Generado por:** IS (N6) — cadena de información intrasindical desde botón Reporte Gremial

**Contenido:**
- Situación del sindicato: [convocatorias, asambleas, medidas]
- Conflictos activos: [paritarias, despidos, reclamos]
- Comunicación interna: [cadenas de información activas]
- Vinculación con federación/unión: [articulación con otros sindicatos del sector]

---

### Grado 4 — Federación / Unión

**Organización:** [Nombre de la federación o unión]
**Sectores que agrupa:** [Lista de sindicatos/ramas]
**Fecha:** [DD/MM/YYYY]
**Directivo que aprueba publicación:** [Nombre, cargo]
**Agrega:** [N] reportes Grado 3

**Contenido:**
- Panorama sectorial: [situación general de la rama]
- Conflictos articulados: [paritarias sectoriales, measures conjuntas]
- Sindicatos con reportes Grado 3 activos: [lista]
- Posición frente a políticas nacionales: [reforma laboral, ajuste, etc.]

---

### Grado 5 — Nacional

**Fecha:** [DD/MM/YYYY]
**Agrega:** [N] reportes Grado 4 → se publica automáticamente

**Contenido:**
- Panorama del país: síntesis de todos los Grado 4
- Conflictos nacionales: [paro general, marcha federal, reformas]
- Articulación entre sectores: [convergencias, fracturas]
- Tendencias emergentes: [patrones detectados por IS (N6)]
