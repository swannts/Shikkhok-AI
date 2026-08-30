from typing import Any

import httpx

from app.core.exceptions import ProviderTimeoutError, ProviderUnavailableError


class GeminiEmbeddingProvider:
    name: str = "gemini"
    dimension: int = 768

    def __init__(
        self,
        api_key: str,
        model: str = "text-embedding-004",
        timeout_seconds: float = 15.0,
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

    async def embed_query(self, text: str) -> list[float]:
        """Generates embedding for a single search query."""
        if not self.api_key:
            raise ProviderUnavailableError("Gemini API key is required for embeddings")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:embedContent?key={self.api_key}"
        payload = {
            "model": f"models/{self.model}",
            "content": {"parts": [{"text": text}]},
        }

        client = await self._get_client()
        should_close = client is not self._client

        try:
            res = await client.post(url, json=payload)
            if res.status_code != 200:
                raise ProviderUnavailableError(
                    f"Gemini embedding API returned status {res.status_code}",
                    details={"body": res.text[:200]},
                )
            data = res.json()
            values: list[float] = data.get("embedding", {}).get("values", [])
            if not values:
                raise ProviderUnavailableError("Gemini returned empty embedding vector")
            return values
        except httpx.TimeoutException:
            raise ProviderTimeoutError(
                f"Gemini embedding timed out after {self.timeout_seconds}s"
            ) from None
        except Exception as e:
            if isinstance(e, (ProviderUnavailableError, ProviderTimeoutError)):
                raise
            raise ProviderUnavailableError(f"Gemini embedding error: {e}") from e
        finally:
            if should_close:
                await client.aclose()

    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Generates embedding vectors for a batch of documents."""
        if not texts:
            return []
        if not self.api_key:
            raise ProviderUnavailableError("Gemini API key is required for embeddings")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:batchEmbedContents?key={self.api_key}"
        requests_payload: list[dict[str, Any]] = [
            {
                "model": f"models/{self.model}",
                "content": {"parts": [{"text": t}]},
            }
            for t in texts
        ]

        client = await self._get_client()
        should_close = client is not self._client

        try:
            res = await client.post(url, json={"requests": requests_payload})
            if res.status_code != 200:
                raise ProviderUnavailableError(
                    f"Gemini batch embedding API returned status {res.status_code}",
                    details={"body": res.text[:200]},
                )
            data = res.json()
            embeddings: list[list[float]] = [
                item.get("values", []) for item in data.get("embeddings", [])
            ]
            if len(embeddings) != len(texts):
                raise ProviderUnavailableError(
                    f"Expected {len(texts)} embeddings, got {len(embeddings)}"
                )
            return embeddings
        except httpx.TimeoutException:
            raise ProviderTimeoutError(
                f"Gemini batch embedding timed out after {self.timeout_seconds}s"
            ) from None
        except Exception as e:
            if isinstance(e, (ProviderUnavailableError, ProviderTimeoutError)):
                raise
            raise ProviderUnavailableError(f"Gemini batch embedding error: {e}") from e
        finally:
            if should_close:
                await client.aclose()
