"""Phase 1 RAG retriever — keyword-based search + grade/vigencia filtering.

No vector DB, no embeddings. Works on current Render infrastructure.
Selects relevant KB chunks based on keyword overlap with user query.

Migration path: Phase 4 adds semantic search (FAISS + pre-computed embeddings)
when VPS with persistent disk is available.
"""

from kb_data import ALL_CHUNKS, KB_CHUNKS


# ===== Grade hierarchy for access filtering =====

GRADE_ORDER = ["A", "B.a", "B.b", "B.c", "B.d"]


def grade_satisfies(user_grade: str, required_grade: str) -> bool:
    """Check if user_grade >= required_grade for access."""
    if required_grade == "open":
        return True
    try:
        return GRADE_ORDER.index(user_grade) >= GRADE_ORDER.index(required_grade)
    except ValueError:
        return False  # Unknown grade = no access


def keyword_search(query: str, max_chunks: int = 3) -> list:
    """Simple keyword search: find KB chunks that match query terms.

    Returns top-N chunks by keyword overlap score.
    Score = number of query terms found in chunk (title + text + tags).
    """
    if not query or not query.strip():
        return []

    terms = query.lower().split()
    # Filter out very short terms (1-2 chars) and common stopwords
    stop_words = {"que", "el", "la", "los", "las", "un", "una", "de", "del",
                  "en", "es", "se", "no", "si", "yo", "me", "mi", "tu",
                  "te", "nos", "les", "y", "o", "a", "al", "por", "para",
                  "con", "sin", "como", "más", "mas", "muy", "hay", "pero",
                  "esta", "este", "esto", "eso", "esa", "ese", "ser", "son",
                  "fue", "era", "ha", "han", "he", "bien", "sobre", "entre"}
    terms = [t for t in terms if len(t) > 2 and t not in stop_words]

    if not terms:
        return []

    scored = []
    # Use ALL_CHUNKS (manual + PDF-extracted) for broader search
    for chunk in ALL_CHUNKS:
        # Build searchable text from title + text + tags
        searchable = (
            chunk["title"] + " " +
            chunk["text"] + " " +
            " ".join(chunk["tags"])
        ).lower()

        # Count matching terms
        score = sum(1 for t in terms if t in searchable)

        # Bonus: exact title match (big signal)
        title_lower = chunk["title"].lower()
        for t in terms:
            if t in title_lower:
                score += 2  # Title match = strong signal

        if score > 0:
            scored.append({**chunk, "relevance_score": score})

    # Sort by score descending, return top N
    scored.sort(key=lambda x: x["relevance_score"], reverse=True)
    return scored[:max_chunks]


def retrieve_for_query(query: str, formato: str, grade: str = "A") -> list:
    """Main RAG retrieval: select relevant KB chunks for a user query.

    Phase 1 logic:
    1. Keyword search on query
    2. Grade-based filtering (remove chunks user shouldn't see)
    3. Vigencia filtering (remove derogated content)
    4. Return chunk IDs for selective prompt injection

    If no chunks match, return empty (the persona + principles are always included).
    """
    # Step 1: Keyword search
    candidates = keyword_search(query, max_chunks=5)

    # Step 2: Grade filtering
    filtered = [c for c in candidates if grade_satisfies(grade, c.get("grade_access", "open"))]

    # Step 3: Vigencia filtering — only show vigente content
    filtered = [c for c in filtered if c.get("vigencia", "vigente") == "vigente"]

    # Return top 3 after filtering
    return filtered[:3]
