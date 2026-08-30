from typing import Protocol, runtime_checkable

from app.schemas.retrieval import RetrievalFilter, RetrievedChunk


@runtime_checkable
class VectorStore(Protocol):
    name: str

    async def search(
        self,
        query_vector: list[float],
        filter_params: RetrievalFilter,
    ) -> list[RetrievedChunk]:
        """Search vector collection with metadata filtering."""
        ...

    async def upsert_chunks(
        self,
        chunks: list[RetrievedChunk],
        vectors: list[list[float]],
    ) -> int:
        """Upsert chunks with corresponding embedding vectors. Returns number of inserted/updated chunks."""
        ...

    async def count(self) -> int:
        """Returns the total number of indexed chunks."""
        ...

    async def delete_by_book_id(self, book_id: str) -> int:
        """Delete all chunks belonging to a specific book ID. Returns number of deleted chunks."""
        ...
