"""Test setup: a dedicated database (vciso_test), migrated as the owner, accessed as vciso_app."""
import os
import re
import subprocess
import sys
from pathlib import Path

for var in ("DATABASE_URL", "MIGRATION_DATABASE_URL"):
    url = os.environ.get(var, "")
    if url and not url.endswith("/vciso_test"):
        os.environ[var] = re.sub(r"/vciso$", "/vciso_test", url)
os.environ["ENV"] = "test"
os.environ["AI_PROVIDER"] = "anthropic"
os.environ["ANTHROPIC_API_KEY"] = ""  # tests never call the real API
os.environ["GEMINI_API_KEY"] = ""
os.environ["S3_ACCESS_KEY"] = ""  # evidence stays inline in tests

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402

ROOT = Path(__file__).resolve().parents[3]
PASSWORD = "correct-horse-battery-staple"


@pytest.fixture(scope="session", autouse=True)
def database():
    from vciso_api.config import get_settings

    eng = create_engine(get_settings().migration_database_url)
    with eng.begin() as c:
        c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public"))
        c.execute(text("DROP FUNCTION IF EXISTS app_scheduled_org_ids()"))
    subprocess.run([sys.executable, "-m", "alembic", "-c", str(ROOT / "db" / "alembic.ini"), "upgrade", "head"],
                   check=True, cwd=ROOT / "apps" / "api")
    from vciso_api.seed import owner_session, seed_library

    seed_library(owner_session())
    yield


def _client():
    from vciso_api.main import app

    c = TestClient(app)
    c.headers.update({"X-Requested-With": "securavantage"})
    return c


@pytest.fixture
def client():
    return _client()


def signup(client, email: str, company: str) -> dict:
    r = client.post("/api/v1/auth/signup", json={"email": email, "password": PASSWORD, "full_name": "Test User",
                                                 "company": company, "industry": "SaaS", "employee_count": 20})
    assert r.status_code == 201, r.text
    return r.json()


@pytest.fixture
def two_tenants():
    """Two independent companies, each with its own admin client (separate cookie jars)."""
    import uuid

    a, b = _client(), _client()
    sa = signup(a, f"alice-{uuid.uuid4().hex[:6]}@alpha.example", "Alpha Ltd")
    sb = signup(b, f"bob-{uuid.uuid4().hex[:6]}@bravo.example", "Bravo Ltd")
    return (a, sa["organizations"][0]["id"]), (b, sb["organizations"][0]["id"])
