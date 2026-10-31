# How checks map to controls

Generated from `seed/checks.yaml` and `seed/frameworks.yaml` (the data is the source of truth).

| Check | Name | Source | Severity | Controls |
|---|---|---|---|---|
| `M365-MFA-01` | MFA registered for all active users | m365 | critical | A.8.5, A.5.17, PR.AA |
| `M365-ADM-02` | Global Administrator count restricted (2–4) | m365 | high | A.8.2, A.5.18, PR.AA |
| `M365-CA-03` | Conditional Access policies enabled | m365 | high | A.5.15, A.8.5, PR.AA |
| `M365-LEG-04` | Legacy authentication blocked | m365 | critical | A.5.15, A.8.5, PR.AA |
| `M365-GST-05` | No stale guest accounts (90+ days inactive) | m365 | medium | A.5.16, A.5.18, ID.AM |
| `M365-LOG-06` | Directory audit logging available | m365 | high | A.8.15, A.8.16, DE.CM |
| `M365-PWD-07` | Passwords do not expire arbitrarily (modern policy) | m365 | low | A.5.17, PR.AA |
| `M365-RLS-08` | Privileged role segregation (no user with 3+ admin roles) | m365 | medium | A.5.18, A.8.2, PR.AA |
| `M365-AUT-09` | Phishing-resistant / app-based MFA methods enabled | m365 | medium | A.5.17, A.8.5, PR.AA |
| `M365-DEV-10` | Managed devices compliant (≥95%) | m365 | medium | A.8.9, PR.PS |
| `GWS-MFA-01` | 2-Step Verification enforced for all active users | google_workspace | critical | A.8.5, A.5.17, PR.AA |
| `GWS-SUP-02` | Super Admin accounts limited (≤3) | google_workspace | high | A.8.2, PR.AA |
| `GWS-INA-03` | Suspended and inactive (60+ days) accounts deprovisioned | google_workspace | medium | A.5.16, A.5.18, ID.AM |
| `GWS-ADM-04` | All administrators have 2SV enrolled | google_workspace | critical | A.8.2, A.8.5, PR.AA |
| `GWS-ROL-05` | Delegated admin role assignments limited (≤5) | google_workspace | medium | A.5.18, A.8.2, PR.AA |
| `GWS-APP-06` | No unreviewed high-risk OAuth app grants (30 days) | google_workspace | high | A.5.15, A.5.19, GV.SC, PR.AA |
| `GWS-LGN-07` | No suspicious login events (30 days) | google_workspace | high | A.8.16, DE.CM, DE.AE |
| `GWS-AUD-08` | Workspace audit logs accessible | google_workspace | medium | A.8.15, DE.CM |
| `GWS-NLI-09` | No never-used accounts older than 30 days | google_workspace | low | A.5.16, ID.AM |
| `GH-2FA-01` | Organisation requires two-factor authentication | github | critical | A.8.5, A.5.17, PR.AA |
| `GH-BRN-02` | Branch protection on default branches | github | high | A.8.9, PR.PS, RC.RP |
| `GH-SEC-03` | Secret scanning enabled on all repositories | github | high | A.8.24, A.8.16, PR.DS |
| `GH-CSN-04` | No open critical code scanning alerts | github | high | A.8.8, DE.CM |
| `GH-PUB-05` | No public repositories with sensitive names | github | critical | A.8.24, ID.AM, PR.DS |
| `GH-DEP-06` | Dependabot security updates enabled | github | medium | A.8.8, DE.CM, GV.SC |
| `GH-ADM-07` | Organisation owners limited (≤3) and base permission read | github | medium | A.8.2, A.5.1, GV.PO, PR.AA |
| `GH-REV-08` | Pull request review required on default branches | github | medium | A.5.18, A.8.9, PR.PS |
| `GH-COL-09` | Outside collaborators limited (≤5) | github | low | A.5.19, A.5.18, GV.SC |

## ISO 27001:2022

| Control | Title | Checks |
|---|---|---|
| A.5.1 | Policies for information security | GH-ADM-07 |
| A.5.2 | Information security roles and responsibilities | — (policy or manual evidence) |
| A.5.15 | Access control | M365-CA-03, M365-LEG-04, GWS-APP-06 |
| A.5.16 | Identity management | M365-GST-05, GWS-INA-03, GWS-NLI-09 |
| A.5.17 | Authentication information | M365-MFA-01, M365-PWD-07, M365-AUT-09, GWS-MFA-01, GH-2FA-01 |
| A.5.18 | Access rights | M365-ADM-02, M365-GST-05, M365-RLS-08, GWS-INA-03, GWS-ROL-05, GH-REV-08, GH-COL-09 |
| A.5.19 | Information security in supplier relationships | GWS-APP-06, GH-COL-09 |
| A.5.20 | Security within supplier agreements | — (policy or manual evidence) |
| A.5.21 | ICT supply chain security | — (policy or manual evidence) |
| A.5.22 | Monitoring and review of supplier services | — (policy or manual evidence) |
| A.5.37 | Documented operating procedures | — (policy or manual evidence) |
| A.8.2 | Privileged access rights | M365-ADM-02, M365-RLS-08, GWS-SUP-02, GWS-ADM-04, GWS-ROL-05, GH-ADM-07 |
| A.8.5 | Secure authentication | M365-MFA-01, M365-CA-03, M365-LEG-04, M365-AUT-09, GWS-MFA-01, GWS-ADM-04, GH-2FA-01 |
| A.8.8 | Management of technical vulnerabilities | GH-CSN-04, GH-DEP-06 |
| A.8.9 | Configuration management | M365-DEV-10, GH-BRN-02, GH-REV-08 |
| A.8.13 | Information backup | — (policy or manual evidence) |
| A.8.15 | Logging | M365-LOG-06, GWS-AUD-08 |
| A.8.16 | Monitoring activities | M365-LOG-06, GWS-LGN-07, GH-SEC-03 |
| A.8.24 | Use of cryptography | GH-SEC-03, GH-PUB-05 |

## NIST CSF 2.0

| Control | Title | Checks |
|---|---|---|
| GV.PO | Policy | GH-ADM-07 |
| GV.RR | Roles | — (policy or manual evidence) |
| GV.RM | Risk Management Strategy | — (policy or manual evidence) |
| GV.SC | Cybersecurity Supply Chain Risk Management | GWS-APP-06, GH-DEP-06, GH-COL-09 |
| ID.AM | Asset Management | M365-GST-05, GWS-INA-03, GWS-NLI-09, GH-PUB-05 |
| ID.RA | Risk Assessment | — (policy or manual evidence) |
| PR.AA | Identity Management | M365-MFA-01, M365-ADM-02, M365-CA-03, M365-LEG-04, M365-PWD-07, M365-RLS-08, M365-AUT-09, GWS-MFA-01, GWS-SUP-02, GWS-ADM-04, GWS-ROL-05, GWS-APP-06, GH-2FA-01, GH-ADM-07 |
| PR.DS | Data Security | GH-SEC-03, GH-PUB-05 |
| PR.PS | Platform Security | M365-DEV-10, GH-BRN-02, GH-REV-08 |
| DE.CM | Continuous Monitoring | M365-LOG-06, GWS-LGN-07, GWS-AUD-08, GH-CSN-04, GH-DEP-06 |
| DE.AE | Adverse Event Analysis | GWS-LGN-07 |
| RS.MA | Incident Management | — (policy or manual evidence) |
| RC.RP | Incident Recovery Plan Execution | GH-BRN-02 |
