from datetime import datetime, timezone

from backend.cache import cache_get, cache_set
from backend.supabase_client import get_supabase


def get_subscription(user_id: str) -> dict:
    """Returns {'is_pro': bool, 'status': str}. Result cached 5 min."""
    ck = f"sub:{user_id}"
    cached = cache_get(ck)
    if cached is not None:
        return cached

    sb = get_supabase()
    result = (
        sb.table("subscriptions")
        .select("status,current_period_end")
        .eq("user_id", user_id)
        .execute()
    )

    if not result.data:
        data = {"is_pro": False, "status": "free"}
    else:
        row = result.data[0]
        is_active = row.get("status") == "active"
        if is_active and row.get("current_period_end"):
            try:
                end_str = row["current_period_end"]
                if end_str.endswith("Z"):
                    end_str = end_str[:-1] + "+00:00"
                end = datetime.fromisoformat(end_str)
                if end.tzinfo is None:
                    end = end.replace(tzinfo=timezone.utc)
                is_active = end > datetime.now(timezone.utc)
            except Exception:
                pass
        data = {
            "is_pro": is_active,
            "status": "active" if is_active else row.get("status", "expired"),
        }

    cache_set(ck, data, 300)
    return data
