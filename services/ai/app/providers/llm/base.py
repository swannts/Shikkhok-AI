from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Protocol, runtime_checkable


@dataclass
class LlmTextDelta:
    text: str


@dataclass
class LlmUsage:
    input_tokens: int
    output_tokens: int


@dataclass
class LlmFinish:
    reason: str


@runtime_checkable
class LlmProvider(Protocol):
    name: str
    model: str

    async def generate(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1500,
    ) -> str:
        """Generates a complete non-streamed response."""
        ...

    def stream(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1500,
    ) -> AsyncIterator[LlmTextDelta]:
        """Streams text chunks progressively."""
        ...
