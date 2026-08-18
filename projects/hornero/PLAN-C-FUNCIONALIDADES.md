# Hornero — C: Funcionalidades a construir (núcleos con motor)

> Parte C / Fase 3 del [PLAN maestro](PLAN-EXPANSION-MEJORA.md). Muchos núcleos están **documentados pero sin motor**. Priorizados por valor/esfuerzo.
> **[DECISIÓN]** = definición del equipo/comité.

## C1 · Índices ("números propios")  🟢 alto valor
- **Comparador SMVM** *(adelantable — no depende del resto)*: input del salario → compara con **mínimo legal** ($ del Consejo del Salario) y con **valor constitucional** (9 necesidades, art. 116 LCT); muestra la brecha y la distribución. Más **dato/UI** que LLM → se puede hacer ya.
- **Índice ICE** (comportamiento empresarial): **[DECISIÓN] metodología de ponderación** de las 4 dimensiones (directa/condiciones/estructural/simbólica) + motor de cálculo + fuentes (balances, prensa, PIMSA/CTA-A/MATE).
- **IFT** (felicidad del trabajador): 6 dimensiones; **[DECISIÓN] ponderaciones con el comité**.
- **Cruces:** ICE×SMVM (violencia económica salarial), IFT×SMVM.

**Hecho cuando:** cada índice tiene motor real (no solo pantalla), con metodología documentada y fuente citada.

## C2 · Contenido y derecho
- **Nuestro Derecho = convenio vivo navegable** *(adelantable)*: el CCT interactivo (artículos, vigencia, enlaces), no solo chat. Se apoya en el corpus (B2).
- **Cómo Somos** (datos de clase, categorías Iñigo Carrera): ingestar INDEC/CIFRA/PIMSA/Mate → tableros (ejército activo/reserva, pauperización, fracciones).
- **Acción Sindical:** repositorio de volantes/comunicados + **barra de conflictos abiertos** en tiempo real (alimentada por el flujo de reportes / IS).
- **Tu Historia:** entrevista adaptativa que etiqueta y archiva testimonios (con protección — D3; el trabajador controla privado/anónimo/público).

## C3 · Coyuntura y multimodal
- **Clipping / InfoMate automatizados** (hoy N10 es "manual"): pipeline **recolección → clasificación por tema → marca de violencia (VD/VC) → edición** semanal/mensual.
- **Multimodal real** (cerrar lo que la demo muestra): **STT soberano** (A3), **EXIF stripping efectivo** en fotos/videos (hoy aspiracional), foto como evidencia adjunta al informe.

## Priorización sugerida
| Función | Valor | Esfuerzo | Depende de |
|---|---|---|---|
| Comparador SMVM | Alto | Bajo | — (adelantable) |
| Convenio vivo | Alto | Medio | B2 (corpus) |
| ICE / IFT (índices) | Alto | Medio-alto | [DECISIÓN] metodología + datos |
| Cómo Somos (tableros) | Medio | Medio | ingesta de fuentes |
| Clipping/InfoMate auto | Medio | Medio | B1 (clasificación) |
| Multimodal real | Alto | Medio | A3 (STT) + D3 (EXIF) |
| Tu Historia / Acción Sindical | Medio | Medio | D3 (protección) |

## Dependencias (C)
- Las que usan IA dependen de **B** (RAG+corpus) y algunas de **A3** (multimodal).
- **Adelantables sin bloqueo:** comparador SMVM y convenio vivo.

## Decisiones abiertas [DECISIÓN]
- **Metodologías de los índices** (ICE, IFT): son decisiones **político-metodológicas** del comité (sindicatos + investigadores), no solo técnicas. Documentar supuestos (como en la plantilla de proyecciones del equipo).

## Riesgos
- Definir índices sin metodología clara = números discutibles. Cerrar la metodología **antes** de mostrarlos como dato.
- No inflar de funciones: priorizar las de mayor valor para el afiliado.
