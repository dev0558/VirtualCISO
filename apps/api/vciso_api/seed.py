"""Seed loader.

  python -m vciso_api.seed            # control library only (frameworks, controls, checks, mappings)
  python -m vciso_api.seed --demo     # + three fictional demo tenants (requires DEMO_PASSWORD)

Runs with the migration (owner) connection because the library tables are read-only for the app role.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import UTC, date, datetime, timedelta

import yaml
from sqlalchemy import create_engine, delete, select
from sqlalchemy.orm import Session, sessionmaker

from .ai import policies as policy_gen
from .ai import questionnaire as qa
from .ai import rag
from .ai import reports as report_gen
from .config import get_settings
from .db import set_context
from .models import (
    Answer,
    CalendarEvent,
    Check,
    CheckControlMap,
    Control,
    Framework,
    Integration,
    Membership,
    Milestone,
    Organization,
    Policy,
    PolicyVersion,
    Questionnaire,
    Risk,
    Task,
    User,
)
from .security import hash_password
from .services import engine as check_engine
from .services.orgs import create_org


def owner_session() -> Session:
    eng = create_engine(get_settings().migration_database_url)
    return sessionmaker(bind=eng, expire_on_commit=False)()


def seed_library(db: Session) -> None:
    seed = get_settings().seed_dir
    fw_doc = yaml.safe_load((seed / "frameworks.yaml").read_text())
    controls: dict[str, Control] = {}
    for fw in fw_doc["frameworks"]:
        f = db.scalars(select(Framework).where(Framework.code == fw["code"])).first() or Framework(code=fw["code"])
        f.name, f.version = fw["name"], fw["version"]
        db.add(f)
        db.flush()
        for c in fw["controls"]:
            ctl = db.scalars(select(Control).where(Control.framework_id == f.id, Control.code == c["code"])).first() \
                or Control(framework_id=f.id, code=c["code"])
            ctl.category, ctl.title, ctl.description = c["category"], c["title"], c["description"]
            db.add(ctl)
            controls[c["code"]] = ctl
    db.flush()
    checks_doc = yaml.safe_load((seed / "checks.yaml").read_text())
    for c in checks_doc["checks"]:
        missing = [code for code in c["controls"] if code not in controls]
        if missing:
            raise SystemExit(f"Check {c['code']} maps to unknown controls {missing}")
        chk = db.scalars(select(Check).where(Check.code == c["code"])).first() or Check(code=c["code"])
        chk.name, chk.connector, chk.category, chk.severity = c["name"], c["connector"], c["category"], c["severity"]
        chk.description, chk.remediation, chk.rule = c["description"], c["remediation"], c["rule"]
        chk.warn_rule, chk.evidence_facts, chk.enabled = c.get("warn"), c.get("evidence_facts", []), c.get("enabled", True)
        db.add(chk)
        db.flush()
        db.execute(delete(CheckControlMap).where(CheckControlMap.check_id == chk.id))
        for code in c["controls"]:
            db.add(CheckControlMap(check_id=chk.id, control_id=controls[code].id))
    db.commit()
    print(f"library: {len(controls)} controls, {len(checks_doc['checks'])} checks")


def _user(db: Session, email: str, name: str, password: str) -> User:
    u = db.scalars(select(User).where(User.email == email)).first()
    if not u:
        u = User(email=email, full_name=name, password_hash=hash_password(password))
        db.add(u)
        db.flush()
    return u


def _d(s: str | None) -> date | None:
    return date.fromisoformat(s[:10]) if s else None


def _apply_saved_answers(slug: str, answers: list[Answer]) -> None:
    """Pre-generated draft answers (seed/demo/answers.json), so a demo needs no AI key. Still unapproved."""
    path = get_settings().seed_dir / "demo" / "answers.json"
    saved = json.loads(path.read_text()).get(slug, {}) if path.exists() else {}
    for a in answers:
        if s := saved.get(str(a.question_number)):
            a.answer, a.confidence, a.cited_sources = s["answer"], s["confidence"], s["citedSources"]
            a.needs_review = a.confidence < qa.REVIEW_THRESHOLD or not a.cited_sources


def seed_demo(db: Session, password: str) -> None:
    data = json.loads((get_settings().seed_dir / "demo" / "tenants.json").read_text())
    vciso = _user(db, "vciso@securavantage.example", "Marcus Vance", password)
    for t in data["tenants"]:
        slug = f"{t['slug']}-demo"
        if existing := db.scalars(select(Organization).where(Organization.slug == slug)).first():
            _apply_saved_answers(slug, list(db.scalars(select(Answer).where(Answer.organization_id == existing.id,
                                                                            Answer.human_approved.is_(False)))))
            db.commit()
            print(f"skip {slug} (exists; saved answers refreshed)")
            continue
        o = t["org"]
        domain = o["primaryContact"].split("@")[-1]
        first = o["primaryContact"].split("@")[0].split(".")[0].title()
        org = create_org(db, user=vciso, name=o["name"], industry=o["industry"], employee_count=o["employeeCount"],
                         role="vciso", is_demo=True, slug=slug, vciso_lead="Marcus Vance, CISSP, CISA")
        org.primary_contact = o["primaryContact"]
        admin = _user(db, f"admin@{domain}", f"{first} (Client Admin)", password)
        auditor = _user(db, f"auditor@{domain}", "Priya Raman (Auditor)", password)
        db.add(Membership(organization_id=org.id, user_id=admin.id, role="client_admin", title="CTO"))
        db.add(Membership(organization_id=org.id, user_id=auditor.id, role="auditor", title="External auditor"))
        set_context(db, user_id=vciso.id, org_id=org.id)

        for integ in t["integrations"]:
            db.add(Integration(organization_id=org.id, type=integ["type"], mode="demo", status="connected",
                               account_identifier=integ["account"], config={"account": integ["account"], "facts": integ["facts"]}))
        db.flush()

        policies = {p.code: p for p in db.scalars(select(Policy).where(Policy.organization_id == org.id)).all()}
        for p in t["policies"]:
            pol = policies[p["code"]]
            status = p["status"]
            v = PolicyVersion(organization_id=org.id, policy_id=pol.id, version=p["version"], status=status,
                              content=p["content"] + "\n\n---\n*Readiness guidance only; not a certification.*",
                              author="Marcus Vance (vCISO)", ai_generated=False, confidence=None,
                              citations=[{"type": "template", "reference": pol.code, "name": f"{pol.title} template"}]
                              + [{"type": "control", "reference": c, "name": f"Control {c}"} for c in pol.mapped_controls],
                              approver=p.get("approver") if status == "approved" else None,
                              approved_at=datetime(2026, 10, 15, tzinfo=UTC) if status == "approved" else None)
            db.add(v)
            db.flush()
            db.refresh(pol)
            if status == "approved":
                rag.index_policy(db, org, pol, v)

        # Historical runs give the trend chart something to show; then the current run.
        check_engine.run_checks(db, org, trigger="scheduled", actor="Scheduler", role="vciso")

        for r in t["risks"]:
            db.add(Risk(organization_id=org.id, title=r["title"], category=r["category"], description=r["description"],
                        likelihood=r["likelihood"], impact=r["impact"], owner=r["owner"], treatment=r["treatment"],
                        treatment_plan=r["treatmentPlan"], status=r["status"], linked_control_codes=r["linkedControlCodes"],
                        linked_check_codes=r["linkedCheckCodes"]))
        for tk in t["tasks"]:
            db.add(Task(organization_id=org.id, title=tk["title"], description=tk["description"], phase=tk["phase"],
                        priority=tk["priority"], owner=tk["owner"], due_date=_d(tk["dueDate"]), status=tk["status"],
                        source="roadmap", linked_check_code=tk.get("linkedCheckCode")))
        for m in t["milestones"]:
            db.add(Milestone(organization_id=org.id, title=m["title"], category=m["category"], target_date=_d(m["targetDate"]),
                             completed_date=_d(m.get("completedDate")), status=m["status"], description=m["description"],
                             owner=m["owner"], framework_ref=m.get("frameworkRef"), deliverables=m.get("deliverables", []),
                             is_audit_deadline=m.get("isAuditDeadline", False), auditor_body=m.get("auditorBody")))
        for ev in t["calendar"]:
            db.add(CalendarEvent(organization_id=org.id, data=ev, event_date=_d(ev["date"])))
        db.flush()
        if not t["risks"]:
            tmpl = yaml.safe_load((get_settings().seed_dir / "risk_templates.yaml").read_text())["templates"]
            for r in tmpl[:4]:
                db.add(Risk(organization_id=org.id, title=r["title"], category=r["category"], likelihood=r["likelihood"],
                            impact=r["impact"], owner="Marcus Vance (vCISO)", treatment=r["treatment"],
                            treatment_plan=r["treatment_plan"], status="Open", linked_control_codes=r["controls"]))
            db.flush()
            from .services import roadmap

            roadmap.generate(db, org, default_owner="Marcus Vance (vCISO)")

        q = Questionnaire(organization_id=org.id, title=t["questionnaire"]["title"], customer_name=t["questionnaire"]["customer"],
                          source_filename="vendor-security-questionnaire.xlsx",
                          uploaded_at=datetime.now(UTC) - timedelta(days=1))
        db.add(q)
        db.flush()
        for i, item in enumerate(t["questionnaire"]["items"], start=1):
            db.add(Answer(organization_id=org.id, questionnaire_id=q.id, question_number=i, category=item["category"],
                          question=item["question"]))
        db.flush()
        db.refresh(q)
        qa.autofill(db, org.id, list(q.answers))
        _apply_saved_answers(slug, list(q.answers))
        report_gen.generate(db, org, report_gen.current_quarter(), author="Marcus Vance, CISSP, CISA (vCISO)")
        org.profile = {**policy_gen.PROFILE_DEFAULTS, "security_owner": "Marcus Vance (vCISO)",
                       "incident_contact": f"security@{domain}"}
        db.commit()
        print(f"demo tenant: {o['name']}  admin@{domain} / auditor@{domain}")
    print("vCISO login: vciso@securavantage.example (member of all demo tenants)")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--demo", action="store_true")
    args = ap.parse_args()
    db = owner_session()
    seed_library(db)
    if args.demo:
        pw = os.environ.get("DEMO_PASSWORD", "")
        if len(pw) < 12:
            sys.exit("Set DEMO_PASSWORD (12+ characters) to create demo users.")
        seed_demo(db, pw)


if __name__ == "__main__":
    main()
