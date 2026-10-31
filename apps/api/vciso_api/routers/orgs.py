from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..db import get_db, set_context
from ..deps import ANY_ROLE, EDITORS, Ctx, current_user
from ..models import Membership, Organization, Risk, Task, User
from ..security import new_invite_token
from ..services import audit
from ..services.orgs import add_member, create_org
from ..services.state import build_state, compute_posture, ser_org
from .auth import INVITE_TTL

router = APIRouter(prefix="/orgs", tags=["organisations"])


@router.get("")
def overview(user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Multi-client view: every organisation the user belongs to with score, open risks, overdue tasks."""
    memberships = db.scalars(select(Membership).where(Membership.user_id == user.id)).all()
    out = []
    for m in memberships:
        set_context(db, user_id=user.id, org_id=m.organization_id)
        org = db.get(Organization, m.organization_id)
        posture = compute_posture(db, org)
        open_risks = db.scalar(select(func.count()).select_from(Risk).where(
            Risk.organization_id == org.id, Risk.status.in_(["Open", "In Progress"]))) or 0
        high_risks = db.scalar(select(func.count()).select_from(Risk).where(
            Risk.organization_id == org.id, Risk.status.in_(["Open", "In Progress"]), Risk.likelihood * Risk.impact >= 15)) or 0
        overdue = db.scalar(select(func.count()).select_from(Task).where(
            Task.organization_id == org.id, Task.status != "completed", Task.due_date < date.today())) or 0
        checks = posture["checks"]
        out.append({**ser_org(org, m.role), "scores": posture["scores"], "openRisks": open_risks, "highRisks": high_risks,
                    "overdueTasks": overdue, "failingChecks": sum(1 for c in checks if c["status"] == "failed"),
                    "lastRunAt": max((c["lastRunAt"] for c in checks if c["lastRunAt"]), default=None)})
    set_context(db, user_id=user.id)
    return {"organizations": sorted(out, key=lambda o: o["name"])}


class OrgIn(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    industry: str = Field(default="", max_length=200)
    employee_count: int = Field(default=0, ge=0, le=1_000_000)


@router.post("", status_code=201)
def create(body: OrgIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Create another client organisation (used by vCISOs onboarding a new client)."""
    is_vciso = db.scalar(select(func.count()).select_from(Membership).where(Membership.user_id == user.id, Membership.role == "vciso"))
    org = create_org(db, user=user, name=body.name, industry=body.industry, employee_count=body.employee_count,
                     role="vciso" if is_vciso else "client_admin")
    db.commit()
    return ser_org(org, "vciso" if is_vciso else "client_admin")


@router.get("/{org_id}/state")
def state(ctx: Ctx = ANY_ROLE):
    return build_state(ctx.db, ctx.org, ctx.role)


class ProfileIn(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=200)
    industry: str | None = Field(default=None, max_length=200)
    employee_count: int | None = Field(default=None, ge=0, le=1_000_000)
    vciso_lead: str | None = Field(default=None, max_length=200)
    profile: dict[str, str | int | bool] | None = None


@router.patch("/{org_id}")
def update_org(body: ProfileIn, ctx: Ctx = EDITORS):
    o = ctx.org
    for f in ("name", "industry", "employee_count", "vciso_lead"):
        v = getattr(body, f)
        if v is not None:
            setattr(o, f, v)
    if body.profile is not None:
        o.profile = {**(o.profile or {}), **{k[:60]: (v[:500] if isinstance(v, str) else v) for k, v in body.profile.items()}}
    audit.log(ctx.db, org_id=o.id, user_id=ctx.user.id, actor=ctx.actor, role=ctx.role, action="ORG_UPDATED", resource=o.name)
    ctx.db.commit()
    return ser_org(o, ctx.role)


@router.get("/{org_id}/members")
def members(ctx: Ctx = ANY_ROLE):
    ms = ctx.db.scalars(select(Membership).where(Membership.organization_id == ctx.org.id)).all()
    return {"members": [{"id": str(m.id), "userId": str(m.user_id), "email": m.user.email, "fullName": m.user.full_name,
                         "role": m.role, "mfaEnabled": m.user.mfa_enabled, "pending": m.user.password_hash is None,
                         "lastLoginAt": m.user.last_login_at.isoformat() if m.user.last_login_at else None} for m in ms]}


class InviteIn(BaseModel):
    email: EmailStr
    full_name: str = Field(default="", max_length=200)
    role: str = Field(pattern="^(client_admin|vciso|auditor)$")


@router.post("/{org_id}/members", status_code=201)
def invite(body: InviteIn, ctx: Ctx = EDITORS):
    if body.role == "vciso" and ctx.role != "vciso":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only a vCISO can add another vCISO")
    email = body.email.lower()
    user = ctx.db.scalars(select(User).where(User.email == email)).first()
    invite_url = None
    if not user:
        token, token_hash = new_invite_token()
        user = User(email=email, full_name=body.full_name, invite_token_hash=token_hash,
                    invite_expires_at=datetime.now(UTC) + INVITE_TTL)
        ctx.db.add(user)
        ctx.db.flush()
        invite_url = f"{get_settings().public_app_url}/invite/{token}"
    add_member(ctx.db, ctx.org, user, body.role)
    audit.log(ctx.db, org_id=ctx.org.id, user_id=ctx.user.id, actor=ctx.actor, role=ctx.role, action="MEMBER_INVITED",
              resource=email, details=f"Role {body.role}")
    ctx.db.commit()
    # No email service in the MVP: the inviter shares the one-time link (valid 7 days).
    return {"inviteUrl": invite_url, "existingUser": invite_url is None}


@router.delete("/{org_id}/members/{membership_id}", status_code=204)
def remove_member(membership_id: str, ctx: Ctx = EDITORS):
    m = ctx.db.scalars(select(Membership).where(Membership.organization_id == ctx.org.id,
                                                Membership.id == membership_id)).first()
    if not m:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member not found")
    if m.user_id == ctx.user.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot remove yourself")
    audit.log(ctx.db, org_id=ctx.org.id, user_id=ctx.user.id, actor=ctx.actor, role=ctx.role, action="MEMBER_REMOVED",
              resource=m.user.email)
    ctx.db.delete(m)
    ctx.db.commit()
