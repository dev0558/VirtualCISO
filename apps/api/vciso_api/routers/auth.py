import base64
import io
import uuid
from datetime import UTC, datetime, timedelta

import pyotp
import qrcode
import qrcode.image.svg
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..db import get_db, set_context
from ..deps import client_ip, current_user
from ..models import Membership, Organization, User
from ..ratelimit import hit
from ..security import (
    COOKIE_NAME,
    create_session_token,
    decode_session_token,
    decrypt_str,
    encrypt_str,
    hash_password,
    hash_token,
    verify_password,
)
from ..services import audit
from ..services.orgs import create_org
from ..services.state import ser_org

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_cookie(resp: Response, token: str, max_age: int) -> None:
    resp.set_cookie(COOKIE_NAME, token, max_age=max_age, httponly=True, samesite="lax",
                    secure=get_settings().cookie_secure, path="/")


def _session(resp: Response, user: User) -> None:
    _set_cookie(resp, create_session_token(str(user.id), mfa=user.mfa_enabled), get_settings().session_hours * 3600)


class PasswordStr(BaseModel):
    password: str = Field(min_length=12, max_length=256)


class SignupIn(PasswordStr):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=200)
    company: str = Field(min_length=2, max_length=200)
    industry: str = Field(default="", max_length=200)
    employee_count: int = Field(default=0, ge=0, le=1_000_000)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(max_length=256)


class CodeIn(BaseModel):
    code: str = Field(pattern=r"^\d{6}$")


def me_payload(db: Session, user: User) -> dict:
    set_context(db, user_id=user.id)
    rows = db.execute(select(Membership, Organization).join(Organization, Organization.id == Membership.organization_id)
                      .where(Membership.user_id == user.id).order_by(Organization.name)).all()
    return {"user": {"id": str(user.id), "email": user.email, "fullName": user.full_name, "mfaEnabled": user.mfa_enabled},
            "organizations": [ser_org(o, m.role) for m, o in rows]}


@router.post("/signup", status_code=201)
def signup(body: SignupIn, request: Request, response: Response, db: Session = Depends(get_db)):
    hit(f"signup:{client_ip(request)}", limit=10, window=3600)
    email = body.email.lower()
    if db.scalars(select(User).where(User.email == email)).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")
    user = User(email=email, full_name=body.full_name.strip(), password_hash=hash_password(body.password))
    db.add(user)
    db.flush()
    create_org(db, user=user, name=body.company.strip(), industry=body.industry.strip(), employee_count=body.employee_count)
    db.commit()
    _session(response, user)
    return me_payload(db, user)


@router.post("/login")
def login(body: LoginIn, request: Request, response: Response, db: Session = Depends(get_db)):
    email = body.email.lower()
    hit(f"login:{client_ip(request)}:{email}", limit=8, window=900)
    user = db.scalars(select(User).where(User.email == email)).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email or password is incorrect")
    if user.mfa_enabled:
        _set_cookie(response, create_session_token(str(user.id), mfa=False, pending_mfa=True), 600)
        return {"mfaRequired": True}
    user.last_login_at = datetime.now(UTC)
    db.commit()
    _session(response, user)
    return me_payload(db, user)


@router.post("/mfa/verify")
def mfa_verify(body: CodeIn, request: Request, response: Response, db: Session = Depends(get_db)):
    claims = decode_session_token(request.cookies.get(COOKIE_NAME, ""))
    if not claims or not claims.get("pending_mfa"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in again")
    hit(f"mfa:{claims['sub']}", limit=6, window=600)
    user = db.get(User, uuid.UUID(claims["sub"]))
    if not user or not user.totp_secret_enc or not pyotp.TOTP(decrypt_str(user.totp_secret_enc)).verify(body.code, valid_window=1):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid authentication code")
    user.last_login_at = datetime.now(UTC)
    db.commit()
    _session(response, user)
    return me_payload(db, user)


@router.post("/logout", status_code=204)
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path="/")


@router.get("/me")
def me(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return me_payload(db, user)


@router.post("/mfa/setup")
def mfa_setup(user: User = Depends(current_user), db: Session = Depends(get_db)):
    if user.mfa_enabled:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "MFA is already enabled")
    secret = pyotp.random_base32()
    user.totp_secret_enc = encrypt_str(secret)
    db.commit()
    uri = pyotp.TOTP(secret).provisioning_uri(name=user.email, issuer_name="SecuraVantage")
    img = qrcode.make(uri, image_factory=qrcode.image.svg.SvgPathImage, box_size=8, border=1)
    buf = io.BytesIO()
    img.save(buf)
    return {"secret": secret, "otpauthUri": uri, "qrSvgDataUri": "data:image/svg+xml;base64," + base64.b64encode(buf.getvalue()).decode()}


@router.post("/mfa/enable")
def mfa_enable(body: CodeIn, response: Response, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not user.totp_secret_enc or not pyotp.TOTP(decrypt_str(user.totp_secret_enc)).verify(body.code, valid_window=1):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "That code did not match. Check your device clock and try again.")
    user.mfa_enabled = True
    for m in db.scalars(select(Membership).where(Membership.user_id == user.id)).all():
        set_context(db, user_id=user.id, org_id=m.organization_id)
        audit.log(db, org_id=m.organization_id, user_id=user.id, actor=user.full_name or user.email, role=m.role,
                  action="MFA_ENABLED", resource=user.email)
    db.commit()
    _session(response, user)
    return {"mfaEnabled": True}


class InviteAcceptIn(PasswordStr):
    token: str = Field(min_length=20, max_length=200)
    full_name: str = Field(min_length=1, max_length=200)


@router.get("/invite/{token}")
def invite_info(token: str, db: Session = Depends(get_db)):
    user = db.scalars(select(User).where(User.invite_token_hash == hash_token(token))).first()
    if not user or not user.invite_expires_at or user.invite_expires_at < datetime.now(UTC):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This invitation is invalid or has expired")
    return {"email": user.email, "fullName": user.full_name}


@router.post("/invite/accept")
def invite_accept(body: InviteAcceptIn, response: Response, db: Session = Depends(get_db)):
    user = db.scalars(select(User).where(User.invite_token_hash == hash_token(body.token))).first()
    if not user or not user.invite_expires_at or user.invite_expires_at < datetime.now(UTC):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This invitation is invalid or has expired")
    user.password_hash = hash_password(body.password)
    user.full_name = body.full_name.strip()
    user.invite_token_hash, user.invite_expires_at = None, None
    user.last_login_at = datetime.now(UTC)
    db.commit()
    _session(response, user)
    return me_payload(db, user)


INVITE_TTL = timedelta(days=7)
