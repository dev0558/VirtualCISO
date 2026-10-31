from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[3]  # repo checkout; Docker sets SEED_DIR


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(REPO_ROOT / ".env",), extra="ignore")

    env: str = "development"
    # Runtime connection uses the non-owner role so RLS applies. Migrations use the owner URL.
    database_url: str = "postgresql+psycopg://vciso_app:change-me@localhost:5432/vciso"
    migration_database_url: str = "postgresql+psycopg://vciso:change-me@localhost:5432/vciso"
    redis_url: str = "redis://localhost:6379/0"

    secret_key: str = Field(default="dev-only-change-me-dev-only-change-me", min_length=32)
    credentials_encryption_key: str = ""  # Fernet key; required outside development
    session_hours: int = 12
    cookie_secure: bool = False

    s3_endpoint_url: str = "http://localhost:8333"
    s3_access_key: str = ""
    s3_secret_key: str = ""
    s3_bucket: str = "vciso-evidence"

    anthropic_api_key: str = ""
    anthropic_model: str = "claude-opus-5-5"
    voyage_api_key: str = ""

    public_app_url: str = "http://localhost:3000"
    seed_dir: Path = REPO_ROOT / "seed"

    @property
    def is_dev(self) -> bool:
        return self.env in ("development", "test")


@lru_cache
def get_settings() -> Settings:
    return Settings()
