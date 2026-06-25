# Ecosistema Hornero — Núcleos potenciales

> Ideas para funciones que el ecosistema podría incorporar según demanda del sindicato piloto. No tienen número asignado ni carpeta — son potenciales que se implementan cuando el sindicato lo demande explícitamente. Cada idea mantiene la lógica Xiong: **la organización diseña y crea la herramienta, no consume una hecha por otros**.

---

## Potencial: Servicios y Beneficios Sindicales

### Problema que resuelve

Los sindicatos ofrecen servicios y beneficios a sus afiliados — obra social, turismo social, descuentos, subsidios, becas, asistencia legal, vivienda, créditos — pero esa información suele estar dispersa, desactualizada, y el afiliado no siempre sabe qué le corresponde ni cómo acceder. Muchos trabajadores afiliados **no usan los beneficios que ya tienen** porque no los conocen, no entienden los requisitos, o el proceso es burocrático y confuso. Los no afiliados, a su vez, no ven claramente qué ganan con afiliarse — el "valor visible" del sindicato queda opaco.

### Función del núcleo

**Centralizar, hacer visible y accesible el universo de servicios y beneficios** que el sindicato ofrece a sus afiliados. No es solo un catálogo: es un sistema que le dice al trabajador **qué le corresponde, cómo acceder, y qué está usando**. El sindicato decide qué ofrece; el núcleo hace que eso sea visible, procesable y útil.

### ¿Qué IA se crea aquí?

- **Motor de correspondencia de beneficios:** dado el perfil del trabajador (sector, categoría, antigüedad, situación familiar, localidad), el modelo identifica automáticamente qué servicios y beneficios le corresponden y cuáles no está usando. No es un genérico "recommendation engine" — está entrenado con la lógica de cada sindicato: quién accede a qué, bajo qué condiciones, con qué trámites.
- **Asistente de trámites:** guía al trabajador paso a paso en cada solicitud — qué documentación presentar, dónde, en qué plazo. Reduce la burocracia percibida sin eliminar la necesaria. El modelo aprende de los trámites reales (no de un manual ideal) y se actualiza cuando el sindicato modifica requisitos.
- **Comparador de beneficios inter-sindical:** permite comparar qué ofrecen distintos sindicatos del mismo sector o región — no para competir, sino para que la federación o confederación identifique desigualdades y negocie mejores condiciones colectivas. La comparación es un instrumento de **negociación paritaria de beneficios**, no de marketing individual.
- **Analista de uso y cobertura:** procesa datos internos de uso de servicios para detectar brechas — beneficios que nadie usa (¿barrera de acceso?), beneficios que se saturan (¿necesidad de ampliar?), categorías de trabajadores excluidas. Produce informes que la conducción del sindicato usa para decisiones de política de servicios.

### Expresión en la App — subsección 9j: Servicios

- **Mis beneficios:** pantalla personalizada que muestra qué le corresponde al trabajador, qué está usando, qué no está usando, y qué trámites tiene en curso. No un listado genérico — un mapa individual de su relación concreta con los servicios del sindicato.
- **Cómo acceder:** guía paso a paso para cada servicio, con documentación requerida, plazo, y estado del trámite si ya lo inició.
- **Descuentos y turismo social:** geolocalización de descuentos disponibles — comercios, transporte, salud, educación — filtrados por sector y localidad. Turismo social: destinos, plazas, calendario, requisitos.
- **Obra social y salud:** cobertura del plan de salud, prestadores por zona, turno online, autorizaciones, estado de trámites médicos.
- **Subsidios y becas:** qué subsidios hay (maternidad, fallecimiento, vivienda), qué becas educativas, requisitos, plazos de inscripción.
- **Créditos y vivienda:** líneas de crédito del sindicato, tasas, requisitos, simulador de cuotas con datos reales (no estimaciones genéricas).
- **Por qué afiliarse:** para el no afiliado o el trabajador que duda — muestra el valor concreto en su sector y localidad. No propaganda abstracta: datos específicos de lo que gana quien está afiliado vs. quien no.

### Soberanía

- Los datos de uso de servicios son internos al sindicato — no se venden ni se monetizan. Se usan para mejorar la política de servicios y para que la conducción tome decisiones informadas.
- El perfil del trabajador se usa solo para correspondencia de beneficios — no para profiling comercial.
- La comparación inter-sindical se coordina a nivel federación/confederación, con permisos diferenciados por sindicato.
- Infraestructura: datos procesados en el ecosistema soberano (Núcleo 2), modelos del Laboratorio IA (Núcleo 1), información del Centro de Documentación (Núcleo 4).

### Articulación con otros núcleos

- **Núcleo 3 (IS):** datos de afiliación y categorías laborales alimentan el motor de correspondencia.
- **Núcleo 4 (Documentación):** normativa de cada servicio/beneficio (reglamentos internos, convenios que los instituyen) es la base documental.
- **Núcleo 6 (Morfología):** datos estadísticos de cobertura — qué porcentaje de trabajadores del sector accede a qué beneficios — alimenta comparaciones y análisis de brechas.
- **Núcleo 9g (Argumento):** "por qué afiliarse" articula con Argumento para construir la posición argumentativa — no solo listado de beneficios sino argumentos estructurados.

---

## Potencial: Bolsa de Trabajo / Mercado Laboral

### Problema que resuelve

El mercado laboral interno del sindicato — vacantes, cuberturas, pasantías, reemplazos, ascensos — suele circular de palabra, en grupos de WhatsApp, o en pizarras de la sede. El trabajador no tiene visibilidad completa de las oportunidades; el sindicato no tiene sistema para recepcionar CVs y matchear perfiles con vacantes; la empresa llena vacantes con sus propios criterios sin intervención sindical. El resultado: **el sindicato pierde injerencia sobre quién entra a trabajar y dónde**, y el trabajador pierde oportunidades que le corresponden por convenio.

En un contexto de tercerización y precarización, controlar la bolsa de trabajo es **controlar la puerta de entrada al sector** — una función sindical histórica que muchas organizaciones han dejado debilitar.

### Función del núcleo

**Recepcionar, organizar y matchear ofertas y demandas de trabajo dentro del universo sindical.** No es un "LinkedIn obrero": es un sistema donde el sindicato gestiona el mercado laboral interno — vacantes que las empresas notifican (por obligación convencional o voluntad), CVs de afiliados y candidatos, y matching con categorías del convenio. El sindicato decide quién ve qué, y la IA amplifica la capacidad de conexión sin reemplazar la decisión humana.

### ¿Qué IA se crea aquí?

- **Motor de matching laboral sindical:** no es un genérico "job matching" con categorías corporativas (skills, seniority level). Usa las categorías del convenio colectivo — categoría profesional, grupo, sección, turno, antigüedad requerida, especialidad — para matchear perfiles con vacantes. Las categorías son las del campo, no las de LinkedIn.
- **Detector de irregularidades en cobertura:** cuando una empresa notifica vacantes, el modelo cruza con el convenio para detectar si la categoría ofrecida, el salario propuesto, o las condiciones matchean lo que el convenio establece. Si la empresa ofrece "operario" donde el convenio dice "operario especializado", lo marca.
- **Analista de mercado laboral sectorial:** procesa las vacantes recibidas, los CVs ingresados, y los datos de IS (Núcleo 3) para producir informes sobre dinámica del mercado laboral del sector — qué categorías se buscan más, qué zonas tienen más vacantes, qué empresas cubren rápido y cuáles tardan (posible indicio de condiciones laborales deficientes).
- **Constructor de CV sindical:** asiste al trabajador para armar su CV con las categorías del convenio — no un CV genérico con "skills" inventadas, sino un perfil que el convenio reconoce. El trabajador carga su experiencia real; el modelo la traduce a las categorías convencionales que el sindicato y la empresa comprenden.

### Expresión en la App — subsección 9k: Bolsa de Trabajo

- **Vacantes del sector:** listado de ofertas activas, filtradas por rama, categoría, zona, turno. Cada vacante muestra categoría convencional, salario según convenio, condiciones, empresa, y plazo. Si la oferta está por debajo del convenio, se marca con alerta.
- **Mi perfil laboral:** CV construido con categorías del convenio. El trabajador carga su experiencia, el modelo la organiza en las categorías que el convenio reconoce. Privacidad: el CV solo se muestra a vacantes donde el trabajador decide postularse; no es público por default.
- **Matching automático:** el sistema notifica al trabajador cuando hay vacantes que matchean su perfil — pero el trabajador decide si postularse. No es "aplicación automática"; es visibilidad ampliada.
- **Alertas de irregularidad:** si una vacante del sector no cumple el convenio (categoría inferior, salario menor, condiciones distintas), el sindicato lo ve y puede actuar. El trabajador también ve la comparación entre lo que la empresa ofrece y lo que el convenio establece.
- **Estadísticas del mercado:** datos agregados — qué categorías se buscan, qué zonas tienen más movimiento, qué empresas cubren más rápido — en lenguaje claro (Morfología, Núcleo 6).
- **Reemplazos y coberturas temporales:** sistema específico para vacantes de reemplazo (licencia, accidente, vacaciones) — una función sindical concreta donde la rapidez de cobertura importa y el convenio tiene reglas específicas.

### Soberanía

- Los CVs son privados — solo visibles para vacantes donde el trabajador decide postularse. El sindicato puede ver datos agregados (perfiles disponibles por categoría) sin acceder a datos individuales sin consentimiento.
- Las vacantes que las empresas notifican son información sindical — no se publican en plataformas externas sin decisión del sindicato.
- El matching usa categorías del convenio (Núcleo 4) y datos de IS (Núcleo 3) — no categorías corporativas.
- Los datos de mercado laboral sectorial se procesan dentro del ecosistema (Núcleo 2) y alimentan informes de IS (Núcleo 3) y Morfología (Núcleo 6).

### Articulación con otros núcleos

- **Núcleo 4 (Documentación):** categorías del convenio, escalas salariales, condiciones de cobertura — la base normativa del matching.
- **Núcleo 3 (IS):** datos de conflictos, tercerización, precarización — contexto que enmarca el mercado laboral.
- **Núcleo 6 (Morfología):** datos estadísticos de mercado laboral sectorial — composición del sector, categorías predominantes, dinámica de empleo.
- **Núcleo 11 (CE):** si una empresa tiene índice ICE alto, el sistema puede alertar al trabajador que postula — "esta empresa tiene indicadores de comportamiento empresarial negativo; consultá Comportamiento Empresarial (5i) para más info". No bloquea la postulación, informa.
- **Núcleo 9g (Argumento):** articula con Argumento cuando el trabajador necesita argumentar en una entrevista o negociación de condiciones — datos del convenio, comparaciones sectoriales, posición del sindicato.

### Distinción crítica

| NO es… | SÍ es… |
|---|---|
| Un LinkedIn obrero | Un sistema donde el sindicato gestiona el mercado laboral interno |
| Un portal de empleo genérico | Matching con categorías del convenio, no con "skills" corporativas |
| Un sistema donde el trabajador postula sin saber las condiciones | Cada vacante muestra categoría convencional, salario del convenio, y alertas de irregularidad |
| Una bolsa que remplaza la función sindical | Una bolsa que **amplifica** la función sindical de controlar la puerta de entrada |
| Un sistema donde la empresa define quién entra | Un sistema donde el sindicato tiene visibilidad e injerencia sobre las coberturas |

---

## Potencial: Salud Laboral y Seguridad en el Trabajo

### Problema que resuelve

La salud laboral — riesgos, accidentes, enfermedades profesionales, condiciones de seguridad — es una función sindical central que suele quedar relegada a la Comisión de Seguridad e Higiene o a la obra social. El trabajador no siempre sabe qué riesgos tiene en su sector, qué enfermedades profesionales le corresponden, cómo reportar un accidente, o qué requisitos de seguridad la empresa debe cumplir. Las estadísticas de accidentes y enfermedades profesionales se producen con criterios empresariales o estatales — no con categorías sindicales.

### Función del núcleo

**Centralizar información y acción sobre salud laboral y seguridad** — desde la posición del trabajador. No es una app de "wellness": es un sistema donde el sindicato gestiona el conocimiento sobre riesgos, la denuncia de condiciones inseguras, y la producción de datos sobre salud laboral con categorías propias.

### ¿Qué IA se crea aquí?

- **Mapa de riesgos laborales sectorial:** sobre datos del convenio (Núcleo 4), estadísticas de accidentes (Núcleo 6), y denuncias de trabajadores, construye un mapa dinámico de riesgos por sector, empresa, zona, y categoría. Las categorías de riesgo son definidas por las Comisiones de Seguridad e Higiene — no por classifications corporativas.
- **Detector de incumplimientos de seguridad:** cruza las condiciones reportadas con las normativas vigentes (Ley de Higiene y Seguridad, resoluciones específicas, convenio) para identificar incumplimientos. Produce un informe que la Comisión de SyH usa para exigir corrección.
- **Asistente de denuncia de accidentes:** guía al trabajador para denunciar un accidente o condición insegura — qué información proporcionar, cómo documentar, qué pasos sigue el sindicato. No es un formulario burocrático: es un asistente que entiende el contexto laboral.
- **Analista de enfermedades profesionales:** sobre datos de incidencia por sector, identifica patrones — enfermedades que se concentran en determinadas categorías, empresas, o zonas — y produce alertas para la Comisión de SyH y la conducción sindical.

### Expresión en la App — subsección 9l: Salud Laboral

- **Riesgos de mi sector:** mapa de riesgos específicos del sector del trabajador, con explicación en lenguaje claro — qué riesgos existen, cómo se previenen, qué normativa protege.
- **Reportar condición insegura:** interface para denunciar condiciones de seguridad — con opción de anonimato si el trabajador no quiere identificarse. El sistema guía la documentación (fotos, descripción, ubicación).
- **Enfermedades profesionales:** qué enfermedades profesionales reconoce la ley para el sector, requisitos para denuncia, trámites, y precedentes.
- **Normativa de seguridad:** qué exige la ley y el convenio en materia de seguridad para el sector — EPP, capacitación, condiciones del workplace. En lenguaje claro, con fuente (Núcleo 4).
- **Estadísticas de accidentes:** datos agregados del sector — accidentes por tipo, categoría, empresa, zona — en lenguaje claro (Morfología, Núcleo 6). No estadísticas empresariales: categorías sindicales.

### Soberanía

- Las denuncias de condiciones inseguras son **encriptadas y anonimizables** — el trabajador decide si se identifica. En contextos de conflicto, la denuncia no puede ser herramienta de represalia empresarial.
- Los datos de salud laboral son internos al sindicato — no se comparten con la empresa sin decisión del sindicato.
- El mapa de riesgos se construye con datos del ecosistema (IS, Documentación, Morfología) — no con datos de la empresa.

---

## Potencial: Formación y Capacitación Sindical

### Problema que resuelve

Los sindicatos ofrecen formación — cursos, talleres, diplomaturas, seminarios — pero la oferta suele estar dispersa, el trabajador no siempre sabe qué hay disponible, y no hay sistema que conecte las necesidades de formación del sector con la oferta existente. La capacitación se organiza con criterios de oferta ("tenemos este curso") no de demanda ("este sector necesita formación en X").

### Función del núcleo

**Organizar, hacer visible y conectar la formación sindical** — desde la posición del trabajador. No es un LMS genérico (Moodle corporativo): es un sistema donde el sindicato gestiona la formación como función organizacional — qué se necesita, qué se ofrece, quién la necesita, qué impacta.

### ¿Qué IA se crea aquí?

- **Analista de necesidades de formación:** sobre datos de IS (conflictos recurrentes, problemas de cobertura, denuncias de salud laboral), Morfología (composición del sector, categorías emergentes), y convenio (competencias requeridas por categoría), identifica brechas de formación — qué necesita aprender el sector que no está aprendiendo.
- **Motor de recomendación de formación:** dado el perfil del trabajador (sector, categoría, antigüedad, rol sindical), recomienda formación pertinente — no cursos genéricos, sino formación específica para su rol y su momento. La Comisión de Educación del sindicato define la oferta; el modelo la conecta con la demanda.
- **Constructor de trayectos formativos:** propone itinerarios de formación — no cursos aislados sino secuencias que responden a un objetivo organizacional (delegado nuevo → formación inicial → especialización → liderazgo). El sindicato define los trayectos; el modelo los personaliza.
- **Evaluador de impacto de formación:** cruza datos de participación en formación con datos de IS (conflictos, cobertura de vacantes, salud laboral) para evaluar si la formación está teniendo impacto real. No satisfaction surveys: datos de resultado.

### Expresión en la App — subsección 9m: Formación

- **Qué formación necesito:** recomendaciones personalizadas — qué cursos, talleres, diplomaturas corresponden al perfil del trabajador y al momento del sector.
- **Catálogo de formación:** cursos, talleres, seminarios disponibles — filtrados por sector, modalidad (presencial/online), y fecha. Con inscripción directa desde la app.
- **Mi trayecto formativo:** itinerario personalizado — qué ya hizo, qué le recomienda hacer, qué viene después. Visualización del camino, no del curso aislado.
- **Historia Obrera formativa:** articulación directa con Núcleo 5 — los productos de HO (efemérides, podcasts, Retazos) como componentes del trayecto formativo, no solo entretenimiento.
- **Impacto de la formación:** datos agregados — cómo la formación del sector impacta en conflictos, cobertura, salud laboral — en lenguaje claro.

---

## Potencial: Asamblea y Participación

### Problema que resuelve

La asamblea es el órgano máximo del sindicato — pero la participación suele ser baja, la información previa escasa, y los mecanismos de consulta entre asambleas prácticamente inexistentes. El trabajador llega a la asamblea sin saber qué se va a tratar, sin acceso a los documentos que se discuten, y sin forma de participar si no puede ir físicamente. En sindicatos con miles de afiliados dispersos geográficamente, la asamblea real es una minoría que decide por todos.

### Función del núcleo

**Ampliar y facilitar la participación democrática del sindicato** — sin reemplazar la asamblea física. No es "votación online": es un sistema que informa, consulta, y recoge voz antes, durante, y después de la asamblea. La tecnología amplifica la democracia sindical; no la digitaliza para convenience.

### ¿Qué IA se crea aquí?

- **Resumidor de documentos de asamblea:** dado el orden del día y los documentos asociados (informes, propuestas, balances), produce resúmenes en lenguaje claro que el trabajador recibe antes de la asamblea — no para que la IA "decida", sino para que el trabajador llegue informado.
- **Analista de participación:** procesa datos de asistencia, consultas previas, y comentarios para producir informes de participación — qué temas generan más interés, qué sectores participan menos, qué franjas horarias funcionan. La conducción del sindicato usa estos datos para mejorar la organización democrática.
- **Constructor de preguntas de consulta:** cuando la conducción quiere consultar al afiliado sobre un tema entre asambleas, el sistema asiste en la formulación de la consulta — no para manipular la respuesta, sino para que la pregunta sea clara, neutral, y comprensible. La Comisión Electoral verifica.

### Expresión en la App — subsección 9n: Asamblea

- **Próxima asamblea:** fecha, lugar, orden del día, documentos a discutir — disponibles antes de la asamblea, con resumen en lenguaje claro.
- **Consultas previas:** mecanismos de consulta entre asambleas — el sindicato consulta, el afiliado opina. No es votación: es participación informada. Las condiciones de cada consulta las define la Comisión Electoral.
- **Asamblea en vivo:** para el afiliado que no puede ir físicamente — transmisión, seguimiento del orden del día, y mecanismos de participación conforme a la normativa sindical (no reemplaza la presencia física en lo que el estatuto exige presencia).
- **Documentos de asamblea:** acceso a informes, propuestas, balances — con fuente (Núcleo 4) y resumen (IA).
- **Historial de asambleas:** registro de asambleas previas, decisiones tomadas, resultados de votaciones — archivo democrático accesible.

### Soberanía — fundamental

Este núcleo tiene **requisitos de soberanía reforzados**:

- Las consultas y votaciones son **encriptadas end-to-end** — ni la empresa ni ningún actor externo puede acceder.
- La identidad del votante se verifica conforme al estatuto sindical — el sistema no inventa identidad, verifica la que el sindicato define.
- Los resultados se procesan dentro del ecosistema (Núcleo 2) — nunca se envían a servidores externos.
- La Comisión Electoral del sindicato tiene **control total** sobre las condiciones de cada consulta.
- **Distinción crítica:** esto NO es "votación digital" que reemplaza la asamblea. Es infraestructura que **amplifica** la participación democrática.

---

## Priorización sugerida

1. **Bolsa de Trabajo** — alta demanda concreta, función sindical histórica. Prioritario para piloto aceitero.
2. **Servicios y Beneficios** — visibleiza valor afiliación, hook de entrada para no afiliados.
3. **Asamblea y Participación** — importancia democrática fundamental, complejidad alta. Implementar cuando sindicato lo demande.
4. **Salud Laboral** — función central, requiere Comisión SyH activa.
5. **Formación** — importante, dependiente de oferta formativa organizada.

---

## Notas para desarrollo

- Estos potenciales no tienen número asignado ni carpeta — se implementan según demanda del sindicato piloto
- Tu historia y Felicidad/IFT ya están implementados como Núcleos 12 y 13 — ver `hornero-capa3/nucleos6-13-backend.md`
- Cuando un potencial se implemente, se le asigna número y carpeta correspondiente
- Cada potencial se desarrolla **con codiseño** — sindicatos definen necesidades, investigadores traducen, desarrolladores implementan
