# Guía para curar la Biblioteca de Derecho Laboral de Hornero

> **Para el compañero abogado laboralista.** Documento autocontenido: con esto armás la biblioteca jurídica curada que alimenta al asistente. El equipo la ingesta después.

---

## 1. Qué estamos haciendo y para qué
Hornero tiene un asistente, **"El Abogado"**, y una sección **"Nuestro Derecho"**. Deben responder **con el artículo, la vigencia y la fuente citada — nunca inventando**, y **desde la posición del trabajador** (no "neutral", no "los dos lados"). Para eso necesitan una **biblioteca jurídica curada**.

Hoy el sistema casi no tiene derecho cargado (ni el convenio completo). Tu tarea es **elegir, fichar y marcar vigencia** del material jurídico.

## 2. La estructura: DOS capas (importante)
La biblioteca legal se organiza en dos niveles:

### 🟦 Capa GENERAL — derecho del trabajo en Argentina (común a todos los gremios)
- **Constitución** — art. 14 bis (derechos del trabajo y la seguridad social).
- **LCT 20.744** (Ley de Contrato de Trabajo) — completa, por artículos.
- **Leyes clave**: jornada (11.544), riesgos del trabajo/ART, asociaciones sindicales (23.551), convenciones colectivas (14.250), etc.
- **Reformas recientes**: DNU, Ley Bases, decretos de flexibilización — **con su estado** (qué está vigente, qué fue frenado, qué modificó a qué).
- **Jurisprudencia general** (fallos y plenarios de referencia).

### 🟩 Capa SECTORIAL — según la rama del sindicato (propia de cada uno)
- **El CCT de la rama** (ej. **CCT 420/05** para aceiteros) — completo, por artículos.
- **Paritarias** vigentes (escalas, acuerdos).
- **Resoluciones/normas sectoriales** y **jurisprudencia del sector**.

> **Por qué importa:** la capa general se **comparte** entre todos los sindicatos; la sectorial es **de cada gremio**. Lo que armes de la 420/05 es el modelo para la parte sectorial; la parte general sirve para todos.

## 3. Cómo organizar (igual que siempre: carpeta + planilla)
1. **Carpeta** con los archivos (PDFs/textos), separados en `general/` y `sectorial/`, con nombres claros (`LCT_completa.pdf`, `CCT_420-05.pdf`, `DNU_70-2023.pdf`).
2. **Planilla maestra**: una fila por norma/pieza, con las columnas de §4. Marcá en la columna `capa` si es `general` o `sectorial`.

## 4. La ficha de cada pieza (columnas de la planilla)
| Columna | Qué poner | Ejemplo |
|---|---|---|
| **capa** | `general` o `sectorial` | general |
| **titulo** | Nombre de la norma/fallo | Ley de Contrato de Trabajo |
| **tipo** | constitucion · ley · decreto · dnu · cct · paritaria · jurisprudencia · dictamen · resolucion | ley |
| **norma** | Número/identificador | 20.744 |
| **articulo** | Artículo(s) si aplica | art. 116 |
| **jerarquia** | constitución · tratado · ley · decreto · cct · resolución | ley |
| **ambito** | general · sectorial · empresa | general |
| **materia_etiquetas** | Materias (ver §5), separadas por coma | salario, smvm, jornada |
| **vigencia** | `vigente` · `derogado` · `modificado` · `suspendido` (+ fecha) | vigente |
| **modificado_por** *(si aplica)* | Qué norma lo cambió | DNU 70/2023 |
| **resumen** | 2-3 líneas en lenguaje llano: qué dice y a quién protege | Fija que el salario mínimo debe cubrir las 9 necesidades del trabajador… |
| **cita_clave** *(opcional)* | Texto del artículo clave | "El SMVM es la menor remuneración que…" |
| **derecho_que_protege** | Qué le garantiza al trabajador | Un salario que cubra la reproducción de la vida |
| **fuente_oficial** | Boletín Oficial / InfoLeg / SAIJ | InfoLeg |
| **archivo** | Nombre del archivo | LCT_completa.pdf |

## 5. Etiquetas (materias) — set inicial (ampliá lo que falte)
`jornada` · `horas_extra` · `licencias` · `salario` · `smvm` · `despido` · `indemnizacion` · `art_salud_seguridad` · `discriminacion_acoso` · `negociacion_colectiva` · `paritaria` · `huelga_conflicto` · `libertad_sindical` · `reforma_laboral` · `tercerizacion` · `registracion_trabajo_no_registrado`

## 6. Reglas de oro (jurídicas)
- **Vigencia al día** — es lo más importante. Marcá claramente lo **derogado/modificado/suspendido** (con las reformas recientes esto es crítico: un artículo viejo mal citado es un error grave).
- **Por artículos** — para leyes y convenios, entregalos de forma que se **preserve el articulado** (que "Art. 245" sea una unidad). Si podés, un archivo/planilla con el texto por artículo ayuda muchísimo a la carga.
- **Fuente oficial siempre** (Boletín Oficial / InfoLeg / SAIJ).
- **Desde la posición del trabajador** — el sistema no da "consejo neutral": **busca y cita** el derecho a favor del trabajador. El resumen puede explicar cómo se usa a favor.
- **No inventar** — si un punto es dudoso o hay jurisprudencia contradictoria, marcalo en la ficha.

## 6.5 ⚙️ Lo que NO tenés que tipear (el equipo lo scrapea)
El **texto** de las normas se junta automáticamente de fuentes oficiales: **InfoLeg, SAIJ, Boletín Oficial** (leyes, decretos, DNUs, jurisprudencia) y **Ministerio de Trabajo** (CCTs y paritarias). Así que **no copies el articulado a mano**.

**Tu trabajo (lo que la máquina no puede hacer):**
- **Decir CUÁLES** normas entran (tu criterio jurídico).
- **Marcar la VIGENCIA** — lo más importante: qué sigue en pie, qué derogó/modificó una reforma. El scraping trae el texto; **vos decidís si aplica hoy**.
- Poner el **resumen en lenguaje llano** y **la posición del trabajador**.

En la planilla, para el material scrapeable, puede alcanzar con indicar la **norma + fuente + vigencia + etiquetas** (el texto lo trae el equipo). Cargá a mano solo lo que no esté en las fuentes oficiales.

## 7. Cómo entregarlo
- La **carpeta** (`general/` + `sectorial/`) + la **planilla maestra** (CSV/Excel).
- El equipo lo **ingesta** con corte por artículo + índice, y El Abogado / Nuestro Derecho responden con **artículo + vigencia + fuente**.

## 8. Escala (multi-sindicato)
- La **capa general** se carga una vez y **la usan todos los sindicatos**.
- La **capa sectorial** la arma **cada gremio** (su CCT, su jurisprudencia). Lo que hagas para aceiteros es el molde; el método se repite por rama.

---
*Dudas de alcance o de cómo tratar una reforma en curso: hablémoslas. Tu criterio jurídico —y la posición de clase— son lo que hace la biblioteca.*
