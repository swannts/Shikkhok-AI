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


def test_production_rejects_legacy_vector_fallback():
    settings = Settings(
        app_env="production",
        llm_provider="gemini",
        llm_api_key="valid-key",
        embedding_provider="gemini",
        embedding_api_key="valid-key",
        vector_store_allow_legacy_fallback=True,
        internal_service_secret="a" * 32,
    )

    with pytest.raises(RuntimeError, match="Legacy vector fallback is forbidden"):
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


def test_huggingface_primary_requires_a_server_token():
    settings = Settings(
        app_env="test",
        llm_provider="huggingface",
        hf_token="",
        embedding_provider="mock",
    )

    with pytest.raises(RuntimeError, match="requires HF_TOKEN"):
        settings.validate_runtime_safety()


def test_huggingface_fallback_requires_a_server_token():
    settings = Settings(
        app_env="test",
        allow_mock_providers=True,
        llm_provider="mock",
        embedding_provider="mock",
        llm_fallback_provider="huggingface",
        hf_token="",
    )

    with pytest.raises(RuntimeError, match="fallback requires HF_TOKEN"):
        settings.validate_runtime_safety()


@pytest.mark.asyncio
async def test_container_builds_huggingface_primary_and_fallback_providers():
    primary_settings = Settings(
        app_env="test",
        llm_provider="huggingface",
        hf_token="configured-test-token",
        huggingface_model="Qwen/test-model",
        embedding_provider="mock",
    )
    primary_container = build_service_container(primary_settings)
    try:
        assert primary_container.llm_provider.name == "huggingface"
        assert primary_container.llm_provider.model == "Qwen/test-model"
    finally:
        await primary_container.aclose()

    fallback_settings = Settings(
        app_env="test",
        allow_mock_providers=True,
        llm_provider="mock",
        embedding_provider="mock",
        llm_fallback_provider="huggingface",
        llm_fallback_model="Qwen/fallback-test-model",
        hf_token="configured-test-token",
    )
    fallback_container = build_service_container(fallback_settings)
    try:
        assert fallback_container.fallback_provider is not None
        assert fallback_container.fallback_provider.name == "huggingface"
        assert fallback_container.fallback_provider.model == "Qwen/fallback-test-model"
    finally:
        await fallback_container.aclose()


def test_production_requires_explicit_curriculum_configuration():
    settings = Settings(
        app_env="production",
        llm_provider="gemini",
        llm_api_key="valid-key",
        embedding_provider="gemini",
        embedding_api_key="valid-key",
        internal_service_secret="a" * 32,
    )

    with pytest.raises(RuntimeError, match="CURRICULUM_VERSION"):
        settings.validate_runtime_safety()


def test_production_accepts_valid_curriculum_configuration():
    settings = Settings(
        app_env="production",
        llm_provider="gemini",
        llm_api_key="valid-key",
        embedding_provider="gemini",
        embedding_api_key="valid-key",
        internal_service_secret="a" * 32,
        default_curriculum_version="2024-NCTB",
        default_curriculum_year=2026,
        default_academic_year=2026,
    )

    settings.validate_runtime_safety()
