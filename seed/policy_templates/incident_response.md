---
code: POL-03
title: Incident Response Plan
description: How security incidents are detected, triaged, contained, eradicated, recovered from and reviewed.
controls: [A.5.37, A.8.15, A.8.16, RS.MA, DE.AE, DE.CM]
---
# Incident Response Plan

**Organisation:** {{ company_name }}
**Incident lead:** {{ incident_contact }}

## 1. Purpose
Define how {{ company_name }} detects, responds to and learns from information security incidents affecting {{ data_types }} or systems such as {{ systems }}.

## 2. Reporting
Anyone who suspects an incident reports it immediately to {{ incident_contact }}. Reports are never penalised.

## 3. Severity levels
| Severity | Example | Initial response |
|---|---|---|
| SEV-1 Critical | Confirmed data breach, ransomware, admin account takeover | 1 hour |
| SEV-2 High | Compromised user account, malware on a device | 4 hours |
| SEV-3 Medium | Suspicious login, policy violation | 1 business day |
| SEV-4 Low | Phishing reported and not clicked | 3 business days |

## 4. Response phases
1. **Detect and triage:** confirm the event using audit logs and monitoring alerts; assign severity and an incident lead.
2. **Contain:** revoke sessions, reset credentials, isolate devices, block indicators.
3. **Eradicate:** remove the root cause (malicious access, vulnerable component, misconfiguration).
4. **Recover:** restore services from known-good state and verify integrity.
5. **Post-incident review:** within 10 business days for SEV-1/2, documenting timeline, root cause and actions.

## 5. Communication
The executive sponsor ({{ executive_sponsor }}) decides on customer, regulator and law-enforcement notification in line with contractual and legal obligations.

## 6. Evidence
Logs, timelines and decisions are preserved. Audit logging is kept enabled on all core systems.

## 7. Testing
This plan is exercised at least annually through a tabletop exercise.
