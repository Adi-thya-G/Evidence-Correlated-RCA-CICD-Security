# System Architecture

**Evidence-Correlated Root Cause Localization for Multi-Tool Security Findings in CI/CD**

This document describes how the system is structured, how data flows through
it, and the reasoning behind key design decisions. It complements the IEEE
paper (research contribution) with the engineering view (how it's actually
built and deployed).

---

## 1. High-Level Pipeline

```
┌─────────────┐   ┌──────────────────────┐   ┌─────────────┐   ┌─────────────┐
│   Layer 1    │   │       Layer 2         │   │   Layer 3    │   │   Layer 4    │
│  Ingestion   │──▶│  Evidence Correlation │──▶│  Reasoning   │──▶│   Delivery   │
│              │   │   Engine (★ core      │   │              │   │              │
│ GitHub, CI/CD│   │   research            │   │ Existing LLM │   │  Dashboard   │
│ SonarQube    │   │   contribution)        │   │ (GPT-5/Llama)│   │  Notification│
│ Semgrep      │   │                        │   │              │   │  Deploy Gate │
│ Trivy        │   │                        │   │              │   │              │
│ Gitleaks     │   │                        │   │              │   │              │
└─────────────┘   └──────────────────────┘   └─────────────┘   └─────────────┘
```

**Layer 1 — Ingestion**
Raw findings arrive from four independent scanners plus Git/CI metadata. Each
tool has its own schema, severity scale, and vocabulary; nothing here is
normalized yet.

**Layer 2 — Evidence Correlation Engine** *(the research contribution)*
1. **Universal Parser** — normalizes all four scanner formats into one schema.
2. **Embedding + Vector Search** — each finding is embedded and compared
   against historical findings (Top-K semantic retrieval).
3. **Finding Correlation** — clusters findings that likely share a root cause,
   using 9 independent evidence signals (file, function, variable, CWE, git
   blame/diff/commit, code window, tool agreement).
4. **Git Metadata + Commit Correlation** — ranks candidate commits by causal
   likelihood using `simple-git` (blame/diff/log).
5. **Context Builder** — assembles a compact, evidence-grounded prompt for
   the LLM — this is what keeps Layer 3 cheap and accurate without
   fine-tuning.

**Layer 3 — Reasoning**
An existing LLM (GPT-5 or Llama, via API) receives the evidence-grounded
context and produces a defensible root-cause explanation. The system does
**not** fine-tune the model — quality comes from evidence quality, not model
customization.

**Layer 4 — Delivery**
Results surface via dashboard, Slack/email notification, and optionally gate
deployment on unresolved high-confidence root causes.

---

## 2. Backend Service Architecture

The backend implementing Layers 1, 2 (persistence/orchestration), and 4 is a
layered Node.js + TypeScript service:

```
Client (Dashboard / CI webhook)
        │
        ▼
┌───────────────────────────────────────────────┐
│  app.ts — middleware pipeline                   │
│  helmet → cors → rate limit → auth → routes     │
└───────────────────────────────────────────────┘
        │
        ▼
┌─────────────┐   ┌──────────────┐   ┌────────────┐
│   Routes     │──▶│ Controllers  │──▶│  Services  │
│ (validation, │   │ (thin, HTTP  │   │ (business  │
│  auth guard) │   │  glue only)  │   │  logic)    │
└─────────────┘   └──────────────┘   └─────┬──────┘
                                             │
                     ┌───────────────────────┼───────────────────────┐
                     ▼                       ▼                       ▼
              ┌────────────┐         ┌──────────────┐        ┌─────────────┐
              │  MongoDB    │         │ Vector Store  │        │  LLM API     │
              │ (findings,  │         │ (Pinecone /   │        │ (GPT-5 /     │
              │ users,      │         │  Qdrant /     │        │  Llama)      │
              │ clusters)   │         │  Milvus)      │        │              │
              └────────────┘         └──────────────┘        └─────────────┘
```

This maps directly onto the `src/modules/*` feature folders — see
`backend/README.md` for the folder-by-folder breakdown. Each module
(`auth`, `findings`, `correlation`, ...) is a vertical slice: model → service
→ controller → routes, owned together.

---

## 3. Data Flow — End to End Example

A Semgrep finding traveling through the system:

1. **CI pipeline** runs Semgrep on a PR, produces a JSON report.
2. A CI step (or webhook) `POST`s the raw finding to
   `POST /api/findings` (Layer 1 ingestion, authenticated via a
   maintainer/admin-scoped JWT — see `finding.routes.ts`).
3. `finding.service.ts` normalizes it through the Universal Parser and
   persists it (`Finding` model in MongoDB) — this is the current backend's
   scope.
4. *(Correlation module, in progress)* embeds the finding, retrieves Top-K
   similar historical findings from the vector store, gathers the 9 evidence
   signals, and clusters it with related findings from other scanners.
5. *(Correlation module)* ranks candidate commits using `simple-git` blame/
   diff against the flagged file/line range.
6. *(Reasoning module)* the Context Builder assembles a compact prompt and
   calls the LLM API for the root-cause explanation.
7. *(Delivery)* result is written back, surfaced on the dashboard, and
   optionally posted to Slack / gates the deployment.

**Current implementation status:** steps 1–3 are implemented in the backend
scaffold. Steps 4–7 are the `correlation` module scaffold (folder exists,
logic not yet built) — this is intentional since Layer 2 is the research
contribution and deserves its own design pass rather than being bolted on.

---

## 4. Security Architecture

| Concern | Mechanism |
|---|---|
| Authentication | GitHub OAuth (Passport) → JWT issuance |
| Authorization | Role-based (`admin` / `maintainer` / `viewer`) via `requireRole` |
| Transport | `helmet` (secure headers), CORS restricted to `FRONTEND_URL` |
| Abuse prevention | Two-tier rate limiting — global (100/15min) + strict on auth routes (20/15min), see `RATE-LIMITER-NOTES.md` |
| Secrets | Validated at boot via `zod` (`config/env.ts`); never committed (`.env` gitignored) |
| GitHub tokens | Stored per-user (`User.accessToken`), `select: false` by default — **production TODO:** field-level encryption at rest |
| Input validation | `zod` schemas on every mutating route (`validate.middleware.ts`) |

---

## 5. Why These Design Choices

**Feature-first modules over layer-first folders.** Once you pass ~10
endpoints, a global `controllers/`, `services/`, `models/` split scatters one
feature across three unrelated directories. Vertical slices scale better and
match how the correlation engine, findings, and auth will each grow
independently.

**Stateless JWT auth, not server sessions.** The API needs to scale
horizontally behind a load balancer eventually (multiple correlation-engine
workers, for instance) — sessions would require sticky routing or a shared
session store. JWT avoids that; `express-session` is only used transiently
during the OAuth handshake redirect.

**LLM used for reasoning only, not detection.** All four scanners already do
detection well. The system's value is in Layer 2 (evidence correlation) —
the LLM is deliberately kept "dumb" and fed a compact, evidence-grounded
prompt rather than raw noisy findings, which is what keeps explanations
defensible and avoids hallucinated root causes.

**Vector search + structured evidence, not vector search alone.** Prior work
(Vul-RAG, LLM4Vuln) uses embeddings alone for retrieval. This system pairs
semantic similarity with 9 structural/Git signals specifically because
tool-reported findings from different scanners rarely use similar wording
even when they share a root cause — pure embedding similarity under-performs
there, which is the gap this research targets (see comparative study, IEEE
slide 9).

---

## 6. Target Deployment Topology (Production)

```
                    ┌─────────────┐
                    │   CDN/WAF    │  ← edge-level rate limiting
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Load Balancer│
                    └──────┬──────┘
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Backend  │ │ Backend  │ │ Backend  │   ← stateless, horizontally scaled
        │ replica  │ │ replica  │ │ replica  │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             └─────────────┼─────────────┘
                            │
        ┌───────────┬───────────┬────────────┐
        ▼           ▼           ▼            ▼
   ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐
   │ MongoDB  │ │  Redis   │ │  Vector  │ │  LLM API  │
   │ (replica │ │ (rate    │ │  Store   │ │ (managed) │
   │  set)    │ │  limits, │ │          │ │           │
   │          │ │  cache)  │ │          │ │           │
   └─────────┘ └─────────┘ └──────────┘ └──────────┘
```

The current `docker-compose.yml` (backend + single MongoDB) is the local-dev
subset of this — Redis and multi-replica backend are not yet wired in but the
codebase (stateless JWT, no in-process session state) is designed so adding
them later doesn't require refactoring the auth or routing layers.

---

## 7. Open Design Questions (tracked, not yet decided)

- **Vector store choice** — Pinecone (managed, simplest) vs Qdrant/Milvus
  (self-hosted, cheaper at scale, more ops burden). Currently Pinecone in
  `package.json` as the default; swappable since it's isolated behind
  `correlation.service.ts`.
- **Embedding model** — general sentence-transformer vs. a code-specific
  embedding model (better for matching similar vulnerable code patterns
  across scanners, per SAGE, slide 8).
- **Correlation clustering algorithm** — exact method for combining the 9
  evidence signals into one ranked score is the actual research contribution
  and deserves a dedicated design doc once the approach is finalized.