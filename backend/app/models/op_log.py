from sqlalchemy import BigInteger, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import BaseMixin


class OpLog(Base, BaseMixin):
    __tablename__ = "op_log"

    user_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("user.id"))
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    target_table: Mapped[str | None] = mapped_column(String(100))
    target_id: Mapped[int | None] = mapped_column(BigInteger)
    old_val: Mapped[str | None] = mapped_column(Text)
    new_val: Mapped[str | None] = mapped_column(Text)
    ip: Mapped[str | None] = mapped_column(String(50))