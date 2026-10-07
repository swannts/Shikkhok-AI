import json

import httpx
import pytest

from app.core.exceptions import ProviderTimeoutError, ProviderUnavailableError
from app.providers.llm.huggingface import HuggingFaceLlmProvider


def make_provider(handler) -> tuple[HuggingFaceLlmProvider, httpx.AsyncClient]:
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    provider = HuggingFaceLlmProvider(
        api_key="test-hf-token",
        model="Qwen/Qwen2.5-7B-Instruct-1M:fastest",
        client=client,
    )
    return provider, client


@pytest.mark.asyncio
async def test_generate_uses_huggingface_openai_compatible_payload() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert str(request.url) == HuggingFaceLlmProvider.endpoint
        assert request.headers["Authorization"] == "Bearer test-hf-token"
        payload = json.loads(request.content)
        assert payload["model"] == "Qwen/Qwen2.5-7B-Instruct-1M:fastest"
        assert payload["messages"] == [{"role": "user", "content": "Explain addition in Bangla"}]
        assert payload["max_tokens"] == 120
        assert payload["stream"] is False
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": "যোগ মানে একত্র করা।"}}]},
        )

    provider, client = make_provider(handler)
    try:
        result = await provider.generate(
            [{"role": "user", "content": "Explain addition in Bangla"}], max_tokens=120
        )
        assert result == "যোগ মানে একত্র করা।"
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_stream_parses_openai_sse_deltas_and_done_marker() -> None:
    body = (
        'data: {"choices":[{"delta":{"content":"শিক্ষা "}}]}\n\n'
        'data: {"choices":[{"delta":{"content":"সহজ।"}}]}\n\n'
        "data: [DONE]\n\n"
    )
    provider, client = make_provider(
        lambda _request: httpx.Response(
            200,
            headers={"content-type": "text/event-stream"},
            content=body,
        )
    )
    try:
        deltas = [
            delta.text async for delta in provider.stream([{"role": "user", "content": "প্রশ্ন"}])
        ]
        assert deltas == ["শিক্ষা ", "সহজ।"]
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_provider_http_error_does_not_expose_response_body_or_token() -> None:
    provider, client = make_provider(
        lambda _request: httpx.Response(503, text="sensitive provider response")
    )
    try:
        with pytest.raises(ProviderUnavailableError) as error:
            await provider.generate([{"role": "user", "content": "প্রশ্ন"}])
        assert error.value.details == {"status": 503}
        assert "sensitive provider response" not in str(error.value)
        assert "test-hf-token" not in str(error.value)
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_provider_timeout_maps_to_domain_timeout() -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("timeout")

    provider, client = make_provider(handler)
    try:
        with pytest.raises(ProviderTimeoutError):
            await provider.generate([{"role": "user", "content": "প্রশ্ন"}])
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_malformed_sse_event_is_rejected() -> None:
    provider, client = make_provider(
        lambda _request: httpx.Response(
            200,
            headers={"content-type": "text/event-stream"},
            content="data: {not-json}\n\n",
        )
    )
    try:
        with pytest.raises(ProviderUnavailableError, match="malformed stream event"):
            _ = [delta async for delta in provider.stream([{"role": "user", "content": "প্রশ্ন"}])]
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_stream_provider_error_is_rejected_without_echoing_payload() -> None:
    provider, client = make_provider(
        lambda _request: httpx.Response(
            200,
            headers={"content-type": "text/event-stream"},
            content='data: {"error":{"message":"private request details"}}\n\n',
        )
    )
    try:
        with pytest.raises(ProviderUnavailableError, match="provider error") as error:
            _ = [delta async for delta in provider.stream([{"role": "user", "content": "প্রশ্ন"}])]
        assert "private request details" not in str(error.value)
    finally:
        await client.aclose()
