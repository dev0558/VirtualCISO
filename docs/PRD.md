# PRD summary and implementation status

Source: *PRD: AI Compliance Automation Platform with vCISO* (20 pages). Frameworks: ISO/IEC
27001:2022 and NIST CSF 2.0. This file tracks what the code delivers against each requirement.

| PRD requirement | Status | Where |
|---|---|---|
| Auth with MFA; roles client_admin / vciso / auditor | Done — built-in auth (Argon2 + TOTP), PRD-sanctioned alternative to Clerk/Auth0 | `routers/auth.py`, `deps.py` |
| Multi-tenant, PostgreSQL RLS, cross-tenant tests | Done | `db/migrations/versions/0001_initial.py`, `tests/test_tenant_isolation.py` |
| Connectors: M365/Entra, Google Workspace, GitHub (read-only) | Done (+ demo connector with recorded fictional data) | `packages/connectors` |
| 25–30 automated checks | 28 checks, data-driven | `seed/checks.yaml` |
| Scheduler: daily + on demand | Done (Celery beat 02:00 UTC) | `vciso_api/tasks.py` |
| Evidence: timestamp, sanitized payload, SHA-256, object storage | Done (identities masked) | `services/engine.py`, `services/storage.py` |
| Control mapping & per-framework score | Done (category-level NIST) | `services/state.py`, `seed/frameworks.yaml` |
| Dashboard: coverage, failing controls, fix guidance, task assignment | Done | `apps/web/src/app/app/[orgId]` |
| AI policy generator (5 policies, versions, approval) | Done | `ai/policies.py`, `routers/policies.py` |
| Questionnaire upload CSV/XLSX, cited answers, low-confidence flags | Done | `ai/questionnaire.py` |
| AI guardrails (tenant-only retrieval, citations, human approval) | Done | `ai/rag.py`, `ai/llm.py` |
| Risk register (L×I, owner, treatment, templates) | Done | `routers/vciso.py`, `seed/risk_templates.yaml` |
| 90-day roadmap from failing controls and risks | Done (rules-based) | `services/roadmap.py` |
| AI leadership report, vCISO review/approval | Done (+ PDF) | `ai/reports.py` |
| Multi-client view | Done | `/app/clients`, `GET /orgs` |
| Auditor read-only role, PDF + CSV export | Done | `services/exports.py` |
| Audit log of sensitive actions | Done | `services/audit.py` |
| Evaluation set of 30 questions | Done | `apps/api/evals/questionnaire_eval.py` |
| One Playwright end-to-end flow | Done | `apps/web/e2e/` |
| CI: lint, type-check, tests, dependency scan | Done | `.github/workflows/ci.yml` |

Deviations: MinIO → SeaweedFS for local S3 (MinIO stopped publishing community images; same S3
API). Embeddings use a local hashing embedder + BM25 hybrid ranking (no extra vendor; swap-in
point documented in `ai/embeddings.py`).
