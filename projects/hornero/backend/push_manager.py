"""Backend Hornero — Push Notification Manager

Gestiona suscripciones Web Push con VAPID + SQLite.
Envía notificaciones push a todos los dispositivos suscritos
cuando hay un nuevo clipping disponible.
"""

import json
import os
import sqlite3
from datetime import datetime

from pywebpush import webpush, WebPushException

# ===== VAPID Config =====
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_SUBJECT = os.getenv("VAPID_SUBJECT", "mailto:hornero@federacion.org.ar")
VAPID_CLAIMS = {"sub": VAPID_SUBJECT}

# ===== SQLite DB =====
DB_PATH = os.path.join(os.path.dirname(__file__), "push_subscriptions.db")


def _get_db():
    """Get or create SQLite connection + table."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE IF NOT EXISTS subscriptions (
            endpoint TEXT PRIMARY KEY,
            keys_auth TEXT NOT NULL,
            keys_p256dh TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    conn.commit()
    return conn


def get_vapid_public_key():
    """Return the VAPID public key for the frontend."""
    return VAPID_PUBLIC_KEY


def subscribe(subscription: dict) -> bool:
    """Save a push subscription to the database.

    subscription: { endpoint: str, keys: { auth: str, p256dh: str } }
    """
    endpoint = subscription.get("endpoint", "")
    keys = subscription.get("keys", {})
    auth = keys.get("auth", "")
    p256dh = keys.get("p256dh", "")

    if not endpoint or not auth or not p256dh:
        return False

    now = datetime.now().isoformat()
    conn = _get_db()
    try:
        conn.execute("""
            INSERT INTO subscriptions (endpoint, keys_auth, keys_p256dh, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(endpoint) DO UPDATE SET
                keys_auth = excluded.keys_auth,
                keys_p256dh = excluded.keys_p256dh,
                updated_at = excluded.updated_at
        """, (endpoint, auth, p256dh, now, now))
        conn.commit()
        return True
    except Exception as e:
        print(f"Push subscribe error: {e}")
        return False
    finally:
        conn.close()


def unsubscribe(endpoint: str) -> bool:
    """Remove a push subscription from the database."""
    conn = _get_db()
    try:
        conn.execute("DELETE FROM subscriptions WHERE endpoint = ?", (endpoint,))
        conn.commit()
        return True
    except Exception as e:
        print(f"Push unsubscribe error: {e}")
        return False
    finally:
        conn.close()


def get_subscription_count() -> int:
    """Return the number of active subscriptions."""
    conn = _get_db()
    try:
        row = conn.execute("SELECT COUNT(*) as count FROM subscriptions").fetchone()
        return row["count"] if row else 0
    finally:
        conn.close()


def notify_all(title: str, body: str, data: dict = None) -> dict:
    """Send a push notification to all subscribed devices.

    Returns: { sent: int, failed: int, expired: int }
    """
    if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
        print("Push: VAPID keys not configured — skipping notification")
        return {"sent": 0, "failed": 0, "expired": 0, "error": "VAPID keys not configured"}

    conn = _get_db()
    rows = conn.execute("SELECT * FROM subscriptions").fetchall()
    conn.close()

    payload = json.dumps({
        "title": title,
        "body": body,
        "numero": data.get("numero", "") if data else "",
        "fecha": data.get("fecha", "") if data else "",
    })

    sent = 0
    failed = 0
    expired = 0

    for row in rows:
        subscription_info = {
            "endpoint": row["endpoint"],
            "keys": {
                "auth": row["keys_auth"],
                "p256dh": row["keys_p256dh"],
            },
        }
        try:
            webpush(
                subscription_info=subscription_info,
                data=payload,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS,
            )
            sent += 1
        except WebPushException as e:
            if e.response and e.response.status_code == 410:
                # Subscription expired — remove from DB
                expired += 1
                unsubscribe(row["endpoint"])
            else:
                failed += 1
                print(f"Push send failed for {row['endpoint'][:50]}...: {e}")
        except Exception as e:
            failed += 1
            print(f"Push send error: {e}")

    print(f"Push: sent={sent}, failed={failed}, expired={expired}")
    return {"sent": sent, "failed": failed, "expired": expired}


def cleanup_expired():
    """Remove subscriptions older than 30 days (likely expired)."""
    conn = _get_db()
    try:
        conn.execute("""
            DELETE FROM subscriptions
            WHERE updated_at < datetime('now', '-30 days')
        """)
        deleted = conn.total_changes
        conn.commit()
        return deleted
    finally:
        conn.close()
