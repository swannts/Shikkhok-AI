from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # General Application
    app_env: Literal["development", "staging", "production", "test"] = "development"
    app_name: str = "shikkhok-ai-service"
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False

    # Security & Internal Service HMAC Authentication
    internal_service_secret: str = Field(
        default="dev-internal-ai-service-secret-at-least-32chars",
        description="Shared secret for NestJS-to-FastAPI HMAC request signing",
    )
    allowed_service_names: list[str] = Field(
        default=["nestjs-backend", "shikkhok-api"],
        description="Allowed caller service names",
    )
    allowed_clock_skew_seconds: int = Field(
        default=300,
        description="Maximum allowed timestamp drift (seconds) to prevent replay attacks",
    )

    # NestJS Backend URL
    nest_api_base_url: str = "http://localhost:4000/api/v1"

    # Redis Cache & Broker (Optional)
    redis_url: str = "redis://localhost:6379"
    redis_enabled: bool = False

    # LLM Settings
    llm_provider: Literal["gemini", "openai", "mock"] = "gemini"
    llm_api_key: str = ""
    llm_model: str = "gemini-1.5-pro"
    llm_fallback_provider: Literal["gemini", "openai", "mock", "none"] = "mock"
    llm_fallback_model: str = "mock-tutor-fallback"

    # Embeddings
    embedding_provider: Literal["gemini", "openai", "mock"] = "mock"
    embedding_api_key: str = ""
    embedding_model: str = "text-embedding-004"

    # Vector Store
    vector_store_provider: Literal["memory", "persistent", "qdrant", "atlas"] = "persistent"
    vector_store_path: str = "data/vector_store/curriculum_chunks.json"
    vector_store_url: str = "http://localhost:6333"
    vector_store_api_key: str = ""

    # Timeouts
    request_timeout_seconds: float = 30.0
    llm_timeout_seconds: float = 20.0


settings = Settings()
