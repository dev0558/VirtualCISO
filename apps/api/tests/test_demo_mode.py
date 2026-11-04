"""Public demo: the API refuses every change, and AI cannot run even if a key is configured."""
import pytest

from vciso_api.ai import llm
from vciso_api.main import settings


@pytest.fixture
def demo(monkeypatch):
    monkeypatch.setattr(settings, "demo_read_only", True)


def test_writes_are_refused_and_data_unchanged(two_tenants, demo):
    (a, org), _ = two_tenants
    before = a.get(f"/api/v1/orgs/{org}/state").json()["risks"]
    r = a.post(f"/api/v1/orgs/{org}/risks", json={"title": "Blocked", "category": "Access", "likelihood": 3, "impact": 3})
    assert r.status_code == 403
    assert "read-only" in r.json()["detail"]
    assert a.get(f"/api/v1/orgs/{org}/state").json()["risks"] == before


def test_signup_is_refused(client, demo):
    r = client.post("/api/v1/auth/signup", json={"email": "new@demo.example", "password": "x" * 16,
                                                 "fullName": "New", "company": "Fictional Ltd"})
    assert r.status_code == 403


def test_login_and_contact_still_work(client, demo):
    r = client.post("/api/v1/auth/login", json={"email": "nobody@demo.example", "password": "x" * 16})
    assert r.status_code == 401  # reached the login handler, not the demo guard
    r = client.post("/api/v1/public/leads", json={"name": "A", "email": "a@demo.example", "company": "Fictional Ltd"})
    assert r.status_code == 201


def test_ai_is_off_even_with_a_key(monkeypatch, demo):
    monkeypatch.setattr(settings, "anthropic_api_key", "not-a-real-key")
    assert llm.enabled() is False
    with pytest.raises(llm.AIUnavailable):
        llm.structured("s", "u", llm.BaseModel)
