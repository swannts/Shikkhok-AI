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
    with pytest.raises(RuntimeError, match="Mock LLM provider is strictly forbidden"):
        settings.validate_runtime_safety()


def test_production_rejects_mock_embeddings():
    settings = Settings(
        app_env="production",
        llm_provider="gemini",
        llm_api_key="valid-key",
        embedding_provider="mock",
        internal_service_secret="a" * 32,
    )
    with pytest.raises(RuntimeError, match="Mock embedding provider is strictly forbidden"):
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
