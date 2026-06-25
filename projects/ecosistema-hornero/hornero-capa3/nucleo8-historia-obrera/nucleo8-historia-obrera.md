# Hornero — Núcleo 5: Historia Obrera

> Entretenimiento, historia y formación. Articulación con historiaobrera.com.ar — proyecto cultural y educativo existente, con más de 15 historiadores doctorados que aportan sus investigaciones. HO produce el contenido; la IA del Laboratorio lo amplifica.

---

## Función

Núcleo 5 no es "ChatGPT te resumen la huelga de 1975". Es **contenido de entretenimiento y formación** sobre historia del movimiento obrero, amplificado por las herramientas IA del Laboratorio.

### Qué produce HO (ya existe)

- **Efemérides:** Cordobazo, Viborazo, Tampierazo, Santiagueñazo, Argentinazo — textos, recursos, bibliografía.
- **Mitín:** artículos para leer y escuchar sobre temas como masculinidades de clase, mujeres trabajadores.
- **Retazos:** artefacto cultural multimedia — docuficción, ilustraciones, cápsula del tiempo, libro + disco.
- **APUntes Radiales:** podcasts en Spotify, YouTube, iTunes.
- **Colección La Argentina Peronista:** 18 números publicados sobre política, sindicalismo y cultura peronista.
- **Tejiendo Redes:** arte, historia y clase obrera.

### Qué agrega Hornero (capa IA del Laboratorio)

- **Asistente de investigación en archivos laborales:** sobre corpus de documentos sindicales digitalizados (Núcleo 4), permite buscar por categorías históricas laborales ("comisión interna", "delegado", "paritaria", "convenio colectivo", "intervención sindical", "pluralidad sindical"). El modelo fine-tunea para entender que "intervención sindical" no es "intervención médica".
- **Motor de transcripción y anotación:** transcribe documentos históricos (manuscritos, imprentas antiguas, fotografías de actas) y los anota con metadata histórica. El historiador supervisa y corrige.
- **Constructor de narrativas guiado:** dado un conjunto de fuentes seleccionadas por el historiador, propone esquemas narrativos (cronológicos, temáticos, escalares) que pueden alimentar los productos de HO (efemérides, Retazos, APUntes Radiales). La IA propone caminos; no camina.

---

## Articulación HO ↔ Ecosistema

- **HO produce** contenido formativo y de entretenimiento — efemérides, podcasts, docuficción, libros, artículos.
- **Hornero amplifica** ese trabajo — más fuentes encontradas, más documentos transcritos, más conexiones detectadas, más narrativas posibles.
- **Los historiadores de HO definen** las categorías, supervisan los resultados, curan el corpus de entrenamiento. El campo histórico decide; la IA ejecuta.
- **Los productos de HO siguen siendo de HO.** La IA es infraestructura interna, no un producto separado.

---

## Repositorio y documentación

> Qué datos trabaja este núcleo. Todos los núcleos consumen la librería base (N2) — taxonomía, pipeline, stack, formatos de salida, categorías morfológicas, reglas de protección. Lo específico de cada núcleo va aquí.

- **Repositorio:** historiaobrera.com.ar (efemérides, Mitín, Retazos, APUntes Radiales, Colección La Argentina Peronista, Tejiendo Redes) — proyecto cultural y educativo existente con más de 15 historiadores doctorados. Documentos históricos sindicales, archivos laborales digitalizados (N7/Nuestro Derecho).
- **Corpus:** Corpus historiográfico laboral — comunicados históricos, actas de asambleas históricas, periódicos obreros, memorias sindicales, colección La Argentina Peronista (18 números).
- **Fuente primaria:** Documentos históricos (manuscritos, imprentas antiguas, fotografías de actas) + contenido HO existente (artículos, podcasts, docuficción, efemérides). Historiador supervisa transcripción y anotación.
- **Corpus de fine-tuning (N2):** Corpus de documentos sindicales digitalizados, etiquetado con categorías históricas laborales ("comisión interna", "delegado", "paritaria", "intervención sindical") — fine-tuned para entender que "intervención sindical" no es "intervención médica".

---

## Conexión con otros núcleos

- **Núcleo 1 (Laboratorio):** el clasificador, transcriptor y constructor de narrativas son productos del Laboratorio, fine-tuned sobre corpus de HO.
- **Núcleo 3 (IS):** las etiquetas "Formación y memoria" (Familia 6) y "Historia" (en narrativas de trabajadores) se conectan con HO.
- **Núcleo 7 (Nuestro Derecho):** los documentos históricos se almacenan en N7 y HO los cura.
- **Núcleo 6 (Morfología):** las categorías históricas de HO alimentan Morfología — la historia de la clase trabajadora da contexto a la foto presente.
- **Núcleo 9 (App):** 9c (Historia Obrera) accede al material de HO. 9g (Argumento) usa historia para argumentar.
