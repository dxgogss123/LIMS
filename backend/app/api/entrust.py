from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.base import not_deleted
from app.models.entrust import Entrust, generate_entrust_no
from app.schemas.entrust import EntrustCreate, EntrustOut, EntrustUpdate

router = APIRouter(prefix="/entrust", tags=["entrust"])


def _to_out(entrust: Entrust) -> dict:
    return EntrustOut.model_validate(entrust).model_dump(mode="json")


async def _get_or_404(db: AsyncSession, entrust_id: int) -> Entrust:
    entrust = await db.get(Entrust, entrust_id)
    if entrust is None or entrust.deleted:
        raise HTTPException(status_code=400, detail="委托单不存在")
    return entrust


@router.get("")
async def list_entrusts(
    page: int = 1,
    page_size: int = 10,
    keyword: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """分页列表，按创建时间倒序，自动过滤已软删除记录。"""
    page = max(page, 1)
    page_size = 10 if not (1 <= page_size <= 100) else page_size

    conditions = [not_deleted(Entrust)]
    if keyword:
        like = f"%{keyword}%"
        conditions.append(
            (Entrust.name.like(like)) | (Entrust.client.like(like))
        )

    total = await db.scalar(
        select(func.count()).select_from(Entrust).where(*conditions)
    ) or 0

    stmt = (
        select(Entrust)
        .where(*conditions)
        .order_by(Entrust.created_at.desc(), Entrust.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    items = result.scalars().all()

    return {
        "code": 0,
        "msg": "ok",
        "data": {
            "items": [_to_out(i) for i in items],
            "total": total,
            "page": page,
            "page_size": page_size,
        },
    }


@router.get("/{entrust_id}")
async def get_entrust(
    entrust_id: int, db: AsyncSession = Depends(get_db)
):
    entrust = await _get_or_404(db, entrust_id)
    return {"code": 0, "msg": "ok", "data": _to_out(entrust)}


@router.post("")
async def create_entrust(
    payload: EntrustCreate, db: AsyncSession = Depends(get_db)
):
    """创建委托单，project_no 自动生成，status 默认 draft（草稿）。"""
    entrust = Entrust(**payload.model_dump())

    year = datetime.now().year
    prefix = f"LAB{year}-"
    max_no = await db.scalar(
        select(func.max(Entrust.project_no)).where(
            Entrust.project_no.like(f"{prefix}%")
        )
    )
    seq = int(max_no.split("-")[1]) + 1 if max_no else 1
    entrust.project_no = generate_entrust_no(year, seq)

    db.add(entrust)
    await db.commit()
    await db.refresh(entrust)
    return {"code": 0, "msg": "ok", "data": _to_out(entrust)}


@router.put("/{entrust_id}")
async def update_entrust(
    entrust_id: int,
    payload: EntrustUpdate,
    db: AsyncSession = Depends(get_db),
):
    entrust = await _get_or_404(db, entrust_id)
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(entrust, key, value)
    await db.commit()
    await db.refresh(entrust)
    return {"code": 0, "msg": "ok", "data": _to_out(entrust)}


@router.delete("/{entrust_id}")
async def delete_entrust(
    entrust_id: int, db: AsyncSession = Depends(get_db)
):
    """软删除：仅置 deleted=True，其余字段不变。"""
    entrust = await _get_or_404(db, entrust_id)
    entrust.deleted = True
    await db.commit()
    return {"code": 0, "msg": "ok", "data": None}