"""Read-only compliance connectors. Each connector returns a flat dict of *facts*
(e.g. "m365.mfa_registered_pct": 97.5) that the check engine evaluates against
rules in seed/checks.yaml. A fact that cannot be collected (missing permission or
licence) is simply absent, which makes dependent checks "skipped" rather than failed."""
from .base import Connector, ConnectorError, FactResult
from .registry import CONNECTOR_META, build_connector

__all__ = ["Connector", "ConnectorError", "FactResult", "build_connector", "CONNECTOR_META"]
