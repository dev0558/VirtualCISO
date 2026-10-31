"""PRD rule 1: tenant A can never read or write tenant B data — through the API and at the database level."""
import uuid

from sqlalchemy import select, text

from vciso_api.db import session_scope
from vciso_api.models import Integration, Organization, Policy, Risk


def test_api_cannot_read_other_tenant(two_tenants):
    (a, org_a), (_b, org_b) = two_tenants
    assert a.get(f"/api/v1/orgs/{org_a}/state").status_code == 200
    for path in ("state", "members", "integrations/catalog", "risk-templates"):
        r = a.get(f"/api/v1/orgs/{org_b}/{path}")
        assert r.status_code == 404, (path, r.status_code)


def test_api_cannot_write_other_tenant(two_tenants):
    (a, _org_a), (b, org_b) = two_tenants
    r = a.post(f"/api/v1/orgs/{org_b}/risks", json={"title": "Injected", "category": "Access & Identity",
                                                     "likelihood": 3, "impact": 3})
    assert r.status_code == 404
    r = a.post(f"/api/v1/orgs/{org_b}/integrations/github/sample")
    assert r.status_code == 404
    risks = b.get(f"/api/v1/orgs/{org_b}/state").json()["risks"]
    assert all(x["title"] != "Injected" for x in risks)


def test_api_cannot_touch_other_tenant_objects_by_id(two_tenants):
    (a, org_a), (b, org_b) = two_tenants
    rb = b.post(f"/api/v1/orgs/{org_b}/risks", json={"title": "Bravo risk", "category": "Access & Identity",
                                                      "likelihood": 2, "impact": 2}).json()
    # Use A's own org in the path but B's object id: must not resolve.
    r = a.put(f"/api/v1/orgs/{org_a}/risks/{rb['id']}", json={"title": "Hijacked", "category": "Access & Identity",
                                                               "likelihood": 5, "impact": 5})
    assert r.status_code == 404
    pol_b = b.get(f"/api/v1/orgs/{org_b}/state").json()["policies"][0]["id"]
    assert a.post(f"/api/v1/orgs/{org_a}/policies/{pol_b}/approve").status_code == 404


def test_rls_blocks_reads_without_matching_context(two_tenants):
    (_a, org_a), (_b, org_b) = two_tenants
    oa, ob = uuid.UUID(org_a), uuid.UUID(org_b)
    with session_scope(org_id=oa) as db:
        assert db.execute(text("select current_user")).scalar() == "vciso_app"
        pols = db.scalars(select(Policy)).all()
        assert pols and all(p.organization_id == oa for p in pols)
        assert db.scalars(select(Policy).where(Policy.organization_id == ob)).all() == []
        assert db.get(Organization, ob) is None
    with session_scope() as db:  # no tenant context at all -> nothing visible
        assert db.scalars(select(Policy)).all() == []
        assert db.scalars(select(Integration)).all() == []


def test_rls_blocks_cross_tenant_insert_and_update(two_tenants):
    (_a, org_a), (_b, org_b) = two_tenants
    oa, ob = uuid.UUID(org_a), uuid.UUID(org_b)
    import pytest
    from sqlalchemy.exc import ProgrammingError

    with pytest.raises(ProgrammingError, match="row-level security"):
        with session_scope(org_id=oa) as db:
            db.add(Risk(organization_id=ob, title="x", category="Access & Identity", likelihood=1, impact=1))
            db.flush()
    with session_scope(org_id=oa) as db:
        n = db.execute(text("UPDATE policies SET title='pwned' WHERE organization_id = :o"), {"o": ob}).rowcount
        assert n == 0


def test_rag_retrieval_is_tenant_scoped(two_tenants):
    (a, org_a), (b, org_b) = two_tenants
    from vciso_api.ai.rag import retrieve

    b.post(f"/api/v1/orgs/{org_b}/integrations/github/sample")
    b.post(f"/api/v1/orgs/{org_b}/checks/run")
    with session_scope(org_id=uuid.UUID(org_a)) as db:
        assert retrieve(db, uuid.UUID(org_b), "branch protection secret scanning") == []
