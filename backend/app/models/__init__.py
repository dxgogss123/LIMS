"""模型汇总导入：确保 Alembic 能发现所有表结构。"""
from app.models.base import BaseMixin, not_deleted
from app.models.biz_record import BizRecord
from app.models.enums import (
    DataScope,
    Judgement,
    ReportStatus,
    Role,
    Status,
    StorageType,
    TargetType,
)
from app.models.image import Image
from app.models.image_relation import ImageRelation
from app.models.op_log import OpLog
from app.models.entrust import Entrust, generate_entrust_no
from app.models.report import Report
from app.models.report_template import ReportTemplate
from app.models.sample import Sample
from app.models.test_item import TestItem
from app.models.user import User

__all__ = [
    "BaseMixin",
    "not_deleted",
    "BizRecord",
    "DataScope",
    "Judgement",
    "ReportStatus",
    "Role",
    "Status",
    "StorageType",
    "TargetType",
    "Image",
    "ImageRelation",
    "OpLog",
    "Entrust",
    "generate_entrust_no",
    "Report",
    "ReportTemplate",
    "Sample",
    "TestItem",
    "User",
]