"""Connector normalisation against recorded (fictional) API responses — no real credentials."""
import httpx
import respx
from vciso_connectors.github import GitHubConnector
from vciso_connectors.m365 import M365Connector

G = "https://graph.microsoft.com/v1.0"


@respx.mock
def test_m365_collects_facts_and_masks_identities():
    respx.post("https://login.microsoftonline.com/t1/oauth2/v2.0/token").mock(return_value=httpx.Response(200, json={"access_token": "x"}))
    respx.get(f"{G}/users").mock(return_value=httpx.Response(200, json={"value": [
        {"id": "1", "userPrincipalName": "ann@contoso.example", "accountEnabled": True, "userType": "Member"},
        {"id": "2", "userPrincipalName": "bob@contoso.example", "accountEnabled": True, "userType": "Member"},
        {"id": "3", "userPrincipalName": "g#EXT#@contoso.example", "accountEnabled": True, "userType": "Guest",
         "createdDateTime": "2025-01-01T00:00:00Z", "signInActivity": {"lastSignInDateTime": "2025-02-01T00:00:00Z"}}]}))
    respx.get(f"{G}/reports/authenticationMethods/userRegistrationDetails").mock(return_value=httpx.Response(200, json={"value": [
        {"userPrincipalName": "ann@contoso.example", "isMfaRegistered": True, "userType": "member"},
        {"userPrincipalName": "bob@contoso.example", "isMfaRegistered": False, "userType": "member"}]}))
    respx.get(f"{G}/directoryRoles").mock(return_value=httpx.Response(200, json={"value": [
        {"roleTemplateId": "62e90394-69f5-4237-9190-012177145e10", "members": [{"id": "1", "userPrincipalName": "ann@contoso.example"}]}]}))
    respx.get(f"{G}/policies/identitySecurityDefaultsEnforcementPolicy").mock(return_value=httpx.Response(200, json={"isEnabled": False}))
    respx.get(f"{G}/identity/conditionalAccess/policies").mock(return_value=httpx.Response(200, json={"value": [
        {"state": "enabled", "conditions": {"clientAppTypes": ["exchangeActiveSync", "other"], "users": {"includeUsers": ["All"]}},
         "grantControls": {"builtInControls": ["block"]}}]}))
    respx.get(f"{G}/auditLogs/directoryAudits").mock(return_value=httpx.Response(200, json={"value": [{"activityDateTime": "2026-10-01T00:00:00Z"}]}))
    respx.get(f"{G}/domains").mock(return_value=httpx.Response(200, json={"value": [{"isVerified": True, "passwordValidityPeriodInDays": 2147483647}]}))
    respx.get(f"{G}/policies/authenticationMethodsPolicy").mock(return_value=httpx.Response(403))
    respx.get(f"{G}/deviceManagement/managedDevices").mock(return_value=httpx.Response(403))

    res = M365Connector({"tenant_id": "t1", "client_id": "c", "client_secret": "s"}).collect()
    f = res.facts
    assert f["m365.mfa_registered_pct"] == 50.0
    assert f["m365.users_without_mfa"] == ["b***@contoso.example"]
    assert f["m365.global_admin_count"] == 1
    assert f["m365.legacy_auth_blocked"] is True
    assert f["m365.stale_guest_count"] == 1
    assert "m365.strong_auth_methods_enabled" not in f  # permission missing -> skipped, not failed
    assert any("permission" in w for w in res.warnings)
    assert "ann@contoso.example" not in str(f)


@respx.mock
def test_github_flags_sensitive_public_repos():
    api = "https://api.github.com"
    respx.get(f"{api}/orgs/acme").mock(return_value=httpx.Response(200, json={"two_factor_requirement_enabled": True, "default_repository_permission": "read"}))
    respx.get(f"{api}/orgs/acme/members").mock(return_value=httpx.Response(200, json=[]))
    respx.get(f"{api}/orgs/acme/outside_collaborators").mock(return_value=httpx.Response(200, json=[]))
    respx.get(f"{api}/orgs/acme/repos").mock(return_value=httpx.Response(200, json=[
        {"name": "web", "private": False, "visibility": "public", "default_branch": "main", "archived": False, "fork": False},
        {"name": "infra-terraform", "private": False, "visibility": "public", "default_branch": "main", "archived": False, "fork": False}]))
    respx.get(url__regex=rf"{api}/repos/acme/.*/branches/main/protection").mock(return_value=httpx.Response(404))
    respx.get(url__regex=rf"{api}/repos/acme/.*/rules/branches/main").mock(return_value=httpx.Response(200, json=[]))
    respx.get(f"{api}/orgs/acme/code-scanning/alerts").mock(return_value=httpx.Response(403))
    f = GitHubConnector({"token": "t", "org": "acme"}).collect().facts
    assert f["gh.sensitive_public_repos"] == ["infra-terraform"]
    assert f["gh.default_branch_protected_pct"] == 0.0
    assert f["gh.org_2fa_required"] is True
    assert "gh.open_critical_code_alerts" not in f
