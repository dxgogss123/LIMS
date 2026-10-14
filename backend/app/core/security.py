"""密码哈希与 JWT 签发/校验。

- 密码使用 bcrypt（直接用 bcrypt 包，绕过 passlib 与新版 bcrypt 的兼容问题）。
- JWT 使用 python-jose HS256，载荷包含 sub(用户名)、roles、permissions、exp。
"""

from __future__ import annotations

import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

from app.core.config import settings

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 8 * 60  # 8 小时


def _to_bytes(password: str) -> bytes:
    # bcrypt 限制 72 字节，使用 sha256 摘要规避，同时避免长度截断带来的风险
    import hashlib

    return hashlib.sha256(password.encode("utf-8")).hexdigest().encode("ascii")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_to_bytes(password), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    if not hashed:
        return False
    try:
        return bcrypt.checkpw(_to_bytes(password), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(
    subject: str,
    *,
    roles: list[str] | None = None,
    permissions: list[str] | None = None,
    account_id: int | None = None,
    expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES,
) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expires_minutes)).timestamp()),
        "roles": roles or [],
        "permissions": permissions or [],
    }
    if account_id is not None:
        payload["aid"] = account_id
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return None
