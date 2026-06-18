# Propuesta Final — Ecosistema de IA Laboral Soberana

> **Laboratorio** es la plataforma central desde donde se define, coordina y produce todo el ecosistema. La APP es la interfaz — donde el trabajador ve y toca todo lo que el Laboratorio produce. Las tareas del Laboratorio se implementan gradualmente: primero lo que ya existe, luego lo que necesita desarrollo.

---

## 1. LABORATORIO — la plataforma central

El Laboratorio no es un proyecto entre otros. Es **la plataforma** desde donde emerge todo: la APP, los modelos de IA, la infraestructura de datos, las líneas de investigación, la coordinación con sindicatos y universidades. Es el espacio de codiseño donde el movimiento obrero define qué IA necesita, cómo funciona, y para quién.

### Qué es el Laboratorio

| Dimensión | Qué significa |
|-----------|---------------|
| **Organizativa** | Espacio de codiseño: sindicatos definen necesidades → investigadores traducen a specs → devs implementan → sindicatos testean → ciclo se repite |
| **Tecnológica** | Produce modelos fine-tuned laborales sobre modelos open-source, con corpus y categorías del campo |
| **Epistemológica** | Define las categorías y taxonomías que estructuran todo el ecosistema (Morfología alimenta esto) |
| **Infrastructural** | Gestiona servidor soberano, datasets etiquetados, APIs, pipeline de datos |
| **Política** | Comité de gobernanza (sindicatos + investigadores + Tricontinental) decide qué hace el sistema, qué datos procesa, qué se publica |

### Las tareas del Laboratorio

Desde el Laboratorio se definen y coordinan todas las líneas de trabajo. Cada tarea es una línea que alimenta la APP y que se retroalimenta del uso:

```
┌─────────────────────────────────────────────────────┐
│                LABORATORIO                          │
│                (plataforma central)                 │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Tarea 1  │ │ Tarea 2  │ │ Tarea 3  │            │
│  │Coyuntura │ │ Archivo  │ │ Modelos  │            │
│  │ Obrera   │ │ (datos)  │ │ IA       │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Tarea 4  │ │ Tarea 5  │ │ Tarea 6  │            │
│  │ Historia │ │Morfología│ │Periodismo│            │
│  │ Obrera   │ │ (taxono- │ │ Laboral  │            │
│  │ Popular  │ │  mía)    │ │ Colab.   │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│                                                     │
│         │                                           │
│         ▼                                           │
│  ┌──────────────────────────────────┐              │
│  │           APP (nombre TBD)       │              │
│  │       interfaz del trabajador    │              │
│  │                                  │              │
│  │  Informa │ Convenio │ Archivo    │              │
│  │  Historia│ Argumento│ Contacto   │              │
│  │  Panorama│          │            │              │
│  └──────────────────────────────────┘              │
└─────────────────────────────────────────────────────┘
```

### Descripción de cada tarea

#### Tarea 1 — Coyuntura Obrera (intelligence)

Dispositivo de inteligencia colectiva donde la IA amplifica la capacidad analítica del movimiento obrero. No es un boletín con IA que "resume noticias" — la lógica del sistema es definida por los analistas laborales.

**Qué produce:** lectura procesada de conflictos del sector, clasificación por tipo/sector/intensidad, detección de tendencias emergentes, serie temporal acumulativa.

**Qué recibe de la APP:** observaciones anonimizadas de trabajadores, datos de uso (qué se consulta, qué sectores).

**Estado:** ✅ Existe como proyecto activo (agregación semanal). Motor IA pendiente → Tarea 3 lo desarrolla.

**Primer paso viable:** continuar formato manual mientras se desarrolla motor IA. La APP muestra coyuntura desde el inicio sin IA — lectura humana. IA llega después como amplificación.

#### Tarea 2 — Archivo / Centro de Documentación (data)

Infraestructura de datos laborales soberanos. Los archivos no son solo documentos organizados: son **datos**, el combustible de toda IA. Sin datos soberanos, no hay IA soberana.

**Qué produce:** convenios digitalizados y estructurados (base del Convenio Vivo), documentos sindicales searchable, fichas de descripción archivística con categorías laborales, series documentales organizadas.

**Qué recibe de la APP:** consultas de búsqueda (datos de uso), documentos aportados por sindicatos.

**Estado:** ⚠️ No existe como sistema digital. Archivos físicos dispersos.

**Primer paso viable:** digitalizar convenios del sindicato piloto (1-2 sindicatos) → alimenta Convenio Vivo. No digitalizar TODO antes de empezar: convenios + comunicados recientes son suficientes para Fase 1.

#### Tarea 3 — Modelos IA (engine)

El núcleo tecnológico del Laboratorio. Produce modelos fine-tuned sobre corpus laboral con categorías del campo. Es donde la tesis de Xiong se materializa: la organización crea IA, no la consume.

**Qué produce:**
- Motor de clasificación de conflictos (entrenado con corpus obrero)
- Motor de convenios interactivo (preguntas en lenguaje natural → respuesta estructurada)
- Motor argumentativo (asistencia desde la posición del trabajador)
- Motor de descripción archivística (fichas automáticas con categorías laborales)
- Motor de transcripción y anotación de documentos históricos
- Dataset etiquetado con categorías del campo
- Kit de arranque para sindicatos que quieren empezar

**Qué recibe:** datos etiquetados (de Tarea 1 y 2), convenios digitalizados (de Tarea 2), datos de uso de la APP, correcciones de usuarios, categorías de Tarea 5.

**Estado:** 🔴 No existe. Se construye sobre los datos de las otras tareas.

**Primer paso viable:** alianza universitaria → primer dataset (etiquetar corpus existente de Coyuntura) → primer modelo: clasificación de conflictos.

#### Tarea 4 — Historia Obrera Popular (formation + history)

Herramientas de investigación que amplifican la capacidad historiográfica de trabajadores e investigadores. No "ChatGPT te resume la huelga del 75" — la lógica epistemológica viene de la disciplina histórica.

**Qué produce:** cronologías, búsqueda en documentos históricos, narrativas guiadas, componente formativo ("Tu sindicato puede crear IA").

**Qué recibe:** documentos históricos digitalizados (de Tarea 2), modelos de transcripción/anotación (de Tarea 3).

**Estado:** ⚠️ Existe como concepto y práctica (talleres, investigación). Herramientas IA pendientes.

#### Tarea 5 — Morfología de la clase trabajadora (epistemology)

Trabajo comparativo (Brasil, India, Sudáfrica, Argentina) sobre la forma de la clase trabajadora bajo capitalismo tardío. Define las **categorías y la taxonomía soberana** que estructuran todo el ecosistema: es su epistemología.

**Qué produce:** categorías morfológicas (fracciones de clase, formas de lucha, condiciones), taxonomía que estructura etiquetado y clasificación, comparación internacional visible en Panorama.

**Qué recibe:** datos de Coyuntura (Tarea 1), datos de Archivo (Tarea 2), series de conflictos.

**Estado:** ⚠️ Existe plan de 6 meses con bibliografía, vinculado al curso Tricontinental.

#### Tarea 6 — Periodismo Laboral Colaborativo (amplification)

Amplifica narrativas del ecosistema en medios. Usa inteligencia del campo (no Reuters ni Bloomberg filtrados por modelo corporativo).

**Qué produce:** piezas periodísticas basadas en Coyuntura + Archivo + Historia, acceso a mapas e indicadores del ecosistema.

**Estado:** 🔴 Pendiente de desarrollo. Depende de que Coyuntura y Archivo produzcan contenido suficiente.

---

## 2. La APP — interfaz del ecosistema

La APP es donde **todo se ve**. Es la cara del Laboratorio: el trabajador entra, toca el ecosistema, y no necesita saber cómo funciona detrás. Cada servicio de la APP corresponde a una tarea del Laboratorio.

### Nombre

El nombre está **pendiente**. Criterios:

| Criterio | Qué implica | Qué evitar |
|----------|-------------|------------|
| **Utilidad universal** | Habla a cualquier trabajador, sindicalizado o no | Jerga sindical, términos que solo militantes reconocen |
| **No limitante** | No presupone afiliación, ideología ni pertenencia orgánica | "Compañero", "Sindical", "Obrero" — pueden alienar |
| **Claro en función** | El nombre sugiere qué hace la herramienta | Abstracciones poéticas que no dicen nada |
| **Del Sur, no importado** | Resonancia local, no naming de Silicon Valley | "Smart", "AI", "Pro", nombres en inglés |

**Candidatos a explorar** (definir con codiseño, no ahora):

- **Trabajo** — directo, universal, sin ideología
- **MiLaburo** — coloquial argentino, accesible
- **Oficio** — tradicional, digno, no sectorial
- **Voz** — corto, simple, evoca hablar/esuchar
- **Lupa** — amplifica, hace visible lo oculto

### Pantalla de inicio

**«¿Qué necesitás?»** — servicios como tarjetas/botones claros, cada uno accesible por separado:

| Servicio APP | Qué hace | Tarea Laboratorio | Fase |
|-------------|----------|-------------------|------|
| **Informa** | Coyuntura del sector: conflictos, paritarias, noticias procesadas | Tarea 1 (Coyuntura) | ✅ Fase 1 |
| **Convenio Vivo** | Convenio interactivo: preguntas en lenguaje natural | Tarea 2 + Tarea 3 | ⚠️ Fase 2 |
| **Archivo** | Documentos del sindicato: búsqueda, fichas, series | Tarea 2 (Archivo) | ⚠️ Fase 1b |
| **Historia** | Historia del sector: luchas, discursos, cronologías | Tarea 4 (Historia) | ⚠️ Fase 2 |
| **Argumento** | Asistencia argumentativa: datos, cláusulas, precedentes | Tarea 3 + Tarea 1 + Tarea 2 | ⚠️ Fase 2 |
| **Panorama** | Mapa del sector: nacional + internacional | Tarea 5 + Tarea 1 | ⚠️ Fase 3 |
| **Contacto** | Delegados, calendario, comunicación enrutada | Sindicatos (datos org.) | ✅ Fase 1 |

El trabajador ve cada servicio **independiente**: entra por lo que necesita. Los servicios se interconectan internamente (Argumento usa datos de Convenio + Coyuntura + Historia), pero el usuario no tiene que saberlo.

### Módulos detallados de la APP

**Módulo 1 — Convenio Vivo** (Tarea 2 + Tarea 3)

Todos los convenios colectivos de la rama, como **convenio interactivo** no PDF estático:
- Preguntas en lenguaje natural → la IA extrae cláusula pertinente, explica en lenguaje accesible, contextualiza
- Muestra interpretaciones jurisprudenciales y modificaciones posteriores
- Permite comparar un tema entre convenios de distintos sectores

**Módulo 2 — Luchas y discursos** (Tarea 1 + Tarea 4)

- Luchas del sector con cronología visual: huelgas, paritarias, conflictos
- Discursos de líderes: audio + resumen por IA del Laboratorio
- Argumentos de la organización: no solo comunicado sino la argumentación que lo sostiene
- Conexión histórica: cada lucha actual vinculada a luchas anteriores

**Módulo 3 — Panorama del sector** (Tarea 5 + Tarea 1)

- Nacional: producción, empleo, salarios, conflictos — lectura procesada, no datos crudos
- Internacional: qué ocurre en la misma rama en otros países
- Comparación morfológica: cómo se organiza el sector en distintos países

**Módulo 4 — Asistencia argumentativa** (Tarea 3, el más Xiong)

No es "legal advice" genérico: ayuda para pensar y argumentar **desde la posición del trabajador**.
- *"Me piden horas extra"* → reúne cláusula + argumentos jurídicos + políticos + históricos + cómo plantearlo en asamblea + pasos de la organización
- *"Necesito explicar por qué organizarse"* → argumentos basados en datos del sector, comparación internacional, historia, discursos que ya funcionaron
- *"Estamos en paritaria"* → convenio actual + datos salario/costo de vida + comparación otros convenios + posición sindicato + argumentos patronal (para contra-argumentar)

La IA **no aconseja**: amplifica el arsenal argumentativo. El trabajador decide.

**Módulo 5 — Conexión organizativa** (datos sindicato)

- Directorio de delegados y referentes
- Calendario de actividades
- Canal de comunicación enrutado por tipo de consulta
- Conexión con Coyuntura: aportar observaciones **con privacidad**

### Niveles de profundidad por compromiso

| Nivel | Quién | Qué ve | Qué aporta |
|-------|-------|--------|------------|
| **Básico** (no afiliado) | Consulta convenio, ve coyuntura, busca información | Informa, Convenio, Panorama | Nada — solo consume |
| **Activo** (afiliado) | Contacta delegados, aporta observaciones, recibe alertas | + Contacto, + Argumento | Observaciones anonimizadas |
| **Comprometido** (referente) | Codiseña, corrige, etiqueta, forma | + Acceso a datos, + formación | Correcciones, etiquetado, codiseño |

La APP no empuja al sindicalismo — lo facilita cuando el trabajador lo busca. La utilidad es la puerta; la organización es la profundidad.

---

## 3. Flujo de datos — cómo el Laboratorio articula todo

```
                    LABORATORIO (plataforma)
                    │
    ┌───────────────┼───────────────┐
    │               │               │
    ▼               ▼               ▼
  Tarea 1         Tarea 2         Tarea 3
  Coyuntura       Archivo         Modelos IA
    │               │               │
    │    datos      │    convenios  │
    │ etiquetados   │ digitalizados │
    │               │               │
    └───────────────┼───────────────┘
                    │
                    ▼
              ┌──────────────┐
              │  Modelos IA  │  ← Tarea 3 procesa
              │  fine-tuned  │    lo que llega de
              │  laborales   │    Tareas 1, 2, 5
              └──────────────┘
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
     Tarea 1    Tarea 2      APP
     (clasif.   (búsqueda    (convenio
      autom.)    semánt.)     vivo +
                + fichas)    argumento)

                    APP
                    │
    ┌───────────────┼───────────────┐
    │               │               │
    ▼               ▼               ▼
  Tarea 1         Tarea 2         Tarea 3
  (observaciones  (docs           (datos de uso
   anonimizadas)   aportados)     + correcciones)
```

**Ciclo cerrado y soberano:** la APP consume lo que el Laboratorio produce → la APP alimenta datos de uso y observaciones al Laboratorio → el Laboratorio mejora modelos con esos datos → modelos mejorados vuelven a la APP.

---

## 4. Plan de implementación gradual

### Criterio: primero lo que ya existe, luego lo que necesita desarrollo

No implementar todo juntos. El Laboratorio arranca con tareas que ya tienen base, y la APP muestra lo que está disponible. Servicios sin contenido aún no aparecen en la APP — se activan cuando la tarea correspondiente produce resultados.

### FASE 1 — Laboratorio arranca, APP muestra lo que existe (6-8 meses)

**Objetivo:** El Laboratorio se constituye como plataforma. La APP funciona con servicios básicos alimentados por procesos existentes (sin IA). Útil desde el día 1.

| Tarea Laboratorio | Estado en Fase 1 | Qué muestra la APP |
|------------------|-------------------|--------------------|
| Tarea 1 (Coyuntura) | ✅ Continúa formato manual → feed a APP | Informa: lectura procesada semanal |
| Tarea 2 (Archivo) | ⚠️ Arranca digitalización piloto (1-2 sindicatos) | Convenio searchable (texto) + Archivo básico |
| Tarea 3 (Modelos IA) | ⚠️ Preparación: alianza universitaria + primer dataset | Nada todavía (no hay modelos) |
| Tarea 4 (Historia) | ⚠️ Concepto — talleres formativos | No aparece en APP aún |
| Tarea 5 (Morfología) | ⚠️ Existe plan 6 meses | No aparece en APP aún |
| Tarea 6 (Periodismo) | 🔴 Pendiente | No aparece en APP aún |
| — (Contacto org.) | ✅ Datos sindicato piloto | Contacto: delegados + calendario |

**Qué se construye:**

- Laboratorio se constituye: espacio de codiseño, alianza universitaria, servidor soberano
- APP móvil (local-first, privacidad por diseño, interfaz modular)
- Proceso de codiseño con sindicato piloto → nombre + interfaz + prioridades
- Digitalización convenios del sindicato piloto
- Primer dataset etiquetado (corpus Coyuntura existente)

### FASE 2 — IA entra: Tarea 3 produce modelos que amplifican la APP (8-14 meses)

**Objetivo:** Los primeros modelos fine-tuned amplifican funciones de la APP. Convenio se vuelve vivo. Coyuntura se vuelve inteligencia.

| Tarea Laboratorio | Qué cambia | Qué cambia en APP |
|------------------|------------|-------------------|
| Tarea 3 (Modelos) | Primer modelo: clasificación conflictos + convenios | Convenio Vivo interactivo + Informa con clasificación automática |
| Tarea 1 (Coyuntura) | IA amplifica: clasificación + tendencias automáticas | Informa: inteligencia (no solo lectura) |
| Tarea 2 (Archivo) | Búsqueda semántica + fichas automáticas | Archivo: búsqueda mejorada |
| Tarea 4 (Historia) | Arranca con primer sector piloto | Historia: cronologías + búsqueda |
| Tarea 3 (Argumento) | Motor argumentativo básico | Argumento: escenarios comunes |

**Qué se construye:**

- Laboratorio produce primer modelo fine-tuned
- Convenio Vivo: preguntas en lenguaje natural
- Argumento básico: horas extra, cambio categoría, despido, paritaria
- Dataset crece con uso real (observaciones + correcciones de la APP)
- Codiseño se extiende a más sindicatos

### FASE 3 — Ecosistema completo: Morfología, panorama, internacional (14-24 meses)

**Objetivo:** Ciclo cerrado. Panorama internacional visible. Morfología estructura categorías. La APP es acceso a todo.

| Tarea Laboratorio | Qué cambia | Qué cambia en APP |
|------------------|------------|-------------------|
| Tarea 5 (Morfología) | Taxonomía soberana → estructura todo el etiquetado | Panorama: mapa del sector + comparación internacional |
| Tarea 6 (Periodismo) | Arranca con base de Coyuntura + Archivo | No en APP — amplifica externamente |
| Tarea 3 (Modelos) | Modelos más robustos + kit de arranque | Argumento completo + Panorama procesado |
| Tarea 2 (Archivo) | Red federada de centros de documentación | Archivo expandido + búsqueda federada |

**Qué se construye:**

- Morfología produce taxonomía → estructura categorías del ecosistema
- Panorama internacional (con red Tricontinental/TNI)
- Kit de arranque: replicabilidad para otros sindicatos
- Ciclo cerrado: uso → datos → modelos → uso mejorado

---

## 5. Primeros pasos concretos

### Paso 1: Constituir el Laboratorio (1-2 semanas)
- Definir equipo inicial: coordinación + dev + archivero + analistas
- Acuerdo básico de funcionamiento: codiseño, gobernanza, soberanía de datos
- Identificar sindicato piloto (archivo, analistas, disposición, convenio accesible)

### Paso 2: Codiseño con trabajadores del sindicato piloto (4-6 semanas)
- Talleres: qué necesita, cómo interactúa, qué nombre reconoce, qué prioriza
- Producto: especificación de MVP + nombre tentativo de la APP

### Paso 3: MVP de la APP — sin IA (3-4 meses)
- Desarrollar APP móvil (local-first, modular, privacidad)
- Servicios Fase 1: Informa + Contacto + Convenio (texto) + Archivo (básico)
- Alimentar con datos del sindicato piloto

### Paso 4: Alianza universitaria + primer dataset (paralelo, 2-4 meses)
- Acuerdo con UBA/UNLP/UNSAM para compute + investigación
- Etiquetar corpus de Coyuntura Obrera existente
- Primer fine-tuning: clasificación de conflictos

### Paso 5: Digitalización convenios (paralelo, 2-3 meses)
- Digitalizar CCTs del sindicato piloto
- Fichas de descripción con categorías laborales
- Structurar datos para Convenio Vivo

### Paso 6: Convenio Vivo interactivo (~mes 8-10)
- Fine-tuning sobre convenios digitalizados
- Integrar en APP: lenguaje natural → respuesta estructurada

### Paso 7: Motor argumentativo básico (~mes 10-14)
- Fine-tuning sobre convenios + jurisprudencia + coyuntura etiquetada
- Escenarios comunes: horas extra, categoría, despido, paritaria

---

## 6. Diseño técnico — principios Xiong

1. **Local-first:** convenio, luchas principales, modelo IA básico → en el teléfono. Funciona sin conexión para lo importante; sincroniza cuando hay conexión.
2. **Privacidad por diseño:** datos personales nunca se envían sin consentimiento. Observaciones se anonimizan. La APP no puede ser herramienta de identificación.
3. **Infraestructura soberana:** backend en servidor del Laboratorio, no AWS/Google Cloud. Modelos en servers propios o universitarios.
4. **Modelo IA local:** versión compacta (Phi-3, Gemma 2B) corre en teléfono para lo básico; funciones complejas consultan modelo grande en backend soberano. Offline para lo básico, online para lo avanzado.
5. **Interfaz diseñada con trabajadores:** modular y concreta. «¿Qué necesitás?» → opciones claras. Lenguaje del trabajador, no del abogado ni del ingeniero.
6. **Actualización controlada:** el trabajador decide frecuencia de sync. Alertas voluntarias, no push invasivo.

---

## 7. Lo que NO es — distinciones críticas

| NO es… | SÍ es… |
|--------|--------|
| Un chatbot legal genérico | Una herramienta posicionada del lado del trabajador |
| La app de un sindicato específico | Una plataforma del movimiento obrero que cada sindicato adapta |
| Un scraper de convenios que muestra PDFs | Un convenio vivo: interactivo, explicado, contextualizado |
| Una news app de "labor news" | Inteligencia laboral: lectura procesada con categorías del campo |
| Una app de startup que extrae datos de trabajadores | Soberana: datos privados quedan en el teléfono; lo compartido se anonimiza |
| Un chatbot "neutral" | Amplificación argumentativa desde la posición del trabajador |
| Un producto de Silicon Valley adaptado | Un producto del campo obrero, diseñado con input de trabajadores |
| Un Laboratorio como proyecto entre otros | Un Laboratorio como plataforma que define, coordina y produce todo |

---

## 8. Presupuesto y recursos (orientativo)

| Fase | Qué | Recursos | Estimación |
|------|-----|----------|------------|
| **1** | Laboratorio + APP MVP + digitalización piloto | 2 devs + 1 UX + analistas existentes + archivero | 6-8 meses |
| **2** | Modelos IA + Convenio Vivo + Argumento básico | Universidades (compute) + 1 ML engineer + dataset etiquetado | 8-14 meses |
| **3** | Morfología + Panorama internacional + red expandida | Coordinación Tricontinental/TNI + más sindicatos | 14-24 meses |

Infraestructura soberana: servidor propio/universitario. ~$200-500/mes con GPU básica. Modelos large en compute universitario.

---

## 9. Resumen visual

```
LABORATORIO (plataforma central)
│
├── Tarea 1: Coyuntura Obrera ────→ APP · Informa
├── Tarea 2: Archivo / Centro Doc ─→ APP · Convenio Vivo + Archivo
├── Tarea 3: Modelos IA ──────────→ APP · Argumento + amplifica Tareas 1,2,4
├── Tarea 4: Historia Obrera ─────→ APP · Historia
├── Tarea 5: Morfología ──────────→ APP · Panorama + estructura categorías
├── Tarea 6: Periodismo Laboral ──→ amplificación externa
│
└── APP (nombre TBD) ── interfaz del trabajador
    ├── Informa    ←── Tarea 1
    ├── Convenio   ←── Tarea 2 + Tarea 3
    ├── Archivo    ←── Tarea 2
    ├── Historia   ←── Tarea 4
    ├── Argumento  ←── Tarea 3 + 1 + 2
    ├── Panorama   ←── Tarea 5 + 1
    └── Contacto   ←── datos sindicato

FASE 1: Laboratorio se constituye · APP muestra lo que existe (sin IA)
FASE 2: Tarea 3 produce modelos · APP amplifica (Convenio Vivo, Argumento)
FASE 3: Morfología + Panorama · Ciclo cerrado · Kit de arranque

Laboratorio define todo · APP muestra todo · Implementación gradual
```
