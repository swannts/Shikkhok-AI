from collections.abc import AsyncIterator
from dataclasses import dataclass

from app.core.exceptions import ProviderTimeoutError, ProviderUnavailableError
from app.core.logging import logger
from app.providers.llm.base import LlmProvider, LlmTextDelta


@dataclass
class RoutedStreamResult:
    provider: str
    model: str
    fallback_used: bool
    stream: AsyncIterator[LlmTextDelta]


class ModelRouter:
    def __init__(self, primary: LlmProvider, fallback: LlmProvider | None = None) -> None:
        self.primary = primary
        self.fallback = fallback

    async def stream_chat(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1500,
    ) -> RoutedStreamResult:
        fallback_needed = False
        first_chunk: LlmTextDelta | None = None
        primary_iter: AsyncIterator[LlmTextDelta] | None = None

        try:
            primary_iter = self.primary.stream(
                messages, temperature=temperature, max_tokens=max_tokens
            )
            first_chunk = await anext(primary_iter)
        except (ProviderUnavailableError, ProviderTimeoutError) as err:
            logger.warning(
                f"Primary provider '{self.primary.name}' failed ({err}); evaluating fallback",
                extra={"extra_data": {"error": str(err)}},
            )
            if not self.fallback:
                raise
            fallback_needed = True
        except StopAsyncIteration:
            # Empty stream from primary
            first_chunk = None

        if fallback_needed and self.fallback:
            fallback_stream = self.fallback.stream(
                messages, temperature=temperature, max_tokens=max_tokens
            )
            return RoutedStreamResult(
                provider=self.fallback.name,
                model=self.fallback.model,
                fallback_used=True,
                stream=fallback_stream,
            )

        async def combined_stream() -> AsyncIterator[LlmTextDelta]:
            if first_chunk is not None:
                yield first_chunk
            if primary_iter is not None:
                async for chunk in primary_iter:
                    yield chunk

        return RoutedStreamResult(
            provider=self.primary.name,
            model=self.primary.model,
            fallback_used=False,
            stream=combined_stream(),
        )
