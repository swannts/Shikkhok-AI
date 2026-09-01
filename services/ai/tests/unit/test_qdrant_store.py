from typing import Any

import pytest
from qdrant_client import models

from app.providers.vector_store.qdrant import (
    _METADATA_POINT_ID,
    _METADATA_TYPE_MARKER,
    QdrantVectorStore,
    _build_payload,
    _deterministic_point_id,
    _select_active_version_chunks,
)
from app.schemas.retrieval import RetrievedChunk
from app.schemas.vector_store import VectorStoreEmbeddingMetadata


class MockScoredPoint:
    """Simulates a Qdrant search result Record with a score attribute."""

    def __init__(self, id: str, payload: dict, vector: list[float] | None = None, score: float | None = None):
        self.id = id
        self.payload = payload
        self.vector = vector
        self.score = score


def _cosine_sim(vec_a: list[float], vec_b: list[float]) -> float:
    import math
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b, strict=True))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _matches_filter(payload: dict, f: models.Filter) -> bool:
    if f is None:
        return True
    for cond in f.must or []:
        if isinstance(cond, models.FieldCondition):
            if payload.get(cond.key) != cond.match.value:
                return False
    for cond in f.must_not or []:
        if isinstance(cond, models.FieldCondition):
            if payload.get(cond.key) == cond.match.value:
                return False
    return True


@pytest.fixture
def mock_qdrant_client():
    """Returns a mock AsyncQdrantClient and a state dict to track operations."""
    state: dict[str, Any] = {
        "collections": set(),
        "points": {},
        "vectors": {},
    }

    class MockQdrantClient:
        async def get_collections(self):
            return models.CollectionsResponse(
                collections=[models.CollectionDescription(name=name) for name in state["collections"]]
            )

        async def create_collection(self, collection_name, vectors_config, **kwargs):
            state["collections"].add(collection_name)

        async def upsert(self, collection_name, points, **kwargs):
            for pt in points:
                state["points"][str(pt.id)] = pt.payload
                state["vectors"][str(pt.id)] = pt.vector
            return models.UpdateResult(operation_id=1, status=models.UpdateStatus.ACKNOWLEDGED)

        async def search(
            self,
            collection_name,
            query_vector,
            with_payload=True,
            with_vectors=False,
            limit=10,
            query_filter=None,
            **kwargs,
        ):
            results = []
            for point_id, payload in state["points"].items():
                if payload.get("_type") == _METADATA_TYPE_MARKER:
                    continue
                if query_filter and not _matches_filter(payload, query_filter):
                    continue
                score = _cosine_sim(query_vector, state["vectors"].get(point_id, [0.0] * 768))
                results.append(
                    MockScoredPoint(
                        id=point_id,
                        payload=payload,
                        vector=state["vectors"].get(point_id, []),
                        score=score,
                    )
                )
            results.sort(key=lambda r: r.score, reverse=True)
            return results[:limit]

        async def count(self, collection_name, count_filter=None, exact=True, **kwargs):
            if count_filter is None:
                return models.CountResult(count=len(state["points"]))
            count = 0
            for _point_id, payload in state["points"].items():
                if _matches_filter(payload, count_filter):
                    count += 1
            return models.CountResult(count=count)

        async def retrieve(self, collection_name, ids, with_payload=True, with_vectors=False, **kwargs):
            result = []
            for id_val in ids:
                payload = state["points"].get(str(id_val))
                if payload is not None:
                    result.append(
                        MockScoredPoint(
                            id=str(id_val),
                            payload=payload,
                            vector=state["vectors"].get(str(id_val), []),
                            score=0.0,
                        )
                    )
            return result

        async def delete(self, collection_name, points_selector=None, points=None, **kwargs):
            selector = points_selector if points_selector is not None else points
            for point_id, payload in list(state["points"].items()):
                if _matches_filter(payload, selector):
                    del state["points"][point_id]
                    del state["vectors"][point_id]
            return models.UpdateResult(operation_id=1, status=models.UpdateStatus.ACKNOWLEDGED)

        async def close(self):
            pass

    return MockQdrantClient(), state


@pytest.fixture
def vector_store(mock_qdrant_client):
    client, state = mock_qdrant_client
    store = QdrantVectorStore(
        url="http://localhost:6333",
        api_key=None,
        embedding_metadata=VectorStoreEmbeddingMetadata(
            provider="gemini",
            model="text-embedding-004",
            dimension=768,
            version=1,
        ),
    )
    store._client = client
    store._initialized = False
    return store, state


@pytest.fixture
def sample_chunk():
    return RetrievedChunk(
        chunk_id="chunk_001",
        text="বীজগণিতীয় সূত্রাবলি: (a + b)² = a² + 2ab + b²।",
        score=0.0,
        book_id="math_class_8",
        book_name="NCTB গণিত (শ্রেণি ৮)",
        class_level=8,
        subject_id="mathematics",
        chapter_id="algebra",
        lesson_id="identities",
        page_start=45,
        page_end=47,
        content_version=1,
    )


class TestMetadataPointId:
    def test_metadata_point_id_is_reserved_uuid(self):
        import uuid
        parsed = uuid.UUID(_METADATA_POINT_ID)
        assert parsed == uuid.UUID("00000000-0000-0000-0000-000000000001")


class TestDeterministicPointId:
    def test_same_chunk_id_produces_same_point_id(self):
        id1 = _deterministic_point_id("chunk_001")
        id2 = _deterministic_point_id("chunk_001")
        assert id1 == id2

    def test_different_chunk_ids_produce_different_point_ids(self):
        id1 = _deterministic_point_id("chunk_001")
        id2 = _deterministic_point_id("chunk_002")
        assert id1 != id2

    def test_does_not_collide_with_metadata_point_id(self):
        chunk_id = _deterministic_point_id("any_chunk")
        assert chunk_id != _METADATA_POINT_ID


class TestBuildPayload:
    def test_build_payload_strips_embedding_fields(self, sample_chunk):
        payload = _build_payload(sample_chunk)
        assert "embedding_provider" not in payload
        assert "embedding_model" not in payload
        assert "embedding_dimension" not in payload
        assert "embedding_version" not in payload
        assert payload["chunk_id"] == "chunk_001"
        assert payload["text"] == "বীজগণিতীয় সূত্রাবলি: (a + b)² = a² + 2ab + b²।"


class TestQdrantPointToChunk:
    def test_conversion_uses_correct_field_names(self):
        from app.providers.vector_store.qdrant import _qdrant_point_to_chunk

        record = MockScoredPoint(
            id="123",
            payload={
                "chunk_id": "chunk_001",
                "text": "Test text",
                "book_id": "book_1",
                "class_level": 8,
                "embedding_metadata": {
                    "provider": "gemini",
                    "model": "text-embedding-004",
                    "dimension": 768,
                    "version": 1,
                },
            },
            vector=[],
            score=0.95,
        )
        chunk = _qdrant_point_to_chunk(record)
        assert chunk.chunk_id == "chunk_001"
        assert chunk.text == "Test text"
        assert chunk.book_id == "book_1"
        assert chunk.class_level == 8
        assert chunk.embedding_provider == "gemini"
        assert chunk.embedding_model == "text-embedding-004"
        assert chunk.embedding_dimension == 768


class TestSelectActiveVersion:
    def test_excludes_metadata_point(self):
        metadata_chunk = {"_type": _METADATA_TYPE_MARKER, "chunk_id": "meta"}
        regular_chunk = {"chunk_id": "chunk_1", "content_version": 1, "book_id": "b1", "lesson_id": "l1"}
        candidates = [(metadata_chunk, None), (regular_chunk, None)]
        selected = _select_active_version_chunks(candidates)
        assert len(selected) == 1
        assert selected[0][0]["chunk_id"] == "chunk_1"

    def test_keeps_latest_version_per_lesson(self):
        v1 = {"chunk_id": "chunk_v1", "content_version": 1, "book_id": "b1", "lesson_id": "l1"}
        v2 = {"chunk_id": "chunk_v2", "content_version": 2, "book_id": "b1", "lesson_id": "l1"}
        v1_other = {"chunk_id": "chunk_other_v1", "content_version": 1, "book_id": "b1", "lesson_id": "l2"}
        candidates = [(v1, None), (v2, None), (v1_other, None)]
        selected = _select_active_version_chunks(candidates)
        ids = {c["chunk_id"] for c, _ in selected}
        assert "chunk_v2" in ids
        assert "chunk_v1" not in ids
        assert "chunk_other_v1" in ids


class TestCollectionInitialization:
    @pytest.mark.asyncio
    async def test_creates_collection_if_missing(self, vector_store):
        store, state = vector_store
        await store.ensure_collection()
        assert store.collection_name in state["collections"]

    @pytest.mark.asyncio
    async def test_creates_metadata_point_on_first_init(self, vector_store):
        store, state = vector_store
        await store.ensure_collection()
        meta_payload = state["points"].get(_METADATA_POINT_ID)
        assert meta_payload is not None
        assert meta_payload["_type"] == _METADATA_TYPE_MARKER
        assert meta_payload["provider"] == "gemini"
        assert meta_payload["model"] == "text-embedding-004"

    @pytest.mark.asyncio
    async def test_validates_compatible_metadata(self, vector_store):
        store, state = vector_store
        await store.ensure_collection()
        await store.ensure_collection()

    @pytest.mark.asyncio
    async def test_rejects_incompatible_metadata(self, mock_qdrant_client):
        client, state = mock_qdrant_client
        store = QdrantVectorStore(
            embedding_metadata=VectorStoreEmbeddingMetadata(
                provider="gemini", model="text-embedding-004", dimension=768, version=1
            ),
        )
        store._client = client
        await store.ensure_collection()

        store2 = QdrantVectorStore(
            embedding_metadata=VectorStoreEmbeddingMetadata(
                provider="gemini", model="text-embedding-004", dimension=1024, version=1
            ),
        )
        store2._client = client
        with pytest.raises(ValueError, match="dimension differs"):
            await store2.ensure_collection()

    @pytest.mark.asyncio
    async def test_does_not_overwrite_incompatible_metadata(self, mock_qdrant_client):
        client, state = mock_qdrant_client
        store = QdrantVectorStore(
            embedding_metadata=VectorStoreEmbeddingMetadata(
                provider="gemini", model="text-embedding-004", dimension=768, version=1
            ),
        )
        store._client = client
        await store.ensure_collection()

        original_meta = dict(state["points"][_METADATA_POINT_ID])

        store2 = QdrantVectorStore(
            embedding_metadata=VectorStoreEmbeddingMetadata(
                provider="openai", model="text-embedding-3-small", dimension=512, version=2
            ),
        )
        store2._client = client
        with pytest.raises(ValueError, match="provider differs"):
            await store2.ensure_collection()

        current_meta = state["points"][_METADATA_POINT_ID]
        assert current_meta == original_meta


class TestChunkUpsert:
    @pytest.mark.asyncio
    async def test_upsert_creates_new_point(self, vector_store, sample_chunk):
        store, state = vector_store
        vector = [0.1] * 768
        count = await store.upsert_chunks([sample_chunk], [vector])
        assert count == 1
        point_id = _deterministic_point_id("chunk_001")
        assert point_id in state["points"]
        assert state["points"][point_id]["chunk_id"] == "chunk_001"

    @pytest.mark.asyncio
    async def test_upsert_updates_existing_point(self, vector_store, sample_chunk):
        store, state = vector_store
        vector = [0.1] * 768
        await store.upsert_chunks([sample_chunk], [vector])
        sample_chunk.text = "Updated text"
        await store.upsert_chunks([sample_chunk], [vector])
        point_id = _deterministic_point_id("chunk_001")
        assert state["points"][point_id]["text"] == "Updated text"

    @pytest.mark.asyncio
    async def test_rejects_vector_dimension_mismatch(self, vector_store, sample_chunk):
        store, state = vector_store
        with pytest.raises(ValueError, match="Vector dimension mismatch"):
            await store.upsert_chunks([sample_chunk], [[0.1] * 512])


class TestSearch:
    @pytest.mark.asyncio
    async def test_search_returns_matching_chunks(self, vector_store, sample_chunk):
        from app.schemas.retrieval import RetrievalFilter

        store, state = vector_store
        vector = [0.5] * 768
        await store.upsert_chunks([sample_chunk], [vector])

        results = await store.search(
            query_vector=[0.5] * 768,
            filter_params=RetrievalFilter(
                query="বীজগণিত",
                class_level=8,
                subject_id="mathematics",
                top_k=5,
            ),
        )
        assert len(results) >= 1
        assert results[0].chunk_id == "chunk_001"

    @pytest.mark.asyncio
    async def test_search_excludes_metadata_point(self, vector_store, sample_chunk):
        from app.schemas.retrieval import RetrievalFilter

        store, state = vector_store
        await store.ensure_collection()
        vector = [0.5] * 768
        await store.upsert_chunks([sample_chunk], [vector])

        results = await store.search(
            query_vector=[0.5] * 768,
            filter_params=RetrievalFilter(
                query="test",
                top_k=5,
            ),
        )
        for chunk in results:
            assert chunk.chunk_id != _METADATA_POINT_ID

    @pytest.mark.asyncio
    async def test_search_excludes_stale_versions(self, vector_store):
        from app.schemas.retrieval import RetrievalFilter

        store, state = vector_store
        v1 = RetrievedChunk(
            chunk_id="lesson_a_v1", text="Old content about photosynthesis", score=0.0,
            book_id="b1", book_name="Book", class_level=8,
            subject_id="science", chapter_id="plant_life", lesson_id="photosynthesis",
            content_version=1,
        )
        v2 = RetrievedChunk(
            chunk_id="lesson_a_v2", text="New content about photosynthesis", score=0.0,
            book_id="b1", book_name="Book", class_level=8,
            subject_id="science", chapter_id="plant_life", lesson_id="photosynthesis",
            content_version=2,
        )
        vector = [0.5] * 768
        await store.upsert_chunks([v1, v2], [vector, vector])

        results = await store.search(
            query_vector=[0.5] * 768,
            filter_params=RetrievalFilter(
                query="photosynthesis", top_k=5,
            ),
        )
        chunk_ids = {r.chunk_id for r in results}
        assert "lesson_a_v2" in chunk_ids
        assert "lesson_a_v1" not in chunk_ids


class TestCount:
    @pytest.mark.asyncio
    async def test_count_excludes_metadata_point(self, vector_store, sample_chunk):
        store, state = vector_store
        await store.ensure_collection()
        vector = [0.5] * 768
        await store.upsert_chunks([sample_chunk], [vector])
        count = await store.count()
        assert count == 1

    @pytest.mark.asyncio
    async def test_count_returns_zero_for_empty_collection(self, vector_store):
        store, state = vector_store
        await store.ensure_collection()
        count = await store.count()
        assert count == 0


class TestDeleteByBookId:
    @pytest.mark.asyncio
    async def test_delete_removes_only_matching_book(self, vector_store):
        store, state = vector_store
        chunk_a = RetrievedChunk(
            chunk_id="chunk_a", text="Content A", score=0.0,
            book_id="book_1", class_level=8, subject_id="math",
        )
        chunk_b = RetrievedChunk(
            chunk_id="chunk_b", text="Content B", score=0.0,
            book_id="book_2", class_level=8, subject_id="math",
        )
        vector = [0.5] * 768
        await store.upsert_chunks([chunk_a, chunk_b], [vector, vector])

        deleted = await store.delete_by_book_id("book_1")
        assert deleted == 1
        point_id_b = _deterministic_point_id("chunk_b")
        assert str(point_id_b) in state["points"]


class TestVectorDimensionMismatch:
    @pytest.mark.asyncio
    async def test_search_rejects_dimension_mismatch(self, vector_store):
        from app.schemas.retrieval import RetrievalFilter

        with pytest.raises(ValueError, match="Vector dimension mismatch"):
            await vector_store[0].search(
                query_vector=[0.1] * 512,
                filter_params=RetrievalFilter(query="test", top_k=5),
            )
