# SecuraVantage — AI Compliance Automation Platform with vCISO

Readiness platform for **ISO/IEC 27001:2022** and **NIST CSF 2.0**. It connects read-only to
Microsoft 365 / Entra ID, Google Workspace and GitHub, runs 28 automated checks daily, stores
hashed evidence, maps results to controls, drafts policies and answers security questionnaires
with cited sources, and gives a virtual CISO a risk register, 90-day roadmap, multi-client view
and board report. Auditors get read-only access and PDF/CSV evidence exports.

> Software does the evidence work; a security leader guides every decision.
> Readiness guidance only — not a certification.

## Run it (Docker)

```bash
make env     # writes .env with random secrets (never commit it)
make up      # postgres+pgvector, redis, S3 object store, api, worker, beat, web
make seed    # control library + three fictional demo tenants
open http://localhost:3000
```

Demo logins (password = `DEMO_PASSWORD` in your `.env`):

| User | Role | Sees |
|---|---|---|
| `vciso@securavantage.example` | vCISO | all three demo clients + portfolio view |
| `admin@healthbridge.example` | Client admin | HealthBridge only |
| `auditor@healthbridge.example` | Auditor | HealthBridge, read-only |

Set `AI_PROVIDER` (`anthropic` or `gemini`) and that provider's key (`ANTHROPIC_API_KEY` or
`GEMINI_API_KEY`) in `.env` to enable AI for policy drafting, questionnaire answers and reports. Use
Gemini with real client data only on a billed Cloud project: Google's unpaid tier may use prompts to
improve its products and lets human reviewers read them. Without it, the platform uses vetted templates and retrieval-only answers (still cited and
confidence-scored).

## Repository

| Path | What |
|---|---|
| `apps/web` | Next.js 15 (App Router) + TypeScript + Tailwind 4 + shadcn/ui — marketing site and app |
| `apps/api` | FastAPI, SQLAlchemy 2, Alembic, Pydantic v2 — API, check engine, AI layer, exports |
| `apps/worker` | Celery worker/beat (task code in `apps/api/vciso_api/tasks.py`) |
| `packages/connectors` | Read-only Microsoft Graph, Google Admin SDK, GitHub connectors + demo connector |
| `db/` | Alembic migrations (schema, row-level security, grants) and Postgres init |
| `seed/` | Control library, checks + mappings, policy templates, risk templates, demo tenants |
| `docs/` | PRD summary, deployment, demo script, control mapping, known issues, future work |
| `buildit/` | Original AI Studio prototype (UI reference only) |

## Development without Docker

```bash
docker compose up -d postgres redis objectstore
cd apps/api && uv venv --python 3.12 && uv pip install -e ../../packages/connectors -e ".[dev]"
export $(grep -v '^#' ../../.env | xargs)
.venv/bin/alembic -c ../../db/alembic.ini upgrade head && .venv/bin/python -m vciso_api.seed --demo
.venv/bin/uvicorn vciso_api.main:app --reload          # http://localhost:8000/api/docs
cd ../web && npm install && npm run dev                 # http://localhost:3000
```

## Tests

```bash
cd apps/api && .venv/bin/pytest -q                      # 21 tests incl. cross-tenant isolation
cd apps/web && npx next build && npx next start -p 3100 &
E2E_BASE_URL=http://localhost:3100 npx playwright test  # connect → run checks → view results
cd apps/api && .venv/bin/python evals/questionnaire_eval.py   # 30-question AI evaluation
```

See `docs/deployment.md` before putting this in front of real customers.
