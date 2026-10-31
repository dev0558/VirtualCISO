from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

import httpx

TIMEOUT = httpx.Timeout(20.0, connect=10.0)
_EMAIL = re.compile(r"^([^@\s])[^@\s]*@([^@\s]+)$")


class ConnectorError(Exception):
    """Raised for authentication/configuration failures. Message must never contain secrets."""


@dataclass
class FactResult:
    facts: dict[str, Any] = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)  # e.g. "Intune not licensed: device facts skipped"
    collected_at: datetime = field(default_factory=lambda: datetime.now(UTC))


def mask_email(value: str) -> str:
    """Evidence keeps enough to act on (first letter + domain) without storing full identities."""
    m = _EMAIL.match(value or "")
    return f"{m.group(1)}***@{m.group(2)}" if m else (value[:1] + "***" if value else "")


def pct(part: int, whole: int) -> float:
    return round(100.0 * part / whole, 1) if whole else 100.0


class Connector:
    type: str = ""
    name: str = ""
    read_only_scopes: list[str] = []

    def test(self) -> str:
        """Authenticate and return an account identifier. Raises ConnectorError."""
        raise NotImplementedError

    def collect(self) -> FactResult:
        raise NotImplementedError
