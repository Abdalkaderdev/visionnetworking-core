from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(_ENV_FILE), env_file_encoding="utf-8")

    database_url: str
    test_database_url: str = ""
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    s3_endpoint_url: str = ""
    s3_access_key: str = ""
    s3_secret_key: str = ""
    s3_bucket_boq: str = "boq-uploads"
    s3_bucket_quotations: str = "quotation-pdfs"
    s3_bucket_proposals: str = "proposal-pdfs"
    s3_bucket_assets: str = "brand-assets"

    @field_validator("secret_key")
    @classmethod
    def secret_key_min_length(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters")
        return v

settings = Settings()
