import json
from collections.abc import AsyncIterator
from typing import Any

import httpx

from app.core.exceptions import ProviderTimeoutError, ProviderUnavailableError
from app.core.logging import logger
from app.providers.llm.base import LlmTextDelta


class GeminiLlmProvider:
    name: str = "gemini"
    model: str = "gemini-1.5-pro"

    def __init__(
        self, api_key: str, model: str = "gemini-1.5-pro", timeout_seconds: float = 20.0
    ) -> None:
        self.api_key = api_key
        self.model = model
        self.timeout_seconds = timeout_seconds

    def _convert_messages(self, messages: list[dict[str, str]]) -> list[dict[str, Any]]:
        contents: list[dict[str, Any]] = []
        for msg in messages:
            role = "user" if msg["role"] in ("user", "system") else "model"
            contents.append(
                {
                    "role": role,
                    "parts": [{"text": msg["content"]}],
                }
            )
        return contents

    async def generate(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1500,
    ) -> str:
        if not self.api_key:
            raise ProviderUnavailableError("Gemini API key is not configured")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "contents": self._convert_messages(messages),
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.post(url, json=payload)
                if response.status_code != 200:
                    raise ProviderUnavailableError(
                        f"Gemini API returned status {response.status_code}",
                        details={"body": response.text[:200]},
                    )
                data = response.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return str(text)
        except httpx.TimeoutException:
            raise ProviderTimeoutError(
                f"Gemini API timed out after {self.timeout_seconds}s"
            ) from None
        except Exception as e:
            if isinstance(e, (ProviderUnavailableError, ProviderTimeoutError)):
                raise
            raise ProviderUnavailableError(f"Gemini error: {e}") from e

    async def stream(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1500,
    ) -> AsyncIterator[LlmTextDelta]:
        if not self.api_key:
            raise ProviderUnavailableError("Gemini API key is not configured")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:streamGenerateContent?alt=sse&key={self.api_key}"
        payload = {
            "contents": self._convert_messages(messages),
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                async with client.stream("POST", url, json=payload) as response:
                    if response.status_code != 200:
                        body_preview = await response.aread()
                        raise ProviderUnavailableError(
                            f"Gemini stream returned status {response.status_code}",
                            details={"body": body_preview.decode("utf-8", errors="ignore")[:200]},
                        )

                    async for line in response.aiter_lines():
                        line = line.strip()
                        if not line or not line.startswith("data:"):
                            continue

                        data_str = line[len("data:") :].strip()
                        if data_str == "[DONE]":
                            break

                        try:
                            chunk = json.loads(data_str)
                            candidates = chunk.get("candidates", [])
                            if candidates:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                for part in parts:
                                    text = part.get("text", "")
                                    if text:
                                        yield LlmTextDelta(text=text)
                        except Exception as parse_err:
                            logger.warning(f"Error parsing Gemini SSE line: {parse_err}")
        except httpx.TimeoutException:
            raise ProviderTimeoutError(
                f"Gemini streaming timed out after {self.timeout_seconds}s"
            ) from None
        except Exception as e:
            if isinstance(e, (ProviderUnavailableError, ProviderTimeoutError)):
                raise
            raise ProviderUnavailableError(f"Gemini streaming failed: {e}") from e
