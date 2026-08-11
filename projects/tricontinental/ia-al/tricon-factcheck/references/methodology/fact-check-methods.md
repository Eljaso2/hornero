# Fact-Check Methods

## What Counts as a Factual Claim

A factual claim is any statement in the newsletter that asserts a specific, verifiable proposition about the world. This includes:

| Claim Type | Examples | Verification Strategy |
|------------|----------|----------------------|
| **DATE** | "April and May 2026", "June 4, 2026" | Match against documented dates in research materials |
| **NAME** | "Thiel is cofounder of PayPal", "Thiel hosted Milei" | Match against biographical/event records |
| **QUOTE** | "true libertarian", "mano letal", Marx quotes | Match against original source text — exact or near-exact match |
| **LEGISLATIVE** | "Artículo 174 del RIGI", "Ley 26.737" | Match against legislative reference tables |
| **NUMERICAL** | "45 millones", "13 millones de hectáreas", "5%" | Match against statistical data in research materials |
| **ATTRIBUTION** | "Marx said X", "Thiel called Milei Y" | Verify who actually said what, trace attribution chains |
| **HISTORICAL** | "VOC burned clove plantations", "EIC had army" | Match against historical documentation |
| **FACTUAL** | "Data centers need cold climate" | Assess plausibility, verify if possible |

**What does NOT count as a factual claim** (excluded from verification):
- Opinions and editorial judgments ("distopía", "fascinación desbocada")
- Rhetorical questions ("¿Qué sucedería si no estuvieran esos límites?")
- Narrative framing ("Argentina de nuevo, ¡qué sociedad imperdible!")
- Metaphorical statements ("lustrado sus zapatos sobre la cabeza")
- Calls to action ("que sirva como faro para la defensa")

## Match Categories

| Category | Symbol | Definition | Example |
|----------|--------|------------|---------|
| **CONFIRMED** | ✓ | Research materials contain the same fact with matching details | "Thiel cofounded PayPal" → confirmed in investigacion.md |
| **PARTIAL** | ◐ | General claim correct but specific details differ | Newsletter says "Marx said X" but Marx actually cited Raffles saying X |
| **CONTRADICTED** | ✗ | Research materials explicitly contradict the claim | If newsletter said "Thiel visited in 2025" but materials say 2026 |
| **UNVERIFIABLE** | ? | No information available in research materials or web sources | "Thiel bought the most expensive mansion" — may not be documented |
| **NEEDS_SOURCE** | ⚠ | Plausible claim but lacking specific source citation | "6 de agosto" date for land law debate |

## Verification Priority

Claims should be prioritized by potential impact of error:

1. **Critical**: QUOTE, LEGISLATIVE, NUMERICAL — errors here undermine credibility most
2. **Important**: DATE, NAME, ATTRIBUTION — errors here can mislead readers
3. **Standard**: HISTORICAL, FACTUAL — errors here affect argument quality

## Special Verification Rules

### Quote Verification
- Exact quotes must match word-for-word (or near-exact accounting for translation)
- If newsletter quotes Marx in Spanish but source has English, verify meaning match
- **Attribution chains**: If newsletter says "Marx said X about Holland" but Marx was actually citing Raffles, flag as PARTIAL with attribution chain documented
- Paraphrased quotes should capture the same meaning; note any divergence

### Legislative Verification
- Verify exact law/bill numbers (Ley 26.737, not 26.373)
- Verify exact article numbers (Art. 174, not 173)
- Verify dates of enactment or sending to Congress
- Verify status (promulgated, in commission, rejected)

### Numerical Verification
- Verify exact numbers ("13 millones de hectáreas" vs other figures)
- Verify percentages ("5% del territorio" vs actual percentage)
- Verify population figures ("45 millones" vs official statistics)
- Note any discrepancies in magnitude or precision

### Historical Verification
- Verify that historical events actually happened as described
- Verify that comparisons are structurally valid (VOC vs EIC distinction)
- Verify that causal claims are supported by sources
- Note any oversimplification or factual gaps in historical parallels

## Web Verification Protocol (for claims unverifiable by research materials)

1. **Search**: Use specific, targeted queries (not generic)
2. **Fetch**: Always fetch original content before drawing conclusions
3. **Source hierarchy**: Official sources > mainstream media > academic papers > social media
4. **Credibility assessment**: Rate each web source's credibility
5. **Record**: Document exact URL, fetch date, and key quotes from fetched content

## Handling Discrepancies

When the newsletter text differs from research materials:

| Situation | Handling |
|-----------|----------|
| Minor detail differs (date off by days) | Flag as PARTIAL, suggest correction |
| Attribution chain differs | Flag as PARTIAL, document chain |
| Number slightly different | Flag as PARTIAL, suggest most authoritative figure |
| Claim contradicted | Flag as CONTRADICTED, provide correct information |
| Claim unverifiable | Flag as UNVERIFIABLE, suggest rewording or removal |
| Plausible but unsourced | Flag as NEEDS_SOURCE, suggest adding source |
