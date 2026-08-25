# Sistema ICE — Comportamiento Empresarial

**Fecha:** 25 agosto 2026
**Estado:** Diseño avanzado — dimensiones definidas, pendiente implementación

---

## 0. Núcleo 11 — Definición e interfaz

> Identificar cómo piensa y actúa el empresario. Medir si ese comportamiento debe registrarse como violencia. Un chat para pensar el problema, un índice para medirlo.

### Interfaz

Cuando el trabajador ingresa a esta sección, ve:

1. **Bloque explicativo** (arriba, fondo `#ECEAE3`): breve descripción de qué es Comportamiento Empresarial, qué mide, para qué sirve. Ícono: 🏭 o 📊. Disclaimer: "La IA propone — vos decidís, editás, aprobás"

2. **Botón principal** — **"Comportamiento Empresarial"**: entrada al sistema. Mide si el comportamiento observado debe registrarse como violencia.

3. **Chat de análisis empresarial** (zona principal): diálogo donde el trabajador puede pensar y discutir cómo entender y enfrentar al empresario. La IA responde desde el repositorio de fuentes (balances, historia empresarial, RSE, Business and Human Rights, tesis, convenios OIT, leyes laborales, manuales de administración).

4. **Índice de Comportamiento Empresarial** (zona de visualización): índice por empresa, región, rama y general que permite medir la violencia empresarial en sus dimensiones.

### Dos componentes

**Componente 1 — Chat de análisis empresarial:** espacio de diálogo donde el trabajador, delegado o secretario puede pensar el problema, analizar al empresario, identificar violencia y planificar la respuesta.

**Repositorio de fuentes del chat:**

| Fuente | Qué aporta | Ejemplo de uso |
|--------|-----------|---------------|
| Balances empresariales | Datos económicos, facturación, inversión, rentabilidad | "¿Cuánto factura Vicentín vs. qué paga en salario?" |
| Historia empresarial | Trayectoria, cambios de propiedad, crisis, expansión | "¿Cómo evolucionó La Forestal como empresa?" |
| RSE | Filantropismo, paternalismo, "buenas prácticas" | "¿La campaña de RSE de Vicentín es paternalismo o compromiso real?" |
| Business and Human Rights / UNGP | Marco de derechos humanos aplicado a empresas | "¿Violan los Principios Rectores de la ONU?" |
| Tesis de doctorado (Jasinski 2021) | Tipología de VE, casos históricos, marco teórico | "¿Cómo clasificamos esto según la tipología?" |
| El Encanto del Tanino | Historia de La Forestal, violencia en territorio | "¿Qué pasó en Villa Ana con la empresa?" |
| Convenios OIT | Libertad sindical (87, 98), salud laboral (155, 187), trabajo forzado (29) | "¿Esto viola el Convenio 87?" |
| Leyes laborales / LCT | Normativa nacional, convenios colectivos | "¿Qué dice la LCT sobre esto?" |
| Manuales de administración | Estrategia patronal, management, organización del trabajo | "¿Cómo piensa el empresario según la teoría de management?" |

**Referencia:** los aceiteros tienen un equipo de abogados que hace análisis de balances empresariales. El chat debe poder hacer algo similar — pero desde la perspectiva del trabajador, no del empresario.

**Componente 2 — Índice de Comportamiento Empresarial:** índice compuesto que se visualiza por empresa, región, rama y general. Ver sección 12 (Fórmula y metodología).

### Flujo de datos — desde Reporte Gremial

La información cargada por los trabajadores en **Reporte Gremial** y revisada por instancias superiores se procesa y aparece por empresa y sector en el Índice de Comportamiento Empresarial.

```
Reporte Gremial (5b)                    Comportamiento Empresarial (5i/11)
─────────────────────                  ──────────────────────────────────
Observación grado 1 (trabajador)        │
    → etiquetado automático             │
        → tags: dimensiones CE          │
                                        ↓
Informe grado 2 (delegado)              │
    → confirma, modifica,               │
      agrega intensidad                 │ → ICE-empresa
                                        │ → ICE-sector
Informe grado 3 (secretario general)    │ → ICE-región
    → consolida, interpreta             │ → ICE-general
                                        │
Carga espontánea de trabajadores        │
    → revisa delegado/secretario        │
    → se integra al Índice              │
```

### Espacio de carga espontánea

Además del flujo desde Reporte Gremial, Comportamiento Empresarial tiene un **espacio para carga y sugerencia de material**:

1. **Cargar informes:** la organización carga informes de VE, balances, datos empresariales, análisis. Se procesa y alimenta el repositorio.
2. **Sugerir material:** cualquier trabajador puede sugerir fuentes — un artículo, un balance, un informe, una noticia. Se revisa y se integra.
3. **Explicar situaciones vividas:** los trabajadores pueden describir espontáneamente situaciones que experimentaron. Se procesa, se etiqueta, se analiza, y aparece en el Índice.

### Conexión con otros núcleos

- **N6 (IS):** las etiquetas de IS alimentan directamente las dimensiones del Índice. Los informes grado 2-3-4 son fuente primaria.
- **N7 (Nuestro Derecho):** convenios, leyes, CCT — el marco jurídico que define obligaciones.
- **N8 (HO):** la historia de VE — cómo las empresas han usado violencia históricamente.
- **N9 (Cómo Somos):** qué fracciones de clase sufren qué dimensión de VE.
- **N10 (Coyuntura):** clipping semanal como fuente → cuando detecta VDH-BHR, routea a N11.
- **N2 (Laboratorio):** el etiquetador de VE es un producto del Laboratorio.
- **N5b (Reporte Gremial):** fuente primaria de datos.
- **N13 (Felicidad / IFT):** ICE×SMVM alimenta directamente el IFT.

### Repositorio del núcleo

Qué datos trabaja este núcleo. Todos los núcleos consumen la librería base (N2) — taxonomía, pipeline, stack, formatos de salida, categorías morfológicas, reglas de protección. Lo específico de N11 va aquí.

- **Repositorio:** Informes VE de federaciones (mensuales), datos de IS (N6 — etiquetas Familia 1 conflicto, Familia 2 condiciones, Familia 4 estrategia patronal), convenios y leyes (N7/Nuestro Derecho), datos salariales (SMVM + convenio + canasta básica), jurisprudencia DDHH, **información empresarial (balances, registros públicos, datos corporativos, inversión/desinversión, reestructuración)**, **tesis de doctorado (Jasinski 2021)**, **El Encanto del Tanino**, **convenios OIT**, **Business and Human Rights / UNGP**, **análisis de RSE**, **manuales de administración y management**, **librería BHR** (biblioteca sobre espectro de severidad RSE→BHR→complicidad→crímenes intl.→crímenes econ. C/H — ver `../../empresas-violencia-justicia/sources/LIBRERIA-BHR-violencia.md`), **routing de noticias VDH-BHR desde N10 Coyuntura**
- **Corpus:** Casos de VE etiquetados por dimensión, informes VE mensuales de federaciones, datos salariales sectoriales, series IVE×SMVM dinámicas, **balances empresariales organizados por empresa/sector/período**, **datos de estrategia patronal**, **discursos y apariciones públicas de empresarios**, **informes de RSE y filantropismo**
- **Fuente primaria:** Informes de violencia empresarial producidos por federaciones, observaciones IS que detectan VE, datos SMVM del INDEC, convenios con escalas salariales (N7/Nuestro Derecho), **balances y registros públicos de empresas, datos del INDEC sobre empresas, información financiera sindical**, **carga espontánea de trabajadores** (situaciones vividas, material sugerido)
- **Corpus de fine-tuning (N2):** Corpus VE etiquetado — cada caso clasificado por dimensión, sector, intensidad, correlación salarial — para entrenar el etiquetador VE y el detector de correlaciones IVE×SMVM.

---

## 1. Dos esqueletos, dos funciones

La APP tiene dos sistemas de clasificación distintos que no se reemplazan ni se superponen:

### Esqueleto RAG — ¿qué tipo de producción es este material?

Define dónde vive en la Biblioteca y cómo se organiza. Las categorías actuales cumplen esa función:

| Categoría RAG | Qué contiene |
|---------------|-------------|
| Académico | Libros, papers, efemérides de Historia Obrera |
| Prensa gremial | Periódicos sindicales, comunicados, volantes |
| Noticias | Clipping, prensa comercial, agencias |
| Documentos | CCT, paritarias, SMVM, condiciones |
| Audiovisual | Podcasts, videos, docuficción |

Este esqueleto organiza el **contenedor** (el tipo de documento). No cambia con el nuevo sistema.

### Esqueleto de información — ¿de qué trata este contenido?

Las 4 variables macro (tipo_hecho, sector, actores, dimensión) analizan el **contenido** de cualquier pieza de información, sin importar de qué tipo de producción provenga. Aplica a todo: clipping, reporte gremial, archivo, biblioteca, denuncias, actas.

Un mismo documento tiene ambas clasificaciones:

```
CCT 147/75
  RAG:      tipo = "documento", category = "documentos"         ← cómo se organiza
  Info:     tipo_hecho = "paritaria", dimension = "remuneracion" ← qué dice

Nota del clipping sobre FATE
  RAG:      tipo = "noticias", category = "noticias"            ← cómo se organiza
  Info:     tipo_hecho = "lock-out", dimension = "condiciones_de_trabajo" ← qué dice
```

---

## 2. Arquitectura de dos capas (sobre el esqueleto de información)

### Capa 1 — Etiquetamiento (universal)

Toda información que entra a la APP se etiqueta con las 4 variables macro, sin importar su procedencia ni para qué se vaya a usar después. El etiquetamiento no presupone el ICE — simplemente organiza la información de forma que cualquier análisis posterior pueda operar sobre ella.

**Un libro no es un evento — es un contenedor.** La ficha mínima se aplica a pasajes relevantes, no a libros enteros. El capítulo 3 de un libro sobre CCT que describe la paritaria aceitera de 2024 tiene tipo_hecho, dimensión, actores, acciones. El libro como objeto total no.

**Dos modos de etiquetamiento:**

| Modo | Qué se etiqueta | Cuándo | Cómo |
|------|-----------------|--------|------|
| **Automático** (flujo vivo) | Noticias del clipping, informes gremiales, denuncias | Al entrar al sistema | Pipeline LLM + revisión humana |
| **A demanda** (a pedido) | Pasajes de libros, capítulos de CCT, chunks del RAG existente | Cuando la APP lo necesita (una consulta, un cálculo del ICE, un indicador de Panorama) | Se etiqueta el pasaje relevante; queda disponible para siempre |

El etiquetamiento a demanda crece orgánicamente, impulsado por el uso real. Cada pasaje etiquetado se acumula — el próximo trabajador que pregunte sobre el mismo tema ya lo encuentra etiquetado.

### Capa 2 — Análisis (múltiples salidas)

La APP procesa la información etiquetada según la pregunta que se le haga:

| Salida | Qué hace | Con qué filtra |
|--------|----------|----------------|
| **ICE** | Calcula comportamiento empresarial por empresa, dimensión, período | `categoría = comportamiento_empresarial` |
| **Chats IA** | Mejora recuperación RAG — las etiquetas enriquecen el search | todas las categorías |
| **Panorama** | Visualiza índices, tendencias, comparaciones | según el índice |
| **IFT / IHO** | (futuro) Índice de Fuerza de Trabajo, Índice de Felicidad Obrera | categorías + dimensiones específicas |

El mismo dato etiquetado alimenta todo. Lo que cambia no es el dato sino la pregunta.

---

## 3. Las 4 variables macro — esqueleto integral para toda la app

Toda unidad de información de la APP se etiqueta con las mismas 4 variables, sin importar de qué categoría se trate. Lo que cambia entre categorías es el contenido específico de cada variable, no la estructura.

### a) Hecho

- `tipo_hecho` — vocabulario controlado: el tipo de evento reconocible (paritaria, maltrato empresarial, accidente laboral, cierre de planta, inspección, etc.)
- `acciones` — array de acciones dentro del hecho (ver detalle abajo)
- `duracion` — instantáneo / acotado (días-semanas) / prolongado (meses-años) / permanente-estructural

**`tipo_hecho` vs `tipo_accion`** — son niveles distintos:

- `tipo_hecho` = de qué se trata el evento (paritaria, maltrato empresarial, accidente laboral...)
- `tipo_accion` = qué hizo cada actor dentro de ese evento (comunicado de presión, rechazo de oferta, maltrato verbal, obligación de trabajar en condiciones inseguras...)

Un mismo hecho puede tener varias acciones, porque un evento real casi siempre involucra a múltiples actores haciendo cosas distintas.

**`duracion`** complementa a la dimensión transversal `reiteracion`: `reiteracion` dice si el mismo tipo de hecho se repite (¿es un patrón?); `duracion` dice cuánto se extiende un hecho único (¿un despido puntual, o una política sostenida durante meses?). Son dos ejes independientes.

### b) Sector

- `sector_economico` — agroindustria, forestal, metalúrgico, etc.
- `rama` — subdivisión específica dentro del sector

El sector vive en el evento, no solo en el actor — porque un mismo actor puede operar en más de un sector, y un hecho concreto ocurre en una rama específica de esa operación.

### c) Actores — tres categorías con estructura propia

Se reemplaza el campo `tipo` plano por tres categorías de actor con datos distintos:

- **a) Actor empresarial** — organización, grupo económico, empresa, o sujeto individual dentro de la empresa (subtipo: directivo, gerente, capataz, dueño). Incluye grupo económico, filiales, personal directo/indirecto.
- **b) Actor gremial/político** — organización política, federación, sindicato, o sujeto individual (subtipo: delegado, dirigente, afiliado).
- **c) Actor estatal/institucional** — Estado, organismo público (ministerio de trabajo, justicia), institución.

Un mismo hecho frecuentemente involucra actores de varias categorías, con roles distintos (quién actuó, quién denunció, quién intervino). El campo `rol` funciona igual para las tres categorías: ejecutor, responsable, denunciante, afectado, etc.

### d) Dimensión — el eje sustantivo del hecho

La variable más importante: **generaliza y reemplaza el antiguo "borrador de dimensiones del ICE"**, que estaba armado exclusivamente para Comportamiento Empresarial. Ahora la dimensión es aplicable a cualquier hecho de cualquier categoría.

Las 5 dimensiones definitivas:

| Dimensión | Polo negativo (Jasinski) | Polo positivo (Kliksberg) |
|-----------|--------------------------|---------------------------|
| **Remuneración** | VE laboral: incumplimiento salarial; VE cultural: discrecionalidad en recompensas | 1.1 Equidad remunerativa, salarios dignos, 1.3 estabilidad |
| **Condiciones de trabajo** | VE laboral: control externo del ritmo, ritmos abusivos, accidentes, enfermedades; VE cultural: miedo al despido, estigmatización, naturalización de exigencias; VE represiva: amenazas, castigos, maltrato | 2.1 Consenso en producción, 2 estructuras participativas, 1.3 participación del trabajador, S&H |
| **Estrategias de producción** | VE estructural: tercerización fraudulenta, responsabilidad por cadena de proveedores no asumida | 5.3-5.4 Responsabilidad extendida a proveedores, auditoría de cadena, horizontalidad |
| **Estrategias de realización** | VE silente: producto nocivo, publicidad engañosa, precios abusivos; priorización del beneficio económico sobre la necesidad del consumidor | 4 Juego limpio con el consumidor, calidad, trazabilidad, producto saludable; priorización de la satisfacción y bienestar del usuario/consumidor |
| **Medio social** | VE silente: daño al medio social del territorio, opacidad, captura de instituciones; VE estructural: dependencia del territorio, concentración de poder económico local | 5 Protección ambiental, 3 transparencia, 3.2 responsabilidad fiscal, 6 integración social |

**Medio social** no es solo "daño ambiental" — es la relación general entre el peso económico/productivo de la empresa y la región/comunidad: empleo, infraestructura, poder político local, captura institucional, daño ambiental.

**Decisiones que estas 5 dimensiones resuelven:**
- "Control psicológico" y "Organización del trabajo" se fusionan en **Condiciones de trabajo** — como Kliksberg mismo las trata en su pilar 1
- "Cadena productiva y tercerización" pasa a **Estrategias de producción** — la tercerización es una decisión de producción, no un impacto territorial
- "Relación con el consumidor" pasa a **Estrategias de realización** — cómo la empresa realiza el valor: priorizando beneficio o priorizando necesidad/bienestar
- "Relación con la actividad gremial" no necesita ser dimensión aparte: emerge al cruzar cualquier dimensión con la presencia de un actor gremial

**Violencia estructural:** no es una dimensión — es un **modificador de contexto** que vive como propiedad del actor empresarial (ver sección 6). Amplifica el peso de los eventos en las otras dimensiones, pero no se cuenta como etiqueta par.

---

## 4. Lente transversal: lectura de violencia cultural

La narrativa de un evento no es una 6ta dimensión paralela — **es el mecanismo mismo de la violencia cultural**. Jasinski define violencia cultural como "la instalación de un pensamiento unidimensional" y "la naturalización de la violencia". Eso no es un hecho material: es una operación discursiva.

Un despido de delegado narrado como "ajuste operativo necesario" es un hecho de violencia represiva + un hecho de violencia cultural simultáneo. La violencia represiva es el despido; la violencia cultural es la narrativa que lo naturaliza.

Por eso la lectura de violencia cultural es un **lente transversal** aplicable a cualquier dimensión:

| Dimensión factual | Hecho | Lectura de violencia cultural (narrativa) |
|---|---|---|
| Remuneración | Empresa ofrece aumento debajo de la inflación | Comunicado: "incremento significativo del 40%" |
| Condiciones de trabajo | Control externo del ritmo productivo | Discurso gerencial: "trabajo por objetivos = autonomía" |
| Medio social | Empresa monopoliza empleo en la región | Medios locales: "motor de la economía regional" |
| Estrategias de producción | Tercerización hacia contratista sin cobertura | Nota: "modernización de la cadena productiva" |
| Estrategias de realización | Producto con componentes nocivos evitables | Publicidad: "alimento nutritivo para tu familia" |

La lectura cultural se aplica **por acción**, no por evento — porque un mismo hecho puede tener acciones que naturalizan la violencia y acciones que la exponen.

**Violencia cultural es simultáneamente un tipo de violencia (entre las 5 de Jasinski) y una propiedad transversal** que puede estar presente en eventos de cualquier tipo. Un despido es represiva + cultural; un accidente silenciado es silente + cultural; una prensa con fuga donde se dice "no seas exagerado" es laboral + cultural.

---

## 5. Comportamiento Empresarial: dos marcos teóricos

### Marco negativo — Pablo Jasinski: 5 violencias empresariales

1. **Violencia estructural** — desigualdad sistémica derivada de la posesión de los medios de producción; forma de base sobre la que se montan las demás, de carácter sistémico y no episódico.
2. **Violencia represiva** — daños físicos o psicológicos por el autoritarismo de la relación jerárquica: agresiones, amenazas, castigos, humillaciones, espionaje laboral, listas negras, entrega de información a fuerzas represivas, financiación de la represión.
3. **Violencia cultural** *(normalización de la violencia)* — proceso que lleva a interiorizar el miedo al despido, a las suspensiones y rotaciones; control psicológico por la discrecionalidad en la distribución de recompensas, etiquetamiento, estigmatización e instalación de un pensamiento unidimensional.
4. **Violencia silente** — prácticas fundadas en el poder económico y motivadas por la ganancia, reñidas con el principio de legalidad vigente, que atentan contra las personas, las instituciones y el medio social.
5. **Violencia laboral** *(violencia del trabajo)* — afecciones a la salud mental y física obrera como efecto necesario de la organización de la producción, la división del trabajo, el control externo del ritmo, los abusos de contrato y las condiciones laborales; incluye accidentes y enfermedades laborales.

**Decisión clave:** Violencia estructural no es una etiqueta contable más — es un **modificador de contexto** que amplifica el peso de las otras 4. No se cuenta igual que un despido de delegado; describe la condición sistémica que hace posibles los eventos.

### Marco positivo — Bernardo Kliksberg: buenas prácticas empresariales

Premisa: dentro del propio sistema capitalista existe la irresponsabilidad empresarial como fenómeno posible y recurrente; la RSE no es filantropía optativa sino la forma en que una empresa puede ser exitosa sin producir los daños que documenta Jasinski. Buenas Prácticas y Violencia Empresarial no son dos fenómenos de naturaleza distinta, sino dos resultados posibles dentro del mismo sistema.

**Pilares de Kliksberg:**

1. **"Empezar por casa" — políticas de personal**: salarios dignos, formación, confianza interna, eliminación de discriminación, conciliación familia-empresa, protección de la salud
   - 1.1 Equidad remunerativa vs. políticas del miedo
   - 1.2 Protección de la salud (antitabaco, actividad física, estrés)
   - 1.3 Normas equitativas ampliadas (remuneración, ascenso, estabilidad, participación)
   - 1.4 Cultura familiarmente responsable
2. **Estructuras participativas y horizontales**: círculos de calidad, equipos autogestionados, canales de consulta
   - 2.1 Consenso en la producción vs. modelo taylorista
3. **Transparencia y buen gobierno corporativo**: información pública y continua, control de órganos de dirección, proporcionalidad en remuneraciones ejecutivas
   - 3.1 Transparencia como prevención de corrupción y monitoreo colectivo
   - 3.2 Responsabilidad fiscal
4. **Juego limpio con el consumidor**: calidad, precios razonables, productos saludables, publicidad no engañosa
   - 4.1 Productos saludables — caso industria alimenticia
5. **Protección del medio ambiente**: operación limpia + colaboración con agenda ambiental
   - 5.1 Prácticas ambientales concretas (emisiones, vertidos, deforestación, biodiversidad, economía circular)
   - 5.2 Triple balance (social/económico/ecológico)
   - 5.3 Responsabilidad en cadena de proveedores (caso Apple/Foxconn)
   - 5.4 Responsabilidad y transparencia en la cadena de producción — como principio general
6. **Integración a los grandes temas sociales**: alianzas con políticas públicas, aporte de capacidades (no solo dinero), continuidad
   - 6.1 Voluntariado corporativo
7. **No practicar un doble código de ética**: mismo estándar de RSE en casa matriz y filiales
8. **Respuesta y remediación ante violaciones detectadas**: cómo reaccionó la empresa cuando los hechos salieron a la luz (auditoría externa, consulta a trabajadores, reformas concretas, eliminación de figuras encubiertas)

**Requisitos de genuinidad de la RSE** (criterio transversal, aplica a cualquier pilar):
- Asignación real de recursos
- Involucramiento de los cuadros directivos
- Acción basada en necesidades reales
- Ejecución adecuada y sostenida

**RSE declarada vs. RSE verificada:** toda buena práctica debe distinguirse entre lo que la empresa comunica (discurso institucional) y lo que se puede constatar (práctica verificable). La genuinidad es el instrumento operativo de esta distinción.

**Pacto Global de la ONU — referencia, no dimensión:** los 10 principios del Pacto Global no se incorporan como categoría o dimensión del índice. Sirven como **marco de referencia externo** para pensar qué cuenta como buena práctica (y, por inversa, qué cuenta como mala práctica). El principio 3 (libertad sindical) ilumina qué implica una buena práctica en relación gremial; el principio 6 (no discriminación) ilumina qué implica en políticas de personal; etc. Pero no es una dimensión del ICE.

---

## 5b. Marco teórico: genealogía de la tipología

La tipología se construye a partir de tres tradiciones:

1. **Galtung** — Triángulo de la violencia: directa, estructural, cultural. La violencia atenta contra la autorrealización humana (satisfacción de necesidades básicas, materiales y no materiales). La violencia directa es "destrucción corporal repentina, física o psicológica"; la estructural "impide la satisfacción de necesidades mediante la explotación, penetración, fragmentación y marginación"; la cultural "aporta el marco legitimador y niega la existencia de necesidades".

2. **Almeida** — Tipología específica para el ámbito laboral: violencias física, económica, psicológica, simbólica y política, seguidas de sus formas de normalización (naturalización). Distingue entre violencias que ocurren *en* el trabajo y violencias *del* trabajo.

3. **Sutherland** — Delito de cuello blanco empresarial: antisindical, negación/interferencia/restricción de convenios colectivos, coerción, discriminación, intimidación, espionaje, violencia física (gases, golpizas).

La tesis integra también:
- **"Prácticas empresariales represivas"** (Informe Responsabilidad Empresarial, Argentina): espionaje, entrega de información de trabajadores a fuerzas represivas, vinculación secuestro/desaparición con despido, financiación de la represión, formación de policías privadas.
- **Gilly**: "puesta en libertad sin mediaciones del despotismo industrial".
- **Hirsch**: "reprivatización de la violencia coercitiva física" por las clases dominantes.
- **Dejours** y **Faria/Meneghetti**: banalización de la injusticia social, miedo al despido, control psicológico, interiorización de normas.

**La reorganización en dimensiones mantiene estas tradiciones pero las reordena operativamente:**
- Galtung: directa → **Directa**, estructural → **Estructural**, cultural → **Simbólica**
- Almeida: física/política → **Directa**, económica → **Estructural**, psicológica → **Directa** + **Simbólica**, simbólica → **Simbólica**
- Sutherland: antisindical/coerción/intimidación/espionaje → **Directa**, violación convenios → **Estructural** + **Directa**

---

## 6. Tipología detallada: sub-tipos de violencia y buenas prácticas

> Los sub-tipos con códigos (D-1a, CT-1b, etc.) provienen de la tipología original de 4 dimensiones (Directa, Condiciones de Trabajo, Estructural, Simbólica). El sistema actual de 5 dimensiones (sección 3d) los reorganiza. Esta sección conserva los códigos como referencia detallada y agrega el mapeo a las 5 dimensiones vigentes.

### 6.1 Mapeo: 4 dimensiones originales → 5 dimensiones vigentes

| Dimensión original (4 dim) | Dimensión vigente (5 dim) | Sub-tipos que migran | Nota |
|---|---|---|---|
| **Directa** | **Condiciones de trabajo** | D-1a–D-1d, D-1e–D-1h, D-1k–D-1n | La violencia directa afecta las condiciones en que se trabaja |
| **Directa** | **Remuneración** | D-1j | Multas/sanciones disciplinarias que impactan salario |
| **Directa** | **Estrategias de producción** | D-1i | Lockout como decisión de paralización productiva |
| **Directa** | **Medio social** | D-2a–D-2d | Paternalismo/RSE/filantropismo: impacto en comunidad e imagen |
| **Condiciones de Trabajo** | **Condiciones de trabajo** | CT-1a–CT-1i, CT-2a–CT-2d | Coincidencia directa: la dimensión se preserva |
| **Estructural** | **Remuneración** | E-1b, E-1d, E-2a, E-2d | Salario insuficiente, no pago convenio, distribución equitativa, salario sobre SMVM |
| **Estructural** | **Condiciones de trabajo** | E-1c, E-1e | Precarización contractual, súper-explotación |
| **Estructural** | **Estrategias de producción** | E-1f, E-1j, E-2b | Tercerización, deslocalización, contratación directa |
| **Estructural** | **Medio social** | E-1a, E-1g, E-1h, E-1i, E-2c, E-2e | Propiedad concentrada, cierre/relocalización, concurso, ocultar info, inversión territorio, transparencia |
| **Simbólica** | **Lente transversal (sección 4)** | S-1f–S-1h | Normalización, consentimiento aparente, pensamiento unidimensional → lectura cultural |
| **Simbólica** | **Condiciones de trabajo** | S-1a, S-1c, S-2c | Mal trato cotidiano, respuestas agresivas, respeto simbólico |
| **Simbólica** | **Medio social** | S-1b, S-1d, S-1e, S-1i, S-1j, S-2a, S-2b | Discurso público, racismo, fronteras, fragmentación + buenas prácticas simbólicas |

**Principio:** un sub-tipo puede mapear a más de una dimensión vigente cuando su contenido factual toca más de un eje. La clasificación primaria es la dimensión donde tiene manifestación más directa; las secundarias se registran como conexiones.

### 6.2 Dimensión Directa — sub-tipos

**Definición original:** Las acciones directas del empresario contra los trabajadores — y las "buenas prácticas" que usa como contraparte. Aquí se mide la violencia directa: amenazas, malos tratos, espionaje, lockout, multas, represión estatal o privada, despidos disciplinarios, sanciones. Pero también se miden las prácticas de paternalismo, filantropismo, RSE, que permiten balancear las buenas prácticas.

#### Sub-tipos de violencia directa

| Código | Sub-tipo | Descripción | Ejemplo caso | Dimensión vigente (5 dim) |
|--------|----------|-------------|-------------|---------------------------|
| D-1a | Represión industrial | Acción violenta directa contra trabajadores dentro o alrededor de la planta | Ford Argentina (1976): secuestros dentro de la fábrica | Condiciones de trabajo |
| D-1b | Agresión física | Golpizas, uso de gases, disparos, agresión directa | Sutherland: "brutal golpiza", gases | Condiciones de trabajo |
| D-1c | Masacre | Homicidio múltiple de trabajadores | La Forestal (1921), Bananeras (1928), Napalpí (1924) | Condiciones de trabajo |
| D-1d | Secuestro/detención | Privación ilegítima de libertad vinculado a la empresa | Ford: trabajadores secuestrados en planta | Condiciones de trabajo |
| D-1e | Policía/seguridad privada violenta | Fuerzas de seguridad contratadas por la empresa | La Forestal: gendarmería privada | Condiciones de trabajo |
| D-1f | Financiamiento de violencia externa | Empresa paga/facilita grupos violentos | Chiquita: financiamiento AUC paramilitar | Condiciones de trabajo |
| D-1g | Amenaza / intimidación | Amenaza explícita o implícita de despido, represalia, exclusión | Vicentín: rumor de despidos si baja ritmo | Condiciones de trabajo |
| D-1h | Espionaje laboral | Vigilancia de trabajadores, listas negras, control ideológico | Ford: listas de "subversivos" entregadas a dictadura | Condiciones de trabajo |
| D-1i | Lockout | Cierre patronal como medida de lucha (ofensivo/defensivo/político) | La Forestal: lockout ofensivo 1936-43 | Estrategias de producción |
| D-1j | Multas / sanciones disciplinarias | Penalizaciones económicas o administrativas como control | Multas por "llegar tarde", suspensiones disciplinarias | Remuneración |
| D-1k | Despidos disciplinarios | Despido como castigo, no como ajuste | Despedir al delegado por "organizar" | Condiciones de trabajo |
| D-1l | Malos tratos / humillación | Reprimendas, castigos, humillaciones como control | Supervisor que insulta, castigo público | Condiciones de trabajo |
| D-1m | Represión legalizada | Uso de la ley para justificar violencia (retenciones, suspensiones "legales") | La Forestal: gendarmería con respaldo legal | Condiciones de trabajo |
| D-1n | Antisindicalismo jurídico | Prácticas que niegan, interfieren o restricten la organización sindical | Sutherland: antisindical, negación de convenios | Condiciones de trabajo |

#### Sub-tipos de buenas prácticas (para balancear)

| Código | Sub-tipo | Descripción | Nota crítica | Dimensión vigente (5 dim) |
|--------|----------|-------------|-------------|---------------------------|
| D-2a | Paternalismo | Beneficios otorgados desde arriba, sin negociación | También es control: crea dependencia. VE-4c: "control por repertorio de recompensas" | Medio social |
| D-2b | Filantropismo | Donaciones, sponsorships, inversión "social" | También legitima: "somos buenos". Management de reputación | Medio social |
| D-2c | RSE | Programas corporativos de "impacto positivo" | También es imagen. Puede ser fachada o compromiso real — se registra, se evalúa | Medio social |
| D-2d | Buenas prácticas reconocidas | Certificaciones, estándares, compliance, reconocimiento público | ¿Reales o de fachada? Se registran para balancear, no para absolver | Medio social |

#### Mapeo a etiquetas IS

| Familia IS | Etiqueta | Sub-tipos Directa |
|-----------|----------|-------------------|
| 1 — Conflicto laboral | Conflicto violento | D-1a, D-1b, D-1c, D-1d |
| 1 — Conflicto laboral | Presión patronal | D-1g, D-1l |
| 2 — Condiciones de trabajo | Violación convenio | D-1j (sanciones no previstas) |
| 4 — Estrategia patronal | Policía/seguridad | D-1e, D-1f |
| 4 — Estrategia patronal | Estrategia de presión sindical | D-1g, D-1l |
| 4 — Estrategia patronal | Estrategia de reducción | D-1i, D-1k |
| 4 — Estrategia patronal | Espionaje | D-1h |
| 4 — Estrategia patronal | RSE / filantropismo | D-2a, D-2b, D-2c |

#### ¿Es violación a derechos humanos?

| Sub-tipo Directa | ¿Es VDH? | Marco jurídico |
|------------------|----------|----------------|
| D-1a a D-1f (represión, agresión, masacre, secuestro, policía, financiamiento) | **Siempre** | DUDH 3, 5, 9; PIDCP 6, 7; Estatuto Roma 7; Convenio OIT 87 |
| D-1g (amenaza) | **Parcialmente** — sistemática + daño documentable → sí | DUDH 5; PIDESC 12; Convenio OIT 87 |
| D-1h (espionaje) | **Sí** | DUDH 12 (privacidad); Convenio OIT 87 (libertad sindical) |
| D-1i (lockout ofensivo) | **Sí** | Convenio OIT 87 (libertad sindical) |
| D-1j (multas/sanciones) | **Depende** — si viola CCT → sí | UNGP 23; CCT específico |
| D-1k (despidos disciplinarios antisindicales) | **Sí** | Convenio OIT 87, 98 |
| D-1l (malos tratos) | **Parcialmente** — sistemático → sí | DUDH 5; PIDESC 12 |
| D-1m (represión legalizada) | **Sí** | PIDCP 2.3; DUDH 8; UNGP 23-28 |
| D-1n (antisindicalismo) | **Siempre** | Convenio OIT 87, 98 |

**Buenas prácticas:** las buenas prácticas (D-2a a D-2d) no son VDH por sí mismas — pero pueden ocultar VDH. El paternalismo puede coexistir con violaciones de libertad sindical. Se registran para balancear, no para evaluar DDHH.

### 6.3 Dimensión Condiciones de Trabajo — sub-tipos

**Definición original:** Condiciones de trabajo que, por la organización de la producción, la división del trabajo, el control del ritmo, o la infraestructura, producen daño a la salud o riesgo de accidente. Es la violencia "del" trabajo (no solo "en" el trabajo) — la que está inscripta en la estructura misma de la relación laboral.

#### Sub-tipos de violencia en condiciones de trabajo

| Código | Sub-tipo | Descripción | Ejemplo caso | Dimensión vigente (5 dim) |
|--------|----------|-------------|-------------|---------------------------|
| CT-1a | Accidentes laborales | Accidente causado por decisión empresarial consciente de operar con riesgo | Vicentín: fuga prensa 3 (3 semanas sin reparar) → accidente | Condiciones de trabajo |
| CT-1b | Condiciones inseguras | Operar con riesgos no mitigados (fugas, maquinaria sin mantenimiento) | Vicentín: prensa 3 con fuga 3 semanas | Condiciones de trabajo |
| CT-1c | EPP insuficiente | Equipamiento de protección personal inadecuado, insuficiente, o no provisto | Vicentín: guantes rotos 1 semana; Guaycurú: barbijos de tela vs. polvo algodón | Condiciones de trabajo |
| CT-1d | Infraestructura de salud laboral ausente | Enfermería clausurada, sin servicio médico en planta | Vicentín: enfermería clausurada 3 meses | Condiciones de trabajo |
| CT-1e | Ritmo abusivo | Aumento de ritmo sin consulta, sin compensación, sin evaluación de impacto | Vicentín: +20% volumen por turno | Condiciones de trabajo |
| CT-1f | Enfermedades laborales | Condiciones insalubres, exposición biológica/química sin protección | Guaycurú: polvo algodón sin máscaras | Condiciones de trabajo |
| CT-1g | Alienación por organización del trabajo | División del trabajo, control del ritmo, espionaje laboral que produce alienación | Almeida: organización de producción como violencia | Condiciones de trabajo |
| CT-1h | Miedo al despido | Control mediante la perpetuación del miedo (Dejours: "banalización de la injusticia social") | La Forestal: miedo como disciplina | Condiciones de trabajo |
| CT-1i | Cambios sin comunicación | Decisiones que afectan trabajadores comunicadas solo verbalmente, por rumor, sin circular formal | Vicentín: cambio de directivas comunicado solo verbalmente | Condiciones de trabajo |

#### Sub-tipos de buenas prácticas

| Código | Sub-tipo | Descripción | Dimensión vigente (5 dim) |
|--------|----------|-------------|---------------------------|
| CT-2a | Programas de salud | Prevención, vigilancia médica, seguimiento | Condiciones de trabajo |
| CT-2b | Seguridad certificada | Normas ISO, auditorías, cumplimiento | Condiciones de trabajo |
| CT-2c | Enfermería/servicio médico operativo | Personal médico en planta, acceso permanente | Condiciones de trabajo |
| CT-2d | EPP completo y actualizado | Equipamiento adecuado, provisto sin costo | Condiciones de trabajo |

#### Mapeo a etiquetas IS

| Familia IS | Etiqueta | Sub-tipos CT |
|-----------|----------|-------------|
| 2 — Condiciones de trabajo | Salud laboral / accidentes | CT-1a, CT-1f |
| 2 — Condiciones de trabajo | EPP / equipamiento | CT-1c |
| 2 — Condiciones de trabajo | Ritmo de producción | CT-1e |
| 2 — Condiciones de trabajo | Violación convenio | CT-1d (Art. 42 enfermería), CT-1i (circular formal) |
| 9 — Producción | Mantenimiento — estado/emergencia | CT-1b |
| 9 — Producción | Cambio de directivas | CT-1i |
| 1 — Conflicto laboral | Precarización | CT-1h (miedo → aceptar condiciones) |

#### ¿Es violación a derechos humanos?

| Sub-tipo CT | ¿Es VDH? | Marco jurídico |
|-------------|----------|----------------|
| CT-1a (accidentes por negligencia) | **Sí** — cuando empresa opera conscientemente con riesgo | PIDESC 7.b, 12; DUDH 3 |
| CT-1b (condiciones inseguras) | **Sí** — sistemáticas | Convenio OIT 155, 187; PIDESC 7.b |
| CT-1c (EPP insuficiente) | **Sí** — sistémico | Convenio OIT 155; PIDESC 7.b, 12 |
| CT-1d (infraestructura ausente) | **Sí** — viola CCT | CCT Art. 42; PIDESC 7.b |
| CT-1e (ritmo abusivo) | **Parcialmente** — cuando produce daño documentable | PIDESC 7.b; Convenio OIT 155 |
| CT-1f (enfermedades laborales) | **Sí** | PIDESC 12; Convenio OIT 155, 187 |
| CT-1h (miedo al despido) | **Parcialmente** — cuando sistemático | DUDH 5; PIDESC 12 |
| CT-1i (cambios sin comunicación) | **Sí** — viola derecho a información | Convenio OIT 135, 144 |

**Umbral:** la violencia en condiciones de trabajo es VDH cuando la empresa conscientemente opera con riesgo y no mitigation → violación a derecho a la vida y salud; cuando EPP insuficiente es sistémico → violación; cuando enfermería clausurada viola CCT → violación contractual + potencial DDHH.

### 6.4 Dimensión Estructural — sub-tipos

**Definición original:** La violencia que está en la estructura — la propiedad empresarial, la distribución de la riqueza (retribución salarial), la tercerización, los efectos del cierre o relocalización. Se analiza con balances empresariales, datos salariales, información corporativa.

#### Sub-tipos de violencia estructural

| Código | Sub-tipo | Descripción | Ejemplo caso | Dimensión vigente (5 dim) |
|--------|----------|-------------|-------------|---------------------------|
| E-1a | Propiedad empresarial concentrada | Concentración de capital, grupos económicos, accountability limitada | Vicentín: grupo family-owned | Medio social |
| E-1b | Retribución salarial insuficiente | Salario que no cubre necesidades básicas; análisis de balances vs. salario real | Vicentín: básico $340.000, alquiler $380.000 | Remuneración |
| E-1c | Precarización contractual | Contratos temporales, sin estabilidad, sin protección | Guaycurú: temporales 3/5 días, 2 sin cobrar | Condiciones de trabajo |
| E-1d | No pago según convenio | Horas extra, categorías, escalas debajo del CCT | Vicentín: horas extra debajo Art. 7bis | Remuneración |
| E-1e | Súper-explotación | Extracción de valor por encima de la norma, extensión de jornada sin compensación | La Forestal: jornada extendida sin pago | Condiciones de trabajo |
| E-1f | Tercerización | Contratación indirecta que oculta salario real y diluye responsabilidad | "¿Cuántos trabajadores son tercerizados vs. directos?" | Estrategias de producción |
| E-1g | Cierre / relocalización | Efectos del cierre de planta o migración productiva para disciplinar | Silver: "reservas globales", amenaza de cierre | Medio social |
| E-1h | Concurso como excusa | Uso del concurso preventivo para no pagar, no mejorar condiciones | Vicentín: "el concurso limita las posibilidades" | Medio social |
| E-1i | Ocultar información empresarial | Negar acceso a informes de seguridad, balances, datos que el trabajador tiene derecho a conocer | Vicentín: delegado pidió informe seguridad, empresa no lo dio | Medio social |
| E-1j | Deslocalización como amenaza | Migración productiva para debilitar organizaciones y disciplinar | Silver: amenaza de cierre | Estrategias de producción |

#### Sub-tipos de buenas prácticas

| Código | Sub-tipo | Descripción | Dimensión vigente (5 dim) |
|--------|----------|-------------|---------------------------|
| E-2a | Distribución equitativa | Participación en ganancias, salario justo por convenio | Remuneración |
| E-2b | Contratación directa | Personal permanente, sin tercerización abusiva | Estrategias de producción |
| E-2c | Inversión en territorio | La empresa invierte en la comunidad donde opera | Medio social |
| E-2d | Salario sobre SMVM | Remuneración que supera el salario mínimo vital y móvil | Remuneración |
| E-2e | Transparencia de información | Publicación de balances, acceso a datos, compliance | Medio social |

#### Mapeo a etiquetas IS

| Familia IS | Etiqueta | Sub-tipos Estructural |
|-----------|----------|----------------------|
| 1 — Conflicto laboral | Paritaria, conflicto salarial | E-1b |
| 1 — Conflicto laboral | Precarización | E-1c |
| 1 — Conflicto laboral | Horas extra | E-1d |
| 1 — Conflicto laboral | Concurso como limitación | E-1h |
| 2 — Condiciones de trabajo | Violación convenio | E-1d |
| 4 — Estrategia patronal | Estrategia de reducción | E-1g, E-1j |
| 4 — Estrategia patronal | Estrategia de ocultar | E-1i |
| 4 — Estrategia patronal | Tercerización | E-1f |
| 5 — Condiciones de vida | Brecha salario/costo de vida | E-1b |
| 5 — Condiciones de vida | Transporte, salud, vivienda | E-1g (efectos cierre) |

#### ¿Es violación a derechos humanos?

| Sub-tipo Estructural | ¿Es VDH? | Marco jurídico |
|----------------------|----------|----------------|
| E-1a (propiedad concentrada) | **No directamente** — pero cuando concentra poder sin accountability → facilita otras VDH | UNGP (obligación de respetar) |
| E-1b (salario insuficiente) | **Potencialmente sí** — sistemático + priva necesidades básicas | PIDESC 7, 11, 25; Convenios OIT 29, 87 |
| E-1c (precarización) | **Potencialmente sí** — cuando impide autorrealización | PIDESC 7 |
| E-1d (no pago convenio) | **Sí** — violación contractual + UNGP | CCT específico; UNGP 23 |
| E-1e (súper-explotación) | **Sí** — cuando es extrema → trabajo forzado | Convenio OIT 29; PIDCP 8 |
| E-1f (tercerización) | **Potencialmente sí** — cuando diluye responsabilidad y priva derechos | PIDESC 7; UNGP |
| E-1g (cierre/relocalización) | **Potencialmente sí** — cuando es disciplinaria y priva derechos | PIDESC 7; Convenio OIT 87 |
| E-1h (concurso excusa) | **Sí** — viola acceso a remedio | UNGP 23-28; DUDH 8 |
| E-1i (ocultar información) | **Sí** — viola derecho a verdad e información | Convenio OIT 135, 144; UNGP 23 |
| E-1j (deslocalización amenaza) | **Sí** — cuando es antisindical | Convenio OIT 87 |

**Umbral:** la violencia económica es VDH cuando es sistemática y priva de necesidades básicas → violación; cuando precarización impide autorrealización → violación; cuando es coyuntural → situación de VE sin necesariamente llegar a VDH. La súper-explotación extrema → trabajo forzado/esclavitud (Convenio OIT 29, Art. 8 PIDCP).

**Conexión con IVE×SMVM:** la dimensión Estructural se articula directamente con el índice IVE×SMVM — la correlación entre VE y el salario mínimo vital y móvil. La brecha salario real vs. SMVM, las horas trabajadas para llegar a SMVM, la tercerización que oculta salario real vs. SMVM del convenio.

### 6.5 Dimensión Simbólica — sub-tipos

**Definición original:** El discurso, la representación, la cultura empresarial — el mal trato cotidiano, las apariciones públicas de los empresarios, sus respuestas, el racismo y el anti-obrerismo cultural y discursivo. La violencia cultural/simbólica aporta el marco legitimador (Galtung) y niega la existencia de necesidades.

**Nota:** en el sistema de 5 dimensiones, los sub-tipos S-1f–S-1h (normalización, consentimiento aparente, pensamiento unidimensional) se reclasifican como parte del **lente transversal de lectura de violencia cultural** (sección 4). Los sub-tipos con contenido factual (S-1a–S-1e, S-1i–S-1j) se distribuyen entre Condiciones de trabajo y Medio social según su manifestación.

#### Sub-tipos de violencia simbólica

| Código | Sub-tipo | Descripción | Ejemplo caso | Dimensión vigente (5 dim) |
|--------|----------|-------------|-------------|---------------------------|
| S-1a | Mal trato cotidiano | Trato degradante, falta de respeto, humillación diaria | Supervisor que no saluda, que grita | Condiciones de trabajo |
| S-1b | Apariciones públicas del empresario | Discursos, entrevistas, declaraciones públicas que deslegitiman | CEO declarando que "los trabajadores son costos" | Medio social |
| S-1c | Respuestas agresivas | Cómo la empresa responde a demandas, reclamos, organización | "No vamos a negociar con quienes no representan a nadie" | Condiciones de trabajo |
| S-1d | Discurso anti-obrero | Narrativa que criminaliza, estigmatiza, deslegitima al trabajador | "Son vagos", "no quieren trabajar" | Medio social |
| S-1e | Racismo / anti-obrerismo cultural | Prejuicios de clase, raza, género inscriptos en la cultura empresarial | La Forestal: fragmentación por raza y género | Medio social |
| S-1f | Normalización / naturalización | Interiorización de normas, tolerancia represiva, banalización (Dejours) | "Es así, siempre fue así" | Lente transversal (sección 4) |
| S-1g | Consentimiento aparente | La dependencia asimétrica produce apariencia de consentimiento (Hirsch/Offe/Wiensenthal) | "Los trabajadores aceptan" — pero ¿pueden elegir? | Lente transversal (sección 4) |
| S-1h | Pensamiento unidimensional | Interiorización de normas, tolerancia represiva contra disidencia (Almeida) | "No hay alternativa" | Lente transversal (sección 4) |
| S-1i | Trazado de fronteras sociales y espaciales | Separar incluidos/excluidos, fijo/temporal, "capacitado"/"no capacitado" (Silver) | La Forestal: territorio separado | Medio social |
| S-1j | Fragmentación y jerarquización estigmatizadora | Raza, género, capacidades técnicas como herramientas de división | La Forestal: división por origen | Medio social |

#### Sub-tipos de buenas prácticas

| Código | Sub-tipo | Descripción | Dimensión vigente (5 dim) |
|--------|----------|-------------|---------------------------|
| S-2a | Reconocimiento de trabajadores | La empresa reconoce públicamente el valor del trabajo | Medio social |
| S-2b | Diálogo público | Respuestas constructivas, disposición a dialogar | Medio social |
| S-2c | Respeto simbólico | Trato digno, uso de lenguaje respetuoso | Condiciones de trabajo |

#### Mapeo a etiquetas IS

| Familia IS | Etiqueta | Sub-tipos Simbólica |
|-----------|----------|---------------------|
| 4 — Estrategia patronal | Discurso patronal | S-1b, S-1c, S-1d |
| 4 — Estrategia patronal | RSE como discurso | S-1b (apariciones públicas vinculadas a RSE) |
| 1 — Conflicto laboral | Presión patronal | S-1a (mal trato cotidiano) |

**Nota:** la violencia simbólica era una "capa transversal" en la tipología anterior — ahora se convierte en una dimensión operativa porque se puede medir: apariciones públicas, declaraciones, discursos, mal trato. En el sistema de 5 dimensiones, los sub-tipos S-1f–S-1h se reclasifican como **lente transversal de lectura cultural** (sección 4) — no como etiqueta contable sino como propiedad que amplifica el peso de cualquier evento.

#### ¿Es violación a derechos humanos?

| Sub-tipo Simbólica | ¿Es VDH? | Marco jurídico |
|--------------------|----------|----------------|
| S-1a (mal trato cotidiano) | **Parcialmente** — sistemático + daño documentable → sí | DUDH 5; PIDESC 12 |
| S-1b (apariciones públicas) | **No directamente** — pero cuando constituye discurso de odio → sí | DUDH 19 (responsabilidad); Convención Eliminación Discriminación Racial |
| S-1c (respuestas agresivas) | **No directamente** — pero cuando es antisindical → sí | Convenio OIT 87 |
| S-1d (discurso anti-obrero) | **Parcialmente** — cuando constituye estigmatización sistemática | PIDESC 7 (derecho a condiciones justas) |
| S-1e (racismo cultural) | **Sí** | Convención Eliminación Discriminación Racial; DUDH 2 |
| S-1f (normalización) | **Parcialmente** — es suelo que facilita VDH | Dejours: banalización |
| S-1g (consentimiento aparente) | **No** — es condición, no violación | Hirsch: dependencia asimétrica |
| S-1h (pensamiento unidimensional) | **Parcialmente** — cuando impide libertad de pensamiento | DUDH 18, 19 |
| S-1i (fronteras sociales) | **Parcialmente** — cuando constituye discriminación | PIDESC 7; DUDH 2 |
| S-1j (fragmentación estigmatizadora) | **Parcialmente** — cuando constituye discriminación | Convención Eliminación Discriminación Racial |

**Umbral:** la violencia simbólica es la más difícil de probar como VDH. Se convierte en violación cuando es: (a) sistemática (no episódica), (b) produce daño documentable, (c) es parte de una estrategia deliberada. La normalización (Dejours) es una condición que facilita otras violencias → no siempre es VDH por sí misma, pero es el suelo que las sostiene. **Como factor de intensidad:** la presencia de naturalización/normalización aumenta la intensidad del evento VE en cualquier dimensión — porque indica que la violencia no solo se ejerce sino que se legitima.

### 6.6 Comportamiento Empresarial Integrador/Consensual (CE-I)

> La contraparte **genuina** de la violencia. No paternalismo (que es control desde arriba), no RSE (que es gestión de imagen), no filantropismo (que legitima). Es comportamiento donde la empresa reconoce al trabajador y su organización como actor legítimo, negocia de buena fe, y construye desde el diálogo — no desde la imposición.

#### Criterio de distinción: ¿Integrador o fachada?

| Pregunta | Integrador/Consensual (genuino) | Buenas prácticas (fachada/control) |
|----------|--------------------------------|------------------------------------|
| ¿Quién decide? | Se negocia; el trabajador/sindicato participa | La empresa decide desde arriba; el trabajador recibe |
| ¿Hay reconocimiento de asimetría? | Sí; se busca equilibrar | No; se explota (paternalismo genera dependencia) |
| ¿Se reconoce la organización sindical? | Como representación legítima | Como "intermediario" a manejar/circunvenir |
| ¿Es sostenido o táctico? | Política de largo plazo | Campaña, evento, foto — táctico y reversible |
| ¿Hay transparencia? | Información compartida como norma | Información controlada; se muestra lo conveniente |
| ¿Qué pasa cuando hay conflicto? | Diálogo y negociación | Represión, lockout, despidos — y después "estamos dispuestos a dialogar" |

#### Dimensión 1 — Integrador Directo (I-D)

| Código | Sub-tipo | Descripción | Ejemplo | Dimensión vigente (5 dim) |
|--------|----------|-------------|---------|---------------------------|
| I-D-1a | Negociación de buena fe | La empresa negocia paritarias, condiciones, cambios con presencia sindical genuina; no impone | Paritaria donde empresa presenta propuesta real, discute, acepta modificaciones | Condiciones de trabajo |
| I-D-1b | Reconocimiento sindical | La empresa reconoce al sindicato/delegados como representación legítima; no busca circunvenir | Empresa convoca a delegados antes de decisiones; no habla "directamente con los trabajadores" para evitar sindicato | Condiciones de trabajo |
| I-D-1c | Diálogo ante conflicto | Cuando surge conflicto, la primera respuesta es diálogo — no represalia, lockout, despidos | Empresa recibe reclamo, dialoga, busca solución antes de escalar | Condiciones de trabajo |
| I-D-1d | No retaliación | No hay represalias contra quienes organizan, reclaman, protestan — ni formales ni informales | Después de un paro, no hay despidos "selectivos", no hay lista negra | Condiciones de trabajo |
| I-D-1e | Cumplimiento convenio | La empresa cumple el CCT no como obligación mínima sino como norma compartida | Paga horas extra según convenio, aplica categorías correctas, no busca vacíos jurídicos | Remuneración + Condiciones de trabajo |

#### Dimensión 2 — Integrador en Condiciones de Trabajo (I-CT)

| Código | Sub-tipo | Descripción | Ejemplo | Dimensión vigente (5 dim) |
|--------|----------|-------------|---------|---------------------------|
| I-CT-1a | Seguridad proactiva | La empresa invierte en seguridad más allá del mínimo legal; participación sindical en decisiones SyH | Programa de seguridad con Comisión SyH participativa; no solo compliance | Condiciones de trabajo |
| I-CT-1b | Salud laboral genuina | Enfermería operativa, servicio médico permanente, vigilancia médica real — no solo formal | Médico en planta, disponible, con equipamiento; no "enfermería clausurada 3 meses" | Condiciones de trabajo |
| I-CT-1c | EPP como norma | EPP completo, actualizado, provisto sin costo — como inversión, no como obligación mínima | Guantes nuevos, máscaras adecuadas, provistos al inicio de cada turno | Condiciones de trabajo |
| I-CT-1d | Ritmo negociado | Cambios en ritmo/organización de producción se discuten con trabajadores/delegados | +20% volumen? Primero se consulta, se evalúa impacto, se compensa | Condiciones de trabajo |
| I-CT-1e | Comunicación formal y bidireccional | Cambios se comunican por circular formal; trabajadores pueden preguntar, objetar, plantear | Circular escrita + reunión con delegados + espacio para preguntas | Condiciones de trabajo |
| I-CT-1f | Mantenimiento preventivo | La empresa mantiene maquinaria e infraestructura antes del fallo — no después del accidente | Programa de mantenimiento; prensa con fuga se repararía antes del accidente | Condiciones de trabajo |

#### Dimensión 3 — Integrador Estructural (I-E)

| Código | Sub-tipo | Descripción | Ejemplo | Dimensión vigente (5 dim) |
|--------|----------|-------------|---------|---------------------------|
| I-E-1a | Salario digno | Salario que cubre necesidades básicas; por encima de SMVM; análisis de balances muestra distribución equitativa | Básico que permite vivir; no "básico $340.000, alquiler $380.000" | Remuneración |
| I-E-1b | Contratación directa | Personal permanente, sin tercerización abusiva; cuando hay tercerización, se asegura igualdad de condiciones | Trabajadores directos, CCT aplicado; tercerizados con mismo salario y condiciones | Estrategias de producción |
| I-E-1c | Transparencia informativa | La empresa publica balances, informes de seguridad, datos de producción; el delegado puede acceder sin batalla | Delegado pide informe → lo recibe; no tiene que pelear por acceso | Medio social |
| I-E-1d | Inversión en territorio | La empresa invierte en la comunidad donde opera — infraestructura, salud, educación — sin segundas intenciones de control | Inversión visible, negociada con comunidad; no paternalismo disfrazado | Medio social |
| I-E-1e | Distribución equitativa | Facturación y rentabilidad se traducen en salario justo; la brecha facturación/salario no es obscena | "Vicentín factura X → paga salario Y" donde Y es digno, no marginal | Remuneración |
| I-E-1f | Estabilidad laboral | No se usa cierre/relocalización como amenaza disciplinaria; no se usa concurso como excusa | La empresa opera, mantiene planta, no amenaza con cierre para negociar | Estrategias de producción |

#### Dimensión 4 — Integrador Simbólico (I-S)

| Código | Sub-tipo | Descripción | Ejemplo | Dimensión vigente (5 dim) |
|--------|----------|-------------|---------|---------------------------|
| I-S-1a | Reconocimiento genuino | La empresa reconoce públicamente el valor del trabajo — no como paternalismo ("somos una gran familia") sino como reconocimiento del trabajador como actor | "Los trabajadores son el motor de esta empresa" — y se traduce en condiciones | Medio social |
| I-S-1b | Diálogo público respetuoso | Apariciones públicas del empresario donde se habla con respeto de los trabajadores; no se los menciona como "costos" o "problema" | CEO: "negociamos con el sindicato porque es el representante legítimo" | Medio social |
| I-S-1c | Respuesta constructiva | Cuando hay reclamo, la empresa responde constructivamente — no agresivamente, no con deslegitimación | "Recibimos el reclamo, vamos a evaluarlo" — no "no vamos a negociar con quienes no representan a nadie" | Medio social |
| I-S-1d | Trato digno cotidiano | Supervisores y managers tratan con respeto; no insultos, no humillación, no "es así y siempre fue así" | Supervisor que saluda, que explica, que escucha — que no grita | Condiciones de trabajo |
| I-S-1e | Sin fragmentación estigmatizadora | No se usa raza, género, origen como herramienta de división; se trabaja contra la jerarquización discriminatoria | Categorías y funciones asignadas por competencia, no por origen; igualdad de trato | Medio social |

#### Mapeo a etiquetas IS

| Familia IS | Etiqueta | Sub-tipos Integrador |
|-----------|----------|---------------------|
| 1 — Conflicto laboral | Negociación bona fide | I-D-1a, I-D-1c |
| 1 — Conflicto laboral | Cumplimiento convenio | I-D-1e |
| 2 — Condiciones de trabajo | Seguridad proactiva | I-CT-1a |
| 2 — Condiciones de trabajo | EPP completo | I-CT-1c |
| 2 — Condiciones de trabajo | Salud laboral genuina | I-CT-1b |
| 4 — Estrategia patronal | Reconocimiento sindical | I-D-1b |
| 4 — Estrategia patronal | Diálogo | I-D-1c, I-S-1c |
| 4 — Estrategia patronal | Transparencia | I-E-1c |
| 5 — Condiciones de vida | Inversión territorio | I-E-1d |
| 5 — Condiciones de vida | Salario digno | I-E-1a |

#### ¿Es cumplimiento UNGP?

| Sub-tipo Integrador | UNGP cumplimiento | Marco |
|--------------------|-------------------|-------|
| I-D-1a (negociación bona fide) | **Pilar II: respect** (UNGP 11, 18, 21) | UNGP: due diligence + policy commitment |
| I-D-1b (reconocimiento sindical) | **Pilar II: respect** (UNGP 11, 18) + Convenio OIT 87, 98 | Freedom of association as baseline |
| I-D-1c (diálogo ante conflicto) | **Pilar III: remedy** (UNGP 29) | Access to remedy = dialogue first |
| I-D-1d (no retaliación) | **Pilar II: respect** (Convenio OIT 87) | No reprisals against organizing |
| I-D-1e (cumplimiento convenio) | **Pilar II: respect** (UNGP 23) | Compliance as minimum + genuine |
| I-CT (todas) | **Pilar II: respect** (PIDESC 7.b, 12; OIT 155, 187) | Health and safety as right |
| I-E-1a (salario digno) | **Pilar II: respect** (PIDESC 7, 11) | Living wage as human right |
| I-E-1c (transparencia) | **Pilar II: respect** (UNGP 21, 23) + OIT 135, 144 | Right to information |
| I-S-1a a I-S-1e | **Pilar II: respect** (DUDH 1, 2, 5) | Dignity and non-discrimination |

**Nota:** Comportamiento Integrador/Consensual = cumplimiento genuino de UNGP. Las "buenas prácticas" como fachada (D-2a, D-2b, D-2c) son BHR-1 (RSE voluntaria); el comportamiento Integrador es lo que UNGP realmente exige: respect como obligación, no como elección.

#### Etiquetado Integrador en informes

```
CE-I-[dim]-[sub-tipo] | UNGP-[pilar]-[principio]
```

Ejemplos:
- `CE-I-D-1a-negociación-bona-fide | UNGP-II-21` (negociación de buena fe → cumplimiento due diligence)
- `CE-I-E-1a-salario-digno | UNGP-II-PIDESC7,11` (salario digno → cumplimiento derecho a condiciones justas)
- `CE-I-S-1c-respuesta-constructiva | UNGP-II-18` (respuesta constructiva → cumplimiento respeto)

### 6.7 Relación entre las dimensiones

Las dimensiones se superponen y se retroalimentan:

```
            Simbólica (legitima)
            ╱                    ╲
Estructural ←────── Directa ←──────┤
            ╲                    ╱
         Condiciones de Trabajo
```

- **Simbólica** legitima todas las demás: el discurso anti-obrero, la normalización, el consentimiento aparente hacen posible que la violencia se ejerza sin resistencia y sin reconocimiento.
- **Estructural** sostiene Directa y CT: la propiedad concentrada, la tercerización, el salario insuficiente crean las condiciones para que la violencia directa se ejerza y las condiciones de trabajo se degraden.
- **Directa** es la forma más visible: amenazas, represión, despidos. Pero no es la más frecuente ni la más sostenida.
- **Condiciones de Trabajo** es la más persistente: está inscripta en la estructura de la relación laboral, se reproduce cada día.
- **Buenas prácticas** (paternalismo, RSE, filantropismo) operan como contraparte de la violencia directa — pero también como control: recompensas que sostienen la disciplina.
- **Integrador/Consensual** opera como contraparte genuina: reconocimiento, negociación, transparencia, respeto. No es fachada — es cumplimiento real de UNGP. La relación entre violencia e integrador no es simétrica: la violencia es más frecuente y más sistémica; el integrador es más raro y más valioso porque demuestra que otro comportamiento es posible.

**Principio operativo:** un evento puede clasificarse en 1-3 dimensiones simultáneamente. La clasificación primaria es la dimensión donde el evento tiene su manifestación más directa; las secundarias son las dimensiones donde tiene efectos o conexiones.

**En el sistema de 5 dimensiones**, las relaciones se reorganizan:

```
               Medio social (legitima, contiene)
               ╱                              ╲
Remuneración ←── Condiciones de trabajo ────→ Estrategias de producción
               ╲                              ╱
               Estrategias de realización
```

- **Medio social** legitima y contiene: el discurso público, el racismo, la captura institucional, la inversión/daño territorial — es la dimensión donde se naturaliza o se expone la violencia.
- **Condiciones de trabajo** es la dimensión más directamente afectada por la violencia directa y la violencia laboral.
- **Remuneración** es la dimensión más directamente conectada con la violencia estructural (salario insuficiente, no pago convenio).
- **Estrategias de producción** conecta con tercerización, lockout, deslocalización.
- **Estrategias de realización** conecta con la violencia silente (producto nocivo, publicidad engañosa, precios abusivos).

### 6.8 Espectro de severidad BHR (Business and Human Rights)

**Principio:** cada evento clasificado por las dimensiones se evalúa además si constituye una **violación a derechos humanos (VDH)**. La evaluación sigue el marco UNGP (Principios Rectores sobre Empresas y DDHH, 2011) y los tratados internacionales. Cuando la evaluación es "sí" o "parcialmente sí", se ubica en el **espectro de severidad BHR** (Business and Human Rights).

```
░░ RSE (voluntaria, soft) — la empresa "decide" ser responsable; self-regulation
▒▒ BHR (rights-based) — derechos humanos como obligación, no elección; UNGP framework
▓▓ Complicidad en violaciones — la empresa facilita, permite, beneficia de violaciones
██ Complicidad en crímenes internacionales — participación en crímenes de lesa humanidad
██ Crímenes económicos contra la humanidad — la violencia es constitutiva, no accessory
```

| Nivel BHR | Código | Definición | Ejemplos en la tipología |
|-----------|--------|-----------|--------------------------|
| **1. RSE** | BHR-1 | Prácticas voluntarias de "responsabilidad" que coexisten con violaciones; paternalismo, filantropismo, RSE como fachada | D-2a (paternalismo), D-2b (filantropismo), D-2c (RSE) — cuando ocultan VDH |
| **2. BHR framework** | BHR-2 | Violación de los Principios Rectores (UNGP): empresa no respeta DDHH; Estado no protege; no hay remedio | E-1i (ocultar información — UNGP 23), E-1h (concurso como excusa — UNGP remedio), D-1j (multas — UNGP 23), CT-1i (cambios sin comunicación — UNGP consultation) |
| **3. Complicidad en violaciones** | BHR-3 | Empresa facilita, permite o beneficia de violaciones a DDHH por terceros | D-1e (policía/seguridad privada), E-1f (tercerización que diluye responsabilidad), S-1f (normalización que facilita otras violencias), S-1g (consentimiento aparente) |
| **4. Complicidad en crímenes intl.** | BHR-4 | Empresa como partícipe, co-perpetrator, facilitator de crímenes contra la humanidad | D-1a (represión industrial — dictadura), D-1d (secuestro), D-1f (financiamiento violencia externa — paramilitarismo), D-1h (espionaje → represión estatal) |
| **5. Crímenes econ. C/H** | BHR-5 | La violencia empresarial es constitutiva del modelo: no accessory sino sistemática, organizada, productiva | D-1c (masacre como régimen), E-1e (súper-explotación → trabajo forzado), S-1e+S-1j (racismo + fragmentación como sistema de control) |

**Principio operativo:** el espectro BHR **se superpone con las dimensiones CE**, no las reemplaza. Un evento se etiqueta con dimensión CE + nivel BHR. El nivel BHR amplifica la intensidad del evento: BHR-4 y BHR-5 son automáticamente intensidad máxima.

#### Evaluación VDH por dimensión (con espectro BHR)

| Dimensión | ¿Es VDH? | Espectro BHR típico | Marco jurídico |
|-----------|----------|---------------------|----------------|
| Directa | **Frecuentemente sí** — represión, agresión, antisindicalismo siempre; amenazas y malos tratos dependen de sistematicidad | BHR-3 a BHR-5 (complicidad → crímenes) | DUDH 3, 5, 9; PIDCP 6, 7; Estatuto Roma 7; Convenio OIT 87, 98 |
| Condiciones de Trabajo | **Frecuentemente sí** — cuando empresa opera conscientemente con riesgo | BHR-2 a BHR-3 (UNGP violation → complicidad en daño) | PIDESC 7.b, 12; Convenios OIT 155, 187 |
| Estructural | **Potencialmente sí** — depende de intensidad y sistematicidad | BHR-2 a BHR-5 (UNGP → súper-explotación → crímenes econ.) | PIDESC 7, 11, 25; Convenios OIT 29, 87; UNGP 23-28 |
| Simbólica | **Parcialmente** — la más difícil de probar; sistemática + daño documentable + estrategia deliberada → sí | BHR-1 a BHR-3 (RSE fachada → complicidad en legitimación) | DUDH 5, 18, 19; PIDESC 12; Convención Discriminación Racial |

**Mapeo a las 5 dimensiones vigentes:**

| Dimensión vigente (5 dim) | Sub-tipos que alimentan | Espectro BHR típico | Marco jurídico |
|---|---|---|---|
| **Remuneración** | D-1j, E-1b, E-1d, E-1e (extremo) | BHR-2 a BHR-5 | PIDESC 7, 11, 25; Convenios OIT 29, 87; UNGP 23 |
| **Condiciones de trabajo** | D-1a–D-1h, D-1k–D-1n, CT-1a–CT-1i, S-1a, S-1c | BHR-2 a BHR-5 | DUDH 3, 5; PIDESC 7.b, 12; Convenios OIT 87, 98, 155, 187; Estatuto Roma 7 |
| **Estrategias de producción** | D-1i, E-1f, E-1j | BHR-2 a BHR-3 | PIDESC 7; UNGP; Convenio OIT 87 |
| **Estrategias de realización** | (Violencia silente: producto nocivo, publicidad engañosa) | BHR-2 a BHR-3 | DUDH; PIDESC; normativa consumo |
| **Medio social** | D-2a–D-2d, E-1a, E-1g–E-1i, S-1b, S-1d, S-1e, S-1i, S-1j | BHR-1 a BHR-3 | UNGP; Convención Discriminación Racial; DUDH 2, 5 |

**Formato de etiquetado en informes (actualizado con BHR):**

```
CE-[dimensión]-[sub-tipo] | VDH-[sí/no/parcial]-[tratado] | BHR-[nivel]-[descriptor]
```

Ejemplos:
- `CE-D-1g-amenaza | VDH-parcial-C87 | BHR-2-UNGP` (amenaza → parcialmente VDH, Convenio 87, nivel BHR framework)
- `CE-CT-1a-accidente | VDH-sí-PIDESC7b | BHR-3-complicidad` (accidente por negligencia → VDH, complicidad en violación a salud)
- `CE-E-1e-súper-explotación | VDH-sí-OIT29 | BHR-4-crímenes-intl` (súper-explotación → trabajo forzado, crímenes internacionales)
- `CE-S-1e-racismo | VDH-sí-CEDR | BHR-3-complicidad` (racismo → VDH, complicidad en violación racial)
- `CE-D-1f-financiamiento | VDH-sí-EstatutoRoma7 | BHR-4-crímenes-intl` (financiamiento paramilitar → crímenes contra la humanidad)

#### Bibliografía del espectro BHR

→ Ver librería completa: `sources/LIBRERIA-BHR-violencia.md` (proyecto empresas-violencia-justicia)

| Nivel BHR | Bibliografía ancla |
|-----------|-------------------|
| BHR-1 (RSE) | Latapí Agudelo et al. (2019); Zubizarreta (2009); Walker-Said & Kelly (2015) |
| BHR-2 (BHR framework) | Ruggie/ONU (2011, 2012); Ramasastry (2015); AWA; CSI |
| BHR-3 (Complicidad en violaciones) | CIJ (2008); Barbuto (2018); Chella (2012); MiningWatch (2009) |
| BHR-4 (Complicidad en crímenes intl.) | Bohoslavsky (2022); CIJ (2008) |
| BHR-5 (Crímenes econ. C/H) | Arenal Lora (2011) |
| Remedial | Cantú Rivera (2018, 2022); ONU Pillar III |

### 6.9 Apéndice — Mapeo completo: 6 categorías VE → dimensiones CE

| VE anterior | → Dimensión CE | Sub-tipo CE | Dimensión vigente (5 dim) |
|------------|----------------|-------------|---------------------------|
| VE-1a Represión industrial | **Directa** | D-1a Represión | Condiciones de trabajo |
| VE-1b Agresión física | **Directa** | D-1b Agresión | Condiciones de trabajo |
| VE-1c Masacre | **Directa** | D-1c Masacre | Condiciones de trabajo |
| VE-1d Secuestro/detención | **Directa** | D-1d Secuestro | Condiciones de trabajo |
| VE-1e Policía/seguridad privada | **Directa** | D-1e Policía privada | Condiciones de trabajo |
| VE-1f Financiamiento violencia | **Directa** | D-1f Financiamiento | Condiciones de trabajo |
| VE-1g Accidente negligencia | **CT** | CT-1a Accidentes | Condiciones de trabajo |
| VE-2a Salarios insuficientes | **Estructural** | E-1b Salario insuficiente | Remuneración |
| VE-2b Precarización contractual | **Estructural** | E-1c Precarización | Condiciones de trabajo |
| VE-2c No pago convenio | **Estructural** | E-1d No pago convenio | Remuneración |
| VE-2d Súper-explotación | **Estructural** | E-1e Súper-explotación | Condiciones de trabajo |
| VE-2e Deslocalización amenaza | **Estructural** | E-1j Deslocalización | Estrategias de producción |
| VE-2f Lockout | **Directa** | D-1i Lockout | Estrategias de producción |
| VE-3a Condiciones inseguras | **CT** | CT-1b Condiciones inseguras | Condiciones de trabajo |
| VE-3b EPP insuficiente | **CT** | CT-1c EPP | Condiciones de trabajo |
| VE-3c Ritmo abusivo | **CT** | CT-1e Ritmo | Condiciones de trabajo |
| VE-3d Infraestructura ausente | **CT** | CT-1d Infraestructura | Condiciones de trabajo |
| VE-3e Alienación | **CT** | CT-1g Alienación | Condiciones de trabajo |
| VE-3f Enfermedades laborales | **CT** | CT-1f Enfermedades | Condiciones de trabajo |
| VE-4a Intimidación/amenaza | **Directa** | D-1g Amenaza | Condiciones de trabajo |
| VE-4b Miedo al despido | **CT** + **Simbólica** | CT-1h Miedo + S-1f Naturalización | Condiciones de trabajo + Lente transversal |
| VE-4c Control por recompensas | **Directa** (buenas prácticas) | D-2a Paternalismo | Medio social |
| VE-4d Pensamiento unidimensional | **Simbólica** | S-1h Pensamiento unidimensional | Lente transversal (sección 4) |
| VE-4e Cambios sin comunicación | **CT** | CT-1i Cambios sin comunicación | Condiciones de trabajo |
| VE-4f Humillación/castigo | **Directa** | D-1l Malos tratos | Condiciones de trabajo |
| VE-5a Concurso como excusa | **Estructural** | E-1h Concurso | Medio social |
| VE-5b Ocultar información | **Estructural** | E-1i Ocultar información | Medio social |
| VE-5c Violación convenio | **Estructural** + **Directa** | E-1d + D-1n | Remuneración + Condiciones de trabajo |
| VE-5d Antisindicalismo jurídico | **Directa** | D-1n Antisindicalismo | Condiciones de trabajo |
| VE-5e Espionaje laboral | **Directa** | D-1h Espionaje | Condiciones de trabajo |
| VE-5f Represión legalizada | **Directa** | D-1m Represión legalizada | Condiciones de trabajo |
| VE-6a No proveer EPP | **CT** | CT-1c EPP | Condiciones de trabajo |
| VE-6b No reparar | **CT** | CT-1b Condiciones inseguras | Condiciones de trabajo |
| VE-6c No contratar personal | **CT** | CT-1d Infraestructura | Condiciones de trabajo |
| VE-6d No dar información | **Estructural** | E-1i Ocultar información | Medio social |
| VE-6e No garantizar servicios | **CT** + **Estructural** | CT + E (efectos cierre) | Condiciones de trabajo + Medio social |
| VE-6f No investigar / remediar | **Estructural** | E-1i Ocultar información + UNGP 23 | Medio social |
| Violencia cultural/simbólica (capa transversal) | **Simbólica** | S-1f a S-1j | Lente transversal (sección 4) + Medio social |

### 6.10 Nota metodológica

Los pesos, sub-tipos y mapeos son **provisionales** — se definen por el Laboratorio y se revisan periódicamente con uso real de la APP. La tipología es una herramienta de lectura definida por el campo, no una verdad objetiva. Su valor está en hacer visible lo que la taxonomía actual de IS no enmarca como violencia, y en conectarlo con el marco jurídico de DDHH.

La reorganización en 4 dimensiones no elimina la tipología original — la redistribuye operativamente. Los 6 tipos originales (física, económica, laboral, psicológica, jurídica, omisión) se siguen usando como **sub-clasificación analítica** dentro de las 4 dimensiones cuando se necesita mayor detalle. Pero para el trabajador, la interfaz y el Índice, las 4 dimensiones son la puerta de entrada.

La migración al sistema de 5 dimensiones (Remuneración, Condiciones de trabajo, Estrategias de producción, Estrategias de realización, Medio social) no invalida los códigos de 4 dimensiones — los reorganiza. Los códigos D-1a, CT-1b, E-1c, S-1d se conservan como referencia detallada; la dimensión vigente a la que pertenece cada sub-tipo se indica en el mapeo (sección 6.1) y en la columna "Dimensión vigente (5 dim)" de cada tabla.

---

## 7. Dimensiones transversales (aplican a cualquier etiqueta)

| Dimensión | Valores | Función en el ICE |
|-----------|---------|-------------------|
| **Severidad** | leve / moderada / grave | Peso del evento |
| **Reiteración** | hecho aislado / patrón | Multiplicador |
| **Confirmación** | denuncia / confirmado por fuente oficial o judicial / reconocido por la empresa | Conecta con regla de verificación del clipping (✅/⚠️/❌) |
| **Alcance** | un trabajador / un sector / toda la planta / territorio | Escala del impacto |
| **Recencia** | fecha del evento | Permite ponderar lo reciente y calcular tendencias |

---

## 8. Estructura de los actores

### Actor empresarial

```
{
  nombre: "Vicentin SA",
  categoria: "empresarial",
  subtipo: "organizacion",          // organizacion | grupo_economico | empresa | individual
  rol_en_evento: "responsable",     // responsable | ejecutor | beneficiario

  // Solo si subtipo = organizacion / grupo_economico / empresa:
  grupo_economico: "Vicentin",
  filiales: ["Vicentin Hermanos SA", "Vicentin Industrial"],
  personal_directo_pct: 60,
  personal_indirecto_pct: 40,
  sector: "aceitera",

  // Modificador de violencia estructural (propiedad del actor, no del evento)
  violencia_estructural: {
    poder_economico_local: "alto",         // alto | medio | bajo
    dependencia_territorial: "alta",       // alta | media | baja
    captura_institucional: "confirmada"    // confirmada | sospechada | no_detectada
  }
}
```

### Actor gremial/político

```
{
  nombre: "Federación Aceitera",
  categoria: "gremial",
  subtipo: "organizacion",           // organizacion | federacion | sindicato | individual
  rol_en_evento: "denunciante",      // denunciante | afectado | interventor

  // Solo si subtipo = individual:
  cargo: "delegado",                 // delegado | dirigente | afiliado
  base: "Planta San Lorenzo"
}
```

### Actor estatal/institucional

```
{
  nombre: "Ministerio de Trabajo",
  categoria: "estatal",
  subtipo: "organismo",             // estado | organismo | justicia
  rol_en_evento: "interventor"
}
```

---

## 9. Ficha mínima por unidad de información

```js
{
  id: "evt_001",
  fuente: "InfoGremiales",
  fecha: "2026-06-23",
  texto_original: "...",

  // === LAS 4 VARIABLES MACRO ===

  // a) Hecho
  tipo_hecho: "paritaria",                          // vocabulario controlado
  duracion: "acotado",                              // instantaneo | acotado | prolongado | permanente_estructural
  acciones: [
    {
      tipo_accion: "presion_patronal_comunicado",   // vocabulario controlado
      descripcion: "Cámaras llaman a 'evaluar responsablemente' la oferta",
      actor: { nombre: "CIARA-CEC", categoria: "empresarial", subtipo: "organizacion", rol: "responsable" },
      lectura_cultural: {
        narrativa: "Framea la oferta como 'responsable', implica que el rechazo es 'irracional'",
        mecanismo: "deslegitimacion_del_reclamo",
        direccion: "naturaliza"                     // naturaliza | expone
      }
    },
    {
      tipo_accion: "rechazo_oferta",
      descripcion: "Federación rechaza la oferta por brecha con inflación",
      actor: { nombre: "Federación Aceitera", categoria: "gremial", subtipo: "organizacion", rol: "denunciante" },
      lectura_cultural: {
        narrativa: "Denuncia la brecha con inflación y la presión patronal",
        mecanismo: "exposicion_de_la_asimetria",
        direccion: "expone"
      }
    }
  ],

  // b) Sector
  sector: { economico: "aceitera", rama: "industrial" },

  // c) Actores (redundante con acciones, pero útil para queries)
  actores: [
    { nombre: "CIARA-CEC", categoria: "empresarial", subtipo: "organizacion", rol: "responsable" },
    { nombre: "Federación Aceitera", categoria: "gremial", subtipo: "organizacion", rol: "denunciante" }
  ],

  // d) Dimensión
  dimension: "remuneracion",

  // === CLASIFICACIÓN TEÓRICA (Jasinski / Kliksberg) ===
  categorias: ["comportamiento_empresarial"],
  etiquetas: ["ve_cultural"],                       // nivel 1 (5 Jasinski + 8 Kliksberg)
  subetiquetas: [],                                 // nivel 2 (cuando el nivel 1 funcione)

  // === DIMENSIONES TRANSVERSALES ===
  severidad: "moderada",
  reiteracion: "patron",
  confirmacion: "confirmado",
  alcance: "sector",
  recencia: "2026-Q2",

  // === VINCULACIÓN TEMPORAL (Pilar 8: remediación) ===
  eventos_vinculados: [],                           // IDs de eventos de respuesta/remediación

  // === GENUINIDAD (solo si la etiqueta es buena práctica) ===
  genuinidad: null,
  // o: { recursos: true, directivos: false, necesidades: true, ejecucion: true }

  // === TENANT Y ESQUEMA ===
  tenant: "aceiteros",
  version_esquema: "0.3"
}
```

---

## 10. Vocabularios controlados (pendientes de definir)

### `tipo_hecho` — tipos de evento reconocibles

| tipo_hecho | Ejemplo |
|------------|---------|
| `paritaria` | Negociación salarial |
| `maltrato_empresarial` | Humillación, obligación de trabajar en condiciones inseguras |
| `accidente_laboral` | Accidente en planta |
| `enfermedad_laboral` | Enfermedad profesional |
| `despido` | Despido de trabajador/delegado |
| `cierre_planta` | Cierre o reducción de actividad |
| `medida_de_fuerza` | Paro, asamblea, piquete |
| `inspeccion_laboral` | Visita de inspección |
| `denuncia_judicial` | Presentación judicial |
| `comunicado_prensa` | Comunicado institucional |
| ... | (crece con el uso) |

### `tipo_accion` — qué hizo cada actor

| tipo_accion | Ejemplo |
|-------------|---------|
| `presion_patronal_comunicado` | Cámara llama a aceptar oferta |
| `rechazo_oferta` | Sindicato rechaza propuesta |
| `maltrato_verbal_humillacion` | Capataz humilla a trabajador |
| `obligacion_trabajar_inseguro` | Obligan a trabajar con fuga de aceite |
| `despido_antisindical` | Despido de delegado |
| `paro` | Trabajadores paran |
| `asamblea` | Asamblea de base |
| `inspeccion_realizada` | Inspector verifica condiciones |
| ... | (crece con el uso) |

**Tensión abierta:** ¿los vocabularios se pre-definen o se arman a medida que aparecen nuevos tipos? Si se pre-define, puede no contemplar acciones que después aparezcan; si se arma sobre la marcha, corre el riesgo de proliferar sin control. Propuesta intermedia: pre-definir los tipos más frecuentes, permitir que el clasificador proponga nuevos tipos, y que la revisión humana los acepte o los fusione con existentes.

---

## 11. Ejemplos completos

### Ejemplo 1: Noticia del clipping

> **InfoGremiales, 23/06/2026** — "Cámaras aceiteras llaman a trabajadores a 'evaluar responsablemente' la oferta salarial. La Federación Aceitera rechaza la propuesta por estar 15% debajo de la inflación."

```js
{
  id: "evt_001",
  fuente: "InfoGremiales",
  fecha: "2026-06-23",

  tipo_hecho: "paritaria",
  duracion: "acotado",
  acciones: [
    {
      tipo_accion: "presion_patronal_comunicado",
      descripcion: "CIARA-CEC difunde comunicado llamando a 'evaluar responsablemente'",
      actor: { nombre: "CIARA-CEC", categoria: "empresarial", subtipo: "organizacion", rol: "responsable" },
      lectura_cultural: {
        narrativa: "La oferta patronal se framea como 'responsable'; el rechazo sindical se implica como 'irracional'",
        mecanismo: "deslegitimacion_del_reclamo",
        direccion: "naturaliza"
      }
    },
    {
      tipo_accion: "rechazo_oferta",
      descripcion: "Federación rechaza la oferta por brecha con inflación",
      actor: { nombre: "Federación Aceitera", categoria: "gremial", subtipo: "organizacion", rol: "denunciante" },
      lectura_cultural: {
        narrativa: "Denuncia la brecha con inflación y la presión patronal",
        mecanismo: "exposicion_de_la_asimetria",
        direccion: "expone"
      }
    }
  ],
  sector: { economico: "aceitera", rama: "industrial" },
  dimension: "remuneracion",

  categorias: ["comportamiento_empresarial"],
  etiquetas: ["ve_cultural"],
  severidad: "moderada",
  reiteracion: "patron",
  confirmacion: "confirmado",
  alcance: "sector",

  tenant: "aceiteros",
  version_esquema: "0.3"
}
```

**Salidas:**
- **ICE:** Cuenta como evento negativo en dimensión "remuneración", actor CIARA-CEC. La lectura cultural agrega violencia cultural. Severidad moderada, reiteración patrón, confirmación confirmado.
- **RAG:** Cuando un trabajador pregunta "¿qué pasó con la paritaria aceitera?", las etiquetas (`remuneracion`, `paritaria`, `CIARA-CEC`) enriquecen la recuperación. La lectura cultural permite que la persona del chat contextualice: "Las cámaras empresarias difundieron un comunicado que la Federación consideró una presión, porque frameaba su oferta como la opción responsable..."
- **Panorama:** Puede mostrar "eventos de presión patronal en paritarias aceiteras 2026" filtrando por `tipo_hecho` + `sector` + `fecha`, sin calcular el ICE.

### Ejemplo 2: Vicentin — maltrato del capataz + obligación de trabajar en prensa con fuga de aceite

Un tipo de hecho con dos acciones:

```js
{
  id: "evt_002",
  fuente: "denuncia_delegado",
  fecha: "2026-07-15",

  tipo_hecho: "maltrato_empresarial",
  duracion: "prolongado",
  acciones: [
    {
      tipo_accion: "maltrato_verbal_humillacion",
      descripcion: "Capataz de Prensa 3 humilla verbalmente al trabajador frente al equipo",
      actor: { nombre: "Capataz Prensa 3", categoria: "empresarial", subtipo: "individual", rol: "ejecutor" },
      lectura_cultural: {
        narrativa: "El maltrato se tolera internamente como 'forma de dirigir'; no hay sanción ni canal de denuncia efectivo",
        mecanismo: "naturalizacion_de_la_violencia",
        direccion: "naturaliza"
      }
    },
    {
      tipo_accion: "obligacion_trabajar_inseguro",
      descripcion: "Obliga al trabajador a operar prensa con fuga de aceite activa",
      actor: { nombre: "Capataz Prensa 3", categoria: "empresarial", subtipo: "individual", rol: "ejecutor" },
      lectura_cultural: {
        narrativa: "Se le dice al trabajador que 'no sea exagerado', que 'siempre hubo un poco de aceite'",
        mecanismo: "minimizacion_del_riesgo",
        direccion: "naturaliza"
      }
    }
  ],
  sector: { economico: "aceitera", rama: "industrial" },
  dimension: "condiciones_de_trabajo",

  actores: [
    { nombre: "Vicentin SA", categoria: "empresarial", subtipo: "organizacion", rol: "responsable" },
    { nombre: "Capataz Prensa 3", categoria: "empresarial", subtipo: "individual", rol: "ejecutor" }
  ],

  categorias: ["comportamiento_empresarial"],
  etiquetas: ["ve_represiva", "ve_laboral"],
  severidad: "grave",
  reiteracion: "patron",
  confirmacion: "denuncia",
  alcance: "un_trabajador",

  eventos_vinculados: [],

  tenant: "aceiteros",
  version_esquema: "0.3"
}
```

**Salidas:**
- **ICE:** Ambas acciones alimentan la dimensión "condiciones de trabajo" de Vicentin. La primera es violencia represiva (humillación) + cultural (naturalización del maltrato). La segunda es violencia laboral (incumplimiento S&H) + cultural (minimización del riesgo). La vinculación entre ambas acciones (mismo capataz, mismo sector de planta) permite detectar un **patrón**: no es un incidente aislado sino una zona donde se acumulan condiciones degradadas + violencia cultural que las normaliza. Ese patrón pesa más que la suma de los dos eventos por separado.
- **RAG:** Cuando un trabajador pregunta "¿qué riesgos hay en la prensa 3 de Vicentin?", el RAG recupera este evento. La lectura cultural permite al Investigador responder: "Hay denuncias de que se obliga a trabajar con fugas de aceite, y que cuando los trabajadores lo señalan, la respuesta del capataz es minimizar el riesgo. Esto es consistente con un patrón donde las condiciones inseguras se naturalizan como parte del trabajo."
- **Panorama:** Puede mostrar "condiciones de S&H en el sector aceitero" filtrando por `dimension: condiciones_de_trabajo` + `sector: aceitera` + `tipo_accion: obligacion_trabajar_inseguro`.

---

## 11b. Del etiquetado al ICE: lógica de cálculo

1. Cada etiqueta tiene **polaridad** (positiva si es buena práctica, negativa si es violencia)
2. Cada ocurrencia se pondera por las dimensiones transversales (severidad × reiteración × confirmación × alcance × recencia)
3. La lectura de violencia cultural agrega un componente de peso (un evento que además naturaliza la violencia pesa más que uno que la expone)
4. La violencia estructural (propiedad del actor) actúa como modificador que amplifica el peso de los eventos
5. Se agregan las ocurrencias **por empresa, por dimensión y por período**
6. El puntaje se normaliza a escala fija

**El ICE es una capa que se calcula sobre el etiquetado, no una clasificación aparte.** Cuando se agrega una etiqueta nueva, automáticamente queda disponible para el cálculo.

---

## 12. ICE — Fórmula y metodología de cálculo

### Cambio organizativo

El Índice anterior (IVE) medía 6 tipos de VE con pesos fijos. El nuevo Índice de Comportamiento Empresarial (ICE) se organiza en **5 dimensiones**, cada una con violencia (negativo) y buenas prácticas (positivo), para balancear el espectro completo del comportamiento empresarial.

**IVE vs. ICE:**
- IVE: Índice de Violencia Empresarial — solo negativo, 6 categorías
- ICE: Índice de Comportamiento Empresarial — negativo + positivo, 5 dimensiones

El IVE se conserva como sub-componente (la parte "violencia" del ICE). El ICE = IVE + IBP (Índice de Buenas Prácticas).

---

### Formula base

```
ICE = IVE + IBP

IVE = Σ Dim_i (F_violencia_i × I_violencia_i × A_violencia_i × peso_i)
IBP = Σ Dim_i (F_buenas_i × I_buenas_i × A_buenas_i × peso_i)
```

Donde:
- **Dim_i** = cada dimensión (i = 1 a 5): Remuneración, Condiciones de trabajo, Estrategias de producción, Estrategias de realización, Medio social
- **F_violencia_i** = frecuencia de incidentes violentos en dimensión i
- **I_violencia_i** = intensidad de violencia en dimensión i (escala 1-5)
- **A_violencia_i** = amplitud de violencia en dimensión i (trabajadores afectados)
- **F_buenas_i** = frecuencia de buenas prácticas en dimensión i
- **I_buenas_i** = intensidad/impacto de buenas prácticas en dimensión i (escala 1-5)
- **A_buenas_i** = amplitud de buenas prácticas en dimensión i (trabajadores beneficiados)
- **peso_i** = peso relativo de la dimensión i

**Nota:** la metodología de ponderación aún no está definida. Se desarrollará con datos del piloto aceitero y revisión del Laboratorio.

---

### Pesos por dimensión (provisionales)

> **Pesos provisionales — se desarrollarán con datos del piloto aceitero.**

| Dimensión | Peso violencia | Peso buenas prácticas | Justificación |
|-----------|---------------|----------------------|---------------|
| Remuneración | **0.25** | **0.05** | La más cotidiana y extendida — incumplimiento salarial, salario por debajo de la canasta, discrecionalidad en recompensas. Las buenas prácticas (equidad remunerativa, salario digno) son obligaciones, no privilegios |
| Condiciones de trabajo | **0.25** | **0.05** | La más persistente — afecta la salud y seguridad cotidianamente: control externo del ritmo, accidentes, enfermedades, maltrato. Las buenas prácticas (consenso en producción, S&H) son obligaciones básicas |
| Estrategias de producción | **0.15** | **0.05** | Tercerización fraudulenta, cadena de proveedores sin responsabilidad. Las buenas prácticas (responsabilidad extendida, auditoría de cadena) son obligaciones |
| Estrategias de realización | **0.10** | **0.05** | Producto nocivo, publicidad engañosa, precios abusivos — violencia silente hacia el consumidor. Las buenas prácticas (juego limpio, calidad, trazabilidad) son obligaciones |
| Medio social | **0.15** | **0.05** | Daño al territorio, opacidad, captura de instituciones, dependencia económica local. Las buenas prácticas (protección ambiental, transparencia, integración social) son obligaciones |

**Total violencia: Σ = 0.90 | Total buenas prácticas: Σ = 0.25**

**Total ICE: IVE_normalizado × 0.90 + IBP_normalizado × 0.25 → normalizado a [0, 100]**

---

### Variables

#### Frecuencia (F)

```
F_violencia_i = incidentes_violentos_dim_i reportados en período / N_trabajadores_sector × 1000
F_buenas_i = incidentes_buenas_dim_i reportados en período / N_trabajadores_sector × 1000
```

#### Intensidad (I) — Violencia

| Nivel | Denominación | Descripción | Ejemplo |
|-------|-------------|-------------|---------|
| 1 | Leve | VE detectada, impacto limitado | Cambio de directivas sin comunicación formal (CT) |
| 2 | Moderada | VE con impacto visible, afecta condiciones | Salario no cubre costo de vida (R), EPP insuficiente (CT) |
| 3 | Grave | VE que viola derechos, produce daño | Fuga 3 semanas + accidente (CT), amenaza sistemática (CT) |
| 4 | Muy grave | VE sistemática, violación DDHH | Precarización contractual masiva (EP), lockout ofensivo (CT) |
| 5 | Crítico | VE extrema, crimen de lesa humanidad | Represión industrial, masacre (MS) |

**Factor de naturalización (lente de violencia cultural):** si el evento VE está acompañado de naturalización/normalización, la intensidad se incrementa +1 nivel.

#### Intensidad (I) — Buenas prácticas

| Nivel | Denominación | Descripción | Ejemplo |
|-------|-------------|-------------|---------|
| 1 | Básica | Práctica que cumple obligación mínima | Enfermería operativa (CT), salario según convenio (R) |
| 2 | Moderada | Práctica que va beyond obligación mínima | Programas de salud adicionales (CT), participación en ganancias (R) |
| 3 | Significativa | Práctica con impacto visible y sostenido | Certificación ISO seguridad (CT), contratación directa 100% (EP) |
| 4 | Destacada | Práctica reconocida, con impacto sectorial | RSE con participación sindical (CT), inversión en territorio (MS) |
| 5 | Excepcional | Práctica que establece precedente | Empresa modelo en sector, cambio de cultura empresarial |

**Nota:** las buenas prácticas de nivel 1 (básica) son obligaciones — no "bonus". Se registran para que el índice no penalice a empresas que cumplen lo mínimo.

#### Amplitud (A)

```
A_i = trabajadores afectados/beneficiados / N_trabajadores_sector
```

Valores: 0.01 (individual) → 0.10 (sección) → 0.30 (planta) → 0.50 (sector local) → 1.00 (sector nacional)

---

### Cálculo del ICE

```
IVE = Σ Dim_i (F_violencia_i × I_violencia_i × A_violencia_i × peso_violencia_i)
IBP = Σ Dim_i (F_buenas_i × I_buenas_i × A_buenas_i × peso_buenas_i)

ICE_sector = IVE_normalizado × 0.90 + IBP_normalizado × 0.25
ICE_sector_normalizado = ICE_sector / ICE_max × 100
```

| Rango ICE | Color | Interpretación |
|-----------|-------|----------------|
| 0-20 | 🟢 Verde | Comportamiento predominantemente positivo |
| 21-40 | 🟡 Amarillo | Comportamiento mixto |
| 41-60 | 🟠 Naranja | Comportamiento negativo |
| 61-80 | 🔴 Rojo | Comportamiento violento |
| 81-100 | ⚫ Negro | Comportamiento extremadamente violento |

---

### Desglose por dimensión

```
ICE_Remuneración = (IVE_R × 0.25 + IBP_R × 0.05) × 100 / ICE_max_R
ICE_CT = (IVE_CT × 0.25 + IBP_CT × 0.05) × 100 / ICE_max_CT
ICE_EP = (IVE_EP × 0.15 + IBP_EP × 0.05) × 100 / ICE_max_EP
ICE_ER = (IVE_ER × 0.10 + IBP_ER × 0.05) × 100 / ICE_max_ER
ICE_MS = (IVE_MS × 0.15 + IBP_MS × 0.05) × 100 / ICE_max_MS
```

Esto produce un **perfil de Comportamiento Empresarial** del sector: qué dimensión es más intensa/frecuente.

**Ejemplo (sector aceitero, simulación Vicentín):**

| Dimensión | F violencia (hip.) | I violencia | A | peso | Componente IVE | F buenas | I buenas | A | peso | Componente IBP |
|-----------|-------------------|-------------|---|------|---------------|---------|-----------|---|------|---------------|
| Remuneración | 0.050 (salario, discrecionalidad) | 2 | 0.30 | 0.25 | 0.0075 | 0.005 (salario convenio) | 1 | 0.30 | 0.05 | 0.00075 |
| Condiciones de trabajo | 0.030 (EPP, fuga, ritmo) | 3 | 0.10 | 0.25 | 0.00225 | 0.010 (enfermería) | 1 | 0.10 | 0.05 | 0.0005 |
| Estrategias de producción | 0.020 (tercerización, cadena) | 2 | 0.30 | 0.15 | 0.0018 | 0.005 (auditoría) | 1 | 0.30 | 0.05 | 0.00075 |
| Estrategias de realización | 0.010 (publicidad, producto) | 2 | 0.30 | 0.10 | 0.0006 | 0.002 (trazabilidad) | 1 | 0.10 | 0.05 | 0.0001 |
| Medio social | 0.040 (captura, dependencia, daño) | 3 | 0.30 | 0.15 | 0.0054 | 0.002 (RSE territorio) | 2 | 0.30 | 0.05 | 0.0006 |

**Perfil aceitero:** Remuneración y Medio social predominan como violencia → comportamiento negativo con compensación insuficiente. ICE probablemente en rango naranja (40-60).

---

### Índice por empresa, región, rama, general

El ICE se calcula a 4 niveles:

#### ICE-empresa

```
ICE_empresa = (IVE_empresa × 0.90 + IBP_empresa × 0.25) normalizado × 100
```

Calculado con datos de una empresa específica. Permite comparar empresas dentro de un sector.

**Ejemplo:**
- ICE_Vicentín ≈ 55 (naranja) — violencia en remuneración y medio social predominante, RSE insuficiente
- ICE_Dreyfus ≈ 45 (naranja) — similar pero con más buenas prácticas reportadas
- ICE_Local_pyme ≈ 30 (amarillo) — violencia en remuneración menor, condiciones aceptables

#### ICE-región

```
ICE_región = Σ ICE_empresa_j × N_trabajadores_empresa_j / Σ N_trabajadores_región
```

Agregación ponderada por número de trabajadores. Permite ver la violencia regional.

#### ICE-rama (sector)

```
ICE_sector = Σ ICE_empresa_j × peso_económico_j / Σ peso_económico_j
```

Agregación ponderada por participación económica. Permite comparar sectores.

#### ICE-general (país)

```
ICE_país = Σ ICE_sector_j × peso_económico_j / Σ peso_económico_j
```

Agregación nacional.

---

### Serie temporal del ICE

El ICE se calcula **mensualmente**. Permite ver tendencias, ciclos (paritarias → lockout → despidos → precarización), eventos específicos, y comparaciones.

---

### Componente VDH (violaciones a derechos humanos)

```
VDH-sector = Σ incidentes_VDH_i / Σ incidentes_VE_total × ICE_violencia_sector
```

| Proporción VDH | Interpretación |
|----------------|----------------|
| < 20% | La VE es predominantemente no-DDHH |
| 20-50% | Mixta |
| > 50% | Predominantemente VDH → requiere intervención judicial/organizativa |

---

### Conexión con IVE×SMVM

La dimensión **Remuneración** se articula directamente con el IVE×SMVM (Índice de Violencia Empresarial × Salario Mínimo Vital y Móvil):

- **ICE_Remuneración-SMVM directo:** relación entre el componente Remuneración del ICE y la posición salarial respecto al SMVM
- **ICE_Remuneración-SMVM dinámico:** cómo evoluciona el componente Remuneración cuando el SMVM cambia
- **Sub-índice de violencia económica salarial:** salario real vs. SMVM, horas trabajadas para llegar a SMVM, tercerización que oculta salario real

**Articulación con IFT (N13):** ICE_Remuneración×SMVM alimenta directamente el Índice de Felicidad del Trabajador — la misma data que muestra lo que daña (ICE) alimenta el diagnóstico de lo que importa (IFT).

---

### Limitaciones y notas

1. **Datos incompletos:** el ICE solo refleja lo que la APP recibe. VE no reportada no se cuenta. La cobertura del sector es un factor que se debe reportar junto al ICE.

2. **Pesos provisionales:** los pesos no son universales. Son definidos por el campo y revisables. Un ICE con diferentes pesos da resultados diferentes → siempre reportar pesos usados.

3. **Buenas prácticas como control:** las "buenas prácticas" (paternalismo, RSE, filantropismo) son frecuentemente también formas de control. Se registran como "positivo" para balancear, pero su peso es deliberadamente menor que el de la violencia.

4. **Metodología en desarrollo:** la fórmula, los pesos, y la normalización aún no están completamente definidos. Se desarrollarán con datos del piloto aceitero y revisión periódica del Laboratorio.

5. **No es índice de conflicto:** el ICE no mide conflicto laboral (ya medido por Coyuntura). Mide **comportamiento empresarial** — lo que la empresa hace.

6. **El ICE es una herramienta, no un juicio:** lectura procesada con categorías definidas por el campo.

---

## 13. Remediación y vinculación temporal

La remediación (Kliksberg pilar 8) introduce una dimensión temporal distinta de "recencia": no es solo cuándo ocurrió el hecho, sino si hubo una respuesta correctiva posterior.

Necesita el campo `eventos_vinculados` que permita encadenar: hecho de violencia → auditoría → reforma → verificación. Sin esto, la remediación flota como un dato suelto.

**Faltante:** definir los tipos de vinculación posibles (causal, correctiva, de contexto, etc.) y cómo impactan en el cálculo del ICE.

---

## 14. Integración con el RAG

Las etiquetas deben enriquecer la recuperación del RAG para que las personas del chat respondan con mayor precisión. El `keyword_search()` en `rag_retriever.py` busca en `title + text + tags` — si las nuevas etiquetas se agregan al campo searchable de cada chunk, el TF-IDF las indexa automáticamente.

**Faltante:** definir cómo se cargan las etiquetas de eventos en el RAG. ¿Se agregan como tags de los chunks existentes? ¿Se crea un índice paralelo? ¿Se enriquece el texto del chunk con las etiquetas antes del search?

**Faltante crítico:** Kliksberg no está en el RAG. Hay 361 chunks de Jasinski, pero cero de Kliksberg. Sin contenido de Kliksberg, las etiquetas de Buenas Prácticas no tienen retorno en el chat — el sistema puede etiquetar un evento como "equidad remunerativa" pero las personas no pueden explicarlo teóricamente.

---

## 15. Multi-tenant

El sistema es multi-tenant (aceiteros + prensa, modelo own/shared/cross). Las etiquetas deben respetar esto: una noticia del clipping aceitero tiene `tenant: "aceiteros"`, una de prensa tiene `tenant: "prensa"`, y ambas pueden alimentar el ICE de empresas que aparecen en ambos mundos.

**Faltante:** definir cómo se maneja el ICE de una empresa que aparece en eventos de distintos tenants. ¿Se calcula por separado? ¿Se agrega? ¿El usuario de un tenant ve solo los eventos de su sector?

---

## 16. Pipeline de clasificación automática

El volumen del clipping (10 noticias/semana × 52 semanas) hace inviable el etiquetamiento 100% manual. Se necesita un pipeline:

1. **LLM clasifica** contra el set de etiquetas vigente (tipo_hecho, tipo_accion, dimensión, etiquetas, lectura_cultural)
2. **Confidence ≥ umbral** → acepta automático
3. **Confidence < umbral** → cola de revisión humana
4. **Humano corrige** → el dato se usa para afinar el clasificador

**Faltante:** definir el prompt del clasificador, el umbral de confidence, y la interfaz de revisión humana.

---

## 17. Modelo de almacenamiento

**Faltante:** definir si las etiquetas viven inline (dentro de los chunks de `kb_data.py`) o en una tabla anexa (SQLite: tabla `eventos` + tabla `actores` + tabla `etiquetas`). La decisión tiene consecuencias:

- **Inline**: más simple, pero acopla el etiquetado al contenido del RAG
- **Tabla anexa**: más flexible, pero requiere joins y sincronización con IndexedDB del frontend

---

## 18. Las otras 3 categorías

Comportamiento Empresarial está desarrollado. Las otras 3 categorías (Actividad Gremial, Actividad Productiva, Contexto) no tienen el contenido específico de sus etiquetas definido, pero **ya tienen el mismo esqueleto** (las 4 variables macro). Lo que falta es definir qué `tipo_hecho`, qué `tipo_accion` y qué `etiquetas` son propias de cada categoría, no la estructura.

---

## 19. Resumen de faltantes, problemas y tensiones

| # | Tema | Estado | Prioridad |
|---|------|--------|-----------|
| 1 | **Vocabularios controlados** — `tipo_hecho` y `tipo_accion` completos | Borrador inicial | 🔴 Bloqueante para MVP |
| 2 | **Violencia estructural como modificador** — cómo se mide, cómo amplifica el cálculo | Por definir | 🔴 Bloqueante para ICE |
| 3 | **Kliksberg en el RAG** — sin contenido, el eje positivo del ICE es operativo pero ciego | Faltante | 🟡 Necesario antes de implementar |
| 4 | **Fórmula del ICE** — ponderación de dimensiones transversales, lectura cultural, violencia estructural, normalización, escala | Faltante | 🟡 Necesario para calcular |
| 5 | **Unidad de agregación del ICE** — por empresa, por sector, por período | Faltante | 🟡 Necesario para calcular |
| 6 | **Integración con RAG** — cómo se cargan las etiquetas en el índice | Faltante | 🟡 Necesario para chats |
| 7 | **Multi-tenant en el ICE** — eventos de distintos tenants para la misma empresa | Faltante | 🟡 Necesario para multi-sindicato |
| 8 | **Pipeline de clasificación automática** — prompt, umbral, interfaz de revisión | Faltante | 🟡 Necesario para escalar |
| 9 | **Modelo de almacenamiento** — inline vs tabla anexa | Faltante | 🟡 Necesario para implementar |
| 10 | **Vinculación temporal** (remediación) — tipos de vinculación, impacto en cálculo | Faltante | 🟢 Post-MVP |
| 11 | **Genuinidad de la RSE** — ¿checklist booleano o escala graduada? | Tensión menor | 🟢 Resolver al implementar |
| 12 | **¿Dimensión del evento o de la acción?** — un evento complejo puede tocar más de una dimensión | Tensión abierta | 🟠 Resolver al implementar pipeline |
| 13 | **Vocabulario controlado emergente** — ¿pre-definido o se arma sobre la marcha? | Tensión | 🟠 Resolver al implementar pipeline |

**Resueltas en esta versión:**
- ~~Dimensiones del ICE~~ → 5 dimensiones definitivas (remuneración, condiciones de trabajo, estrategias de producción, estrategias de realización, medio social)
- ~~"Impacto en el medio social" definición~~ → no solo ambiental: peso económico, dependencia territorial, captura institucional
- ~~¿Control psicológico = dimensión propia o aspecto de Organización del trabajo?~~ → fusionados en "Condiciones de trabajo"
- ~~¿Cadena productiva = dimensión propia o aspecto de Medio social?~~ → "Estrategias de producción"
- ~~¿Relación con el consumidor = dimensión del ICE o fuera de alcance?~~ → "Estrategias de realización"
- ~~Violencia estructural: ¿dimensión del ICE?~~ → No: propiedad del actor / modificador
- ~~Las otras 3 categorías sin esqueleto~~ → Comparten las 4 variables macro
- ~~"Interpretación" como 5ta dimensión~~ → No es dimensión: es lente transversal de violencia cultural, aplicado por acción

---

## 20. Orden de implementación

| Paso | Qué | Dependencia |
|------|-----|-------------|
| 0 | Cargar Kliksberg en el RAG | — |
| 1 | Completar vocabularios controlados (`tipo_hecho`, `tipo_accion`) | — |
| 2 | Definir fórmula del ICE (ponderación, escala, violencia estructural como modificador) | Depende de paso 1 |
| 3 | Implementar ficha mínima en SQLite (tabla eventos + tabla actores) | Depende de pasos 1-2 |
| 4 | Pipeline de clasificación automática (LLM + revisión humana) | Depende de paso 3 |
| 5 | Cálculo del ICE por dimensión | Depende de paso 4 |
| 6 | Integración con `keyword_search()` del RAG | Depende de paso 3 |
| 7 | Subetiquetas + `version_esquema` para re-procesamiento | Depende de pasos 4-5 validados |
