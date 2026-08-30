import pytest

from app.core.config import Settings
from app.core.container import build_service_container


def test_production_rejects_mock_llm():
    settings = Settings(
        app_env="production",
        llm_provider="mock",
        llm_api_key="valid-key",
        embedding_provider="gemini",
        embedding_api_key="valid-key",
        internal_service_secret="a" * 32,
    )
    with pytest.raises(RuntimeError, match="Mock LLM provider requires explicit opt-in"):
        settings.validate_runtime_safety()


def test_production_rejects_mock_embeddings():
    settings = Settings(
        app_env="production",
        llm_provider="gemini",
        llm_api_key="valid-key",
        embedding_provider="mock",
        internal_service_secret="a" * 32,
    )
    with pytest.raises(RuntimeError, match="Mock embedding provider requires explicit opt-in"):
        settings.validate_runtime_safety()


def test_production_rejects_weak_secret():
    settings = Settings(
        app_env="production",
        llm_provider="gemini",
        llm_api_key="valid-key",
        embedding_provider="gemini",
        embedding_api_key="valid-key",
        internal_service_secret="short",
    )
    with pytest.raises(RuntimeError, match="INTERNAL_SERVICE_SECRET must be at least 32"):
        settings.validate_runtime_safety()


def test_test_environment_allows_mock():
    settings = Settings(
        app_env="test",
        llm_provider="mock",
        embedding_provider="mock",
    )
    # Should not raise
    settings.validate_runtime_safety()
    container = build_service_container(settings)
    assert container.llm_provider.name == "mock-primary"


def test_development_rejects_mock_without_explicit_opt_in():
    settings = Settings(
        app_env="development",
        llm_provider="mock",
        embedding_provider="mock",
        internal_service_secret="a" * 32,
    )

    with pytest.raises(RuntimeError, match="requires explicit opt-in"):
        settings.validate_runtime_safety()


def test_development_rejects_missing_llm_key_without_silent_fallback():
    settings = Settings(
        app_env="development",
        llm_provider="gemini",
        llm_api_key="",
        embedding_provider="gemini",
        embedding_api_key="valid-embedding-key",
        internal_service_secret="a" * 32,
    )

    with pytest.raises(RuntimeError, match="requires LLM_API_KEY"):
        build_service_container(settings)


def test_development_rejects_missing_embedding_key_without_silent_fallback():
    settings = Settings(
        app_env="development",
        allow_mock_providers=True,
        llm_provider="mock",
        embedding_provider="gemini",
        embedding_api_key="",
        internal_service_secret="a" * 32,
    )

    with pytest.raises(RuntimeError, match="requires an API key"):
        build_service_container(settings)
