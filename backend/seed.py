"""后端数据库初始化脚本。

在 backend 目录下运行：
    python seed.py

作用：清空并重新写入基础种子数据（用户 / 委托单 / 样品 / 测试项目 / 操作日志），
使后端接口（如 /api/entrust）能返回真实数据。幂等：重复执行会先清空再写入。

默认用户名 / 密码：
    admin / 123456        （管理员）
    zhangwei / 123456     （测试员 张伟）
    lina / 123456         （测试员 李娜）
    wangqiang / 123456    （测试员 王强）
    zhaomin / 123456      （查看员 赵敏）
"""

import asyncio
import hashlib
import os
import sys
from datetime import date, datetime

from sqlalchemy import delete, func, select

from app.db.session import async_session_factory, engine
from app.models.entrust import Entrust
from app.models.enums import DataScope, Judgement, Role, Status
from app.models.op_log import OpLog
from app.models.sample import Sample
from app.models.test_item import TestItem
from app.models.user import User

DEFAULT_PASSWORD = "123456"


def hash_password(password: str) -> str:
    """生成 pbkdf2 口令散列（格式：pbkdf2_sha256$iterations$salt$hash）。"""
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return f"pbkdf2_sha256$100000${salt.hex()}${dk.hex()}"


# (username, real_name, role, data_scope)
USERS = [
    ("admin", "系统管理员", Role.admin.value, DataScope.all.value),
    ("zhangwei", "张伟", Role.tester.value, DataScope.self.value),
    ("lina", "李娜", Role.tester.value, DataScope.self.value),
    ("wangqiang", "王强", Role.tester.value, DataScope.self.value),
    ("zhaomin", "赵敏", Role.viewer.value, DataScope.self.value),
]

# (name, client, method_std, status, start_date, end_date, remark)
PROJECTS = [
    ("502C客厅机舒适性测试", "张伟", "GB/T 7725-2004", Status.completed.value,
     date(2026, 7, 1), date(2026, 7, 15), "首批额定工况测试"),
    ("503C挂机性能验证", "李娜", "GB/T 7725-2004", Status.in_progress.value,
     date(2026, 8, 3), None, "性能验证进行中"),
    ("601A柜机耐久性测试", "王强", "GB/T 19411-2003", Status.in_progress.value,
     date(2026, 8, 10), None, "耐久性循环测试"),
    ("702B风管机能效比对", "赵敏", "GB 12021.3-2010", Status.draft.value,
     None, None, "待排期"),
    ("805D多联机性能摸底", "张伟", "GB/T 18837-2002", Status.archived.value,
     date(2026, 6, 5), date(2026, 6, 30), "摸底测试已归档"),
    ("301H除湿机可靠性验证", "李娜", "GB/T 19411-2003", Status.completed.value,
     date(2026, 7, 20), date(2026, 8, 20), "可靠性验证完成"),
]

# 每个项目对应的样品定义：(sample_no, name, spec, batch, location, status)
SAMPLE_DEFS = [
    # 项目 1
    [
        ("SH2026-0001", "502C样机-01", "502C", "B2607001", "留样室", Status.completed.value),
        ("SH2026-0002", "502C样机-02", "502C", "B2607001", "留样室", Status.completed.value),
    ],
    # 项目 2
    [
        ("SH2026-0003", "503C样机-01", "503C", "B2608002", "环境室", Status.in_progress.value),
        ("SH2026-0004", "503C样机-02", "503C", "B2608002", "环境室", Status.in_progress.value),
    ],
    # 项目 3
    [
        ("SH2026-0005", "601A柜机-01", "601A", "B2608003", "耐久室", Status.in_progress.value),
    ],
    # 项目 4
    [
        ("SH2026-0006", "702B风管机-01", "702B", "B2609001", "待入库", Status.draft.value),
    ],
    # 项目 5
    [
        ("SH2026-0007", "805D多联机-01", "805D", "B2606004", "已处置", Status.archived.value),
    ],
    # 项目 6
    [
        ("SH2026-0008", "301H除湿机-01", "301H", "B2607005", "留样室", Status.completed.value),
        ("SH2026-0009", "301H除湿机-02", "301H", "B2607005", "留样室", Status.completed.value),
    ],
]

# 每个样品对应的测试项目定义
# (item_name, standard_value, unit, upper, lower, result_value, judgement, test_date)
TESTITEM_DEFS = {
    "SH2026-0001": [
        ("制冷量", "3500", "W", 3850.0, 3150.0, 3520.0, Judgement.pass_.value, date(2026, 7, 6)),
        ("能效比(EER)", "3.40", "-", 3.60, 3.10, 3.42, Judgement.pass_.value, date(2026, 7, 6)),
        ("噪声", "52", "dB(A)", 54.0, None, 51.5, Judgement.pass_.value, date(2026, 7, 6)),
    ],
    "SH2026-0002": [
        ("制冷量", "3500", "W", 3850.0, 3150.0, 3490.0, Judgement.pass_.value, date(2026, 7, 7)),
        ("能效比(EER)", "3.40", "-", 3.60, 3.10, 3.38, Judgement.pass_.value, date(2026, 7, 7)),
    ],
    "SH2026-0003": [
        ("制冷量", "3600", "W", 3960.0, 3240.0, 3580.0, Judgement.pass_.value, date(2026, 8, 5)),
        ("噪声", "50", "dB(A)", 52.0, None, None, Judgement.pending.value, None),
    ],
    "SH2026-0004": [
        ("制冷量", "3600", "W", 3960.0, 3240.0, None, Judgement.pending.value, None),
        ("能效比(EER)", "3.50", "-", 3.70, 3.20, None, Judgement.pending.value, None),
    ],
    "SH2026-0005": [
        ("耐久运行", "2000", "h", None, None, None, Judgement.pending.value, None),
    ],
    "SH2026-0008": [
        ("除湿量", "12", "L/D", 13.2, 10.8, 12.1, Judgement.pass_.value, date(2026, 7, 22)),
        ("噪声", "48", "dB(A)", 50.0, None, 47.8, Judgement.pass_.value, date(2026, 7, 22)),
    ],
    "SH2026-0009": [
        ("除湿量", "12", "L/D", 13.2, 10.8, 12.0, Judgement.pass_.value, date(2026, 7, 23)),
    ],
}


async def _count(session, model) -> int:
    return await session.scalar(select(func.count()).select_from(model)) or 0


async def seed() -> None:
    pwd_hash = hash_password(DEFAULT_PASSWORD)

    async with async_session_factory() as session:
        # ---- 清空（按外键依赖顺序）----
        for model in (TestItem, Sample, OpLog, Entrust, User):
            await session.execute(delete(model))
        await session.commit()

        # ---- 用户 ----
        users: dict[str, User] = {}
        for username, real_name, role, data_scope in USERS:
            u = User(
                username=username,
                password_hash=pwd_hash,
                real_name=real_name,
                role=role,
                data_scope=data_scope,
                disabled=False,
                created_by="seed",
                updated_by="seed",
            )
            session.add(u)
            users[username] = u
        await session.flush()

        # ---- 委托单 / 样品 / 测试项目 ----
        tester_ids = list(users.values())
        for idx, (name, client, method_std, status, start, end, remark) in enumerate(PROJECTS):
            project_no = f"LAB2026-{idx + 1:04d}"
            assignee = next((u for u in tester_ids if u.real_name == client), None)
            entrust = Entrust(
                project_no=project_no,
                name=name,
                client=client,
                method_std=method_std,
                status=status,
                assignee_id=assignee.id if assignee else None,
                start_date=start,
                end_date=end,
                remark=remark,
                created_by="seed",
                updated_by="seed",
            )
            session.add(entrust)
            await session.flush()

            for sample_no, sname, spec, batch, location, sstatus in SAMPLE_DEFS[idx]:
                sample = Sample(
                    project_id=entrust.id,
                    sample_no=sample_no,
                    name=sname,
                    spec=spec,
                    batch=batch,
                    receive_date=start,
                    location=location,
                    status=sstatus,
                    created_by="seed",
                    updated_by="seed",
                )
                session.add(sample)
                await session.flush()

                for (item_name, std_val, unit, upper, lower, result, judgement, tdate) in (
                    TESTITEM_DEFS.get(sample_no, [])
                ):
                    tester = next((u for u in tester_ids if u.role == Role.tester.value), None)
                    session.add(TestItem(
                        project_id=entrust.id,
                        sample_id=sample.id,
                        item_name=item_name,
                        standard_value=std_val,
                        unit=unit,
                        upper_limit=upper,
                        lower_limit=lower,
                        result_value=result,
                        judgement=judgement,
                        test_date=tdate,
                        tester_id=tester.id if tester else None,
                        created_by="seed",
                        updated_by="seed",
                    ))

        # ---- 操作日志 ----
        session.add(OpLog(
            user_id=users["admin"].id,
            action="初始化",
            target_table="project",
            target_id=None,
            ip="127.0.0.1",
            created_by="seed",
            updated_by="seed",
        ))

        await session.commit()

        # ---- 汇总 ----
        counts = {}
        for label, model in (
            ("用户", User),
            ("委托单", Entrust),
            ("样品", Sample),
            ("测试项目", TestItem),
            ("操作日志", OpLog),
        ):
            counts[label] = await _count(session, model)

        print("初始化完成：", counts)


async def clear() -> None:
    """仅清空后端数据库（不写入种子数据）。"""
    async with async_session_factory() as session:
        for model in (TestItem, Sample, OpLog, Entrust, User):
            await session.execute(delete(model))
        await session.commit()
    print("已清空数据库")


if __name__ == "__main__":
    clear_only = "--clear" in sys.argv
    try:
        asyncio.run(clear() if clear_only else seed())
    finally:
        asyncio.run(engine.dispose())