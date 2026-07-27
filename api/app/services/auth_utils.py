"""
JWT creation/verification and bcrypt password hashing helpers.

Uses the `bcrypt` library directly (instead of passlib) to avoid the
passlib 1.7.4 / bcrypt 5.x incompatibility (detect_wrap_bug issue).

Swap SECRET_KEY to a real secret (env var) before any real deployment.
Algorithm: HS256 — simple and sufficient for a dev/demo service.
Token lifetime: 7 days (generous for a learning app, shorten in production).
"""
import os
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

# ---------------------------------------------------------------------------
# Config — override via env vars in production
# ---------------------------------------------------------------------------
SECRET_KEY = os.getenv("JWT_SECRET", "adaptivepath-dev-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# ---------------------------------------------------------------------------
# Password hashing — using bcrypt directly (passlib 1.7.4 incompatible with bcrypt 5.x)
# ---------------------------------------------------------------------------

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------
def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Returns decoded payload or None if token is invalid/expired."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
