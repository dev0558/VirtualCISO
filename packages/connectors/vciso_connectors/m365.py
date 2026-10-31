"""Microsoft 365 / Entra ID via Microsoft Graph (application permissions, read-only).

Required application permissions (admin consent):
  User.Read.All, Directory.Read.All, Policy.Read.All, AuditLog.Read.All,
  UserAuthenticationMethod.Read.All (registration details), Domain.Read.All,
  DeviceManagementManagedDevices.Read.All (optional, Intune)
FACTS: m365.users_enabled, m365.mfa_registered_pct, m365.users_without_mfa, m365.global_admin_count,
  m365.global_admins, m365.ca_total_count, m365.ca_enabled_count, m365.ca_report_only_count,
  m365.legacy_auth_blocked, m365.security_defaults_enabled, m365.guest_count, m365.stale_guest_count,
  m365.stale_guests, m365.audit_log_available, m365.latest_audit_event_at, m365.password_expiry_disabled,
  m365.domains_checked, m365.privileged_roles_evaluated, m365.role_concentration_violations,
  m365.strong_auth_methods_enabled, m365.auth_methods_enabled, m365.managed_device_count,
  m365.device_compliance_pct
"""
from __future__ import annotations

from collections import Counter
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx

from .base import TIMEOUT, Connector, ConnectorError, FactResult, mask_email, pct

GRAPH = "https://graph.microsoft.com/v1.0"
GLOBAL_ADMIN_TEMPLATE = "62e90394-69f5-4237-9190-012177145e10"
PRIVILEGED_ROLE_TEMPLATES = {
    GLOBAL_ADMIN_TEMPLATE, "e8611ab8-c189-46e8-94e1-60213ab1f814",  # Privileged Role Admin
    "194ae4cb-b126-40b2-bd5b-6091b380977d", "29232cdf-9323-42fd-ade2-1d097af3e4de",  # Security Admin, Exchange Admin
    "f28a1f50-f6e7-4571-818b-6a12f2af6b6c", "fe930be7-5e62-47db-91af-98c3a49a38b1",  # SharePoint Admin, User Admin
    "9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3", "b0f54661-2d74-4c50-afa3-1ec803f12efe",  # Application Admin, Billing Admin
    "158c047a-c907-4556-b7ef-446551a6b5f7", "7be44c8a-adaf-4e2a-84d6-ab2649e08a13",  # Cloud App Admin, Privileged Auth Admin
}
NEVER_EXPIRES = 2147483647


class M365Connector(Connector):
    type = "m365"
    name = "Microsoft 365 / Entra ID"
    read_only_scopes = [
        "User.Read.All", "Directory.Read.All", "Policy.Read.All", "AuditLog.Read.All",
        "UserAuthenticationMethod.Read.All", "Domain.Read.All", "DeviceManagementManagedDevices.Read.All",
    ]

    def __init__(self, credentials: dict[str, str], client: httpx.Client | None = None):
        try:
            self.tenant_id = credentials["tenant_id"].strip()
            self.client_id = credentials["client_id"].strip()
            self.client_secret = credentials["client_secret"]
        except KeyError as e:
            raise ConnectorError(f"Missing credential field: {e.args[0]}") from None
        self.http = client or httpx.Client(timeout=TIMEOUT)
        self._token: str | None = None

    # ------------------------------------------------------------ http helpers
    def _auth(self) -> str:
        if self._token:
            return self._token
        r = self.http.post(
            f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token",
            data={"grant_type": "client_credentials", "client_id": self.client_id,
                  "client_secret": self.client_secret, "scope": "https://graph.microsoft.com/.default"},
        )
        if r.status_code != 200:
            raise ConnectorError("Microsoft identity platform rejected the app credentials "
                                 f"(HTTP {r.status_code}). Check tenant ID, client ID, secret and admin consent.")
        self._token = r.json()["access_token"]
        return self._token

    def _get(self, path: str, params: dict[str, str] | None = None, headers: dict[str, str] | None = None) -> dict:
        url = path if path.startswith("http") else f"{GRAPH}{path}"
        r = self.http.get(url, params=params, headers={"Authorization": f"Bearer {self._auth()}", **(headers or {})})
        if r.status_code in (401, 403):
            raise PermissionError(path)
        r.raise_for_status()
        return r.json()

    def _all(self, path: str, params: dict[str, str] | None = None, headers: dict[str, str] | None = None,
             limit: int = 20000) -> list[dict]:
        out: list[dict] = []
        data = self._get(path, params, headers)
        while True:
            out.extend(data.get("value", []))
            nxt = data.get("@odata.nextLink")
            if not nxt or len(out) >= limit:
                return out
            data = self._get(nxt, headers=headers)

    # ------------------------------------------------------------ public
    def test(self) -> str:
        self._auth()
        try:
            org = self._get("/organization", {"$select": "displayName,verifiedDomains"})["value"][0]
        except PermissionError:
            raise ConnectorError("Authenticated, but Directory.Read.All has not been granted admin consent.") from None
        default = next((d["name"] for d in org.get("verifiedDomains", []) if d.get("isDefault")), "")
        return default or org.get("displayName", self.tenant_id)

    def collect(self) -> FactResult:
        res = FactResult()
        f = res.facts
        now = datetime.now(UTC)

        def attempt(label: str, fn) -> None:
            try:
                fn()
            except PermissionError:
                res.warnings.append(f"{label}: permission not granted, related checks skipped")
            except httpx.HTTPError as e:
                res.warnings.append(f"{label}: Graph request failed ({type(e).__name__})")

        users: list[dict] = []

        def _users() -> None:
            nonlocal users
            try:
                users = self._all("/users", {"$select": "id,userPrincipalName,accountEnabled,userType,createdDateTime,signInActivity", "$top": "999"})
            except PermissionError:  # signInActivity needs AuditLog.Read.All + Entra P1
                users = self._all("/users", {"$select": "id,userPrincipalName,accountEnabled,userType,createdDateTime", "$top": "999"})
            members = [u for u in users if u.get("accountEnabled") and u.get("userType") != "Guest"]
            f["m365.users_enabled"] = len(members)
            guests = [u for u in users if u.get("userType") == "Guest"]
            f["m365.guest_count"] = len(guests)
            if any("signInActivity" in u for u in users):
                cutoff = now - timedelta(days=90)
                stale = []
                for g in guests:
                    last = (g.get("signInActivity") or {}).get("lastSignInDateTime")
                    created = g.get("createdDateTime")
                    ref = last or created
                    if ref and datetime.fromisoformat(ref.replace("Z", "+00:00")) < cutoff:
                        stale.append(mask_email(g.get("userPrincipalName", "")))
                f["m365.stale_guest_count"] = len(stale)
                f["m365.stale_guests"] = stale[:25]
            else:
                res.warnings.append("Sign-in activity unavailable (needs AuditLog.Read.All and Entra ID P1): guest staleness skipped")

        def _mfa() -> None:
            details = self._all("/reports/authenticationMethods/userRegistrationDetails",
                                {"$select": "userPrincipalName,isMfaRegistered,userType"})
            members = [d for d in details if d.get("userType", "member") == "member"]
            enabled_upns = {u["userPrincipalName"].lower() for u in users if u.get("accountEnabled") and u.get("userType") != "Guest"}
            if enabled_upns:
                members = [d for d in members if d.get("userPrincipalName", "").lower() in enabled_upns]
            without = [d["userPrincipalName"] for d in members if not d.get("isMfaRegistered")]
            f["m365.mfa_registered_pct"] = pct(len(members) - len(without), len(members))
            f["m365.users_without_mfa"] = [mask_email(u) for u in without[:25]]

        def _roles() -> None:
            roles = self._all("/directoryRoles", {"$expand": "members($select=id,userPrincipalName)"})
            holder_roles: Counter[str] = Counter()
            evaluated = 0
            for role in roles:
                tmpl = role.get("roleTemplateId")
                if tmpl == GLOBAL_ADMIN_TEMPLATE:
                    admins = [m.get("userPrincipalName", m.get("id", "")) for m in role.get("members", [])]
                    f["m365.global_admin_count"] = len(admins)
                    f["m365.global_admins"] = [mask_email(a) for a in admins]
                if tmpl in PRIVILEGED_ROLE_TEMPLATES:
                    evaluated += 1
                    for m in role.get("members", []):
                        holder_roles[m.get("id", "")] += 1
            f.setdefault("m365.global_admin_count", 0)
            f["m365.privileged_roles_evaluated"] = evaluated
            f["m365.role_concentration_violations"] = sum(1 for c in holder_roles.values() if c >= 3)

        def _ca() -> None:
            sd = self._get("/policies/identitySecurityDefaultsEnforcementPolicy")
            f["m365.security_defaults_enabled"] = bool(sd.get("isEnabled"))
            policies = self._all("/identity/conditionalAccess/policies")
            f["m365.ca_total_count"] = len(policies)
            f["m365.ca_enabled_count"] = sum(1 for p in policies if p.get("state") == "enabled")
            f["m365.ca_report_only_count"] = sum(1 for p in policies if p.get("state") == "enabledForReportingButNotEnforced")
            legacy = False
            for p in policies:
                if p.get("state") != "enabled":
                    continue
                apps = set((p.get("conditions") or {}).get("clientAppTypes") or [])
                grant = set(((p.get("grantControls") or {}).get("builtInControls")) or [])
                users_incl = set((((p.get("conditions") or {}).get("users")) or {}).get("includeUsers") or [])
                if {"exchangeActiveSync", "other"} & apps and "block" in grant and "All" in users_incl:
                    legacy = True
            f["m365.legacy_auth_blocked"] = legacy or f["m365.security_defaults_enabled"]

        def _audit() -> None:
            data = self._get("/auditLogs/directoryAudits", {"$top": "1"})
            items = data.get("value", [])
            f["m365.audit_log_available"] = True
            f["m365.latest_audit_event_at"] = items[0].get("activityDateTime") if items else None

        def _domains() -> None:
            domains = [d for d in self._all("/domains") if d.get("isVerified")]
            f["m365.domains_checked"] = len(domains)
            f["m365.password_expiry_disabled"] = all(
                (d.get("passwordValidityPeriodInDays") or NEVER_EXPIRES) >= NEVER_EXPIRES for d in domains
            )

        def _auth_methods() -> None:
            pol = self._get("/policies/authenticationMethodsPolicy")
            enabled = [c.get("id") for c in pol.get("authenticationMethodConfigurations", []) if c.get("state") == "enabled"]
            f["m365.auth_methods_enabled"] = enabled
            f["m365.strong_auth_methods_enabled"] = bool({"MicrosoftAuthenticator", "Fido2"} & {e for e in enabled})

        def _devices() -> None:
            try:
                devices = self._all("/deviceManagement/managedDevices", {"$select": "id,complianceState"})
            except httpx.HTTPStatusError:
                res.warnings.append("Intune not available: device compliance skipped")
                return
            if devices:
                f["m365.managed_device_count"] = len(devices)
                f["m365.device_compliance_pct"] = pct(sum(1 for d in devices if d.get("complianceState") == "compliant"), len(devices))
            else:
                res.warnings.append("No Intune-managed devices: device compliance skipped")

        self._auth()
        for label, fn in [("Users", _users), ("MFA registration", _mfa), ("Directory roles", _roles),
                          ("Conditional Access", _ca), ("Audit logs", _audit), ("Domains", _domains),
                          ("Authentication methods", _auth_methods), ("Intune devices", _devices)]:
            attempt(label, fn)
        return res

    @staticmethod
    def credential_fields() -> list[dict[str, Any]]:
        return [
            {"name": "tenant_id", "label": "Directory (tenant) ID", "secret": False},
            {"name": "client_id", "label": "Application (client) ID", "secret": False},
            {"name": "client_secret", "label": "Client secret", "secret": True},
        ]
