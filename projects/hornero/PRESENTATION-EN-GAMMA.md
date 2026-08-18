# Hornero — 20-Slide Presentation (English, Gamma-ready)

> **How to use in Gamma:** New → "Paste in text" (or "Import" → Markdown). Each `---` is a new slide.
> The **Title** line becomes the headline; bullets become the body; the *Visual* and *Speaker note* lines are hints for you (delete them or move to speaker notes).
> Recommended Gamma settings: theme dark/earthy (greens + gold), font pair Archivo (headings) + Inter (body) to match the brand.

---

## SLIDE 1 — Cover

**Hornero**
**Sovereign AI for the working class**

- A mobile AI assistant *built by workers, for workers*
- Pilot: Argentina's Oil Workers' Federation (Federación Aceitera)

*Visual:* Hornero bird logo, dark green background, gold accent. Tagline at bottom: *"The future — something worth fighting for."*
*Speaker note:* Hornero = the ovenbird that builds its own nest, from its own materials, in its own territory. That metaphor is the whole thesis.

---

## SLIDE 2 — The problem

**AI is being built *for* the working class — never *with* it**

- Corporate AI extracts data, categories and decisions from those who use it
- Unions get "neutral" chatbots that flatten conflict and hide the source
- Dependence on Silicon Valley = losing control of the tools that shape struggle

*Visual:* Split image — extractive cloud (them) vs. a nest being built (us).
*Speaker note:* The point isn't "we need better tech." It's *who controls the tech*.

---

## SLIDE 3 — The founding thesis

**Consuming corporate AI vs. creating our own**

- A political and epistemological distinction, not a technical one
- It decides *who controls* categories, data, logic and the whole AI cycle
- Inspired by the Xiong / Tricontinental thesis on digital sovereignty of the Global South

*Visual:* Big quote layout.
*Speaker note:* "Sovereignty" here means: the working class owns the pipeline, not just the output.

---

## SLIDE 4 — What Hornero is

**A sovereign, worker-positioned AI platform**

- Mobile app (PWA) + AI assistant for unionized workers in Argentina
- Built through **co-design** with unions — not a dev team building *for* users
- Every answer comes **with its source** (article, validity, original document)

*Visual:* Phone mockup showing the app home screen.
*Speaker note:* It's a product of the labor field, running on its own data and (eventually) its own infrastructure.

---

## SLIDE 5 — What it is NOT → what it IS

**Positioning**

| It is NOT | It IS |
|---|---|
| A generic legal chatbot | A tool positioned from the worker's side |
| One union's app | A platform each union adapts |
| A PDF scraper | A living, interactive collective agreement |
| A "both sides" neutral bot | An AI that argues from the worker's position |
| A data-extracting startup | A sovereign system (data is never sold) |

*Visual:* Two-column comparison, red vs. green.

---

## SLIDE 6 — Who it's for

**Access levels (grades)**

- **A** — Open user (not necessarily a member)
- **B.a** — Rank-and-file member
- **B.b** — Shop steward / delegate
- **B.c** — Secretary / leadership
- **B.d** — Federation (full access + aggregate trends)

*Visual:* Pyramid, base to top.
*Speaker note:* Grade controls what knowledge is retrieved, what reports you see, and what actions you can take.

---

## SLIDE 7 — The 6 links of the AI value chain

**Sovereignty means controlling every link**

1. **Data** — curated, owned corpus
2. **Architecture** — how the system is built
3. **Fine-tuning** — the model's perspective
4. **Infrastructure** — where it runs
5. **Interface** — how workers use it
6. **Governance** — who decides

*Visual:* Horizontal chain of 6 links; highlight which are "sovereign today" vs. "in progress."
*Speaker note:* Today: data ✓. Model & infrastructure: still on the way.

---

## SLIDE 8 — The architecture: 3 layers, 15 nuclei

**How the ecosystem is organized**

- **Layer 1 — Foundation:** philosophy, methodology, infrastructure, protection (N1–N4)
- **Layer 2 — App:** the PWA the worker sees; a *consumer*, not a producer (N5)
- **Layer 3 — Production:** the "plant" that generates data & intelligence (N6–N15)

*Visual:* 3 stacked bands; arrows showing bidirectional flow between App and Production.

---

## SLIDE 9 — The 15 nuclei at a glance

**A modular ecosystem**

- **Foundation:** N1 Philosophy · N2 Methodology/Lab · N3 Structure · N4 Protection
- **App:** N5 Hornero App
- **Content:** N6 Union Intelligence · N7 Our Rights · N8 Labor History · N9 Who We Are · N10 Situation · N11 Corporate Behavior · N12 Your Story · N13 Worker Happiness · N14 Union Action · N15 Minimum Wage

*Visual:* 15-tile grid, color-coded by layer.
*Speaker note:* Each nucleus is a line of work that either feeds the app or is powered by it.

---

## SLIDE 10 — The app: key features

**What a worker can do**

- 💬 **Chat with 5 AI "characters"** (see next slide)
- 📰 **Clipping** — weekly curated labor news
- 📊 **InfoMate** — monthly economic briefing (real vs. official inflation)
- 📝 **Union Report** — file and escalate field intelligence
- 📚 **Labor History & Archive** — memory as an argument
- 📱 **Installable, offline-first, private by design**

*Visual:* App screenshots carousel.

---

## SLIDE 11 — Flagship: Union Intelligence

**Turning a field story into trackable intelligence — in a week**

- A base worker narrates (voice / text / photo / video)
- The AI tags it and extracts hard data → **Grade-1 report**
- It escalates: delegate → secretary → federation
- **Primary source is immutable; corrections are additive & traceable**

*Visual:* 4-step upward staircase (G1→G4).
*Speaker note:* This is intelligence produced *from below* — the opposite of corporate top-down analytics.

---

## SLIDE 12 — The AI: 7 personas

**Different experts, one worker's perspective**

- 🛠️ **The Compañero/a** — helps build union reports
- ⚖️ **The Labor Lawyer** — rights, CBAs, minimum wage
- 🎙️ **The Journalist** — podcasts, reels, columns
- 📖 **The Historian** — labor movement & memory
- 🔬 **The Class Researcher** — data on the working class
- 🐦 **Hornero** — explains the sovereign-AI ecosystem

*Visual:* 5 illustrated character portraits (assets/personajes).
*Speaker note:* Each persona has its own prompt and its own slice of the knowledge base — no "persona mixing."

---

## SLIDE 13 — Under the hood: knowledge + RAG

**Grounded answers, never improvised**

- **Knowledge base:** 316 curated chunks (union docs, agreements, history — e.g. *El encanto del tanino* / La Forestal)
- **RAG retrieval** with 5 filters: relevance → grade → validity → format → top results
- Every response cites its source; guardrails against hallucination

*Visual:* Funnel: 316 chunks → filters → top 5 → answer.

---

## SLIDE 14 — Data flow (system overview)

**Local-first on the phone, sovereign in the cloud**

```
📱 Device (PWA + IndexedDB)  ⇄  ☁️ Static content (GitHub Pages: news, briefings)
        │
        └──►  ☁️ Backend (FastAPI on Render)  ──►  🌐 LLM (GLM via DashScope) + Speech-to-Text
                     │
                     └──►  Sync + storage (reports, chat, push)
```

- Reading content is served as static files (fast, offline)
- The backend is only for AI, sync between users, and push

*Visual:* Recreate the boxes-and-arrows above as a clean Gamma diagram.

---

## SLIDE 15 — Pipeline: a chat request end-to-end

**From a spoken question to a sourced answer**

1. Voice? → **ffmpeg + Speech-to-Text** → transcript
2. No network? → **offline answer** from local knowledge
3. Online → **rate-limit → RAG (5 filters) → persona prompt → LLM (streaming)**
4. Validate JSON (1 retry if needed) → **render with citation**

*Visual:* Linear pipeline with a branch for audio and a branch for offline.

---

## SLIDE 16 — Pipeline: Union Intelligence by grade

**Field → Delegate → Secretary → Federation**

- Each grade sees **only the grade below**, within its territory
- Reports sync to the backend; visibility enforced by hierarchy
- Federation-level report = candidate for a **public product** (a deliberate political choice)

*Visual:* The G1→G4 staircase with "who sees what" callouts.

---

## SLIDE 17 — Tech stack & architecture

**Sovereign-by-design, no build tooling**

- **Frontend:** native Web Components (own micro-framework), no npm/bundler, offline-first (IndexedDB + Service Worker), Web Push
- **Backend:** Python + FastAPI proxy; keyword RAG; SQLite; deployed on Render
- **AI:** GLM-5.1 via DashScope (transitional) → **own fine-tuned model** (goal)
- **Delivery:** installable PWA on GitHub Pages

*Visual:* Clean stack diagram (frontend / backend / AI / infra).

---

## SLIDE 18 — Sovereignty scorecard

**Where we are — honestly**

- ✅ **Data sovereignty** — own taxonomy & curated corpus
- ✅ **Interface & governance** — worker-controlled, co-designed
- 🔄 **Model sovereignty** — external LLM today; own model is the goal
- 🔄 **Infrastructure sovereignty** — commercial cloud today; Argentine VPS → own server next

*Visual:* Checklist with ✅ / 🔄 badges.
*Speaker note:* We name the gaps openly — that's part of the political honesty of the project.

---

## SLIDE 19 — Funding model

**B2B2C — a political contract, not a subscription**

- **Unions are clients; workers use it for free**
- **One-time membership** (setup, digitization, corpus tagging, training) — priced by membership size
- **Monthly service** (infrastructure + maintenance) — tiered
- Accessibility: cross-subsidy between big and small unions, free onboarding months, external cooperation (Tricontinental)

*Visual:* Simple 2-part pricing graphic (Membership + Monthly).
*Speaker note:* The union enters as a co-builder, not a consumer. Numbers are preliminary.

---

## SLIDE 20 — Status & call to action

**Already live — and growing**

- ✅ PWA deployed (GitHub Pages) + FastAPI backend live (Render)
- ✅ Working AI chat, RAG, union-report flow, multi-user sync, push
- 🔄 Next: own model, sovereign infrastructure, more nuclei on demand
- **Join as a pilot / co-builder →** *Your union can create its own AI.*

*Visual:* Hornero logo + contact / QR to the app.
*Speaker note:* Close by inviting the audience's union to become the next co-designer.

---

## Appendix — Optional slides (if you need to go deeper)

- **A1. Offline-first sync** — write locally first, reconcile with last-write-wins by timestamp
- **A2. Data protection** — consent, anonymization, EXIF stripping, grade-based access
- **A3. The nuclei roadmap** — which are documented vs. built vs. planned
- **A4. Theoretical framework** — Iñigo Carrera / PIMSA class categories; minimum legal price vs. constitutional value of labor

---

### Gamma prompt (optional, to auto-generate the deck)

> Paste this into Gamma's "Generate" if you prefer AI layout:
>
> *"Create a 20-slide investor/partner deck for 'Hornero', a sovereign AI mobile app built by and for unionized workers in Argentina (pilot: Oil Workers' Federation). Dark, earthy theme (deep green + gold), headings in Archivo, body in Inter. Tone: political, confident, grounded. Follow this outline exactly: [paste slides 1–20 above]. Keep bullets short, one idea per line, add a relevant icon or simple diagram per slide."*
