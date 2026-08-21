# Hornero App — Documento de Diseño Conceptual

> Versión 1.0 — 22 julio 2026
> Estado: Diseño conceptual completado. Pendiente: arquitectura técnica y fases de desarrollo.

---

## 1. Propósito

App móvil asistente IA para trabajadores sindicalizados en Argentina, con **soberanía digital y autonomía** como filosofía central. Nombre: **Hornero**.

La app no es un producto de Silicon Valley adaptado al mundo sindical. Es un producto **del campo trabajador, diseñado con trabajadores**, que crea su propia IA con sus propios materiales en su propia infraestructura.

---

## 2. Filosofía fundadora

### 2.1 Tesis Xiong/Tricontinental

La distinción fundadora: **consumir IA corporativa vs. crear IA propia**. No es una distinción técnica sino política y epistemológica — determina quién controla categorías, datos, lógica y todo el ciclo de un sistema de IA.

La organización no consume productos de Silicon Valley; **crea** su propia herramienta. El hornero (pájaro argentino) construye su nido con sus propios materiales en su propio territorio — no usa nidos de otros. La metáfora codifica toda la filosofía.

### 2.2 Distinciones críticas (no es X → es Y)

| Lo que NO es | Lo que ES |
|-------------|----------|
| Chatbot legal genérico | Herramienta posicionada desde el trabajador |
| App de un sindicato específico | Plataforma que cada sindicato adapta |
| Scraper de PDFs | Convenio vivo, interactivo, contextualizado |
| App de "noticias laborales" | Inteligencia laboral con categorías de campo |
| Startup que extrae datos | Sistema soberano |
| Chatbot "neutral" que presenta "ambos lados" | Argumenta desde la posición del trabajador |
| Producto de Silicon Valley adaptado | Producto del campo trabajador diseñado con trabajadores |
| Sistema que improvisa respuestas sin respaldo | Cada respuesta tiene fuente, artículo, vigencia, documento original |
| Generación de comunicación sin supervisión | IA propone, trabajador decide, edita, aprueba |
| "Consejo legal" | Acceso a la ley desde la posición del trabajador |
| Índice de "satisfacción del empleado" | IFT soberano con categorías de campo |

### 2.3 Producto vs. flujo

El **flujo interno** siempre está protegido. La apertura es solo del **producto final**, y solo como **decisión política deliberada** — no como default técnico.

### 2.4 Datos privados vs. producto público

**Datos privados** nunca salen del ecosistema: observaciones grade 1, testimonios privados, datos de uso individual, deliberación sindical — protegidos en todo el flujo.

**Producto público** es decisión política deliberada: qué se comunica, cuándo, con qué nivel de detalle — informes situacionales grade 4, IFT por sector, ICE por empresa, narrativas colectivas autorizadas.

---

## 3. Metodología: Codiseño

No es un equipo dev construyendo para usuarios. Es un espacio de **codiseño** iterativo y democrático:

1. Sindicatos definen necesidades y lógicas
2. Investigadores traducen en especificaciones técnicas
3. Devs implementan sobre modelos open-source con infraestructura soberana
4. Sindicatos testean y corrigen en su trabajo real
5. Ciclo se repite — cada iteración mejora el sistema, que permanece bajo control del programa

---

## 4. El Laboratorio (cocina central)

No es un proyecto entre otros — es el **núcleo central**. Sus 6 funciones:

1. **Etiquetado y categorización** — define y mantiene la taxonomía soberana (~9 familias, ~70 etiquetas automáticas, categorías del campo trabajador argentino)
2. **Procesamiento de narrativas** — recibe fuentes primarias (grade 1), etiqueta, ordena, extrae datos duros, produce informes grade 1
3. **Generación de informes grade 2-3-4** — IA pre-elabora informes consolidados para delegados, secretarios, federaciones; check humano, modificación, firma
4. **Arquitectura IA** — define tipo de modelo, corpus, fine-tuning, infraestructura
5. **Fine-tuning** — produce modelos especializados en corpus laboral latinoamericano
6. **Soberanía** — decide qué datos se procesan, dónde, con qué modelo, con qué acceso. Cada punto de la cadena de valor de IA es decisión del Laboratorio.

**Nota:** Las familias específicas de la taxonomía soberana están pendientes de definición.

---

## 5. Soberanía funcional

Soberanía no depende de rack físico — depende de **quién controla acceso, datos y modelos**. Un VPS donde se controla todo el stack (OS, DB, modelo, acceso) es funcionalmente soberano.

### Qué significa vs. qué NO significa

| Principio | Qué significa | Qué NO significa |
|-----------|--------------|-----------------|
| Infraestructura soberana | Backend en VPS argentino, no AWS | Sin internet |
| Corpus pertenece al programa | No se entrenan modelos de terceros | No compartir productos públicos (decisión política) |
| Sindicatos deciden publicación | Decisión política, no default técnico | Todo es secreto |
| Encriptación | HTTPS + datos sensibles cifrados | La app es lenta |
| Acceso por grades | Cada grade ve solo lo que corresponde | La información no fluye (fluye con reglas) |
| Backup en infraestructura propia | No dependencia de cloud externo | Sin redundancia |

---

## 6. Las 6 esferas

1. **Actualidad y agenda** — noticias, eventos, convocatorias
2. **Consulta y asesoramiento** — chat IA con sesgo sindical propio
3. **Formación política y sindical** — educación, cursos, materiales
4. **Gestión y comunicación interna** — coordinación, circulares
5. **Diagnóstico y panorama** — análisis de situación, contexto
6. **Archivo** — repositorio documental, historia

---

## 7. UX

Interfaz **minimal atractiva** que invita al trabajador a entrar y navegar contenido (noticias, análisis). **Chat central** como motor de consulta — la IA responde según la biblioteca del sindicato. Secciones para explorar las esferas.

---

## 8. Flujo de contenido

**Bidireccional con filtro de curación.** El sindicato produce lo central, los trabajadores retroalimentan (experiencias, preguntas, problemas), y un **filtro de curación política** decide qué vuelve a la biblioteca. Ese filtro es parte del sesgo deliberado — no es solo "moderación", es curación política.

---

## 9. Sesgo deliberado (implícito)

La IA tiene una perspectiva deliberada. No es un defecto — es una **herramienta política**.

- **2 capas**: RAG (biblioteca/documentos seleccionados) + prompts dirigidos (instrucciones explícitas sobre cómo la IA se posiciona)
- **Implícito**: se vive, se experimenta, se incorpora, pero no se declara formalmente. El trabajador percibe una forma de ver el mundo sin que se le diga "esta es nuestra línea". Es formación sin explicitar que es formación — **formación vivida**.
- **Gestión**: equipo designado con mandato de conducción sindical

---

## 10. Sistema de niveles de usuario (grades)

| Grade | Rol | Acceso | Función |
|-------|-----|---------|---------|
| **A** | Usuario libre | Básico, superficial | Exploración limitada. Puede no ser trabajador ni sindicalizado. |
| **B.a** (grade 1) | Afiliado base | Información mayor que A | Carga de datos |
| **B.b** (grade 2) | Delegado | Mayor que B.a | Más funciones |
| **B.c** (grade 3) | Conducción (Sec. Gral.) | Mayor que B.b, no máximo | Gestión del sindicato |
| **B.d** (grade 4) | Federación/Unión sindical | **Máximo acceso** + tendencias agregadas | Vista macro |

Jerarquía de acceso: A → B.a → B.b → B.c → B.d (B.d = máximo)

### Verificación
Registro libre + habilitación sindical para ascender a grades B.

### Privacidad
- Consultas chat: **privadas, invisibles para todos**
- Tendencias agregadas: visibles solo para administradores + B.d (grade 4)
- Administradores conocen todos los usuarios (A y B)

---

## 11. Arquitectura del conocimiento (RAG)

- **Base compartida**: conocimiento sindical general (legislación, derechos, contexto nacional)
- **Capa local**: biblioteca específica del sindicato (convenios, estatutos, formación, clipping propio)
- Escalable: cada sindicato tiene su biblioteca sobre la base común
- El RAG determina parte del sesgo — lo que está en la base de conocimiento es lo que la IA usa para responder. El sindicato decide qué documentos entran.

---

## 12. Seguridad (4 principios)

1. **Separación por niveles**: contenido segregado en backend, nunca se envía al cliente lo que no corresponde al grade del usuario
2. **Acceso progresivo + revocación**: cada grade ve solo lo necesario; sindicato puede de-habilitar instantáneamente cualquier usuario
3. **Curación como filtro**: chat privado (no trollable), secciones de comunicación con curación sindical, mecanismos de reporte
4. **Conocimiento server-side**: RAG y prompts viven en el backend; rate limiting para impedir scraping; watermarking de respuestas; no hay modo "exportar" la biblioteca

---

## 13. Infraestructura

Servidor privado confiable, empresa chica. Datos en jurisdicción argentina. Soberanía funcional: control de acceso, datos y modelos, no rack físico.

---

## 14. Sostenibilidad económica

Sindicato/Federación pagan; usuarios (A y B) gratis. Modelo B2B2C: organizaciones sindicales son las **clientes**, trabajadores son los **usuarios**. El pricing es por sindicato/federación, no por usuario individual.

---

## 15. Piloto

Sindicato de un sector específico, confirmado, con datos mixtos completos (documentos sindicales + contenido periodístico + materiales de formación).

---

## 16. Pendientes de definición

- Familias específicas de la taxonomía soberana (~9 familias, ~70 etiquetas)
- Arquitectura técnica (stack, fases de desarrollo)
- Decisión sobre absorción de `projects/ecosistema-hornero/` y `projects/hornero-app/` en `projects/hornero/` — **decidir cuando sea conveniente, preguntar antes de proceder**

---

## 17. Referencias

- Capa 1 del ecosistema Hornero: `projects/ecosistema-hornero/hornero-capa1/`
  - `nucleo1-filosofia.md` — Filosofía fundadora
  - `nucleo2-metodologia.md` — Metodología (codiseño, Laboratorio)
  - `nucleo3-estructura.md` — Estructura (infraestructura soberana)
  - `nucleo4-proteccion.md` — Protección (privacidad, datos privados vs. producto público)
