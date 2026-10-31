"""90-day roadmap generation from failing controls/checks and open risks (rules, no AI)."""
from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Organization, Risk, Task
from .state import compute_posture

PHASES = [("Sprint 1 (Days 1-30)", 30), ("Sprint 2 (Days 31-60)", 60), ("Sprint 3 (Days 61-90)", 90)]
SEVERITY_PLAN = {"critical": ("P1", 0), "high": ("P1", 0), "medium": ("P2", 1), "low": ("P3", 2)}


def generate(db: Session, org: Organization, default_owner: str) -> list[Task]:
    posture = compute_posture(db, org)
    existing = db.scalars(select(Task).where(Task.organization_id == org.id, Task.status != "completed")).all()
    have_checks = {t.linked_check_code for t in existing if t.linked_check_code}
    have_risks = {t.linked_risk_id for t in existing if t.linked_risk_id}
    today = date.today()
    created: list[Task] = []

    for c in posture["checks"]:
        if c["status"] not in ("failed", "warning") or c["code"] in have_checks:
            continue
        prio, phase_idx = SEVERITY_PLAN[c["severity"]]
        if c["status"] == "warning":
            phase_idx = min(phase_idx + 1, 2)
            prio = {"P1": "P2", "P2": "P3"}.get(prio, prio)
        phase, days = PHASES[phase_idx]
        t = Task(organization_id=org.id, title=f"Remediate: {c['name']}", description=c["remediationGuidance"],
                 phase=phase, priority=prio, owner=default_owner, due_date=today + timedelta(days=days),
                 status="todo", source="roadmap", linked_check_code=c["code"])
        db.add(t)
        created.append(t)

    risks = db.scalars(select(Risk).where(Risk.organization_id == org.id, Risk.status.in_(["Open", "In Progress"]))).all()
    for r in sorted(risks, key=lambda r: -r.score):
        if r.id in have_risks or r.treatment in ("Accept",) or r.score < 8:
            continue
        if any(code in have_checks or any(t.linked_check_code == code for t in created) for code in r.linked_check_codes):
            continue  # already covered by a check remediation task
        phase_idx = 0 if r.score >= 15 else 1 if r.score >= 10 else 2
        phase, days = PHASES[phase_idx]
        t = Task(organization_id=org.id, title=f"Treat risk: {r.title}", description=r.treatment_plan or r.description,
                 phase=phase, priority="P1" if r.score >= 15 else "P2" if r.score >= 10 else "P3",
                 owner=r.owner or default_owner, due_date=today + timedelta(days=days), status="todo",
                 source="roadmap", linked_risk_id=r.id)
        db.add(t)
        created.append(t)
    return created
