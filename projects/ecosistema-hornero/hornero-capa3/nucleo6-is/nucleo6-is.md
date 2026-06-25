# Hornero — Núcleo 3: Inteligencia Sindical

> Núcleo 3 es Inteligencia Sindical — el dispositivo de inteligencia colectiva donde la IA amplifica la capacidad analítica del movimiento obrero.
> Sistema de grados 1-4, encriptados, informes, trazabilidad.
> Caso piloto: trabajadores aceiteros y desmotadores del norte de Santa Fe → sindicato Reconquista → Federación Aceitera.

---

## 1. El flujo — cuatro informes, una semana

```
FUENTE PRIMARIA (trabajador grado 1)
  narra (voz/texto) — desordenado, espontáneo, real
  ↓
IA etiqueta, ordena, extrae datos duros
  → INFORME DE GRADO 1 (uno por cada carga)
  → alimenta estadística cuantitativa + informe cualitativo
  → trazabilidad: fuente primaria vinculada
  ↓
DELEGADO (grado 2) chequea contra fuente primaria
  → produce INFORME DE GRADO 2 (agrega todos los grado 1 de su fábrica/territorio)
  ↓
SECRETARIO GENERAL sindicato local (grado 3)
  → produce INFORME DE GRADO 3 (agrega todos los grado 2 de su jurisdicción)
  ↓
COMISIÓN DIRECTIVA federación (grado 4)
  → produce INFORME DE GRADO 4 (agrega todos los grado 3)
  → OUTPUT PÚBLICO si el secretario general decide publicarlo
```

Todo esto sucede en una semana.

---

## 2. Visibilidad — quién ve qué

| Grado | Ve | No ve |
|---|---|---|
| Grado 1 (trabajador) | Sus propios informes de grado 1 | Informes grado 2, 3, 4. Informes grado 1 de otros trabajadores |
| Grado 2 (delegado) | Informes grado 1 que le corresponden (su fábrica/territorio) | Informes grado 1 de otros territorios. Informes grado 3 y 4 |
| Grado 3 (secretario sindicato) | Informes grado 2 que le corresponden (su jurisdicción) | Informes grado 2 de otros sindicatos. Informes grado 1 directamente. Informes grado 3 de otros. Informes grado 4 |
| Grado 4 (directivo federación) | Informes grado 3 de toda la federación | Informes grado 1 y 2 directamente |

Principio: **cada grado ve solo lo que le corresponde por su territorio y su responsabilidad**. No hay acceso horizontal — un delegado no ve lo que pasa en otro territorio, un secretario no ve los informes de otro sindicato.

---

## 3. Roles y registro

### La app es para cargar, no para navegar

En este nodo de Inteligencia Sindical, la app no es una interfaz de consulta pública. Es un **dispositivo de carga**: cada usuario ingresa información según su rol. Nadie "ve" la estructura organizativa en la app — ni quién es delegado, ni quién es grado 1. El rol solo determina qué tipo de informe puede cargar y qué responsabilidad tiene.

### Niveles de registro

| Grado | Rol | Verificación | Qué carga | Responsabilidad |
|---|---|---|---|---|
| Grado 1 | Trabajador de base | Registro en la app | Narra su situación | Ninguna — solo carga |
| Grado 2 | Delegado de base | Verificado por el sindicato | Chequea grado 1, agrega narrativa, produce grado 2 | Aprueba output de su empresa/localidad |
| Grado 3 | Miembro de comisión / secretario sindicato | Verificado por el sindicato | Produce grado 3 sobre grado 2 | Aprueba output regional |
| Grado 4 | Directivo de federación/unión | Verificado por la federación | Produce grado 4 sobre grado 3 | Aprueba output federal y decisión de publicar |

### Principios

- **Todo usuario está registrado.** No hay carga anónima. Cada informe tiene trazabilidad — quién lo cargó, qué grado, cuándo.
- **Delegado es un rol público.** Ser delegado no es información sensible — es una función conocida.
- **La privacidad es sobre quién ve los datos, no sobre quién carga.** Un trabajador grado 1 carga con su nombre. Pero solo grado 2 (delegados) o superior pueden ver informes grado 1 con nombre.
- **Grado 1 es neutro.** No dice "militante" ni "afiliado" — solo indica trabajador registrado.

---

## 4. Fuente primaria — lo que el trabajador carga

### Qué es

El trabajador narra su situación — voz, texto, desordenado, espontáneo, mal redactado, como sea. Es lo que realmente dijo, en sus palabras. **No se pierde, no se modifica, no se "corrige"**. Es la fuente primaria del sistema.

La fuente primaria se guarda intacta. Lo que la IA produce a partir de ella es el **informe de grado 1** — etiquetado, ordenado y estructurado. Pero la fuente primaria queda disponible para que el delegado pueda chequear contra ella.

### Interfaz

- **Voz**: habla. Whisper transcribe localmente. El audio queda en el teléfono, no se envía al backend.
- **Texto**: escribre. Relato libre, sin formato obligatorio.
- **Mixto**: grabar voz y agregar texto después.
- **Foto**: toma una foto o selecciona del teléfono. Puede ser del lugar de trabajo, un accidente, condiciones materiales, un documento, un cartel, una asamblea — cualquier imagen que grafique lo que se cuenta. La IA detecta contenido visual (tipo de espacio, condiciones, presencia de personas, textos en cartel/documento) y lo vincula con la narrativa. **Metadatos EXIF se eliminan automáticamente** (ubicación, modelo de teléfono, fecha/hora original) — la imagen se conserva, la traza de identidad se protege.
- **Video**: graba un clip corto o selecciona del teléfono. Puede mostrar un incidente, una marcha, una asamblea, una condición de trabajo, un proceso productivo — lo que el trabajador necesita mostrar para que se entienda lo que narra. La IA analiza contenido visual y lo vincula con la narrativa. **Metadatos se eliminan automáticamente**. El video se almacena en el servidor soberano del ecosistema (Núcleo 2), no en plataformas externas.
- **Chequeo**: Hornero muestra lo que entendió — texto, etiquetas, y cómo vinculó las imágenes/videos con la narrativa. El trabajador verifica antes de confirmar.
- **No ve informes de otros**: su interfaz es solo carga + su propio historial.

### Soberanía visual

Las fotos y videos son **fuente primaria visual** — tan importante como la narrativa. No se pierden, no se modifican, no se suben a plataformas corporativas. Pero el sistema protege al trabajador:

- **Eliminación automática de EXIF**: cada imagen/video que entra al sistema pierne metadatos de ubicación, dispositivo y fecha/hora. Se conserva el contenido visual, se elimina la traza que podría identificar quién lo cargó, desde dónde, con qué teléfono.
- **Sin subida a plataformas externas**: fotos y videos se almacenan en el servidor soberano del ecosistema (Núcleo 2 — Estructura). No pasan por Google Photos, iCloud, YouTube ni cualquier servicio corporativo.
- **Acceso por grados**: las imágenes/videos siguen la misma lógica de visibilidad que los informes — grado 1 solo ve sus propias fotos, grado 2 ve las de su territorio, etc. No hay acceso horizontal.
- **Decisión de publicación**: cuando el informe de grado 4 se publica, el secretario general decide qué imágenes/videos se incluyen y en qué nivel de detalle — rostros pueden ocultarse, ubicaciones pueden generalizarse.

---

## 5. Informe de grado 1 — la IA etiqueta y ordena

### Qué es

Por cada carga de un trabajador grado 1, la IA produce **un informe de grado 1**. Hay tantos informes de grado 1 como cargas en el sistema. No es un resumen — es la fuente primaria etiquetada, ordenada y estructurada, con datos duros extraídos y trazabilidad.

### Etiquetas automáticas

La IA **etiqueta automáticamente** el contenido. El trabajador no necesita categorizar — la IA detecta según palabras, contexto, contenido. Puede ser que el informe no identifique cada etiqueta explícitamente, pero según palabras e información, la IA puede identificarla.

#### Familia 1 — Conflicto laboral con la empresa

| Etiqueta | Qué detecta | Ejemplo |
|---|---|---|
| Conflicto salarial | Referencias a salario, escalas, pagos, básico, adicionales | "No nos pagaron la escala de marzo" |
| Paritaria | Referencias a negociación, oferta patronal, posición sindical | "La patronal ofrece 5%, nosotros pedimos 12%" |
| Despidos | Referencias a despidos, ceses, "por rendimiento", reducción de personal | "Tres compañeros cesaron esta semana" |
| Suspensiones | Referencias a suspensiones, goce de sueldo, reducción de turnos | "Nos suspendieron con goce de sueldo" |
| Lock-out | Referencias a cierre, reducción de actividad sin notificación | "La planta paró sin avisar" |
| Huelga / acatamiento | Referencias a paro, medida de fuerza, porcentaje de acatamiento | "60% de acatamiento en la planta" |
| Presión patronal | Referencias a presión, amenazas, coacción, persecución | "El supervisor nos presiona para no protestar" |
| Discriminación | Referencias a discriminación por género, edad, militancia | "A las mujeres no las promocionan" |

#### Familia 2 — Condiciones y dinámica de trabajo

| Etiqueta | Qué detecta | Ejemplo |
|---|---|---|
| Ritmo de producción | Referencias a velocidad, presión de tiempo, cadencia | "Nos quieren sacar 500 toneladas por turno" |
| Turnos | Referencias a cambio de turnos, rotación, extensión | "Cambiamos de 3 turnos a 2" |
| Horas extra | Referencias a horas extra, compensación, exceso | "Nos piden horas extra sin compensación" |
| Categoría laboral | Referencias a categoría, escala, promoción, cambio de función | "Me cambiaron de categoría sin consentimiento" |
| Salud laboral / accidentes | Referencias a accidentes, EPP, riesgos, enfermedad | "Dos accidentes en prensa esta semana" |
| Precarización | Referencias a contratos temporales, informalidad, estabilidad | "15 contratados sin cobertura sindical" |
| Tercerización | Referencias a empresas de servicios, externalización, contratistas | "Logística la hace una empresa externa" |
| EPP / equipamiento | Referencias a protección, falta de equipamiento, condiciones materiales | "No nos dan guantes adecuados" |

#### Familia 3 — Dinámica de producción por sección

| Etiqueta | Qué detecta | Ejemplo |
|---|---|---|
| Sección: prensa | Referencias a prensa, extracción, elaboración primaria | "En prensa se redujo el turno" |
| Sección: envasadora | Referencias a envasadora, packaging, líneas | "Envasadora: ritmo acelerado, 3 líneas" |
| Sección: logística | Referencias a logística, transporte, depósito, distribución | "Logística externalizada" |
| Sección: mantenimiento | Referencias a mantenimiento, reparación, infraestructura | "Dos mecánicos para toda la planta" |
| Sección: administración | Referencias a administración, oficinas, gestión | "Presión para sacar reportes más rápido" |
| Automatización | Referencias a máquina nueva, robotización, sistema automatizado | "Pusieron una máquina que hace el trabajo de 5" |
| Reorganización de producción | Referencias a cambio en la forma de producir, redistribución | "Cambian la distribución de líneas" |
| Volumen / capacidad | Referencias a cantidad producida, capacidad instalada, targets | "Nos piden 20% más de volumen" |

#### Familia 4 — Estrategia patronal

| Etiqueta | Qué detecta | Ejemplo |
|---|---|---|
| Estrategia de reducción | Referencias a reducción de personal, de turnos, de costos | "Están reduciendo personal" |
| Estrategia de tercerización | Referencias a planes de externalizar, contratos nuevos | "Van a externalizar mantenimiento" |
| Estrategia de presión sindical | Referencias a ataque a delegados, presión sobre comisión | "Quieren reducir la comisión interna" |
| Estrategia de fragmentación | Referencias a división entre trabajadores, categorías diferenciadas | "Nos dividen: unos con convenio, otros sin" |
| Inversión / desinversión | Referencias a inversión nueva, cierre, venta, reestructuración | "La empresa no invierte en mantenimiento" |
| Estrategia legal | Referencias a uso de la ley contra trabajadores, interpretación patronal | "Interpretan el Art. 7bis a su favor" |

#### Familia 5 — Condiciones de vida

| Etiqueta | Qué detecta | Ejemplo |
|---|---|---|
| Vivienda | Referencias a alquileres, falta de vivienda, condiciones habitacionales | "Alquileres subieron 30%" |
| Transporte | Referencias a transporte, distancia, costo de viaje | "El colectivo no pasa por la planta" |
| Alimentación / precios | Referencias a precios, canasta, costo de comer, mercado | "La canasta básica está $450.000" |
| Salud (no laboral) | Referencias a salud general, hospital, acceso médico, medicamentos | "El hospital no tiene especialista" |
| Educación | Referencias a escuela, formación hijos, acceso educativo | "No hay secundaria en el pueblo" |
| Costo de vida | Referencias a costo general, comparación con salario, brecha | "El básico no cubre ni la canasta" |
| Canasta básica real | Referencias a precios concretos, comparación salario vs. costo | "Gasto $500.000 y cobro $380.000" |

#### Familia 6 — Vida sindical

| Etiqueta | Qué detecta | Ejemplo |
|---|---|---|
| Afiliación | Referencias a afiliarse, desafiliarse, crecimiento de base | "5 compañeros se afiliaron" |
| Comisión interna | Referencias a comisión, delegados, representación | "La comisión está bajo presión" |
| Asamblea | Referencias a asamblea, reunión, consulta a base | "Asamblea este viernes" |
| Formación | Referencias a curso, taller, capacitación, aprendizaje | "Taller sobre convenio esta semana" |
| Campaña | Referencias a campaña, movilización, acción sindical | "Campaña contra tercerización" |
| Marcha / movilización | Referencias a marcha, protesta, acción pública | "Marchamos al ministerio" |
| Corrientes / agrupaciones | Referencias a agrupación, corriente, lista, posición interna | "La agrupación A propone..." |

#### Familia 7 — Intra-sindical / inter-sindical

| Etiqueta | Qué detecta | Ejemplo |
|---|---|---|
| Conflicto intra-sindical | Referencias a tensión interna, debate, disputa entre agrupaciones | "La agrupación B cuestiona la negociación" |
| Articulación sectorial | Referencias a coordinación con otros sindicatos, otros sectores | "Aceiteros y forestales coordinan" |
| Conflicto inter-sindical | Referencias a conflicto entre sindicatos, entre federaciones | "Dos sindicatos disputan la representación" |
| Conflicto con trabajadores | Referencias a tensión entre trabajadores y sindicato, desconfianza | "Los compañeros no confían en la comisión" |

#### Familia 8 — Legal / convenio

| Etiqueta | Qué detecta | Ejemplo |
|---|---|---|
| Convenio colectivo | Referencias a CCT, cláusula, artículo, escala por convenio | "El Art. 7bis no se aplica" |
| Cláusula no aplicada | Referencias a artículo que no se cumple, interpretación patronal | "La empresa interpreta el Art. 15 a su favor" |
| Jurisprudencia | Referencias a fallo, sentencia, precedente judicial | "Hay un fallo que protege esta situación" |
| Normativa | Referencias a ley, decreto, resolución ministerial | "La Ley 20.744 Art. 159 protege esto" |

#### Familia 9 — Producción: qué se produce y cómo

> **Objetivo:** que el sindicato tenga un registro de qué se está produciendo y cómo, pueda reconstruir el proceso productivo, entender la materia prima, detectar cambios — innovaciones, trabas, faltantes, cambios de ritmo, cambios de directivas. La producción no es solo "condiciones de trabajo" — es **lo que la empresa hace, con qué, y para qué**. El sindicato que entiende la producción puede pensar estratégicamente.

| Etiqueta | Qué detecta | Ejemplo |
|---|---|---|
| **Materia prima — tipo** | Referencias a qué materia prima entra, de qué producto, de qué origen | "Entró soja del norte, girasol de Córdoba" |
| **Materia prima — volumen** | Referencias a cantidad de materia prima recibida, variación, exceso o déficit | "Esta semana entró menos soja, 30% menos que la anterior" |
| **Materia prima — calidad** | Referencias a calidad del input, contaminación, humedad, impurezas, rechazos | "La soja llegó con mucha humedad, tuvimos que secar más" |
| **Materia prima — proveedor** | Referencias a quién suministra, cambio de proveedor, conflicto con proveedor | "Cambiamos de proveedor de girasol" |
| **Materia prima — precio** | Referencias a costo de la materia prima, variación, impacto en la producción | "La soja subió 15%, eso impacta en lo que procesamos" |
| **Materia prima — faltante** | Referencias a falta de materia prima, demora, shortage, impacto en la planta | "No llegó girasol esta semana, media planta parada" |
| **Proceso productivo — etapa** | Referencias a etapa del proceso: recepción, limpieza, preparación, extracción/prensa, refinación, envasado, almacenamiento, distribución | "La etapa de refinación está trabada" |
| **Proceso productivo — reconstrucción** | Referencias que describen cómo funciona la producción de punta a punta, cómo se conectan las etapas | "La soja entra por recepción → limpieza → prensa → extracción → refinación → envasado" |
| **Línea de producción — estado** | Referencias a qué línea está activa, cuántas líneas corren, cuántas paradas | "2 de 3 líneas de envasado corriendo" |
| **Línea de producción — cambio** | Referencias a cambio en líneas: nueva línea, línea cerrada, reconfiguración | "Pusieron una línea nueva para aceite premium" |
| **Capacidad instalada** | Referencias a capacidad máxima de la planta, cuánto puede producir, si está al limite | "La planta puede procesar 1000 tn/día, estamos en 800" |
| **Capacidad — utilización** | Referencias a porcentaje de capacidad usada, si hay margen o saturación | "Estamos al 80% de capacidad, podrían pedir más" |
| **Volumen de producción** | Referencias a cuánto se produce, variación respecto al anterior, targets vs. real | "Esta semana: 6000 tn procesadas, 10% más que la anterior" |
| **Producto final — tipo** | Referencias a qué se produce: aceite crudo, refinado, pellets, expeller, harina, subproductos | "Estamos produciendo más expeller que aceite refinado" |
| **Producto final — destino** | Referencias a dónde va el producto: exportación, mercado interno, cliente específico | "Todo el aceite refinado va a exportación, la harina al mercado local" |
| **Producto final — stock** | Referencias a inventario, exceso de stock, falta de stock, problemas de almacenamiento | "Tenemos 3 meses de stock de expeller, no hay dónde ponerlo" |
| **Desperdicio / residuo** | Referencias a descarte, borra, residuo, subproducto no utilizado, problema de disposal | "La borra de prensa se acumula, no hay salida" |
| **Innovación tecnológica** | Referencias a nueva máquina, nuevo sistema, nuevo proceso, digitalización, sensor, automatización | "Pusieron un sistema de control automatizado en la refinería" |
| **Innovación organizativa** | Referencias a nuevo método de gestión, lean, kaizen, reorganización de tareas, new workflow | "Implementaron un sistema de turnos rotativos con métricas de rendimiento individual" |
| **Traba en producción** | Referencias a algo que bloquea, frena, impide producir normalmente: rotura, falta, problema técnico, logistical bottleneck | "La prensa 3 está trabada, hay que reparar, afecta toda la línea" |
| **Parada de planta** | Referencias a planta parada, total o parcial, planeada o no, mantenimiento programado o emergencia | "Parada total programada para mantenimiento la semana que viene" |
| **Cambio de directivas** | Referencias a cambio en lo que la empresa decide producir, en qué volumen, con qué prioridad, para qué mercado | "La directiva cambió: ahora priorizamos aceite premium sobre commodity" |
| **Cambio de ritmo — aumento** | Referencias a más velocidad, más presión, más volumen pedido, aceleración | "Nos pidieron aumentar 20% el ritmo de prensa" |
| **Cambio de ritmo — reducción** | Referencias a menos velocidad, menos volumen, desaceleración, planta más lenta | "Están bajando el ritmo, no sabemos si es temporal o cierre gradual" |
| **Mantenimiento — programado** | Referencias a mantenimiento planificado, parada programada, scheduled downtime | "Parada programada para cambio de filtros en refinería" |
| **Mantenimiento — emergencia** | Referencias a rotura imprevista, parada de emergencia, breakdown, unplanned repair | "Se rompió la prensa 2, parada total hasta que llegue el mecánico" |
| **Mantenimiento — estado** | Referencias a estado general de la infraestructura, qué necesita reparación, qué está deteriorado | "Los tanques de almacenamiento necesitan pintura anticorrosiva, hace 5 años no se hace" |
| **Logística interna** | Referencias a movimiento dentro de la planta, transporte entre secciones, flow de producción | "Los camiones internos no dan abasto para mover el expeller" |
| **Logística externa — entrada** | Referencias a recepción de materia prima, camiones que entran, demoras en puerto/descarga | "Los camiones de soja están demorados 3 horas en la puerta" |
| **Logística externa — salida** | Referencias a despacho de producto final, camiones/barcos que salen, demoras en exportación | "El despacho de aceite refinado está trabado, no hay barco hasta la semana que viene" |

### Qué produce el informe de grado 1

- **Cualitativo**: la narrativa del trabajador, etiquetada y ordenada por las categorías detectadas. Se lee, se entiende, se chequea.
- **Cuantitativo**: datos duros extraídos — tipo de conflicto, sector, sección de planta, intensidad, empresa, localidad, valores numéricos (salarios, precios, cantidad de despidos, porcentaje de acatamiento, etc.). Alimenta estadísticas.
- **Visual**: fotos y videos vinculados a la narrativa — la IA asocia cada imagen/video con las etiquetas detectadas y el fragmento de relato correspondiente. Un accidente en prensa tiene la foto del derrame de aceite caliente; un EPP inservible tiene la foto del guante rotoso; una asamblea tiene el video de la sala. La evidencia visual **grafica lo que se cuenta** — hace visible lo que solo en texto quedaría abstracto.
- **Trazabilidad**: vinculado a la fuente primaria (el relato original del trabajador). Se puede siempre volver a lo que realmente dijo — y a lo que realmente mostró.

---

## 6. Informe de grado 2 — el delegado chequea y agrega

### Qué es

El delegado (grado 2) **chequea** los informes de grado 1 contra las fuentes primarias — lee lo que el trabajador realmente dijo, y verifica si lo que la IA etiquetó y ordenó es correcto. Luego **agrega** su narrativa: análisis, contexto, correcciones, información que el trabajador no tenía.

El informe de grado 2 **agrega todos los informes de grado 1** de la fábrica o territorio sobre el que opera el delegado. No es uno por carga — es uno por territorio.

### Proceso

1. El delegado recibe los informes de grado 1 de su territorio — texto, etiquetas y fotos/videos vinculados.
2. Chequea contra fuentes primarias: "¿Esto es lo que el compañero realmente dijo? ¿La etiqueta es correcta? ¿Faltó algo? ¿La foto/video corresponde a lo que se narra?"
3. Agrega su narrativa: "Yo como delegado veo que estos tres informes sobre turnos tienen un denominador común..."
4. Puede corregir etiquetas, agregar etiquetas nuevas, marcar información imprecisa.
5. Puede **agregar sus propias fotos/videos** — el delegado está en el territorio y puede documentar lo que ve: condiciones generales de la planta, imágenes de contexto, fotos de reunión con compañeros, video de una situación que ningún trabajador cargó pero que él observa.
6. La IA produce el informe de grado 2: agregación de todos los grado 1 + narrativa del delegado + fotos/videos de grado 1 y propias + datos duros consolidados. Las imágenes se organizan por etiqueta y sección — "conflicto salarial: 3 fotos de escalas no aplicadas; accidentes: 2 fotos de prensa, 1 video de envasadora".
7. Trazabilidad: se sabe qué vino de grado 1, qué agregó el delegado, qué se corregió — y qué imagen/video pertenece a cada fuente.

---

## 7. Informe de grado 3 — el secretario del sindicato local

### Qué es

El secretario general del sindicato local (e.g., Reconquista) produce el informe de grado 3 sobre la base de **todos los informes de grado 2** de su jurisdicción — todas las fábricas, todos los territorios, todos los delegados bajo su sindicato.

### Proceso

- Recibe los informes de grado 2 de cada delegado — texto, etiquetas, datos duros y fotos/videos consolidados por territorio.
- La IA los consolida: panorama del sindicato local — conflicto por fábrica, condiciones de vida por barrio, estrategia patronal por empresa, dinámica de producción por planta. Las imágenes/videos se organizan como **galería visual del sindicato** — lo que pasa en cada territorio, visible para el secretario.
- El secretario agrega su lectura, su posición, su estrategia. Puede **agregar fotos/videos propios** — una marcha que convocó, una reunión con otros sindicatos, un documento estratégico que quiere circule solo dentro del sindicato.
- Trazabilidad: se sabe qué grado 2 alimenta cada dato — y qué imagen/video pertenece a cada fuente y territorio.

---

## 8. Informe de grado 4 — la federación

### Qué es

La comisión directiva de la federación produce el informe de grado 4 sobre la base de **todos los informes de grado 3** — todos los sindicatos locales, todas las regiones, todo el panorama federal de la rama.

### Output público

El informe de grado 4 es el **output que se comparte**. El secretario general de la federación decide si se hace público — qué nivel de detalle, qué se comunica, qué se reserva. Esto incluye **qué imágenes/videos se publican y con qué tratamiento**: rostros pueden ocultarse, ubicaciones pueden generalizarse, videos pueden editarse para proteger identidades. La decisión visual es parte de la decisión política de publicación.

---

## 9. Estadística cuantitativa + informe cualitativo

### Dos productos simultáneos

Las etiquetas alimentan **dos productos** en paralelo:

**Cuantitativo (estadística):**
- Número de conflictos por tipo, por semana, por localidad, por sección de planta.
- Evolución salarial vs. costo de vida.
- Accidentes por sección, por semana.
- Afiliación: crecimiento/declive por localidad.
- Acatamiento: porcentaje por planta, por semana.
- Estrategias patronal: frecuencia por tipo, por empresa.
- Series temporales: comparación semana a semana, mes a mes.
- Gráficos, tablas, mapas — todo automatizado desde las etiquetas.

**Cualitativo (informe):**
- Narrativa etiquetada y ordenada — se lee, se entiende, se comunica.
- Análisis del delegado, del secretario, de la federación — la lectura de conjunto.
- Dinámica: no solo "qué pasó" sino "qué tendencia emerge", "qué cambió", "qué se conecta".
- Trazabilidad: cada dato tiene origen — fuente primaria → grado 1 → grado 2 → grado 3 → grado 4.

---

## 10. Flujo piloto — primera prueba real

### Escenario

Un trabajador aceitero de Reconquista carga su situación. La IA etiqueta y produce informe de grado 1. El delegado chequea y produce grado 2. El secretario produce grado 3. La federación produce grado 4. Semanalmente, el secretario general decide si el grado 4 se publica.

### Datos necesarios para el piloto

- **Convenio aceitero (CCT):** texto completo, vigente, con escalas, categorías y secciones de planta.
- **Paritarias en curso:** estado de negociación, ofertas, posiciones.
- **Historia de conflictos aceiteros:** conflictos recientes, paritarias previas, luchas del sector.
- **Situación del norte de Santa Fe:** datos laborales, demografía, costo de vida, desmotadores y forestal vinculado.
- **Estructura de planta:** secciones (prensa, envasadora, logística, etc.), categorías por sección, ritmos de producción.
- **Delegados voluntarios:** al menos 3 delegados willing to testear.
- **Trabajadores voluntarios:** al menos 5 trabajadores grado 1 willing a cargar relatos.

### Primer testeo — paso por paso

1. Un trabajador (grado 1) carga un relato (voz o texto) sobre su situación.
2. Hornero transcribe, guarda la fuente primaria, etiqueta, extrae datos duros, pide chequeo.
3. El trabajador verifica. Se produce el informe de grado 1.
4. El delegado (grado 2) recibe los informes grado 1 de su territorio.
5. Chequea contra fuentes primarias, agrega narrativa, corrige etiquetas, profundiza.
6. La IA produce el informe de grado 2 (agregación de todos los grado 1 del territorio + narrativa del delegado).
7. El secretario (grado 3) recibe los informes grado 2 de su jurisdicción.
8. La IA consolida. El secretario agrega su lectura. Se produce informe de grado 3.
9. La comisión directiva (grado 4) recibe todos los grado 3.
10. La IA consolida. Se produce informe de grado 4 — panorama federal de la rama.
11. El secretario general decide si se publica.

### Evaluación

- ¿Las etiquetas (9 familias, ~70 etiquetas) capturan lo que el trabajador y el delegado reportaron?
- ¿El delegado puede chequear contra la fuente primaria?
- ¿La agregación grado 2 funciona — consolidación por territorio?
- ¿El informe grado 3 da panorama útil para el sindicato local?
- ¿El grado 4 da panorámica federal de la rama?
- ¿La trazabilidad funciona — se puede ver quién dijo qué, qué se modificó?
- ¿La dinámica de producción se captura por sección?
- ¿La estadística cuantitativa y el informe cualitativo son coherentes?

---

## Repositorio y documentación

> Qué datos trabaja este núcleo. Todos los núcleos consumen la librería base (N2) — taxonomía, pipeline, stack, formatos de salida, categorías morfológicas, reglas de protección. Lo específico de cada núcleo va aquí.

- **Repositorio:** Observaciones de terreno (trabajadores grado 1) → informes grado 1-4. Sistema de grados con visibilidad diferenciada por rol.
- **Corpus:** Comunicados sindicales, actas de asamblea, notas de prensa laboral, observaciones de terreno etiquetadas con las 9 familias (~70 etiquetas) de la taxonomía soberana.
- **Fuente primaria:** Narrativas de trabajadores (voz/texto/foto/video). Se guarda intacta — no se pierde, no se modifica, no se "corrige". Trazabilidad: cada dato tiene origen desde la fuente primaria.
- **Corpus de fine-tuning (N2):** Comunicados sindicales, actas, paritarias — etiquetados con categorías del campo para entrenar el etiquetador automático y el motor de clasificación de conflictos.

---

## 11. Conexión con el ecosistema

- **Coyuntura Obrera (P1):** este nodo es el núcleo operativo de Coyuntura — inteligencia sindical real, producida desde abajo.
- **Centro de Documentación (P3):** la base de datos es la infraestructura de datos soberanos.
- **Laboratorio IA (P6):** el etiquetador, el extractor de datos duros, el consolidador de informes y la IA de consultas son productos del Laboratorio.
- **Hornero (P7):** la interfaz de carga (trabajador, delegado, secretario, directivo) y la app donde se ve el output público.
- **Morfología (P5):** las etiquetas son la taxonomía soberana que Morfología define. Las formas de producción por sección son morfología aplicada.

El piloto aceiteros prueba el flujo completo: trabajador grado 1 → fuente primaria → informe grado 1 → delegado grado 2 → informe grado 2 → secretario grado 3 → informe grado 3 → federación grado 4 → informe grado 4 → output público.
