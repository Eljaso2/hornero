# Building a Sovereign Union AI: A Methodological Account of Hornero's Knowledge Engine

*A technical case study, written to be read by engineers and by the organizers who will use the tool.*

---

## Abstract

This document reconstructs, step by step, how we built the knowledge engine at the heart of
**Hornero** — an artificial-intelligence assistant owned and operated by a labour union. The
engine is a **legal Library coupled to a retrieval-augmented generation (RAG) system**: it lets
the union's "Lawyer" answer a worker's question with the *real* law and collective-bargaining
agreement, citing the specific article, for one union or for many at once. Rather than present a
finished architecture, we narrate the *reasoning* behind each decision, including the dead ends.
Three commitments organize the account: that the union should **build** its AI rather than merely
consume one built elsewhere; that every legal claim must be **grounded** in a verifiable source
or honestly withheld; and that many unions must be served from one system without any of them
seeing another's data. The central empirical finding is that *retrieval was never the hard part
— attention was*: a capable language model, given the correct legal article, still cited the
wrong one from memory until the surrounding prompt was redesigned. We report that finding, the
fix, and the reproducible pipeline that resulted (737 legal articles across seven norms and three
unions, on a durable Postgres store).

> **Companion documents.** Spanish version: `CONSTRUCCION-PASO-A-PASO-ES.md`. Product overview:
> `DOCUMENTACION-COMPLETA.md`. Interactive visual explainer: `how-hornero-works-EN.html`.
> **Scope.** `backend/library_service/` and its integration into `backend/main.py`, August 2026.

---

## 1. Motivation: why a union builds its own AI

Most organizations *consume* artificial intelligence assembled by someone else; the model, the
data that trained it, and the rules that govern it all belong to a distant vendor. Hornero begins
from the opposite premise — that a union can **build** and **govern** its own assistant — and
treats that premise as a design constraint rather than a slogan. It is useful to think of any AI
system as a chain of six links: the *data*, the *model architecture*, the *fine-tuning*, the
*infrastructure*, the *interface*, and the *governance*. Dependence means another party holds all
six; sovereignty means the organization holds the decisive ones and knows precisely where it still
depends. Every choice below is judged against that chain.

This framing has a concrete methodological consequence. We did not start from a fashionable tool
and look for a use; we started from the union's problem and asked which link most constrained it.

### 1.1. Principles that governed the work

Five principles recur throughout, and it is worth stating them before the narrative so the reader
can see them operating:

1. **Problem first, not tool first.** Audit the existing system before writing a line of code.
2. **Reversibility.** Every change sits behind a *feature flag* and is additive; switched off, the
   system is byte-for-byte what it was. One never breaks what already works to add what might.
3. **Grounding over fluency.** A legal answer without the article citation is worse than no answer,
   because it is confidently wrong. The system must cite its source or admit it lacks one.
4. **Isolation between unions.** No union may ever see another's collective agreement or reports.
5. **Honest iteration.** When something fails — and the most important step below is a failure —
   document the finding and attack the cause, rather than paper over the symptom.

Each step that follows was executed as a small cycle: state the problem, design the minimal
response, implement it (using only the standard library where feasible, to minimize dependencies),
test it end to end against a *real* query, and record the outcome, failures included.

---

## 2. Diagnosis: reading the existing system before changing it

The first step wrote no code. We read Hornero's pipeline end to end — the request handling in
`backend/main.py` and the retrieval in `backend/rag_retriever.py` — precisely because one cannot
improve what one has not understood. Four findings shaped everything after.

The system had **no authentication**: a user's identity and hierarchical grade arrived inside the
request and were trusted as sent. Its storage was **ephemeral** — a SQLite file that Render, the
hosting platform, discards on every redeployment. It had **no notion of a union**: all knowledge
was a single global pool, making it impossible to separate one sindicato from another. And its
retrieval was **keyword-based**: a term-frequency score over a global chunk list, with no real
statute behind it and no article to cite.

The conclusion was clarifying. The bottleneck was not the interface, which was already polished and
thoughtful, but the **knowledge engine**. That is where the work went: a real, multi-union legal
library capable of exact citation.

---

## 3. Designing the Library as the core

A lawyer does not improvise; a lawyer cites the article. The retrieval system had to do the same,
and that single requirement drove the design. We made the **article** — not an arbitrary paragraph
— the unit of retrieval, so that "Article 245 of the Employment Contract Law" could be located and
quoted precisely. We attached to every article two labels that make multi-union service possible:
a `tenant` (which union it belongs to) and a `capa`, or *layer* (either `general`, shared by all,
or `sectorial`, specific to one union). From these follows a single visibility rule that recurs
throughout the system: **a union sees its own collection together with the shared layer**, and
nothing else.

The retrieval contract that the rest of the system depends on is deliberately narrow —
`search(query, k, filters)` — and resolves in a fixed order of preference: an **exact article
citation** first, a **semantic** match if vector embeddings are available, and a **lexical** match
otherwise. The data schema is correspondingly simple:

```
id · tenant · capa · tipo · norma · articulo · vigencia · titulo · texto · fuente · updated_at · vec
```

---

## 4. The chunker: splitting a statute into articles

**File:** `library_service/chunker.py`

Converting a web page of legal text into clean, article-sized pieces is less trivial than it
sounds, because Argentine statutes are not typographically consistent. The same corpus mixes two
notations — `Art. 245.` and `ARTÍCULO 245°` — and neither a single regular expression nor a naïve
split survives both. The chunker therefore carries two patterns and, for each norm, chooses the
**dominant** one (whichever matches more often), handles the ordinal suffixes `bis`, `ter`, and
`quáter`, and treats the body of an article as the text lying between one heading and the next.

Two robustness problems surfaced later (and were fixed under §12, but belong here conceptually).
Legal sources disagree on character **encoding**: the government's InfoLeg site serves Windows-1252,
while modern union sites serve UTF-8. Forcing one decoding corrupts the other into *mojibake* (the
tell-tale `â€"` where a dash should be), so the fetcher now honours the declared charset, then tries
strict UTF-8, and only then falls back to Windows-1252. Separately, some pages embed machine-readable
`JSON-LD` inside `<script>` tags; stripping scripts and styles *before* extracting text prevents that
structured metadata from leaking into an article's body.

---

## 5. The scraper: fetching the real law

**File:** `library_service/scraper.py`

The library must hold the **official** text of a statute, not a summary of it, because the value of
the whole system is that a worker can verify the citation. The scraper is a small, parameterized
registry: each norm is one entry naming its URL, type, layer, and tenant, and adding a law is
literally adding a line. The **general** layer — the law that applies to every worker regardless of
union — was populated from verified InfoLeg pages: the Employment Contract Law (LCT 20.744) and the
statutes on working hours (11.544), trade unions (23.551), employment (24.013), and workplace risk
(24.557). Each norm flows through the same pipeline: fetch the page, reduce it to text, and split it
into articles with the correct layer and tenant attached.

---

## 6. The store, and later its durability

**File:** `library_service/library.py`

The store exposes a deliberately small surface: `upsert` to add or update articles idempotently,
`fetch` to retrieve them while enforcing the union-plus-shared visibility rule, `stats` for totals,
and `search` for the retrieval contract of §3. It began as SQLite, which needs no infrastructure and
is ideal for building and testing locally.

Durability, however, was one of the four original diagnoses, and §14 returns to close it. The same
file was later made **dual-backend**: it uses SQLite by default and **Postgres** whenever a database
URL is configured, with a small helper translating the two dialects' placeholder syntax and the schema
adapting its column types. The two backends share one contract, so nothing above them had to change —
an instance of the reversibility principle applied to infrastructure itself.

---

## 7. Retrieval without embeddings: exact citation, lexical score, and LLM expansion

**Files:** `library_service/library.py`, `library_service/expander.py`

Ideally a legal search would be *semantic* — matching meaning rather than words — but that requires
vector embeddings, and (as §15 recounts) no working embedding service was available. Retrieval had to
be good regardless, so it combines three complementary signals. First, an **exact citation** shortcut:
if the worker's question already names "art. 245", that article is returned with top priority. Second,
a classical **lexical** score (term-frequency–inverse-document-frequency, or TF-IDF), which rewards
overlap between the question's words and an article's text, weighting the title more heavily.

The third signal addresses the classical weakness of lexical search — **synonymy**. A worker asks about
"hora extra" (overtime), but the statute speaks of "horas suplementarias" (supplementary hours); the
words differ though the meaning is identical. Rather than reach for embeddings, we used the language
model itself to **expand** the query into its legal synonyms *before* searching. This is an
inexpensive, infrastructure-free stand-in for semantic retrieval, and it proved sufficient: in this
mode the system already returns the correct articles. The semantic path remains wired but dormant,
waiting only for embeddings to be populated.

---

## 8. The model: a sovereign, non-US language model

**File:** `library_service/expander.py` (and the answer path)

Consistency with the sovereignty thesis meant not routing the union's questions through the United
States' AI stack. We used **GLM-5.2**, a Chinese model served through Alibaba's cloud with an API that
is compatible with Anthropic's message format, which let us treat it as a drop-in.

One property of the model shaped the code. GLM-5.2 is a **reasoning model**: it emits an internal
`thinking` block before its visible answer, and if the token budget is too small it exhausts that
budget while reasoning and never produces the answer at all. Recognizing this — the first responses
came back empty — we raised the budget and extracted only the final answer blocks. The episode is a
reminder that "the model returned nothing" is often a statement about configuration, not capability.

---

## 9. Proof of concept: the standalone Lawyer

**File:** `library_service/ask.py`

Before touching the production system, we validated the whole idea in isolation. `ask.py` performs the
entire loop in miniature: it takes a question, retrieves the relevant articles from the library,
assembles a **focused** prompt — *you are the union Lawyer; answer only from these articles; cite the
number* — and asks the model. For "can they force me to work overtime?" it answered by citing Article
197 bis and Article 201 of the Employment Contract Law (the voluntariness of overtime and its
surcharges), inventing nothing. That small success established the pattern the rest of the system would
follow: **retrieve, focus, answer with a citation.** It also, unknowingly, contained the answer to a
problem we had not yet hit — a point we return to in §12.

A single query illustrates the data as it travels the finished pipeline:

```
query:  "how much is my overtime paid?"   ·   sector: aceitero (oil worker)
   → resolve_tenant           → tenant = "aceiteros"
   → search(...)              → [CCT 420/05 Art.27, Art.29, LCT 201, ...]   (union ∪ shared)
   → focused prompt + articles
   → GLM-5.2
   → "Art. 27 CCT 420/05: a 100% surcharge, any day of the week..."   (cited, not hallucinated)
```

---

## 10. Integration into the running system, behind a flag

**Files:** `library_service/adapter_hornero.py`, `backend/knowledge_base.py`, `backend/main.py`

Integrating the library into the live assistant met an architectural obstacle worth dwelling on.
Hornero injects knowledge into its prompts **by identifier**, looking up each chunk's text in a global
table; the library's articles do not live in that table. The correct hook, therefore, was not to
*replace* the existing retrieval but to *contribute* the already-formatted legal text as an additional
block in the Lawyer's prompt — a smaller, additive change that leaves the original path intact.

The result respects reversibility completely. A bridge function returns a formatted legal block or an
empty string; the prompt builder appends it only if present; the endpoints call the bridge only for the
Lawyer persona, so no other voice is contaminated. With the feature flag off, the block is empty and the
prompt is byte-for-byte what it was. Should the library be unreachable, the bridge returns empty and the
conversation simply continues on the original knowledge base. Nothing that worked can be broken by this
addition.

---

## 11. Making the union travel in the request

**Files:** `backend/main.py`, `library_service/adapter_hornero.py`

Serving many unions from one deployment requires the system to know *which* union is asking. We added an
explicit `tenant` to the request and derived it, when absent, from the `sector` field the client already
sent, centralizing the mapping in one function so that every entry point resolves the union the same way.
Each request then sees only its union's collection together with the shared law.

A candid security note belongs here. Because Hornero still has no authentication, the union identity is
presently *trusted from the client*. That is acceptable for a demonstrator but not for production, where
the tenant must be **bound to an authenticated session** — otherwise one union could request another's
agreement. The limitation is written into the code as a comment, not left implicit, and closing it is the
first task of the project's next phase.

---

## 12. The central finding: retrieval was solved; attention was not

This is the most important step, and it began as a failure. Asked about overtime in the oil industry, the
assistant kept citing the *general* law (Article 201) from memory and ignoring the *sectorial* agreement
(Article 27 of CCT 420/05) — even though that article had been correctly retrieved and placed in its
context. We eliminated the obvious suspects one by one: the library had retrieved the right article; the
tenant logic was correct; query expansion had surfaced the article. None of them was to blame.

The cause was **prompt dilution**. The Lawyer's full persona ran to some fourteen thousand characters of
rich narrative; against that expanse, the legal block appended at the end was underweighted, and the model
fell back on its training prior. Strikingly, four successive attempts to *strengthen the instruction* did
not fix it — the model kept obeying the surrounding voice rather than the injected law. What settled the
diagnosis was §9: the standalone `ask.py`, using the *same model*, cited correctly. The only difference
was the size and focus of the prompt.

The fix followed directly. For legal queries we now assemble a **short, focused prompt** — a brief Lawyer
identity, a strict grounding rule, the confidentiality constraint, the required output format, and the
retrieved law placed *last* so that recency works in its favour — instead of burying the law inside the
mega-persona. The switch is itself reversible: with the library active the focused prompt is used; without
it, the full persona is untouched. The assistant then began citing Article 27 of the agreement, its
hundred-percent surcharge, and even the long-haul-transport article, with no hallucination. The general
lesson outlives this project: **when a capable model will not obey an instruction, suspect the context
that surrounds the instruction, not only the instruction itself.**

---

## 13. Each union's own agreement

The multi-union promise is only real if each union cites *its* agreement, so we ingested two. The oil
workers' CCT 420/05 (fifty-five articles) came from an HTML source, sparing us the optical-character
recognition a PDF would have demanded; with it, the Lawyer correctly reasons that the agreement's overtime
article *prevails over* the general law when it improves on it. The commerce employees' CCT 130/75 (a
hundred and seven articles) came from a UTF-8 page and, in doing so, justified the encoding work of §4.
The isolation guarantee was then verified from both sides: commerce cannot see the oil agreement, and the
oil workers cannot see the commerce agreement. Multi-union service is not a claim here but a demonstrated
property.

---

## 14. Data quality: exorcising phantom articles

A subtle corruption appeared in the corpus. InfoLeg pages for a given law often reproduce the text of
*other* laws that it amends, and the chunker was capturing those quoted articles as though they belonged to
the host law — producing, for instance, a spurious "Article 245 of Law 24.013" carrying the text of Article
245 of the Employment Contract Law, which caused the Lawyer to occasionally mislabel the source. The remedy
exploited a structural regularity: genuine articles run contiguously (1, 2, 3, …), whereas a phantom appears
as an isolated high number *after a large gap*. Detecting that gap flagged six phantoms across three laws,
each inspected by hand before deletion — a small, auditable cleanup that measurably improved citation
accuracy.

---

## 15. Durability, delivered

With the corpus clean, we closed the persistence debt from §2 by migrating to Postgres. Because the store had
been designed dual-backend, the migration changed no calling code; an idempotent script copied all 737
articles into a durable database, and the live backend, now reading from Postgres, continued to cite the
sectorial agreement exactly as before. The `pgvector` extension is present but unused for now: the vector
column is stored as raw bytes until embeddings exist, since a native vector column must commit to a dimension
that only a chosen embedding provider will fix. Migrating to that native type is the natural optimization once
semantic search comes online.

---

## 16. Why semantic search waits, and the sovereign way to enable it

It is worth being explicit that the system today retrieves in *lexical-plus-expansion* mode and already cites
correctly; semantic search is an enhancement, not a prerequisite. It waits because embeddings require a working
vectorization service, and none was available: every embedding key supplied returned an authentication or
not-found error, and even the chat token that *does* work has no embedding model in its plan (its endpoint
accepts the credential but offers only chat, image, and audio models).

The recommended path is, fittingly, the sovereign one. Rather than depend on any foreign embedding API, Hornero
can run a small **local** multilingual embedding model — an ONNX model of roughly a hundred megabytes, needing no
key and running offline. This keeps even the vectorization link of the value chain under the union's control, and
the store's `embed_index` routine already stands ready to populate the vectors, at which point the column migrates
to native `pgvector`.

---

## 17. Discussion: what this build teaches

Three lessons generalize beyond Hornero. The first is that **grounding is an attention problem, not only a
retrieval problem.** Much of the RAG literature concentrates on fetching the right passage; our experience is that
fetching it is necessary but not sufficient, because a long, characterful system prompt can drown a correct passage
placed within it. The practical corollary — a short, focused prompt for the task that most needs faithfulness —
is cheap and effective.

The second is that **reversibility is what makes iteration on a live system safe.** Because every change was a flag
away from being undone, we could integrate an unfinished library into a working assistant, discover the grounding
failure in situ, and repair it, without ever risking the interface the union already relied on.

The third is that **sovereignty and engineering pragmatism converged more often than they conflicted.** The
non-US model, the HTML-over-PDF sources, the infrastructure-free query expansion, and the proposed local embeddings
were each, independently, the *simpler* choice as well as the more sovereign one — a reassurance that the political
commitment did not tax the technical one.

## 18. Conclusion

We set out to move a union's assistant from a keyword search over a global pool to a grounded, multi-union legal
engine that cites real statutes and agreements. The result is a durable Postgres-backed library of 737 articles
across seven norms and three unions, integrated reversibly into the running system, answering through a sovereign
model with verifiable citations and demonstrated isolation between unions. The honest edges remain marked:
authentication and session-bound tenancy are the next phase, and semantic search awaits a sovereign local embedder.
The method that produced this — diagnose before building, keep every change reversible, cite or admit but never
invent, and record the failures as carefully as the successes — is offered here as the most transferable result of
the work.

---

## Appendix A — File map

```
backend/
├── main.py                     # endpoints; legal-block injection + focused prompt
├── knowledge_base.py           # get_system_prompt_rag(extra_sources_text), get_legal_prompt_focused
├── rag_retriever.py            # original keyword RAG (intact, fallback)
└── library_service/
    ├── chunker.py              # split law by article (two notations, encoding, script-strip)
    ├── scraper.py              # SOURCES registry (InfoLeg + CCT); fetch→chunk
    ├── library.py              # dual SQLite/Postgres store + retrieval (citation/lexical/semantic)
    ├── expander.py             # query expansion with GLM (embeddings alternative)
    ├── embeddings.py           # embeddings hook (configurable provider)
    ├── ask.py                  # standalone Lawyer (full RAG)
    ├── adapter_hornero.py      # bridge: legal_sources_text() + resolve_tenant()
    ├── server.py               # HTTP service :8010 (health/stats/search/ingest)
    ├── seed.py                 # initial seeding
    ├── demo_multitenant.py     # isolation test
    ├── migrate_pg.py           # SQLite → Postgres migration
    └── keys.env                # secrets (gitignored)
```

## Appendix B — Corpus status
**737 articles · 7 norms · 3 unions.** General / `shared`: LCT 20.744 and Laws 11.544, 23.551, 24.013, 24.557.
Sectorial: CCT 420/05 (oil workers), CCT 130/75 (commerce).

## Appendix C — How to run it
```bash
# 1) Library as a service (optional)
cd backend/library_service && python3 server.py           # :8010

# 2) Hornero backend with the library enabled
cd backend
python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
export LIBRARY_INPROC=1                                   # or LIBRARY_URL=http://localhost:8010
export LIBRARY_DB_URL=postgresql://127.0.0.1:5432/hornero # optional: durability
uvicorn main:app --port 8000
# POST /api/chat {"message":"how much is my overtime paid?","formato":"consulta","sector":"aceitero"}
```

## Appendix D — The principles, in one line each
Problem first · Reversibility through flags · Cite or admit, never invent · Isolation between unions ·
Sovereignty at every link · Honest iteration, failures documented.
