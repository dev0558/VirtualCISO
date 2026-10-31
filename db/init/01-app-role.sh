#!/bin/bash
# Creates the runtime role used by the API/worker. It does NOT own tables and has
# NOBYPASSRLS, so PostgreSQL row-level security always applies to it.
set -euo pipefail
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-SQL
  CREATE EXTENSION IF NOT EXISTS vector;
  DO \$\$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vciso_app') THEN
      CREATE ROLE vciso_app LOGIN NOBYPASSRLS PASSWORD '${APP_DB_PASSWORD}';
    END IF;
  END \$\$;
  CREATE DATABASE vciso_test OWNER ${POSTGRES_USER};
SQL
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname vciso_test -c "CREATE EXTENSION IF NOT EXISTS vector;"
