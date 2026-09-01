"""
Integration tests for the Qdrant vector store provider.

These tests run against a real Qdrant instance. They are skipped when
QDRANT_URL is not reachable or QDRANT_INTEGRATION_TESTS is not enabled.
"""

import os

import pytest
from qdrant_client import AsyncQdrantClient

from app.providers.vector_store.qdrant import (
    QdrantVectorStore,
    _deterministic_point_id,
    _METADATA_POINT_ID,
    _METADATA_TYPE_MARKER,
)
from app.schemas.retrieval import RetrievedChunk, RetrievalFilter
from app.schemas.vector_store import VectorStoreEmbeddingMetadata

QDRANT_URL = os.environ.get("QDRANT_URL", "http://localhost:6333")
SKIP_INTEGRATION = os.environ.get("QDRANT_INTEGRATION_TESTS", "").lower() not in (
    "1",
    "true",
    "yes",
)


def _can_connect(qdrant_url: str) -> bool:
    try:
        client = AsyncQdrantClient(url=qdrant_url, timeout=5.0)
        import asyncio

        asyncio.get_event_loop().run_until_complete(client.get_collections())
        return True
    except Exception:
        return False


skip_if_no_qdrant = pytest.mark.skipif(
    SKIP_INTEGRATION,
    reason="Set QDRANT_INTEGRATION_TESTS=1 to enable Qdrant integration tests",
)

skip_if_unreachable = pytest.mark.skipif(
    not _can_connect(QDRANT_URL),
    reason=f"Qdrant not reachable at {QDRANT_URL}",
)


@pytest.fixture
def unique_collection_name():
    import uuid

    return f"test-collection-{uuid.uuid4().hex[:8]}"


@pytest.fixture
def embedding_metadata():
    return VectorStoreEmbeddingMetadata(
        provider="deterministic-mock",
        model="test-model",
        dimension=8,
        version=1,
    )


@pytest.fixture
def sample_chunks():
    return [
        RetrievedChunk(
            chunk_id="chunk_001",
            text="বীজগণিতীয় সূত্রাবলি: (a+b)² = a² + 2ab + b²",
            score=0.0,
            book_id="math_class_8",
            book_name="NCTB গণিত",
            class_level=8,
            subject_id="mathematics",
            chapter_id="algebra",
            lesson_id="identities",
            page_start=45,
            page_end=47,
            content_version=1,
        ),
        RetrievedChunk(
            chunk_id="chunk_002",
            text="বর্গের অন্তরের সূত্র: (a-b)² = a² - 2ab + b²",
            score=0.0,
            book_id="math_class_8",
            book_name="NCTB গণিত",
            class_level=8,
            subject_id="mathematics",
            chapter_id="algebra",
            lesson_id="identities",
            page_start=48,
            page_end=50,
            content_version=1,
        ),
    ]


@skip_if_no_qdrant
@skip_if_unreachable
@pytest.mark.asyncio
async def test_create_collection_and_metadata_point(
    unique_collection_name,
    embedding_metadata,
):
    store = QdrantVectorStore(
        url=QDRANT_URL,
        api_key=None,
        collection_name=unique_collection_name,
        embedding_metadata=embedding_metadata,
    )
    await store.ensure_collection()

    existing_meta = await store.client.retrieve(
        collection_name=unique_collection_name,
        ids=[_METADATA_POINT_ID],
        with_payload=True,
        with_vectors=False,
    )
    assert len(existing_meta) == 1
    assert existing_meta[0].payload["_type"] == _METADATA_TYPE_MARKER
    assert existing_meta[0].payload["provider"] == "deterministic-mock"
    assert existing_meta[0].payload["dimension"] == 8

    await store.client.delete_collection(collection_name=unique_collection_name)
    await store.close()


@skip_if_no_qdrant
@skip_if_unreachable
@pytest.mark.asyncio
async def test_validate_compatible_metadata(
    unique_collection_name,
    embedding_metadata,
):
    store = QdrantVectorStore(
        url=QDRANT_URL,
        collection_name=unique_collection_name,
        embedding_metadata=embedding_metadata,
    )
    await store.ensure_collection()

    store2 = QdrantVectorStore(
        url=QDRANT_URL,
        collection_name=unique_collection_name,
        embedding_metadata=VectorStoreEmbeddingMetadata(
            provider="deterministic-mock",
            model="test-model",
            dimension=8,
            version=1,
        ),
    )
    store2._client = store.client
    await store2.ensure_collection()

    await store.client.delete_collection(collection_name=unique_collection_name)
    await store2.close()


@skip_if_no_qdrant
@skip_if_unreachable
@pytest.mark.asyncio
async def test_upsert_and_search(
    unique_collection_name,
    embedding_metadata,
    sample_chunks,
):
    store = QdrantVectorStore(
        url=QDRANT_URL,
        collection_name=unique_collection_name,
        embedding_metadata=embedding_metadata,
    )
    vectors = [[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8] for _ in sample_chunks]

    await store.ensure_collection()
    count = await store.upsert_chunks(sample_chunks, vectors)
    assert count == 2

    results = await store.search(
        query_vector=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
        filter_params=RetrievalFilter(
            query="বীজগণিত",
            class_level=8,
            subject_id="mathematics",
            top_k=5,
        ),
    )
    assert len(results) >= 1
    assert results[0].chunk_id in ("chunk_001", "chunk_002")

    await store.client.delete_collection(collection_name=unique_collection_name)
    await store.close()


@skip_if_no_qdrant
@skip_if_unreachable
@pytest.mark.asyncio
async def test_search_excludes_metadata_point(
    unique_collection_name,
    embedding_metadata,
    sample_chunks,
):
    store = QdrantVectorStore(
        url=QDRANT_URL,
        collection_name=unique_collection_name,
        embedding_metadata=embedding_metadata,
    )
    vectors = [[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8] for _ in sample_chunks]

    await store.ensure_collection()
    await store.upsert_chunks(sample_chunks, vectors)

    results = await store.search(
        query_vector=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
        filter_params=RetrievalFilter(
            query="test",
            top_k=5,
        ),
    )
    for chunk in results:
        assert chunk.chunk_id != _METADATA_POINT_ID

    await store.client.delete_collection(collection_name=unique_collection_name)
    await store.close()


@skip_if_no_qdrant
@skip_if_unreachable
@pytest.mark.asyncio
async def test_delete_by_book_id(
    unique_collection_name,
    embedding_metadata,
    sample_chunks,
):
    store = QdrantVectorStore(
        url=QDRANT_URL,
        collection_name=unique_collection_name,
        embedding_metadata=embedding_metadata,
    )
    vectors = [[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8] for _ in sample_chunks]

    await store.ensure_collection()
    await store.upsert_chunks(sample_chunks, vectors)

    deleted = await store.delete_by_book_id("math_class_8")
    assert deleted == 2

    count = await store.count()
    assert count == 0

    await store.client.delete_collection(collection_name=unique_collection_name)
    await store.close()


@skip_if_no_qdrant
@skip_if_unreachable
@pytest.mark.asyncio
async def test_count_excludes_metadata_point(
    unique_collection_name,
    embedding_metadata,
    sample_chunks,
):
    store = QdrantVectorStore(
        url=QDRANT_URL,
        collection_name=unique_collection_name,
        embedding_metadata=embedding_metadata,
    )
    vectors = [[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8] for _ in sample_chunks]

    await store.ensure_collection()
    await store.upsert_chunks(sample_chunks, vectors)

    count = await store.count()
    assert count == 2

    await store.client.delete_collection(collection_name=unique_collection_name)
    await store.close()


@skip_if_no_qdrant
@skip_if_unreachable
@pytest.mark.asyncio
async def test_active_version_filtering(
    unique_collection_name,
    embedding_metadata,
):
    store = QdrantVectorStore(
        url=QDRANT_URL,
        collection_name=unique_collection_name,
        embedding_metadata=embedding_metadata,
    )

    v1 = RetrievedChunk(
        chunk_id="lesson_a_v1",
        text="Old photosynthesis content",
        score=0.0,
        book_id="b1",
        class_level=8,
        subject_id="science",
        lesson_id="photosynthesis",
        content_version=1,
    )
    v2 = RetrievedChunk(
        chunk_id="lesson_a_v2",
        text="Updated photosynthesis content",
        score=0.0,
        book_id="b1",
        class_level=8,
        subject_id="science",
        lesson_id="photosynthesis",
        content_version=2,
    )

    vector = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]
    await store.ensure_collection()
    await store.upsert_chunks([v1, v2], [vector, vector])

    results = await store.search(
        query_vector=vector,
        filter_params=RetrievalFilter(
            query="photosynthesis",
            top_k=5,
        ),
    )
    chunk_ids = {r.chunk_id for r in results}
    assert "lesson_a_v2" in chunk_ids
    assert "lesson_a_v1" not in chunk_ids

    await store.client.delete_collection(collection_name=unique_collection_name)
    await store.close()


@skip_if_no_qdrant
@skip_if_unreachable
@pytest.mark.asyncio
async def test_vector_dimension_mismatch_rejected(
    unique_collection_name,
    embedding_metadata,
):
    store = QdrantVectorStore(
        url=QDRANT_URL,
        collection_name=unique_collection_name,
        embedding_metadata=embedding_metadata,
    )
    await store.ensure_collection()

    with pytest.raises(ValueError, match="Vector dimension mismatch"):
        await store.search(
            query_vector=[0.1, 0.2],
            filter_params=RetrievalFilter(query="test", top_k=5),
        )

    await store.client.delete_collection(collection_name=unique_collection_name)
    await store.close()
