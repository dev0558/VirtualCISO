"""Read models: latest check status, control status, framework scores and API serializers."""
from __future__ import annotations

from collections import defaultdict
from datetime import date
from typing import Any

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import distinct_on
from sqlalchemy.orm import Session

from ..models import (
    AuditLog,
    CalendarEvent,
    Check,
    CheckControlMap,
    CheckRun,
    Control,
    Evidence,
    Integration,
    Milestone,
    Organization,
    Policy,
    Questionnaire,
    Report,
    Risk,
    Task,
)

FRAMEWORK_LABEL = {"iso27001": "ISO 27001:2022", "nistcsf": "NIST CSF 2.0"}


def iso(dt) -> str | None:
    return dt.isoformat() if dt else None


# ------------------------------------------------------------------ library
def control_library(db: Session) -> tuple[list[Control], dict[str, list[str]]]:
    controls = sorted(db.scalars(select(Control)).all(),
                      key=lambda c: (c.framework.code, [int(p) if p.isdigit() else p for p in c.code.replace(".", " ").split()]))
    rows = db.execute(select(Check.code, Control.code).join(CheckControlMap, CheckControlMap.check_id == Check.id)
                      .join(Control, Control.id == CheckControlMap.control_id)).all()
    by_check: dict[str, list[str]] = defaultdict(list)
    for check_code, control_code in rows:
        by_check[check_code].append(control_code)
    return list(controls), by_check


def latest_evidence(db: Session, org_id) -> dict[str, Evidence]:
    rows = db.scalars(
        select(Evidence).where(Evidence.organization_id == org_id)
        .ext(distinct_on(Evidence.check_id)).order_by(Evidence.check_id, Evidence.collected_at.desc())
    ).all()
    return {e.check.code: e for e in rows}


def approved_policies(policies: list[Policy]) -> list[tuple[Policy, Any]]:
    out = []
    for p in policies:
        v = next((v for v in p.versions if v.status == "approved"), None)
        if v:
            out.append((p, v))
    return out


def compute_posture(db: Session, org: Organization) -> dict[str, Any]:
    controls, by_check = control_library(db)
    checks = db.scalars(select(Check).where(Check.enabled.is_(True)).order_by(Check.code)).all()
    latest = latest_evidence(db, org.id)
    policies = db.scalars(select(Policy).where(Policy.organization_id == org.id).order_by(Policy.code)).all()
    approved = approved_policies(list(policies))
    policy_controls: dict[str, list[str]] = defaultdict(list)
    for p, _v in approved:
        for c in p.mapped_controls:
            policy_controls[c].append(p.code)

    check_controls = by_check
    control_checks: dict[str, list[str]] = defaultdict(list)
    for chk_code, codes in check_controls.items():
        for c in codes:
            control_checks[c].append(chk_code)

    control_rows = []
    for c in controls:
        statuses = [latest[k].status for k in control_checks.get(c.code, []) if k in latest and latest[k].status != "skipped"]
        if "failed" in statuses:
            st = "failed"
        elif "warning" in statuses:
            st = "in_progress"
        elif statuses:
            st = "passed"
        elif policy_controls.get(c.code):
            st = "passed"
        else:
            st = "manual_verification"
        control_rows.append({
            "id": str(c.id), "framework": FRAMEWORK_LABEL[c.framework.code], "frameworkCode": c.framework.code,
            "code": c.code, "category": c.category, "title": c.title, "description": c.description, "status": st,
            "applicableChecks": sorted(control_checks.get(c.code, [])),
            "policies": sorted(policy_controls.get(c.code, [])),
            "evidenceSource": "automated" if statuses else ("policy" if policy_controls.get(c.code) else "none"),
        })

    def score(fw: str) -> tuple[int, int, int]:
        rows = [r for r in control_rows if r["frameworkCode"] == fw]
        passed = sum(1 for r in rows if r["status"] == "passed")
        return (round(100 * passed / len(rows)) if rows else 0, passed, len(rows))

    iso_s, iso_p, iso_t = score("iso27001")
    nist_s, nist_p, nist_t = score("nistcsf")

    connected = set(db.scalars(select(Integration.type).where(Integration.organization_id == org.id)).all())
    check_rows = []
    for chk in checks:
        ev = latest.get(chk.code)
        check_rows.append({
            "id": chk.code, "code": chk.code, "name": chk.name, "connector": chk.connector,
            "category": chk.category, "severity": chk.severity, "description": chk.description,
            "mappedControlCodes": sorted(check_controls.get(chk.code, [])),
            "status": ev.status if ev else ("not_run" if chk.connector in connected else "not_connected"),
            "lastRunAt": iso(ev.collected_at) if ev else None,
            "latestEvidenceHash": ev.sha256 if ev else None,
            "remediationGuidance": chk.remediation,
            "observed": (ev.observed or {}).get("facts", {}) if ev else {},
            "rule": chk.rule,
        })

    return {
        "controls": control_rows,
        "checks": check_rows,
        "policies": policies,
        "scores": {"isoScore": iso_s, "nistScore": nist_s, "isoPassed": iso_p, "isoTotal": iso_t,
                   "nistPassed": nist_p, "nistTotal": nist_t},
    }


# ------------------------------------------------------------------ serializers
def ser_org(o: Organization, role: str | None = None) -> dict[str, Any]:
    return {"id": str(o.id), "slug": o.slug, "name": o.name, "industry": o.industry, "employeeCount": o.employee_count,
            "primaryContact": o.primary_contact, "vcisoLead": o.vciso_lead, "isDemo": o.is_demo,
            "targetFrameworks": [FRAMEWORK_LABEL.get(f, f) for f in o.target_frameworks], "profile": o.profile or {},
            **({"role": role} if role else {})}


def ser_policy(p: Policy) -> dict[str, Any]:
    current = p.versions[0] if p.versions else None
    approved = next((v for v in p.versions if v.status == "approved"), None)
    return {
        "id": str(p.id), "code": p.code, "templateKey": p.template_key, "title": p.title, "description": p.description,
        "mappedControls": p.mapped_controls,
        "version": current.version if current else "—", "status": current.status if current else "not_started",
        "content": current.content if current else "", "author": current.author if current else "",
        "aiGenerated": current.ai_generated if current else False,
        "confidence": current.confidence if current else None,
        "citations": current.citations if current else [],
        "approver": approved.approver if approved else None, "approvedAt": iso(approved.approved_at) if approved else None,
        "approvedVersion": approved.version if approved else None,
        "updatedAt": iso(current.created_at) if current else iso(p.created_at),
        "versions": [{"id": str(v.id), "version": v.version, "status": v.status, "author": v.author,
                      "createdAt": iso(v.created_at), "approver": v.approver, "aiGenerated": v.ai_generated}
                     for v in p.versions],
    }


def ser_questionnaire(q: Questionnaire) -> dict[str, Any]:
    return {"id": str(q.id), "title": q.title, "customerName": q.customer_name, "sourceFilename": q.source_filename,
            "uploadedAt": iso(q.uploaded_at), "completedAt": iso(q.completed_at),
            "items": [{"id": str(a.id), "questionNumber": a.question_number, "category": a.category, "question": a.question,
                       "suggestedAnswer": a.answer, "confidenceScore": a.confidence, "needsReview": a.needs_review,
                       "citedSources": a.cited_sources, "humanApproved": a.human_approved,
                       "humanReviewNotes": a.review_notes, "approvedBy": a.approved_by} for a in q.answers]}


def ser_risk(r: Risk) -> dict[str, Any]:
    return {"id": str(r.id), "title": r.title, "category": r.category, "description": r.description,
            "likelihood": r.likelihood, "impact": r.impact, "riskScore": r.score, "owner": r.owner,
            "treatment": r.treatment, "treatmentPlan": r.treatment_plan, "status": r.status,
            "linkedControlCodes": r.linked_control_codes, "linkedCheckCodes": r.linked_check_codes,
            "updatedAt": iso(r.updated_at)}


def ser_task(t: Task) -> dict[str, Any]:
    return {"id": str(t.id), "title": t.title, "description": t.description, "phase": t.phase, "priority": t.priority,
            "owner": t.owner, "dueDate": t.due_date.isoformat(), "status": t.status, "source": t.source,
            "linkedCheckCode": t.linked_check_code, "linkedRiskId": str(t.linked_risk_id) if t.linked_risk_id else None,
            "overdue": t.status != "completed" and t.due_date < date.today()}


def ser_report(r: Report | None) -> dict[str, Any] | None:
    if not r:
        return None
    c = r.content or {}
    return {"id": str(r.id), "quarter": r.quarter, "generatedAt": iso(r.generated_at), "vCISOAuthor": r.author,
            "status": r.status, "aiGenerated": r.ai_generated, "executiveSummary": c.get("executiveSummary", ""),
            "compliancePosture": c.get("compliancePosture", {}), "topRisksSummary": c.get("topRisksSummary", []),
            "quarterlyMilestones": c.get("quarterlyMilestones", []), "next90DaysPlan": c.get("next90DaysPlan", []),
            "citations": r.citations, "vCISONotes": r.vciso_notes, "approvedBy": r.approved_by,
            "approvedAt": iso(r.approved_at)}


def ser_milestone(m: Milestone) -> dict[str, Any]:
    return {"id": str(m.id), "title": m.title, "category": m.category, "targetDate": m.target_date.isoformat(),
            "completedDate": m.completed_date.isoformat() if m.completed_date else None, "status": m.status,
            "description": m.description, "owner": m.owner, "frameworkRef": m.framework_ref,
            "deliverables": m.deliverables, "isAuditDeadline": m.is_audit_deadline, "auditorBody": m.auditor_body}


def ser_integration(i: Integration, posture_checks: list[dict]) -> dict[str, Any]:
    mine = [c for c in posture_checks if c["connector"] == i.type]
    return {"id": str(i.id), "type": i.type, "mode": i.mode, "status": i.status, "accountIdentifier": i.account_identifier,
            "lastSyncedAt": iso(i.last_synced_at), "lastError": i.last_error, "totalChecks": len(mine),
            "failingChecks": sum(1 for c in mine if c["status"] == "failed")}


def build_state(db: Session, org: Organization, role: str) -> dict[str, Any]:
    posture = compute_posture(db, org)
    oid = org.id
    evidence = db.scalars(select(Evidence).where(Evidence.organization_id == oid)
                          .order_by(Evidence.collected_at.desc()).limit(150)).all()
    integrations = db.scalars(select(Integration).where(Integration.organization_id == oid).order_by(Integration.type)).all()
    questionnaires = db.scalars(select(Questionnaire).where(Questionnaire.organization_id == oid)
                                .order_by(Questionnaire.uploaded_at.desc())).all()
    risks = db.scalars(select(Risk).where(Risk.organization_id == oid).order_by(Risk.likelihood * Risk.impact)).all()
    tasks = db.scalars(select(Task).where(Task.organization_id == oid).order_by(Task.due_date, Task.priority)).all()
    report = db.scalars(select(Report).where(Report.organization_id == oid).order_by(Report.generated_at.desc()).limit(1)).first()
    milestones = db.scalars(select(Milestone).where(Milestone.organization_id == oid).order_by(Milestone.target_date)).all()
    events = db.scalars(select(CalendarEvent).where(CalendarEvent.organization_id == oid).order_by(CalendarEvent.event_date)).all()
    logs = db.scalars(select(AuditLog).where(AuditLog.organization_id == oid).order_by(AuditLog.created_at.desc()).limit(100)).all()
    runs = db.scalars(select(CheckRun).where(CheckRun.organization_id == oid, CheckRun.status == "completed")
                      .order_by(CheckRun.started_at.desc()).limit(30)).all()

    return {
        "organization": ser_org(org, role),
        "scores": posture["scores"],
        "controls": posture["controls"],
        "checks": posture["checks"],
        "integrations": [ser_integration(i, posture["checks"]) for i in integrations],
        "evidenceStore": [{
            "id": str(e.id), "checkId": e.check.code, "checkCode": e.check.code, "checkName": e.check.name,
            "connector": e.check.connector, "timestamp": iso(e.collected_at), "status": e.status, "sha256Hash": e.sha256,
            "objectKey": e.object_key, "sanitizedPayload": e.observed, "durationMs": e.duration_ms} for e in evidence],
        "policies": [ser_policy(p) for p in posture["policies"]],
        "questionnaires": [ser_questionnaire(q) for q in questionnaires],
        "risks": [ser_risk(r) for r in reversed(risks)],
        "roadmap": [ser_task(t) for t in tasks],
        "leadershipReport": ser_report(report),
        "milestones": [ser_milestone(m) for m in milestones],
        "calendarEvents": [{**e.data, "id": str(e.id), "date": e.event_date.isoformat()} for e in events],
        "auditLogs": [{"id": str(a.id), "timestamp": iso(a.created_at), "actor": a.actor, "role": a.role,
                       "action": a.action, "resource": a.resource, "details": a.details} for a in logs],
        "runHistory": [{"id": str(r.id), "startedAt": iso(r.started_at), "trigger": r.trigger,
                        "counts": (r.summary or {}).get("counts", {})} for r in reversed(runs)],
    }
