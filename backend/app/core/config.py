from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "LIMS"
    debug: bool = True

    # 数据库连接串（开发期 SQLite，后期切 MySQL）
    database_url: str = "sqlite+aiosqlite:///./data/lims.db"

    # 文件上传目录
    upload_dir: str = "/data/uploads"

    # 业务数据根目录：按「委托人-试验编码/检测项目」组织存放数据文件
    data_dir: str = "./data/storage"

    # 安全密钥
    secret_key: str = "change-me-to-a-random-secret"

    # CORS 允许来源（逗号分隔）
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()