from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import BaseMixin
from app.models.enums import ReportStatus


class Report(Base, BaseMixin):
    __tablename__ = "report"

    project_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("project.id"), nullable=False
    )
    template_version: Mapped[str | None] = mapped_column(String(50))
    pdf_path: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(
        String(20), default=ReportStatus.draft.value, nullable=False
    )
    generated_at: Mapped[datetime | None] = mapped_column(DateTime)
    generated_by: Mapped[str] = mapped_column(String(50), default="", nullable=False)
    version_no: Mapped[str | None] = mapped_column(String(50))
    snapshot_json: Mapped[str | None] = mapped_column(Text)