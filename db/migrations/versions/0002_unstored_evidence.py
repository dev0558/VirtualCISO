"""List tenants whose evidence never reached object storage, so the worker can retry the uploads.

Revision ID: 0002
"""
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

APP_ROLE = "vciso_app"


def upgrade() -> None:
    op.execute("CREATE INDEX ix_evidence_unstored ON evidence (organization_id) WHERE object_key IS NULL")
    # Like app_scheduled_org_ids: exposes tenant ids only. The retry itself runs under each tenant's RLS context.
    op.execute("""
        CREATE FUNCTION app_org_ids_with_unstored_evidence() RETURNS SETOF uuid
        LANGUAGE sql SECURITY DEFINER SET search_path = public AS
        $$ SELECT DISTINCT organization_id FROM evidence WHERE object_key IS NULL $$
    """)
    op.execute("REVOKE ALL ON FUNCTION app_org_ids_with_unstored_evidence() FROM PUBLIC")
    op.execute(f"GRANT EXECUTE ON FUNCTION app_org_ids_with_unstored_evidence() TO {APP_ROLE}")


def downgrade() -> None:
    op.execute("DROP FUNCTION IF EXISTS app_org_ids_with_unstored_evidence()")
    op.execute("DROP INDEX IF EXISTS ix_evidence_unstored")
