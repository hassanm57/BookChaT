"""
FastAPI application entry point.
"""

import os
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv

# Load .env before any backend modules read os.environ at import time
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

import httpx
import logging

import fitz
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from qdrant_client import QdrantClient
from qdrant_client.models import FieldCondition, Filter, FilterSelector, MatchValue
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from backend.auth import get_current_user
from backend.cache import cache_del, cache_get, cache_set
from backend.config import QDRANT_COLLECTION, QDRANT_HOST, QDRANT_PORT
from backend.rate_limiter import limiter
from backend.retriever import retrieve
from backend.llm import generate
from backend.supabase_client import get_supabase
from backend.subscriptions import get_subscription
from backend.upload import router as upload_router

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "")
ADMIN_EMAIL = "hassanmansoor1569@gmail.com"

FREE_LIFETIME_LIMIT = 10   # total messages ever on free plan — no reset
PRO_DAILY_LIMIT = 30       # messages per UTC day on pro plan


def _count_lifetime_messages(user_id: str) -> int:
    """Count ALL messages ever sent by this user (used for free tier lifetime cap)."""
    sb = get_supabase()
    result = (
        sb.table("message_events")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .execute()
    )
    return result.count or 0


def _count_today_messages(user_id: str) -> int:
    """Count messages sent today (UTC) — used for pro tier daily cap."""
    today_start = (
        datetime.now(timezone.utc)
        .replace(hour=0, minute=0, second=0, microsecond=0)
        .isoformat()
    )
    sb = get_supabase()
    result = (
        sb.table("message_events")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .gte("created_at", today_start)
        .execute()
    )
    return result.count or 0

logger = logging.getLogger(__name__)

app = FastAPI(title="Folio API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)


class ChatRequest(BaseModel):
    book_id: str
    query: str


def _heuristic_metadata(doc: fitz.Document) -> tuple[str, str]:
    """Extract title and author from first two pages using font-size and pattern heuristics."""
    title = ""
    author = ""

    pages_to_scan = min(doc.page_count, 2)

    # ── Title: largest font span on the first page ───────────────────────────
    if not title and doc.page_count > 0:
        spans: list[dict] = []
        for block in doc[0].get_text("dict").get("blocks", []):
            if block.get("type") != 0:
                continue
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    text = span["text"].strip()
                    if text and len(text) > 1:
                        spans.append({"text": text, "size": span["size"]})

        if spans:
            max_size = max(s["size"] for s in spans)
            # Collect all spans within 10% of max font size as the title
            title_parts = [s["text"] for s in spans if s["size"] >= max_size * 0.90]
            title = " ".join(title_parts[:6]).strip()

    # ── Author: scan lines for "by …" / "Author:" patterns ──────────────────
    for i in range(pages_to_scan):
        if author:
            break
        lines = [l.strip() for l in doc[i].get_text().splitlines() if l.strip()]
        for idx, line in enumerate(lines):
            low = line.lower()

            # Standalone "by" keyword followed by next line
            if low in ("by", "written by", "edited by"):
                if idx + 1 < len(lines):
                    author = lines[idx + 1]
                    break

            # "By Author Name" on same line
            m = re.match(r"^(?:written |edited )?by\s+(.+)$", line, re.IGNORECASE)
            if m:
                author = m.group(1).strip()
                break

            # "Author: Name" or "Authors: Name"
            m = re.match(r"^authors?:\s*(.+)$", line, re.IGNORECASE)
            if m:
                author = m.group(1).strip()
                break

    return title, author


@app.post("/extract-metadata")
@limiter.limit("20/minute")
async def extract_metadata(
    request: Request,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    data = await file.read()
    doc = fitz.open(stream=data, filetype="pdf")

    # 1 — PDF metadata (fastest, works for most exported/digital PDFs)
    meta = doc.metadata or {}
    title = (meta.get("title") or "").strip()
    author = (meta.get("author") or "").strip()

    # 2 — Heuristic scan of first pages
    if not title or not author:
        h_title, h_author = _heuristic_metadata(doc)
        if not title:
            title = h_title
        if not author:
            author = h_author

    doc.close()

    # 3 — Filename fallback for title
    if not title and file.filename:
        title = file.filename.removesuffix(".pdf").replace("-", " ").replace("_", " ").title()

    return {"title": title, "author": author}


@app.get("/books")
@limiter.limit("60/minute")
def list_books(request: Request, user_id: str = Depends(get_current_user)):
    ck = f"books:{user_id}"
    cached = cache_get(ck)
    if cached is not None:
        return cached
    sb = get_supabase()
    result = sb.table("books").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    cache_set(ck, result.data, 30)
    return result.data


@app.get("/books/{book_id}")
@limiter.limit("120/minute")
def get_book(request: Request, book_id: str, user_id: str = Depends(get_current_user)):
    ck = f"book:{user_id}:{book_id}"
    cached = cache_get(ck)
    if cached is not None:
        return cached
    sb = get_supabase()
    result = (
        sb.table("books")
        .select("*")
        .eq("user_id", user_id)
        .eq("book_id", book_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Book not found")
    cache_set(ck, result.data, 30)
    return result.data


@app.get("/books/{book_id}/pdf-url")
@limiter.limit("30/minute")
def get_pdf_url(request: Request, book_id: str, user_id: str = Depends(get_current_user)):
    ck = f"pdf_url:{user_id}:{book_id}"
    cached = cache_get(ck)
    if cached:
        return {"url": cached}

    sb = get_supabase()
    result = (
        sb.table("books")
        .select("pdf_filename")
        .eq("user_id", user_id)
        .eq("book_id", book_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Book not found")

    pdf_path = f"{user_id}/{result.data['pdf_filename']}"
    signed = sb.storage.from_("pdfs").create_signed_url(pdf_path, expires_in=3600)
    url = signed["signedURL"]
    cache_set(ck, url, 3300)  # 55 min — 5 min buffer before Supabase 1hr expiry
    return {"url": url}


@app.delete("/books/{book_id}")
@limiter.limit("30/minute")
def delete_book(request: Request, book_id: str, user_id: str = Depends(get_current_user)):
    sb = get_supabase()

    # Verify ownership and get pdf_filename before deleting anything
    result = (
        sb.table("books")
        .select("book_id, pdf_filename")
        .eq("user_id", user_id)
        .eq("book_id", book_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Book not found")

    pdf_filename = result.data["pdf_filename"]

    # 1. Delete Qdrant vectors (best-effort — don't let Qdrant failure block the rest)
    try:
        qdrant = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
        qdrant.delete(
            collection_name=QDRANT_COLLECTION,
            points_selector=FilterSelector(
                filter=Filter(
                    must=[
                        FieldCondition(key="book_id", match=MatchValue(value=book_id)),
                        FieldCondition(key="user_id", match=MatchValue(value=user_id)),
                    ]
                )
            ),
        )
    except Exception:
        logger.exception("Qdrant delete failed for book %s — continuing", book_id)

    # 2. Delete PDF from Storage
    try:
        sb.storage.from_("pdfs").remove([f"{user_id}/{pdf_filename}"])
    except Exception:
        logger.exception("Storage delete (PDF) failed for book %s — continuing", book_id)

    # 3. Delete cover from Storage
    try:
        sb.storage.from_("covers").remove([f"{user_id}/{book_id}_cover.jpg"])
    except Exception:
        pass  # cover may not exist for processing/error books

    # 4. Delete DB row
    sb.table("books").delete().eq("user_id", user_id).eq("book_id", book_id).execute()

    # 5. Bust cache
    cache_del(f"books:{user_id}", f"book:{user_id}:{book_id}", f"pdf_url:{user_id}:{book_id}")

    return {"deleted": book_id}


@app.post("/chat")
@limiter.limit("30/minute")
async def chat(request: Request, body: ChatRequest, user_id: str = Depends(get_current_user)):
    sb = get_supabase()

    # Verify book ownership
    result = (
        sb.table("books")
        .select("book_id")
        .eq("user_id", user_id)
        .eq("book_id", body.book_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=403, detail="Book not found or access denied")

    # Enforce message quota (lifetime for free, daily for pro)
    sub = get_subscription(user_id)
    if sub["is_pro"]:
        count = _count_today_messages(user_id)
        limit = PRO_DAILY_LIMIT
        if count >= limit:
            raise HTTPException(
                status_code=429,
                detail={
                    "code": "DAILY_LIMIT",
                    "message": f"You've used all {limit} messages for today. Your limit resets at midnight UTC.",
                    "is_pro": True,
                    "limit": limit,
                },
            )
    else:
        count = _count_lifetime_messages(user_id)
        limit = FREE_LIFETIME_LIMIT
        if count >= limit:
            raise HTTPException(
                status_code=429,
                detail={
                    "code": "LIFETIME_LIMIT",
                    "message": f"You've used all {limit} free messages. Upgrade to Pro for 30 messages per day.",
                    "is_pro": False,
                    "limit": limit,
                },
            )

    # Record the message event before retrieval (prevents gaming by aborting)
    sb.table("message_events").insert({"user_id": user_id}).execute()

    try:
        chunks = retrieve(body.query, body.book_id, user_id=user_id)
    except Exception:
        raise HTTPException(
            status_code=503,
            detail={"code": "RETRIEVAL_UNAVAILABLE", "message": "Folio is temporarily unavailable. Please try again in a moment."},
        )

    if not chunks:
        raise HTTPException(
            status_code=404,
            detail={"code": "NO_RESULTS", "message": "Nothing found on that topic. Try asking it a different way."},
        )

    return StreamingResponse(
        generate(body.query, chunks),
        media_type="text/event-stream",
    )


@app.get("/subscription-status")
@limiter.limit("60/minute")
def subscription_status(request: Request, user_id: str = Depends(get_current_user)):
    sub = get_subscription(user_id)
    if sub["is_pro"]:
        count = _count_today_messages(user_id)
        limit = PRO_DAILY_LIMIT
        limit_type = "daily"
    else:
        count = _count_lifetime_messages(user_id)
        limit = FREE_LIFETIME_LIMIT
        limit_type = "lifetime"
    return {
        "is_pro": sub["is_pro"],
        "status": sub["status"],
        "limit_type": limit_type,
        "messages_used": count,
        "limit": limit,
        "messages_remaining": max(0, limit - count),
    }


@app.post("/upgrade-request")
@limiter.limit("5/hour")
async def upgrade_request(
    request: Request,
    user_id: str = Depends(get_current_user),
    name: str = Form(...),
    country: str = Form(...),
    transfer_method: str = Form(...),
    transaction_ref: str = Form(...),
    amount_sent: str = Form(...),
    notes: str = Form(""),
    screenshot: UploadFile = File(...),
):
    sb = get_supabase()

    # Get user email from auth
    try:
        user_data = sb.auth.admin.get_user_by_id(user_id)
        user_email = user_data.user.email if user_data and user_data.user else "unknown"
    except Exception:
        user_email = "unknown"

    logger.info("upgrade-request: received from user=%s email=%s", user_id, user_email)

    # Upload screenshot to private bucket
    screenshot_url = ""
    try:
        content = await screenshot.read()
        raw_ext = (screenshot.filename or "screenshot.jpg").rsplit(".", 1)[-1].lower()
        ext = raw_ext if raw_ext in ("jpg", "jpeg", "png", "gif", "webp") else "jpg"
        path = f"proofs/{user_id}_{int(datetime.now(timezone.utc).timestamp())}.{ext}"

        existing_buckets = [b.name for b in sb.storage.list_buckets()]
        if "payment-proofs" not in existing_buckets:
            sb.storage.create_bucket("payment-proofs", options={"public": False})

        sb.storage.from_("payment-proofs").upload(
            path, content, {"content-type": f"image/{ext}"}
        )
        signed = sb.storage.from_("payment-proofs").create_signed_url(
            path, expires_in=86400 * 30
        )
        screenshot_url = (
            signed.get("signedURL")
            or (signed.get("data") or {}).get("signedUrl", "")
        )
        logger.info("upgrade-request: screenshot uploaded, url=%s", bool(screenshot_url))
    except Exception:
        logger.exception("upgrade-request: screenshot upload failed for user %s", user_id)

    # Send notification email
    resend_key = os.getenv("RESEND_API_KEY", "")
    logger.info("upgrade-request: sending email, resend_key_set=%s", bool(resend_key))
    if resend_key:
        screenshot_btn = (
            f'<p><a href="{screenshot_url}" style="display:inline-block;background:#D94F3D;'
            f'color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:600">'
            f'View Payment Screenshot</a></p>'
            if screenshot_url
            else "<p><em>Screenshot upload failed — check Supabase storage.</em></p>"
        )
        admin_secret_val = os.getenv("ADMIN_SECRET", "YOUR_ADMIN_SECRET")
        activation_cmd = (
            f"curl -X POST \"http://localhost:8000/admin/activate-pro"
            f"?user_id={user_id}&admin_secret={admin_secret_val}\""
        )
        html = f"""
<h2 style="color:#D94F3D">New Pro Upgrade Request</h2>
<table border="1" cellpadding="10" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif">
  <tr><td><strong>Name</strong></td><td>{name}</td></tr>
  <tr><td><strong>Folio account</strong></td><td>{user_email}</td></tr>
  <tr><td><strong>User ID</strong></td><td><code>{user_id}</code></td></tr>
  <tr><td><strong>Country</strong></td><td>{country}</td></tr>
  <tr><td><strong>Transfer method</strong></td><td>{transfer_method}</td></tr>
  <tr><td><strong>Transaction ref</strong></td><td><strong>{transaction_ref}</strong></td></tr>
  <tr><td><strong>Amount sent</strong></td><td>{amount_sent}</td></tr>
  <tr><td><strong>Notes</strong></td><td>{notes or "—"}</td></tr>
</table>
{screenshot_btn}
<hr>
<p><strong>To activate, run this curl:</strong></p>
<pre style="background:#f5f5f5;padding:12px;border-radius:4px">{activation_cmd}</pre>
"""
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {resend_key}"},
                    json={
                        "from": "Folio Upgrades <onboarding@resend.dev>",
                        "to": [ADMIN_EMAIL],
                        "subject": f"Pro Upgrade Request — {name} ({user_email})",
                        "html": html,
                    },
                )
                logger.info("upgrade-request: Resend status=%s body=%s", resp.status_code, resp.text)
                if resp.status_code not in (200, 201):
                    logger.error(
                        "upgrade-request: Resend rejected (HTTP %s): %s",
                        resp.status_code,
                        resp.text,
                    )
        except Exception:
            logger.exception("upgrade-request: exception calling Resend")

    return {
        "message": "Request received. We'll review your payment and activate your account within 24 hours."
    }


@app.post("/admin/test-email")
async def admin_test_email(request: Request, admin_secret: str):
    """Send a test email and return the raw Resend response — for debugging only."""
    if not ADMIN_SECRET or admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    resend_key = os.getenv("RESEND_API_KEY", "")
    if not resend_key:
        return {"error": "RESEND_API_KEY not set"}
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {resend_key}"},
            json={
                "from": "Folio Test <onboarding@resend.dev>",
                "to": [ADMIN_EMAIL],
                "subject": "Folio — test email",
                "html": "<p>If you see this, Resend is working correctly.</p>",
            },
        )
    return {"status": resp.status_code, "body": resp.json()}


@app.post("/admin/activate-pro")
async def admin_activate_pro(
    request: Request,
    user_id: str,
    admin_secret: str,
    days: int = 30,
):
    if not ADMIN_SECRET or admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    sb = get_supabase()
    period_end = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
    sb.table("subscriptions").upsert(
        {"user_id": user_id, "status": "active", "current_period_end": period_end}
    ).execute()
    cache_del(f"sub:{user_id}")
    return {"activated": user_id, "period_end": period_end, "days": days}


@app.post("/admin/revoke-pro")
async def admin_revoke_pro(request: Request, user_id: str, admin_secret: str):
    if not ADMIN_SECRET or admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    sb = get_supabase()
    sb.table("subscriptions").upsert(
        {"user_id": user_id, "status": "canceled"}
    ).execute()
    cache_del(f"sub:{user_id}")
    return {"revoked": user_id}
