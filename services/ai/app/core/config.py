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
    allow_mock_providers: bool = Field(
        default=False,
        description="Explicit flag required to use mock providers in development",
    )

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
    llm_fallback_provider: Literal["gemini", "openai", "none"] = "none"
    llm_fallback_model: str = ""
    llm_fallback_api_key: str = ""

    # Embeddings
    embedding_provider: Literal["gemini", "openai", "mock"] = "gemini"
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

    def validate_runtime_safety(self) -> None:
        """Validates configuration safety. Rejects mock providers and weak secrets in production."""
        is_production = self.app_env == "production"
        is_staging = self.app_env == "staging"

        if is_production or is_staging:
            # 1. Reject mock LLM
            if self.llm_provider == "mock":
                raise RuntimeError(
                    f"CRITICAL: Mock LLM provider is strictly forbidden in {self.app_env} environment."
                )
            if not self.llm_api_key:
                raise RuntimeError(
                    f"CRITICAL: Real LLM provider '{self.llm_provider}' requires LLM_API_KEY in {self.app_env}."
                )

            # 2. Reject mock embeddings
            if self.embedding_provider == "mock":
                raise RuntimeError(
                    f"CRITICAL: Mock embedding provider is strictly forbidden in {self.app_env} environment."
                )
            effective_embed_key = self.embedding_api_key or self.llm_api_key
            if not effective_embed_key:
                raise RuntimeError(
                    f"CRITICAL: Embedding provider '{self.embedding_provider}' requires an API key in {self.app_env}."
                )

            # 3. Reject weak or default secret
            if (
                len(self.internal_service_secret) < 32
                or "dev-internal" in self.internal_service_secret
            ):
                raise RuntimeError(
                    f"CRITICAL: INTERNAL_SERVICE_SECRET must be at least 32 random characters and not a development default in {self.app_env}."
                )
        elif self.app_env == "development":
            # In development, mock is only allowed if explicit flag is set or key is provided
            if self.llm_provider == "mock" and not self.allow_mock_providers:
                # Warning or opt-in
                pass


settings = Settings()
