# Historias de Simulación — Núcleo 6 Coyuntura

> **Nota**: Estos datos fueron creados como simulación para testear el sistema de informes gremiales. **No son datos reales.** Fueron eliminados de la app el 27/07/2026 para trabajar desde conversación real con la IA Sindical. Guardados aquí como registro del trabajo de diseño y testeo.

> Fuente original: `nucleo6-simulacion.md` + `monolito HTML (transcript1A-E, desarrollos)`
> Versión JSON: `2026-07-22`

---

## Fuentes Primarias (Narrativas originales del trabajador)

### fp-A — Damián, Empleado Administrativo

- **Empresa**: Vicentín SAIC
- **Sección**: Administración
- **Localidad**: Reconquista
- **Fecha**: 2026-07-01

Nos quieren hacer creer que el concurso es por crisis, pero la planta está funcionando al 80%, y si hay producción hay plata para pagar mejor. Gerencia comunicó que van a priorizar expeller sobre aceite refinado — nos dicen que es por demanda china pero yo creo que es porque expeller tiene menor retención de exportación, la empresa se ahorra impuestos. Primero bajan ritmo, después reducen turnos, después suspenden, después despiden. Y nosotros en admin también estamos preocupados porque la última paritaria todavía no se cerró bien, la empresa dice que no puede porque está en concurso, y el básico no llega a cubrir nada, yo pago 380 de alquiler en Reconquista y mi básico es 340, cómo se vive así.

---

### fp-B — Raúl, Operario de Prensa

- **Empresa**: Vicentín SAIC
- **Sección**: Prensa
- **Localidad**: Reconquista
- **Fecha**: 2026-07-01

Hola, quiero dejar registrado lo que está pasando en prensa. Esta semana nos pidieron aumentar el ritmo, 20% más de volumen por turno, dicen que hay que procesar más porque la soja que entró antes de que suba el precio hay que sacarla rápido. Pero la prensa 3 tiene una fuga, está perdiendo aceite por la junta, y mantenimiento no viene, dicen que no hay presupuesto para reparar porque la empresa está en concurso. Nosotros seguimos produciendo con la fuga, perdemos material y es peligroso, el aceite caliente en el piso, ya se cayó un compañero la semana pasada, no fue grave pero podría haber sido. Y eso de que quieren priorizar expeller lo notamos, antes refinábamos más y ahora nos dicen que el expeller es lo que sale, o sea, cambia la directiva y nosotros tenemos que adaptar sin que nos digan nada formal, solo rumores. Los EPP siguen siendo los mismos de siempre, guantes que se rompen en una semana, botas que no aguantan el aceite caliente. Sobre paritaria: la comisión interna está tratando de negociar pero la empresa responde que el concurso limita las posibilidades.

---

### fp-C — Trabajador Desmotador (Guaycurú)

- **Empresa**: Guaycurú — Desmotadora de algodón
- **Sección**: Desmotadora
- **Localidad**: Guaycurú
- **Fecha**: 2026-07-01
- **Tipo**: voz

Soy de la desmotadora de Guaycurú, trabajo en la planta de algodón. Entró algodón esta semana, menos que antes, los productores están vendiendo menos porque el precio del algodón bajó y muchos guardan esperando que suba, así que nosotros procesamos menos. La desmotadora trabaja a mitad de capacidad, solo una línea de las dos que tenemos, y eso significa menos días de trabajo para nosotros, yo esta semana trabajé 3 días y los otros 2 quedé en casa sin cobrar, porque somos contratados temporales. Y las condiciones: la desmotadora tiene polvo de algodón everywhere, te entra en los ojos, en la nariz, en la piel, y no nos dan máscaras adecuadas, solo barbijos de tela que no filtran nada.

---

### fp-D — Marinero SOMU (Puerto Reconquista)

- **Empresa**: Puerto Reconquista
- **Sección**: Marítimo
- **Localidad**: Reconquista
- **Fecha**: 2026-07-01

Trabajo en el puerto de Reconquista, SOMU, soy marinero en los barcos que cargan aceite y pellets para exportación. Esta semana tenemos un problema: hay 3 barcos esperando para cargar aceite de soja de Vicentín, pero los despachos están trabados. La empresa no está liberando los despachos rápido, parece que están esperando una decisión sobre las retenciones, hay rumor que el gobierno va a bajar las retenciones a aceite refinado y Vicentín quiere esperar para exportar con menos impuesto. SOMU está en conflicto con las empresas de cabotaje por la paritaria 2026, queremos un aumento del 15% y ofrecen 8%.

---

## Informes Grado 1 (Generados por el sistema a partir de las fuentes primarias)

### g1-A — Informe de Damián

- **Fuente**: fp-A
- **Empresa**: Vicentín SAIC, Reconquista
- **Trabajador**: Damián, Empleado administrativo, Administración
- **Estado**: pendiente_revision

**Etiquetas**:
- Paritaria, Conflicto salarial
- Estrategia de reducción, Estrategia legal
- Vivienda, Costo de vida, Canasta básica real
- Cambio de directivas, Producto final — tipo, Logística externa — entrada

**Datos duros (SIMULACIÓN)**:
| Campo | Valor | Unidad |
|-------|-------|--------|
| básico empleado | 340.000 | ARS |
| alquiler Reconquista | 380.000 | ARS |
| brecha salario-vivienda | 12% | porcentaje |
| prioridad producción | expeller | — |
| capacidad planta | 80% | porcentaje |

---

### g1-B — Informe de Raúl

- **Fuente**: fp-B
- **Empresa**: Vicentín SAIC, Reconquista
- **Trabajador**: Raúl, Operario de prensa, Prensa
- **Estado**: pendiente_revision

**Etiquetas**:
- Salud laboral, EPP, Ritmo, Accidente
- Estrategia de reducción, Concurso preventivo
- Cambio de directivas, Producto final — tipo

**Datos duros (SIMULACIÓN)**:
| Campo | Valor | Unidad |
|-------|-------|--------|
| accidentes semana | 2 | — |
| enfermería | no funcional | — |
| incremento volumen | 20% | porcentaje |
| prioridad producción | expeller | — |

---

## Correcciones Grado 2 (Delegada Marta, CI Vicentín)

### corr-g2-B-1 — Correcciones al informe de Raúl (g1-B)

- **Corrector**: Marta (Delegada CI), grado 2
- **Fecha**: 2026-07-02

| Campo | Original | Corregido | Justificación |
|-------|----------|-----------|---------------|
| enfermería | no funcional | clausurada 3 meses — violación Art. 42 CCT | Delegado verificó: clausura confirmada por comisión interna el 16/06 |
| accidentes semana | 2 | 3 | Se agregó accidente en envasadora: corte de mano |

---

### corr-g2-A-1 — Correcciones al informe de Damián (g1-A)

- **Corrector**: Marta (Delegada CI), grado 2
- **Fecha**: 2026-07-02

| Campo | Original | Corregido | Justificación |
|-------|----------|-----------|---------------|
| prioridad producción | expeller | Cambio de prioridad (refinado → expeller). Menor retención = empresa se ahorra impuestos. Concurso como situación económica — auditores evaluando activos. | Delegado especifica: concurso como situación económica, auditores confirman evaluación de activos para posible venta. |
| capacidad planta | 80% | 80% | Confirmado por delegado: planta opera al 80%, no está parada |

---

## Estructura Sectorial (Organizacional)

### Empresas

| ID | Nombre | Planta | Sectores |
|----|---------|--------|----------|
| vicentin-saic | Vicentín SAIC | Reconquista | Prensa, Refinería, Envasadora, Administración, Logística |
| guaycuru-desmotadora | Guaycurú | Guaycurú | Desmotadora 1, Desmotadora 2, Desmotadora 3, Despacho |

### Territorios

| ID | Empresa | Localidad | Delegado |
|----|---------|-----------|----------|
| vicentin-reconquista | vicentin-saic | Reconquista | Marta, Delegada (CI) |
| guaycuru | guaycuru-desmotadora | Guaycurú | Delegado desmotadoras |

> **Nota sobre Guaycurú**: La planta Guaycurú y sus condiciones específicas (1 línea de 2, temporales sin cobrar, polvo algodón sin máscaras) no están verificadas como datos reales. Eliminada del KB el 27/07/2026 por falta de fuente verificable.

---

## Test Users (Login)

| Username | Password | Grade | Nombre original | Nombre actual |
|----------|----------|-------|-----------------|---------------|
| test1a | base2026 | B.a | Tester N1 — **Raúl** (base) | Tester N1 (base) |
| test1b | adm2026 | B.a | Tester N1 — **Damián** (admin) | Tester N1 (administración) |
| test2 | del2026 | B.b | Tester N2 — Delegada | (sin cambios) |
| test3 | sec2026 | B.c | Tester N3 — Secretaría | (sin cambios) |
| test4 | fed2026 | B.d | Tester N4 — Federación | (sin cambios) |
| eljaso | hornero2026 | B.d | Eljaso | (sin cambios) |
