from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import BaseMixin


class ReportTemplate(Base, BaseMixin):
    __tablename__ = "report_template"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    docx_path: Mapped[str | None] = mapped_column(String(500))
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)