from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class UserPreferencesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    language: str
    timezone: str
    date_format: str
    table_density: str
    default_page_size: int


class UserPreferencesUpdateRequest(BaseModel):
    language: str | None = Field(default=None, min_length=2, max_length=10)
    timezone: str | None = Field(default=None, min_length=3, max_length=64)
    date_format: Literal["DD/MM/YYYY", "YYYY-MM-DD", "MM/DD/YYYY"] | None = None
    table_density: Literal["compact", "comfortable"] | None = None
    default_page_size: int | None = Field(default=None, ge=10, le=200)

    @field_validator("language")
    @classmethod
    def validate_language(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            raise ValueError("Language cannot be blank")
        return normalized

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            raise ValueError("Timezone cannot be blank")
        return normalized


class AppSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    org_name: str
    default_asset_status_on_create_id: int
    max_document_size_mb: int
    allowed_document_mime_types: list[str]
    updated_by_user_id: int | None
    updated_at: datetime | None


class AppSettingsUpdateRequest(BaseModel):
    org_name: str | None = Field(default=None, min_length=1, max_length=120)
    default_asset_status_on_create_id: int | None = None
    max_document_size_mb: int | None = Field(default=None, ge=1, le=100)
    allowed_document_mime_types: list[str] | None = None

    @field_validator("org_name")
    @classmethod
    def validate_org_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            raise ValueError("Organization name cannot be blank")
        return normalized

    @field_validator("allowed_document_mime_types")
    @classmethod
    def validate_mime_types(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        normalized = [item.strip() for item in value if item and item.strip()]
        if not normalized:
            raise ValueError("At least one MIME type is required")
        invalid_values = [item for item in normalized if "/" not in item or " " in item]
        if invalid_values:
            raise ValueError(f"Invalid MIME type values: {', '.join(invalid_values)}")
        # Deduplicate while preserving order.
        deduplicated = list(dict.fromkeys(normalized))
        return deduplicated
