# Hornero — Informes de coyuntura económica (datos → resumen claro)

> Diseño de cómo Hornero produce la **coyuntura económica** (InfoMate / "Mirador"): **datos duros** + un **resumen claro para el afiliado**. Se cruza con SMVM (C1), Cómo Somos (C2) y el clipping.
> Punto clave: la coyuntura **no es RAG textual** — son **datos** que hay que estructurar y **traducir a lenguaje llano**.

---

## 1. El problema en dos partes
1. **Los datos** — la coyuntura requiere series/indicadores confiables (no textos sueltos).
2. **El resumen** — el afiliado no lee un informe economicista; necesita **"qué pasó este mes con tu bolsillo"** en lenguaje claro, con perspectiva de clase.

Por eso son **dos subsistemas**: un **almacén de datos** (estructurado) + un **motor de resumen** (comunicación).

## 2. Indicadores (qué medir, pensado para trabajadores)
| Indicador | Por qué le importa al afiliado | Fuente |
|---|---|---|
| **Inflación real vs. oficial** | Cuánto perdió su plata de verdad | Mate / CIFRA vs. INDEC |
| **Salario real** (poder de compra) | Si el sueldo alcanza más o menos que antes | INDEC / Min. Trabajo / Mate |
| **Canasta básica** | Cuánto cuesta vivir hoy | INDEC / CIFRA |
| **SMVM: mínimo legal vs. valor constitucional** | La brecha = súper-explotación | Consejo del Salario / art. 116 LCT / Mate |
| **Empleo / despidos** | El clima de amenaza al laburo | Min. Trabajo / prensa |
| **Distribución del ingreso** | Quién se queda con qué (categorías Iñigo Carrera) | PIMSA / CIFRA |

**[DECISIÓN]** con el equipo/comité: el set exacto y las fuentes de referencia (ojo: la doc del sistema marca que **WDI/oficiales no son "la" referencia** — definir la fuente correcta por indicador).

## 3. El almacén de datos (estructurado, no vector store)
- Tabla(s) de **series temporales**: `{indicador, fecha, valor, fuente, tenant_id}`.
- Se **carga periódicamente** (mensual) — parte manual (planilla del analista) + parte automatizable (APIs de INDEC/BCRA donde existan).
- Sobre estas series se **precomputan** los índices/derivados (salario real, brecha SMVM, etc.) que consumen SMVM (C1) y Cómo Somos (C2).
- ⚠️ **No mezclar estas series con la biblioteca textual (RAG)** — recuperación distinta. Ver `PLAN-BIBLIOTECA-RAG.md` §6.

## 4. El motor de resumen (el "InfoMate" claro)
**Estructura del resumen para el afiliado** (plantilla fija, corta):
1. **Titular** — una frase con el dato del mes (ej. *"Tu salario perdió otro 4% contra la inflación real"*).
2. **3-5 puntos** en lenguaje llano (cada uno = un indicador + qué significa para el bolsillo).
3. **Un dato-ancla** destacado (ej. la brecha SMVM legal vs. constitucional).
4. **Fuente y fecha** siempre visibles.
5. *(Opcional)* **conexión con la acción**: qué implica para la paritaria / el reclamo.

**Flujo de producción (humano en el centro, como el Periodista):**
```
Datos del mes (planilla + APIs)
      │
      ▼
Borrador automático del resumen  (el modelo redacta desde los datos, con la plantilla §4)
      │
      ▼
Edición del analista/investigador  (ajusta números, tono, perspectiva de clase)
      │
      ▼
Aprobación → Publicación en InfoMate  (mensual)
```
La IA **propone** el borrador desde los datos; el analista **decide y aprueba**. Nada sale sin revisión (mismo principio que "la IA propone, el sindicato decide").

## 5. Handoff — qué entrega el analista cada mes (delegable)
Igual que la biblioteca de historia se delega al historiador, la coyuntura se delega al **analista económico** (interno o vía **Mate**). Cada mes entrega:
1. **Planilla de datos** del mes: `indicador, fecha, valor, fuente` (las filas de §2).
2. **(Opcional) notas** de contexto (qué explica los movimientos).
Con eso, el motor arma el borrador del resumen y el analista lo edita/aprueba.

**Mini-brief para el analista:**
- Cargá los indicadores de §2 con su fuente y fecha.
- Priorizá **fuentes de clase** (Mate/CIFRA/PIMSA) sobre las oficiales cuando difieran, y **marcá la diferencia** (es un dato político, no un error).
- Pensá el titular desde **el bolsillo del trabajador**, no desde la macro.

## 5.5 ⚙️ Automatización (scraping / APIs)
- **Series oficiales** (INDEC, BCRA, Min. Trabajo): se **bajan por API/scraping** automáticamente (IPC, EPH, salarios, empleo) → el analista **no las tipea**.
- **Fuentes de clase** (Mate/CIFRA/PIMSA): parte se scrapea de sus publicaciones; parte la aporta el analista (sus propias series/estimaciones).
- **El humano aporta**: la **selección**, la **lectura de clase** y el **contexto** (por qué se movió lo que se movió) — más el resumen claro.
- Se cruza con el **clipping automatizado** (recolección de noticias, N10), que también es scraping.

## 6. Cómo se ve para el usuario
- En la app: **InfoMate** (ya existe la pantalla) muestra el resumen del mes + los datos macro.
- Alimenta también el **comparador SMVM** ("compará tu salario") y **Cómo Somos** (tableros de clase).

## 7. Próximos pasos
1. **[DECISIÓN]** set de indicadores + fuentes de referencia (con el comité).
2. Definir el **esquema de la tabla de series** (se cruza con A2/Postgres).
3. Diseñar la **plantilla del resumen** (§4) y el prompt del borrador.
4. Acordar el **handoff mensual** con el analista/Mate (planilla).
5. Prototipar con **1 mes real** de datos → borrador → edición → publicación.

## 8. Dependencias / riesgos
- **Depende de:** A2 (tabla de series) y del acuerdo de fuentes (§2).
- **Riesgo:** datos poco confiables o inconsistentes → definir la fuente correcta por indicador (la doc marca desconfianza de las oficiales).
- **Riesgo:** resumen economicista → la plantilla §4 obliga al lenguaje llano.
