"""Phase 2 RAG retriever — improved keyword search with TF-IDF scoring,
category boosting, basic stemming, and conversation-aware retrieval.

No vector DB, no embeddings. Works on current Render infrastructure.
Migration path: Phase 4 adds semantic search (FAISS + pre-computed embeddings)
when VPS with persistent disk is available.
"""

import math
from collections import Counter
from kb_data import ALL_CHUNKS, KB_CHUNKS


# ===== Grade hierarchy for access filtering =====

GRADE_ORDER = ["A", "B.a", "B.b", "B.c", "B.d"]


# ===== Basic stemming dictionary for sindical terms =====
# Maps plural/variant forms to their canonical form
STEM_MAP = {
    "salarios": "salario", "salarial": "salario", "salariales": "salario",
    "convenios": "convenio", "convenios": "convenio",
    "paritarias": "paritaria",
    "trabajadores": "trabajador", "trabajadoras": "trabajador",
    "sindicatos": "sindicato", "sindicales": "sindical", "sindicalismo": "sindical",
    "empresas": "empresa", "empresarial": "empresa", "empresariales": "empresa",
    "huelgas": "huelga", "huelguistas": "huelga",
    "reformas": "reforma",
    "despidos": "despido", "despidos": "despido",
    "condiciones": "condicion", "condición": "condicion",
    "jornadas": "jornada",
    "vacaciones": "vacacion", "vacación": "vacacion",
    "organizaciones": "organizacion", "organización": "organizacion",
    "delegados": "delegado", "delegadas": "delegado",
    "asambleas": "asamblea",
    "negociaciones": "negociacion", "negociación": "negociacion",
    "lockouts": "lockout", "lock-outs": "lockout",
    "tercerización": "tercerizacion", "tercerizaciones": "tercerizacion",
    "masacres": "masacre",
    "referentes": "referente",
    "lockouts": "lockout",
    "derechos": "derecho",
    "horas": "hora",
    "extras": "extra",
    "extras": "extra",
    "cotizaciones": "cotizacion",
    "cotización": "cotizacion",
    "distribuciones": "distribucion", "distribución": "distribucion",
    "violencias": "violencia", "violentos": "violencia",
    "forestales": "forestal",
    "aceiteros": "aceitero", "aceiteras": "aceitero",
    "patronales": "patronal",
    "legislaciones": "legislacion", "legislación": "legislacion",
    "jurisprudencias": "jurisprudencia",
    # Historia obrera / antropología
    "investigaciones": "investigacion", "investigación": "investigacion",
    "antropológicas": "antropologica", "antropologicas": "antropologica",
    "concesiones": "concesion", "concesión": "concesion",
    "testimonios": "testimonio",
    "reparaciones": "reparacion", "reparación": "reparacion",
    "genocidios": "genocidio",
    "etnocidios": "etnocidio",
    "territorios": "territorio",
    "comunidades": "comunidad",
    "despojos": "despojo",
    # Prensa sindical
    "periódicos": "periodico", "periodicos": "periodico",
    "comunicados": "comunicado",
    "volantes": "volante",
    "editoriales": "editorial",
    "posiciones": "posicion",
    "gremiales": "gremial",
    # Historia obrera / OIT / derechos
    "forzados": "forzado", "forzada": "forzado", "forzoso": "forzado", "forzosos": "forzado", "forzosa": "forzado",
    "esclavos": "esclavo", "esclavas": "esclavo",
    "indígenas": "indígena",
    "coloniales": "colonial",
    "coacciones": "coaccion", "coacción": "coaccion",
    "jubilaciones": "jubilacion",
    "anarquistas": "anarquismo", "anarquista": "anarquismo",
    "marítimos": "maritimo", "marítimo": "maritimo",
    "criminologías": "criminologia", "criminología": "criminologia",
    "legislaciones": "legislacion", "legislación": "legislacion",
    # Geografía: andino es la forma adjetiva de Andes
    "andino": "andes", "andina": "andes", "andinos": "andes", "andinas": "andes",
    "andean": "andes",
    # Geografía andina: variantes de países
    "boliviano": "bolivia", "boliviana": "bolivia", "bolivianos": "bolivia",
    "peruano": "peru", "peruana": "peru", "peruanos": "peru",
    "ecuatoriano": "ecuador", "ecuatoriana": "ecuador",
    "colombiano": "colombia", "colombiana": "colombia",
    "chileno": "chile", "chilena": "chile",
    # Negociación colectiva: mapear variantes de "colectivo/a"
    "colectivos": "colectivo", "colectiva": "colectivo", "colectivas": "colectivo",
    # Pliego de condiciones: variantes morfológicas
    "pliegos": "pliego",
    # Opinión / columnas: plural y variantes (con/sin tilde para reverse stem)
    "opiniones": "opinion", "opinión": "opinion",
    "columnas": "columna", "columnistas": "columnista",
    "diarios": "diario",
    # Verbos de opinión → canonical "opinion" para que "opina Yofra" también boostee
    "opina": "opinion", "opinan": "opinion",
}


# ===== Synonym map for conceptual cross-references =====
# Unlike STEM_MAP (morphological variants), this maps semantically related terms
# so queries for one concept also match chunks using the other term.
# Both directions are expanded — see query expansion logic below.
SYNONYM_GROUPS = [
    # convenio ↔ pliego ↔ cláusula: in La Forestal context,
    # "pliego de condiciones" = "convenio"; "cláusulas" = articles of the agreement
    {"convenio", "pliego", "acuerdo", "clausula"},
    # negociación colectiva ↔ convenio colectivo: academic vs common term
    {"negociacion", "paritaria"},
]


def stem_term(term: str) -> str:
    """Apply basic stemming: look up in dictionary, fallback to original."""
    return STEM_MAP.get(term, term)


def grade_satisfies(user_grade: str, required_grade: str) -> bool:
    """Check if user_grade >= required_grade for access."""
    if required_grade == "open":
        return True
    try:
        return GRADE_ORDER.index(user_grade) >= GRADE_ORDER.index(required_grade)
    except ValueError:
        return False  # Unknown grade = no access


def _compute_idf(chunks: list) -> dict:
    """Compute inverse document frequency for terms across all chunks.

    IDF(t) = log(N / df(t)) where N = total chunks, df(t) = chunks containing t.
    Higher IDF = rarer term = more discriminative.
    """
    n = len(chunks)
    if n == 0:
        return {}

    doc_freq = Counter()
    for chunk in chunks:
        # Build unique terms per document (don't count duplicates within same doc)
        searchable = (
            chunk["title"] + " " +
            chunk["text"] + " " +
            " ".join(chunk["tags"]) + " " +
            chunk.get("author", "")
        ).lower()
        terms = set(searchable.split())
        # Also add stemmed versions
        stemmed = set(stem_term(t) for t in terms if len(t) > 2)
        terms = terms | stemmed
        for t in terms:
            doc_freq[t] += 1

    idf = {}
    for term, df in doc_freq.items():
        idf[term] = math.log(n / (1 + df))  # +1 to avoid division by zero
    return idf


# Pre-compute IDF across all chunks (module-level, computed once)
_idf_cache = None


def _get_idf() -> dict:
    """Get cached IDF scores, computing on first call."""
    global _idf_cache
    if _idf_cache is None:
        _idf_cache = _compute_idf(ALL_CHUNKS)
    return _idf_cache


# ===== Category boosting map =====
# When query terms match these category keywords, boost chunks in that category
CATEGORY_KEYWORDS = {
    # --- Categorías alineadas con carpetas Biblioteca ---
    "investigaciones": ["libro", "articulo", "paper", "investigacion", "academico", "universidad",
                  "forestal", "masacre", "lockout", "historia", "referente", "lafuente",
                  "antropologica", "concesion", "genocidio", "memoria", "verdad", "justicia",
                  "reparacion", "testimonio", "pueblo originario", "despojo", "territorio",
                  "cordobazo", "viborazo", "tampierazo", "argentinazo", "santiagueñazo",
                  "cgta", "efemeride", "aniversario", "conmemoracion", "1 de mayo", "tosco",
                  "rucci", "ongaro", "reforma", "dnu", "ley bases", "flexibilizacion",
                  # Historia obrera / OIT / derechos laborales
                  "forzado", "forzoso", "esclavo", "esclavitud", "indígena", "indígenas", "andino",
                  "colonial", "colonialismo", "coacción", "mita", "pongueaje", "yanaconazgo",
                  # Geografía andina / latinoamericana — boost cuando pregunta por la cordillera
                  "andes", "bolivia", "perú", "ecuador", "colombia", "chile", "cordillera",
                  "puna", "altiplano", "quechua", "aymara",
                  "oit", "organización internacional del trabajo", "negociación colectiva",
                  "convenio colectivo", "convenios colectivos", "colectivo",
                  "derecho laboral", "legislación laboral", "trabajo femenino", "trabajo marítimo",
                  "disciplina laboral", "control social", "criminología", "política criminal",
                  "jubilaciones", "anarquismo", "sindicalismo revolucionario", "socialismo",
                  # Centrales obreras / nucleamientos sindicales (Contreras 2017)
                  "cgt", "centrales obreras", "nucleamientos sindicales", "coasi", "usa", "cggma",
                  "fora", "faca", "mpids", "cpcn", "atlas", "ctal", "fsm", "orit", "ciosl",
                  # Federaciones provinciales (Jasinski 2023)
                  "fst", "federación santafesina", "federación provincial", "uol", "unión obrera local",
                  "santa fe"],
    "fuentes": ["convenio", "convenios colectivos", "pliego", "cct", "convenio colectivo", "basico", "categoria",
               "paritaria", "aumento", "negociacion", "oferta", "salarial",
               "smvm", "salario minimo", "piso legal", "minimo vital",
               "sindicato", "organizacion", "asamblea", "delegado", "huelga",
               "art", "seguridad", "enfermeria", "accidente", "salud",
               "clase obrera", "clase trabajadora", "ejercito", "reserva",
               "ice", "ift", "panorama", "condicion", "como somos",
               "cremonte", "canasta",
               # Prensa sindical (fuentes/prensa)
               "periodico", "comunicado", "volante", "editorial", "discurso", "opinion",
               "trabajador aceitero", "el trabajador aceitero", "desmotador", "posicion",
               "gremial", "ftciod", "foeiap", "federacion aceitera", "nota", "columna",
               "prensa oficial", "boletin sindical", "comunicado gremial",
               # Audiovisual (fuentes/audiovisual)
               "podcast", "video", "documental", "docuficcion", "ilustracion",
               "audio", "radio", "spotifi", "youtube", "multimedia"],
    "actualidad": ["noticia", "recorte", "medio", "informacion", "actualidad",
                 "sonido gremial", "infogremiales", "cronica", "diario", "diarios", "pagina 12",
                 "clipping", "agencia", "teleshow", "prensa comercial", "la nacion",
                 "clarin", "ambito financiero", "cronista", "telam",
                 # Columnas de opinión y medios donde Yofra publica
                 "yofra", "opinión", "opinion", "opina", "opinan",
                 "columna", "columnista",
                 "tiempo argentino", "perfil", "eldiarioar", "el diario"],
}

# ===== Tenant-specific keywords =====
# Merged with CATEGORY_KEYWORDS during search for the active tenant
TENANT_KEYWORDS = {
    "aceiteros": [
        "ftciod", "foeiap", "federacion aceitera", "trabajador aceitero",
        "el trabajador aceitero", "desmotador", "CIARA", "CIAVEC", "CARBIO",
        "CCT 420", "vicentin", "yofra", "aceitero", "aceitera",
        "expeller", "refinado", "oleaginoso", "algodon",
    ],
    "prensa": [
        "SIPREBA", "UPC", "Union de Prensa", "FEP", "Federacion de Periodistas",
        "ADEPA", "IANA", "CCT 301", "CCT 124", "estatuto del periodista",
        "ley 12.908", "periodista", "cronista", "corrector", "diagramador",
        "editor", "fotografo", "reportero grafico", "prensa escrita",
        "prensa televisada", "jornada 6 horas", "36 horas", "salario profesional",
        "estabilidad del periodista", "indemnizacion agravada", "clausula de conciencia",
        "noticiero", "movilero", "productor periodistico", "redaccion",
        "agustin lecchi",
    ],
}


def keyword_search(query: str, max_chunks: int = 5, tenant: str = "aceiteros",
                    current_query: str = "") -> list:
    """Improved keyword search with TF-IDF scoring, stemming, and category boosting.

    Returns top-N chunks by relevance score.
    Scoring combines:
    - TF-IDF: term frequency × inverse document frequency for discriminative terms
    - Title bonus: +3 for title matches (strong signal)
    - Tag bonus: +2 for tag matches (curated, high signal)
    - Category bonus: +3 for matching category when query matches category keywords
    - Stemming: matches both original and stemmed forms
    """
    if not query or not query.strip():
        return []

    # Strip punctuation before tokenizing — "Andes?" → "andes", "forzoso." → "forzoso"
    import re as _re
    clean_query = _re.sub(r'[?!.,;:¿¡()"\'\[\]{}]', ' ', query.lower())
    raw_terms = clean_query.split()
    # Filter out very short terms (1-2 chars) and common stopwords
    stop_words = {"que", "el", "la", "los", "las", "un", "una", "de", "del",
                  "en", "es", "se", "no", "si", "yo", "me", "mi", "tu",
                  "te", "nos", "les", "y", "o", "a", "al", "por", "para",
                  "con", "sin", "como", "más", "mas", "muy", "hay", "pero",
                  "esta", "este", "esto", "eso", "esa", "ese", "ser", "son",
                  "fue", "era", "ha", "han", "he", "bien", "sobre", "entre",
                  "del", "las", "los", "una", "unos", "unas", "este", "esta",
                  "ese", "esa", "aquel", "aquella", "muy", "que", "como",
                  "cuando", "donde", "quien", "cual", "cuyo", "cuya",
                  "puede", "puedo", "puedes", "podemos", "tienen", "tengo",
                  "tienes", "tenemos", "hacer", "hago", "haces", "hacemos",
                  "saber", "se", "sabe", "sabemos", "quiero", "quieres",
                  "quiere", "queremos", "deberia", "deberías", "debería",
                  "debo", "debes", "debe", "debemos", "estoy", "estas",
                  "esta", "estamos", "estan", "están", "tambien", "también"}
    terms = [t for t in raw_terms if len(t) > 2 and t not in stop_words]
    # Also add stemmed versions of terms
    stemmed_terms = [stem_term(t) for t in terms]
    all_terms = set(terms) | set(stemmed_terms)

    # Reverse stem expansion: for each query term, find all variant forms
    # that stem to the same canonical form (e.g., query "andes" → also search "andino", "andina")
    reverse_stems = {}
    for variant, canonical in STEM_MAP.items():
        if canonical not in reverse_stems:
            reverse_stems[canonical] = set()
        reverse_stems[canonical].add(variant)
        reverse_stems[canonical].add(canonical)  # include canonical itself

    expanded_terms = set(all_terms)
    for t in all_terms:
        if t in reverse_stems:
            expanded_terms |= reverse_stems[t]

    # Synonym expansion: when a query term belongs to a synonym group,
    # add all terms in that group so "convenio" also matches "pliego" etc.
    for group in SYNONYM_GROUPS:
        if expanded_terms & group:
            expanded_terms |= group

    all_terms = expanded_terms

    if not all_terms:
        return []

    # Extract current query terms for boosted scoring
    # When conversation context is merged, terms from the current message
    # should weigh more than context terms (e.g., "andes" in current query
    # vs "forzado" from previous context)
    current_terms = set()
    if current_query:
        cur_raw = current_query.lower().split()
        cur_terms = [t for t in cur_raw if len(t) > 2 and t not in stop_words]
        cur_stemmed = [stem_term(t) for t in cur_terms]
        current_terms = set(cur_terms) | set(cur_stemmed)
        # Expand with reverse stems
        for t in list(current_terms):
            if t in reverse_stems:
                current_terms |= reverse_stems[t]

        # Expand with synonyms
        for group in SYNONYM_GROUPS:
            if current_terms & group:
                current_terms |= group

    idf = _get_idf()

    # Cross-tenant boost detection: when the query explicitly mentions another sector,
    # boost those chunks so they can compete with own-tenant chunks (+4 vs +5).
    # This enables comparative queries like "me ofrecen pasar al convenio aceitero"
    CROSS_TENANT_KEYWORDS = {
        "aceiteros": {"aceitero", "aceitera", "aceiteros", "oleaginoso", "desmotador",
                       "cct 420", "foeiap", "ftciod", "yofra", "expeller", "cct-420"},
        "prensa": {"prensa", "periodista", "periodistico", "sipreba", "cronista",
                    "corrector", "redaccion", "cct 301", "cct 124", "estatuto del periodista",
                    "ley 12908", "cct-301", "cct-124", "adeba", "adepa"},
    }
    cross_tenant_boosts = {}
    query_lower = query.lower()
    for other_tenant, kws in CROSS_TENANT_KEYWORDS.items():
        if other_tenant == tenant:
            continue  # skip own tenant
        if any(kw in query_lower for kw in kws):
            cross_tenant_boosts[other_tenant] = 4.0  # almost as strong as own +5

    # Detect which categories are relevant to the query
    query_lower = query.lower()
    relevant_categories = set()
    # Merge CATEGORY_KEYWORDS with tenant-specific keywords
    merged_cat_keywords = dict(CATEGORY_KEYWORDS)  # copy base
    tenant_kws = TENANT_KEYWORDS.get(tenant, [])
    # Add tenant keywords to the "fuentes" category
    if tenant_kws:
        for cat_key in ("fuentes",):
            existing = merged_cat_keywords.get(cat_key, [])
            merged_cat_keywords[cat_key] = existing + tenant_kws
    for cat, keywords in merged_cat_keywords.items():
        for kw in keywords:
            if kw in query_lower:
                relevant_categories.add(cat)
                break

    # Tenant prioritization: all chunks are searchable, but user's own tenant gets a boost
    # Regla: el chat prioriza el gremio del usuario (historia, leyes, convenio),
    # pero NO bloquea el acceso a otros gremios si la query lo requiere.

    scored = []
    for chunk in ALL_CHUNKS:
        # Build searchable text with different fields for weighted scoring
        title_lower = chunk["title"].lower()
        text_lower = chunk["text"].lower()
        tags_lower = " ".join(chunk["tags"]).lower()
        sources_lower = " ".join(chunk.get("sources", [])).lower()
        quotes_lower = " ".join(q.get("text", "") for q in chunk.get("quotes", [])).lower()

        # Combine all searchable text
        searchable = (title_lower + " " + text_lower + " " + tags_lower + " " + sources_lower + " " + quotes_lower)

        # TF-IDF scoring: sum of IDF weights for matching terms
        # Current query terms get 2x weight — the user's latest question
        # matters more than conversation context (e.g., "andes" > "forzado")
        score = 0.0
        for t in all_terms:
            if t in searchable:
                idf_weight = idf.get(t, 0.5)
                # Double weight for terms from the current query (not context)
                if current_terms and t in current_terms:
                    score += idf_weight * 2.0
                else:
                    score += idf_weight

        # Title bonus: +3 per matching term in title (strong signal)
        # Current query terms get 2x title bonus
        for t in all_terms:
            if t in title_lower:
                if current_terms and t in current_terms:
                    score += 6.0
                else:
                    score += 3.0

        # Tag bonus: +2 per matching term in tags (curated, high signal)
        for t in all_terms:
            if t in tags_lower:
                score += 2.0

        # Author bonus: +4 when query matches chunk author (e.g., "Yofra" matches author="Daniel Yofra")
        # Stronger than tag bonus because authorship is an explicit, high-signal attribution.
        # Distinguishes authored content (columns, books) from content ABOUT someone (interviews, reports).
        author_lower = chunk.get("author", "").lower()
        if author_lower:
            for t in all_terms:
                if t in author_lower:
                    score += 4.0
                    break  # one match is enough

        # Phrase-match bonus: +10 when 2+ consecutive query terms appear together in title
        # This dramatically boosts precision — "convenio colectivo" in title beats
        # scattered "forestal" + "1920" in text that happens to score high on IDF
        query_term_list = [t for t in clean_query.split() if t in all_terms or stem_term(t) in all_terms]
        if len(query_term_list) >= 2:
            # Check all bigrams (pairs of consecutive terms)
            for i in range(len(query_term_list) - 1):
                bigram = query_term_list[i] + " " + query_term_list[i + 1]
                if bigram in title_lower:
                    score += 10.0
                    break  # one phrase match is enough

        # Category bonus: +3 if chunk category matches detected query category
        chunk_category = chunk.get("category", "").lower()
        if chunk_category in relevant_categories:
            score += 3.0

        # Query-coverage bonus: reward chunks that match MANY different query terms
        # This prevents a chunk that matches "colectivo" + "acuerdo" + "negociación" + "convenio"
        # (all expanded synonyms) from beating one that matches "pliego" + "forestal" + "huelga"
        # (terms from distinct parts of the query = higher specificity).
        # Use ORIGINAL query terms (before synonym expansion) for a more meaningful count.
        original_query_terms = set(terms) | set(stemmed_terms)
        distinct_original = sum(1 for t in original_query_terms
                                if t in searchable or any(syn in searchable for syn in (reverse_stems.get(t, {t}))))
        distinct_expanded = sum(1 for t in all_terms if t in searchable)
        # Bonus based on original query coverage (stronger signal than expanded)
        if distinct_original >= 3:
            score += 12.0   # matches 3+ distinct original query concepts → very specific
        elif distinct_original >= 2:
            score += 6.0    # matches 2 distinct original query concepts

        # Entity-specificity bonus: when the query names a specific entity, chunks mentioning
        # that entity should outrank generic chunks. This list is mirrored from the NER lists
        # in pdf_to_chunks.py — keep them in sync. When the user asks about a specific person,
        # organization, or place, those chunks get +8 so they beat generic high-IDF chunks.
        entity_keywords = {
            # La Forestal / Norte Santa Fe
            "forestal", "tanino", "quebracho", "villa guillermina", "villa ana",
            "la gallareta", "tartagal", "lafuente", "jasinski", "bentos",
            "lamazón", "lamazon", "gauto", "cotta", "abecasis", "vargas",
            "ruber", "romero", "almirón", "colomina", "selkis", "silvestre",
            "aguilar",
            # Centrales obreras / nucleamientos
            "cgt", "fora", "faca", "coasi", "cggma", "cpcn", "upcn", "mpids",
            "atlas", "ctal", "fsm", "orit", "ciosl", "foit", "fst", "fotia", "cgta",
            "uol", "uom",
            # Dirigentes obreros
            "espejo", "viel", "íscaro", "iscaro", "ímizcoz", "imizcoz",
            "marischi", "barainca", "peter", "othar", "grunfeld", "danussi",
            "cimazo", "fidanza", "gregorio", "morier",
            "gay", "reyes", "castro",
            "toledano", "romualdi", "puiggrós", "puiggros",
            # Peronismo
            "perón", "peron", "evita",
            # Historiadores / autores
            "oit", "bertolo", "inigo carrera", "krotoschin",
            "germani", "doyon", "torre", "del campo", "acha",
            "camarero", "ceruso", "nieto", "schiavi", "contreras",
            # Movimiento obrero post-peronismo
            "tosco", "rucci", "ongaro", "yofra", "cremonte",
            # Conceptos / lugares
            "rosario", "reconquista", "chaco",
        }
        query_entities = original_query_terms & entity_keywords
        if query_entities:
            chunk_entities = {t for t in entity_keywords if t in searchable}
            overlap = query_entities & chunk_entities
            if overlap:
                score += 8.0 * len(overlap)  # +8 per matching entity term

        # Tenant priority bonus: +5 for own tenant, +1 for shared, 0 for other tenants
        # Regla: prioriza tu gremio, pero no te bloquea el acceso a otros
        # Excepción: cuando la query es académica/histórica y el chunk es shared+investigaciones,
        # boost de +4 (en vez de +1) para que pueda competir con chunks del gremio propio
        # La historiadora investiga toda Latinoamérica, no solo su sector —
        # shared+investigaciones con términos andinos/latam sube a +5 (igual que own-tenant)
        chunk_tenant = chunk.get("tenant", "aceiteros")
        if chunk_tenant == tenant:
            score += 5.0
        elif chunk_tenant == "shared":
            if "investigaciones" in relevant_categories and chunk_category == "investigaciones":
                # Check if query has regional/latam terms — historiadora explores beyond sector
                latam_terms = {"andes", "bolivia", "peru", "ecuador", "colombia", "chile",
                               "andino", "andina", "cordillera", "puna", "altiplano",
                               "latinoamerica", "latinoamericana", "regional"}
                has_latam = bool(current_terms & latam_terms) if current_terms else False
                score += 5.0 if has_latam else 4.0  # +5 when latam query, +4 otherwise
            else:
                score += 1.0
        elif chunk_tenant in cross_tenant_boosts:
            # Cross-tenant boost: when the query explicitly mentions another sector,
            # give those chunks a +4 bonus so they can compete with own-tenant chunks
            score += cross_tenant_boosts[chunk_tenant]
        # other tenants: no bonus, but still searchable

        if score > 0:
            scored.append({**chunk, "relevance_score": round(score, 2)})

    # Sort by score descending, return top N
    scored.sort(key=lambda x: x["relevance_score"], reverse=True)
    return scored[:max_chunks]


def retrieve_for_query(query: str, formato: str, grade: str = "A",
                       conversation_history: list = None,
                       tenant: str = "aceiteros") -> list:
    """Main RAG retrieval: select relevant KB chunks for a user query.

    Phase 2 logic:
    1. Combine current query with recent user messages for context
    2. Keyword search with TF-IDF scoring (tenant-filtered: own ∪ shared)
    3. Grade-based filtering (remove chunks user shouldn't see)
    4. Vigencia filtering (remove derogated content)
    5. Formato-based filtering (avoid cross-persona contamination)
    6. Return top 5 chunks for selective prompt injection

    If no chunks match, return empty (the persona + principles are always included).
    """
    # Step 1: Enhance query with conversation context
    enhanced_query = query
    if conversation_history:
        # Add last 2-3 user messages for context
        user_msgs = [m.get("text", "") for m in conversation_history
                     if m.get("role") == "user" and m.get("text")]
        if user_msgs:
            context = " ".join(user_msgs[-3:])
            enhanced_query = context + " " + query

    # Step 2: Keyword search with improved scoring (tenant-filtered)
    # Historia persona needs deep search — entities that appear rarely (Bentos, FST, etc.)
    # need more chunks to surface. Wider pool = better recall at modest token cost.
    # Other personas: 10 is enough (legal/CCT queries are more focused).
    search_limit = 20 if formato == 'historia' else 10
    candidates = keyword_search(enhanced_query, max_chunks=search_limit, tenant=tenant,
                                 current_query=query)

    # Step 3: Grade filtering
    filtered = [c for c in candidates if grade_satisfies(grade, c.get("grade_access", "open"))]

    # Step 4: Vigencia filtering — only show vigente content
    filtered = [c for c in filtered if c.get("vigencia", "vigente") == "vigente"]

    # Step 5: Formato-based filtering — avoid cross-persona contamination
    # Each persona has its own domain. Chunks from other domains can confuse the LLM
    # and cause it to switch personas mid-conversation.
    FORMATO_CATEGORY_MAP = {
        'panorama':   {'investigaciones', 'fuentes', 'actualidad'},          # Investigador: data, indices, research
        'consulta':   {'fuentes', 'investigaciones'},                        # Abogado: legal, CCT, rights
        'debate':     {'fuentes', 'investigaciones', 'actualidad'},          # Compañero: org, struggle, reports
        'reporte':    {'fuentes', 'investigaciones', 'actualidad'},          # Compañero (report mode)
        'historia':   {'investigaciones', 'fuentes'},                        # Historiador: history, referents, press
        'contenido':  {'fuentes', 'investigaciones', 'actualidad'},          # Periodista: content production, union press + su normativa profesional
        'ecosistema': set(),                                                  # Hornero: no KB chunks needed (its own philosophy)
    }
    allowed_categories = FORMATO_CATEGORY_MAP.get(formato)
    if allowed_categories is not None:
        # If formato has a defined category set, filter chunks to only those categories
        # Empty set means no KB chunks should be injected (ecosistema)
        if allowed_categories:
            filtered = [c for c in filtered if c.get("category", "") in allowed_categories]
        else:
            filtered = []
    filtered = [c for c in filtered if c.get("vigencia", "vigente") == "vigente"]

    # Step 6: Persona-domain chunk filtering — prevent exact discourse citations
    # The Historiadora owns the Perón discursos compilation (kb-peron-43-44-*).
    # Other personas CAN mention Perón generically ("en la época de Perón",
    # "esa ley es peronista") but must NOT receive exact discourse chunks with
    # dates and quotes — that would make them cite the discurso instead of deriving.
    DOMAIN_CHUNK_PREFIXES = {
        'kb-peron-43-44': 'historia',  # Perón discursos BCN → solo Historiadora
    }
    if formato not in ('historia',):
        for prefix, owner_formato in DOMAIN_CHUNK_PREFIXES.items():
            if formato != owner_formato:
                filtered = [c for c in filtered
                           if not c.get('id', '').startswith(prefix)]

    # Return top N after filtering (historiador gets 6 for richer research context, reduced from 8 to cut prompt size)
    result_limit = 6 if formato == 'historia' else 5
    return filtered[:result_limit]
