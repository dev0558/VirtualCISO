.PHONY: env up down seed test eval logs lint

env:  ## create .env with random secrets (first run only)
	@test -f .env || python3 scripts/make_env.py > .env && echo ".env ready"

up: env
	docker compose up -d --build

down:
	docker compose down

seed:
	docker compose exec api python -m vciso_api.seed --demo

test:
	docker compose run --rm --build test

eval:
	docker compose exec api python evals/questionnaire_eval.py

lint:
	cd apps/api && .venv/bin/ruff check vciso_api tests ../../packages/connectors
	cd apps/web && npm run lint

logs:
	docker compose logs -f api worker web
