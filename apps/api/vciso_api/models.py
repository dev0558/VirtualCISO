"""Core data model (PRD §7). Every tenant-owned table carries organization_id and is
protected by an RLS policy created in the initial migration (TENANT_TABLES)."""
import uuid
from datetime import UTC, date, datetime
from typing import Any

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    LargeBinary,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base

EMBEDDING_DIM = 384


def now() -> datetime:
    return datetime.now(UTC)


def uid() -> uuid.UUID:
    return uuid.uuid4()


class IdMixin:
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uid)


class TenantMixin(IdMixin):
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )


# ---------------------------------------------------------------- tenancy & identity
class Organization(IdMixin, Base):
    __tablename__ = "organizations"
    slug: Mapped[str] = mapped_column(String(80), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    industry: Mapped[str] = mapped_column(String(200), default="")
    employee_count: Mapped[int] = mapped_column(Integer, default=0)
    primary_contact: Mapped[str] = mapped_column(String(200), default="")
    vciso_lead: Mapped[str] = mapped_column(String(200), default="")
    target_frameworks: Mapped[list[str]] = mapped_column(JSONB, default=lambda: ["iso27001", "nistcsf"])
    profile: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)  # policy questionnaire answers
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class User(IdMixin, Base):
    __tablename__ = "users"
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(200), default="")
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    totp_secret_enc: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    invite_token_hash: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    invite_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Membership(TenantMixin, Base):
    __tablename__ = "memberships"
    __table_args__ = (UniqueConstraint("user_id", "organization_id"),)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(20))  # client_admin | vciso | auditor
    title: Mapped[str] = mapped_column(String(120), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    user: Mapped[User] = relationship(lazy="joined")


# ---------------------------------------------------------------- integrations
class Integration(TenantMixin, Base):
    __tablename__ = "integrations"
    __table_args__ = (UniqueConstraint("organization_id", "type"),)
    type: Mapped[str] = mapped_column(String(40))  # m365 | google_workspace | github
    mode: Mapped[str] = mapped_column(String(10), default="live")  # live | demo
    status: Mapped[str] = mapped_column(String(20), default="connected")
    account_identifier: Mapped[str] = mapped_column(String(255), default="")
    credentials_enc: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    config: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


# ---------------------------------------------------------------- control library (global, read-only)
class Framework(IdMixin, Base):
    __tablename__ = "frameworks"
    code: Mapped[str] = mapped_column(String(40), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    version: Mapped[str] = mapped_column(String(20))


class Control(IdMixin, Base):
    __tablename__ = "controls"
    __table_args__ = (UniqueConstraint("framework_id", "code"),)
    framework_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("frameworks.id"))
    code: Mapped[str] = mapped_column(String(40), index=True)
    category: Mapped[str] = mapped_column(String(120))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    framework: Mapped[Framework] = relationship(lazy="joined")


class Check(IdMixin, Base):
    __tablename__ = "checks"
    code: Mapped[str] = mapped_column(String(40), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    connector: Mapped[str] = mapped_column(String(40))
    category: Mapped[str] = mapped_column(String(120))
    severity: Mapped[str] = mapped_column(String(10))
    description: Mapped[str] = mapped_column(Text)
    remediation: Mapped[str] = mapped_column(Text)
    rule: Mapped[dict[str, Any]] = mapped_column(JSONB)
    warn_rule: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    evidence_facts: Mapped[list[str]] = mapped_column(JSONB, default=list)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)


class CheckControlMap(Base):
    __tablename__ = "check_control_map"
    check_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("checks.id", ondelete="CASCADE"), primary_key=True)
    control_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("controls.id", ondelete="CASCADE"), primary_key=True)


# ---------------------------------------------------------------- runs & evidence
class CheckRun(TenantMixin, Base):
    __tablename__ = "check_runs"
    trigger: Mapped[str] = mapped_column(String(20))  # manual | scheduled | verify
    triggered_by: Mapped[str] = mapped_column(String(200), default="system")
    status: Mapped[str] = mapped_column(String(20), default="running")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    summary: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)


class Evidence(TenantMixin, Base):
    __tablename__ = "evidence"
    check_run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("check_runs.id", ondelete="CASCADE"))
    check_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("checks.id"), index=True)
    status: Mapped[str] = mapped_column(String(20))  # passed | failed | warning | skipped
    observed: Mapped[dict[str, Any]] = mapped_column(JSONB)  # sanitized facts used
    sha256: Mapped[str] = mapped_column(String(64))
    object_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    collected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, index=True)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)
    check: Mapped[Check] = relationship(lazy="joined")


# ---------------------------------------------------------------- policies
class Policy(TenantMixin, Base):
    __tablename__ = "policies"
    __table_args__ = (UniqueConstraint("organization_id", "code"),)
    code: Mapped[str] = mapped_column(String(20))
    template_key: Mapped[str] = mapped_column(String(60))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    mapped_controls: Mapped[list[str]] = mapped_column(JSONB, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    versions: Mapped[list["PolicyVersion"]] = relationship(
        back_populates="policy", order_by="PolicyVersion.created_at.desc()", lazy="selectin",
        cascade="all, delete-orphan", passive_deletes=True
    )


class PolicyVersion(TenantMixin, Base):
    __tablename__ = "policy_versions"
    policy_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("policies.id", ondelete="CASCADE"))
    version: Mapped[str] = mapped_column(String(10))
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft | under_review | approved | superseded
    content: Mapped[str] = mapped_column(Text)
    author: Mapped[str] = mapped_column(String(200))
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    confidence: Mapped[int | None] = mapped_column(Integer, nullable=True)
    citations: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list)
    approver: Mapped[str | None] = mapped_column(String(200), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    policy: Mapped[Policy] = relationship(back_populates="versions")


# ---------------------------------------------------------------- questionnaires
class Questionnaire(TenantMixin, Base):
    __tablename__ = "questionnaires"
    title: Mapped[str] = mapped_column(String(255))
    customer_name: Mapped[str] = mapped_column(String(255), default="")
    source_filename: Mapped[str] = mapped_column(String(255), default="")
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    answers: Mapped[list["Answer"]] = relationship(
        order_by="Answer.question_number", lazy="selectin", cascade="all, delete-orphan", passive_deletes=True)


class Answer(TenantMixin, Base):
    __tablename__ = "answers"
    questionnaire_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("questionnaires.id", ondelete="CASCADE"))
    question_number: Mapped[int] = mapped_column(Integer)
    category: Mapped[str] = mapped_column(String(120), default="General")
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text, default="")
    confidence: Mapped[int] = mapped_column(Integer, default=0)
    needs_review: Mapped[bool] = mapped_column(Boolean, default=True)
    cited_sources: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list)
    human_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    review_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_by: Mapped[str | None] = mapped_column(String(200), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# ---------------------------------------------------------------- vCISO workspace
class Risk(TenantMixin, Base):
    __tablename__ = "risks"
    title: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(60))
    description: Mapped[str] = mapped_column(Text, default="")
    likelihood: Mapped[int] = mapped_column(Integer)
    impact: Mapped[int] = mapped_column(Integer)
    owner: Mapped[str] = mapped_column(String(200), default="")
    treatment: Mapped[str] = mapped_column(String(20), default="Mitigate")
    treatment_plan: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="Open")
    linked_control_codes: Mapped[list[str]] = mapped_column(JSONB, default=list)
    linked_check_codes: Mapped[list[str]] = mapped_column(JSONB, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)

    @property
    def score(self) -> int:
        return self.likelihood * self.impact


class Task(TenantMixin, Base):
    __tablename__ = "tasks"
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    phase: Mapped[str] = mapped_column(String(40))
    priority: Mapped[str] = mapped_column(String(4))
    owner: Mapped[str] = mapped_column(String(200), default="")
    due_date: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), default="todo")
    source: Mapped[str] = mapped_column(String(20), default="manual")  # manual | roadmap
    linked_check_code: Mapped[str | None] = mapped_column(String(40), nullable=True)
    linked_risk_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Report(TenantMixin, Base):
    __tablename__ = "reports"
    quarter: Mapped[str] = mapped_column(String(20))
    author: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(20), default="draft")
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    content: Mapped[dict[str, Any]] = mapped_column(JSONB)
    citations: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list)
    vciso_notes: Mapped[str] = mapped_column(Text, default="")
    approved_by: Mapped[str | None] = mapped_column(String(200), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Milestone(TenantMixin, Base):
    __tablename__ = "milestones"
    title: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(40))
    target_date: Mapped[date] = mapped_column(Date)
    completed_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="upcoming")
    description: Mapped[str] = mapped_column(Text, default="")
    owner: Mapped[str] = mapped_column(String(200), default="")
    framework_ref: Mapped[str | None] = mapped_column(String(200), nullable=True)
    deliverables: Mapped[list[str]] = mapped_column(JSONB, default=list)
    is_audit_deadline: Mapped[bool] = mapped_column(Boolean, default=False)
    auditor_body: Mapped[str | None] = mapped_column(String(200), nullable=True)


class CalendarEvent(TenantMixin, Base):
    __tablename__ = "calendar_events"
    data: Mapped[dict[str, Any]] = mapped_column(JSONB)  # mirrors ComplianceCalendarEvent shape
    event_date: Mapped[date] = mapped_column(Date, index=True)


class AuditLog(TenantMixin, Base):
    __tablename__ = "audit_log"
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    actor: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(20))
    action: Mapped[str] = mapped_column(String(80))
    resource: Mapped[str] = mapped_column(String(255))
    details: Mapped[str] = mapped_column(Text, default="")
    ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, index=True)


class RagChunk(TenantMixin, Base):
    __tablename__ = "rag_chunks"
    source_type: Mapped[str] = mapped_column(String(20))  # policy | check | control
    source_ref: Mapped[str] = mapped_column(String(80))  # e.g. POL-02 v1.1 / M365-MFA-01
    source_name: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float]] = mapped_column(Vector(EMBEDDING_DIM))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Lead(IdMixin, Base):
    """Marketing-site demo requests. Not tenant data; app role may only INSERT."""

    __tablename__ = "leads"
    name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(320))
    company: Mapped[str] = mapped_column(String(200))
    company_size: Mapped[str] = mapped_column(String(40), default="")
    message: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


TENANT_TABLES = [
    "memberships", "integrations", "check_runs", "evidence", "policies", "policy_versions",
    "questionnaires", "answers", "risks", "tasks", "reports", "milestones", "calendar_events",
    "audit_log", "rag_chunks",
]
