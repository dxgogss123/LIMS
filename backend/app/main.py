from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select

from app import models  # noqa: F401  确保所有模型注册到 Base.metadata
from app.api.auth import router as auth_router
from app.api.commission_flow import router as commission_flow_router
from app.api.entrust import router as entrust_router
from app.api.sample_flow import router as sample_flow_router
from app.api.store import router as store_router
from app.api.upload import router as upload_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import async_session_factory, engine
from app.models.base import not_deleted
from app.models.biz_record import BizRecord


async def _ensure_seed_admin() -> None:
    """首次启动时若 account 集合为空，创建一个默认超级管理员。"""
    async with async_session_factory() as session:
        result = await session.execute(
            select(BizRecord).where(
                BizRecord.collection == "account",
                not_deleted(BizRecord),
            )
        )
        if result.scalars().first() is not None:
            return
        from app.core.security import hash_password

        session.add(
            BizRecord(
                collection="account",
                data={
                    "username": "admin",
                    "name": "系统管理员",
                    "email": "",
                    "phone": "",
                    "roles": ["超级管理员"],
                    "permission_codes": [],
                    "status": "enabled",
                    "password_hash": hash_password("Admin@123"),
                },
            )
        )
        await session.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # 开发期：启动时补建缺失的表（如 biz_record），已存在的表不受影响。
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await _ensure_seed_admin()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """统一异常返回格式 {"code": ..., "msg": "..."}。"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.status_code, "msg": str(exc.detail)},
    )


app.include_router(entrust_router, prefix="/api")
app.include_router(store_router, prefix="/api")
app.include_router(upload_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(commission_flow_router, prefix="/api")
app.include_router(sample_flow_router, prefix="/api")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}