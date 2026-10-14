from datetime import date

from sqlalchemy import BigInteger, Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import BaseMixin
from app.models.enums import Status


class Sample(Base, BaseMixin):
    __tablename__ = "sample"

    project_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("project.id"), nullable=False
    )
    sample_no: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    spec: Mapped[str | None] = mapped_column(String(200))
    batch: Mapped[str | None] = mapped_column(String(100))
    receive_date: Mapped[date | None] = mapped_column(Date)
    condition: Mapped[str | None] = mapped_column(String(200))
    location: Mapped[str | None] = mapped_column(String(200))
    dispose_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(
        String(20), default=Status.draft.value, nullable=False
    )