"""Quarterly leadership report: posture + risks + roadmap -> one-page draft for vCISO review."""
from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Organization, Report, Risk, Task
from ..services.state import compute_posture
from . import llm


class ReportDraft(BaseModel):
    executive_summary: str = Field(description="4-6 sentences for a non-technical board audience")
    top_risks: list[str] = Field(description="3-5 bullets, each citing a risk or check code in brackets")
    quarterly_milestones: list[str] = Field(description="Progress achieved, 3-5 bullets, cite codes")
    next_90_days: list[str] = Field(description="Prioritised plan, 3-6 bullets, cite codes")
    citations: list[str] = Field(description="Codes cited: check codes, risk IDs (R-n), task IDs (T-n), control codes")


SYSTEM = """You are a virtual CISO writing a one-page quarterly security report for the leadership of a small company.
Use only the data provided. Be specific and plain-spoken; avoid jargon and hype. Never claim certification; describe
readiness. Every risk, milestone and plan bullet must cite at least one code from the data in square brackets."""


def current_quarter(d: date | None = None) -> str:
    d = d or date.today()
    return f"Q{(d.month - 1) // 3 + 1} {d.year}"


def generate(db: Session, org: Organization, quarter: str, author: str) -> Report:
    posture = compute_posture(db, org)
    checks = posture["checks"]
    risks = db.scalars(select(Risk).where(Risk.organization_id == org.id)).all()
    risks = sorted(risks, key=lambda r: -r.score)
    tasks = db.scalars(select(Task).where(Task.organization_id == org.id).order_by(Task.due_date)).all()
    failing = [c for c in checks if c["status"] == "failed"]
    passing = [c for c in checks if c["status"] == "passed"]
    s = posture["scores"]
    posture_block = {"isoScore": s["isoScore"], "nistScore": s["nistScore"], "totalChecks": len([c for c in checks if c["status"] != "not_run"]),
                     "passingChecks": len(passing), "criticalGaps": len([c for c in failing if c["severity"] in ("critical", "high")])}
    risk_ids = {f"R-{i + 1}": r for i, r in enumerate(risks)}
    task_ids = {f"T-{i + 1}": t for i, t in enumerate(tasks)}

    content = {
        "executiveSummary": (
            f"{org.name} is at {s['isoScore']}% readiness against the tracked ISO 27001:2022 Annex A controls and "
            f"{s['nistScore']}% against NIST CSF 2.0 categories. {len(passing)} automated checks pass and {len(failing)} fail, "
            f"of which {posture_block['criticalGaps']} are critical or high severity. "
            f"{len([r for r in risks if r.status in ('Open', 'In Progress')])} risks remain open in the register. "
            "The plan below prioritises the highest-severity gaps for the next 90 days."),
        "compliancePosture": posture_block,
        "topRisksSummary": [f"{r.title} — score {r.score}/25, {r.status.lower()} [{rid}]" for rid, r in list(risk_ids.items())[:4]]
        or [f"{c['name']} is failing [{c['code']}]" for c in failing[:4]],
        "quarterlyMilestones": [f"{t.title} [{tid}]" for tid, t in task_ids.items() if t.status == "completed"][:4]
        or [f"{c['name']} verified passing [{c['code']}]" for c in passing[:4]],
        "next90DaysPlan": [f"{t.title} — {t.owner or 'unassigned'}, due {t.due_date:%d %b} [{tid}]"
                           for tid, t in task_ids.items() if t.status != "completed"][:6],
    }
    citations = [{"type": "check", "reference": c["code"], "name": c["name"]} for c in failing[:8]]
    ai_used = False
    if llm.enabled():
        data = {
            "organization": {"name": org.name, "industry": org.industry, "employees": org.employee_count},
            "quarter": quarter, "scores": posture_block,
            "failing_checks": [{"code": c["code"], "name": c["name"], "severity": c["severity"]} for c in failing],
            "passing_checks": [c["code"] for c in passing],
            "risks": [{"id": rid, "title": r.title, "score": r.score, "status": r.status, "treatment": r.treatment_plan}
                      for rid, r in risk_ids.items()],
            "tasks": [{"id": tid, "title": t.title, "status": t.status, "priority": t.priority, "due": t.due_date.isoformat(),
                       "owner": t.owner} for tid, t in task_ids.items()],
        }
        try:
            d = llm.structured(SYSTEM, f"<report_data>\n{data}\n</report_data>", ReportDraft, effort="medium")
            known = {c["code"] for c in checks} | set(risk_ids) | set(task_ids) | {c["code"] for c in posture["controls"]}
            content.update({"executiveSummary": d.executive_summary, "topRisksSummary": d.top_risks,
                            "quarterlyMilestones": d.quarterly_milestones, "next90DaysPlan": d.next_90_days})
            citations = [{"type": "risk" if c.startswith("R-") else "task" if c.startswith("T-") else "check",
                          "reference": c, "name": (risk_ids[c].title if c in risk_ids else task_ids[c].title if c in task_ids else c)}
                         for c in d.citations if c in known]
            ai_used = True
        except llm.AIUnavailable:
            pass
    rep = Report(organization_id=org.id, quarter=quarter, author=author, status="draft", ai_generated=ai_used,
                 content=content, citations=citations)
    db.add(rep)
    return rep
