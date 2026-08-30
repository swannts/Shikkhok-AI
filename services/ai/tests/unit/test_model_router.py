import pytest

from app.core.exceptions import ProviderUnavailableError
from app.providers.llm.mock import MockLlmProvider
from app.services.model_router import ModelRouter


class FailingLlmProvider(MockLlmProvider):
    def __init__(self) -> None:
        super().__init__(name="failing-primary")

    def stream(self, messages, temperature=0.3, max_tokens=1500):
        raise ProviderUnavailableError("Simulated primary failure")


@pytest.mark.asyncio
async def test_model_router_uses_primary_when_available() -> None:
    primary = MockLlmProvider(name="mock-primary", model="primary-v1")
    fallback = MockLlmProvider(name="mock-fallback", model="fallback-v1")
    router = ModelRouter(primary=primary, fallback=fallback)

    result = await router.stream_chat([{"role": "user", "content": "Hello"}])

    assert result.provider == "mock-primary"
    assert result.model == "primary-v1"
    assert result.fallback_used is False

    chunks = [c.text async for c in result.stream]
    assert len(chunks) > 0


@pytest.mark.asyncio
async def test_model_router_switches_to_fallback_on_primary_failure() -> None:
    primary = FailingLlmProvider()
    fallback = MockLlmProvider(name="mock-fallback", model="fallback-v1")
    router = ModelRouter(primary=primary, fallback=fallback)

    result = await router.stream_chat([{"role": "user", "content": "Hello"}])

    assert result.provider == "mock-fallback"
    assert result.model == "fallback-v1"
    assert result.fallback_used is True

    chunks = [c.text async for c in result.stream]
    assert len(chunks) > 0
