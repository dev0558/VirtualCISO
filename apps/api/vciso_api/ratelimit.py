"""Fixed-window rate limiting backed by Redis (no-op if Redis is unreachable in development)."""
import logging
from functools import lru_cache

import redis
from fastapi import HTTPException, status

from .config import get_settings

log = logging.getLogger(__name__)


@lru_cache
def _redis():
    return redis.Redis.from_url(get_settings().redis_url, socket_connect_timeout=0.5, socket_timeout=0.5)


def hit(key: str, *, limit: int, window: int) -> None:
    if get_settings().env == "test":
        return
    try:
        r = _redis()
        n = r.incr(f"rl:{key}")
        if n == 1:
            r.expire(f"rl:{key}", window)
    except redis.RedisError:
        if not get_settings().is_dev:
            log.warning("rate limiter unavailable")
        return
    if n > limit:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many attempts. Please wait and try again.")
