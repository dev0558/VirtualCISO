import json

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from vciso_connectors import CONNECTOR_META, ConnectorError, build_connector

from ..config import get_settings
from ..deps import ANY_ROLE, EDITORS, Ctx
from ..models import Check, Evidence, Integration
from ..security import encrypt_json
from ..services import audit, engine
from ..services.state import compute_posture

router = APIRouter(prefix="/orgs/{org_id}", tags=["checks"])


@router.post("/checks/run")
def run_all(ctx: Ctx = EDITORS):
    if not ctx.db.scalars(select(Integration).where(Integration.organization_id == ctx.org.id)).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Connect at least one integration before running checks")
    run = engine.run_checks(ctx.db, ctx.org, trigger="manual", actor=ctx.actor, role=ctx.role, user_id=ctx.user.id)
    ctx.db.commit()
    return {"runId": str(run.id), "summary": run.summary, "scores": compute_posture(ctx.db, ctx.org)["scores"]}


@router.post("/checks/{code}/verify")
def verify(code: str, ctx: Ctx = EDITORS):
    """Re-run a single check after the client has fixed the issue in their system.
    In demo tenants, applies the recorded 'fixed' state so the flow can be demonstrated."""
    chk = ctx.db.scalars(select(Check).where(Check.code == code)).first()
    if not chk:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Check not found")
    integ = ctx.db.scalars(select(Integration).where(Integration.organization_id == ctx.org.id,
                                                     Integration.type == chk.connector)).first()
    if not integ:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "The integration for this check is not connected")
    if integ.mode == "demo":
        integ.config = {**integ.config, "overrides": {**integ.config.get("overrides", {}), **_passing_facts(chk)}}
    run = engine.run_checks(ctx.db, ctx.org, trigger="verify", actor=ctx.actor, role=ctx.role, user_id=ctx.user.id,
                            only_check_code=code)
    ctx.db.commit()
    return {"runId": str(run.id), "summary": run.summary}


LIST_FACT_SUFFIXES = ("users_without_mfa", "stale_guests", "inactive_accounts", "unprotected_repos",
                      "sensitive_public_repos", "high_risk_oauth_app_names", "users_without_2sv",
                      "repos_without_dependabot", "repos_without_secret_scanning",
                      "repos_without_required_review", "never_logged_in_accounts")


def _passing_facts(chk: Check) -> dict:
    """Facts that satisfy a check's rule (demo tenants only)."""
    out: dict = {}
    for r in chk.rule.get("all", [chk.rule]):
        op, v = r["op"], r.get("value")
        out[r["fact"]] = {"is_true": True, "is_false": False, "in": (v or [None])[0]}.get(op, v)
    if chk.code == "M365-ADM-02":
        out["m365.global_admin_count"] = 3
        out["m365.global_admins"] = ["a***@demo", "b***@demo", "c***@demo"]
    for f in chk.evidence_facts or []:
        if f.endswith(LIST_FACT_SUFFIXES):
            out[f] = []
    return out


@router.get("/evidence/{evidence_id}")
def evidence(evidence_id: str, ctx: Ctx = ANY_ROLE):
    e = ctx.db.scalars(select(Evidence).where(Evidence.organization_id == ctx.org.id, Evidence.id == evidence_id)).first()
    if not e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Evidence not found")
    canonical = {"organization_id": str(ctx.org.id), "check": e.check.code, "status": e.status,
                 "collected_at": e.collected_at.isoformat(), "observed": e.observed}
    return {"id": str(e.id), "check": e.check.code, "status": e.status, "collectedAt": e.collected_at.isoformat(),
            "sha256": e.sha256, "verified": engine.canonical_hash(canonical) == e.sha256, "objectKey": e.object_key,
            "payload": canonical}


# ------------------------------------------------------------------ integrations
@router.get("/integrations/catalog")
def catalog(ctx: Ctx = ANY_ROLE):
    return {"connectors": list(CONNECTOR_META.values())}


class ConnectIn(BaseModel):
    credentials: dict[str, str] = Field(default_factory=dict)


@router.post("/integrations/{type_}")
def connect(type_: str, body: ConnectIn, ctx: Ctx = EDITORS):
    if type_ not in CONNECTOR_META:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown connector")
    fields = {f["name"] for f in CONNECTOR_META[type_]["credential_fields"]}
    creds = {k: v for k, v in body.credentials.items() if k in fields}
    if set(creds) != fields or any(not v.strip() for v in creds.values()):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "All credential fields are required")
    try:
        account = build_connector(type_, "live", creds, {}).test()
    except ConnectorError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e)) from None
    except Exception as e:  # network errors etc.
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Could not reach the provider ({type(e).__name__})") from None
    integ = ctx.db.scalars(select(Integration).where(Integration.organization_id == ctx.org.id, Integration.type == type_)).first()
    if not integ:
        integ = Integration(organization_id=ctx.org.id, type=type_)
        ctx.db.add(integ)
    integ.mode, integ.status, integ.account_identifier = "live", "connected", account[:255]
    integ.credentials_enc, integ.config, integ.last_error = encrypt_json(creds), {}, None
    audit.log(ctx.db, org_id=ctx.org.id, user_id=ctx.user.id, actor=ctx.actor, role=ctx.role, action="INTEGRATION_CONNECTED",
              resource=CONNECTOR_META[type_]["name"], details=f"Account {account}. Read-only scopes.")
    ctx.db.commit()
    return {"ok": True, "accountIdentifier": account}


@router.post("/integrations/{type_}/sample")
def connect_sample(type_: str, ctx: Ctx = EDITORS):
    """Connect a connector in demo mode with fictional recorded data (for trials and sales demos)."""
    if type_ not in CONNECTOR_META:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown connector")
    data = json.loads((get_settings().seed_dir / "demo" / "tenants.json").read_text())
    sample = next(i for t in data["tenants"] if t["slug"] == "finvault" for i in t["integrations"] if i["type"] == type_)
    integ = ctx.db.scalars(select(Integration).where(Integration.organization_id == ctx.org.id, Integration.type == type_)).first()
    if integ and integ.mode == "live":
        raise HTTPException(status.HTTP_409_CONFLICT, "A live integration is already connected")
    if not integ:
        integ = Integration(organization_id=ctx.org.id, type=type_)
        ctx.db.add(integ)
    integ.mode, integ.status, integ.account_identifier = "demo", "connected", f"sample-data ({CONNECTOR_META[type_]['name']})"
    integ.config = {"account": integ.account_identifier, "facts": sample["facts"]}
    audit.log(ctx.db, org_id=ctx.org.id, user_id=ctx.user.id, actor=ctx.actor, role=ctx.role,
              action="INTEGRATION_SAMPLE_CONNECTED", resource=CONNECTOR_META[type_]["name"])
    ctx.db.commit()
    return {"ok": True}


@router.delete("/integrations/{type_}", status_code=204)
def disconnect(type_: str, ctx: Ctx = EDITORS):
    integ = ctx.db.scalars(select(Integration).where(Integration.organization_id == ctx.org.id, Integration.type == type_)).first()
    if not integ:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not connected")
    audit.log(ctx.db, org_id=ctx.org.id, user_id=ctx.user.id, actor=ctx.actor, role=ctx.role, action="INTEGRATION_DISCONNECTED",
              resource=CONNECTOR_META[type_]["name"], details="Stored credentials deleted.")
    ctx.db.delete(integ)
    ctx.db.commit()
