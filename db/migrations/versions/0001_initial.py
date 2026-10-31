"""Initial schema, row-level security and grants.

Revision ID: 0001
"""
from alembic import op

from vciso_api.models import TENANT_TABLES, Base

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

APP_ROLE = "vciso_app"
ORG = "NULLIF(current_setting('app.org_id', true), '')::uuid"
USR = "NULLIF(current_setting('app.user_id', true), '')::uuid"


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    Base.metadata.create_all(op.get_bind())

    # The app role is created by db/init (with a password from the environment).
    # Create a passwordless placeholder if it does not exist so grants never fail (e.g. CI).
    op.execute(f"DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '{APP_ROLE}') "
               f"THEN CREATE ROLE {APP_ROLE} LOGIN NOBYPASSRLS; END IF; END $$")
    op.execute(f"GRANT USAGE ON SCHEMA public TO {APP_ROLE}")

    for table in TENANT_TABLES:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"GRANT SELECT, INSERT, UPDATE, DELETE ON {table} TO {APP_ROLE}")
        if table == "memberships":
            # A user can always see their own memberships (to pick an org); org members see the org roster.
            op.execute(f"CREATE POLICY tenant_isolation ON memberships "
                       f"USING (organization_id = {ORG} OR user_id = {USR}) "
                       f"WITH CHECK (organization_id = {ORG})")
        else:
            op.execute(f"CREATE POLICY tenant_isolation ON {table} "
                       f"USING (organization_id = {ORG}) WITH CHECK (organization_id = {ORG})")

    op.execute("ALTER TABLE organizations ENABLE ROW LEVEL SECURITY")
    op.execute(f"GRANT SELECT, INSERT, UPDATE ON organizations TO {APP_ROLE}")
    op.execute(f"CREATE POLICY org_read ON organizations FOR SELECT USING ("
               f"id = {ORG} OR id IN (SELECT organization_id FROM memberships WHERE user_id = {USR}))")
    op.execute(f"CREATE POLICY org_insert ON organizations FOR INSERT WITH CHECK (id = {ORG})")
    op.execute(f"CREATE POLICY org_update ON organizations FOR UPDATE USING (id = {ORG}) WITH CHECK (id = {ORG})")

    op.execute(f"GRANT SELECT, INSERT, UPDATE ON users TO {APP_ROLE}")
    op.execute(f"GRANT SELECT ON frameworks, controls, checks, check_control_map TO {APP_ROLE}")
    op.execute(f"GRANT INSERT ON leads TO {APP_ROLE}")

    # Scheduler needs the list of orgs with integrations without a tenant context.
    op.execute("""
        CREATE FUNCTION app_scheduled_org_ids() RETURNS SETOF uuid
        LANGUAGE sql SECURITY DEFINER SET search_path = public AS
        $$ SELECT DISTINCT organization_id FROM integrations WHERE status <> 'disconnected' $$
    """)
    op.execute("REVOKE ALL ON FUNCTION app_scheduled_org_ids() FROM PUBLIC")
    op.execute(f"GRANT EXECUTE ON FUNCTION app_scheduled_org_ids() TO {APP_ROLE}")

    # No ANN (HNSW) index on purpose: an approximate scan filtered by tenant can silently drop the
    # tenant's best matches. Per-tenant corpora are small, so an exact scan over the
    # organization_id index is fast and correct. Revisit with pgvector iterative scans if corpora grow.


def downgrade() -> None:
    op.execute("DROP FUNCTION IF EXISTS app_scheduled_org_ids()")
    Base.metadata.drop_all(op.get_bind())
