# Índice de Reportes Gremiales

## 2026 — Junio

*(Sin reportes publicados todavía)*

---

## Grados del sistema

| Grado | Nivel | Se publica | Dónde se guarda | En la App |
|-------|-------|------------|-----------------|-----------|
| Input | Carga del usuario | Cada vez que un usuario carga datos via botón | **N6 (IS)** — archive por usuario, sector, organización | — |
| 3 | Sindicato | Cuando un directivo acepta publicar | **N10 Coyuntura** → `reporte-gremial/` | "Reporte Gremial + [Sindicato]" |
| 4 | Federación / Unión | Cuando un directivo acepta publicar | **N10 Coyuntura** → `reporte-gremial/` | "Reporte Gremial + [Federación]" |
| 5 | Nacional | Automático cuando hay 2+ reportes Grado 4 | **N10 Coyuntura** → `reporte-gremial/` | "Reporte Gremial + Nacional" |

## Flujo de datos

1. Usuario carga datos via botón Reporte Gremial (App 5b) → **se archiva en N6 (IS)** por usuario, sector, organización
2. Directivo acepta publicar → Grado 3 (sindicato) o Grado 4 (federación) → **se guarda en N10 Coyuntura** como publicado
3. Grado 5 (nacional) se genera automáticamente con 2+ Grado 4 → **se guarda en N10 Coyuntura** como publicado

## Archivo

Reportes anteriores a 3 meses → `archive/`
