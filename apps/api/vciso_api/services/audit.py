from sqlalchemy.orm import Session

from ..models import AuditLog

SECRET_HINTS = ("secret", "token", "password", "private_key")


def log(db: Session, *, org_id, actor: str, role: str, action: str, resource: str, details: str = "",
        user_id=None, ip: str | None = None) -> None:
    """Append an audit entry. Callers must never pass secrets; we defensively truncate."""
    lowered = details.lower()
    if any(h in lowered for h in SECRET_HINTS) and "=" in details:
        details = "[details redacted: possible secret]"
    db.add(AuditLog(organization_id=org_id, user_id=user_id, actor=actor[:200], role=role, action=action[:80],
                    resource=resource[:255], details=details[:2000], ip=ip))
