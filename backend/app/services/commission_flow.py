"""委托流程状态机服务。

状态机（commission.data.status 取值）：
  draft     → received | rejected
  received  → testing  | rejected
  testing   → completed| rejected
  completed → outbound （测试完成后等待样机出库）
  outbound  → archived | rejected （样机出库后可归档/驳回）
  archived  → rejected （归档后只能驳回，相当于回退）
  rejected  → draft    （驳回可重新提交）

每次合法转换会自动写入对应的时间戳字段：
  draft 创建时已由前端/上游设置 created_at
  received_at / testing_at / completed_at / outbound_at / archived_at / rejected_at
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Iterable

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import not_deleted
from app.models.biz_record import BizRecord

ALL_STATUSES = (
    "draft",
    "received",
    "testing",
    "completed",
    "outbound",
    "archived",
    "rejected",
)

TRANSITIONS: dict[str, tuple[str, ...]] = {
    "draft": ("received", "rejected"),
    "received": ("testing", "rejected"),
    "testing": ("completed", "rejected"),
    "completed": ("outbound",),
    "outbound": ("archived", "rejected"),
    "archived": ("rejected",),
    "rejected": ("draft",),
}

STATUS_TIMESTAMP: dict[str, str] = {
    "received": "received_at",
    "testing": "testing_at",
    "completed": "completed_at",
    "outbound": "outbound_at",
    "archived": "archived_at",
    "rejected": "rejected_at",
    "draft": "created_at",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().replace(microsecond=0).isoformat()


def assert_can_transition(current: str, target: str) -> None:
    """校验状态转换是否合法；不合法抛出 HTTPException 400。"""
    if target not in ALL_STATUSES:
        raise HTTPException(status_code=400, detail=f"未知状态：{target}")
    if current == target:
        raise HTTPException(status_code=400, detail="状态未变化")
    allowed = TRANSITIONS.get(current, ())
    if target not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"不允许从 {current} 转换到 {target}",
        )


def apply_transition(data: dict, target: str, operator: str | None) -> dict:
    """根据目标状态写入时间戳 + 操作人字段，返回更新后的 data。"""
    updated = dict(data or {})
    updated["status"] = target
    updated["updated_at"] = now_iso()
    if operator:
        updated["updated_by"] = operator
    ts_field = STATUS_TIMESTAMP.get(target)
    if ts_field and not updated.get(ts_field):
        updated[ts_field] = now_iso()
    return updated


async def fetch_row(
    db: AsyncSession, commission_id: int
) -> BizRecord:
    row = await db.get(BizRecord, commission_id)
    if row is None or row.deleted or row.collection != "commission":
        raise HTTPException(status_code=404, detail="委托单不存在")
    return row


async def list_by_statuses(
    db: AsyncSession, statuses: Iterable[str], limit: int = 1000
) -> list[BizRecord]:
    """按状态过滤拉取 commission，按 id desc。"""
    result = await db.execute(
        select(BizRecord)
        .where(
            BizRecord.collection == "commission",
            not_deleted(BizRecord),
        )
        .order_by(BizRecord.id.desc())
        .limit(limit)
    )
    rows = result.scalars().all()
    wanted = set(statuses)
    return [r for r in rows if (r.data or {}).get("status") in wanted]
