from typing import Protocol, runtime_checkable


@runtime_checkable
class EmbeddingProvider(Protocol):
    name: str
    dimension: int

    async def embed_query(self, text: str) -> list[float]:
        """Generate embedding vector for a single search query."""
        ...

    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Generate embedding vectors for a batch of documents."""
        ...
