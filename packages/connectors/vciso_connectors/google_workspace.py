"""Google Workspace via Admin SDK Directory + Reports APIs (read-only scopes).

Setup: a Google Cloud service account with domain-wide delegation granted ONLY these scopes,
impersonating a super-admin (or delegated admin with read access):
  admin.directory.user.readonly, admin.directory.rolemanagement.readonly,
  admin.directory.customer.readonly, admin.reports.audit.readonly
FACTS: gws.active_users, gws.two_sv_enforced_pct, gws.two_sv_enrolled_pct, gws.users_without_2sv,
  gws.super_admin_count, gws.super_admins, gws.suspended_count, gws.inactive_60d_count,
  gws.inactive_or_suspended_count, gws.inactive_accounts, gws.admin_count, gws.admins_without_2sv,
  gws.delegated_admin_assignments, gws.oauth_apps_seen, gws.high_risk_oauth_apps,
  gws.high_risk_oauth_app_names, gws.suspicious_login_events_30d, gws.audit_logs_available,
  gws.latest_admin_event_at, gws.never_logged_in_count, gws.never_logged_in_accounts
"""
from __future__ import annotations

import json
import time
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
from google.auth import crypt, jwt

from .base import TIMEOUT, Connector, ConnectorError, FactResult, mask_email, pct

SCOPES = [
    "https://www.googleapis.com/auth/admin.directory.user.readonly",
    "https://www.googleapis.com/auth/admin.directory.rolemanagement.readonly",
    "https://www.googleapis.com/auth/admin.directory.customer.readonly",
    "https://www.googleapis.com/auth/admin.reports.audit.readonly",
]
DIR = "https://admin.googleapis.com/admin/directory/v1"
REP = "https://admin.googleapis.com/admin/reports/v1/activity/users/all/applications"
HIGH_RISK_SCOPES = {
    "https://mail.google.com/", "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify", "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.readonly",
}
NEVER = "1970-01-01T00:00:00.000Z"


def _ts(v: str | None) -> datetime | None:
    if not v or v == NEVER:
        return None
    return datetime.fromisoformat(v.replace("Z", "+00:00"))


class GoogleWorkspaceConnector(Connector):
    type = "google_workspace"
    name = "Google Workspace"
    read_only_scopes = [s.rsplit("/", 1)[-1] for s in SCOPES]

    def __init__(self, credentials: dict[str, str], client: httpx.Client | None = None):
        try:
            raw = credentials["service_account_json"]
            self.info = json.loads(raw) if isinstance(raw, str) else raw
            self.admin_email = credentials["admin_email"].strip()
            self.info["private_key"], self.info["client_email"]  # noqa: B018 - validate presence
        except (KeyError, json.JSONDecodeError, TypeError):
            raise ConnectorError("Provide the service account JSON key and an admin email to impersonate.") from None
        self.http = client or httpx.Client(timeout=TIMEOUT)
        self._token: str | None = None

    def _auth(self) -> str:
        if self._token:
            return self._token
        try:
            signer = crypt.RSASigner.from_service_account_info(self.info)
        except ValueError:
            raise ConnectorError("The service account private key could not be parsed.") from None
        now = int(time.time())
        assertion = jwt.encode(signer, {
            "iss": self.info["client_email"], "sub": self.admin_email, "scope": " ".join(SCOPES),
            "aud": "https://oauth2.googleapis.com/token", "iat": now, "exp": now + 3600,
        })
        r = self.http.post("https://oauth2.googleapis.com/token", data={
            "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
            "assertion": assertion.decode() if isinstance(assertion, bytes) else assertion})
        if r.status_code != 200:
            raise ConnectorError("Google rejected the service account (check domain-wide delegation scopes "
                                 f"and the admin email). HTTP {r.status_code}.")
        self._token = r.json()["access_token"]
        return self._token

    def _get(self, url: str, params: dict[str, Any] | None = None) -> dict:
        r = self.http.get(url, params=params, headers={"Authorization": f"Bearer {self._auth()}"})
        if r.status_code in (401, 403):
            raise PermissionError(url)
        r.raise_for_status()
        return r.json()

    def _pages(self, url: str, key: str, params: dict[str, Any], limit: int = 20000) -> list[dict]:
        out: list[dict] = []
        params = dict(params)
        while True:
            data = self._get(url, params)
            out.extend(data.get(key, []))
            tok = data.get("nextPageToken")
            if not tok or len(out) >= limit:
                return out
            params["pageToken"] = tok

    def test(self) -> str:
        try:
            cust = self._get(f"{DIR}/customers/my_customer")
        except PermissionError:
            raise ConnectorError("Authenticated, but the delegated scopes are missing.") from None
        return cust.get("customerDomain", self.admin_email.split("@")[-1])

    def collect(self) -> FactResult:
        res = FactResult()
        f = res.facts
        now = datetime.now(UTC)

        def attempt(label: str, fn) -> None:
            try:
                fn()
            except PermissionError:
                res.warnings.append(f"{label}: scope not granted, related checks skipped")
            except httpx.HTTPError as e:
                res.warnings.append(f"{label}: request failed ({type(e).__name__})")

        def _users() -> None:
            users = self._pages(f"{DIR}/users", "users", {"customer": "my_customer", "maxResults": 500, "projection": "basic"})
            active = [u for u in users if not u.get("suspended") and not u.get("archived")]
            f["gws.active_users"] = len(active)
            f["gws.two_sv_enforced_pct"] = pct(sum(1 for u in active if u.get("isEnforcedIn2Sv")), len(active))
            f["gws.two_sv_enrolled_pct"] = pct(sum(1 for u in active if u.get("isEnrolledIn2Sv")), len(active))
            f["gws.users_without_2sv"] = [mask_email(u["primaryEmail"]) for u in active if not u.get("isEnrolledIn2Sv")][:25]
            supers = [u for u in active if u.get("isAdmin")]
            f["gws.super_admin_count"] = len(supers)
            f["gws.super_admins"] = [mask_email(u["primaryEmail"]) for u in supers]
            admins = [u for u in active if u.get("isAdmin") or u.get("isDelegatedAdmin")]
            f["gws.admin_count"] = len(admins)
            f["gws.admins_without_2sv"] = sum(1 for u in admins if not u.get("isEnrolledIn2Sv"))
            suspended = [u for u in users if u.get("suspended")]
            cutoff60 = now - timedelta(days=60)
            inactive = [u for u in active if (_ts(u.get("lastLoginTime")) or now) < cutoff60]
            f["gws.suspended_count"] = len(suspended)
            f["gws.inactive_60d_count"] = len(inactive)
            f["gws.inactive_or_suspended_count"] = len(suspended) + len(inactive)
            f["gws.inactive_accounts"] = [mask_email(u["primaryEmail"]) for u in (suspended + inactive)][:25]
            cutoff30 = now - timedelta(days=30)
            never = [u for u in active if _ts(u.get("lastLoginTime")) is None and (_ts(u.get("creationTime")) or now) < cutoff30]
            f["gws.never_logged_in_count"] = len(never)
            f["gws.never_logged_in_accounts"] = [mask_email(u["primaryEmail"]) for u in never][:25]

        def _roles() -> None:
            roles = self._pages(f"{DIR}/customer/my_customer/roles", "items", {"maxResults": 100})
            super_ids = {r["roleId"] for r in roles if r.get("isSuperAdminRole")}
            assigns = self._pages(f"{DIR}/customer/my_customer/roleassignments", "items", {"maxResults": 200})
            f["gws.delegated_admin_assignments"] = sum(1 for a in assigns if a.get("roleId") not in super_ids)

        start = (now - timedelta(days=30)).strftime("%Y-%m-%dT%H:%M:%S.000Z")

        def _logins() -> None:
            total = 0
            for ev in ("suspicious_login", "suspicious_login_less_secure_app", "leaked_password"):
                total += len(self._pages(f"{REP}/login", "items", {"startTime": start, "eventName": ev, "maxResults": 1000}))
            f["gws.suspicious_login_events_30d"] = total

        def _tokens() -> None:
            items = self._pages(f"{REP}/token", "items", {"startTime": start, "eventName": "authorize", "maxResults": 1000})
            apps: dict[str, set[str]] = {}
            for it in items:
                for ev in it.get("events", []):
                    params = {p.get("name"): p for p in ev.get("parameters", [])}
                    app = (params.get("app_name") or {}).get("value") or (params.get("client_id") or {}).get("value") or "unknown"
                    scopes = set((params.get("scope") or {}).get("multiValue") or [])
                    apps.setdefault(app, set()).update(scopes)
            risky = sorted(a for a, s in apps.items() if s & HIGH_RISK_SCOPES)
            f["gws.oauth_apps_seen"] = len(apps)
            f["gws.high_risk_oauth_apps"] = len(risky)
            f["gws.high_risk_oauth_app_names"] = risky[:25]

        def _admin_log() -> None:
            data = self._get(f"{REP}/admin", {"maxResults": 1})
            f["gws.audit_logs_available"] = True
            items = data.get("items", [])
            f["gws.latest_admin_event_at"] = items[0]["id"]["time"] if items else None

        self._auth()
        for label, fn in [("Users", _users), ("Admin roles", _roles), ("Login audit", _logins),
                          ("OAuth token audit", _tokens), ("Admin audit", _admin_log)]:
            attempt(label, fn)
        return res

    @staticmethod
    def credential_fields() -> list[dict[str, Any]]:
        return [
            {"name": "admin_email", "label": "Admin email to impersonate", "secret": False},
            {"name": "service_account_json", "label": "Service account JSON key", "secret": True, "multiline": True},
        ]
