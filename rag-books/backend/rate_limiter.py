"""
Rate limiter shared across main.py and upload.py.

Key function: extracts user_id from Bearer JWT (without re-verifying — auth
middleware handles real verification). Falls back to client IP when no valid
token is present so unauthenticated probes are still throttled.
"""

import jwt as pyjwt
from fastapi import Request
from slowapi import Limiter


def _rate_limit_key(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
        try:
            payload = pyjwt.decode(token, options={"verify_signature": False})
            sub = payload.get("sub")
            if sub:
                return f"user:{sub}"
        except Exception:
            pass
    host = request.client.host if request.client else "unknown"
    return f"ip:{host}"


limiter = Limiter(key_func=_rate_limit_key)
