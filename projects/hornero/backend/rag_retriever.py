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
}


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
            " ".join(chunk["tags"])
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
    # --- Categorías por tipo de fuente ---
    "academico": ["libro", "articulo", "paper", "investigacion", "academico", "universidad",
                  "forestal", "masacre", "lockout", "historia", "referente", "lafuente",
                  "antropologica", "concesion", "genocidio", "memoria", "verdad", "justicia",
                  "reparacion", "testimonio", "pueblo originario", "despojo", "territorio",
                  "cordobazo", "viborazo", "tampierazo", "argentinazo", "santiagueñazo",
                  "cgta", "efemeride", "aniversario", "conmemoracion", "1 de mayo", "tosco",
                  "rucci", "ongaro", "reforma", "dnu", "ley bases", "flexibilizacion"],
    "prensa": ["periodico", "comunicado", "volante", "editorial", "discurso", "opinion",
               "trabajador aceitero", "el trabajador aceitero", "desmotador", "posicion",
               "gremial", "ftciod", "foeiap", "federacion aceitera", "nota", "columna",
               "prensa oficial", "boletin sindical", "comunicado gremial"],
    "noticias": ["noticia", "recorte", "medio", "informacion", "actualidad",
                 "sonido gremial", "infogremiales", "cronica", "diario", "pagina 12",
                 "clipping", "agencia", "teleshow", "prensa comercial", "la nacion",
                 "clarin", "ambito financiero", "cronista", "telam"],
    "documentos": ["convenio", "cct", "convenio colectivo", "basico", "categoria",
                   "paritaria", "aumento", "negociacion", "oferta", "salarial",
                   "smvm", "salario minimo", "piso legal", "minimo vital",
                   "sindicato", "organizacion", "asamblea", "delegado", "huelga",
                   "art", "seguridad", "enfermeria", "accidente", "salud",
                   "clase obrera", "clase trabajadora", "ejercito", "reserva",
                   "ice", "ift", "panorama", "condicion", "como somos",
                   "cremonte", "canasta"],
    "audiovisual": ["podcast", "video", "documental", "docuficcion", "ilustracion",
                    "audio", "radio", "spotifi", "youtube", "multimedia"],
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


def keyword_search(query: str, max_chunks: int = 5, tenant: str = "aceiteros") -> list:
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

    raw_terms = query.lower().split()
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

    if not all_terms:
        return []

    idf = _get_idf()

    # Detect which categories are relevant to the query
    query_lower = query.lower()
    relevant_categories = set()
    # Merge CATEGORY_KEYWORDS with tenant-specific keywords
    merged_cat_keywords = dict(CATEGORY_KEYWORDS)  # copy base
    tenant_kws = TENANT_KEYWORDS.get(tenant, [])
    # Add tenant keywords to the "documentos" and "prensa" categories
    if tenant_kws:
        for cat_key in ("documentos", "prensa"):
            existing = merged_cat_keywords.get(cat_key, [])
            merged_cat_keywords[cat_key] = existing + tenant_kws
    for cat, keywords in merged_cat_keywords.items():
        for kw in keywords:
            if kw in query_lower:
                relevant_categories.add(cat)
                break

    # Filter chunks by tenant (same pattern as library_service: own ∪ shared)
    tenant_chunks = [c for c in ALL_CHUNKS
                     if c.get("tenant", "aceiteros") in (tenant, "shared")]

    scored = []
    for chunk in tenant_chunks:
        # Build searchable text with different fields for weighted scoring
        title_lower = chunk["title"].lower()
        text_lower = chunk["text"].lower()
        tags_lower = " ".join(chunk["tags"]).lower()
        sources_lower = " ".join(chunk.get("sources", [])).lower()
        quotes_lower = " ".join(q.get("text", "") for q in chunk.get("quotes", [])).lower()

        # Combine all searchable text
        searchable = (title_lower + " " + text_lower + " " + tags_lower + " " + sources_lower + " " + quotes_lower)

        # TF-IDF scoring: sum of IDF weights for matching terms
        score = 0.0
        for t in all_terms:
            if t in searchable:
                score += idf.get(t, 0.5)  # Default IDF for unknown terms

        # Title bonus: +3 per matching term in title (strong signal)
        for t in all_terms:
            if t in title_lower:
                score += 3.0

        # Tag bonus: +2 per matching term in tags (curated, high signal)
        for t in all_terms:
            if t in tags_lower:
                score += 2.0

        # Category bonus: +3 if chunk category matches detected query category
        chunk_category = chunk.get("category", "").lower()
        if chunk_category in relevant_categories:
            score += 3.0

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
    candidates = keyword_search(enhanced_query, max_chunks=8, tenant=tenant)

    # Step 3: Grade filtering
    filtered = [c for c in candidates if grade_satisfies(grade, c.get("grade_access", "open"))]

    # Step 4: Vigencia filtering — only show vigente content
    filtered = [c for c in filtered if c.get("vigencia", "vigente") == "vigente"]

    # Step 5: Formato-based filtering — avoid cross-persona contamination
    # Each persona has its own domain. Chunks from other domains can confuse the LLM
    # and cause it to switch personas mid-conversation.
    FORMATO_CATEGORY_MAP = {
        'panorama':   {'academico', 'documentos', 'noticias'},               # Investigador: data, indices, research
        'consulta':   {'documentos', 'academico'},                           # Abogado: legal, CCT, rights
        'debate':     {'documentos', 'academico', 'noticias'},               # Compañero: org, struggle, reports
        'reporte':    {'documentos', 'academico', 'noticias'},               # Compañero (report mode)
        'historia':   {'academico', 'prensa', 'audiovisual', 'documentos'},  # Historiador: history, referents, press
        'contenido':  {'prensa', 'academico', 'noticias', 'audiovisual'},    # Periodista: content production, union press
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

    # Return top 5 after filtering (increased from 3 for better context)
    return filtered[:5]
