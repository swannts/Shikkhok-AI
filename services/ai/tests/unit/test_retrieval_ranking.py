from pathlib import Path

import pytest

from app.providers.embeddings.primary import DeterministicEmbeddingProvider
from app.providers.vector_store.memory import InMemoryVectorStore
from app.providers.vector_store.persistent import PersistentVectorStore
from app.schemas.retrieval import RetrievalFilter
from app.services.rag_service import RagService


@pytest.mark.asyncio
async def test_rag_rejects_irrelevant_chunks_below_threshold() -> None:
    embeddings = DeterministicEmbeddingProvider()
    query = "বাংলাদেশের ক্রিকেট ইতিহাস"
    query_vector = await embeddings.embed_query(query)

    store = InMemoryVectorStore()
    store.chunks = [
        {
            "chunk_id": "irrelevant_chunk",
            "text": "বীজগণিতীয় সূত্রাবলি এবং বর্গের নিয়ম।",
            "book_id": "class6_science_fixture",
            "book_name": "Synthetic Fixture",
            "class_level": 6,
            "subject_id": "science",
            "chapter_id": "plant_life",
            "lesson_id": "photosynthesis",
            "content_version": 1,
        }
    ]
    store.vectors = [[-value for value in query_vector]]

    rag = RagService(embedding_provider=embeddings, vector_store=store)
    results = await rag.search(
        RetrievalFilter(
            query=query,
            class_level=6,
            subject_id="science",
            top_k=3,
        )
    )

    assert results == []


@pytest.mark.parametrize("kind", ["memory", "persistent"])
@pytest.mark.asyncio
async def test_vector_store_prefers_latest_content_version_per_lesson(
    kind: str,
    tmp_path: Path,
) -> None:
    embeddings = DeterministicEmbeddingProvider()
    query = "সালোকসংশ্লেষণ কী?"
    query_vector = await embeddings.embed_query(query)

    if kind == "memory":
        store = InMemoryVectorStore()
    else:
        store = PersistentVectorStore(
            file_path=tmp_path / "lesson_versions.json",
            embedding_metadata=None,
            allow_demo_seed=True,
        )
    store.chunks = [
        {
            "chunk_id": "photosynthesis_lesson_a_v1",
            "text": "সালোকসংশ্লেষণ: উদ্ভিদ সূর্যালোক ব্যবহার করে খাদ্য তৈরি করে।",
            "book_id": "class6_science_fixture",
            "book_name": "Synthetic Fixture",
            "class_level": 6,
            "subject_id": "science",
            "chapter_id": "plant_life",
            "lesson_id": "photosynthesis_a",
            "content_version": 1,
        },
        {
            "chunk_id": "photosynthesis_lesson_a_v2",
            "text": "সালোকসংশ্লেষণ: উদ্ভিদ সূর্যালোক, জল এবং কার্বন ডাই-অক্সাইড ব্যবহার করে খাদ্য তৈরি করে।",
            "book_id": "class6_science_fixture",
            "book_name": "Synthetic Fixture",
            "class_level": 6,
            "subject_id": "science",
            "chapter_id": "plant_life",
            "lesson_id": "photosynthesis_a",
            "content_version": 2,
        },
        {
            "chunk_id": "photosynthesis_lesson_b_v1",
            "text": "সালোকসংশ্লেষণ উদ্ভিদের খাদ্য তৈরির প্রধান প্রক্রিয়া।",
            "book_id": "class6_science_fixture",
            "book_name": "Synthetic Fixture",
            "class_level": 6,
            "subject_id": "science",
            "chapter_id": "plant_life",
            "lesson_id": "photosynthesis_b",
            "content_version": 1,
        },
    ]
    store.vectors = [query_vector, query_vector, query_vector]

    rag = RagService(embedding_provider=embeddings, vector_store=store)
    results = await rag.search(
        RetrievalFilter(
            query=query,
            class_level=6,
            subject_id="science",
            chapter_id="plant_life",
            top_k=3,
        )
    )

    assert results
    assert {chunk.chunk_id for chunk in results} == {
        "photosynthesis_lesson_a_v2",
        "photosynthesis_lesson_b_v1",
    }
    assert any(chunk.content_version == 2 for chunk in results)
    assert any(chunk.content_version == 1 for chunk in results)
