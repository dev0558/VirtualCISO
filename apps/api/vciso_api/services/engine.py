"""Check engine: collect facts from each connected integration, evaluate every enabled check,
store hashed evidence, and index results for AI retrieval."""
from __future__ import annotations

import hashlib
import json
import logging
import time
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session
from vciso_connectors import ConnectorError, build_connector

from ..models import Check, CheckRun, Evidence, Integration, Organization
from ..security import decrypt_json
from . import audit, storage
from .rules import facts_used, status_for

log = logging.getLogger(__name__)


def canonical_hash(payload: dict[str, Any]) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str, separators=(",", ":")).encode()).hexdigest()


def connector_for(integration: Integration):
    creds = decrypt_json(integration.credentials_enc) if integration.mode == "live" else None
    return build_connector(integration.type, integration.mode, creds, integration.config or {})


def run_checks(db: Session, org: Organization, *, trigger: str, actor: str, role: str,
               user_id=None, only_check_code: str | None = None) -> CheckRun:
    integrations = db.scalars(select(Integration).where(Integration.organization_id == org.id,
                                                        Integration.status != "disconnected")).all()
    checks = db.scalars(select(Check).where(Check.enabled.is_(True)).order_by(Check.code)).all()
    if only_check_code:
        checks = [c for c in checks if c.code == only_check_code]

    run = CheckRun(organization_id=org.id, trigger=trigger, triggered_by=actor, status="running")
    db.add(run)
    db.flush()

    by_type = {i.type: i for i in integrations}
    needed = {c.connector for c in checks}
    counts = {"passed": 0, "failed": 0, "warning": 0, "skipped": 0}
    connector_status: dict[str, Any] = {}

    for ctype in sorted(needed):
        integ = by_type.get(ctype)
        if not integ:
            continue
        started = time.monotonic()
        try:
            result = connector_for(integ).collect()
        except ConnectorError as e:
            integ.status, integ.last_error = "error", str(e)[:500]
            connector_status[ctype] = {"status": "error", "error": str(e)[:200]}
            continue
        except Exception as e:  # network or unexpected API shape; never leak details
            log.exception("connector %s failed", ctype)
            integ.status, integ.last_error = "error", f"Collection failed ({type(e).__name__})"
            connector_status[ctype] = {"status": "error", "error": type(e).__name__}
            continue
        duration = int((time.monotonic() - started) * 1000)
        integ.status, integ.last_error, integ.last_synced_at = "connected", None, datetime.now(UTC)
        connector_status[ctype] = {"status": "ok", "warnings": result.warnings, "facts": len(result.facts)}

        for chk in (c for c in checks if c.connector == ctype):
            status = status_for(chk.rule, chk.warn_rule, result.facts)
            names = list(dict.fromkeys(facts_used(chk.rule) + (chk.evidence_facts or [])))
            observed = {
                "facts": {n: result.facts.get(n) for n in names},
                "connector": ctype,
                "mode": integ.mode,
                "account": integ.account_identifier,
                "rule": chk.rule,
                "collector_warnings": [w for w in result.warnings][:5],
            }
            collected_at = result.collected_at
            sha = canonical_hash({"organization_id": str(org.id), "check": chk.code, "status": status,
                                  "collected_at": collected_at.isoformat(), "observed": observed})
            key = storage.put_evidence(
                f"{org.id}/evidence/{chk.code}/{collected_at.strftime('%Y%m%dT%H%M%SZ')}-{sha[:12]}.json",
                {"organization_id": str(org.id), "check": chk.code, "status": status,
                 "collected_at": collected_at.isoformat(), "observed": observed, "sha256": sha}, sha)
            db.add(Evidence(organization_id=org.id, check_run_id=run.id, check_id=chk.id, status=status,
                            observed=observed, sha256=sha, object_key=key, collected_at=collected_at,
                            duration_ms=duration))
            counts[status] += 1

    run.status = "completed"
    run.finished_at = datetime.now(UTC)
    run.summary = {"counts": counts, "connectors": connector_status}
    audit.log(db, org_id=org.id, user_id=user_id, actor=actor, role=role,
              action="CHECK_RUN_VERIFY" if only_check_code else "CHECK_RUN",
              resource=only_check_code or f"{sum(counts.values())} checks",
              details=f"Trigger: {trigger}. Passed {counts['passed']}, failed {counts['failed']}, "
                      f"warning {counts['warning']}, skipped {counts['skipped']}.")
    db.flush()
    from ..ai import rag  # local import to avoid cycles

    rag.index_check_results(db, org)
    return run
