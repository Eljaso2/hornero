# Hornero — Núcleo 15: Tu historia

> Principio: los historiadores deben dejar de trabajar tanto con el pasado y empezar a trabajar con el futuro. El testimonio no se archiva como "algo que pasó" sino como dato para entender qué está pasando ahora y qué puede pasar.

---

## Función

Sección donde el trabajador entra en diálogo semiestructurado con la app. No es un formulario ni un chatbot genérico: es una entrevista guiada que permite contar su historia laboral. El sistema:

1. **Propone preguntas** siguiendo una pauta metodológica (no preguntas cerradas sino abiertas que invitan a narrar)
2. **Etiqueta automáticamente** lo que el usuario cuenta (sector, tipo de experiencia, período, categoría laboral, forma de lucha, tipo de violencia si existe)
3. **Ordena en archivo etiquetado** — cada testimonio queda clasificado y searchable
4. **Construye narrativas cualitativas** — a partir de múltiples testimonios del mismo sector/empresa/región, el sistema propone síntesis que el historiador/investigador supervisa

---

## Pauta metodológica: "Historiadores del futuro"

El testimonio no se archiva como "algo que pasó" sino como **dato para entender qué está pasando ahora y qué puede pasar**. Esto significa:

- La categorización no es retrospectiva ("en 1995 hubo una huelga") sino **prospectiva** ("estos testimonios indican que el sector está cambiando hacia X")
- La síntesis no es historiografía tradicional sino **inteligencia cualitativa** — el hornero que cuenta su historia está aportando a la comprensión colectiva de donde va el movimiento
- Cada testimonio es un dato del presente que ilumina el futuro — no un dato del pasado que ilumina el pasado

---

## ¿Qué IA se crea aquí?

### Motor de entrevista semiestructurada

Propone preguntas abiertas que siguen pautas metodológicas de historia oral y investigación cualitativa. No es un cuestionario fijo: adapta el flujo según lo que el usuario ya contó. Las preguntas emergen de la tradición historiográfica (HO, Núcleo 5) y de las categorías del campo obrero del sector (Núcleo 9/Cómo Somos).

Ejemplos de preguntas adaptativas:
- Entrada general: "¿Cómo entraste al sector?"
- Si menciona un cambio: "¿Qué cambió exactamente? ¿Fue gradual o fue de golpe?"
- Si menciona conflicto: "¿Cómo se organizó? ¿Qué pasó después?"
- Si menciona violencia: "¿Cómo te afectó eso en el día a día?"
- Si menciona organización: "¿Qué papel jugó el sindicato en ese momento?"

### Etiquetador automático de testimonios

Clasifica lo narrado con categorías del ecosistema (Núcleos 6 y 8), no categorías genéricas:
- **Sector:** aceitero, metalúrgico, camionero, etc. (categorías del convenio, no "industry")
- **Tipo de experiencia:** entrada al sector, cambio de condiciones, conflicto, organización, violencia, paritaria, cotidianidad
- **Período:** década, año, evento específico
- **Forma de lucha:** huelga, paritaria, asamblea, campaña, comisión interna
- **Violencia empresarial detectada:** uno de los 6 tipos VE (física directa, económica, laboral/estructural, psicológica, jurídica, por omisión)
- **Categoría laboral:** del convenio, no genérica

### Constructor de narrativas cualitativas

A partir de testimonios etiquetados del mismo sector/región, propone síntesis que identifican:
- **Patrones:** experiencias repetidas entre trabajadores del mismo sector
- **Tendencias emergentes:** lo que los testimonios indican sobre el futuro del sector
- **Conexiones:** cómo una experiencia individual se conecta con colectivas
- **Futuros posibles:** lo que los testimonios sugieren que puede pasar

El investigador supervisa y corrige — la IA propone, el campo decide.

---

## Expresión en la App — subsección 9o: Tu historia

- **"Tu historia cuenta"** — entrada: el trabajador elige compartir su experiencia (completamente voluntario)
- **Diálogo guiado** — la app propone preguntas abiertas. El usuario narra libremente; la IA propone nuevas preguntas basándose en lo que ya contó
- **Mi archivo** — el trabajador ve su testimonio organizado, etiquetado, y puede editar/agregar. Es su historia — la controla
- **Historias del sector** — síntesis cualitativas de testimonios del mismo sector (anonimizadas si los testimoniantes no autorizan identificación). El trabajador ve cómo su experiencia se conecta con la de otros
- **Tendencias emergentes** — lo que los testimonios indican sobre el presente y el futuro del sector — no retrospectiva sino prospectiva
- **Decisión de publicación** — el testimoniant decide: privado (solo yo lo veo), compartido con investigadores (anonimizado), o público (mi nombre aparece en una historia colectiva). El sistema nunca publica sin consentimiento explícito

---

## Soberanía

- Testimonios **encriptados y con niveles de visibilidad definidos por el testimoniant**
- La IA etiqueta con categorías del ecosistema, no categorías externas
- Las narrativas cualitativas son **propuestas** — el investigador supervisa y aprueba
- Datos de testimonio alimentan IS (Núcleo 6) y Nuestro Derecho (Núcleo 7) — con permisos diferenciados
- El testimoniant controla su historia: puede editar, agregar, cambiar nivel de visibilidad, o eliminar

---

## Articulación con otros núcleos

- **Núcleo 5 (HO):** pautas metodológicas de historia oral + historiadores de HO supervisan narrativas
- **Núcleo 6 (Cómo Somos):** categorías para etiquetar + tendencias emergentes como "foto presente cualitativa"
- **Núcleo 3 (IS):** testimonios como fuente primaria cualitativa
- **Núcleo 8 (VE):** detección de violencia empresarial en testimonios
- **Núcleo 7 (Nuestro Derecho):** archivo de testimonios etiquetados
- **Núcleo 16 (Felicidad / IFT):** testimonios como fuente cualitativa del IFT — complementa datos numéricos con lo que los trabajadores dicen sobre cada dimensión

---

## Repositorio y documentación

> Qué datos trabaja este núcleo. Todos los núcleos consumen la librería base (N2) — taxonomía, pipeline, stack, formatos de salida, categorías morfológicas, reglas de protección. Lo específico de cada núcleo va aquí.

- **Repositorio:** Testimonios de trabajadores (diálogo semiestructurado en la app), pautas metodológicas de historia oral (N8/HO).
- **Corpus:** Testimonios etiquetados con categorías del ecosistema (N9 Cómo Somos + N11 CE): sector, tipo de experiencia, período, forma de lucha, VE detectada, categoría laboral del convenio. Narrativas cualitativas supervisadas por investigadores de HO.
- **Fuente primaria:** Narrativas de trabajadores grabadas/transcritas en la app — diálogo semiestructurado adaptativo. El testimonio es dato prospectivo (historiadores del futuro), no retrospectivo. Visibilidad definida por el testimoniant: privado / compartido con investigadores (anonimizado) / público.
- **Corpus de fine-tuning (N2):** Testimonios etiquetados + pautas metodológicas de historia oral — para entrenar el motor de entrevista semiestructurada y el etiquetador automático de testimonios.

---

## Estado actual

- Concepto definido
- Motor de entrevista semiestructurada: pendiente de desarrollo
- Etiquetador automático: pendiente (depende de categorías Cómo Somos Núcleo 6)
- Constructor de narrativas: pendiente (depende de HO Núcleo 5 para supervisión)

---

## Próximos pasos

- Definir pauta de preguntas semiestructuradas con historiadores de HO
- Testear primer diálogo semiestructurado con trabajadores del piloto aceitero
- Desarrollar etiquetador automático sobre categorías del ecosistema
