# Ecosistema de IA Laboral Soberana

> Reorientación de los proyectos a partir de la tesis central de Xiong: las organizaciones deben ser **diseñadoras y creadoras** de sus propias IA, no consumidoras de IA corporativa. Esto implica soberanía tecnológica, diseño desde abajo, y que la lógica de la herramienta refleje la lógica de la organización — no la inversa.

---

## 1. El giro filosófico: de usar IA a crear IA

La diferencia no es técnica sino política y epistemológica:

| Modelo Silicon Valley | Modelo Xiong / Tricontinental |
|---|---|
| La organización consume IA producida por otros | La organización diseña y crea IA para sus propias lógicas |
| Los datos de la organización alimentan modelos corporativos | Los datos de la organización alimentan modelos propios, bajo control propio |
| La IA impone categorías universales (lo que el modelo "sabe") | La IA opera con categorías situadas (lo que la organización define como relevante) |
| La IA es un servicio externo que se contrata | La IA es una capacidad organizacional que se construye |
| El diseño de la interfaz viene de la empresa | La interfaz emerge de cómo trabaja realmente la organización |
| Riesgo: extracción, dependencia, obsolescencia planificada | Soberanía, autonomía, replicabilidad, control del ciclo de vida |

Esto **no** significa "construir un ChatGPT competitivo desde cero" — es imposible y no es el punto. Significa actuar en cada punto de la cadena donde se decide qué hace la IA, con qué lógica, y para quién.

### Los seis eslabones de la cadena de valor de la IA

1. **Datos** — ¿Qué corpus alimenta el modelo? ¿Quién lo cura? ¿Qué categorías lo organizan?
2. **Arquitectura** — ¿Qué tipo de modelo se necesita? ¿Para qué tarea específica? ¿Con qué tamaño?
3. **Fine-tuning / entrenamiento** — ¿Qué conocimiento específico se codifica? ¿Qué lengua, qué terminología, qué tradición conceptual?
4. **Infraestructura** — ¿Dónde se ejecuta? ¿Quién lo hostea? ¿En qué condiciones de acceso?
5. **Interfaz** — ¿Cómo se interactúa? ¿En qué lenguaje? ¿Con qué workflow real?
6. **Gobernanza** — ¿Quién decide qué hace el sistema? ¿Qué puede y qué no puede? ¿Cómo se audita?

En cada uno de esos seis puntos, una organización puede intervenir — y eso es "crear IA". No hace falta fundar un laboratorio de research en modelos base; hace falta tomar decisiones en cada eslabón de la cadena de valor de la IA que te afecta.

---

## 2. Proyectos reorientados

### Proyecto 1 — Coyuntura Obrera → Sistema de Inteligencia Laboral

No es un boletín con IA que "resume noticias". Es un dispositivo de inteligencia colectiva donde la IA **amplifica** —no reemplaza— la capacidad analítica del movimiento obrero, y la lógica del sistema es definida por los analistas laborales.

**¿Qué IA se crea aquí?**

- **Motor de clasificación de conflictos:** modelo entrenado con corpus obrero (comunicados sindicales, actas de paritarias, notas de prensa laboral) que clasifica observaciones de terreno por tipo de conflicto, sector, intensidad y duración. Las categorías no son las de un modelo genérico ("labor dispute") sino las del campo: paritaria, comisión interna, convenio, lock-out, huelga de acatamiento, trabajo precario, tercerización, afiliación, conflicto inter-sindical, articulación sectorial.
- **Detector de tendencias emergentes:** sobre la serie temporal de observaciones semanales, identifica patrones distribuidos entre sectores y geografías que los analistas humanos podrían no ver. La definición de qué es una "tendencia relevante" viene del campo.
- **Generador de prompts analíticos:** no escribe la coyuntura, genera preguntas que los analistas deben responder (p. ej., "¿Hay correlación entre los conflictos por tercerización en textil y los despidos en automotriz del mismo periodo?"). La IA interroga, no dictamina.

**Soberanía en cada eslabón:**

- *Datos:* corpus producido por correspondientes sindicales y analistas — no se extrae de Twitter ni Google News. La plataforma no envía datos a OpenAI.
- *Modelo:* fine-tuning sobre modelo open-source (Llama, Mistral, etc.) con corpus laboral etiquetado por el campo.
- *Infraestructura:* hosting en servidor propio o comunitario (no AWS/Google Cloud). La UBA u otra universidad puede proveer compute.
- *Interfaz:* diseñada con/para correspondientes y analistas — un workflow, no un chatbot: ingresar observación → sistema clasifica → genera prompts → analista produce lectura → sistema archiva y vincula con serie temporal.
- *Gobernanza:* comité editorial (sindicatos + investigadores + Tricontinental) define qué hace el sistema, qué datos procesa, qué se publica.

**Articulación de actores:**

- *Sindicatos:* producen los datos y definen categorías (data curators / label definers).
- *Universidades:* entrenan y evalúan los modelos (estudiantes de CS, data science, NLP junto a analistas laborales).
- *Prensa:* usa el sistema como fuente — accede a coyunturas, mapas e indicadores.

---

### Proyecto 2 — Historia Obrera Popular → IA de investigación histórica

No "ChatGPT te escribe un resumen de la huelga de 1975". Son herramientas de investigación que amplifican la capacidad historiográfica de trabajadores e investigadores, cuya lógica epistemológica viene de la disciplina histórica.

**¿Qué IA se crea aquí?**

- **Asistente de investigación en archivos laborales:** sobre un corpus de documentos sindicales digitalizados (Proyecto 3), permite buscar por categorías históricas laborales ("comisión interna", "delegado", "paritaria", "convenio colectivo", "intervención sindical", "pluralidad sindical"), identificar relaciones entre documentos y generar cronologías automáticas que el historiador verifica, corrige y amplía. El modelo se fine-tunea para entender que "intervención sindical" no es "intervención médica" y que "paritaria" es una institución específica del derecho laboral argentino.
- **Motor de transcripción y anotación:** transcribe documentos históricos (manuscritos, imprentas antiguas, fotografías de actas) y los anota con metadata histórica. El historiador supervisa y corrige; la IA acelera un trabajo que hoy toma meses.
- **Constructor de narrativas guiado:** dado un conjunto de fuentes seleccionadas por el historiador, propone esquemas narrativos (cronológicos, temáticos, escalares). La IA propone caminos; no camina.

**Componente formativo renovado** — los talleres en sindicatos incluyen el módulo *"Tu sindicato puede crear IA"*:

- Qué es un modelo de lenguaje y cómo funciona (conceptual, no técnico).
- Por qué el corpus de entrenamiento define lo que el modelo "sabe" y "puede".
- Por qué las categorías de etiquetado definen lo que el sistema "ve".
- Cómo participar en el diseño: definir necesidades, categorías, workflow.
- Qué decisiones tomar: datos propios vs. corporativos, modelo open-source vs. API, infraestructura propia vs. cloud.

Esto es **alfabetización tecnológica soberana**: no aprender a usar herramientas existentes, sino aprender a decidir sobre las herramientas que te afectan.

---

### Proyecto 3 — Archivos del Trabajo → Infraestructura de datos laborales soberanos

Es el proyecto donde la tesis de Xiong se materializa con mayor potencia. Los archivos no son solo "documentos organizados": son **datos**, el combustible de toda IA. Si los sindicatos no controlan sus datos, cualquier IA que los procese los está extrayendo.

**¿Qué IA se crea aquí?**

- **Motor de descripción archivística sindical:** propone fichas de descripción adaptadas, no con categorías genéricas de ISAD(G) sino con extensiones específicas para archivos laborales:
  - *Tipo documental:* acta de asamblea, acta de comisión directiva, comunicado de prensa, circular interna, convenio colectivo, nota de paritaria, balance financiero, informe de delegado, telegrama, resolución ministerial, flyer de campaña, foto de marcha.
  - *Actor sindical:* sindicato, federación, confederación, comisión interna, cuerpo de delegados, sección sindical, agrupación, corriente sindical.
  - *Contexto:* huelga, negociación paritaria, conflicto inter-sindical, intervención, fusión, congreso, campaña de afiliación.

  El sistema no inventa estas categorías: las aprende de fichas producidas por archiveros laborales. Cada corrección mejora el modelo, que queda bajo control del programa.
- **Sistema de búsqueda federada:** permite buscar entre varios archivos sindicales **sin centralizar** los documentos. Cada sindicato tiene su propio repositorio; la consulta va y vuelve, con permisos diferenciados. Lo opuesto a "subir todo a una nube central".
- **Constructor de series documentales:** dado un archivo desorganizado, propone agrupamientos con lógica sindical ("serie de paritarias del sector", "serie de comunicados de campaña", "serie de actas de cuerpo de delegados").

**Principio de soberanía de datos —no solo de modelos:**

- Los documentos nunca se suben a plataformas corporativas para procesamiento.
- El corpus de entrenamiento pertenece al programa; no se usa para entrenar modelos de terceros.
- Los sindicatos deciden qué se digitaliza, qué se publica, qué se reserva.
- Los datos de uso no se monetizan: se usan para mejorar el sistema y para investigación, bajo control del comité del programa.

Sin datos soberanos, no hay IA soberana. El Proyecto 3 es el suelo sobre el que se construyen los Proyectos 1 y 2.

---

### Proyecto 6 — Laboratorio de IA Laboral (el proyecto-meta)

De los proyectos anteriores emerge el núcleo metodológico del enfoque Xiong: un espacio de **codiseño** donde sindicatos, universidades y Tricontinental diseñan juntos las herramientas de IA. No es un "dev team" que construye tools para usuarios.

**El ciclo de codiseño:**

- Los **sindicatos** definen necesidades y lógicas ("necesitamos algo que clasifique comunicados por tipo y urgencia", "que transcriba actas manuscritas", "que detecte si un conflicto se extiende a otros sectores").
- Los **investigadores** traducen esas necesidades a especificaciones técnicas (tipo de modelo, corpus, evaluación, interfaz).
- Los **desarrolladores** implementan sobre modelos open-source con infraestructura soberana.
- Los **sindicatos** testean y corrigen en su trabajo real.
- El ciclo se repite: cada iteración mejora el sistema, que queda bajo control del programa.

**Productos del Laboratorio:**

- **Modelos fine-tuned laborales** especializados en corpus laboral latinoamericano, disponibles para cualquier organización del programa.
- **Datasets laborales etiquetados** por archiveros e historiadores del programa. Abiertos para organizaciones del programa, no para corporaciones.
- **Guías de codiseño:** documentación metodológica sobre cómo organizar un proceso de codiseño entre organizaciones sociales y técnicos — el know-how del proceso, no solo el producto.
- **Kit de arranque:** starter kit para sindicatos que quieren empezar a construir su propia IA (infraestructura mínima, datos a curar, modelos open-source accesibles, procesos de fine-tuning).

---

### Proyecto 5 — Morfología de la clase trabajadora

Trabajo comparativo entre **Brasil, India, Sudáfrica y Argentina** sobre la forma de la clase trabajadora bajo el capitalismo tardío, financiero y tecnológico. Existe un plan de 6 meses con bibliografía, vinculado al encuentro 3 del curso Tricontinental ("Morfología de los pueblos del Sur: un mapeo realista"). Define las **categorías** y la **taxonomía soberana** que estructuran todo el ecosistema: es su epistemología.

---

## 3. Proyecto 7 — La app de asistencia laboral y argumentativa

> **Nota:** el nombre "Compañero" queda descartado. El nombre definitivo está pendiente. La app debe ser **útil para cualquier trabajador, incluso los reacios al sindicalismo**, y evitar convertirse —desde el nombre y el encuadre— en un limitante para su uso.

### Por qué "compañero" y no "asistente" (como lógica de diseño)

Un "asistente" te ayuda a hacer algo que ya sabés que necesitás hacer. Un compañero camina con vos, te ayuda a pensar lo que no sabías que necesitaba pensarse, y está diseñado desde la lógica de quien camina — no de quien observa. No es un diccionario de convenios ni un chatbot legal genérico: está del mismo lado y ayuda al trabajador a entender, argumentar y actuar en su situación concreta.

### Módulo 1 — Convenio vivo

Todos los convenios colectivos de la rama, pero como **convenio interactivo**, no como PDF estático:

- Preguntas en lenguaje natural ("¿Qué dice mi convenio sobre horas extra?", "¿Puede la empresa cambiar mi categoría sin mi consentimiento?").
- La IA extrae la cláusula pertinente, la explica en lenguaje accesible y la contextualiza (en qué paritaria se incorporó, tras qué conflicto).
- Muestra interpretaciones jurisprudenciales o modificaciones posteriores: la cláusula en su historia, no aislada.
- Permite comparar un tema entre el convenio del sector y otros sectores.

*Soberanía:* los convenios vienen del Centro de Documentación, no de un scraper legal corporativo. La IA está fine-tuned sobre convenios colectivos argentinos.

### Módulo 2 — Luchas y discursos

- **Luchas del sector** con cronología visual: huelgas, paritarias, conflictos, campañas, textos clave, audio/video, fotos.
- **Discursos de líderes:** audio original + resumen por IA (del Laboratorio, no de un modelo genérico).
- **Argumentos de la organización:** no solo el comunicado sino la argumentación que lo sostiene (por qué se demanda, qué datos, qué historia).
- **Conexión histórica:** cada lucha actual vinculada a la serie de luchas anteriores del sector.

*Soberanía:* la información viene de Coyuntura Obrera + Centro de Documentación; los discursos se curan con autorización del sindicato.

### Módulo 3 — Panorama del sector (nacional e internacional)

- **Nacional:** producción, empleo, salarios, conflictos, paritarias, datos del INDEC traducidos a categorías morfológicas. No datos crudos sino lectura procesada.
- **Internacional:** qué ocurre en la misma rama en otros países (Brasil, India, Sudáfrica, Alemania). No para imitar, sino para contextualizar.
- **Comparación morfológica:** mapa de cómo se organiza el sector en distintos países (fracciones de clase, formas de lucha, condiciones). Output del Proyecto de Morfología hecho visible.

*Soberanía:* información de la red de Centros de Documentación + red de Coyuntura Obrera; comparación con taxonomía soberana. No es Reuters ni Bloomberg filtrados por un modelo corporativo.

### Módulo 4 — Asistencia argumentativa (el más Xiong)

No es "legal advice" genérico: es ayuda para pensar y argumentar **desde la posición del trabajador**.

Ejemplos de escenarios:

- *"Me piden horas extra sin compensación"* → la app reúne (1) la cláusula que protege, (2) argumentos jurídicos, (3) argumentos políticos, (4) argumentos históricos, (5) cómo plantearlo en asamblea, (6) qué pasos sigue la organización.
- *"La empresa quiere cambiar las condiciones de trabajo"* → construye una posición: qué demandas son posibles, qué precedentes existen, qué datos sustentan, qué experiencias de otros sectores/países son relevantes, qué estrategia sugiere el sindicato.
- *"Necesito explicar a compañeros por qué organizarse"* → argumentos basados en datos del sector, comparación internacional, historia del sector y discursos que ya funcionaron.
- *"Estamos en paritaria"* → convenio actual, datos de salario/costo de vida, comparación con otros convenios y con el plano internacional, posición del sindicato, argumentos de la patronal (para preparar contra-argumentos) e historia de paritarias previas y sus resultados.

La IA **no aconseja**: amplía el arsenal argumentativo (datos, cláusulas, precedentes, comparaciones, historias). El trabajador decide. Está entrenada desde la perspectiva del trabajador — no es neutral, es una posición epistemológica deliberada definida por el campo que la diseñó. *El modelo refleja la lógica de quien lo crea, no de quien lo vende.*

### Módulo 5 — Conexión organizativa

- Directorio de delegados y referentes del sector.
- Calendario de actividades (asambleas, marchas, paritarias, formación).
- Canal de comunicación estructurado: clasifica por tipo (consulta de convenio, reporte de situación, solicitud de asistencia) y enruta al referente adecuado.
- Conexión con Coyuntura Obrera: cualquier trabajador con la app puede aportar observaciones, **con privacidad** (sin nombre ni ubicación sin consentimiento).

---

## 4. Diseño técnico — orientación Xiong

1. **Local-first:** convenio del sector, luchas principales, discursos relevantes y modelo IA básico se almacenan en el teléfono. La app funciona sin conexión para lo más importante; solo necesita conexión para actualizar datos, consultar el panorama internacional y sincronizar observaciones.
2. **Privacidad por diseño:** los datos personales del trabajador nunca se envían al backend sin consentimiento explícito. Las observaciones a Coyuntura Obrera se anonimizan ("observación del sector X", no "de Juan Pérez de la planta Y"). En contextos de conflicto, la app no puede ser herramienta de identificación.
3. **Infraestructura soberana:** el backend corre en infraestructura del Centro de Documentación / Laboratorio IA, no en AWS/Google Cloud. Los modelos corren en servers propios.
4. **Modelo IA local:** una versión compacta del modelo fine-tuned (small LLM tipo Phi-3, Gemma 2B) corre en el teléfono para lo básico; las funciones complejas consultan el modelo grande en el backend soberano. Offline para lo básico, online para lo avanzado.
5. **Interfaz diseñada con trabajadores:** modular y concreta. Pantalla de inicio "¿Qué necesitás?" con opciones claras (Convenio / Luchas / Panorama / Argumento / Contacto). Lenguaje del trabajador, no del abogado ni del ingeniero. Español (y portugués para Brasil, misma infraestructura).
6. **Actualización controlada:** el trabajador decide la frecuencia de sync. Sin push notifications invasivas; sí alertas voluntarias (asamblea, convenio actualizado, conflicto nuevo en el sector).

**Flujo bidireccional:** la app no solo consume información del ecosistema, lo alimenta. Los trabajadores que la usan son correspondientes naturales de Coyuntura Obrera; sus consultas son datos de uso que el Laboratorio usa para mejorar el sistema — con consentimiento y dentro del ecosistema soberano.

---

## 5. Lo que NO es — distinciones críticas

| NO es… | SÍ es… |
|---|---|
| Un chatbot legal genérico ("labor law AI") | Una herramienta posicionada del lado del trabajador |
| La app de un sindicato específico (tipo "app de la CGT") | Una plataforma del movimiento obrero que cada sindicato adapta |
| Un scraper de convenios que muestra PDFs | Un convenio vivo: interactivo, explicado, contextualizado, comparado |
| Una news app de "labor news" | Inteligencia laboral: lectura procesada con categorías del campo |
| Una app de startup que extrae datos de trabajadores | Soberana: datos privados quedan en el teléfono; lo compartido se anonimiza |
| Un chatbot "neutral" que presenta "both sides" | Un compañero que argumenta desde la posición del trabajador |
| Un producto de Silicon Valley adaptado | Un producto del campo obrero, diseñado con input de trabajadores |

---

## 6. Mapa de proyectos final

| # | Proyecto | Función | Rol Xiong |
|---|---|---|---|
| 1 | Coyuntura Obrera | Captura lo urgente, produce inteligencia | IA de inteligencia laboral |
| 2 | Historia Obrera Popular | Forma y divulga, historia desde abajo | IA historiográfica + formación |
| 3 | Centro de Documentación Laboral | Procesa, organiza, distribuye información | Infraestructura de datos soberanos |
| 4 | Periodismo Laboral Colaborativo | Amplifica narrativas en medios | Usa inteligencia del campo |
| 5 | Morfología de la clase trabajadora | Define categorías, taxonomía soberana | Epistemología del ecosistema |
| 6 | Laboratorio de IA Laboral | Codiseña IA, produce modelos | Metaproyecto Xiong |
| 7 | App del trabajador (nombre pendiente) | Asistencia y argumentación al trabajador | IA en la mano del trabajador |

**Lógica del ecosistema:**
Morfología (5) define las categorías → Centro de Documentación (3) organiza los datos con esas categorías → Laboratorio IA (6) produce modelos con esos datos y categorías → Coyuntura (1), Historia (2), Periodismo (4) y la App (7) usan esos modelos. La App (7) alimenta de vuelta: observaciones → Coyuntura (1) → Centro de Documentación (3) → Laboratorio IA (6). **Ciclo cerrado y soberano.**

---

## 7. Próximos pasos (notas de trabajo)

- **La app es la punta de la pirámide**, donde todo el ecosistema se hace tangible y usable para el trabajador individual. Hay que apuntar ahí.
- Implementar todo junto es inviable. Definir **qué hubs y qué nodos** alimentan la app primero.
- Candidatos a primeros pasos para ir alimentando la app: **Laboratorio de IA**, **Coyuntura** y **Archivo** — de ahí puede ir saliendo lo inicial.
- En la app, el trabajador podría ver **cada servicio por separado** (informativo, archivo, historia obrera, etc.).
- El nombre debe ser de **utilidad para cualquier trabajador, incluso los reacios al sindicalismo** — que el encuadre no limite el uso.
