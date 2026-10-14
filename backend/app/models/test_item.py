from datetime import date

from sqlalchemy import BigInteger, Date, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import BaseMixin
from app.models.enums import Judgement


class TestItem(Base, BaseMixin):
    __tablename__ = "test_item"

    project_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("project.id"), nullable=False
    )
    sample_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("sample.id")
    )
    item_name: Mapped[str] = mapped_column(String(200), nullable=False)
    standard_value: Mapped[str | None] = mapped_column(String(100))
    unit: Mapped[str | None] = mapped_column(String(50))
    upper_limit: Mapped[float | None] = mapped_column(Float)
    lower_limit: Mapped[float | None] = mapped_column(Float)
    result_value: Mapped[float | None] = mapped_column(Float)
    result_text: Mapped[str | None] = mapped_column(String(500))
    judgement: Mapped[str] = mapped_column(
        String(20), default=Judgement.pending.value, nullable=False
    )
    test_date: Mapped[date | None] = mapped_column(Date)
    tester_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("user.id")
    )
    remark: Mapped[str | None] = mapped_column(String(500))