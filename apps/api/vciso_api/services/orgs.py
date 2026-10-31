import re
import secrets
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..ai.policies import TEMPLATE_KEYS, load_template
from ..db import set_context
from ..models import Membership, Organization, Policy, User
from . import audit


def slugify(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:50] or "org"
    return f"{base}-{secrets.token_hex(3)}"


def create_org(db: Session, *, user: User, name: str, industry: str = "", employee_count: int = 0,
               role: str = "client_admin", is_demo: bool = False, slug: str | None = None, **extra) -> Organization:
    org_id = uuid.uuid4()
    set_context(db, user_id=user.id, org_id=org_id)
    org = Organization(id=org_id, slug=slug or slugify(name), name=name, industry=industry,
                       employee_count=employee_count, primary_contact=user.email, is_demo=is_demo, **extra)
    db.add(org)
    db.flush()
    db.add(Membership(organization_id=org_id, user_id=user.id, role=role))
    for key in TEMPLATE_KEYS:
        meta, _ = load_template(key)
        db.add(Policy(organization_id=org_id, code=meta["code"], template_key=key, title=meta["title"],
                      description=meta["description"], mapped_controls=meta["controls"]))
    audit.log(db, org_id=org_id, user_id=user.id, actor=user.full_name or user.email, role=role,
              action="ORG_CREATED", resource=name)
    db.flush()
    return org


def add_member(db: Session, org: Organization, user: User, role: str, title: str = "") -> Membership:
    m = db.scalars(select(Membership).where(Membership.organization_id == org.id, Membership.user_id == user.id)).first()
    if m:
        m.role = role
        return m
    m = Membership(organization_id=org.id, user_id=user.id, role=role, title=title)
    db.add(m)
    return m
