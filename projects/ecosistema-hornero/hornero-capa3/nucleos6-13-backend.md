# Capa 3 — Backend: la planta de producción

> Cómo funciona el ecosistema internamente. Los núcleos 6-13 son líneas de trabajo que **producen datos, procesan información, y entrenan modelos**. Lo que el trabajador ve en la App (Núcleo 5) es el output de lo que estos núcleos hacen internamente. Todo opera según la metodología del Laboratorio (Núcleo 2) y la protección del Núcleo 4.

---

## Pipeline de procesamiento

Cada consulta recorre un camino que prioriza precisión y trazabilidad:

1. **Entiende qué preguntás** — orquestador clasifica intención y deriva al agente experto
2. **Filtra por rama y vigencia** — descarta lo que no es de tu actividad y lo que no está vigente
3. **Busca en el archivo real** — búsqueda híbrida: semántica + exacta (`Art. 245`, `Ley 20.744`)
4. **Conecta con mapa de conocimiento** — cómo se vinculan sindicatos, convenios, leyes y hechos
5. **Verifica antes de responder** — agente verificador comprueba respaldo documental. Si no lo tiene, lo dice
6. **Responde con la fuente** — norma, artículo, fecha de vigencia, enlace al documento original

---

## Núcleos

### Núcleo 6 — Inteligencia Sindical (antes Núcleo 3)

**Producción de data primaria interna.** Sistema de grados 1-4, encriptados, informes. Dispositivo de inteligencia colectiva donde la IA amplifica — no reemplaza — la capacidad analítica del movimiento obrero.

- **Motor de clasificación de conflictos:** entrenado con corpus obrero (comunicados, actas, notas de prensa laboral). Categorías del campo: paritaria, comisión interna, convenio, lock-out, huelga de acatamiento, trabajo precario, tercerización, afiliación, conflicto inter-sindical, articulación sectorial.
- **Detector de tendencias emergentes:** sobre serie temporal de observaciones semanales, identifica patrones distribuidos entre sectores y geografías.
- **Generador de prompts analíticos:** no escribe la coyuntura, genera preguntas que los analistas deben responder. La IA interroga, no dictamina.

**Sistema de grados (1-5):** grado 1 observación individual → grado 2 informe delegado → grado 3 informe secretario → grado 4 coyuntura sectorial/nacional (producto de lectura abierta, por rama/federación) → grado 5 panorama general del país (agregación de todos los grado 4, lectura abierta del país).

---

### Núcleo 7 — Nuestro Derecho (antes Núcleo 4)

**Convenios, leyes, discursos, volantes, resoluciones de asamblea.** La posición oficial del sindicato, documentada. Infraestructura de datos laborales soberanos — el archivo real donde la tesis Xiong se materializa con mayor potencia. Los archivos no son solo documentos organizados: son **datos**, el combustible de toda IA.

**Nota:** la información de empresas (balances, registros, datos corporativos) va en N11 (CE), no aquí. Nuestro Derecho custodia lo que el sindicato produce; CE analiza lo que la empresa hace.

- **Motor de descripción archivística sindical:** propone fichas con extensiones específicas para archivos laborales (tipo documental, actor sindical, contexto). No inventa categorías: las aprende de fichas producidas por archiveros laborales.
- **Sistema de búsqueda federada:** busca entre varios archivos sindicales sin centralizar documentos. Cada sindicato tiene su repositorio; consulta va y vuelve con permisos diferenciados.
- **Constructor de series documentales:** dado un archivo desorganizado, propone agrupamientos con lógica sindical.

---

### Núcleo 8 — Historia Obrera (antes Núcleo 5)

**Entretenimiento, historia, formación.** Articulación con historiaobrera.com.ar. HO ya existe como proyecto cultural — efemérides, podcasts (APUntes Radiales), docuficción (Retazos), Colección La Argentina Peronista, artículos (Mitín). Lo que este núcleo agrega es la **capa de IA** que amplifica la capacidad historiográfica:

- **Asistente de investigación en archivos laborales:** busca por categorías históricas laborales, identifica relaciones, genera cronologías automáticas que el historiador verifica. Fine-tuned para entender que "intervención sindical" no es "intervención médica".
- **Motor de transcripción y anotación:** transcribe documentos históricos y los anota con metadata histórica. Historiador supervisa.
- **Constructor de narrativas guiado:** dado fuentes seleccionadas, propone esquemas narrativos para productos de HO.

---

### Núcleo 9 — Morfología (antes Núcleo 6)

**Estadísticas con categorías propias (Iñigo Carrera).** Define la **taxonomía soberana** que estructura todo el ecosistema: es su epistemología. Trabajo comparativo (Brasil, India, Sudáfrica, Argentina) sobre la forma de la clase trabajadora bajo capitalismo tardío.

**Función central:** Morfología define categorías → Nuestro Derecho (Núcleo 7) organiza datos con esas categorías → Laboratorio (Núcleo 2) produce modelos con esos datos → los demás núcleos usan esos modelos. La taxonomía soberana es la epistemología de todo el sistema.

---

### Núcleo 10 — Coyuntura laboral (antes Núcleo 7)

**Outputs estructurados de la coyuntura, no noticias sueltas.** Captura lo urgente, produce inteligencia sobre coyuntura laboral. No es un boletín que "resume noticias": la lógica del sistema es definida por los analistas laborales.

Qué va en esta sección:
- **Clipping semanal:** producto procesado, clasificado, contextualizado. Alimenta IS (N6) con datos de prensa.
- **Informes Gremiales Grado 4:** cada sindicato, por rama/federación. Recibidos de IS (N6).
- **Informes Gremiales Grado 5:** panorama general del país, agregación de todos los Grado 4. La IA consolida y pre-elabora; comité de secretarios generales revisa y firma.
- **Informes de Índices:** actualizaciones de ICE (N11), IFT (N13), Morfología (N9).

- Clipping automatizado alimenta IS (Núcleo 6) con datos de prensa
- Outputs aprobados alimentan "Las novedades" (5f) de la App
- Capa de coyuntura separada de lo normativo permanente
- Notificaciones voluntarias de la App: avisa si hay elementos nuevos

---

### Núcleo 11 — Comportamiento Empresarial (antes Núcleo 8)

**Identificar cómo piensa y actúa el empresario. Medir si ese comportamiento debe registrarse como violencia.**

Dos componentes:
1. **Chat de análisis empresarial:** diálogo donde el trabajador puede pensar y discutir cómo entender y enfrentar al empresario. La IA responde desde el repositorio (balances, historia empresarial, RSE, Business and Human Rights, tesis, El Encanto del Tanino, convenios OIT, leyes laborales, manuales de administración).
2. **Índice ICE (Índice de Comportamiento Empresarial):** 4 dimensiones (Directa, Condiciones de Trabajo, Estructural, Simbólica) — cada una con violencia (negativo) y buenas prácticas (positivo). Se visualiza por empresa, región, rama y general.

- **4 dimensiones:**
  - **Directa:** amenazas, malos tratos, espionaje, lockout, multas, represión, despidos disciplinarios, sanciones + paternalismo, filantropismo, RSE (buenas prácticas para balancear)
  - **Condiciones de Trabajo:** accidentes, condiciones inseguras, EPP, enfermería, ritmo abusivo, enfermedades + programas de salud, seguridad certificada (buenas prácticas)
  - **Estructural:** propiedad, salario insuficiente (análisis de balances), tercerización, cierre/relocalización, concurso como excusa + distribución equitativa, contratación directa, salario sobre SMVM (buenas prácticas)
  - **Simbólica:** mal trato cotidiano, apariciones públicas, discurso anti-obrero, racismo, normalización + reconocimiento, diálogo, respeto simbólico (buenas prácticas)
- **ICE×SMVM:** correlación CE con salario mínimo vital y móvil — ICE-SMVM directo, dinámico, sub-índice violencia económica salarial (salario real vs. SMVM, horas para SMVM, tercerización oculta salario real)
- **Evaluación DDHH:** cada caso de CE evaluado en relación con violaciones DDHH (UNGP, convenios OIT, tratados)
- **Flujo desde Reporte Gremial (5b):** observaciones cargadas por trabajadores → etiquetadas con 4 dimensiones → revisadas por delegado/secretario → alimentan Índice ICE
- **Espacio de carga espontánea:** trabajadores pueden describir situaciones, sugerir material, cargar informes

---

### Núcleo 12 — Tu historia (antes Núcleo 15)

**Diálogo semiestructurado, testimonios etiquetados, narrativas cualitativas.**

Pauta metodológica: historiadores del futuro. El testimonio como dato prospectivo, no retrospectivo.

- **Motor de entrevista semiestructurada:** preguntas abiertas adaptativas según pautas de historia oral (Núcleo 8/HO). Adapta flujo según lo que el usuario ya contó
- **Etiquetador automático:** clasifica con categorías del ecosistema (Núcleos 9 y 11), no categorías genéricas. Sector, tipo de experiencia, período, forma de lucha, VE detectada
- **Constructor de narrativas cualitativas:** síntesis que identifican patrones, tendencias emergentes, futuros posibles. Investigador supervisa — la IA propone, el campo decide

---

### Núcleo 13 — Felicidad del Trabajador (IFT) (antes Núcleo 16)

**Índice compuesto de 6 dimensiones, IFT×CE, IFT×SMVM.** Emerge del ICE×SMVM que la Federación Aceitera ya trabaja. No empieza de cero — se construye sobre lo que ya existe.

6 dimensiones (categorías del campo):
1. Condiciones materiales
2. Tiempo propio
3. Salud y seguridad
4. Capacidad organizativa
5. Pertenencia e identidad
6. Futuro

- **Constructor del IFT:** procesa datos de múltiples núcleos → índice compuesto. Ponderaciones por comité sindicatos+investigadores, no por modelo
- **Detector de correlaciones IFT×CE:** qué dimensiones de CE afectan qué dimensiones de felicidad
- **Constructor de narrativas IFT:** narrativas en lenguaje claro — no dashboard técnico sino historia que el trabajador entiende

---

## Stack técnico

| Rol | Tecnología | Función |
|---|---|---|
| Generación | DeepSeek (→ modelo propio) | Compone respuestas a partir de fragmentos recuperados localmente |
| Búsqueda | Qdrant + BGE | Vectorial e híbrida, self-hosted |
| Conocimiento | Neo4j | Mapa que conecta sindicatos, convenios y leyes |
| Archivo | MinIO + Postgres | Originales y versionado, soberano |
| Audio | Whisper | Transcripción local |
| Orquestación | LangGraph + Dify | Agentes y banco de pruebas |

---

## Documentación detallada por núcleo

Los archivos de desarrollo detallado están en las carpetas por número original:

| Núcleo nuevo | Número original | Carpeta detallada |
|---|---|---|
| 6 (IS) | 3 | `hornero-nucleo3-inteligencia-sindical/` |
| 7 (Nuestro Derecho) | 4 | `hornero-nucleo4-documentacion/` |
| 8 (HO) | 5 | `hornero-nucleo5-historia-obrera/` |
| 9 (Morfología) | 6 | `hornero-nucleo6-morfologia/` |
| 10 (Coyuntura) | 7 | `hornero-nucleo7-coyuntura/` |
| 11 (CE) | 8 | `hornero-nucleo8-violencia/` |
| 12 (Tu historia) | 15 | `hornero-nucleo15-tu-historia/` |
| 13 (Felicidad) | 16 | `hornero-nucleo16-felicidad/` |
