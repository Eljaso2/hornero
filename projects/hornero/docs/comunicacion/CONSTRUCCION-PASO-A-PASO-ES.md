# Construir una IA sindical soberana: crónica metodológica del motor de conocimiento de Hornero

*Un estudio de caso técnico, escrito para que lo lean tanto quienes programan como quienes van a usar la herramienta.*

---

## Resumen

Este documento reconstruye, paso a paso, cómo se construyó el motor de conocimiento que está en el
centro de **Hornero** — un asistente de inteligencia artificial de propiedad y operación sindical. El
motor es una **Biblioteca legal acoplada a un sistema de generación aumentada por recuperación (RAG)**:
permite que "el Abogado" del gremio responda la consulta de un trabajador con la ley y el convenio
colectivo *reales*, citando el artículo concreto, para un gremio o para muchos a la vez. En lugar de
presentar una arquitectura terminada, narramos el *razonamiento* detrás de cada decisión, incluidos los
callejones sin salida. Tres compromisos ordenan el relato: que el sindicato **construya** su IA en vez de
consumir una construida por otros; que toda afirmación legal esté **fundada** en una fuente verificable o
se admita honestamente su ausencia; y que muchos gremios se sirvan desde un mismo sistema sin que ninguno
vea los datos de otro. El hallazgo empírico central es que *la recuperación nunca fue lo difícil — lo
difícil fue la atención*: un modelo de lenguaje capaz, con el artículo legal correcto delante, seguía
citando el equivocado de memoria hasta que se rediseñó el prompt que lo rodeaba. Reportamos ese hallazgo,
su solución y el pipeline reproducible que resultó (737 artículos legales en siete normas y tres gremios,
sobre un almacén Postgres durable).

> **Documentos hermanos.** Versión en inglés: `BUILD-STEP-BY-STEP-EN.md`. Panorama de producto:
> `DOCUMENTACION-COMPLETA.md`. Explicador visual interactivo: `how-hornero-works-EN.html`.
> **Alcance.** `backend/library_service/` y su integración en `backend/main.py`, agosto de 2026.

---

## 1. Motivación: por qué un sindicato construye su propia IA

La mayoría de las organizaciones *consumen* inteligencia artificial ensamblada por otros; el modelo, los
datos que lo entrenaron y las reglas que lo gobiernan pertenecen a un proveedor lejano. Hornero parte de la
premisa opuesta —que un sindicato puede **construir** y **gobernar** su propio asistente— y trata esa
premisa como una restricción de diseño, no como una consigna. Conviene pensar cualquier sistema de IA como
una cadena de seis eslabones: los *datos*, la *arquitectura* del modelo, el *fine-tuning*, la
*infraestructura*, la *interfaz* y la *gobernanza*. Depender significa que otro tiene los seis; la soberanía
significa que la organización tiene los decisivos y sabe con precisión dónde todavía depende. Cada decisión
que sigue se juzga contra esa cadena.

Este encuadre tiene una consecuencia metodológica concreta. No partimos de una herramienta de moda para
buscarle un uso; partimos del problema del gremio y preguntamos qué eslabón lo restringía más.

### 1.1. Principios que gobernaron el trabajo

Cinco principios se repiten a lo largo del relato, y vale enunciarlos antes para que el lector los vea operar:

1. **Problema primero, no herramienta primero.** Auditar el sistema existente antes de escribir una línea.
2. **Reversibilidad.** Cada cambio va detrás de un *feature flag* y es aditivo; apagado, el sistema es
   byte a byte lo que era. Nunca se rompe lo que ya funciona para agregar lo que quizás funcione.
3. **Fundamento por sobre fluidez.** Una respuesta legal sin la cita del artículo es peor que ninguna,
   porque es un error dicho con seguridad. El sistema debe citar su fuente o admitir que no la tiene.
4. **Aislamiento entre gremios.** Ningún gremio puede ver jamás el convenio ni los reportes de otro.
5. **Iteración honesta.** Cuando algo falla —y el paso más importante de abajo es un fracaso— se documenta
   el hallazgo y se ataca la causa, en lugar de tapar el síntoma.

Cada paso que sigue se ejecutó como un ciclo breve: enunciar el problema, diseñar la respuesta mínima,
implementarla (usando solo la librería estándar cuando fue viable, para minimizar dependencias), probarla de
punta a punta contra una consulta *real* y registrar el resultado, fracasos incluidos.

---

## 2. Diagnóstico: leer el sistema existente antes de cambiarlo

El primer paso no escribió código. Leímos el pipeline de Hornero de punta a punta —el manejo del request en
`backend/main.py` y la recuperación en `backend/rag_retriever.py`— justamente porque no se puede mejorar lo
que no se ha entendido. Cuatro hallazgos moldearon todo lo demás.

El sistema no tenía **autenticación**: la identidad y el grado jerárquico del usuario llegaban dentro del
request y se confiaban tal cual. Su almacenamiento era **efímero** —un archivo SQLite que Render, la
plataforma de hosting, descarta en cada redeploy—. No tenía **noción de gremio**: todo el conocimiento era
un pozo global único, imposible de separar por sindicato. Y su recuperación era **por palabra clave**: un
puntaje de frecuencia de términos sobre una lista global de fragmentos, sin ley real detrás y sin artículo
que citar.

La conclusión fue clarificadora. El cuello de botella no era la interfaz, ya pulida y cuidada, sino el
**motor de conocimiento**. Ahí fue el trabajo: una biblioteca legal real, multi-sindicato, capaz de citar el
artículo exacto.

---

## 3. Diseñar la Biblioteca como núcleo

Un abogado no improvisa; cita el artículo. El sistema de recuperación tenía que hacer lo mismo, y ese único
requisito guió el diseño. Hicimos del **artículo** —no de un párrafo arbitrario— la unidad de recuperación,
para poder localizar y citar con precisión "el Artículo 245 de la Ley de Contrato de Trabajo". A cada
artículo le adjuntamos dos etiquetas que hacen posible el servicio multi-sindicato: un `tenant` (a qué gremio
pertenece) y una `capa` (o bien `general`, compartida por todos, o bien `sectorial`, propia de un gremio). De
ahí se sigue una única regla de visibilidad que reaparece en todo el sistema: **un gremio ve su colección
junto con la capa compartida**, y nada más.

El contrato de recuperación del que depende el resto del sistema es deliberadamente angosto —
`search(query, k, filtros)`— y resuelve en un orden fijo de preferencia: primero la **cita exacta** de
artículo, luego una coincidencia **semántica** si hay vectores, y una coincidencia **léxica** en su defecto.
El esquema de datos es, en consecuencia, simple:

```
id · tenant · capa · tipo · norma · articulo · vigencia · titulo · texto · fuente · updated_at · vec
```

---

## 4. El chunker: partir una norma en artículos

**Archivo:** `library_service/chunker.py`

Convertir una página de texto legal en piezas limpias del tamaño de un artículo es menos trivial de lo que
parece, porque las normas argentinas no son tipográficamente consistentes. Un mismo corpus mezcla dos
notaciones —`Art. 245.` y `ARTÍCULO 245°`— y ni una sola expresión regular ni un corte ingenuo sobreviven a
ambas. Por eso el chunker lleva dos patrones y, para cada norma, elige el **dominante** (el que más matchea),
maneja los sufijos ordinales `bis`, `ter` y `quáter`, y toma como cuerpo del artículo el texto que va entre un
encabezado y el siguiente.

Dos problemas de robustez aparecieron más tarde (se corrigieron en el §14, pero pertenecen aquí
conceptualmente). Las fuentes legales no coinciden en la **codificación** de caracteres: el sitio estatal
InfoLeg entrega Windows-1252, mientras que los sitios sindicales modernos entregan UTF-8. Forzar una
decodificación corrompe la otra en *mojibake* (el revelador `â€"` donde debería ir un guión), así que el
`fetch()` ahora respeta el charset declarado, luego intenta UTF-8 estricto y solo entonces cae a Windows-1252.
Aparte, algunas páginas incrustan metadatos `JSON-LD` dentro de etiquetas `<script>`; eliminar scripts y
estilos *antes* de extraer el texto evita que esa estructura se filtre al cuerpo de un artículo.

---

## 5. El scraper: traer la ley real

**Archivo:** `library_service/scraper.py`

La biblioteca debe contener el texto **oficial** de la norma, no un resumen, porque el valor de todo el
sistema es que el trabajador pueda verificar la cita. El scraper es un registro pequeño y parametrizado: cada
norma es una entrada con su URL, tipo, capa y tenant, y agregar una ley es, literalmente, agregar una línea.
La capa **general** —la ley que rige a todo trabajador sin importar el gremio— se pobló desde páginas
verificadas de InfoLeg: la Ley de Contrato de Trabajo (LCT 20.744) y las normas sobre jornada (11.544),
asociaciones sindicales (23.551), empleo (24.013) y riesgos del trabajo (24.557). Cada norma recorre el mismo
pipeline: bajar la página, reducirla a texto y partirla en artículos con la capa y el tenant correctos.

---

## 6. El almacén, y luego su durabilidad

**Archivo:** `library_service/library.py`

El almacén expone una superficie deliberadamente pequeña: `upsert` para agregar o actualizar artículos de
forma idempotente, `fetch` para recuperarlos aplicando la regla de visibilidad gremio-más-compartida, `stats`
para totales y `search` para el contrato de recuperación del §3. Empezó siendo SQLite, que no requiere
infraestructura y es ideal para construir y probar en local.

La durabilidad, sin embargo, fue uno de los cuatro diagnósticos iniciales, y el §15 vuelve a cerrarla. El mismo
archivo se volvió después **de doble backend**: usa SQLite por defecto y **Postgres** cuando se configura una
URL de base de datos, con un pequeño ayudante que traduce la sintaxis de los marcadores de posición entre ambos
dialectos y un esquema que adapta sus tipos de columna. Los dos backends comparten un contrato, así que nada por
encima de ellos tuvo que cambiar — una instancia del principio de reversibilidad aplicada a la infraestructura
misma.

---

## 7. Recuperar sin embeddings: cita exacta, puntaje léxico y expansión con LLM

**Archivos:** `library_service/library.py`, `library_service/expander.py`

Idealmente una búsqueda legal sería *semántica* —cotejar significado en vez de palabras— pero eso exige vectores
(*embeddings*), y (como cuenta el §16) no había un servicio de vectorización disponible. La recuperación tenía
que ser buena igual, así que combina tres señales complementarias. Primero, un atajo de **cita exacta**: si la
pregunta ya nombra "art. 245", ese artículo se devuelve con máxima prioridad. Segundo, un puntaje **léxico**
clásico (frecuencia de términos ponderada por su rareza, o TF-IDF), que premia la coincidencia entre las
palabras de la pregunta y el texto del artículo, dando más peso al título.

La tercera señal ataca la debilidad clásica de la búsqueda léxica —la **sinonimia**—. Un trabajador pregunta por
"hora extra", pero la norma habla de "horas suplementarias"; las palabras difieren aunque el significado sea
idéntico. En vez de recurrir a embeddings, usamos el propio modelo de lenguaje para **expandir** la consulta a
sus sinónimos jurídicos *antes* de buscar. Es un sustituto barato y sin infraestructura de la recuperación
semántica, y resultó suficiente: en este modo el sistema ya devuelve los artículos correctos. El camino
semántico queda cableado pero dormido, a la espera de que se poblen los embeddings.

---

## 8. El modelo: un modelo de lenguaje soberano (no estadounidense)

**Archivo:** `library_service/expander.py` (y el camino de la respuesta)

La coherencia con la tesis de soberanía implicaba no enrutar las preguntas del gremio por el stack de IA de
Estados Unidos. Usamos **GLM-5.2**, un modelo chino servido a través de la nube de Alibaba con una API compatible
con el formato de mensajes de Anthropic, lo que nos permitió tratarlo como un reemplazo directo.

Una propiedad del modelo moldeó el código. GLM-5.2 es un **modelo de razonamiento**: emite un bloque interno de
`thinking` antes de su respuesta visible y, si el presupuesto de tokens es muy chico, lo agota razonando y nunca
llega a producir la respuesta. Al reconocerlo —las primeras respuestas volvían vacías— subimos el presupuesto y
extrajimos solo los bloques finales. El episodio recuerda que "el modelo no devolvió nada" suele ser una
afirmación sobre la configuración, no sobre la capacidad.

---

## 9. Prueba de concepto: el Abogado standalone

**Archivo:** `library_service/ask.py`

Antes de tocar el sistema en producción, validamos la idea entera en aislamiento. `ask.py` ejecuta todo el ciclo
en miniatura: toma una pregunta, recupera los artículos relevantes de la biblioteca, arma un prompt **enfocado**
—*sos el Abogado del gremio; respondé solo con estos artículos; citá el número*— y consulta al modelo. Para "¿me
pueden obligar a hacer horas extra?" respondió citando el Artículo 197 bis y el Artículo 201 de la Ley de Contrato
de Trabajo (la voluntariedad de las horas extra y sus recargos), sin inventar nada. Ese pequeño éxito estableció el
patrón que seguiría el resto del sistema: **recuperar, enfocar, responder con una cita.** También contenía, sin
saberlo, la respuesta a un problema que aún no habíamos golpeado — un punto al que volvemos en el §12.

Una sola consulta ilustra los datos a medida que recorren el pipeline terminado:

```
consulta:  "¿cuánto me pagan la hora extra?"   ·   sector: aceitero
   → resolve_tenant           → tenant = "aceiteros"
   → search(...)              → [CCT 420/05 Art.27, Art.29, LCT 201, ...]   (gremio ∪ compartida)
   → prompt enfocado + artículos
   → GLM-5.2
   → "Art. 27 CCT 420/05: adicional del 100%, cualquier día de la semana..."   (citado, sin alucinar)
```

---

## 10. Integración en el sistema en marcha, detrás de un flag

**Archivos:** `library_service/adapter_hornero.py`, `backend/knowledge_base.py`, `backend/main.py`

Integrar la biblioteca en el asistente vivo encontró un obstáculo arquitectónico que vale la pena mirar. Hornero
inyecta conocimiento en sus prompts **por identificador**, buscando el texto de cada fragmento en una tabla global;
los artículos de la biblioteca no viven en esa tabla. El enganche correcto, entonces, no era *reemplazar* la
recuperación existente sino *aportar* el texto legal ya formateado como un bloque adicional en el prompt del
Abogado — un cambio más chico y aditivo que deja intacto el camino original.

El resultado respeta la reversibilidad por completo. Una función puente devuelve un bloque legal formateado o una
cadena vacía; el armador del prompt lo agrega solo si está presente; los endpoints llaman al puente solo para la
persona del Abogado, de modo que ninguna otra voz se contamina. Con el flag apagado, el bloque es vacío y el prompt
es byte a byte lo que era. Si la biblioteca fuera inalcanzable, el puente devuelve vacío y la conversación sigue con
la base de conocimiento original. Nada de lo que funcionaba puede romperse por este agregado.

---

## 11. Hacer que el gremio viaje en el request

**Archivos:** `backend/main.py`, `library_service/adapter_hornero.py`

Servir muchos gremios desde un solo despliegue exige que el sistema sepa *qué* gremio pregunta. Agregamos un
`tenant` explícito al request y lo derivamos, cuando falta, del campo `sector` que el cliente ya enviaba,
centralizando el mapeo en una sola función para que cada punto de entrada resuelva el gremio igual. Cada request ve
entonces solo la colección de su gremio junto con la ley compartida.

Aquí corresponde una nota de seguridad franca. Como Hornero todavía no tiene autenticación, la identidad del gremio
hoy se *confía del cliente*. Eso es aceptable para un demostrador pero no para producción, donde el tenant debe
**atarse a una sesión autenticada** — de lo contrario un gremio podría pedir el convenio de otro. La limitación
está escrita en el código como comentario, no dejada implícita, y cerrarla es la primera tarea de la próxima fase.

---

## 12. El hallazgo central: la recuperación estaba resuelta; la atención no

Este es el paso más importante, y empezó como un fracaso. Ante una consulta sobre horas extra en la industria
aceitera, el asistente insistía en citar la ley *general* (Artículo 201) de memoria e ignoraba el convenio
*sectorial* (Artículo 27 del CCT 420/05) — aun cuando ese artículo había sido correctamente recuperado y colocado en
su contexto. Descartamos los sospechosos obvios uno por uno: la biblioteca había recuperado el artículo correcto; la
lógica del tenant era correcta; la expansión de consulta había traído el artículo. Ninguno era el culpable.

La causa era la **dilución del prompt**. La persona completa del Abogado llegaba a unos catorce mil caracteres de
narrativa rica; contra esa extensión, el bloque legal agregado al final quedaba subponderado, y el modelo caía en su
conocimiento previo de entrenamiento. Sorprendentemente, cuatro intentos sucesivos de *reforzar la instrucción* no lo
arreglaron — el modelo seguía obedeciendo a la voz que lo rodeaba antes que a la ley inyectada. Lo que zanjó el
diagnóstico fue el §9: el `ask.py` standalone, con el *mismo modelo*, citaba bien. La única diferencia era el tamaño
y el foco del prompt.

La solución se siguió de ahí. Para las consultas legales ahora armamos un **prompt corto y enfocado** —una identidad
breve del Abogado, una regla estricta de fundamento, la restricción de confidencialidad, el formato de salida
requerido, y la ley recuperada colocada *al final* para que la recencia juegue a su favor— en lugar de enterrar la
ley dentro del mega-persona. El cambio es, en sí mismo, reversible: con la biblioteca activa se usa el prompt
enfocado; sin ella, la persona completa queda intacta. El asistente empezó entonces a citar el Artículo 27 del
convenio, su recargo del cien por ciento, y hasta el artículo de transporte de larga distancia, sin alucinación. La
lección general sobrevive a este proyecto: **cuando un modelo capaz no obedece una instrucción, hay que sospechar del
contexto que la rodea, no solo de la instrucción.**

---

## 13. El convenio propio de cada gremio

La promesa multi-sindicato solo es real si cada gremio cita *su* convenio, así que ingestamos dos. El CCT 420/05 de
los aceiteros (cincuenta y cinco artículos) vino de una fuente HTML, ahorrándonos el reconocimiento óptico de
caracteres que habría exigido un PDF; con él, el Abogado razona correctamente que el artículo de horas extra del
convenio *prevalece sobre* la ley general cuando la mejora. El CCT 130/75 de los empleados de comercio (ciento siete
artículos) vino de una página UTF-8 y, al hacerlo, justificó el trabajo de codificación del §4. La garantía de
aislamiento se verificó luego desde ambos lados: comercio no puede ver el convenio aceitero, y los aceiteros no pueden
ver el de comercio. El servicio multi-sindicato no es aquí una afirmación sino una propiedad demostrada.

---

## 14. Calidad de datos: exorcizar artículos fantasma

Una corrupción sutil apareció en el corpus. Las páginas de InfoLeg de una ley suelen reproducir el texto de *otras*
leyes que esa norma modifica, y el chunker capturaba esos artículos citados como si pertenecieran a la ley anfitriona
— produciendo, por ejemplo, un espurio "Artículo 245 de la Ley 24.013" que llevaba el texto del Artículo 245 de la Ley
de Contrato de Trabajo, lo que hacía que el Abogado a veces etiquetara mal la fuente. El remedio aprovechó una
regularidad estructural: los artículos genuinos corren de forma contigua (1, 2, 3, …), mientras que un fantasma aparece
como un número alto aislado *después de un salto grande*. Detectar ese salto marcó seis fantasmas en tres leyes, cada
uno inspeccionado a mano antes de borrarlo — una limpieza pequeña y auditable que mejoró de forma medible la precisión
de las citas.

---

## 15. Durabilidad, entregada

Con el corpus limpio, cerramos la deuda de persistencia del §2 migrando a Postgres. Como el almacén había sido diseñado
de doble backend, la migración no cambió ningún código llamante; un script idempotente copió los 737 artículos a una
base durable, y el backend en vivo, ahora leyendo desde Postgres, siguió citando el convenio sectorial exactamente como
antes. La extensión `pgvector` está presente pero sin uso por ahora: la columna de vectores se guarda como bytes crudos
hasta que existan embeddings, ya que una columna vectorial nativa debe comprometerse con una dimensión que solo fijará
el proveedor de embeddings elegido. Migrar a ese tipo nativo es la optimización natural cuando entre en línea la
búsqueda semántica.

---

## 16. Por qué la búsqueda semántica espera, y el modo soberano de habilitarla

Vale ser explícito: el sistema hoy recupera en modo *léxico-más-expansión* y ya cita bien; la búsqueda semántica es una
mejora, no un prerrequisito. Espera porque los embeddings requieren un servicio de vectorización que funcione, y no había
ninguno: cada key de embeddings provista devolvió un error de autenticación o de no-encontrado, y hasta el token de chat
que *sí* funciona no tiene modelo de embeddings en su plan (su endpoint acepta la credencial pero solo ofrece modelos de
chat, imagen y audio).

El camino recomendado es, apropiadamente, el soberano. En vez de depender de una API de embeddings extranjera, Hornero
puede correr un pequeño modelo de embeddings multilingüe **local** —un modelo ONNX de unos cien megabytes, sin key y
offline—. Así incluso el eslabón de la vectorización queda bajo control del gremio, y la rutina `embed_index` del almacén
ya está lista para poblar los vectores, momento en el que la columna migra a `pgvector` nativo.

---

## 17. Discusión: qué enseña esta construcción

Tres lecciones generalizan más allá de Hornero. La primera es que **el fundamento es un problema de atención, no solo de
recuperación.** Buena parte de la literatura sobre RAG se concentra en traer el pasaje correcto; nuestra experiencia es
que traerlo es necesario pero no suficiente, porque un prompt de sistema largo y con carácter puede ahogar un pasaje
correcto colocado dentro de él. El corolario práctico —un prompt corto y enfocado para la tarea que más necesita
fidelidad— es barato y eficaz.

La segunda es que **la reversibilidad es lo que vuelve segura la iteración sobre un sistema en marcha.** Como cada cambio
estaba a un flag de distancia de deshacerse, pudimos integrar una biblioteca inconclusa en un asistente que funcionaba,
descubrir la falla de fundamento en el lugar y repararla, sin arriesgar nunca la interfaz de la que el gremio ya dependía.

La tercera es que **la soberanía y el pragmatismo de ingeniería convergieron más veces de las que chocaron.** El modelo no
estadounidense, las fuentes HTML en vez de PDF, la expansión de consulta sin infraestructura y los embeddings locales
propuestos fueron, cada uno por separado, la opción *más simple* además de la más soberana — una tranquilidad de que el
compromiso político no gravó al técnico.

## 18. Conclusión

Nos propusimos mover el asistente de un gremio de una búsqueda por palabra clave sobre un pozo global a un motor legal
fundado y multi-sindicato que cita normas y convenios reales. El resultado es una biblioteca durable respaldada por
Postgres, de 737 artículos en siete normas y tres gremios, integrada de forma reversible en el sistema en marcha,
respondiendo a través de un modelo soberano con citas verificables y aislamiento demostrado entre gremios. Los bordes
honestos quedan marcados: la autenticación y el tenant atado a la sesión son la próxima fase, y la búsqueda semántica
espera un vectorizador local y soberano. El método que produjo todo esto —diagnosticar antes de construir, mantener cada
cambio reversible, citar o admitir pero nunca inventar, y registrar los fracasos con el mismo cuidado que los éxitos— se
ofrece aquí como el resultado más transferible del trabajo.

---

## Apéndice A — Mapa de archivos

```
backend/
├── main.py                     # endpoints; inyección del bloque legal + prompt enfocado
├── knowledge_base.py           # get_system_prompt_rag(extra_sources_text), get_legal_prompt_focused
├── rag_retriever.py            # keyword RAG original (intacto, fallback)
└── library_service/
    ├── chunker.py              # partir la ley por artículo (dos notaciones, encoding, limpieza de script)
    ├── scraper.py              # registro SOURCES (InfoLeg + CCT); fetch→chunk
    ├── library.py              # store dual SQLite/Postgres + retrieval (cita/léxico/semántico)
    ├── expander.py             # expansión de consulta con GLM (alternativa a embeddings)
    ├── embeddings.py           # hook de embeddings (proveedor configurable)
    ├── ask.py                  # Abogado standalone (RAG completo)
    ├── adapter_hornero.py      # puente: legal_sources_text() + resolve_tenant()
    ├── server.py               # servicio HTTP :8010 (health/stats/search/ingest)
    ├── seed.py                 # siembra inicial
    ├── demo_multitenant.py     # prueba de aislamiento
    ├── migrate_pg.py           # migración SQLite → Postgres
    └── keys.env                # secretos (gitignored)
```

## Apéndice B — Estado del corpus
**737 artículos · 7 normas · 3 gremios.** General / `shared`: LCT 20.744 y Leyes 11.544, 23.551, 24.013, 24.557.
Sectorial: CCT 420/05 (aceiteros), CCT 130/75 (comercio).

## Apéndice C — Cómo correrlo
```bash
# 1) Biblioteca como servicio (opcional)
cd backend/library_service && python3 server.py           # :8010

# 2) Backend Hornero con la biblioteca activada
cd backend
python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
export LIBRARY_INPROC=1                                   # o LIBRARY_URL=http://localhost:8010
export LIBRARY_DB_URL=postgresql://127.0.0.1:5432/hornero # opcional: durabilidad
uvicorn main:app --port 8000
# POST /api/chat {"message":"¿cuánto me pagan la hora extra?","formato":"consulta","sector":"aceitero"}
```

## Apéndice D — Los principios, en una línea cada uno
Problema primero · Reversibilidad con flags · Citar o admitir, nunca inventar · Aislamiento entre gremios ·
Soberanía en cada eslabón · Iteración honesta, con los fracasos documentados.
