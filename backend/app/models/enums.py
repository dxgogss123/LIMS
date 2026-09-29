"""业务枚举。

字段在数据库中均以字符串存储（VARCHAR），保证 SQLite / MySQL 8.4
两边行为一致，避免方言级 ENUM 类型差异。模型字段类型用 Mapped[str]，
取值使用对应枚举的 .value。
"""
from enum import Enum


class Role(str, Enum):
    admin = "admin"
    tester = "tester"
    viewer = "viewer"


class DataScope(str, Enum):
    all = "all"
    self = "self"


class Status(str, Enum):
    """通用状态：草稿 / 进行中 / 已完成 / 已归档。"""

    draft = "draft"
    in_progress = "in_progress"
    completed = "completed"
    archived = "archived"


class Judgement(str, Enum):
    pass_ = "pass"
    fail = "fail"
    pending = "pending"


class StorageType(str, Enum):
    local = "local"
    cos = "cos"


class TargetType(str, Enum):
    project = "project"
    sample = "sample"
    test_item = "test_item"


class ReportStatus(str, Enum):
    draft = "draft"
    completed = "completed"
    archived = "archived"