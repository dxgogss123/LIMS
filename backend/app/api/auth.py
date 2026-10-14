"""认证与登录接口。

- POST /api/auth/login          账号密码换 JWT
- GET  /api/auth/me             从 token 解析当前用户
- POST /api/auth/seed-admin     系统首次启动时初始化超级管理员账号
                                  （仅当账号表为空时生效，避免误覆盖）

账户数据复用通用 biz_record（collection=account），密码 hash 写入 data.password_hash。
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.base import not_deleted
from app.models.biz_record import BizRecord

router = APIRouter(prefix="/auth", tags=["auth"])


def _serialize(row: BizRecord) -> dict:
    return {"id": row.id, **row.data}


async def _find_account_by_username(db: AsyncSession, username: str) -> BizRecord | None:
    result = await db.execute(
        select(BizRecord).where(
            BizRecord.collection == "account",
            not_deleted(BizRecord),
        )
    )
    for row in result.scalars().all():
        if (row.data or {}).get("username") == username:
            return row
    return None


async def _account_count(db: AsyncSession) -> int:
    result = await db.execute(
        select(BizRecord).where(
            BizRecord.collection == "account",
            not_deleted(BizRecord),
        )
    )
    return len(result.scalars().all())


def _public_user(row: BizRecord) -> dict[str, Any]:
    data = row.data or {}
    return {
        "id": row.id,
        "username": data.get("username"),
        "name": data.get("name"),
        "roles": data.get("roles") or [],
        "permissions": data.get("permission_codes") or [],
        "status": data.get("status"),
    }


@router.post("/login")
async def login(payload: dict, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""
    if not username or not password:
        raise HTTPException(status_code=400, detail="请输入账号和密码")

    row = await _find_account_by_username(db, username)
    if row is None:
        raise HTTPException(status_code=401, detail="账号或密码错误")

    data = row.data or {}
    if data.get("status") == "disabled":
        raise HTTPException(status_code=403, detail="账号已被禁用")

    stored_hash = data.get("password_hash")
    if not stored_hash or not verify_password(password, stored_hash):
        raise HTTPException(status_code=401, detail="账号或密码错误")

    user = _public_user(row)
    token = create_access_token(
        subject=username,
        roles=user["roles"],
        permissions=user["permissions"],
        account_id=row.id,
    )
    return {"token": token, "user": user}


@router.get("/me")
async def me(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="未登录")
    token = authorization.split(" ", 1)[1].strip()
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="登录已失效，请重新登录")

    username = payload.get("sub")
    row = await _find_account_by_username(db, str(username))
    if row is None:
        raise HTTPException(status_code=401, detail="账号不存在")
    return {"user": _public_user(row)}


@router.post("/seed-admin")
async def seed_admin(
    payload: dict | None = None,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """系统首次启动时初始化超级管理员。

    - 仅当账号表为空时生效，避免误覆盖已有数据。
    - 默认凭证 admin / Admin@123；可在账号管理页修改。
    """
    payload = payload or {}
    username = (payload.get("username") or "admin").strip()
    password = payload.get("password") or "Admin@123"
    name = payload.get("name") or "系统管理员"

    if await _account_count(db) > 0:
        raise HTTPException(status_code=400, detail="系统已存在账户，拒绝初始化")

    row = BizRecord(
        collection="account",
        data={
            "username": username,
            "name": name,
            "email": "",
            "phone": "",
            "roles": ["超级管理员"],
            "permission_codes": [],  # 超级管理员由前端按角色透传，不落库
            "status": "enabled",
            "password_hash": hash_password(password),
        },
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return {"seeded": True, "username": username, "default_password": password}
