# Sistema de etiquetado e Índice de Comportamiento Empresarial (ICE)

**Fecha:** 25 agosto 2026
**Estado:** Diseño avanzado — dimensiones definidas, pendiente implementación

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

## 6. Dimensiones transversales (aplican a cualquier etiqueta)

| Dimensión | Valores | Función en el ICE |
|-----------|---------|-------------------|
| **Severidad** | leve / moderada / grave | Peso del evento |
| **Reiteración** | hecho aislado / patrón | Multiplicador |
| **Confirmación** | denuncia / confirmado por fuente oficial o judicial / reconocido por la empresa | Conecta con regla de verificación del clipping (✅/⚠️/❌) |
| **Alcance** | un trabajador / un sector / toda la planta / territorio | Escala del impacto |
| **Recencia** | fecha del evento | Permite ponderar lo reciente y calcular tendencias |

---

## 7. Estructura de los actores

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

## 8. Ficha mínima por unidad de información

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

## 9. Vocabularios controlados (pendientes de definir)

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

## 10. Ejemplos completos

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

## 11. Del etiquetado al ICE: lógica de cálculo

1. Cada etiqueta tiene **polaridad** (positiva si es buena práctica, negativa si es violencia)
2. Cada ocurrencia se pondera por las dimensiones transversales (severidad × reiteración × confirmación × alcance × recencia)
3. La lectura de violencia cultural agrega un componente de peso (un evento que además naturaliza la violencia pesa más que uno que la expone)
4. La violencia estructural (propiedad del actor) actúa como modificador que amplifica el peso de los eventos
5. Se agregan las ocurrencias **por empresa, por dimensión y por período**
6. El puntaje se normaliza a escala fija

**El ICE es una capa que se calcula sobre el etiquetado, no una clasificación aparte.** Cuando se agrega una etiqueta nueva, automáticamente queda disponible para el cálculo.

**Faltante:** fórmula concreta de cálculo. ¿Cómo se ponderan las dimensiones transversales? ¿Cómo se cuantifica el aporte de la lectura cultural? ¿Cómo se mide el modificador de violencia estructural? ¿Cómo se normaliza la escala?

**Faltante:** unidad de agregación. ¿Por empresa? ¿Por empresa y sector? ¿Por empresa y período? ¿Por empresa, sector y período?

---

## 12. Remediación y vinculación temporal

La remediación (Kliksberg pilar 8) introduce una dimensión temporal distinta de "recencia": no es solo cuándo ocurrió el hecho, sino si hubo una respuesta correctiva posterior.

Necesita el campo `eventos_vinculados` que permita encadenar: hecho de violencia → auditoría → reforma → verificación. Sin esto, la remediación flota como un dato suelto.

**Faltante:** definir los tipos de vinculación posibles (causal, correctiva, de contexto, etc.) y cómo impactan en el cálculo del ICE.

---

## 13. Integración con el RAG

Las etiquetas deben enriquecer la recuperación del RAG para que las personas del chat respondan con mayor precisión. El `keyword_search()` en `rag_retriever.py` busca en `title + text + tags` — si las nuevas etiquetas se agregan al campo searchable de cada chunk, el TF-IDF las indexa automáticamente.

**Faltante:** definir cómo se cargan las etiquetas de eventos en el RAG. ¿Se agregan como tags de los chunks existentes? ¿Se crea un índice paralelo? ¿Se enriquece el texto del chunk con las etiquetas antes del search?

**Faltante crítico:** Kliksberg no está en el RAG. Hay 361 chunks de Jasinski, pero cero de Kliksberg. Sin contenido de Kliksberg, las etiquetas de Buenas Prácticas no tienen retorno en el chat — el sistema puede etiquetar un evento como "equidad remunerativa" pero las personas no pueden explicarlo teóricamente.

---

## 14. Multi-tenant

El sistema es multi-tenant (aceiteros + prensa, modelo own/shared/cross). Las etiquetas deben respetar esto: una noticia del clipping aceitero tiene `tenant: "aceiteros"`, una de prensa tiene `tenant: "prensa"`, y ambas pueden alimentar el ICE de empresas que aparecen en ambos mundos.

**Faltante:** definir cómo se maneja el ICE de una empresa que aparece en eventos de distintos tenants. ¿Se calcula por separado? ¿Se agrega? ¿El usuario de un tenant ve solo los eventos de su sector?

---

## 15. Pipeline de clasificación automática

El volumen del clipping (10 noticias/semana × 52 semanas) hace inviable el etiquetamiento 100% manual. Se necesita un pipeline:

1. **LLM clasifica** contra el set de etiquetas vigente (tipo_hecho, tipo_accion, dimensión, etiquetas, lectura_cultural)
2. **Confidence ≥ umbral** → acepta automático
3. **Confidence < umbral** → cola de revisión humana
4. **Humano corrige** → el dato se usa para afinar el clasificador

**Faltante:** definir el prompt del clasificador, el umbral de confidence, y la interfaz de revisión humana.

---

## 16. Modelo de almacenamiento

**Faltante:** definir si las etiquetas viven inline (dentro de los chunks de `kb_data.py`) o en una tabla anexa (SQLite: tabla `eventos` + tabla `actores` + tabla `etiquetas`). La decisión tiene consecuencias:

- **Inline**: más simple, pero acopla el etiquetado al contenido del RAG
- **Tabla anexa**: más flexible, pero requiere joins y sincronización con IndexedDB del frontend

---

## 17. Las otras 3 categorías

Comportamiento Empresarial está desarrollado. Las otras 3 categorías (Actividad Gremial, Actividad Productiva, Contexto) no tienen el contenido específico de sus etiquetas definido, pero **ya tienen el mismo esqueleto** (las 4 variables macro). Lo que falta es definir qué `tipo_hecho`, qué `tipo_accion` y qué `etiquetas` son propias de cada categoría, no la estructura.

---

## 18. Resumen de faltantes, problemas y tensiones

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

## 19. Orden de implementación

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
