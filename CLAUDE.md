# SecuraVantage — AI Compliance Automation Platform with vCISO

Source of truth for scope: `docs/PRD.md` (summarised from the PRD PDF). The original AI Studio
prototype lives in `buildit/` and is kept only as a UI reference — do not run or extend it.

## Stack (do not change without approval)
- `apps/web` — Next.js (App Router) + TypeScript + Tailwind CSS 4 (UI ported from `buildit/`)
- `apps/api` — Python 3.12, FastAPI, SQLAlchemy 2, Alembic, Pydantic v2
- `apps/worker` — Celery + Redis (daily + on-demand check runs)
- `packages/connectors` — read-only connectors: Microsoft Graph, Google Admin SDK, GitHub REST
- PostgreSQL 16 + row-level security + pgvector; S3-compatible object storage for evidence (SeaweedFS locally); Claude API for AI
- `seed/` — frameworks, controls, checks, mappings, policy templates (data, not code)

## Non-negotiable rules
1. Every tenant-owned table has `organization_id` and a PostgreSQL RLS policy keyed on
   `current_setting('app.org_id')`. The API connects as the non-owner role `vciso_app`
   and sets tenant context per request (`vciso_api/db.py`). Cross-tenant tests live in
   `apps/api/tests/test_tenant_isolation.py` and must keep passing.
2. Connectors are read-only and least privilege. Never request write scopes. Credentials are
   Fernet-encrypted at rest; never log secrets, tokens or raw personal data.
3. No passwords/secrets in code, seed data or fixtures. Use env vars and `.env.example`.
4. AI only retrieves from the requesting tenant's data, every output carries citations and a
   confidence flag, and stays `draft` until a human approves it. Never claim certification.
5. Controls, checks and mappings are data in `seed/*.yaml`. Adding a check that uses an
   existing fact must not require code changes.
6. Every sensitive action writes `audit_log` (who, what, when, tenant) via `services/audit.py`.
7. Validate input, parameterised queries only, handle empty/error/permission-denied states.
8. Write tests alongside features; `make test` must pass and `docker compose up` must run.
9. Out-of-scope ideas go to `docs/future.md`, not into code.
10. Only fictional sample data in tests and demos.

## Commands
- `make up` — build and start everything (web :3000, api :8000, S3 :8333)
- `make seed` — load control library + fictional demo tenants
- `make test` — API tests (needs the compose Postgres running)
- `make eval` — questionnaire AI evaluation (30 questions)
