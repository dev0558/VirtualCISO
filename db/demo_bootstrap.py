"""First-boot setup for the hosted read-only demo (DEMO_BOOTSTRAP=1). Safe to re-run on every start.

Does what compose's db/init script and `make seed` do locally: creates the non-owner runtime role so
RLS applies, runs migrations, and loads the fictional demo tenants.
"""
import os
import subprocess

from sqlalchemy import create_engine, make_url, text

app_url = make_url(os.environ["DATABASE_URL"])
owner = create_engine(os.environ["MIGRATION_DATABASE_URL"], isolation_level="AUTOCOMMIT")
with owner.connect() as c:
    c.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    if not c.execute(text("SELECT 1 FROM pg_roles WHERE rolname = 'vciso_app'")).scalar():
        # CREATE ROLE cannot take bind parameters; quote the literal with the server's own function.
        pw = c.execute(text("SELECT quote_literal(:p)"), {"p": app_url.password}).scalar()
        c.execute(text(f"CREATE ROLE vciso_app LOGIN NOBYPASSRLS PASSWORD {pw}"))
owner.dispose()

subprocess.run(["alembic", "-c", "/srv/db/alembic.ini", "upgrade", "head"], check=True)
subprocess.run(["python", "-m", "vciso_api.seed", "--demo"], check=True)
