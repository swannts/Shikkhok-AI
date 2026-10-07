import json
from collections.abc import AsyncIterator

import httpx

from app.core.exceptions import ProviderTimeoutError, ProviderUnavailableError
from app.providers.llm.base import LlmTextDelta


class HuggingFaceLlmProvider:
    """Chat-completion provider for Hugging Face Inference Providers."""

    name = "huggingface"
    endpoint = "https://router.huggingface.co/v1/chat/completions"

    def __init__(
        self,
        api_key: str,
        model: str,
        timeout_seconds: float = 20.0,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.api_key = api_key
        self.model = model
        self.timeout_seconds = timeout_seconds
        self._client = client

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client and not self._client.is_closed:
            return self._client
        return httpx.AsyncClient(timeout=self.timeout_seconds)

    def _payload(
        self,
        messages: list[dict[str, str]],
        temperature: float,
        max_tokens: int,
        stream: bool,
    ) -> dict[str, object]:
        return {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream,
        }

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def generate(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1500,
    ) -> str:
        if not self.api_key:
            raise ProviderUnavailableError("Hugging Face token is not configured")

        client = await self._get_client()
        should_close = client is not self._client
        try:
            response = await client.post(
                self.endpoint,
                headers=self._headers(),
                json=self._payload(messages, temperature, max_tokens, stream=False),
            )
            if response.is_error:
                raise ProviderUnavailableError(
                    f"Hugging Face chat completion returned status {response.status_code}",
                    details={"status": response.status_code},
                )

            data = response.json()
            choices = data.get("choices") if isinstance(data, dict) else None
            if not isinstance(choices, list) or not choices or not isinstance(choices[0], dict):
                raise ProviderUnavailableError("Hugging Face returned an empty chat response")
            message = choices[0].get("message")
            content = message.get("content") if isinstance(message, dict) else None
            if not isinstance(content, str) or not content.strip():
                raise ProviderUnavailableError("Hugging Face returned an empty chat response")
            return content
        except httpx.TimeoutException:
            raise ProviderTimeoutError(
                f"Hugging Face request timed out after {self.timeout_seconds}s"
            ) from None
        except ProviderUnavailableError:
            raise
        except (httpx.HTTPError, json.JSONDecodeError, ValueError, TypeError) as exc:
            raise ProviderUnavailableError(
                f"Hugging Face request failed ({type(exc).__name__})"
            ) from None
        finally:
            if should_close:
                await client.aclose()

    async def stream(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1500,
    ) -> AsyncIterator[LlmTextDelta]:
        if not self.api_key:
            raise ProviderUnavailableError("Hugging Face token is not configured")

        client = await self._get_client()
        should_close = client is not self._client
        headers = self._headers()
        headers["Accept"] = "text/event-stream"
        try:
            async with client.stream(
                "POST",
                self.endpoint,
                headers=headers,
                json=self._payload(messages, temperature, max_tokens, stream=True),
            ) as response:
                if response.is_error:
                    raise ProviderUnavailableError(
                        f"Hugging Face chat stream returned status {response.status_code}",
                        details={"status": response.status_code},
                    )

                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line or line.startswith(":") or not line.startswith("data:"):
                        continue
                    data = line[5:].strip()
                    if data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                    except json.JSONDecodeError:
                        raise ProviderUnavailableError(
                            "Hugging Face returned a malformed stream event"
                        ) from None

                    if not isinstance(chunk, dict) or "error" in chunk:
                        raise ProviderUnavailableError(
                            "Hugging Face reported a stream provider error"
                        )
                    choices = chunk.get("choices")
                    if not isinstance(choices, list):
                        raise ProviderUnavailableError(
                            "Hugging Face returned a malformed stream event"
                        )
                    if not choices:
                        continue
                    choice = choices[0]
                    delta = choice.get("delta") if isinstance(choice, dict) else None
                    if not isinstance(delta, dict):
                        raise ProviderUnavailableError(
                            "Hugging Face returned a malformed stream event"
                        )
                    content = delta.get("content")
                    if isinstance(content, str) and content:
                        yield LlmTextDelta(text=content)
        except httpx.TimeoutException:
            raise ProviderTimeoutError(
                f"Hugging Face streaming timed out after {self.timeout_seconds}s"
            ) from None
        except ProviderUnavailableError:
            raise
        except httpx.HTTPError as exc:
            raise ProviderUnavailableError(
                f"Hugging Face streaming failed ({type(exc).__name__})"
            ) from None
        finally:
            if should_close:
                await client.aclose()
