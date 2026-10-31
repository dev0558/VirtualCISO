"""Questionnaire autofill evaluation (PRD §9 day 10): 30 questions against the fictional
HealthBridge demo tenant. Measures:
  - source accuracy: answerable questions cite at least one expected source
  - abstention: unanswerable questions are flagged with no confident answer
  - review share: fraction of answers flagged for human review
Nothing is persisted (the transaction is rolled back). Uses Claude when ANTHROPIC_API_KEY is set,
otherwise the retrieval-only fallback.

    python evals/questionnaire_eval.py [--org-slug healthbridge-demo]
"""
import argparse
import sys
import uuid

from sqlalchemy import select

from vciso_api.ai import llm
from vciso_api.ai import questionnaire as qa
from vciso_api.config import get_settings
from vciso_api.db import session_scope
from vciso_api.models import Answer, Organization
from vciso_api.seed import owner_session

# (category, question, expected source refs (prefix match); empty = should abstain / flag)
CASES = [
    ("Access", "Do you enforce multi-factor authentication for all users?", ["M365-MFA-01", "GH-2FA-01", "POL-02"]),
    ("Access", "Is MFA required for administrators?", ["M365-MFA-01", "POL-02", "GH-2FA-01"]),
    ("Access", "Are legacy authentication protocols such as IMAP and POP blocked?", ["M365-LEG-04"]),
    ("Access", "How many global administrators do you have?", ["M365-ADM-02", "POL-02"]),
    ("Access", "Do you use Conditional Access policies?", ["M365-CA-03"]),
    ("Access", "How do you manage guest and external accounts?", ["M365-GST-05", "POL-02"]),
    ("Access", "How quickly are leavers deprovisioned?", ["POL-02"]),
    ("Access", "How often are privileged access rights reviewed?", ["POL-02", "M365-RLS-08"]),
    ("Access", "Do you prevent one person from holding many admin roles?", ["M365-RLS-08"]),
    ("Access", "Are phishing-resistant authentication methods such as FIDO2 enabled?", ["M365-AUT-09"]),
    ("Access", "What is your password policy?", ["M365-PWD-07", "POL-02"]),
    ("Logging", "Are audit logs enabled for your identity provider?", ["M365-LOG-06"]),
    ("Endpoint", "Are company devices managed and compliant?", ["M365-DEV-10"]),
    ("SDLC", "Is branch protection enabled on default branches?", ["GH-BRN-02"]),
    ("SDLC", "Do you scan repositories for leaked secrets?", ["GH-SEC-03"]),
    ("SDLC", "Is code review required before merging?", ["GH-REV-08"]),
    ("SDLC", "How do you manage vulnerable dependencies?", ["GH-DEP-06"]),
    ("SDLC", "Do you run static code analysis such as CodeQL?", ["GH-CSN-04"]),
    ("SDLC", "Are any of your code repositories public?", ["GH-PUB-05"]),
    ("SDLC", "Is two-factor authentication required on GitHub?", ["GH-2FA-01"]),
    ("Governance", "Do you have an information security policy approved by management?", ["POL-01"]),
    ("Governance", "Who is accountable for information security?", ["POL-01"]),
    ("Governance", "Do you have an acceptable use policy for employees?", ["POL-05"]),
    ("Governance", "How often are security policies reviewed?", ["POL-01"]),
    ("Third parties", "How many outside collaborators have access to your source code?", ["GH-COL-09"]),
    # Unanswerable from the demo tenant's approved evidence -> must be flagged
    ("Physical", "Do you have CCTV in your data centre?", []),
    ("HR", "Do you perform criminal background checks on contractors in Brazil?", []),
    ("Insurance", "What is the limit of your cyber insurance policy?", []),
    ("Privacy", "Who is your EU GDPR representative?", []),
    ("Finance", "What was your annual revenue last year?", []),
]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--org-slug", default="healthbridge-demo")
    args = ap.parse_args()
    owner = owner_session()
    org = owner.scalars(select(Organization).where(Organization.slug == args.org_slug)).first()
    if not org:
        print(f"Organisation {args.org_slug} not found. Run `make seed` first.")
        return 1
    with session_scope(org_id=org.id) as db:
        answers = [Answer(id=uuid.uuid4(), organization_id=org.id, questionnaire_id=uuid.uuid4(), question_number=i + 1,
                          category=c, question=q) for i, (c, q, _) in enumerate(CASES)]
        qa.autofill(db, org.id, answers)
        correct = abstain_ok = answerable = unanswerable = 0
        print(f"{'#':>2}  {'ok':3} {'conf':>4} {'flag':4}  question  ->  cited")
        for a, (_c, q, expected) in zip(answers, CASES, strict=True):
            refs = [s["reference"] for s in a.cited_sources]
            if expected:
                answerable += 1
                ok = any(r.startswith(e) for r in refs for e in expected)
                correct += ok
            else:
                unanswerable += 1
                ok = a.needs_review
                abstain_ok += ok
            print(f"{a.question_number:>2}  {'✓' if ok else '✗':3} {a.confidence:>4} {'yes' if a.needs_review else 'no':4}  {q[:60]}  ->  {', '.join(refs) or '—'}")
        flagged = sum(a.needs_review for a in answers)
        db.rollback()
    print("\nmode:", "Claude (" + get_settings().anthropic_model + ")" if llm.enabled() else "retrieval-only fallback")
    print(f"source accuracy (answerable):   {correct}/{answerable} = {100 * correct / answerable:.0f}%")
    print(f"correct abstention (unanswerable): {abstain_ok}/{unanswerable}")
    print(f"flagged for human review:       {flagged}/{len(answers)} = {100 * flagged / len(answers):.0f}%")
    return 0


if __name__ == "__main__":
    sys.exit(main())
