"""
Redis cache helpers. Every operation is wrapped in try/except — if Redis is
unavailable the app degrades gracefully (DB/Qdrant/OpenAI called directly).
"""

import json
import redis

from backend.config import REDIS_HOST, REDIS_PORT

_client: redis.Redis | None = None


def _r() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            decode_responses=True,
            socket_connect_timeout=1,
            socket_timeout=1,
        )
    return _client


def cache_get(key: str):
    """Return deserialised value or None on miss / error."""
    try:
        raw = _r().get(key)
        return json.loads(raw) if raw is not None else None
    except Exception:
        return None


def cache_set(key: str, value, ttl: int) -> None:
    """Serialise value and store with TTL (seconds). Silently ignores errors."""
    try:
        _r().setex(key, ttl, json.dumps(value, ensure_ascii=False))
    except Exception:
        pass


def cache_del(*keys: str) -> None:
    """Delete one or more keys. Silently ignores errors."""
    try:
        if keys:
            _r().delete(*keys)
    except Exception:
        pass
