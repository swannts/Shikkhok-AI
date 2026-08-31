import time

from app.core.exceptions import RetrievalError
from app.core.logging import logger
from app.providers.vector_store.compatibility import validate_embedding_compatibility
from app.providers.embeddings.base import EmbeddingProvider
from app.providers.vector_store.base import VectorStore
from app.schemas.retrieval import RetrievalFilter, RetrievedChunk


class RagService:
    def __init__(self, embedding_provider: EmbeddingProvider, vector_store: VectorStore) -> None:
        self.embedding_provider = embedding_provider
        self.vector_store = vector_store

    def _validate_embedding_compatibility(self, query_vector: list[float]) -> None:
        index_metadata = getattr(self.vector_store, "embedding_metadata", None)
        if index_metadata is None:
            return
        active_metadata = type(index_metadata)(
            provider=getattr(self.embedding_provider, "name", "unknown"),
            model=getattr(
                self.embedding_provider,
                "model",
                getattr(self.embedding_provider, "name", "unknown"),
            ),
            dimension=getattr(self.embedding_provider, "dimension", len(query_vector)),
            version=getattr(self.embedding_provider, "version", index_metadata.version),
        )
        try:
            validate_embedding_compatibility(active_metadata, index_metadata)
        except ValueError as e:
            raise RetrievalError(
                "Embedding compatibility mismatch between query and indexed corpus",
                details={
                    "queryDimension": len(query_vector),
                    "indexDimension": index_metadata.dimension,
                    "embeddingProvider": active_metadata.provider,
                    "indexProvider": index_metadata.provider,
                    "embeddingModel": active_metadata.model,
                    "indexModel": index_metadata.model,
                    "embeddingVersion": active_metadata.version,
                    "indexVersion": index_metadata.version,
                },
            ) from e

    async def search(self, filter_params: RetrievalFilter) -> list[RetrievedChunk]:
        started_at = time.time()
        try:
            query_vector = await self.embedding_provider.embed_query(filter_params.query)
            self._validate_embedding_compatibility(query_vector)
            chunks = await self.vector_store.search(
                query_vector=query_vector, filter_params=filter_params
            )
            retrieval_latency_ms = int((time.time() - started_at) * 1000)
            logger.info(
                f"RAG search retrieved {len(chunks)} chunks",
                extra={
                    "extra_data": {
                        "topK": filter_params.top_k,
                        "resultCount": len(chunks),
                        "retrievalLatencyMs": retrieval_latency_ms,
                        "minScore": filter_params.min_score,
                        "scoped": any(
                            value is not None
                            for value in (
                                filter_params.class_level,
                                filter_params.subject_id,
                                filter_params.chapter_id,
                                filter_params.lesson_id,
                                filter_params.curriculum_year,
                                filter_params.medium,
                            )
                        ),
                    }
                },
            )
            return chunks
        except Exception as e:
            logger.error(f"Failed to retrieve chunks in RagService: {e}")
            raise RetrievalError(f"Curriculum retrieval failed: {e}") from e
