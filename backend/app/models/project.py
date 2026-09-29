from datetime import date

from sqlalchemy import BigInteger, Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import BaseMixin
from app.models.enums import Status


def generate_project_no(year: int, seq: int) -> str:
    """生成项目编号：LAB + 年份(4位) + '-' + 4位流水号，如 LAB2026-0001。

    规则当前写死；后期改为可配置（编号前缀、分隔符、流水号长度等）。
    """
    return f"LAB{year:04d}-{seq:04d}"


class Project(Base, BaseMixin):
    __tablename__ = "project"

    project_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    client: Mapped[str | None] = mapped_column(String(200))
    method_std: Mapped[str | None] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(
        String(20), default=Status.draft.value, nullable=False
    )
    assignee_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("user.id")
    )
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    remark: Mapped[str | None] = mapped_column(String(500))