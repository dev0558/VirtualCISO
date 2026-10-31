"""Demo connector: returns recorded, fictional facts so sales demos and tests run without
real tenants. Never used for a real customer. `overrides` lets a demo show a fix being verified."""
from __future__ import annotations

from typing import Any

from .base import Connector, FactResult


class DemoConnector(Connector):
    def __init__(self, type_: str, name: str, account: str, facts: dict[str, Any], overrides: dict[str, Any] | None = None):
        self.type, self.name, self.account = type_, name, account
        self._facts = {**facts, **(overrides or {})}

    def test(self) -> str:
        return self.account

    def collect(self) -> FactResult:
        return FactResult(facts=dict(self._facts), warnings=["Demo mode: recorded fictional data"])
