"""End-to-end API flows: auth, roles, checks + evidence, policies, questionnaire, vCISO, exports."""
import io
import uuid

import pyotp

from .conftest import PASSWORD, signup


def test_auth_requires_csrf_header_and_session(client):
    assert client.get("/api/v1/auth/me").status_code == 401
    r = client.post("/api/v1/auth/login", json={"email": "x@y.example", "password": "z"}, headers={"X-Requested-With": ""})
    assert r.status_code == 403


def test_signup_login_and_mfa(client):
    email = f"mfa-{uuid.uuid4().hex[:6]}@co.example"
    signup(client, email, "MFA Co")
    setup = client.post("/api/v1/auth/mfa/setup").json()
    code = pyotp.TOTP(setup["secret"]).now()
    assert client.post("/api/v1/auth/mfa/enable", json={"code": code}).status_code == 200
    client.post("/api/v1/auth/logout")
    r = client.post("/api/v1/auth/login", json={"email": email, "password": PASSWORD})
    assert r.json() == {"mfaRequired": True}
    assert client.get("/api/v1/auth/me").status_code == 401  # pending MFA is not a session
    assert client.post("/api/v1/auth/mfa/verify", json={"code": "000000"}).status_code == 401
    assert client.post("/api/v1/auth/mfa/verify", json={"code": pyotp.TOTP(setup["secret"]).now()}).status_code == 200
    assert client.get("/api/v1/auth/me").json()["user"]["mfaEnabled"] is True


def test_wrong_password_rejected(client):
    email = f"pw-{uuid.uuid4().hex[:6]}@co.example"
    signup(client, email, "PW Co")
    client.post("/api/v1/auth/logout")
    assert client.post("/api/v1/auth/login", json={"email": email, "password": "wrong-password-123"}).status_code == 401


def test_checks_evidence_scores_and_verify(client):
    org = signup(client, f"chk-{uuid.uuid4().hex[:6]}@co.example", "Checks Co")["organizations"][0]["id"]
    assert client.post(f"/api/v1/orgs/{org}/checks/run").status_code == 400  # nothing connected yet
    for t in ("m365", "google_workspace", "github"):
        assert client.post(f"/api/v1/orgs/{org}/integrations/{t}/sample").status_code == 200
    run = client.post(f"/api/v1/orgs/{org}/checks/run").json()
    assert sum(run["summary"]["counts"].values()) == 28
    state = client.get(f"/api/v1/orgs/{org}/state").json()
    failing = [c for c in state["checks"] if c["status"] == "failed"]
    assert failing and 0 < state["scores"]["isoScore"] < 100
    ev = state["evidenceStore"][0]
    detail = client.get(f"/api/v1/orgs/{org}/evidence/{ev['id']}").json()
    assert detail["verified"] is True and len(detail["sha256"]) == 64
    code = failing[0]["code"]
    client.post(f"/api/v1/orgs/{org}/checks/{code}/verify")
    after = {c["code"]: c["status"] for c in client.get(f"/api/v1/orgs/{org}/state").json()["checks"]}
    assert after[code] == "passed"
    actions = [a["action"] for a in client.get(f"/api/v1/orgs/{org}/state").json()["auditLogs"]]
    assert "CHECK_RUN" in actions and "CHECK_RUN_VERIFY" in actions


def test_policy_generate_requires_approval_and_is_cited(client):
    org = signup(client, f"pol-{uuid.uuid4().hex[:6]}@co.example", "Policy Co")["organizations"][0]["id"]
    pol = [p for p in client.get(f"/api/v1/orgs/{org}/state").json()["policies"] if p["code"] == "POL-02"][0]
    assert pol["status"] == "not_started"
    draft = client.post(f"/api/v1/orgs/{org}/policies/{pol['id']}/generate",
                        json={"profile": {"identity_provider": "Okta", "offboarding_hours": 8}}).json()
    assert draft["status"] == "draft" and draft["version"] == "0.1"
    assert "Policy Co" in draft["content"] and "Okta" in draft["content"]
    assert any(c["type"] == "control" for c in draft["citations"])
    approved = client.post(f"/api/v1/orgs/{org}/policies/{pol['id']}/approve").json()
    assert approved["status"] == "approved" and approved["version"] == "1.0" and approved["approver"]


def test_questionnaire_upload_autofill_and_approve(client):
    org = signup(client, f"q-{uuid.uuid4().hex[:6]}@co.example", "Quest Co")["organizations"][0]["id"]
    client.post(f"/api/v1/orgs/{org}/integrations/m365/sample")
    client.post(f"/api/v1/orgs/{org}/checks/run")
    csv_bytes = b"category,question\nAccess,Is legacy authentication such as IMAP and POP blocked?\nOther,What colour is the office?\n"
    q = client.post(f"/api/v1/orgs/{org}/questionnaires", files={"file": ("q.csv", io.BytesIO(csv_bytes), "text/csv")},
                    data={"title": "Prospect", "customer_name": "Acme"}).json()
    assert len(q["items"]) == 2
    res = client.post(f"/api/v1/orgs/{org}/questionnaires/{q['id']}/autofill").json()
    items = res["questionnaire"]["items"]
    assert items[0]["citedSources"] and items[0]["citedSources"][0]["reference"] == "M365-LEG-04"
    assert items[1]["needsReview"] is True and items[1]["citedSources"] == []
    assert all(not i["humanApproved"] for i in items)
    r = client.post(f"/api/v1/orgs/{org}/questionnaires/{q['id']}/answers/{items[0]['id']}/approve", json={"notes": "ok"})
    assert r.json()["items"][0]["humanApproved"] is True
    bad = client.post(f"/api/v1/orgs/{org}/questionnaires", files={"file": ("q.pdf", io.BytesIO(b"x"), "application/pdf")})
    assert bad.status_code == 422


def test_roles_auditor_read_only_and_vciso_only(client):
    org = signup(client, f"role-{uuid.uuid4().hex[:6]}@co.example", "Roles Co")["organizations"][0]["id"]
    inv = client.post(f"/api/v1/orgs/{org}/members", json={"email": f"aud-{uuid.uuid4().hex[:6]}@co.example",
                                                           "role": "auditor"}).json()
    token = inv["inviteUrl"].rsplit("/", 1)[-1]
    from .conftest import _client

    aud = _client()
    assert aud.post("/api/v1/auth/invite/accept", json={"token": token, "password": PASSWORD, "full_name": "Aud"}).status_code == 200
    assert aud.get(f"/api/v1/orgs/{org}/state").status_code == 200
    assert aud.post(f"/api/v1/orgs/{org}/integrations/github/sample").status_code == 403
    assert aud.post(f"/api/v1/orgs/{org}/risks", json={"title": "r1", "category": "Access & Identity",
                                                       "likelihood": 1, "impact": 1}).status_code == 403
    assert aud.get(f"/api/v1/orgs/{org}/export?framework=iso27001&format=csv").status_code == 200
    # client_admin cannot generate the vCISO leadership report or roadmap
    assert client.post(f"/api/v1/orgs/{org}/reports/generate", json={}).status_code == 403
    assert client.post(f"/api/v1/orgs/{org}/roadmap/generate").status_code == 403


def test_auditor_csv_export_contains_hashes(client):
    org = signup(client, f"exp-{uuid.uuid4().hex[:6]}@co.example", "Export Co")["organizations"][0]["id"]
    client.post(f"/api/v1/orgs/{org}/integrations/github/sample")
    client.post(f"/api/v1/orgs/{org}/checks/run")
    r = client.get(f"/api/v1/orgs/{org}/export?framework=nistcsf&format=csv")
    assert r.status_code == 200 and "text/csv" in r.headers["content-type"]
    body = r.text
    assert "PR.AA" in body and "GH-2FA-01" in body
    assert any(len(cell) == 64 for line in body.splitlines()[1:] for cell in line.split(","))


def test_public_lead_and_honeypot(client):
    assert client.post("/api/v1/public/leads", json={"name": "N", "email": "n@x.example", "company": "X"}).status_code == 201
