---
code: POL-05
title: Acceptable Use Policy
description: Acceptable use of company devices, accounts, data and AI tools by personnel.
controls: [A.5.1, A.5.15, PR.AA, GV.PO]
---
# Acceptable Use Policy

**Organisation:** {{ company_name }}
**Applies to:** all employees and contractors

## 1. Accounts and credentials
Use only your own accounts. Never share passwords or MFA codes. Report lost devices or suspected compromise to {{ incident_contact }} immediately.

## 2. Devices
{% if remote_work %}Remote work is permitted from company-managed or approved devices that have disk encryption, screen lock and current updates.{% else %}Company data is accessed only from company-managed devices.{% endif %}

## 3. Data handling
- Handle {{ data_types }} only for legitimate business purposes.
- Do not store company data in personal cloud storage or personal email.
- Share files externally only through approved tools and with the minimum access needed.

## 4. AI and third-party tools
Do not paste confidential or customer data into AI tools or browser extensions that have not been approved by the security owner.

## 5. Software
Install software only from approved sources. Do not disable security tooling.

## 6. Monitoring
Company systems may be monitored for security purposes in line with applicable law.

## 7. Acknowledgement
All personnel acknowledge this policy at onboarding and annually.
