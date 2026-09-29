"""模型公共基建：BaseMixin 与软删除查询辅助。"""
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql.elements import ColumnElement


class BaseMixin:
    """所有业务表继承的公共字段。

    注意：SQLite 不支持带函数的 server_default（如 CURRENT_TIMESTAMP），
    因此时间字段统一用 Python 侧 default，保证 SQLite / MySQL 8.4 两边兼容。
    时间默认值统一使用 datetime.utcnow()。
    """

    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    created_by: Mapped[str] = mapped_column(
        String(50), default="", nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    updated_by: Mapped[str] = mapped_column(
        String(50), default="", nullable=False
    )
    deleted: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )


def not_deleted(model_cls) -> ColumnElement:
    """软删除过滤条件：deleted == False。

    所有查询应通过该条件自动过滤已软删除记录，例如：:

        from sqlalchemy import select
        stmt = select(User).where(not_deleted(User))
    """
    return model_cls.deleted.is_(False)