from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

TutorGroundingMode = Literal["hybrid", "strict"]


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
    llm_provider: Literal["gemini", "mock"] = "gemini"
    llm_api_key: str = ""
    llm_model: str = "gemini-1.5-pro"
    llm_fallback_provider: Literal["gemini", "none"] = "none"
    llm_fallback_model: str = ""
    llm_fallback_api_key: str = ""

    # Embeddings
    embedding_provider: Literal["gemini", "mock"] = "gemini"
    embedding_api_key: str = ""
    embedding_model: str = "text-embedding-004"

    # Vector Store
    vector_store_provider: Literal["memory", "persistent"] = "persistent"
    vector_store_path: str = "data/vector_store/curriculum_chunks.json"
    vector_store_url: str = "http://localhost:6333"
    vector_store_api_key: str = ""
    vector_store_allow_demo_seed: bool = False

    # Timeouts
    request_timeout_seconds: float = 30.0
    llm_timeout_seconds: float = 20.0
    tutor_grounding_mode: TutorGroundingMode = "hybrid"

    @field_validator("debug", mode="before")
    @classmethod
    def parse_debug_flag(cls, value: bool | str) -> bool:
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "on", "debug"}:
                return True
            if normalized in {"0", "false", "no", "off", "release", "prod", "production"}:
                return False
        return bool(value)

    def mock_providers_allowed(self) -> bool:
        return self.app_env == "test" or (
            self.app_env == "development" and self.allow_mock_providers
        )

    def validate_runtime_safety(self) -> None:
        """Validates configuration safety. Rejects mock providers and weak secrets in production."""
        effective_embed_key = self.embedding_api_key or self.llm_api_key
        mock_allowed = self.mock_providers_allowed()

        if self.llm_provider == "mock" and not mock_allowed:
            raise RuntimeError(
                f"CRITICAL: Mock LLM provider requires explicit opt-in in {self.app_env}."
            )

        if self.embedding_provider == "mock" and not mock_allowed:
            raise RuntimeError(
                f"CRITICAL: Mock embedding provider requires explicit opt-in in {self.app_env}."
            )

        if self.llm_provider == "gemini" and not self.llm_api_key:
            raise RuntimeError(
                f"CRITICAL: Real LLM provider '{self.llm_provider}' requires LLM_API_KEY in {self.app_env}."
            )

        if self.embedding_provider == "gemini" and not effective_embed_key:
            raise RuntimeError(
                f"CRITICAL: Embedding provider '{self.embedding_provider}' requires an API key in {self.app_env}."
            )

        if self.llm_fallback_provider == "gemini" and not self.llm_fallback_api_key:
            raise RuntimeError(
                f"CRITICAL: Fallback LLM provider '{self.llm_fallback_provider}' requires LLM_FALLBACK_API_KEY in {self.app_env}."
            )

        if self.app_env in ("production", "staging") and (
            self.llm_provider == "mock" or self.embedding_provider == "mock"
        ):
            raise RuntimeError(
                f"CRITICAL: Mock providers are strictly forbidden in {self.app_env} environment."
            )

        if self.app_env in ("production", "staging") and (
            len(self.internal_service_secret) < 32 or "dev-internal" in self.internal_service_secret
        ):
            raise RuntimeError(
                f"CRITICAL: INTERNAL_SERVICE_SECRET must be at least 32 random characters and not a development default in {self.app_env}."
            )


settings = Settings()
