from datetime import UTC, date, datetime
from typing import Literal

import yaml
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import select

from ..ai import reports as report_gen
from ..config import get_settings
from ..deps import ANY_ROLE, EDITORS, VCISO, Ctx
from ..models import Milestone, Report, Risk, Task
from ..services import audit, exports, roadmap
from ..services.state import ser_milestone, ser_report, ser_risk, ser_task

router = APIRouter(prefix="/orgs/{org_id}", tags=["vciso"])

RiskCategory = Literal["Privileged Access", "Access & Identity", "Infrastructure & Data", "Application & Code",
                       "Governance & Third-Party", "Operational Continuity"]


def _get(ctx: Ctx, model, oid: str):
    obj = ctx.db.scalars(select(model).where(model.organization_id == ctx.org.id, model.id == oid)).first()
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"{model.__name__} not found")
    return obj


def _log(ctx: Ctx, action: str, resource: str, details: str = "") -> None:
    audit.log(ctx.db, org_id=ctx.org.id, user_id=ctx.user.id, actor=ctx.actor, role=ctx.role, action=action,
              resource=resource, details=details)


# ------------------------------------------------------------------ risks
@router.get("/risk-templates")
def risk_templates(ctx: Ctx = ANY_ROLE):
    return yaml.safe_load((get_settings().seed_dir / "risk_templates.yaml").read_text())


class RiskIn(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    category: RiskCategory
    description: str = Field(default="", max_length=5000)
    likelihood: int = Field(ge=1, le=5)
    impact: int = Field(ge=1, le=5)
    owner: str = Field(default="", max_length=200)
    treatment: Literal["Mitigate", "Accept", "Transfer", "Avoid"] = "Mitigate"
    treatment_plan: str = Field(default="", max_length=5000)
    status: Literal["Open", "In Progress", "Treated", "Accepted"] = "Open"
    linked_control_codes: list[str] = Field(default_factory=list, max_length=30)
    linked_check_codes: list[str] = Field(default_factory=list, max_length=30)


@router.post("/risks", status_code=201)
def add_risk(body: RiskIn, ctx: Ctx = EDITORS):
    r = Risk(organization_id=ctx.org.id, **body.model_dump())
    ctx.db.add(r)
    _log(ctx, "RISK_ADDED", body.title, f"Score {body.likelihood * body.impact}")
    ctx.db.commit()
    return ser_risk(r)


@router.put("/risks/{risk_id}")
def update_risk(risk_id: str, body: RiskIn, ctx: Ctx = EDITORS):
    r = _get(ctx, Risk, risk_id)
    for k, v in body.model_dump().items():
        setattr(r, k, v)
    r.updated_at = datetime.now(UTC)
    _log(ctx, "RISK_UPDATED", r.title, f"Score {r.score}, status {r.status}")
    ctx.db.commit()
    return ser_risk(r)


@router.delete("/risks/{risk_id}", status_code=204)
def delete_risk(risk_id: str, ctx: Ctx = VCISO):
    r = _get(ctx, Risk, risk_id)
    _log(ctx, "RISK_DELETED", r.title)
    ctx.db.delete(r)
    ctx.db.commit()


# ------------------------------------------------------------------ roadmap
class TaskIn(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(default="", max_length=5000)
    phase: Literal["Sprint 1 (Days 1-30)", "Sprint 2 (Days 31-60)", "Sprint 3 (Days 61-90)"]
    priority: Literal["P1", "P2", "P3"]
    owner: str = Field(default="", max_length=200)
    due_date: date
    linked_check_code: str | None = None


@router.post("/tasks", status_code=201)
def add_task(body: TaskIn, ctx: Ctx = EDITORS):
    t = Task(organization_id=ctx.org.id, source="manual", **body.model_dump())
    ctx.db.add(t)
    _log(ctx, "TASK_ADDED", body.title, f"{body.priority}, due {body.due_date}")
    ctx.db.commit()
    return ser_task(t)


class TaskPatch(BaseModel):
    status: Literal["todo", "in_progress", "completed"] | None = None
    owner: str | None = Field(default=None, max_length=200)
    due_date: date | None = None


@router.patch("/tasks/{task_id}")
def patch_task(task_id: str, body: TaskPatch, ctx: Ctx = EDITORS):
    t = _get(ctx, Task, task_id)
    changes = body.model_dump(exclude_none=True)
    for k, v in changes.items():
        setattr(t, k, v)
    _log(ctx, "TASK_UPDATED", t.title, ", ".join(f"{k}={v}" for k, v in changes.items()))
    ctx.db.commit()
    return ser_task(t)


@router.post("/roadmap/generate")
def generate_roadmap(ctx: Ctx = VCISO):
    created = roadmap.generate(ctx.db, ctx.org, default_owner=ctx.user.full_name or ctx.user.email)
    _log(ctx, "ROADMAP_GENERATED", "90-day roadmap", f"{len(created)} tasks created from failing checks and open risks")
    ctx.db.commit()
    return {"created": len(created)}


# ------------------------------------------------------------------ leadership report
class ReportGenIn(BaseModel):
    quarter: str | None = Field(default=None, pattern=r"^Q[1-4] \d{4}$")


@router.post("/reports/generate")
def generate_report(body: ReportGenIn, ctx: Ctx = VCISO):
    rep = report_gen.generate(ctx.db, ctx.org, body.quarter or report_gen.current_quarter(), author=ctx.actor)
    _log(ctx, "REPORT_DRAFTED", f"Leadership report {rep.quarter}", "AI-assisted" if rep.ai_generated else "Template")
    ctx.db.commit()
    return ser_report(rep)


class ReportEdit(BaseModel):
    executiveSummary: str = Field(max_length=6000)
    topRisksSummary: list[str] = Field(max_length=10)
    quarterlyMilestones: list[str] = Field(max_length=10)
    next90DaysPlan: list[str] = Field(max_length=10)
    vCISONotes: str = Field(default="", max_length=4000)


@router.put("/reports/{report_id}")
def edit_report(report_id: str, body: ReportEdit, ctx: Ctx = VCISO):
    r = _get(ctx, Report, report_id)
    r.content = {**r.content, **body.model_dump(exclude={"vCISONotes"})}
    r.vciso_notes, r.status = body.vCISONotes, "draft"
    _log(ctx, "REPORT_EDITED", f"Leadership report {r.quarter}")
    ctx.db.commit()
    return ser_report(r)


@router.post("/reports/{report_id}/approve")
def approve_report(report_id: str, ctx: Ctx = VCISO):
    r = _get(ctx, Report, report_id)
    r.status, r.approved_by, r.approved_at = "approved", ctx.actor, datetime.now(UTC)
    _log(ctx, "REPORT_APPROVED", f"Leadership report {r.quarter}")
    ctx.db.commit()
    return ser_report(r)


@router.get("/reports/{report_id}/pdf")
def report_pdf(report_id: str, ctx: Ctx = ANY_ROLE):
    r = _get(ctx, Report, report_id)
    pdf = exports.report_pdf(ctx.org, ser_report(r))
    return Response(pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{ctx.org.slug}-{r.quarter.replace(" ", "-")}-report.pdf"'})


# ------------------------------------------------------------------ milestones
class MilestoneIn(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    category: Literal["audit_deadline", "internal_milestone", "policy_governance", "technical_verification"]
    target_date: date
    description: str = Field(default="", max_length=3000)
    owner: str = Field(default="", max_length=200)
    framework_ref: str | None = Field(default=None, max_length=200)
    deliverables: list[str] = Field(default_factory=list, max_length=20)
    is_audit_deadline: bool = False
    auditor_body: str | None = Field(default=None, max_length=200)


@router.post("/milestones", status_code=201)
def add_milestone(body: MilestoneIn, ctx: Ctx = EDITORS):
    m = Milestone(organization_id=ctx.org.id, status="upcoming", **body.model_dump())
    ctx.db.add(m)
    _log(ctx, "MILESTONE_ADDED", body.title, str(body.target_date))
    ctx.db.commit()
    return ser_milestone(m)


class MilestonePatch(BaseModel):
    status: Literal["completed", "in_progress", "upcoming", "overdue"]


@router.patch("/milestones/{mid}")
def patch_milestone(mid: str, body: MilestonePatch, ctx: Ctx = EDITORS):
    m = _get(ctx, Milestone, mid)
    m.status = body.status
    m.completed_date = date.today() if body.status == "completed" else None
    _log(ctx, "MILESTONE_UPDATED", m.title, body.status)
    ctx.db.commit()
    return ser_milestone(m)


# ------------------------------------------------------------------ auditor export
@router.get("/export")
def export(framework: Literal["iso27001", "nistcsf"], format: Literal["csv", "pdf"] = "csv", ctx: Ctx = ANY_ROLE):
    d = exports.dossier(ctx.db, ctx.org, framework)
    _log(ctx, "EVIDENCE_EXPORTED", f"{d['framework']} ({format.upper()})")
    ctx.db.commit()
    name = f"{ctx.org.slug}-{framework}-evidence-{date.today():%Y%m%d}.{format}"
    if format == "csv":
        return Response(exports.to_csv(d), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="{name}"'})
    return Response(exports.to_pdf(d), media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{name}"'})
