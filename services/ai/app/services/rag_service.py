from app.core.exceptions import RetrievalError
from app.core.logging import logger
from app.providers.embeddings.base import EmbeddingProvider
from app.providers.vector_store.base import VectorStore
from app.schemas.retrieval import RetrievalFilter, RetrievedChunk


class RagService:
    def __init__(self, embedding_provider: EmbeddingProvider, vector_store: VectorStore) -> None:
        self.embedding_provider = embedding_provider
        self.vector_store = vector_store

    def _validate_embedding_dimensions(self, query_vector: list[float]) -> None:
        index_metadata = getattr(self.vector_store, "embedding_metadata", None)
        if index_metadata is None:
            return
        if len(query_vector) != index_metadata.dimension:
            raise RetrievalError(
                "Embedding dimension mismatch between query and indexed corpus",
                details={
                    "queryDimension": len(query_vector),
                    "indexDimension": index_metadata.dimension,
                    "embeddingProvider": getattr(self.embedding_provider, "name", "unknown"),
                    "indexProvider": index_metadata.provider,
                    "embeddingModel": getattr(self.embedding_provider, "model", "unknown"),
                    "indexModel": index_metadata.model,
                },
            )

    async def search(self, filter_params: RetrievalFilter) -> list[RetrievedChunk]:
        try:
            query_vector = await self.embedding_provider.embed_query(filter_params.query)
            self._validate_embedding_dimensions(query_vector)
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
