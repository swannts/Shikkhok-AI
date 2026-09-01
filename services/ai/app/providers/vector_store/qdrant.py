import hashlib
import logging
import math
import re
import uuid
from typing import Any

from qdrant_client import AsyncQdrantClient, models

from app.core.config import settings
from app.providers.vector_store.compatibility import validate_embedding_compatibility
from app.providers.vector_store.scoping import (
    active_version_key,
    build_retrieval_scope_chain,
)
from app.schemas.retrieval import RetrievalFilter, RetrievedChunk
from app.schemas.vector_store import VectorStoreEmbeddingMetadata

logger = logging.getLogger(__name__)

_METADATA_POINT_ID = "00000000-0000-0000-0000-000000000001"
_METADATA_TYPE_MARKER = "embedding_metadata"

_QDRANT_FIELD_FOR_FILTER = {
    "class_level": "class_level",
    "subject_id": "subject_id",
    "chapter_id": "chapter_id",
    "lesson_id": "lesson_id",
    "curriculum_version": "curriculum_version",
    "academic_year": "academic_year",
    "curriculum_year": "curriculum_year",
    "medium": "medium",
}


def _deterministic_point_id(chunk_id: str) -> str:
    digest_int = int.from_bytes(hashlib.sha256(chunk_id.encode()).digest()[:16], "big")
    return str(uuid.UUID(int=digest_int))


def _build_payload(chunk: RetrievedChunk) -> dict[str, Any]:
    data = chunk.model_dump()
    for field in (
        "embedding_provider",
        "embedding_model",
        "embedding_dimension",
        "embedding_version",
    ):
        data.pop(field, None)
    return data


def _keyword_overlap_score(query: str, text: str) -> float:
    query_terms = {
        token for token in re.split(r"[^\w\u0980-\u09FF]+", query.lower()) if token.strip()
    }
    if not query_terms:
        return 0.0
    text_terms = {
        token for token in re.split(r"[^\w\u0980-\u09FF]+", text.lower()) if token.strip()
    }
    if not text_terms:
        return 0.0
    overlap = len(query_terms & text_terms)
    if overlap == 0:
        if any(term in text.lower() for term in query_terms):
            return 0.35
        return 0.0
    return min(1.0, overlap / max(len(query_terms), 1))


def _cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b, strict=False))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _scope_to_qdrant_filter(scope: dict[str, Any]) -> models.Filter | None:
    conditions: list[models.Condition] = []
    for key, value in scope.items():
        if value is None:
            continue
        if key in _QDRANT_FIELD_FOR_FILTER:
            field_name = _QDRANT_FIELD_FOR_FILTER[key]
            if isinstance(value, (int, float)) and not isinstance(value, bool):
                conditions.append(
                    models.FieldCondition(
                        key=field_name, match=models.MatchValue(value=value)
                    )
                )
            else:
                conditions.append(
                    models.FieldCondition(
                        key=field_name, match=models.MatchValue(value=str(value))
                    )
                )
    return models.Filter(
        must=conditions or None,
        must_not=[
            models.FieldCondition(
                key="_type",
                match=models.MatchValue(value=_METADATA_TYPE_MARKER),
            )
        ],
    )


def _qdrant_point_to_chunk(point: models.Record) -> RetrievedChunk:
    payload = point.payload or {}
    meta = payload.get("embedding_metadata") or {}
    return RetrievedChunk(
        chunk_id=payload.get("chunk_id", ""),
        text=payload.get("text", ""),
        score=round(point.score or 0.0, 4),
        book_id=payload.get("book_id"),
        book_name=payload.get("book_name"),
        class_level=payload.get("class_level"),
        subject_id=payload.get("subject_id"),
        chapter_id=payload.get("chapter_id"),
        lesson_id=payload.get("lesson_id"),
        subject_title=payload.get("subject_title"),
        chapter_title=payload.get("chapter_title"),
        lesson_title=payload.get("lesson_title"),
        page_start=payload.get("page_start"),
        page_end=payload.get("page_end"),
        curriculum_version=payload.get("curriculum_version", "2024-NCTB"),
        academic_year=payload.get("academic_year", 2026),
        curriculum_year=payload.get("curriculum_year"),
        medium=payload.get("medium"),
        content_version=payload.get("content_version"),
        embedding_provider=meta.get("provider"),
        embedding_model=meta.get("model"),
        embedding_dimension=meta.get("dimension"),
        embedding_version=meta.get("version"),
        content_hash=payload.get("content_hash"),
    )


def _select_active_version_chunks(
    candidates: list[tuple[dict[str, Any], Any]],
) -> list[tuple[dict[str, Any], Any]]:
    latest_versions: dict[str, int] = {}
    for chunk, _ in candidates:
        version_key = active_version_key(chunk)
        content_version = int(chunk.get("content_version") or 1)
        latest_versions[version_key] = max(latest_versions.get(version_key, 0), content_version)

    if not latest_versions:
        return candidates

    selected: list[tuple[dict[str, Any], list[float] | None]] = []
    for chunk, vector in candidates:
        version_key = active_version_key(chunk)
        if chunk.get("_type") == _METADATA_TYPE_MARKER:
            continue
        if int(chunk.get("content_version") or 1) == latest_versions.get(version_key, 1):
            selected.append((chunk, vector))
    return selected


class QdrantVectorStore:
    name: str = "qdrant"
    embedding_metadata: VectorStoreEmbeddingMetadata | None

    def __init__(
        self,
        url: str | None = None,
        api_key: str | None = None,
        collection_name: str | None = None,
        embedding_metadata: VectorStoreEmbeddingMetadata | None = None,
        allow_demo_seed: bool = False,
    ) -> None:
        self.url = url or settings.vector_store_url
        self.api_key = api_key or settings.vector_store_api_key or None
        self.embedding_metadata = embedding_metadata
        self.allow_demo_seed = allow_demo_seed

        identity_suffix = (
            f"{embedding_metadata.provider or 'unknown'}"
            f"-{embedding_metadata.model or 'unknown'}"
            f"-{embedding_metadata.dimension}"
            f"-v{embedding_metadata.version}"
        )
        self.collection_name = collection_name or f"shikkhok-curriculum-{identity_suffix}"

        self._client: AsyncQdrantClient | None = None
        self._initialized: bool = False

    @property
    def client(self) -> AsyncQdrantClient:
        if self._client is None:
            self._client = AsyncQdrantClient(
                url=self.url,
                api_key=self.api_key or None,
                timeout=10.0,
            )
        return self._client

    async def _ensure_initialized(self) -> None:
        if self._initialized:
            return
        if self.embedding_metadata is None:
            self._initialized = True
            return
        await self.ensure_collection()
        self._initialized = True

    async def ensure_collection(self) -> None:
        if self.embedding_metadata is None:
            return

        meta = self._get_metadata()

        collections = await self.client.get_collections()
        exists = self.collection_name in [c.name for c in collections.collections]
        if not exists:
            await self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=meta.dimension,
                    distance=models.Distance.COSINE,
                ),
            )
            logger.info(
                f"Created Qdrant collection '{self.collection_name}' "
                f"(dim={meta.dimension}, provider={meta.provider}, model={meta.model})"
            )

        existing_meta = await self.client.retrieve(
            collection_name=self.collection_name,
            ids=[_METADATA_POINT_ID],
            with_payload=True,
            with_vectors=False,
        )

        if existing_meta:
            stored_payload = existing_meta[0].payload or {}
            if stored_payload.get("_type") != _METADATA_TYPE_MARKER:
                raise ValueError(
                    f"Qdrant collection '{self.collection_name}' has an invalid metadata point"
                )
            stored_meta = VectorStoreEmbeddingMetadata(
                provider=str(stored_payload.get("provider", "")),
                model=str(stored_payload.get("model", "")),
                dimension=int(stored_payload.get("dimension", 0)),
                version=int(stored_payload.get("version", 1)),
            )
            validate_embedding_compatibility(meta, stored_meta)
            logger.info(
                f"Collection '{self.collection_name}' validated against stored embedding metadata"
            )
        else:
            await self.client.upsert(
                collection_name=self.collection_name,
                points=[
                    models.PointStruct(
                        id=_METADATA_POINT_ID,
                        vector=[0.0] * meta.dimension,
                        payload={
                            "_type": _METADATA_TYPE_MARKER,
                            "provider": meta.provider,
                            "model": meta.model,
                            "dimension": meta.dimension,
                            "version": meta.version,
                        },
                    )
                ],
            )

    def _get_metadata(self) -> VectorStoreEmbeddingMetadata:
        if self.embedding_metadata is None:
            self.embedding_metadata = VectorStoreEmbeddingMetadata(
                provider="unknown",
                model="unknown",
                dimension=0,
            )
        return self.embedding_metadata

    def _validate_vector_dimension(self, vector: list[float]) -> None:
        meta = self._get_metadata()
        if len(vector) != meta.dimension:
            raise ValueError(
                f"Vector dimension mismatch for Qdrant collection {self.collection_name}: "
                f"expected {meta.dimension}, got {len(vector)}"
            )

    async def search(
        self,
        query_vector: list[float],
        filter_params: RetrievalFilter,
    ) -> list[RetrievedChunk]:
        self._validate_vector_dimension(query_vector)
        await self._ensure_initialized()

        for scope in build_retrieval_scope_chain(filter_params):
            qdrant_filter = _scope_to_qdrant_filter(scope)
            search_kwargs: dict[str, Any] = {
                "with_payload": True,
                "with_vectors": False,
                "limit": max(filter_params.top_k * 4, 20),
            }
            if qdrant_filter is not None:
                search_kwargs["query_filter"] = qdrant_filter

            results = await self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                **search_kwargs,
            )

            if not results:
                continue

            candidates = [
                (hit.payload or {}, hit)
                for hit in results
                if (hit.payload or {}).get("_type") != _METADATA_TYPE_MARKER
            ]
            candidates = _select_active_version_chunks(candidates)

            scored_chunks: list[RetrievedChunk] = []
            seen_ids: set[str] = set()
            for payload, hit in candidates:
                chunk_id = payload.get("chunk_id")
                if not chunk_id or chunk_id in seen_ids:
                    continue
                seen_ids.add(chunk_id)

                chunk_obj = _qdrant_point_to_chunk(hit)
                cosine_score = hit.score or 0.0
                keyword_score = _keyword_overlap_score(filter_params.query, payload.get("text", ""))
                score = max(cosine_score * 0.65 + keyword_score * 0.35, keyword_score)
                if score < filter_params.min_score:
                    continue
                chunk_obj.score = round(min(score, 0.99), 4)
                scored_chunks.append(chunk_obj)

            scored_chunks.sort(key=lambda x: (x.score, x.page_start or 0, x.chunk_id), reverse=True)
            if scored_chunks:
                return scored_chunks[: filter_params.top_k]

        return []

    async def upsert_chunks(
        self,
        chunks: list[RetrievedChunk],
        vectors: list[list[float]],
    ) -> int:
        meta = self._get_metadata()
        await self._ensure_initialized()
        points: list[models.PointStruct] = []
        for chunk, vector in zip(chunks, vectors, strict=False):
            self._validate_vector_dimension(vector)
            payload = _build_payload(chunk)
            payload["embedding_metadata"] = {
                "provider": meta.provider,
                "model": meta.model,
                "dimension": meta.dimension,
                "version": meta.version,
            }
            payload["chunk_id"] = chunk.chunk_id
            point_id = _deterministic_point_id(chunk.chunk_id)
            points.append(
                models.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload,
                )
            )
        await self.client.upsert(collection_name=self.collection_name, points=points)
        return len(points)

    async def count(self) -> int:
        await self._ensure_initialized()
        result = await self.client.count(
            collection_name=self.collection_name,
            count_filter=models.Filter(
                must_not=[
                    models.FieldCondition(
                        key="_type",
                        match=models.MatchValue(value=_METADATA_TYPE_MARKER),
                    )
                ]
            ),
        )
        return result.count

    async def delete_by_book_id(self, book_id: str) -> int:
        await self._ensure_initialized()
        delete_filter = models.Filter(
            must=[
                models.FieldCondition(
                    key="book_id",
                    match=models.MatchValue(value=book_id),
                )
            ],
            must_not=[
                models.FieldCondition(
                    key="_type",
                    match=models.MatchValue(value=_METADATA_TYPE_MARKER),
                )
            ],
        )
        matching = await self.client.count(
            collection_name=self.collection_name,
            count_filter=delete_filter,
        )
        await self.client.delete(
            collection_name=self.collection_name,
            points_selector=delete_filter,
        )
        return matching.count

    async def close(self) -> None:
        if self._client is not None:
            await self._client.close()
            self._client = None
