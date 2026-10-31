import base64
import hashlib
import json
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from cryptography.fernet import Fernet, InvalidToken

from .config import get_settings

_ph = PasswordHasher()
COOKIE_NAME = "sv_session"


def hash_password(password: str) -> str:
    return _ph.hash(password)


def verify_password(password: str, hashed: str | None) -> bool:
    if not hashed:
        _ph.hash("timing-equaliser")
        return False
    try:
        return _ph.verify(hashed, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def create_session_token(user_id: str, *, mfa: bool, pending_mfa: bool = False) -> str:
    s = get_settings()
    now = datetime.now(UTC)
    exp = now + (timedelta(minutes=10) if pending_mfa else timedelta(hours=s.session_hours))
    return jwt.encode({"sub": user_id, "iat": now, "exp": exp, "mfa": mfa, "pending_mfa": pending_mfa},
                      s.secret_key, algorithm="HS256")


def decode_session_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, get_settings().secret_key, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def _fernet() -> Fernet:
    s = get_settings()
    key = s.credentials_encryption_key
    if not key:
        if not s.is_dev:
            raise RuntimeError("CREDENTIALS_ENCRYPTION_KEY must be set outside development")
        key = base64.urlsafe_b64encode(hashlib.sha256(s.secret_key.encode()).digest()).decode()
    return Fernet(key.encode())


def encrypt_json(data: dict[str, Any]) -> bytes:
    return _fernet().encrypt(json.dumps(data).encode())


def decrypt_json(blob: bytes | None) -> dict[str, Any]:
    if not blob:
        return {}
    try:
        return json.loads(_fernet().decrypt(blob))
    except InvalidToken:
        raise RuntimeError("Stored credentials could not be decrypted (key rotated?)") from None


def encrypt_str(value: str) -> bytes:
    return _fernet().encrypt(value.encode())


def decrypt_str(blob: bytes) -> str:
    return _fernet().decrypt(blob).decode()


def new_invite_token() -> tuple[str, str]:
    token = secrets.token_urlsafe(32)
    return token, hashlib.sha256(token.encode()).hexdigest()


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
