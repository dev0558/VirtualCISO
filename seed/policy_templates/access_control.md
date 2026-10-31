---
code: POL-02
title: Access Control Policy
description: Rules for provisioning, authentication, privileged access, access reviews and deprovisioning.
controls: [A.5.15, A.5.16, A.5.17, A.5.18, A.8.2, A.8.5, PR.AA]
---
# Access Control Policy

**Organisation:** {{ company_name }}
**Owner:** {{ security_owner }}

## 1. Principles
Access to {{ company_name }} systems ({{ systems }}) is granted on the basis of least privilege and business need, and is approved by the system owner before provisioning.

## 2. Identity lifecycle
- Every person has a unique, named account in the central identity provider ({{ identity_provider }}). Shared accounts are prohibited except documented break-glass accounts.
- Joiners are provisioned from an approved request; movers have access re-evaluated on role change.
- Leavers are deprovisioned within {{ offboarding_hours }} hours of their last working day.
- Accounts inactive for 60 days, and guest accounts inactive for 90 days, are disabled and reviewed.

## 3. Authentication
- Multi-factor authentication is mandatory for all users. Phishing-resistant methods (security keys or authenticator app with number matching) are required for administrators.
- Legacy authentication protocols that cannot enforce MFA are blocked.
- Passwords are at least 14 characters and screened against known-compromised lists; periodic forced rotation is not required where MFA is enforced.

## 4. Privileged access
- Highest-privilege roles (e.g. Global Administrator, Super Admin, organisation owner) are limited to the minimum number of named accounts (target 2–4).
- Administrators use separate admin accounts for privileged tasks.
- No individual accumulates privileged roles beyond what their job requires.

## 5. Access reviews
Privileged roles, guest/external accounts and third-party application grants are reviewed every {{ access_review_days }} days. Review evidence is retained.

## 6. Third-party application access
OAuth applications requesting broad data scopes require security review before approval.
