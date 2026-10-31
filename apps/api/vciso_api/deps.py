from __future__ import annotations

import uuid
from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .db import get_db, set_context
from .models import Membership, Organization, User
from .security import COOKIE_NAME, decode_session_token

ROLE_LABEL = {"client_admin": "Client Admin", "vciso": "vCISO", "auditor": "Auditor"}


def client_ip(request: Request) -> str | None:
    fwd = request.headers.get("x-forwarded-for")
    return (fwd.split(",")[0].strip() if fwd else request.client.host if request.client else None)


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(COOKIE_NAME)
    claims = decode_session_token(token) if token else None
    if not claims or claims.get("pending_mfa"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not signed in")
    try:
        user_id = uuid.UUID(claims["sub"])
    except (KeyError, ValueError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid session") from None
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid session")
    set_context(db, user_id=user.id)
    return user


@dataclass
class Ctx:
    db: Session
    user: User
    org: Organization
    role: str
    ip: str | None

    @property
    def actor(self) -> str:
        return f"{self.user.full_name or self.user.email} ({ROLE_LABEL.get(self.role, self.role)})"


def org_ctx(org_id: uuid.UUID, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)) -> Ctx:
    m = db.scalars(select(Membership).where(Membership.user_id == user.id, Membership.organization_id == org_id)).first()
    if not m:
        # Same response for "does not exist" and "not yours" to avoid tenant enumeration.
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organisation not found")
    set_context(db, user_id=user.id, org_id=org_id)
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organisation not found")
    return Ctx(db=db, user=user, org=org, role=m.role, ip=client_ip(request))


def require(*roles: str):
    def dep(ctx: Ctx = Depends(org_ctx)) -> Ctx:
        if ctx.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, f"This action requires role: {', '.join(ROLE_LABEL[r] for r in roles)}")
        return ctx

    return dep


ANY_ROLE = Depends(require("client_admin", "vciso", "auditor"))
EDITORS = Depends(require("client_admin", "vciso"))
VCISO = Depends(require("vciso"))
