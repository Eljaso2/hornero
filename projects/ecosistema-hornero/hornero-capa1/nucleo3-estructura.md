# Núcleo 3: Estructura

> El dónde. Infraestructura del ecosistema: servidor, hosting, encriptación, backup. Es el suelo técnico sobre el que se construyen todos los demás núcleos. Sin infraestructura soberana, no hay datos soberanos — y sin datos soberanos, no hay IA soberana.

---

## Principios

- Backend corre en infraestructura soberana, no en AWS/Google Cloud/Azure
- Los documentos nunca se suben a plataformas corporativas para procesamiento
- Datos sensibles encriptados en almacenamiento (AES-256) y transmisión (TLS)
- Acceso por grados: cada nivel ve solo lo que le corresponde
- Backup en infraestructura propia — no dependencia de cloud externo
- Escalabilidad: de un sindicato piloto a federaciones, sin re-arquitectura masiva

---

## Qué define

1. **Servidor y hosting** — dónde corre el backend. Infraestructura propia o comunitaria en Argentina. VPS soberano en fase inicial → servidor propio cuando escala.
2. **Soberanía de datos** — datos nunca se suben a plataformas corporativas. Corpus pertenece al programa; no se usa para entrenar modelos de terceros. Sindicatos deciden qué se digitaliza, qué se publica, qué se reserva.
3. **Encriptación** — datos sensibles (nombres, empresas, informes grado 1) encriptados en base y transmisión. Solo usuarios autorizados pueden acceder.
4. **Acceso por grados** — sistema de visibilidad (trabajador grado 1, delegado grado 2, secretario grado 3, directivo grado 4) — quién ve qué, qué información le corresponde.
5. **Backup y resiliencia** — datos del ecosistema se backupan en infraestructura propia. No hay dependencia de servicios externos para almacenamiento crítico.
6. **Escalabilidad** — la infraestructura debe poder crecer: de un sindicato piloto a 5, a federaciones, a la red completa. Sin re-arquitectura masiva.

---

## Principios de soberanía

| Principio | Qué significa | Qué NO significa |
|---|---|---|
| Datos en infraestructura soberana | Backend en VPS/servidor argentino, no AWS | Que no se use internet — se usa, pero datos se procesan localmente |
| Corpus pertenece al programa | No se usa para entrenar modelos de terceros | Que no se compartan outputs públicos — sí, si se decide políticamente |
| Sindicatos deciden qué se publica | Decisión política, no default técnico | Que todo sea secreto — lo público es decisión deliberada |
| Encriptación en transmisión y almacenamiento | HTTPS, datos sensibles encrypted | Que la app sea lenta — la encriptación es transparente |
| Acceso por grados | Cada grado ve solo lo que le corresponde | Que la información no fluya — fluye, pero con reglas |
| Backup en infraestructura propia | No dependencia de cloud externo | Que no haya redundancia — sí, en servers propios |

---

## Infraestructura: ambas opciones como camino

- **Fase inicial:** alquiler de VPS soberano (en Argentina o proveedor comunitario, no AWS) — pragmático, suficiente para datos que no son masivos. Soberanía funcional: controlamos todo el stack (OS, DB, modelo, acceso).
- **Fase de escala:** servidor propio o universitario cuando la escala lo requiera.
- **Soberanía funcional:** un VPS donde controlamos todo el stack es soberano funcionalmente. La soberanía no depende del rack físico, depende de quién controla el acceso, los datos, y los modelos.

## Repositorio y documentación

> N3 (Estructura) **define infraestructura** — su repositorio es el stack técnico y las configs de servidor. No consume datos de otros núcleos sino que **aloja** los datos de todos los núcleos. Produce infraestructura: VPS soberano, Postgres+MinIO, Qdrant, Neo4j, encriptación, backup, acceso por grados. El stack técnico es componente de la librería base (N2).

---

## Stack de infraestructura

| Componente | Tecnología | Ubicación | Soberanía |
|---|---|---|---|
| Backend | VPS soberano → servidor propio | Argentina | ✓ Funcional |
| Base de datos | Postgres + MinIO | Servidor propio | ✓ |
| Búsqueda vectorial | Qdrant | Servidor propio | ✓ |
| Grafo de conocimiento | Neo4j | Servidor propio | ✓ |
| Generación IA | DeepSeek API (→ modelo propio) | Externa → propio | En camino |
| Transcripción audio | Whisper local | En el teléfono | ✓ Local |
| Encriptación | TLS + AES-256 | Transit + storage | ✓ |
| Backup | Servidor propio + redundancia | Argentina | ✓ |

---

## Estado actual

- **Generación IA:** usa DeepSeek API externa. Fragmentos se recuperan localmente. **Soberanía de datos ✓, soberanía de modelo en camino.**
- **Servidor:** pendiente de definir — VPS soberano como fase inicial, servidor propio/universitario como fase de escala
- **Base de datos:** Postgres + MinIO para archivo, Qdrant para búsqueda, Neo4j para grafo
- **Encriptación:** TLS para transmisión, AES-256 para datos sensibles en storage

---

## Próximos pasos

- Alquilar VPS soberano como fase inicial
- Implementar encriptación para datos sensibles en la base
- Implementar sistema de acceso por grados
- Migrar generación IA de DeepSeek API a modelo propio cuando Laboratorio produzca fine-tuned
- Definir política de backup y resiliencia

---

## Articulación con otros núcleos

- **Núcleo 1 (Filosofía):** soberanía como posición política — Estructura implementa esa posición
- **Núcleo 2 (Metodología):** define qué procesa, qué modelo, qué acceso — Estructura implementa
- **Núcleo 4 (Protección):** encriptación, anonimización, acceso por grados — se implementa aquí
- **Núcleos 6-13 (Backend):** toda la planta de producción corre sobre esta infraestructura
- **Núcleo 5 (App):** local-first — datos en el teléfono, sync con backend soberano
