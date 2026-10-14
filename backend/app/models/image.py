from datetime import date

from sqlalchemy import BigInteger, Date, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import BaseMixin
from app.models.enums import StorageType


class Image(Base, BaseMixin):
    __tablename__ = "image"

    origin_name: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mime: Mapped[str | None] = mapped_column(String(100))
    size: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    shot_date: Mapped[date | None] = mapped_column(Date)
    device: Mapped[str | None] = mapped_column(String(100))
    caption: Mapped[str | None] = mapped_column(String(500))
    storage_type: Mapped[str] = mapped_column(
        String(20), default=StorageType.local.value, nullable=False
    )