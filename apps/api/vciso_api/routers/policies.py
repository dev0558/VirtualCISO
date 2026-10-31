from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select

from ..ai import policies as gen
from ..ai import rag
from ..deps import ANY_ROLE, EDITORS, Ctx
from ..models import Policy, PolicyVersion
from ..services import audit
from ..services.state import ser_policy

router = APIRouter(prefix="/orgs/{org_id}/policies", tags=["policies"])


def _policy(ctx: Ctx, policy_id: str) -> Policy:
    p = ctx.db.scalars(select(Policy).where(Policy.organization_id == ctx.org.id, Policy.id == policy_id)).first()
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Policy not found")
    return p


class GenerateIn(BaseModel):
    profile: dict[str, str | int | bool] = Field(default_factory=dict)


@router.get("/profile-fields")
def profile_fields(ctx: Ctx = ANY_ROLE):
    return {"defaults": gen.profile_for(ctx.org), "fields": list(gen.PROFILE_DEFAULTS)}


@router.post("/{policy_id}/generate")
def generate(policy_id: str, body: GenerateIn, ctx: Ctx = EDITORS):
    p = _policy(ctx, policy_id)
    profile = {k: (v[:500] if isinstance(v, str) else v) for k, v in body.profile.items() if k in gen.PROFILE_DEFAULTS}
    v = gen.generate(ctx.db, ctx.org, p, profile, author=ctx.actor)
    audit.log(ctx.db, org_id=ctx.org.id, user_id=ctx.user.id, actor=ctx.actor, role=ctx.role, action="POLICY_DRAFTED",
              resource=f"{p.code} v{v.version}", details=("AI-assisted draft" if v.ai_generated else "Template draft")
              + f", confidence {v.confidence}. Requires human approval.")
    ctx.db.commit()
    ctx.db.refresh(p)
    return ser_policy(p)


class ContentIn(BaseModel):
    content: str = Field(min_length=20, max_length=100_000)


@router.put("/{policy_id}")
def edit(policy_id: str, body: ContentIn, ctx: Ctx = EDITORS):
    p = _policy(ctx, policy_id)
    v = PolicyVersion(organization_id=ctx.org.id, policy_id=p.id, version=gen.next_version(p), status="draft",
                      content=body.content, author=ctx.actor, ai_generated=False,
                      citations=p.versions[0].citations if p.versions else [])
    ctx.db.add(v)
    audit.log(ctx.db, org_id=ctx.org.id, user_id=ctx.user.id, actor=ctx.actor, role=ctx.role, action="POLICY_EDITED",
              resource=f"{p.code} v{v.version}")
    ctx.db.commit()
    ctx.db.refresh(p)
    return ser_policy(p)


@router.post("/{policy_id}/submit")
def submit(policy_id: str, ctx: Ctx = EDITORS):
    p = _policy(ctx, policy_id)
    if not p.versions or p.versions[0].status != "draft":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only a draft can be submitted for review")
    p.versions[0].status = "under_review"
    audit.log(ctx.db, org_id=ctx.org.id, user_id=ctx.user.id, actor=ctx.actor, role=ctx.role, action="POLICY_SUBMITTED",
              resource=f"{p.code} v{p.versions[0].version}")
    ctx.db.commit()
    return ser_policy(p)


@router.post("/{policy_id}/approve")
def approve(policy_id: str, ctx: Ctx = EDITORS):
    p = _policy(ctx, policy_id)
    if not p.versions or p.versions[0].status not in ("draft", "under_review"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Nothing to approve")
    cur = p.versions[0]
    for v in p.versions[1:]:
        if v.status == "approved":
            v.status = "superseded"
    if cur.version.startswith("0."):
        cur.version = "1.0"  # first approved version
    cur.status, cur.approver, cur.approved_at = "approved", ctx.actor, datetime.now(UTC)
    rag.index_policy(ctx.db, ctx.org, p, cur)
    audit.log(ctx.db, org_id=ctx.org.id, user_id=ctx.user.id, actor=ctx.actor, role=ctx.role, action="POLICY_APPROVED",
              resource=f"{p.code} v{cur.version}", details="Indexed for questionnaire answers.")
    ctx.db.commit()
    return ser_policy(p)


@router.get("/{policy_id}/versions/{version_id}")
def version(policy_id: str, version_id: str, ctx: Ctx = ANY_ROLE):
    p = _policy(ctx, policy_id)
    v = next((v for v in p.versions if str(v.id) == version_id), None)
    if not v:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Version not found")
    return {"id": str(v.id), "version": v.version, "status": v.status, "content": v.content, "author": v.author,
            "citations": v.citations, "approver": v.approver, "createdAt": v.created_at.isoformat()}
