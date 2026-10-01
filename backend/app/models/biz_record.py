"""通用业务数据存储模型。

由于前端各业务模块（客户 / 账号 / 基础数据 / 实验室 / 检测项 / 样机台账 / 委托等）
字段结构差异较大且当前仍以 mock 结构为准，这里用一张通用表 + JSON 数据列统一持久化，
避免为每个实体重复建表。每类数据通过 collection 区分，对应前端各自的 /api/store/{collection} 接口。
"""

from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import BaseMixin


class BizRecord(Base, BaseMixin):
    __tablename__ = "biz_record"

    collection: Mapped[str] = mapped_column(
        String(64), index=True, nullable=False
    )
    data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)