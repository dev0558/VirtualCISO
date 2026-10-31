"""Auditor exports: control status + evidence per framework, as CSV or PDF (WeasyPrint)."""
from __future__ import annotations

import csv
import io
from datetime import UTC, datetime

from jinja2 import Environment, FileSystemLoader, select_autoescape
from sqlalchemy.orm import Session

from ..models import Organization
from .state import FRAMEWORK_LABEL, compute_posture, latest_evidence

_env = Environment(loader=FileSystemLoader(str(__import__("pathlib").Path(__file__).parents[1] / "templates")),
                   autoescape=select_autoescape(["html"]))


def dossier(db: Session, org: Organization, framework: str) -> dict:
    posture = compute_posture(db, org)
    latest = latest_evidence(db, org.id)
    controls = [c for c in posture["controls"] if c["frameworkCode"] == framework]
    rows = []
    for c in controls:
        ev = [latest[k] for k in c["applicableChecks"] if k in latest]
        rows.append({**c, "evidence": [{"check": e.check.code, "name": e.check.name, "status": e.status,
                                        "collected_at": e.collected_at.strftime("%Y-%m-%d %H:%M UTC"), "sha256": e.sha256,
                                        "object_key": e.object_key or ""} for e in ev]})
    score_key = "isoScore" if framework == "iso27001" else "nistScore"
    return {"org": org, "framework": FRAMEWORK_LABEL[framework], "controls": rows,
            "score": posture["scores"][score_key], "generated_at": datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC"),
            "policies": [p for p in posture["policies"]]}


def to_csv(d: dict) -> bytes:
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["framework", "control_code", "control_title", "control_status", "evidence_source", "policies",
                "check_code", "check_name", "check_status", "collected_at", "sha256", "evidence_object"])
    for c in d["controls"]:
        base = [d["framework"], c["code"], c["title"], c["status"], c["evidenceSource"], ";".join(c["policies"])]
        if not c["evidence"]:
            w.writerow(base + ["", "", "", "", "", ""])
        for e in c["evidence"]:
            w.writerow(base + [e["check"], e["name"], e["status"], e["collected_at"], e["sha256"], e["object_key"]])
    return buf.getvalue().encode()


def to_pdf(d: dict) -> bytes:
    from weasyprint import HTML  # imported lazily: needs system libraries (pango)

    html = _env.get_template("dossier.html").render(**d)
    return HTML(string=html).write_pdf()


def report_pdf(org: Organization, report: dict) -> bytes:
    from weasyprint import HTML

    html = _env.get_template("report.html").render(org=org, r=report)
    return HTML(string=html).write_pdf()
