# Output Template — Fact-Check Report

## Document Structure

```markdown
# Fact-Check Report: Tricontinental Newsletter — IA en América Latina

## Executive Summary
[Overall assessment: number of claims, breakdown by verdict, key findings]

## Detailed Findings

### Paragraph 1: [Opening — Venezuela earthquake, World Cup]
#### CLM-XXX: [Brief description]
- **Verdict**: [CONFIRMED/PARTIAL/CONTRADICTED/UNVERIFIABLE]
- **Newsletter text**: "[exact quote]"
- **Finding**: [What the research materials/web sources say]
- **Source**: [File path or URL]
- **Notes**: [Any context or nuance]

#### CLM-YYY: [Next claim]
...

### Paragraph 2: [Tricontinental, Jeff Xiong, Dossier 100]
...

### Paragraph 3: [Argentina, land law, 6 agosto]
...

### Paragraph 4: [Peter Thiel, Palantir, Davos, California]
...

### Paragraph 5: [DAOs, Sturzenegger, sociedad automatizada]
...

### Paragraph 6: [Super RIGI, Ley Bases, Art. 174]
...

### Paragraph 7: [FT op-ed, mano mortal, Buenos Aires = Amsterdam]
...

### Paragraph 8: [VOC/EIC, Marx, Adam Smith]
...

### Paragraph 9: [Alternative, sovereignty digital, Malvinas]
...

## Errors and Corrections

### Critical Errors (CONTRADICTED claims)
| CLM | Claim | Error | Correct Information | Source | Suggested Correction |
|-----|-------|-------|--------------------|--------|---------------------|
| XXX | [what newsletter says] | [what's wrong] | [what's correct] | [source] | [suggested rewrite] |

### Partial Errors (PARTIAL claims needing adjustment)
| CLM | Claim | Discrepancy | Nuance | Source | Suggested Adjustment |
|-----|-------|-------------|--------|--------|---------------------|
| XXX | [what newsletter says] | [what differs] | [explanation] | [source] | [suggested adjustment] |

### Unverifiable Claims (need sourcing or rewording)
| CLM | Claim | Issue | Recommendation |
|-----|-------|-------|----------------|
| XXX | [what newsletter says] | [why unverifiable] | [add source / reword / remove] |

## Source References

### Research Materials
| ID | File | Key Sections Used |
|----|------|-------------------|
| REF-001 | investigacion.md | [sections] |
| REF-002 | milei-ft.md | [sections] |
| REF-003 | marx-indias-orientales.md | [sections] |
| REF-004 | intervenciones-legislativas-milei-ia.md | [sections] |
| REF-005 | modelo-dato-exportador.md | [sections] |
| REF-006 | moyano-czertok.md | [sections] |

### Web Sources
| ID | URL | Content | Credibility |
|----|-----|---------|-------------|
| WEB-001 | [URL] | [brief description] | [High/Medium/Low] |
```

## Format Specifications

### Headings
- Level 1 (`#`): Report title only
- Level 2 (`##`): Major sections (Executive Summary, Detailed Findings, Errors, Sources)
- Level 3 (`###`): Paragraph groupings and sub-sections
- Level 4 (`####`): Individual claim entries

### Verdict Symbols
- ✓ CONFIRMED
- ◐ PARTIAL
- ✗ CONTRADICTED
- ? UNVERIFIABLE
- ⚠ NEEDS_SOURCE

### Citation Format
- Research materials: `[File name], [Section/Line]`
- Web sources: `[Source Name](URL)`
- Marx primary sources: `Marx, [Work], [Date], marxists.org URL`

## Quality Checklist
- [ ] Every claim from the claims list appears in the report
- [ ] Each claim has a clear verdict with symbol
- [ ] CONTRADICTED claims have specific corrections
- [ ] PARTIAL claims have documented discrepancies
- [ ] UNVERIFIABLE claims have recommendations
- [ ] All source citations are complete and verifiable
- [ ] Executive summary accurately reflects overall findings
- [ ] No hallucinated sources or invented data
- [ ] Original newsletter text preserved (not paraphrased)
- [ ] Research material quotes preserved verbatim
