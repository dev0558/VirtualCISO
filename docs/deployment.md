# Deployment guide

## Single VM (demo / pilot)

1. Ubuntu 24.04 VM (2 vCPU, 4 GB RAM), Docker Engine + Compose plugin, DNS for `app.yourdomain`.
2. `git clone` the repo, `make env`, then edit `.env`:
   - `ENV=production`, `COOKIE_SECURE=true`, `PUBLIC_APP_URL=https://app.yourdomain`
   - keep the generated `SECRET_KEY`, `CREDENTIALS_ENCRYPTION_KEY`, DB and S3 passwords; store a copy in your secrets manager
   - `ANTHROPIC_API_KEY` for AI features
3. Put a TLS-terminating reverse proxy in front of `web:3000` (Caddy: `app.yourdomain { reverse_proxy 127.0.0.1:3000 }`). Do not expose 8000/8333/55432/56379 publicly; compose binds them to 127.0.0.1.
4. `make up && make seed` (omit demo tenants for real customers: `docker compose exec api python -m vciso_api.seed`).
5. Backups: nightly `pg_dump` of the `vciso` database and a copy of the `objectdata` volume; test a restore.

## Production checklist (before real customer data)

- Managed Postgres 16 with pgvector; keep the runtime role `vciso_app` non-owner and `NOBYPASSRLS`.
- Managed object storage with versioning and object lock for evidence.
- Rotate `CREDENTIALS_ENCRYPTION_KEY` via a KMS-backed secret; never commit `.env`.
- Email delivery for invitations (currently a copyable one-time link).
- Error monitoring (Sentry) and uptime checks; ship JSON logs to your log platform.
- Independent penetration test and DPA/terms reviewed by counsel.
