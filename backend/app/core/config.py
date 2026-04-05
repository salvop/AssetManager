from pathlib import Path
from functools import lru_cache
import json

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]
ROOT_ENV_FILE = BASE_DIR.parent / ".env"
BACKEND_ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(str(BACKEND_ENV_FILE), str(ROOT_ENV_FILE)),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    project_name: str = Field(default="OpsAsset", alias="PROJECT_NAME")
    api_v1_prefix: str = Field(default="/api/v1", alias="API_V1_PREFIX")
    secret_key: str = Field(alias="SECRET_KEY")
    access_token_expire_minutes: int = Field(default=60, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    database_url: str = Field(alias="DATABASE_URL")
    document_storage_path: str = Field(default="/app/storage/documents", alias="DOCUMENT_STORAGE_PATH")
    backend_cors_origins: list[str] | str = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"],
        alias="BACKEND_CORS_ORIGINS",
    )
    notification_email_enabled: bool = Field(default=False, alias="NOTIFICATION_EMAIL_ENABLED")
    smtp_host: str | None = Field(default=None, alias="SMTP_HOST")
    smtp_port: int = Field(default=587, alias="SMTP_PORT")
    smtp_username: str | None = Field(default=None, alias="SMTP_USERNAME")
    smtp_password: str | None = Field(default=None, alias="SMTP_PASSWORD")
    smtp_from_email: str | None = Field(default=None, alias="SMTP_FROM_EMAIL")
    smtp_from_name: str = Field(default="OpsAsset", alias="SMTP_FROM_NAME")
    smtp_use_starttls: bool = Field(default=True, alias="SMTP_USE_STARTTLS")
    smtp_use_ssl: bool = Field(default=False, alias="SMTP_USE_SSL")
    notification_default_recipients: list[str] | str = Field(
        default_factory=list,
        alias="NOTIFICATION_DEFAULT_RECIPIENTS",
    )

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def parse_cors(cls, value: list[str] | str) -> list[str]:
        def normalize(items: list[str]) -> list[str]:
            normalized_items: list[str] = []
            for item in items:
                cleaned = item.strip().strip("\"'").rstrip("/")
                if cleaned:
                    normalized_items.append(cleaned)
            # Deduplicate while preserving order.
            return list(dict.fromkeys(normalized_items))

        if isinstance(value, str):
            text_value = value.strip()
            if text_value.startswith("["):
                try:
                    parsed = json.loads(text_value)
                    if isinstance(parsed, list):
                        return normalize([str(item) for item in parsed])
                except json.JSONDecodeError:
                    pass
            parsed_from_csv = normalize(text_value.split(","))
            if parsed_from_csv:
                return parsed_from_csv
            return ["http://localhost:5173", "http://127.0.0.1:5173"]
        parsed_list = normalize([str(item) for item in value])
        if parsed_list:
            return parsed_list
        return ["http://localhost:5173", "http://127.0.0.1:5173"]

    @field_validator("notification_default_recipients", mode="before")
    @classmethod
    def parse_recipients(cls, value: list[str] | str) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
