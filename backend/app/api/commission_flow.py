"""委托流程 API：状态转换 / 看板聚合 / 时间线。"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.commission_flow import (
    ALL_STATUSES,
    STATUS_TIMESTAMP,
    TRANSITIONS,
    apply_transition,
    assert_can_transition,
    fetch_row,
    list_by_statuses,
)

router = APIRouter(prefix="/commission-flow", tags=["commission-flow"])


@router.post("/transition/{commission_id}")
async def transition_commission(
    commission_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    body = await request.json() if request.headers.get("content-length") else {}
    if not isinstance(body, dict):
        body = {}
    target = body.get("to_status")
    reason = body.get("reason")
    operator = body.get("operator")
    if not target:
        raise HTTPException(status_code=400, detail="缺少 to_status")

    row = await fetch_row(db, commission_id)
    current = (row.data or {}).get("status", "draft")
    assert_can_transition(current, target)
    new_data = apply_transition(row.data or {}, target, operator)
    if reason:
        new_data["last_transition_reason"] = reason
    row.data = new_data
    await db.commit()
    await db.refresh(row)
    return {"id": row.id, **row.data}


@router.get("/kanban")
async def kanban(db: AsyncSession = Depends(get_db)):
    rows = await list_by_statuses(db, ALL_STATUSES, limit=1000)
    buckets: dict[str, list] = {s: [] for s in ALL_STATUSES}
    for row in rows:
        d = row.data or {}
        st = d.get("status", "draft")
        buckets.setdefault(st, []).append({"id": row.id, **d})
    return {
        "counts": {st: len(items) for st, items in buckets.items()},
        "buckets": buckets,
    }


@router.get("/timeline/{commission_id}")
async def timeline(commission_id: int, db: AsyncSession = Depends(get_db)):
    row = await fetch_row(db, commission_id)
    d = row.data or {}
    steps = []
    for status, ts_field in STATUS_TIMESTAMP.items():
        ts = d.get(ts_field) if ts_field else None
        steps.append({"status": status, "time": ts})
    # 已驳回原因
    rejected_reason = d.get("last_transition_reason") if d.get("status") == "rejected" else None
    return {
        "id": row.id,
        "current": d.get("status"),
        "operator": d.get("updated_by"),
        "steps": steps,
        "rejected_reason": rejected_reason,
        "data": d,
    }


@router.get("/transitions")
async def list_transitions():
    """暴露状态机矩阵给前端，按钮可用性校验。"""
    return {
        "statuses": list(ALL_STATUSES),
        "transitions": TRANSITIONS,
        "timestamp_fields": STATUS_TIMESTAMP,
    }
