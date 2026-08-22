# RAG Hornero — Mapa de Fuentes por Actor

## Resumen: 361 chunks totales (+ pendiente ingesta: Responsabilidad empresarial)

| Fuente | Chunks | Categoría |
|--------|--------|-----------|
| Jasinski, *El encanto del tanino* (PDF) | 292 | violencia-empresarial |
| Fuentes Lorca, *La gestión del delegado aceitero* (PDF) | 25 | historia-obrera |
| Vogelmann & Soul, *Espacio y trabajo en el Polo Oleaginoso* (PDF) | 20 | historia-obrera |
| Chunks manuales (kb_data.py) | 24 | mixtas |
| **Secretaría DDHH/CELS/FLACSO, *Responsabilidad empresarial en delitos de lesa humanidad* (PDF→MD, 2 tomos)** | **1736** | **violencia-empresarial, dictadura-y-resistencia** |

---

## 10 Categorías del RAG

| Categoría | Chunks | Fuentes | Icono |
|-----------|--------|---------|-------|
| violencia-empresarial | 295 | Jasinski (292) + 3 manuales | 📚 |
| dictadura-y-resistencia | ~500 | Responsabilidad empresarial (Tomo I+II) | 📚 |
| historia-obrera | 45 | Lorca (25) + Vogelmann (20) | 📚 |
| efemeride | 8 | 8 manuales (1° Mayo, CGTA, Cordobazo, Viborazo, Tampierazo, Tosco-Rucci, Santiagueñazo, Argentinazo) | 📅 |
| referentes | 4 | 4 manuales (Yofra, Cremonte, discursos, Jasinski ref.) | 📰 |
| condiciones | 3 | 3 manuales (Vicentín, Guaycurú, condiciones 2026) | 📄 |
| organizacion | 2 | 2 manuales (Federación, Jasinski sindicalismo) | 📄 |
| convenio | 1 | 1 manual (CCT 420/05) | 📄 |
| paritaria | 1 | 1 manual (paritaria 2026) | 📄 |
| smvm | 1 | 1 manual (SMVM básico) | 📚 |
| reforma | 1 | 1 manual (Cremonte reforma) | 📚 |
| prensa-sindical | 0 | ⚠️ **Vacía** — sin chunks aún | 📰 |

---

## 5 Actores + Hornero: qué pueden ver

### 🔬 Investigador/a (panorama)
**Categorías:** `condiciones` · `smvm` · `violencia-empresarial` · `referentes`
**Fuentes concretas:**
- Jasinski completo (292 chunks de La Forestal)
- SMVM básico
- Condiciones Vicentín, Guaycurú, 2026
- Referentes Yofra, Cremonte
**Temperatura:** 0.2 | **Max tokens:** 2000

### ⚖️ Abogado/a (consulta)
**Categorías:** `convenio` · `paritaria` · `reforma` · `organizacion`
**Fuentes concretas:**
- CCT 420/05
- Paritaria 2026
- Cremonte reforma laboral
- Federación aceitera, Jasinski sindicalismo
**Temperatura:** 0.2 | **Max tokens:** 2000

### ✊ Compañero/a (debate/reporte)
**Categorías:** `organizacion` · `condiciones` · `referentes`
**Fuentes concretas:**
- Federación aceitera, Jasinski sindicalismo
- Condiciones Vicentín, Guaycurú, 2026
- Referentes Yofra, Cremonte, discursos, Jasinski ref.
**Temperatura:** 0.4 (debate) / 0.2 (reporte) | **Max tokens:** 2000/3000

### 📜 Historiador/a (historia)
**Categorías:** `referentes` · `historia-obrera` · `prensa-sindical` · `violencia-empresarial` · `dictadura-y-resistencia`
**Fuentes concretas:**
- Fuentes Lorca (25 chunks)
- Vogelmann & Soul (20 chunks)
- Jasinski completo (292 chunks)
- **Responsabilidad empresarial en delitos de lesa humanidad** (Tomo I + II, 1736 chunks) — 22 casos de empresas durante la dictadura
- Referentes Yofra, Cremonte, discursos, Jasinski ref.
- 8 efemérides (solo en greeting, NO en RAG normal)
**Temperatura:** 0.2 | **Max tokens:** 2000
**⚠️ GAP:** efemérides NO están en FORMATO_CATEGORY_MAP['historia'] — solo se inyectan en el saludo

### 📰 Periodista (contenido)
**Categorías:** `organizacion` · `condiciones` · `referentes` · `prensa-sindical` · `documentos`
**Fuentes concretas:**
- Federación aceitera, Jasinski sindicalismo
- Condiciones Vicentín, Guaycurú, 2026
- Referentes Yofra, Cremonte, discursos, Jasinski ref.
- SIPREBA: Estatuto del Periodista (Ley 12.908), CCT 301/75, CCT 124/75, jornada 6hs, estabilidad, licencias, categorías
- ⚠️ prensa-sindical vacía (PDFs no ingeridos aún)
**Temperatura:** 0.5 | **Max tokens:** 3000

### 🐦 Hornero (ecosistema)
**Categorías:** Ninguna — `set()` vacío
**Fuentes:** Solo su propio prompt de filosofía, sin RAG
**Temperatura:** 0.3 | **Max tokens:** 1500

---

## Categorías compartidas vs exclusivas

| Categoría | Investigador | Abogado | Compañero | Historiador | Periodista |
|-----------|:-----------:|:-------:|:---------:|:-----------:|:----------:|
| dictadura-y-resistencia | | | | ✅ | |
| violencia-empresarial | ✅ | | | ✅ | |
| smvm | ✅ | | | | |
| condiciones | ✅ | | ✅ | | ✅ |
| referentes | ✅ | | ✅ | ✅ | ✅ |
| convenio | | ✅ | | | |
| paritaria | | ✅ | | | |
| reforma | | ✅ | | | |
| organizacion | | ✅ | ✅ | | ✅ |
| historia-obrera | | | | ✅ | |
| prensa-sindical | | | | ✅ | ✅ |
| efemeride | | | | ⚠️ greeting | |

---

## Flujo de búsqueda (paso a paso)

```
1. Mensaje del usuario → POST /api/chat/stream
2. retrieve_for_query():
   a. Enriquecer query con últimos 3 mensajes de contexto
   b. keyword_search() — TF-IDF sobre los 361 chunks
      - Tokenizar, stemming, stopwords
      - Scoring: IDF × freq + bonus título (+3) + bonus tags (+2) + bonus categoría (+3)
      - Top 8 candidatos
   c. Filtrar por grade del usuario (A < B.a < B.b < B.c < B.d)
   d. Filtrar por vigencia (solo "vigente")
   e. Filtrar por FORMATO_CATEGORY_MAP (solo categorías del actor)
   f. Top 5 chunks finales
3. get_system_prompt_rag():
   a. Prompt del persona + PRINCIPIOS_COMUNES
   b. Si hay chunks: inyectar como "FUENTES RELEVANTES"
   c. Si no hay chunks: inyectar "TEMAS DISPONIBLES"
   d. Inyectar clipping (noticias actuales, todos los actores)
4. LLM (DeepSeek/Claude) → respuesta streaming
```

---

## Gaps y próximos pasos

1. **efemeride NO está en FORMATO_CATEGORY_MAP['historia']** — solo se inyecta en el greeting. Si el usuario pregunta "contame del Cordobazo" en un chat normal, la Historiadora no ve los chunks de efemérides. **Fix: agregar 'efemeride' al set de 'historia'.**

2. **prensa-sindical vacía** — la categoría existe en el mapa pero no hay chunks. Falta incorporar periódicos del gremio (El Trabajador Aceitero y Desmotador).

3. **Sin efemérides de agosto** — las 8 efemérides son de otros meses. Falta incorporar las de agosto desde Historia Obrera.

4. **Sin embeddings/vector DB** — la búsqueda es keyword-only (TF-IDF). No hay búsqueda semántica. Planificado para Fase 4.

5. **El libro de Jasinski ya NO domina** — antes 292 de 361 chunks (81%). Con *Responsabilidad empresarial* (1736 chunks nuevos), el peso relativo baja a ~14%. La Historiadora ahora ve 22 casos de empresas represivas además de La Forestal. ✅ **Ingesta completada** (ago 2026).

6. **historia-obrera sin chunks manuales** — los 45 chunks son todos de PDFs (Lorca, Vogelmann). No hay chunks curados manualmente.

7. **condiciones con grade B.a** — los chunks de Vicentín, Guaycurú y condiciones 2026 requieren grade B.a. Los usuarios con grade "A" (no logueados) no los ven.

8. **Periodista ahora ve 'documentos'** (fix ago 2026) — FORMATO_CATEGORY_MAP['contenido'] actualizado para incluir 'documentos', así el periodista accede a los chunks SIPREBA (Estatuto del Periodista, CCT 301/75, etc.). Antes solo veía prensa/academico/noticias/audiovisual y los chunks legales estaban filtrados.

9. **✅ Responsabilidad empresarial: INGESTA COMPLETADA** — 1736 chunks de los dos tomos incorporados a `kb_chunks.json`. La Historiadora recupera Ford, Ledesma, Acindar, etc. correctamente. Categoría: `academico` (visible para Historiador, Investigador, Compañero).
