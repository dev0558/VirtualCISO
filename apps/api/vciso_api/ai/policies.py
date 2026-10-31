"""Policy generator: template + company questionnaire + live evidence -> draft policy version."""
from __future__ import annotations

from functools import lru_cache
from typing import Any

import yaml
from jinja2.sandbox import SandboxedEnvironment
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import Organization, Policy, PolicyVersion
from ..services.state import latest_evidence
from . import llm

TEMPLATE_KEYS = ["information_security", "access_control", "incident_response", "backup_recovery", "acceptable_use"]

PROFILE_DEFAULTS: dict[str, Any] = {
    "systems": "Microsoft 365, Google Workspace, GitHub and production cloud services",
    "data_types": "customer data and confidential business information",
    "security_owner": "the Head of Security (vCISO)",
    "executive_sponsor": "the CEO",
    "identity_provider": "the corporate identity provider",
    "offboarding_hours": 24,
    "access_review_days": 90,
    "incident_contact": "the security team",
    "backup_frequency": "daily",
    "backup_retention_days": 35,
    "rpo": "24 hours",
    "rto": "8 hours",
    "remote_work": True,
}


@lru_cache
def load_template(key: str) -> tuple[dict[str, Any], str]:
    if key not in TEMPLATE_KEYS:
        raise ValueError("unknown policy template")
    raw = (get_settings().seed_dir / "policy_templates" / f"{key}.md").read_text()
    _, front, body = raw.split("---", 2)
    return yaml.safe_load(front), body.strip()


def profile_for(org: Organization, overrides: dict[str, Any] | None = None) -> dict[str, Any]:
    p = {**PROFILE_DEFAULTS, **(org.profile or {}), **{k: v for k, v in (overrides or {}).items() if v not in (None, "")}}
    p["company_name"] = org.name
    p.setdefault("industry", org.industry)
    return p


def render_template(key: str, profile: dict[str, Any]) -> str:
    _, body = load_template(key)
    return SandboxedEnvironment(autoescape=False).from_string(body).render(**profile)  # noqa: S701 - markdown, not HTML


class Citation(BaseModel):
    type: str = Field(description="One of: template, control, check")
    reference: str = Field(description="Template code, control code or check code exactly as provided")
    name: str


class PolicyDraft(BaseModel):
    content_markdown: str
    citations: list[Citation]
    confidence: int = Field(ge=0, le=100, description="How well the inputs support this draft")
    review_notes: list[str] = Field(description="Points a human reviewer must verify before approval")


SYSTEM = """You are a senior GRC consultant drafting an information security policy for a small company
preparing for ISO/IEC 27001:2022 and NIST CSF 2.0. Rules:
- Start from the provided template structure and tailor it to the company profile. Keep it concise and practical.
- Use only facts given in the input. Do not invent tools, certifications, headcounts or dates.
- Where an automated check is failing, state the requirement as policy (what must be true) and add a review
  note; never claim the company is currently compliant or certified.
- Cite the template and the specific control and check codes you relied on, using only references provided.
- Output GitHub-flavoured Markdown starting with a level-1 heading."""


def next_version(policy: Policy) -> str:
    if not policy.versions:
        return "0.1"
    major, minor = (policy.versions[0].version.split(".") + ["0"])[:2]
    return f"{major}.{int(minor) + 1}"


def generate(db: Session, org: Organization, policy: Policy, profile_overrides: dict[str, Any], author: str) -> PolicyVersion:
    meta, _ = load_template(policy.template_key)
    profile = profile_for(org, profile_overrides)
    baseline = render_template(policy.template_key, profile)
    from ..services.state import control_library

    _, by_check = control_library(db)
    related = [(c, e) for c, e in sorted(latest_evidence(db, org.id).items())
               if e.status != "skipped" and set(by_check.get(c, [])) & set(meta["controls"])]

    allowed = {meta["code"], *meta["controls"], *[c for c, _ in related]}
    ai_used, confidence, notes = False, 65, ["Generated from the standard template (AI not configured). Tailor before approval."]
    citations = [{"type": "template", "reference": meta["code"], "name": f"{meta['title']} template"}] + [
        {"type": "control", "reference": c, "name": f"Control {c}"} for c in meta["controls"]] + [
        {"type": "check", "reference": c, "name": f"{e.check.name} ({e.status})"} for c, e in related]
    content = baseline

    if llm.enabled():
        evidence_lines = "\n".join(f"- {c} [{e.status}]: {e.check.name}. Observed: "
                                   f"{ {k.split('.',1)[-1]: v for k, v in (e.observed or {}).get('facts', {}).items() if not isinstance(v, list)} }"
                                   for c, e in related) or "- No automated evidence available yet."
        user = (f"<company_profile>\n{yaml.safe_dump(profile, sort_keys=True)}</company_profile>\n"
                f"<template code=\"{meta['code']}\" controls=\"{', '.join(meta['controls'])}\">\n{baseline}\n</template>\n"
                f"<automated_evidence>\n{evidence_lines}\n</automated_evidence>\n"
                f"Allowed citation references: {', '.join(sorted(allowed))}")
        try:
            draft = llm.structured(SYSTEM, user, PolicyDraft, effort="medium")
            content = draft.content_markdown.strip()
            citations = [c.model_dump() for c in draft.citations if c.reference in allowed] or citations
            confidence, notes, ai_used = draft.confidence, draft.review_notes, True
        except llm.AIUnavailable as e:
            notes = [f"AI drafting unavailable ({e}); template baseline used."]

    footer = "\n\n---\n*Draft for human review. Readiness guidance only; not a certification or legal advice.*"
    if "Readiness guidance only" not in content:
        content += footer
    if notes:
        content += "\n\n<!-- review-notes: " + " | ".join(n.replace("--", "-") for n in notes)[:1500] + " -->"
    v = PolicyVersion(organization_id=org.id, policy_id=policy.id, version=next_version(policy), status="draft",
                      content=content, author=author, ai_generated=ai_used, confidence=confidence, citations=citations)
    db.add(v)
    org.profile = {**(org.profile or {}), **{k: profile[k] for k in PROFILE_DEFAULTS if k in profile}}
    return v
