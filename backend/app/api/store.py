"""通用业务数据 CRUD 接口。

路径：/api/store/{collection}
- GET    /api/store/{collection}              分页列表（支持 keyword / 任意字段过滤 / 排序）
- GET    /api/store/{collection}/{record_id}  单条
- POST   /api/store/{collection}              新增
- PUT    /api/store/{collection}/{record_id}  更新
- DELETE /api/store/{collection}/{record_id}  软删除
- POST   /api/store/{collection}/batch-delete 批量软删除

返回值为与前端 mock 一致的“裸”数据结构（列表返回 {items,total,page,page_size}，
单条返回对象本身），便于前端 api 模块直接使用。
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.base import not_deleted
from app.models.biz_record import BizRecord
from app.services.storage import ensure_commission_dirs

router = APIRouter(prefix="/store", tags=["store"])

_RESERVED = {"page", "page_size", "keyword", "sort_by", "order"}


def _serialize(row: BizRecord) -> dict:
    return {"id": row.id, **row.data}


def _sort_key(value):
    if value is None:
        return (0, 0.0, "")
    if isinstance(value, bool):
        return (1, float(value), "")
    if isinstance(value, (int, float)):
        return (1, float(value), "")
    text = str(value)
    try:
        return (1, float(text), "")
    except ValueError:
        return (2, 0.0, text)


async def _get_row(
    db: AsyncSession, collection: str, record_id: int
) -> BizRecord:
    row = await db.get(BizRecord, record_id)
    if row is None or row.deleted or row.collection != collection:
        raise HTTPException(status_code=400, detail="记录不存在")
    return row


async def _create_commission_storage(db: AsyncSession, data: dict) -> None:
    """新增委托单后，按「委托人-委托单号/检测项目」创建目录骨架。"""
    details = data.get("details") or []
    item_ids = [
        int(d["test_item_id"])
        for d in details
        if isinstance(d, dict) and d.get("test_item_id") is not None
    ]

    item_names: list[str] = []
    if item_ids:
        result = await db.execute(
            select(BizRecord).where(
                BizRecord.collection == "lab_test_item",
                BizRecord.id.in_(item_ids),
                not_deleted(BizRecord),
            )
        )
        seen: set[str] = set()
        for row in result.scalars().all():
            name = (row.data or {}).get("name")
            if name and str(name) not in seen:
                seen.add(str(name))
                item_names.append(str(name))

    ensure_commission_dirs(
        client_name=str(data.get("client_name") or ""),
        commission_no=str(data.get("commission_no") or ""),
        item_names=item_names,
    )


@router.get("/{collection}")
async def list_records(
    collection: str,
    request: Request,
    page: int = 1,
    page_size: int = 10,
    keyword: str | None = None,
    sort_by: str | None = None,
    order: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    page = max(page, 1)
    page_size = max(1, min(page_size, 1000))

    result = await db.execute(
        select(BizRecord)
        .where(BizRecord.collection == collection, not_deleted(BizRecord))
        .order_by(BizRecord.id.desc())
    )
    items = [_serialize(r) for r in result.scalars().all()]

    filters = {
        k: v
        for k, v in request.query_params.items()
        if k not in _RESERVED and v not in ("", None)
    }

    def keep(item: dict) -> bool:
        if keyword:
            kw = keyword.lower()
            if not any(
                kw in str(v).lower()
                for v in item.values()
                if v is not None and not isinstance(v, dict)
            ):
                return False
        for field, qv in filters.items():
            val = item.get(field)
            if val is None:
                return False
            if isinstance(val, (bool, int, float)):
                if str(val) != qv:
                    return False
            elif qv.lower() not in str(val).lower():
                return False
        return True

    filtered = [it for it in items if keep(it)]

    if sort_by:
        reverse = order == "desc"
        filtered.sort(key=lambda it: _sort_key(it.get(sort_by)), reverse=reverse)

    total = len(filtered)
    start = (page - 1) * page_size
    return {
        "items": filtered[start : start + page_size],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/{collection}")
async def create_record(
    collection: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="数据格式错误")
    data = {k: v for k, v in body.items() if k != "id"}
    row = BizRecord(collection=collection, data=data)
    db.add(row)
    await db.commit()
    await db.refresh(row)
    if collection == "commission":
        await _create_commission_storage(db, data)
    return _serialize(row)


@router.get("/{collection}/{record_id}")
async def get_record(
    collection: str,
    record_id: int,
    db: AsyncSession = Depends(get_db),
):
    row = await _get_row(db, collection, record_id)
    return _serialize(row)


@router.put("/{collection}/{record_id}")
async def update_record(
    collection: str,
    record_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    row = await _get_row(db, collection, record_id)
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="数据格式错误")
    row.data = {**row.data, **{k: v for k, v in body.items() if k != "id"}}
    await db.commit()
    await db.refresh(row)
    return _serialize(row)


@router.delete("/{collection}/{record_id}")
async def delete_record(
    collection: str,
    record_id: int,
    db: AsyncSession = Depends(get_db),
):
    row = await _get_row(db, collection, record_id)
    row.deleted = True
    await db.commit()
    return {"ok": True}


@router.post("/{collection}/batch-delete")
async def batch_delete_records(
    collection: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    body = await request.json()
    ids = body.get("ids") if isinstance(body, dict) else None
    if not isinstance(ids, list):
        raise HTTPException(status_code=400, detail="缺少 ids")
    for rid in ids:
        row = await db.get(BizRecord, rid)
        if row is not None and not row.deleted and row.collection == collection:
            row.deleted = True
    await db.commit()
    return {"ok": True}