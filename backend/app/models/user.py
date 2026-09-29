from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import BaseMixin
from app.models.enums import DataScope, Role


class User(Base, BaseMixin):
    __tablename__ = "user"

    username: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    real_name: Mapped[str] = mapped_column(String(50), default="", nullable=False)
    role: Mapped[str] = mapped_column(
        String(20), default=Role.viewer.value, nullable=False
    )
    data_scope: Mapped[str] = mapped_column(
        String(20), default=DataScope.self.value, nullable=False
    )
    disabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)