"""文件上传接口。

文件写入按「委托人-委托单号/检测项目」组织的目录中：
- 提供 commission_no 时写入对应委托目录；再提供 item_name 时写入对应检测项目子目录。
- 未提供 commission_no 时写入数据根目录下的 _inbox 暂存目录。

路径：POST /api/upload（multipart/form-data，字段 file / client_name / commission_no / item_name）。
"""

import time
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.core.config import settings
from app.services.storage import (
    commission_dir_path,
    item_dir_path,
    sanitize_name,
)

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    client_name: str = Form(""),
    commission_no: str = Form(""),
    item_name: str = Form(""),
):
    content = await file.read()
    if not file.filename:
        raise HTTPException(status_code=400, detail="缺少文件名")

    if commission_no.strip():
        parent = (
            item_dir_path(client_name, commission_no, item_name)
            if item_name.strip()
            else commission_dir_path(client_name, commission_no)
        )
    else:
        parent = Path(settings.data_dir) / "_inbox"

    parent.mkdir(parents=True, exist_ok=True)
    filename = sanitize_name(file.filename, "file")
    dest = parent / filename
    if dest.exists():
        dest = parent / f"{dest.stem}_{int(time.time() * 1000)}{dest.suffix}"
    dest.write_bytes(content)

    return {"name": file.filename, "path": str(dest)}