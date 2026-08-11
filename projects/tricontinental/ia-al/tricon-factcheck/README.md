# Tricontinental Newsletter Fact-Check System

## Overview
Multi-agent system for fact-checking the Tricontinental Institute newsletter on AI in Latin America. Verifies every factual claim against research materials and web sources.

## Architecture

### Patterns Adopted

| Pattern | Category | Rationale |
|---------|----------|-----------|
| **COR-01** Prompt-Defined Agent | Core (Required) | Agent behavior defined by natural language blueprints |
| **COR-02** Intelligent Runtime | Core (Required) | Claude Code as intelligent execution environment |
| **STR-01** Reference Data Configuration | Structure (Required) | Research materials and methodology externalized from blueprints |
| **STR-06** Methodological Guidance | Structure (Required) | Fact-check methods, claim categories, match assessment criteria |
| **BHV-02** Faithful Agent Instantiation | Behavior (Required) | Each agent reads its own blueprint; orchestrator passes parameters only |
| **QUA-03** Verifiable Data Lineage | Quality (Required) | End-to-end traceability: every claim linked to verifiable source |
| **BHV-01** Orchestrated Agent Pipeline | Behavior (Recommended) | 4-stage pipeline: extract → verify → web-check → compile |
| **BHV-05** Grounded Web Research | Behavior (Recommended) | Fetch original web content, don't trust search snippets |
| **QUA-01** Embedded Quality Standards | Quality (Recommended) | Quality checklists embedded in each blueprint |

### Agent Pipeline

```
00.orchestrator ──→ 01.claim_extractor ──→ 02.claim_verifier ──→ 03.web_verifier ──→ 04.report_compiler
     (coordinate)      (extract claims)      (verify vs refs)     (web cross-check)     (compile report)
```

### Directory Structure

```
tricon-factcheck/
├── agents/                     # Agent Blueprints
│   ├── 00.orchestrator.md      # Pipeline coordinator
│   ├── 01.claim_extractor.md   # Extract factual claims from newsletter
│   ├── 02.claim_verifier.md    # Verify claims against research materials
│   ├── 03.web_verifier.md      # Cross-check unverifiable claims via web
│   └── 04.report_compiler.md   # Compile final fact-check report
│
├── references/                 # Reference Data
│   ├── domain/
│   │   └── newsletter-text.md  # Full newsletter text (extracted from DOCX)
│   └── methodology/
│       ├── research-overview.md      # Research goals, scope, materials index
│       ├── fact-check-methods.md     # Claim types, match categories, verification rules
│       └── output-template.md        # Report structure, format, quality checklist
│
├── workspace/                  # Runtime workspace (created during execution)
│   ├── 01.claims/              # Claim extraction output
│   ├── 02.verification/        # Research verification output
│   └── 03.web-check/           # Web verification output
│
├── _output/                    # Final deliverable
│   └── fact-check-report.md    # The fact-check report
│
└── README.md                   # This file
```

## How to Run

### Prerequisites
- Claude Code CLI or Claude Code VS Code extension
- The research materials exist at `/Users/eljaso/Workspace/projects/tricontinental/ia-al/`
- The newsletter text has been extracted to `references/domain/newsletter-text.md`

### Execution

1. **Start the Orchestrator**: Ask Claude Code to:
   ```
   Please read `agents/00.orchestrator.md` and execute strictly according to that Blueprint.
   ```

2. **The Orchestrator will**:
   - Launch the Claim Extractor (Stage 1)
   - Launch Claim Verifiers in batches (Stage 2)
   - Launch the Web Verifier for unverifiable claims (Stage 3)
   - Launch the Report Compiler (Stage 4)

3. **Monitor progress**: Check `workspace/` directories for intermediate results

4. **Get the final report**: Read `_output/fact-check-report.md`

### Individual Agent Execution (if needed)

If you want to run a specific agent independently:

```
# Extract claims only
Please read `agents/01.claim_extractor.md` and execute strictly according to that Blueprint.
Parameters: NEWSLETTER_PATH=references/domain/newsletter-text.md, OUTPUT_DIR=workspace/01.claims/

# Verify a specific batch of claims
Please read `agents/02.claim_verifier.md` and execute strictly according to that Blueprint.
Parameters: CLAIMS_FILE=workspace/01.claims/claims-list.md, CLAIM_IDS=[CLM-001-CLM-010], RESEARCH_BASE=/Users/eljaso/Workspace/projects/tricontinental/ia-al/, OUTPUT_DIR=workspace/02.verification/
```

## Adjustments

- **Add more research materials**: Place new files in `/Users/eljaso/Workspace/projects/tricontinental/ia-al/` and update the index in `references/methodology/research-overview.md`
- **Change verification rules**: Edit `references/methodology/fact-check-methods.md`
- **Change report format**: Edit `references/methodology/output-template.md`
- **Modify agent behavior**: Edit the corresponding blueprint in `agents/`
