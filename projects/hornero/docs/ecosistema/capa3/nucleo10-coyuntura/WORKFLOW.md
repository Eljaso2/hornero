# Workflow operativo — Núcleo 10 Coyuntura laboral

## Ritmo semanal

- **Lunes a viernes:** Monitorizar fuentes continuamente
- **Viernes/sábado:** Compilar noticias principales
- **Domingo/lunes:** Publicar clipping semanal
- **Lunes:** Archivar y comenzar nueva semana

## Fuentes

👉 **Lista completa:** [SOURCES_CATALOG.md](clipping/SOURCES_CATALOG.md)

Prioridades:
- **Diario:** InfoGremiales, Infoydata, dirigentes sindicales en X/Twitter
- **Mensual (inicio de mes):** InfoMATE (mateconomia.com.ar) — nuevo informe de coyuntura económica-laboral con datos macro procesados visualmente; PDF descargable; insumo para sección "Datos económicos" del clipping
- **Compilación semanal:** Página/12, La Izquierda Diario, Tiempo Argentino, Infobae, La Capital, Ámbito, Clarín, La Nación
- **Irregular (watch):** MATE Documentos de trabajo + Entrevistas + Notas de opinión — cuando publican nuevo contenido; routing: datos macro → clipping "Datos económicos", análisis sectoriales VCE → N11, entrevistas → N6 IS
- **Medios comerciales — framing VC:** Clarín, La Nación, Infobae, La Capital, Ámbito — track framing anti-sindical, voz empresaria como "sentido común"
- **Sindicatos/web directa (diario):** SIPREBA (sipreba.org.ar + @SiPreBA), SATSAID (satsaid.org.ar + @SATSAIDok), SOEA (@SOEA_Aceiteros + Facebook), Somos los Medios (@somosmediosCABA), Sitrarepa (sitrarepa.org.ar + @BDambrosioSitra), Sitios Sindicales (agregador ~50 gremios)
- **Prensa provincial (semanal):** El Litoral (Santa Fe — ellitoral.com), La Capital (Rosario)
- **Historia Obrera — Efemérides (por clipping):** API REST `historiaobrera.com.ar/wp-json/wp/v2/ajde_events?per_page=50` → filtrar por mes/día → seleccionar 1-2 efemérides, agregar sección con conexión a noticias actuales + recomendación bibliográfica
- **Según necesidad:** CLATE/OIT (internacional), Business-HumanRights.org (VCE global), CGT/CTA official, Ministerio de Trabajo, INDEC, MATE (mateconomia.com.ar — InfoMATE, documentos de trabajo, entrevistas)

---

## Sección 1: Clipping semanal

### Categorías de contenido

**Violencia Directa (VD)** *(dimensión material — acciones antisindicales concretas)*
- Despidos antisindicales: represalia ante reclamo salarial, persecución de delegados
- Lock out patronal
- Persecución judicial a trabajadores
- Uso de guardias/seguridad privada para bloquear ingreso
- Uso de rompehuelgas
- Bloqueo de inspecciones laborales
- Amenaza de despidos como coerción
- Monopolio/concentración para fijar condiciones más bajas

**Violencia Cultural (VC)** *(dimensión discursiva/simbólica — narrativas que naturalizan)
- Empresarios/cámaras que intentan fracturar organización sindical desde afuera
- Llamados públicos a "rebelarse contra el gremio" (ej: CIARA-CEC a aceiteros, Infobae 23/6/2026)
- Discursos que individualizan el conflicto ("cada trabajador pierde X por día de paro")
- Manipulación de datos salariales para presentar a empresas como "generosas"
- Presión mediática sobre trabajadores para aceptar ofertas patronales
- Paternalismo empresarial: "estamos dispuestos a firmar hoy mismo"
- Articulación de beneficios empresarios (retención reducida) con reclamos salariales
- **Deslegitimación mediática del sindicalismo**: cuestionan ingresos sindicales ("peajes sindicales") mientras silencian ganancias empresarias, evasión fiscal, beneficios extraordinarios
- **Asimetría discursiva**: se exige transparencia sindical pero no se cuestiona opacidad empresaria

**Violaciones a Derechos Humanos por Empresas** *(BHR dimension — routing a N11)*
- Todo evento VCE que constituya violación a DDHH se etiqueta con espectro BHR (5 niveles) y se routea como fuente a N11
- Espectro BHR: `BHR-1` (RSE/fachada) → `BHR-2` (UNGP violation) → `BHR-3` (complicidad en violaciones) → `BHR-4` (complicidad en crímenes intl.) → `BHR-5` (crímenes econ. contra la humanidad)
- Formato: `CE-[dim]-[subtipo] | VDH-[sí/no/parcial]-[tratado] | BHR-[nivel]-[descriptor]`
- **Routing:** cada noticia etiquetada VDH+BHR → N11 Comportamiento Empresarial
- → Tipología completa: `../nucleo11-comportamiento-empresarial/nucleo11-comportamiento-empresarial-tipologia.md`
- → Librería BHR: `../../../empresas-violencia-justicia/sources/LIBRERIA-BHR-violencia.md`

**Conflictos laborales y medidas de fuerza**
- Paros, marchas, cortes, asambleas
- Convocatorias sindicales
- Planes de lucha

**Negociaciones salariales y paritarias**
- Acuerdos salariales
- Convenios colectivos
- Actualizaciones de costo de vida

**Política laboral y legislación**
- Anuncios del Ministerio de Trabajo / Capital Humano
- Reforma laboral: impacto, resistencia, judicialización
- Cambios regulatorios

**Datos económicos**
- Inflación (INDEC)
- Empleo, salarios, costos

**Internacional y regional**
- Movimientos obreros latinoamericanos
- OIT, CLATE, denuncias en Ginebra
- Tendencias globales

### Criterios editoriales

- **Precisión:** Verificar con múltiples fuentes los temas principales
- **Actualidad:** Últimos 7 días
- **Diversidad:** Incluir distintas perspectivas ideológicas
- **Atribución:** Link a fuente original siempre
- **Neutralidad analítica:** Presentar hechos; señalar análisis aparte

---

## Sección 2: Reporte Gremial

### Cómo se genera

El Reporte Gremial se genera desde el **botón Reporte Gremial** de la App (5b). Esa función activa cadenas de comunicación intrasindical — los trabajadores y dirigentes comparten información dentro de su organización.

### Grados y publicación

| Grado | Nivel | Se publica | Dónde se guarda |
|-------|-------|------------|-----------------|
| Input | Carga del usuario | Cada vez que un usuario carga datos via botón | **N6 (IS)** — archive por usuario, sector, organización |
| 3 | Sindicato | Cuando un directivo acepta publicar el informe | **N10 Coyuntura** → `reporte-gremial/` |
| 4 | Federación / Unión | Cuando un directivo acepta publicar el informe | **N10 Coyuntura** → `reporte-gremial/` |
| 5 | Nacional | Automático cuando hay 2+ reportes Grado 4 | **N10 Coyuntura** → `reporte-gremial/` |

### Workflow

1. **Carga** — trabajador/dirigente usa botón Reporte Gremial en la App → datos se archivan en **N6 (IS)** por usuario, sector, organización
2. **Procesamiento** — IS (N6) consolida la cadena de información intrasindical
3. **Grado 3** — sindicato: directivo acepta publicar → informe se guarda en **N10 Coyuntura** como publicado → "Reporte Gremial + [Sindicato]"
4. **Grado 4** — federación/unión: directivo acepta publicar → informe se guarda en **N10 Coyuntura** como publicado → "Reporte Gremial + [Federación]"
5. **Grado 5** — nacional: cuando 2+ reportes Grado 4 → se genera automáticamente → se guarda en **N10 Coyuntura** como publicado → "Reporte Gremial + Nacional"
6. **Notificación** — la App avisa al trabajador según su organización

### Contenido por grado

**Grado 3 (Sindicato):** situación del sindicato, conflictos activos, comunicación interna, articulación con federación

**Grado 4 (Federación/Unión):** panorama sectorial, conflictos articulados, sindicatos con reportes activos, posición frente a políticas nacionales

**Grado 5 (Nacional):** panorama del país, conflictos nacionales, articulación entre sectores, tendencias emergentes (IS N6)

---

## Herramientas

- Monitoreo: RSS + checks manuales + web fetch directa (sindicatos webs) + API REST Historia Obrera
- Web fetch sindicatos: SIPREBA, SATSAID, SOEA (Facebook público), Somos los Medios, Sitrarepa, Sitios Sindicales — comunicados directos sin intermediación editorial
- Efemérides: `curl 'https://historiaobrera.com.ar/wp-json/wp/v2/ajde_events?per_page=50'` → filtrar slug/title por mes → seleccionar 1-2 relevantes → fetch full content de cada evento → conexión con clipping actual
- Publicación: App Hornero (notificaciones voluntarias)
