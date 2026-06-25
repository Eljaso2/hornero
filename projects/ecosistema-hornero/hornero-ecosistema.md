# Ecosistema Hornero

> **organizar es construir**

---

## Capa 1 — Filosofía, metodología y estructura

El qué, el cómo, y el dónde. Por qué existe, cómo se trabaja, dónde se aloja, y cómo se protege. Sin esta capa, el ecosistema es una herramienta sin dirección.

### Núcleo 1 — Filosofía (el qué y el para qué)

Tesis Xiong: las organizaciones deben ser **diseñadoras y creadoras** de sus propias IA, no consumidoras de IA corporativa. La diferencia no es técnica sino política y epistemológica.

| Modelo Silicon Valley | Modelo Xiong / Tricontinental |
|---|---|
| La organización consume IA producida por otros | La organización diseña y crea IA para sus propias lógicas |
| Los datos alimentan modelos corporativos | Los datos alimentan modelos propios, bajo control propio |
| La IA impone categorías universales | La IA opera con categorías situadas |
| La IA es un servicio externo | La IA es una capacidad organizacional que se construye |
| Riesgo: extracción, dependencia | Soberanía, autonomía, replicabilidad |

Los seis eslabones de la cadena de valor de la IA: Datos → Arquitectura → Fine-tuning → Infraestructura → Interfaz → Gobernanza. En cada eslabón, una organización puede intervenir — y eso es "crear IA".

Soberanía como posición política, no checkbox técnico. El dato nunca sale del ecosistema para ser procesado por corporaciones. Producto vs. flujo: la apertura es decisión política deliberada, no default técnico.

El nombre Hornero: el hornero construye su nido de barro, con su propio trabajo, en su propio territorio. "Organizar es construir."

**Lo que NO es — distinciones críticas:**

| NO es… | SÍ es… |
|---|---|
| Un chatbot legal genérico | Una herramienta posicionada del lado del trabajador |
| La app de un sindicato específico | Una plataforma que cada sindicato adapta |
| Un scraper de PDFs | Un convenio vivo: interactivo, explicado, contextualizado |
| Una news app de "labor news" | Inteligencia laboral con categorías del campo |
| Una app de startup que extrae datos | Soberana: datos privados en el teléfono |
| Un chatbot "neutral" | Hornero: argumenta desde la posición del trabajador |
| Un índice "employee satisfaction" | IFT: índice soberano con categorías del campo |

→ `hornero-capa1/nucleo1-filosofia.md`

---

### Núcleo 2 — Metodología / Laboratorio (el cómo)

Cocina central. Espacio de **codiseño** donde sindicatos, universidades y Tricontinental diseñan juntos las herramientas de IA:

- Sindicatos → definen necesidades y lógicas
- Investigadores → traducen a especificaciones técnicas
- Desarrolladores → implementan sobre open-source con infraestructura soberana
- Sindicatos → testean y corrigen en su trabajo real
- Ciclo se repite

**Productos:** modelos fine-tuned laborales, datasets etiquetados, guías de codiseño, kit de arranque.

**Librería base:** el Laboratorio produce y mantiene la librería base que todos los núcleos consumen — taxonomía soberana (etiquetas), pipeline de procesamiento, stack técnico, formatos de salida comunes, categorías morfológicas (referencia N9), reglas de protección (referencia N4). Cada núcleo especifica qué repositorio trabaja en su sección "Repositorio y documentación".

**Nota sobre modelo:** actualmente generación usa DeepSeek API (fragmentos se recuperan localmente). Soberanía de datos ✓, soberanía de modelo en camino → cuando Laboratorio produzca fine-tuned, DeepSeek se reemplaza por modelo propio.

→ `hornero-capa1/nucleo2-metodologia.md`

---

### Núcleo 3 — Estructura (el dónde)

Infraestructura soberana. Sin infraestructura soberana, no hay datos soberanos — y sin datos soberanos, no hay IA soberana.

**Infraestructura: ambas opciones como camino:**
- Fase inicial: VPS soberano alquilado (Argentina, no AWS). Soberanía funcional: controlamos todo el stack.
- Fase de escala: servidor propio/universitario cuando el ecosistema crezca.
- Soberanía no depende del rack físico, depende de quién controla acceso, datos, modelos.

→ `hornero-capa1/nucleo3-estructura.md`

---

### Núcleo 4 — Protección

Soberanía, uso ético, protección de datos y privacidad. Va en Capa 1 porque define las reglas que todo el ecosistema aplica.

- **Consentimiento explícito** — datos personales nunca sin consentimiento
- **Anonimización por defecto** — observaciones IS anonimizadas
- **Encriptación** — TLS + AES-256 en transmisión y almacenamiento
- **Acceso por grados** — visibilidad según nivel (trabajador → delegado → secretario → directivo)
- **Protección contra identificación** — denuncias pueden ser anónimas; testimonios se publican solo con consentimiento explícito
- **Dato privado vs. producto público** — dato privado nunca sale; producto público es decisión política deliberada
- **Uso ético** — datos no se monetizan; corpus pertenece al programa; sindicatos deciden qué se publica

→ `hornero-capa1/nucleo4-proteccion.md`

---

## Capa 2 — Lo que el trabajador ve y usa: la app Hornero

### Núcleo 5 — App

La punta de la pirámide. Cada subsección se describe desde lo que el trabajador **necesita, hace, y encuentra** — no desde cómo funciona internamente.

**Pantalla de inicio "¿Qué necesitás?"** — opciones agrupadas:
- Información: Novedades (5f), Nuestro Derecho (5d)
- Acción: Argumento (5g), Comunicador (5e), IS (5b)
- Condición obrera: Morfología (5h), Comportamiento Empresarial (5i), Felicidad (5p)
- Historia e identidad: Historia Obrera (5c), Tu historia (5o)
- Entrada: Qué es el Ecosistema (5a)

**Principios:** local-first, privacidad por diseño (Núcleo 4), interfaz con trabajadores, actualización controlada, multimodal, siempre con la fuente.

**5a** Qué es el Ecosistema · **5b** IS · **5c** Historia Obrera · **5d** Nuestro Derecho · **5e** Comunicador · **5f** Las novedades · **5g** Argumento · **5h-i-p** Condición obrera (Morfología · Comportamiento Empresarial · Felicidad) · **5o** Tu historia

→ `hornero-capa2/nucleo5-app.md`

---

## Capa 3 — Cómo funciona: backend / la planta de producción

Los núcleos 6-13 son líneas de trabajo que **producen datos, procesan información, y entrenan modelos**. Lo que el trabajador ve en la App (Núcleo 5) es el output de lo que estos núcleos hacen internamente. Todo opera según la metodología del Laboratorio (Núcleo 2) y la protección del Núcleo 4.

### Núcleo 6 — Inteligencia Sindical

Data primaria. Sistema de grados 1-4. Motor de clasificación de conflictos, detector de tendencias emergentes, generador de prompts analíticos. Categorías del campo, no genéricas.

### Núcleo 7 — Nuestro Derecho

Convenios, leyes, discursos, volantes, resoluciones de asamblea. La **posición oficial del sindicato**, documentada. Motor de descripción archivística sindical, búsqueda federada, constructor de series documentales. El archivo como datos — el combustible de toda IA. **Nota:** información de empresas (balances, registros) → N11 (CE).

### Núcleo 8 — Historia Obrera

Entretenimiento, historia, formación. Articulación HO. Capa IA que amplifica producción historiográfica: asistente de investigación, transcripción, narrativas guiadas.

### Núcleo 9 — Morfología

Categorías propias (Iñigo Carrera). Define la **taxonomía soberana** que estructura todo el ecosistema — la epistemología del sistema. Morfología → Documentación → Laboratorio → todos los demás.

### Núcleo 10 — Coyuntura laboral

Clipping semanal automatizado. Captura lo urgente, produce inteligencia sobre coyuntura laboral. La IA amplifica capacidad analítica; la lógica es definida por analistas laborales.

### Núcleo 11 — Comportamiento Empresarial

Chat de análisis empresarial + Índice ICE (4 dimensiones: Directa, Condiciones de Trabajo, Estructural, Simbólica — violencia y buenas prácticas). **ICE×SMVM**: correlación CE con salario mínimo vital y móvil. Evaluación DDHH. Flujo de datos desde Reporte Gremial (5b). Repositorio: balances, RSE, Business and Human Rights, tesis, El Encanto del Tanino, OIT, leyes laborales.

### Núcleo 12 — Tu historia

Diálogo semiestructurado. Motor de entrevista adaptativa, etiquetador automático (categorías del ecosistema), constructor de narrativas cualitativas. Pauta: historiadores del futuro.

### Núcleo 13 — Felicidad del Trabajador (IFT)

Índice 6 dimensiones (condiciones materiales, tiempo propio, salud, capacidad organizativa, pertenencia, futuro). **Emerge del ICE×SMVM** que Federación Aceitera ya trabaja. IFT×CE, IFT×SMVM. Contramedida soberana.

→ `hornero-capa3/nucleos6-13-backend.md`

---

## Mapa de Articulación

```
Capa 1 ──────────── define cómo y dónde ────────────
N1  Filosofía ──── qué y para qué ────────────────
N2  Metodología ── cómo (codiseño, producción) ────
N3  Estructura ─── dónde (VPS soberano → propio) ──
N4  Protección ─── reglas (consentimiento, encriptación, ética)

Capa 2 ──────────── lo que el trabajador ve ────────
N5  App ─────────── interfaz (5a-5p) ───────────────
     ├── consume lo que Capa 3 produce
     └── alimenta datos de uso y observaciones → N2, N6, N12

Capa 3 ──────────── la planta de producción ────────
N6  IS ─────── data primaria → 5b, 5f
N7  Nuestro Derecho ── convenios, leyes, volantes, resoluciones → 5d, 5g
N8  HO ──────── narrativas, formación → 5c, 5g
N9  Morfología ── categorías, taxonomía → estructura etiquetado, 5h, 5g
N10 Coyuntura laboral ── clipping semanal → 5f, 5g
N11 CE ──────── ICE + ICE×SMVM + chat empresarial → 5i
N12 Tu historia ─ testimonios, narrativas cualitativas → 5o
N13 Felicidad ── IFT + IFT×CE + IFT×SMVM → 5p

Lógica del ciclo:
N9 (Morfología) define categorías
  → N7 (Nuestro Derecho) organiza datos
    → N2 (Laboratorio) produce modelos
      → [N6, N8, N10, N11, N12, N13] usan modelos + producen datos
        → vuelven a N7 y N2
N3 (Estructura) sostiene todo
N4 (Protección) protege todo
N5 (App) es la interfaz — punta de la pirámide
```

| Núcleo | Nombre | Qué produce | Se muestra en App |
|---|---|---|---|
| 1 | Filosofía | Principios, posicionamiento | 5a |
| 2 | Metodología / Laboratorio | Modelos, datasets, guías, librería base | — |
| 3 | Estructura | Infraestructura soberana | — |
| 4 | Protección | Reglas de protección | En todas las secciones |
| 5 | App | Interfaz bidireccional | — |
| 6 | IS | Observaciones, informes, clasificación | 5b, 5f |
| 7 | Nuestro Derecho | Convenios, fichas, series, volantes, resoluciones | 5d, 5g |
| 8 | HO | Narrativas, transcripciones | 5c, 5g |
| 9 | Morfología | Categorías soberanas, estadísticas | 5h (condición obrera), 5g |
| 10 | Coyuntura laboral | Clipping, clasificación | 5f, 5g |
| 11 | CE | Chat empresarial, 4 dimensiones, ICE, ICE×SMVM, info empresarial | 5i (condición obrera) |
| 12 | Tu historia | Testimonios etiquetados, narrativas | 5o |
| 13 | Felicidad | IFT compuesto, IFT×CE, IFT×SMVM | 5p (condición obrera) |

---

## Próximos pasos

**Hornero es la punta de la pirámide** (Núcleo 5). Hay que apuntar ahí.

Implementar todo juntos es inviable. La estrategia es **federada: una rama primero, completa y bien hecha, de punta a punta**.

### Estrategia de construcción

1. **Rama piloto** — una actividad, completa y validada por trabajadores reales
2. **Validación real** — trabajadores de base hacen consultas; ajustamos con lo que falla
3. **Escala federada** — 5 ramas → federaciones → red completa. Cada sindicato aporta y cuida su material

### Piloto: Federación Aceitera

- Reunión realizada (18/06/2026) con trabajadores del sindicato de aceiteros. Interés concreto en probar Hornero.
- Federación Aceitera ya acompaña Historia Obrera — vínculo existente y confianza.
- **ICE×SMVM + IFT:** Federación Aceitera ya produce informes VE mensuales → ICE×SMVM se agrega → IFT emerge de la misma data. Primer informe piloto: "el comportamiento que te daña × el salario que te sostiene × la felicidad que buscas".

### Fases de implementación

**Fase 1 — Rama piloto arranca (6-8 meses):**

| Núcleo | Estado | App |
|---|---|---|
| N10 (Coyuntura laboral) | Continúa formato manual | 5f |
| N6 (IS) | Sistema de grados manual con aceiteros | 5b |
| N7 (Nuestro Derecho) | Arranca digitalización piloto | 5d |
| N11 (CE) | Primer informe CE + ICE×SMVM manual | 5i |
| N3 (Estructura) | VPS soberano alquilado | — |

**Fase 2 — IA entra, App amplifica (8-14 meses):**

IA clasifica conflictos, convenio vivo interactivo, Morfología básica, primer IFT, primer motor Tu historia.

**Fase 3 — Ecosistema completo (14-24 meses):**

App completa (Argumento, Comunicador), ICE×SMVM + IFT comparativo internacional, kit de arranque, ciclo cerrado.

### Núcleos potenciales (sin número, sin carpeta)

Ideas para futuro que se implementan según demanda del sindicato piloto:

- Servicios y Beneficios — visibleizar lo que el afiliado gana con afiliarse
- Bolsa de Trabajo — controlar la puerta de entrada al sector
- Salud Laboral — denuncias, mapa de riesgos, categorías sindicales
- Formación y Capacitación — trayectos personalizados, impacto medible
- Asamblea y Participación — amplificar democracia sin reemplazar asamblea física

→ `hornero-nucleos-nuevos.md`

### Documentación de referencia

| Archivo | Contenido |
|---|---|
| `hornero-capa1/nucleo1-filosofia.md` | Filosofía: Xiong, soberanía, distinciones. Repositorio: define principios — no consume datos |
| `hornero-capa1/nucleo2-metodologia.md` | Metodología: codiseño, productos, librería base, estado modelo. Repositorio: corpus de fine-tuning |
| `hornero-capa1/nucleo3-estructura.md` | Estructura: VPS→propio, stack, encriptación. Repositorio: stack técnico, configs de servidor |
| `hornero-capa1/nucleo4-proteccion.md` | Protección: consentimiento, anonimización, ética. Repositorio: define reglas — no consume datos |
| `hornero-capa2/nucleo5-app.md` | App: 5a-5p, principios interfaz. Repositorio: consumidor — no repositorio propio |
| `hornero-capa3/nucleos6-13-backend.md` | Backend: 8 núcleos, pipeline, stack |
| `hornero-capa3/nucleo6-is/nucleo6-is.md` | IS: grados, etiquetas, flujo piloto. Repositorio: observaciones terreno + informes 1-4 |
| `hornero-capa3/nucleo7-nuestro-derecho/nucleo7-nuestro-derecho.md` | Nuestro Derecho: CCT, leyes, discursos, volantes, resoluciones. Repositorio: posición oficial sindical (info empresarial → N11) |
| `hornero-capa3/nucleo8-historia-obrera/nucleo8-historia-obrera.md` | HO: contenido HO + capa IA. Repositorio: historiaobrera.com.ar + documentos históricos sindicales |
| `hornero-capa3/nucleo9-morfologia/nucleo9-morfologia.md` | Morfología: categorías propias. Repositorio: INDEC + Banco Mundial + datos IS/Documentación |
| `hornero-capa3/nucleo10-coyuntura/README.md` | Coyuntura: clipping semanal. Repositorio: fuentes periodísticas (ver SOURCES_CATALOG.md) |
| `hornero-capa3/nucleo11-comportamiento-empresarial/nucleo11-comportamiento-empresarial.md` | CE: chat empresarial, 4 dimensiones (Directa, CT, Estructural, Simbólica), ICE, ICE×SMVM, info empresarial, flujo desde Reporte Gremial. Repositorio: informes VE federaciones + datos IS + SMVM + balances/registros empresas + tesis + El Encanto del Tanino + OIT + RSE |
| `hornero-capa3/nucleo12-tu-historia/nucleo12-tu-historia.md` | Tu historia: testimonios, narrativas. Repositorio: testimonios app + pautas HO |
| `hornero-capa3/nucleo13-felicidad/nucleo13-felicidad.md` | Felicidad/IFT: 6 dimensiones, IFT×CE×SMVM. Repositorio: compuesto de N6+N7+N9+N11+N12 |
