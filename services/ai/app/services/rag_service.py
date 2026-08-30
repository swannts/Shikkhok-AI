from app.core.exceptions import RetrievalError
from app.core.logging import logger
from app.providers.embeddings.base import EmbeddingProvider
from app.providers.vector_store.base import VectorStore
from app.schemas.retrieval import RetrievalFilter, RetrievedChunk


class RagService:
    def __init__(self, embedding_provider: EmbeddingProvider, vector_store: VectorStore) -> None:
        self.embedding_provider = embedding_provider
        self.vector_store = vector_store

    async def search(self, filter_params: RetrievalFilter) -> list[RetrievedChunk]:
        try:
            query_vector = await self.embedding_provider.embed_query(filter_params.query)
            chunks = await self.vector_store.search(
                query_vector=query_vector, filter_params=filter_params
            )
            logger.info(
                f"RAG search retrieved {len(chunks)} chunks for query '{filter_params.query[:40]}...'",
                extra={"extra_data": {"topK": filter_params.top_k, "resultCount": len(chunks)}},
            )
            return chunks
        except Exception as e:
            logger.error(f"Failed to retrieve chunks in RagService: {e}")
            raise RetrievalError(f"Curriculum retrieval failed: {e}") from e
