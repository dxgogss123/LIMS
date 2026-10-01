"""业务数据文件目录组织。

按「委托人姓名-委托单号 / 检测项目」两级目录存放数据文件：:

    数据根目录/
    ├── 李三-WT-20261001-0001/
    │   ├── 定频扫频/
    │   ├── 扫频应力/
    │   └── 随机振动/
    └── 张三-...

目录在新增委托单时自动创建骨架；后续上传的文件写入对应检测项目目录。
"""

import re
from pathlib import Path

from app.core.config import settings

# Windows/Linux 均非法的文件名字符（含控制字符）
_ILLEGAL = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


def sanitize_name(name: str, fallback: str = "未命名") -> str:
    """净化单个目录/文件名为合法的文件系统名称。"""
    text = _ILLEGAL.sub("_", (name or "").strip())
    text = text.rstrip(". ")
    return text or fallback


def commission_dir_path(client_name: str, commission_no: str) -> Path:
    """委托人-委托单号 目录，如 李三-WT-20261001-0001。"""
    base = sanitize_name(client_name, "未命名委托人")
    no = sanitize_name(commission_no, "未命名委托单")
    return Path(settings.data_dir) / f"{base}-{no}"


def item_dir_path(client_name: str, commission_no: str, item_name: str) -> Path:
    """检测项目 目录。"""
    return commission_dir_path(client_name, commission_no) / sanitize_name(item_name, "未命名项目")


def ensure_commission_dirs(
    client_name: str, commission_no: str, item_names: list[str]
) -> Path:
    """创建 委托人-委托单号 目录及其下各检测项目子目录，返回委托目录路径。"""
    root = commission_dir_path(client_name, commission_no)
    root.mkdir(parents=True, exist_ok=True)
    for name in item_names:
        item_dir_path(client_name, commission_no, name).mkdir(parents=True, exist_ok=True)
    return root