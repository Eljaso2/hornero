# Hornero — Núcleo 14: Acción Sindical

> Volantes, comunicados, discursos de líderes, resoluciones de asambleas y congresos, presentaciones judiciales, notas de paritaria. Lo que el sindicato **produce y decide** — la voz del campo obrero. No lo que protege (Nuestro Derecho, N7), sino lo que hace.

---

## Función

**Acción Sindical** es la sección donde se organiza y presenta lo que el sindicato produce como actor: sus volantes, comunicados, discursos de líderes, resoluciones de asambleas y congresos, presentaciones judiciales, notas de paritaria.

### Qué contiene

1. **Volantes y comunicados** — comunicados sindicales, flyers de campaña, notas de paritaria. La comunicación que el sindicato produce para movilizar, informar, posicionar.
2. **Discursos de líderes** — audio original + resumen IA. Con timestamp para citar minuto exacto. El discurso como dato, no como entretenimiento.
3. **Resoluciones de asambleas y congresos** — decisiones de asamblea, mandatos de base, posiciones votadas, resoluciones de congresos. La democracia sindical documentada.
4. **Presentaciones judiciales** — cautelares, amparos, denuncias, notas legales. El sindicato actuando en la justicia.
5. **Notas de paritaria** — presentaciones, propuestas, contrapropuestas. La negociación colectiva en documento.

### Barra de conflictos abiertos

La sección tiene una **barra superior** que muestra en tiempo real cuántos sectores están en conflicto abierto en el país, con nombre de sector y tipo de conflicto/empresa. Se actualiza con la información que se carga en la APP via Reportes Gremiales (IS, N6).

El registro de conflictos funciona como un **log de apertura y cierre**:
- **Se abre:** cuando un Reporte Gremial identifica un nuevo conflicto (paritaria sin cierre, lockout, despidos, etc.) → se registra con fecha de apertura, sector, tipo, empresa
- **Se cierra:** cuando el sector resuelve (paritaria cerrada, despidos revertidos, lockout levantado) → se registra fecha de cierre y resultado
- **Se archiva:** los conflictos cerrados quedan en el historial, accesibles para análisis de Coyuntura (N10) y Historia Obrera (N8)

La barra no es un resumen pasivo — es un **dispositivo de inteligencia colectiva** que permite ver en un instante qué está pasando en el país.

---

## Distinción con otros núcleos

- **Nuestro Derecho (N7)** = lo que **protege** — leyes, convenios, fallos. El marco normativo.
- **Acción Sindical (N14)** = lo que el sindicato **hace** — volantes, comunicados, discursos, resoluciones, presentaciones. La voz y la acción.
- **IS (N6)** = los **datos** — observaciones, informes, inteligencia. Lo que se detecta.
- **Coyuntura (N10)** = el **contexto** — clipping, informes gremiales grado 4/5. Lo que se procesa.
- **CE (N11)** = lo que la empresa **hace** — balances, comportamiento. Lo que se analiza.

La separación es conceptual: Nuestro Derecho custodia la **posición jurídica**; Acción Sindical custodia la **posición política y organizativa**.

---

## Conexión con otros núcleos

- **N6 (IS):** los conflictos se abren/cierran con datos de Reportes Gremiales. La barra de conflictos se actualiza en tiempo real con IS.
- **N7 (Nuestro Derecho):** las leyes y convenios se buscan en N7. Las resoluciones de asamblea y volantes se buscan en N14.
- **N10 (Coyuntura):** clipping y informes grado 4/5 se publican en Coyuntura. Los volantes y comunicados se archivan en N14.
- **N11 (CE):** si una presentación judicial se vincula con VE, se etiqueta y alimenta CE.
- **N8 (HO):** los discursos y volantes históricos se articulan con HO.
- **N9 (Cómo Somos):** los conflictos por sector alimentan datos de composición de clase.
- **N5 (App):** 5q (Acción Sindical) presenta los outputs. 5g (Argumento) usa volantes y comunicados como arsenal argumentativo.

---

## Repositorio

- **Repositorio:** volantes, comunicados, discursos de líderes (audio + resumen IA), resoluciones de asambleas y congresos, presentaciones judiciales, notas de paritaria. La voz del sindicato.
- **Corpus:** documentos de acción sindical etiquetados con categorías del ecosistema (sector, tipo de acción, forma de lucha, conflicto abierto/cerrado, actor sindical).
- **Fuente primaria:** lo que el sindicato produce — comunicado, volante, discurso, resolución, presentación. Se carga via App (Reporte Gremial, 5b) o se archiva en N7/N14.
- **Registro de conflictos:** log de apertura/cierre alimentado por IS (N6). Cada conflicto: sector, tipo, empresa, fecha apertura, fecha cierre, resultado.

---

## Próximos pasos

- Diseñar interfaz de barra de conflictos: visualización en tiempo real.
- Definir protocolo de apertura/cierre de conflictos: qué grado de IS abre, quién cierra.
- Integrar registro de conflictos con IS (N6) y Coyuntura (N10).
- Cargar primer set de volantes/comunicados piloto (Federación Aceitera).
