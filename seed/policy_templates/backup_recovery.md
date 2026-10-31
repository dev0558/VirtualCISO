---
code: POL-04
title: Backup and Recovery Policy
description: Backup scope, frequency, protection, retention and restore testing.
controls: [A.8.13, RC.RP, PR.DS]
---
# Backup and Recovery Policy

**Organisation:** {{ company_name }}
**Owner:** {{ security_owner }}

## 1. Scope
Production databases, source code repositories, configuration and business-critical SaaS data (including {{ systems }}) are in scope.

## 2. Frequency and retention
- Production data is backed up at least {{ backup_frequency }}.
- Backups are retained for {{ backup_retention_days }} days.
- At least one copy is stored in a separate account or region from production.

## 3. Protection
Backups are encrypted, access is restricted to named administrators, and backup deletion requires elevated approval.

## 4. Recovery objectives
- Recovery point objective (RPO): {{ rpo }}
- Recovery time objective (RTO): {{ rto }}

## 5. Restore testing
Restores are tested at least quarterly and results recorded. Failed tests are tracked as remediation tasks.

## 6. Source code
Default branches are protected against force pushes and deletion so that history can be recovered.
