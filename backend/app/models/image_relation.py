from sqlalchemy import BigInteger, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import BaseMixin


class ImageRelation(Base, BaseMixin):
    __tablename__ = "image_relation"
    __table_args__ = (
        UniqueConstraint(
            "image_id", "target_type", "target_id", name="uq_image_relation_target"
        ),
    )

    image_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("image.id"), nullable=False
    )
    target_type: Mapped[str] = mapped_column(String(20), nullable=False)
    target_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    sort_no: Mapped[int] = mapped_column(Integer, default=0, nullable=False)