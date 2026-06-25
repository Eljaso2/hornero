# Hornero — Núcleo 7: Nuestro Derecho

> La posición oficial del sindicato, documentada. Convenios, leyes, discursos, volantes, resoluciones de asamblea, exposiciones en Congresos de delegados — todo lo que el movimiento obrero produce y custodia como su posición. No es un archivo genérico: es la voz documentada del campo. Sin archivos soberanos, no hay IA soberana.

---

## Qué va aquí — y qué no

**Va en Nuestro Derecho:** la posición oficial del sindicato — todo lo que el movimiento obrero produce, define, y custodia:

1. **Convenios colectivos** — todos los CCT de la rama, no como PDFs estáticos sino como convenio vivo: interactivo, explicado, contextualizado, comparado. La IA está fine-tuned sobre convenios colectivos argentinos.
2. **Leyes laborales** — Ley de Contrato de Trabajo (20.744), normativa laboral, decretos, resoluciones. En lenguaje claro, con artículo, vigencia, jurisprudencia.
3. **Discursos de líderes** — audio original + resumen por IA (del Laboratorio, no de modelo genérico). Con timestamp para citar minuto exacto.
4. **Congresos de delegados** — actas, resoluciones, posiciones, debates. La memoria organizativa del sindicato.
5. **Exposiciones y informes del sindicato** — informes de paritarias, informes de situación, posiciones sindicales.
6. **Volantes y comunicados** — volantes de campaña, comunicados sindicales, flyers, notas de paritaria, telegramas, circulars internas. La comunicación que el sindicato produce.
7. **Resoluciones de asamblea** — decisiones de asamblea, mandatos de base, posiciones votadas. La democracia sindical documentada.
8. **Jurisprudencia** — fallos relevantes, sentencias, precedentes que afectan al sector.

**NO va aquí — va en Comportamiento Empresarial (N11):**

- **Balances empresariales** — facturación, inversión, desinversión, reestructuración de empresas
- **Información de empresas** — registros públicos, datos del INDEC sobre empresas, información financiera
- **Todo lo referido a la empresa** — estrategia patronal, datos corporativos, información empresarial

La distinción es clara: Nuestro Derecho custodia lo que **el sindicato produce**; CE analiza lo que **la empresa hace**. La información empresarial es herramienta para entender el comportamiento — no es patrimonio del sindicato.

---

## Principio de soberanía documental

- Los documentos **nunca** se suben a plataformas corporativas para procesamiento.
- El corpus de entrenamiento pertenece al programa — no se usa para entrenar modelos de terceros.
- Los sindicatos deciden qué se digitaliza, qué se publica, qué se reserva.
- Los datos de uso no se monetizan — se usan para mejorar el sistema y para investigación, bajo control del comité.

Sin Núcleo 7, Hornero no tiene convenio vivo, no tiene leyes para buscar, no tiene discursos para escuchar, no tiene resoluciones de asamblea. **Nuestro Derecho es el suelo sobre el que se construyen los demás núcleos.**

---

## Formato de los documentos

- **Convenios:** texto completo, vigente, con escalas, categorías, artículos. Fine-tuned para entender que "paritaria" es una institución específica del derecho laboral argentino, no un "labor dispute" genérico.
- **Leyes:** artículo, vigencia, interpretación, jurisprudencia vinculada. La IA no asesora — facilita acceso.
- **Discursos:** audio original almacenado en MinIO, transcripción Whisper con timestamp, resumen IA.
- **Volantes y comunicados:** texto original + metadata (fecha, autor, campaña, sector, tipo).
- **Resoluciones de asamblea:** texto de la resolución, fecha, asamblea que la votó, mandato, vigencia.

---

## Conexión con otros núcleos

- **Núcleo 2 (Laboratorio):** el corpus de Nuestro Derecho alimenta el fine-tuning de los modelos. Las categorías de descripción archivística sindical son extensiones del campo, no ISAD(G) genérico.
- **Núcleo 6 (IS):** los informes grado 2-3-4 citan fuentes de Nuestro Derecho (convenio Art. X, Ley 20.744 Art. Y, resolución de asamblea Z).
- **Núcleo 8 (HO):** los documentos históricos se curan con HO — HO decide qué es relevante para formación.
- **Núcleo 9 (Morfología):** datos del INDEC y estadísticas laborales alimentan Morfología.
- **Núcleo 11 (CE):** la información de empresas (balances, registros, datos corporativos) va en CE — no aquí. Nuestro Derecho aporta convenios y leyes que CE usa para detectar incumplimientos; CE aporta datos empresariales que complementan el diagnóstico.
- **Núcleo 5 (App):** 5d (Nuestro Derecho) busca directamente en este núcleo. 5b (IS) cita fuentes de Nuestro Derecho.

---

## Repositorio y documentación

> Qué datos trabaja este núcleo. Todos los núcleos consumen la librería base (N2) — taxonomía, pipeline, stack, formatos de salida, categorías morfológicas, reglas de protección. Lo específico de cada núcleo va aquí.

- **Repositorio:** Convenios colectivos (CCT), leyes laborales (LCT 20.744), decretos, resoluciones, discursos sindicales, volantes y comunicados, resoluciones de asamblea, actas de congresos de delegados, jurisprudencia.
- **Corpus:** Texto completo de convenios vigentes, leyes con artículos etiquetados, transcripciones de discursos con timestamp, volantes con metadata, resoluciones de asamblea con mandato y vigencia.
- **Fuente primaria:** Documentos originales (PDFs, imágenes de actas, audio de discursos, volantes físicos). Los documentos nunca se suben a plataformas corporativas para procesamiento.
- **Corpus de fine-tuning (N2):** Convenios colectivos argentinos — texto completo con escalas, categorías, artículos — para fine-tuning del convenio vivo interactivo y el motor de búsqueda legal.
- **Nota:** Información empresarial (balances, registros, datos corporativos) → N11 (CE). Este núcleo solo custodia lo que el sindicato produce.

---

## Próximos pasos

- Digitalizar convenios aceiteros (CCT) para piloto — texto completo, vigente, con escalas.
- Cargar Ley 20.744 con artículos etiquetados.
- Recopilar volantes y comunicados del sindicato aceitero.
- Definir formato de descripción archivística sindical (categorías propias, no ISAD(G) genérico).
