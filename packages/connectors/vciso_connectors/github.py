"""GitHub organisation via REST API (read-only).

Use a fine-grained personal access token or GitHub App installation token scoped to the org with
read-only permissions: Organization > Members, Administration; Repository > Administration, Metadata,
Code scanning alerts, Secret scanning alerts. (Classic PAT alternative: read:org + repo read.)
FACTS: gh.org_2fa_required, gh.members_without_2fa, gh.active_repo_count, gh.default_branch_protected_pct,
  gh.unprotected_repos, gh.secret_scanning_pct, gh.push_protection_pct, gh.repos_without_secret_scanning,
  gh.open_critical_code_alerts, gh.open_high_code_alerts, gh.public_repo_count, gh.sensitive_public_repo_count,
  gh.sensitive_public_repos, gh.dependabot_updates_pct, gh.repos_without_dependabot, gh.owner_count, gh.owners,
  gh.default_repo_permission, gh.required_review_pct, gh.repos_without_required_review, gh.outside_collaborator_count
"""
from __future__ import annotations

import re
from typing import Any

import httpx

from .base import TIMEOUT, Connector, ConnectorError, FactResult, pct

API = "https://api.github.com"
SENSITIVE = re.compile(r"(internal|secret|private|prod|infra|terraform|ansible|config|credential|backup|ops|vault|keys?)", re.I)
MAX_REPOS = 200


class GitHubConnector(Connector):
    type = "github"
    name = "GitHub"
    read_only_scopes = ["members:read", "administration:read", "metadata:read",
                        "code_scanning_alerts:read", "secret_scanning_alerts:read"]

    def __init__(self, credentials: dict[str, str], client: httpx.Client | None = None):
        try:
            self.token = credentials["token"].strip()
            self.org = credentials["org"].strip().removeprefix("https://github.com/").strip("/")
        except KeyError as e:
            raise ConnectorError(f"Missing credential field: {e.args[0]}") from None
        if not re.fullmatch(r"[A-Za-z0-9-]{1,39}", self.org):
            raise ConnectorError("Organisation name is not valid.")
        self.http = client or httpx.Client(timeout=TIMEOUT, headers={
            "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"})

    def _req(self, path: str, params: dict[str, Any] | None = None) -> httpx.Response:
        return self.http.get(f"{API}{path}", params=params, headers={"Authorization": f"Bearer {self.token}"})

    def _get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        r = self._req(path, params)
        if r.status_code in (401, 403):
            raise PermissionError(path)
        if r.status_code == 404:
            raise LookupError(path)
        r.raise_for_status()
        return r.json()

    def _pages(self, path: str, params: dict[str, Any] | None = None, limit: int = 2000) -> list[dict]:
        out: list[dict] = []
        params = {"per_page": 100, **(params or {})}
        page = 1
        while True:
            batch = self._get(path, {**params, "page": page})
            out.extend(batch)
            if len(batch) < params["per_page"] or len(out) >= limit:
                return out
            page += 1

    def test(self) -> str:
        r = self._req(f"/orgs/{self.org}")
        if r.status_code == 401:
            raise ConnectorError("GitHub rejected the token.")
        if r.status_code == 404:
            raise ConnectorError("Organisation not found or the token cannot see it.")
        r.raise_for_status()
        return f"github.com/{self.org}"

    def collect(self) -> FactResult:
        res = FactResult()
        f = res.facts

        def attempt(label: str, fn) -> None:
            try:
                fn()
            except (PermissionError, LookupError):
                res.warnings.append(f"{label}: not permitted or not available, related checks skipped")
            except httpx.HTTPError as e:
                res.warnings.append(f"{label}: request failed ({type(e).__name__})")

        def _org() -> None:
            org = self._get(f"/orgs/{self.org}")
            if org.get("two_factor_requirement_enabled") is not None:  # only visible to owners
                f["gh.org_2fa_required"] = bool(org["two_factor_requirement_enabled"])
            if org.get("default_repository_permission"):
                f["gh.default_repo_permission"] = org["default_repository_permission"]

        def _members() -> None:
            f["gh.members_without_2fa"] = len(self._pages(f"/orgs/{self.org}/members", {"filter": "2fa_disabled"}))
            owners = self._pages(f"/orgs/{self.org}/members", {"role": "admin"})
            f["gh.owner_count"] = len(owners)
            f["gh.owners"] = [o["login"] for o in owners][:10]
            f["gh.outside_collaborator_count"] = len(self._pages(f"/orgs/{self.org}/outside_collaborators"))

        def _repos() -> None:
            repos = [r for r in self._pages(f"/orgs/{self.org}/repos", {"type": "all"}, limit=MAX_REPOS)
                     if not r.get("archived") and not r.get("fork")]
            f["gh.active_repo_count"] = len(repos)
            public = [r for r in repos if r.get("visibility") == "public" or not r.get("private")]
            sensitive = [r["name"] for r in public if SENSITIVE.search(r["name"])]
            f["gh.public_repo_count"] = len(public)
            f["gh.sensitive_public_repo_count"] = len(sensitive)
            f["gh.sensitive_public_repos"] = sensitive[:25]

            ss_known = [r for r in repos if (r.get("security_and_analysis") or {}).get("secret_scanning")]
            if ss_known:
                no_ss = [r["name"] for r in ss_known if r["security_and_analysis"]["secret_scanning"].get("status") != "enabled"]
                pp = [r for r in ss_known if (r["security_and_analysis"].get("secret_scanning_push_protection") or {}).get("status") == "enabled"]
                f["gh.secret_scanning_pct"] = pct(len(ss_known) - len(no_ss), len(ss_known))
                f["gh.push_protection_pct"] = pct(len(pp), len(ss_known))
                f["gh.repos_without_secret_scanning"] = no_ss[:25]
            dep_known = [r for r in repos if (r.get("security_and_analysis") or {}).get("dependabot_security_updates")]
            if dep_known:
                no_dep = [r["name"] for r in dep_known if r["security_and_analysis"]["dependabot_security_updates"].get("status") != "enabled"]
                f["gh.dependabot_updates_pct"] = pct(len(dep_known) - len(no_dep), len(dep_known))
                f["gh.repos_without_dependabot"] = no_dep[:25]
            if repos and not ss_known:
                res.warnings.append("security_and_analysis not visible (token lacks Administration:read): scanning checks skipped")

            protected, reviewed, unprotected, unreviewed, checked = 0, 0, [], [], 0
            for r in repos:
                branch = r.get("default_branch") or "main"
                resp = self._req(f"/repos/{self.org}/{r['name']}/branches/{branch}/protection")
                if resp.status_code == 403:
                    continue  # no permission / plan does not support protection on private repos
                checked += 1
                rules = self._req(f"/repos/{self.org}/{r['name']}/rules/branches/{branch}")
                rule_types = {x.get("type") for x in rules.json()} if rules.status_code == 200 else set()
                if resp.status_code == 200 or rule_types & {"pull_request", "non_fast_forward", "deletion"}:
                    protected += 1
                    body = resp.json() if resp.status_code == 200 else {}
                    reviews = (body.get("required_pull_request_reviews") or {}).get("required_approving_review_count", 0)
                    pr_rule = next((x for x in rules.json() if x.get("type") == "pull_request"), None) if rules.status_code == 200 else None
                    if reviews >= 1 or (pr_rule and (pr_rule.get("parameters") or {}).get("required_approving_review_count", 0) >= 1):
                        reviewed += 1
                    else:
                        unreviewed.append(r["name"])
                else:
                    unprotected.append(r["name"])
                    unreviewed.append(r["name"])
            if checked:
                f["gh.default_branch_protected_pct"] = pct(protected, checked)
                f["gh.unprotected_repos"] = unprotected[:25]
                f["gh.required_review_pct"] = pct(reviewed, checked)
                f["gh.repos_without_required_review"] = unreviewed[:25]

        def _code_alerts() -> None:
            crit = self._pages(f"/orgs/{self.org}/code-scanning/alerts", {"state": "open", "severity": "critical"}, limit=500)
            high = self._pages(f"/orgs/{self.org}/code-scanning/alerts", {"state": "open", "severity": "high"}, limit=500)
            f["gh.open_critical_code_alerts"] = len(crit)
            f["gh.open_high_code_alerts"] = len(high)

        for label, fn in [("Organisation", _org), ("Members", _members), ("Repositories", _repos),
                          ("Code scanning", _code_alerts)]:
            attempt(label, fn)
        return res

    @staticmethod
    def credential_fields() -> list[dict[str, Any]]:
        return [
            {"name": "org", "label": "Organisation login", "secret": False},
            {"name": "token", "label": "Read-only access token", "secret": True},
        ]
