FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
RUN apt-get update && apt-get install -y --no-install-recommends \
      libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz0b libfontconfig1 fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /srv
COPY packages/connectors /srv/packages/connectors
COPY apps/api/pyproject.toml /srv/apps/api/pyproject.toml
COPY apps/api/vciso_api /srv/apps/api/vciso_api
RUN pip install /srv/packages/connectors && pip install /srv/apps/api
COPY db /srv/db
COPY seed /srv/seed
COPY apps/api/tests /srv/apps/api/tests
COPY apps/api/evals /srv/apps/api/evals
RUN useradd -r -u 10001 app && chown -R app /srv
USER app
WORKDIR /srv/apps/api
ENV SEED_DIR=/srv/seed
EXPOSE 8000
CMD ["sh", "-c", "alembic -c /srv/db/alembic.ini upgrade head && uvicorn vciso_api.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='*'"]
