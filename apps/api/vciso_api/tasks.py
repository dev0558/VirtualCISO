"""Celery tasks: daily scheduled check runs for every organisation with integrations."""
import logging
import uuid

from celery import Celery
from celery.schedules import crontab
from sqlalchemy import text

from .config import get_settings
from .db import session_scope
from .models import Organization
from .services import engine, storage

log = logging.getLogger(__name__)
celery = Celery("securavantage", broker=get_settings().redis_url, backend=get_settings().redis_url)
celery.conf.update(task_acks_late=True, worker_prefetch_multiplier=1, timezone="UTC",
                   beat_schedule={
                       "daily-checks": {"task": "vciso_api.tasks.schedule_all", "schedule": crontab(hour=2, minute=0)},
                       "retry-unstored-evidence": {"task": "vciso_api.tasks.retry_unstored_evidence",
                                                   "schedule": crontab(minute="*/15")},
                   })


@celery.task
def schedule_all() -> int:
    with session_scope() as db:
        org_ids = [r[0] for r in db.execute(text("SELECT * FROM app_scheduled_org_ids()")).all()]
    for oid in org_ids:
        run_org_checks.delay(str(oid))
    return len(org_ids)


@celery.task(autoretry_for=(ConnectionError,), retry_backoff=True, max_retries=3)
def run_org_checks(org_id: str, trigger: str = "scheduled") -> dict:
    oid = uuid.UUID(org_id)
    with session_scope(org_id=oid) as db:
        org = db.get(Organization, oid)
        if not org:
            return {"skipped": True}
        run = engine.run_checks(db, org, trigger=trigger, actor="Scheduler", role="vciso")
        return run.summary


@celery.task
def retry_unstored_evidence() -> int:
    """Upload evidence that a run could not store, one tenant at a time under that tenant's RLS context."""
    if not storage.is_configured():
        return 0
    with session_scope() as db:
        org_ids = [r[0] for r in db.execute(text("SELECT * FROM app_org_ids_with_unstored_evidence()")).all()]
    total = 0
    for oid in org_ids:
        with session_scope(org_id=oid) as db:
            uploaded, reachable = engine.store_pending_evidence(db, oid)
        total += uploaded
        if not reachable:
            log.warning("object store unavailable; evidence upload will be retried on the next sweep")
            break
    return total
