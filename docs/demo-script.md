# 10-minute demo script (PRD §15)

Log in as `vciso@securavantage.example`. Keep a second browser logged in as the HealthBridge auditor.

1. **Problem (1 min)** — Landing page hero: "a startup losing a deal because it cannot show a security report". Scroll to the vCISO section.
2. **Connect (1 min)** — Portfolio → *Onboard client* → create "Acme Demo". Integrations → *Use sample data* for Microsoft 365, Google Workspace and GitHub (point at the read-only scopes listed on each card; mention live connection takes ~10 minutes with the guided steps).
3. **Results (2 min)** — *Run checks*. Dashboard: ISO and NIST readiness, failing checks, NIST functions, ISO themes. Controls & checks → filter *Failing* → open a check: masked evidence, fix steps, SHA-256 history. Click *I've fixed this — verify now* and show the status flip and audit-log entry.
4. **Policies (2 min)** — Policies → Access Control → *Generate draft*. Show tailored content, cited controls and checks, reviewer checklist, version 0.1 → *Approve* (becomes v1.0 and is indexed for answers).
5. **Questionnaire (2 min)** — Questionnaires → upload `seed/sample_questionnaire.csv` → *Autofill answers*. Show sources and confidence on each answer, the *To review* queue, and approve two answers. Export CSV.
6. **vCISO (1 min)** — Risk register heat map → add a risk from a template. Roadmap → *Generate from gaps*. Leadership report → *New draft* → PDF. Back to *All clients* for the portfolio view.
7. **Auditor export (1 min)** — In the auditor's browser: read-only badge, Auditor export → ISO 27001 PDF dossier with hashes. Close: pilot offer and next steps.

Backup: a recorded run of this script, and the seeded HealthBridge tenant for steps 3–7 if anything external fails.
