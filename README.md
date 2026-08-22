Evidence-Correlated RCA for CI/CD Security Findings

Evidence-based correlation and root-cause localization system for multi-tool CI/CD security findings (SonarQube, Semgrep, Trivy, Gitleaks) — normalized into one schema, embedded for semantic similarity search, enriched with Git evidence (blame/diff/commit), and explained by an LLM with a compact, evidence-grounded prompt.


## Status
🚧 MCA Capstone Project — Phase 1 (in progress)

## Features
- **Normalize** — Universal Parser unifies SonarQube, Semgrep, Trivy, Gitleaks output
- **Embed & Retrieve** — vector embeddings + Top-K semantic similarity search
- **Correlate** — 9-signal evidence correlation, candidate commit ranking
- **Localize** — LLM (GPT-5 / Llama) generates evidence-grounded root-cause explanation
- **Route to Owner** — routes each finding to the commit author via git blame
- **Blast-Radius Prioritization** *(planned)* — flags findings affecting many dependent
  components as high-alert, resolved first
- **Deliver** — React dashboard, Slack/Email alerts, optional deployment gate


## Tech Stack
| Layer | Tech |
|---|---|
| Backend | Node.js, Express, TypeScript |
| Frontend | React, TypeScript |
| Database | MongoDB |
| Vector Store | Pinecone / Qdrant / Milvus |
| Security Scanners | SonarQube (SAST), Semgrep (SAST), Trivy (SCA), Gitleaks (Secrets) |
| Version Control / CI | GitHub, GitHub Actions / Jenkins |
| Git Interface | simple-git (blame, diff, log) |
| Data Validation | Zod |
| LLM | GPT-5 / Llama (via API) |
| Delivery | Dashboard UI, Slack / Email notifications |