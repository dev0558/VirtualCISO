"""Evidence that failed to upload is retried later, unchanged, under each tenant's own RLS context."""
import uuid

import pytest
from sqlalchemy import select

from vciso_api import tasks
from vciso_api.db import session_scope
from vciso_api.models import AuditLog, Evidence
from vciso_api.services import engine, storage


def run_checks(client, org_id: str) -> None:
    assert client.post(f"/api/v1/orgs/{org_id}/integrations/github/sample").status_code < 300
    assert client.post(f"/api/v1/orgs/{org_id}/checks/run").status_code < 300


def rows(org_id: str) -> list[Evidence]:
    with session_scope(org_id=uuid.UUID(org_id)) as db:
        return list(db.scalars(select(Evidence).where(Evidence.organization_id == uuid.UUID(org_id))).all())


@pytest.fixture
def store(monkeypatch):
    """A fake object store that starts down, so check runs leave their evidence pending."""

    class Store:
        available = False
        objects: dict = {}
        calls = 0

        def set_available(self, available: bool) -> None:
            self.available, self.calls = available, 0

        def put(self, key, body, sha256):
            self.calls += 1
            if not self.available:
                return None
            self.objects[key] = (body, sha256)
            return key

    s = Store()
    s.objects = {}
    monkeypatch.setattr(storage, "is_configured", lambda: True)
    monkeypatch.setattr(storage, "put_evidence", s.put)
    return s


def test_new_runs_leave_evidence_pending_when_uploads_fail(two_tenants):
    (a, org_a), _ = two_tenants
    run_checks(a, org_a)
    assert rows(org_a) and all(e.object_key is None for e in rows(org_a))


def test_sweep_uploads_each_tenants_evidence_with_the_original_hash(two_tenants, store):
    (a, org_a), (b, org_b) = two_tenants
    run_checks(a, org_a)
    run_checks(b, org_b)

    store.set_available(True)
    assert tasks.retry_unstored_evidence() >= 2

    for org_id in (org_a, org_b):
        evidence = rows(org_id)
        assert evidence and all(e.object_key for e in evidence)
        for e in evidence:
            assert e.object_key.startswith(f"{org_id}/evidence/{e.check.code}/")
            body, sha = store.objects[e.object_key]
            assert sha == body["sha256"] == e.sha256
            assert body["organization_id"] == org_id
            assert engine.canonical_hash({k: v for k, v in body.items() if k != "sha256"}) == e.sha256
        with session_scope(org_id=uuid.UUID(org_id)) as db:
            actions = db.scalars(select(AuditLog.action).where(AuditLog.organization_id == uuid.UUID(org_id))).all()
        assert "EVIDENCE_STORED" in actions


def test_sweep_stops_during_an_outage_and_recovers_afterwards(two_tenants, store):
    (a, org_a), _ = two_tenants
    run_checks(a, org_a)

    store.set_available(False)
    assert tasks.retry_unstored_evidence() == 0
    assert store.calls == 1  # does not keep hammering a store that is down
    assert all(e.object_key is None for e in rows(org_a))

    store.set_available(True)
    assert tasks.retry_unstored_evidence() > 0
    assert all(e.object_key for e in rows(org_a))


def test_altered_evidence_is_not_uploaded(two_tenants, store):
    (a, org_a), _ = two_tenants
    run_checks(a, org_a)
    oa = uuid.UUID(org_a)
    with session_scope(org_id=oa) as db:
        target = db.scalars(select(Evidence).where(Evidence.organization_id == oa)).first()
        target.observed = {**target.observed, "altered": True}
        target_id = target.id

    store.set_available(True)
    tasks.retry_unstored_evidence()

    by_id = {e.id: e for e in rows(org_a)}
    assert by_id[target_id].object_key is None
    assert all(e.object_key for i, e in by_id.items() if i != target_id)


def test_retry_cannot_reach_another_tenants_evidence(two_tenants, store):
    (a, org_a), (b, org_b) = two_tenants
    run_checks(a, org_a)
    store.set_available(True)
    with session_scope(org_id=uuid.UUID(org_b)) as db:
        assert engine.store_pending_evidence(db, uuid.UUID(org_a)) == (0, True)
    assert store.calls == 0
    assert all(e.object_key is None for e in rows(org_a))


def test_sweep_is_a_no_op_without_object_storage(two_tenants, monkeypatch):
    (a, org_a), _ = two_tenants
    run_checks(a, org_a)
    monkeypatch.setattr(storage, "put_evidence", lambda *args: pytest.fail("must not upload"))
    assert tasks.retry_unstored_evidence() == 0
