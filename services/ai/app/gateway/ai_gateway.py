from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field

from app.core.logging import logger
from app.providers.llm.base import LlmFinish, LlmProvider, LlmTextDelta, LlmUsage
from app.services.model_router import ModelRouter, RoutedStreamResult


class GatewayStrategy(str, Enum):
    """Routing strategies for the AI gateway."""

    PRIMARY_FIRST = "primary_first"
    ROUND_ROBIN = "round_robin"
    LEAST_LATENCY = "least_latency"


@dataclass
class GatewayGenerateResult:
    text: str
    provider: str
    model: str
    fallback_used: bool
    usage: LlmUsage | None = None
    finish: LlmFinish | None = None


class AiGateway:
    """
    Future AI Gateway placeholder.

    Currently delegates to ModelRouter for primary/fallback routing.
    Designed to evolve into a multi-provider routing layer supporting
    strategies like round-robin, least-latency, and weighted distribution.
    """

    def __init__(
        self,
        model_router: ModelRouter,
        strategy: GatewayStrategy = GatewayStrategy.PRIMARY_FIRST,
        providers: dict[str, LlmProvider] | None = None,
    ) -> None:
        self._model_router = model_router
        self._strategy = strategy
        self._providers: dict[str, LlmProvider] = providers or {}
        self._rr_index = 0

    @property
    def strategy(self) -> GatewayStrategy:
        return self._strategy

    def register_provider(self, name: str, provider: LlmProvider) -> None:
        self._providers[name] = provider

    async def generate(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1500,
        provider_hint: str | None = None,
    ) -> GatewayGenerateResult:
        """
        Generates a non-streaming completion, routing through the configured strategy.

        Currently delegates to ModelRouter's primary/fallback logic.
        """
        text, fallback_used = await self._model_router.generate(
            messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        provider_name = (
            self._model_router.fallback.name if fallback_used and self._model_router.fallback
            else self._model_router.primary.name
        )
        model_name = (
            self._model_router.fallback.model if fallback_used and self._model_router.fallback
            else self._model_router.primary.model
        )
        return GatewayGenerateResult(
            text=text,
            provider=provider_name,
            model=model_name,
            fallback_used=fallback_used,
        )

    async def stream_chat(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1500,
        provider_hint: str | None = None,
    ) -> RoutedStreamResult:
        """
        Streams a chat completion, routing through the configured strategy.

        Currently delegates to ModelRouter's primary/fallback logic.
        """
        return await self._model_router.stream_chat(
            messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    def list_providers(self) -> list[str]:
        return list(self._providers.keys())

    def health_check(self) -> dict[str, Any]:
        """Returns a lightweight health summary of registered providers."""
        results: dict[str, Any] = {"strategy": self._strategy.value, "providers": {}}
        for name, provider in self._providers.items():
            results["providers"][name] = {
                "name": getattr(provider, "name", "unknown"),
                "model": getattr(provider, "model", "unknown"),
            }
        logger.debug("AiGateway health check performed", extra={"extra_data": results})
        return results


class GatewayRequest(BaseModel):
    """Future Pydantic schema for gateway-level routing requests."""

    messages: list[dict[str, str]] = Field(default_factory=list)
    temperature: float = Field(default=0.3, ge=0.0, le=2.0)
    max_tokens: int = Field(default=1500, ge=1)
    provider_hint: str | None = None
    strategy: GatewayStrategy = GatewayStrategy.PRIMARY_FIRST
    stream: bool = False
