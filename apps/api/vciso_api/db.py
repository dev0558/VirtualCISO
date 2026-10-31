"""Database engine and tenant-scoped sessions.

Row-level security policies read two session settings:
  app.user_id  - the authenticated user
  app.org_id   - the organisation the request acts on
They are applied with set_config(..., is_local=true) at the start of every transaction
(see the after_begin listener), so a commit never leaks or drops tenant context.
"""
from collections.abc import Iterator
from contextlib import contextmanager
from uuid import UUID

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import get_settings


class Base(DeclarativeBase):
    pass


engine = create_engine(get_settings().database_url, pool_pre_ping=True, pool_size=10, max_overflow=10)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


@event.listens_for(Session, "after_begin")
def _apply_tenant_context(session: Session, transaction, connection) -> None:
    user_id = session.info.get("user_id")
    org_id = session.info.get("org_id")
    connection.execute(
        text("SELECT set_config('app.user_id', :u, true), set_config('app.org_id', :o, true)"),
        {"u": str(user_id) if user_id else "", "o": str(org_id) if org_id else ""},
    )


def set_context(session: Session, *, user_id: UUID | None = None, org_id: UUID | None = None) -> None:
    """Change tenant context; takes effect immediately and for every later transaction."""
    session.info["user_id"] = user_id
    session.info["org_id"] = org_id
    if session.in_transaction():
        session.execute(
            text("SELECT set_config('app.user_id', :u, true), set_config('app.org_id', :o, true)"),
            {"u": str(user_id) if user_id else "", "o": str(org_id) if org_id else ""},
        )


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@contextmanager
def session_scope(*, user_id: UUID | None = None, org_id: UUID | None = None) -> Iterator[Session]:
    db = SessionLocal()
    set_context(db, user_id=user_id, org_id=org_id)
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
