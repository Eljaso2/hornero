# Núcleo 2: Metodología / Laboratorio

> El cómo. La metodología de trabajo: codiseño, producción, evaluación. Cómo se construye la IA del ecosistema, con qué ciclo, y qué productos genera. El Laboratorio es la cocina central — donde se define, coordina y produce todo, según los principios de Filosofía (Núcleo 1).

---

## El ciclo de codiseño

No es un "dev team" que construye tools para usuarios. Es un espacio de **codiseño** donde sindicatos, universidades y Tricontinental diseñan juntos las herramientas:

- Los **sindicatos** definen necesidades y lógicas ("necesitamos algo que clasifique comunicados por tipo y urgencia", "que transcriba actas manuscritas", "que detecte si un conflicto se extiende a otros sectores").
- Los **investigadores** traducen esas necesidades a especificaciones técnicas (tipo de modelo, corpus, evaluación, interfaz).
- Los **desarrolladores** implementan sobre modelos open-source con infraestructura soberana (Núcleo 3).
- Los **sindicatos** testean y corrigen en su trabajo real.
- El ciclo se repite: cada iteración mejora el sistema, que queda bajo control del programa.

---

## Función del Laboratorio

El Laboratorio no es un proyecto entre otros — es **el núcleo central** donde se cocina todo. Su función es:

1. **Etiquetado y categorización** — define y mantiene las 9 familias de etiquetas (~70 etiquetas automáticas) que organizan toda la información del ecosistema. Las etiquetas no son de un modelo genérico — son del campo obrero argentino, definidas por el movimiento.
2. **Procesamiento de narrativas** — recibe fuentes primarias (trabajadores grado 1), las etiqueta, ordena, extrae datos duros, produce informes grado 1.
3. **Generación de informes grado 2-3-4** — la IA pre-elabora informes consolidados para delegados, secretarios y federaciones. Los responsables humanos chequean, modifican, firman.
4. **Arquitectura IA** — define qué tipo de modelo se necesita para cada función, qué corpus lo alimenta, qué fine-tuning se hace, en qué infraestructura corre.
5. **Fine-tuning** — produce modelos fine-tuned sobre corpus laboral argentino (convenios, comunicados sindicales, actas, paritarias). El Laboratorio cocina los modelos que Hornero usa.
6. **Soberanía** — decide qué datos se procesan, dónde, con qué modelo, con qué acceso. Cada punto de la cadena de valor de la IA es una decisión del Laboratorio.

---

## Librería base Hornero

> La librería base es el ingrediente compartido que el Laboratorio cocina para todos los núcleos. No duplica contenido — **referencia** los archivos donde cada componente está detallado. Cada núcleo del ecosistema consume estos componentes y trabaja con su repositorio específico (ver sección "Repositorio y documentación" en cada núcleo).

### Componentes compartidos

| Componente | Qué es | Lo define | Detalle |
|---|---|---|---|
| **Taxonomía soberana (etiquetas)** | 9 familias (~70 etiquetas) que organizan toda la información del ecosistema. Categorías del campo obrero, no genéricas. | N9 (Morfología) define las categorías; N2 (Laboratorio) las produce y mantiene | → `nucleo6-is/nucleo6-is.md` sección 5 (Etiquetas automáticas) |
| **Pipeline de procesamiento** | Camino que cada consulta recorre: clasificar intención → filtrar por rama/vigencia → buscar en archivo real (híbrida semántica+exacta) → conectar con mapa de conocimiento → verificar respaldo documental → responder con la fuente | N2 (Laboratorio) | → `nucleos6-13-backend.md` sección Pipeline |
| **Stack técnico** | Infraestructura compartida: DeepSeek (→ modelo propio), Qdrant+BGE, Neo4j, MinIO+Postgres, Whisper, LangGraph+Dify | N2 + N3 (Estructura) | → Sección Stack técnico en este archivo + `nucleo3-estructura.md` |
| **Formatos de salida comunes** | Principios que todos los núcleos aplican: sistema de grados 1-4, trazabilidad (fuente primaria vinculada), siempre con la fuente (norma, artículo, vigencia, documento original), dato privado vs. producto público | N6 (IS) define grados; N4 (Protección) define privacidad; N2 produce | → `nucleo6-is/nucleo6-is.md` + `nucleo4-proteccion.md` |
| **Categorías morfológicas** | La epistemología del sistema: fracciones de clase, formas de lucha, formas de producción, condiciones de vida, articulación sectorial | N9 (Morfología) | → `nucleo9-morfologia/nucleo9-morfologia.md` |
| **Reglas de protección** | Consentimiento explícito, anonimización por defecto, encriptación TLS+AES-256, acceso por grados, dato privado vs. producto público, uso ético | N4 (Protección) | → `nucleo4-proteccion.md` |

### Repositorio del Laboratorio

El Laboratorio **define** la librería base y **produce** sobre ella:

- **Corpus de fine-tuning:** convenios colectivos, comunicados sindicales, actas, paritarias — texto completo, etiquetado con categorías del ecosistema
- **Datasets etiquetados:** producidos por archiveros e historiadores del programa, organizados con taxonomía soberana
- **Guías de codiseño:** metodología documentada — el know-how del proceso, no solo el producto
- **Kit de arranque:** infraestructura mínima, datos a curar, modelos open-source, procesos de fine-tuning

---

## Productos del Laboratorio

- **Modelos fine-tuned laborales:** especializados en corpus laboral latinoamericano, disponibles para cualquier organización del programa.
- **Datasets laborales etiquetados:** por archiveros e historiadores del programa. Abiertos para organizaciones del programa, no para corporaciones.
- **Guías de codiseño:** documentación metodológica sobre cómo organizar un proceso de codiseño — el know-how del proceso, no solo el producto.
- **Kit de arranque:** starter kit para sindicatos que quieren empezar (infraestructura mínima, datos a curar, modelos open-source, procesos de fine-tuning).

---

## Stack técnico

| Rol | Tecnología | Función |
|---|---|---|
| Generación | DeepSeek (→ modelo propio) | Compone respuestas a partir de fragmentos recuperados |
| Búsqueda | Qdrant + BGE | Vectorial e híbrida, self-hosted |
| Conocimiento | Neo4j | Grafo que conecta sindicatos, convenios, leyes |
| Archivo | MinIO + Postgres | Originales y versionado, soberano |
| Audio | Whisper | Transcripción local |
| Orquestación | LangGraph + Dify | Agentes y banco de pruebas |

> **Nota:** actualmente DeepSeek se usa como API externa. Los fragmentos se recuperan localmente. El Laboratorio define el camino para internalizar la generación cuando los modelos fine-tuned estén producidos. **Soberanía de datos ✓, soberanía de modelo en camino.**

---

## Articulación con otros núcleos

- **Núcleo 1 (Filosofía):** principios y posición política que guían todo
- **Núcleo 3 (Estructura):** infraestructura donde se ejecutan modelos y se almacenan datos
- **Núcleo 4 (Protección):** reglas de protección que el Laboratorio aplica a datasets y modelos
- **Núcleos 6-13 (Backend):** todos usan modelos y datasets producidos aquí
