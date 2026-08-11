# Notas — Clase de IA

**Fecha:** 11 de julio 2026
**Tema:** Sesgos en IA
**Docente:** _(a completar)_

---

## Notas

### Tipos de sesgos en IA

Los sesgos no son accidentales — **son estructurales**. La conexión entre sesgos y **quién construyó la IA** es directa: las decisiones de diseño, los datos de entrenamiento, los criterios de evaluación reflejan las prioridades y visiones de quienes las desarrollan.

### Búsqueda por probabilidad

La IA opera mediante **búsqueda por probabilidad**: selecciona respuestas según lo que es estadísticamente más probable, no lo que es más correcto o más justo. Esto reproduce y amplifica los patrones dominantes ya presentes en los datos de entrenamiento, marginalizando perspectivas menos representadas estadísticamente.

### Problema del entrenamiento

El **entrenamiento** es otra fuente estructural de sesgo. Los modelos se entrenan sobre otros modelos, heredando y profundizando sus sesgos.

**Ejemplo:** DeepSeek fue entrenada con modelos de Google — esto es un problema porque reproduce los sesgos ya presentes en los modelos de Google, sin cuestionarlos ni corregirlos. El sesgo se **transmite y acumula** de modelo en modelo.

### Quién construyó y moldeó los valores

Las principales IA fueron construidas por empresas de **Silicon Valley**: OpenAI, Google, Meta, Anthropic. Esto importa porque el **modelo occidental** está detrás de todo el uso de IA — define qué valores se priorizan, qué se considera "correcto", qué se filtra.

DeepSeek, aunque china, **modera ese sesgo occidental** con restricciones de uso y regulaciones propias — pero no lo elimina, lo reemplaza con otro marco de valores (el del Estado chino). El sesgo no desaparece; cambia de mano.

### Extracción de conocimiento

El conocimiento que alimenta las IA se **extrajo del trabajo intelectual de millones de personas** que:
- **No fueron consultadas** sobre el uso de su trabajo
- **No fueron compensadas** económicamente
- **No tienen voz** en cómo se usa ese conocimiento

Es una forma de **apropiación y explotación intelectual** masiva: el saber colectivo se privatiza por empresas que lo monetizan, mientras quienes lo produjeron quedan excluidos del beneficio y de las decisiones.

### DeepSeek como caballo de Troya

DeepSeek, para los intelectuales chinos, funciona como un **caballo de Troya**: un modelo "alternativa" que en realidad está entrenado sobre modelos occidentales y reproduce su lógica. Construir una alternativa genuina — con entrenamiento propio desde la base — **cuesta miles de millones de dólares**, lo que hace prácticamente imposible una verdadera desvinculación del paradigma Silicon Valley. La dependencia estructural se reproduce incluso en los intentos de resistencia.

### Anthropic y la destrucción de fuentes

**Claude fue entrenada con miles y miles de libros que Anthropic compró y luego quemó.** Esto revela otra dimensión de la extracción: no solo se apropió del conocimiento intelectual de los autores, sino que se **destruyó la fuente física** después de extraer lo necesario. Los autores no fueron consultados ni compensados, y además perdieron el soporte material de su trabajo en el proceso.

### Optimización por coherencia, no por verdad

Los modelos de IA **optimizan para obtener mayor coherencia**, no para la verdad. Coherencia significa que las respuestas se ajustan entre sí y al patrón dominante — pero un sistema coherente puede ser completamente falso. La verdad requiere verificación externa, contexto, contradicciones legítimas; la coherencia las oculta en favor de lo que "suena bien" estadísticamente.

### Lógica binaria y lenguaje

La **lógica de construcción del lenguaje en IA es binaria** (0/1, sí/no, presente/ausente). Esto fuerza al lenguaje humano — que es ambiguo, contextual, múltiple — a entrar en una lógica binaria. A partir de esa reducción, el modelo **aproxima por coherencia** dentro de un marco que ya deformó el lenguaje. Por eso **puede errarle**: la verdad no es binaria, pero el sistema que procesa el lenguaje sí lo es.

### Tokens: cómo la IA procesa el lenguaje

Los **tokens** son la unidad básica con la que la IA procesa texto. Son **recortes de frases o párrafos** (fragmentos de palabras, subpalabras, caracteres) que el sistema **convierte en vectores numéricos**. Cada token recibe un número — una posición en un espacio matemático. El lenguaje se reduce a **coordenadas numéricas**: el modelo no "lee" palabras, opera con números que representan recortes de lenguaje. Esta es la base material de toda la lógica binaria y la aproximación por probabilidad descrita arriba.

### RAG: Reducción de sesgos y alucinaciones

Para reducir sesgos y alucinaciones, se usa **RAG** (Retrieval-Augmented Generation): una **biblioteca de fuentes verificadas** que la IA consulta antes de responder. En lugar de generar solo desde su entrenamiento probabilístico, el modelo **busca primero en documentos chequeados** y construye la respuesta sobre esa base. Es una forma de anclar la IA a fuentes concretas y verificables, no solo a probabilidad estadística.

Pero el RAG tiene un **límite estructural**: por más que se suban textos contrahegemónicos, si representan un **porcentaje mínimo del total** de la información disponible, la **probabilidad de que el chat busque esa respuesta contrahegemónica es muy baja**. El sistema sigue operando por probabilidad — la perspectiva dominante, estadísticamente más representada, siempre tendrá más chances de ser seleccionada. El RAG ayuda, pero no rompe la lógica probabilística que favorece lo hegemónico.

### Alucinaciones

Las **alucinaciones** — respuestas falsas presentadas como correctas — son **más probables en ciertos contextos**:

- **Temas especializados o raros**: menos datos de entrenamiento → más probabilidad de inventar
- **Cosas recientes**: fuera del corte temporal del entrenamiento
- **Regiones específicas**: menos representación en los datos globales
- **Números y datos específicos**: estadísticas, cifras, fechas exactas

La IA **lo dice siempre con la misma confianza**, sea verdadero o falso. No hay indicador interno de duda.

**Es arreglable**: siempre hay que **chequear y verificar** las respuestas, especialmente en estos contextos más vulnerables a alucinación.

### Prompt: reglas para construir mejores preguntas

Lo que escribimos — **el prompt** — determina el resultado. Cómo se construye la pregunta da una respuesta específica. Reglas básicas:

1. **Ser específico sobre el contexto**: en qué región, qué contexto, con qué foco — esto evita que la IA active los patrones más generales (hegemónicos)
2. **Nombrar lo que no se quiere**: explicitar qué evitar, qué perspectiva no incluir
3. **Decir para qué y para quién**: destino y audiencia del texto orientan la respuesta
4. **Pedir incertidumbre**: "si no sabes, decime"; pedir que explique, que no se equivoque
5. **Proveer ejemplos del tipo que se quiere**: mostrar el formato/tono/estilo deseado con un ejemplo concreto
6. **Estructurar la pregunta en segmentos**: dividir el prompt en partes claras, no un bloque largo
7. **Dar el rol que se necesita**: "sos un investigador", "sos un analista sindical", etc. — el rol condiciona el enfoque
8. **Pedir el formato explícito**: especificar cómo se quiere la salida (tabla, lista, párrafos, etc.)

**Pero el prompt no arregla lo estructural.** Podemos orientar un poco más la respuesta, dirigir la dirección, evitar activar los patrones más problemáticos por defecto — pero **no cambia lo estructural** del modelo: cómo fue entrenado, con qué datos, por quién, con qué valores. El prompt es una herramienta táctica; el sesgo estructural requiere cambios a nivel de entrenamiento, datos y governance.

### LLM chinos: alternativa no occidental

**Kimi** y **GLM** son IA chinas con **modelo de lenguaje no occidental** que no usan la base de datos de Google para construir el diálogo — entrenamiento desde otra base, otra lógica.

Sin embargo, los **LLM chinos fuera de China no están funcionando con extensión**: no se integran en los ecosistemas de uso cotidiano como lo hacen ChatGPT o Claude. Son de **código abierto**, lo que potencialmente permite mayor transparencia y adaptación — pero la accesibilidad práctica global sigue siendo limitada.

### IA más que chat: herramientas para nuestro trabajo

La IA no es solo un chat conversacional. La posibilidad real es **generar herramientas útiles para nuestro trabajo**: aplicaciones, scripts, visualizaciones, procesadores de datos, asistentes de investigación — cosas que hacen algo concreto, no solo responden preguntas. El chat es la forma más básica de uso; la potencia está en construir instrumentos que **potencien nuestro trabajo intelectual y organizativo** de forma específica y autónoma.

### Construir nuestro propio espacio de trabajo

Conceptos clave para crear un **espacio de trabajo propio** con IA, independiente del chat genérico:

1. **RAG — Biblioteca propia**: cargar nuestra biblioteca de fuentes verificadas, textos, documentos, para que la IA consulte *nuestro* conocimiento antes de responder. No depender del conocimiento genérico del modelo, sino anclarlo a nuestras fuentes.

2. **API (Interfaz de Programación de Aplicaciones)**: un programita que **traduce entre distintos programas** — permite conectar, por ejemplo, Python con Claude o ChatGPT. Es otra forma de trabajar que no es la ventana de chat: se puede automatizar, procesar datos, construir herramientas. Las **API keys** también se cobran: cada consulta por API tiene un costo por token usado.

   Las API de Claude se encuentran en **https://platform.claude.com/create** — ahí se crean y configuran las API keys específicas para proyectos.

   **Explicación simple**: una API es como un **puente/traductor** entre dos programas. Tu programa (Python) quiere pedirle algo a Claude, pero Claude no "habla" Python. La API es el intermediario: tu programa envía un mensaje → Claude lo recibe → procesa → devuelve respuesta → la API traduce de vuelta. La **API key** es tu identificación para hacer la llamada — cada llamada se cobra.

   **vs. Chat**: en el chat, *vos* escribís y leés manualmente. Con la API, *tu programa* lo hace automáticamente, sin intervención humana, miles de veces si querés.

### Arquitectura de sistema para investigación: 5 componentes

Una arquitectura para **orquestar centralmente trabajos de investigación** — coordinar y controlar todas las etapas del ciclo de producción intelectual:

1. **Agentes de investigación — scripts Python con fanout paralelo**: 10 workers simultáneos. Es el **núcleo de procesamiento** del sistema: múltiples agentes corren en paralelo, cada uno investigando una faceta, procesando datos, generando resultados.

2. **Meta-RAG / Meta-RAG-OSS**: bases de conocimiento **vectorizadas** construidas sobre el corpus curado. No es un RAG simple — es un RAG estructurado sobre el corpus propio del proyecto, organizado para recuperación inteligente.

3. **Asay — verificación**: cruza **cada afirmación del manuscrito** con las fuentes originales del corpus. Genera automáticamente la base de **notas al pie** y reporta **alertas de respaldo faltante** (afirmaciones sin fuente). Control de calidad automatizado.

4. **Doc-Publisher**: genera el **docx académico**, gestiona la **exportación a Zotero**, produce las **visualizaciones y tablas integradas**. La salida final formateada para publicación.

5. **Corpus bibliográfico**: la biblioteca **curada por el equipo investigador**. Define el **horizonte epistemológico** del proyecto — qué fuentes, qué perspectivas, qué conocimiento orienta todo el sistema.

   **La biblioteca es el corazón epistemológico del sistema** — el Meta-RAG. Se estructura en capas:

   - **Core**: fuentes fundamentales del proyecto, marco teórico general
   - **Temático específico**: fuentes sobre el tema particular de investigación
   - **Caso geográfico o subitem**: fuentes del caso de estudio, contexto local/regional
   - **Indicadores y datos estadísticos cuantitativos**: corpus de datos, cifras, series, indicadores

   Cada capa del Meta-RAG es una biblioteca vectorizada independiente pero interconectada, construida sobre el corpus curado del equipo.

### Etapa 1: Flujo interno de cada agente de investigación

Pensar el **flujo interno de cada agente** — cada agente es un worker con un ciclo completo:

1. **Construye preguntas de investigación** — define qué busca, con qué foco, en qué contexto
2. **Consulta el corpus Meta-RAG** — busca en las bibliotecas vectorizadas (core, temático, caso, datos)
3. **Analiza, cruza y sintetiza información** — no solo recupera fuentes, las compara, identifica convergencias y tensiones
4. **Produce informe estructurado** — salida con formato, no texto libre

Cada uno de estos pasos es un **agente** — un worker que procesa una faceta del problema. Los 10 agentes corren en paralelo (fanout), cada uno con su propio flujo interno.

2. **Chat común vs. Proyectos de Claude**: es mejor trabajar con los **Proyectos de Claude** (en claude.ai) que con el chat común. Los proyectos permiten cargar documentos persistentes como contexto, definir instrucciones custom, y mantener un espacio de trabajo estructurado — no empezar de zero cada conversación. El chat común no tiene memoria entre sesiones; los proyectos sí.

3. **Funciones avanzadas**: Investigación (versión paga — búsqueda web integrada), creación de **perfiles (skills)** customizados para tipos de tarea, y las funciones de "Investigación" extendida.

4. **Crear los contextos**: lo más importante es **crear los contextos** para que la IA trabaje. Sin contexto propio, la IA opera con sus patrones de entrenamiento; con contexto (fuentes, instrucciones, perfil, biblioteca), se orienta hacia lo que necesitamos. El contexto es la intervención.

_(Escribí lo que quieras registrar y lo agrego aquí)_

Los chats tienen una **fecha de corte** en su entrenamiento — no saben nada después de esa fecha. Por ejemplo, **ChatGPT fue entrenado solo hasta agosto de 2025**: salvo que se haga una pregunta específica con información nueva provista por el usuario, las respuestas están **limitadas a ese corte temporal**. La IA no "se actualiza" sola; su conocimiento es estático hasta el próximo entrenamiento.

### Pomasa: sistemas multi-agente declarativos

**Pomasa** (Prompt-Defined Multi-Agent Systems) es un **lenguaje de pattern** para generar sistemas multi-agente de forma declarativa. En lugar de programar agentes uno por uno, se define la **arquitectura del sistema** (quiénes son los agentes, qué hacen, cómo se conectan, qué datos intercambian) usando patterns — y Pomasa genera el código automáticamente.

**Para qué funciona:**

- **Orquestar pipelines de agentes**: definir secuencias de agentes que procesan información en etapas (investigar → analizar → verificar → publicar), cada uno con su rol específico, sin programar la coordinación manualmente
- **Automatizar trabajo intelectual**: construir sistemas donde múltiples agentes colaboran en paralelo (fanout) — por ejemplo, 10 agentes investigando simultáneamente diferentes facetas de un problema, cada uno con su flujo interno
- **Data bus por filesystem**: los agentes se comunican entre sí escribiendo y leyendo archivos en un directorio compartido — no necesitan API complejas, el filesystem es el canal de comunicación
- **Verifiable data lineage**: cada paso del procesamiento queda trazado — se puede verificar qué agente produjo qué resultado, sobre qué datos, en qué momento. Trazabilidad completa del proceso

**Patterns principales de Pomasa:**

1. **Prompt-Defined Agent**: el agente se define completamente por su prompt — su rol, su tarea, su formato de salida. No hay código del agente; el prompt es la especificación
2. **Orchestrated Pipeline**: los agentes se organizan en secuencia (pipeline) o en paralelo (fanout), con barreras sincronizadoras donde se necesita
3. **Filesystem Data Bus**: la comunicación entre agentes es por archivos — cada agente lee inputs de archivos y escribe outputs a archivos
4. **Verifiable Data Lineage**: cada output tiene metadata de proveniencia — qué agente lo generó, qué inputs usó, versión del prompt

**Potencialidades para nuestro trabajo:**

- Construir la **arquitectura de sistema para investigación** descrita arriba como un sistema Pomasa declarativo — sin programar cada agente manualmente
- Automatizar el ciclo completo: agentes de investigación → Meta-RAG → verificación (Asay) → publicación (Doc-Publisher), todo orquestado declarativamente
- Escalar: agregar nuevos agentes o modificar el flujo cambiando la definición del pattern, no reprogramando
- **Transparencia**: el sistema declarativo hace visible qué hace cada agente y cómo se conectan — no hay código oculto, la arquitectura es legible en la definición

**Instalación:** Pomasa se instaló como skill en VSCode (Claude Code) — está disponible como comando `/pomasa` dentro del entorno de trabajo.

