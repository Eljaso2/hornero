# Data Sources Guide — Newsletter Tricontinental IA en AL

## Data Source Types

### 1. Periódicos argentinos (Página/12, Infobae, La Nación, Clarín, Ambito Financiero)
- **Description**: Artículos periodísticos sobre IA, Palantir, data centers, Thiel, Milei
- **Priority**: High — estos son los medios que documentan los hechos concretos en Argentina
- **Credibility**: Medium-High — Página/12 tiene línea editorial progresista pero reporta hechos verificables; Infobae y La Nación son mainstream pero documentan declaraciones públicas
- **Examples**: Página/12 "El contrato secreto de Milei con Palantir", Infobae "Peter Thiel está muy interesado en invertir en Argentina"

### 2. Documentos legales y políticos
- **Description**: DNUs, leyes, proyectos legislativos, resoluciones ministeriales
- **Priority**: High — fundamento jurídico de los argumentos
- **Credibility**: High — documentos oficiales, texto público y verificable
- **Sources**: InfoLEG (Argentina), Senado Brasileño, Boletín Oficial
- **Examples**: DNU 70/2023, Ley Bases 27.742, Ley 26.737, RIGI, PL 2338/2023

### 3. Informes de organizaciones de derechos humanos/digitales
- **Description**: Informes de CELS, ADC, Via Libre, ODIO, Access Now, AlSur
- **Priority**: High — articulan resistencia jurídica y documentan violaciones
- **Credibility**: High — organizaciones con track record, metodología documentada, referencias verificables
- **Examples**: CELS "IA y derechos humanos" (2024), ADC informe facial recognition, Access Now "Brazil AI regulation"

### 4. Artículos académicos y libros
- **Description**: Couldry & Mejías, Moyano Czertok, Calderaro, Krowicki, Palma
- **Priority**: Medium-High — marco teórico y conceptual
- **Credibility**: High — publicaciones académicas peer-reviewed o revistas jurídicas
- **Examples**: Couldry & Mejías (2019, 2024), Moyano Czertok (2026), Calderaro (2022)

### 5. Columnas de opinión en medios internacionales
- **Description**: Milei+Sturzenegger en Financial Times, artículos en Foreign Policy
- **Priority**: Medium — documentan posicionamiento oficial pero son opinión, no reporte
- **Credibility**: Medium — están firmados por funcionarios, pero son argumentación política, no datos verificables
- **Examples**: Milei+Sturzenegger FT (June 4, 2026)

### 6. Conferencias y conversatorios (video/transcripción)
- **Description**: CLACSO conversatorio con Jeff Xiong, presentaciones en Expo EFI
- **Priority**: Medium — documentan posiciones y argumentos, pero no siempre verificables en detalle
- **Credibility**: Medium — son fuentes primarias (eventos reales) pero transcripciones pueden ser parciales
- **Examples**: Jeff Xiong YouTube Vo83uq9yLqk

## Sources to Use Cautiously

- **Notas de clase (notas-clase-ia.md)**: Son notas personales, no fuentes publicadas. Útiles para encuadrar conceptos (sesgos, RAG, prompt) pero no citables como fuente externa. Se pueden referenciar como "observaciones del autor" o marco conceptual, no como evidencia verificable.
- **Declaraciones de funcionarios sin fuente primaria**: "Sturzenegger dijo X en Expo EFI" — verificar si hay video/transcripción. Si no, marcar como atribución no verificable.
- **Rumores y reportes no confirmados**: "Thiel participó en redacción del proyecto" — oposición lo señala pero no hay prueba. Documentar como controversia, no como hecho.

## Data Recording Format

Each source entry in the verified catalog must include:

```
## [SRC-XXX] Source Title

**Source Type**: [Periódico / Documento legal / Informe NGO / Artículo académico / Columna opinión / Conferencia]
**Source URL**: [verified URL or "UNVERIFIABLE: reason"]
**Publication Date**: [YYYY-MM-DD or "MISSING"]
**Referenced In**: [which domain file]
**Credibility**: [High / Medium-High / Medium / Low]
**Credibility Explanation**: [brief rationale]
**Core Content**: [1-2 sentence summary]
**Key Quote from Original**: > [direct quote if available]
**Notes**: [any caveats, warnings, or context]
```

## Credibility Rating Definitions

| Rating | Definition | Typical Sources |
|--------|-----------|-----------------|
| **High** | Source is official, peer-reviewed, or from established institution with track record. Content is publicly verifiable. | Government documents, CELS reports, academic journals |
| **Medium-High** | Source is from credible media or institution. Content is mostly verifiable but may have editorial perspective. | Página/12, Infobae, policy analysis organizations |
| **Medium** | Source provides useful information but has clear limitations — opinion, partial documentation, or editorial angle. | Opinion columns, conference transcripts, news without independent verification |
| **Low** | Source should only be used for context, not as evidence for claims. Unverifiable, anecdotal, or potentially biased. | Social media posts, unconfirmed reports, personal notes |
