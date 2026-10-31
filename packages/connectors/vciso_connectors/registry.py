from __future__ import annotations

from typing import Any

from .base import Connector, ConnectorError
from .demo import DemoConnector
from .github import GitHubConnector
from .google_workspace import GoogleWorkspaceConnector
from .m365 import M365Connector

_LIVE = {"m365": M365Connector, "google_workspace": GoogleWorkspaceConnector, "github": GitHubConnector}

CONNECTOR_META: dict[str, dict[str, Any]] = {
    t: {"type": t, "name": c.name, "read_only_scopes": c.read_only_scopes, "credential_fields": c.credential_fields()}
    for t, c in _LIVE.items()
}


def build_connector(type_: str, mode: str, credentials: dict[str, Any] | None, config: dict[str, Any]) -> Connector:
    if type_ not in _LIVE:
        raise ConnectorError(f"Unknown connector type {type_}")
    if mode == "demo":
        return DemoConnector(type_, _LIVE[type_].name, config.get("account", "demo"), config.get("facts", {}),
                             config.get("overrides"))
    return _LIVE[type_](credentials or {})
