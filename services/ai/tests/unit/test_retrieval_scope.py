from pathlib import Path
import json

import pytest

from app.providers.embeddings.primary import DeterministicEmbeddingProvider
from app.providers.vector_store.memory import InMemoryVectorStore
from app.providers.vector_store.persistent import PersistentVectorStore
from app.schemas.retrieval import RetrievalFilter
from app.schemas.vector_store import VectorStoreEmbeddingMetadata
from app.services.rag_service import RagService


def make_chunk(
    *,
    chunk_id: str,
    text: str,
    class_level: int,
    subject_id: str,
    chapter_id: str,
    lesson_id: str,
    page_start: int,
) -> dict[str, object]:
    return {
        "chunk_id": chunk_id,
        "text": text,
        "score": 1.0,
        "book_id": f"{subject_id}_class_{class_level}",
        "book_name": f"Class {class_level} {subject_id}",
        "class_level": class_level,
        "subject_id": subject_id,
        "chapter_id": chapter_id,
        "lesson_id": lesson_id,
        "curriculum_year": 2026,
        "medium": "bangla",
        "page_start": page_start,
        "page_end": page_start + 1,
        "content_version": 1,
        "embedding_provider": "deterministic-mock",
        "embedding_model": "deterministic-mock",
        "embedding_dimension": 128,
        "embedding_version": 1,
    }


def build_chunks(include_science: bool = True) -> list[dict[str, object]]:
    chunks = [
        make_chunk(
            chunk_id="class6_math_algebra",
            text="বীজগণিতীয় সূত্রাবলি এবং বর্গের নিয়ম।",
            class_level=6,
            subject_id="mathematics",
            chapter_id="algebra",
            lesson_id="identities",
            page_start=40,
        )
    ]
    if include_science:
        chunks.extend(
            [
                make_chunk(
                    chunk_id="class6_science_photosynthesis",
                    text="সালোকসংশ্লেষণ হলো উদ্ভিদের খাদ্য তৈরির প্রক্রিয়া।",
                    class_level=6,
                    subject_id="science",
                    chapter_id="plant_life",
                    lesson_id="photosynthesis",
                    page_start=12,
                ),
                make_chunk(
                    chunk_id="class8_science_combustion",
                    text="দহন হলো অক্সিজেনের উপস্থিতিতে তাপ ও আলো উৎপন্ন করার প্রক্রিয়া।",
                    class_level=8,
                    subject_id="science",
                    chapter_id="chemical_reactions",
                    lesson_id="combustion",
                    page_start=72,
                ),
            ]
        )
    return chunks


async def build_store(
    tmp_path: Path,
    chunks: list[dict[str, object]],
    kind: str,
) -> tuple[DeterministicEmbeddingProvider, object, list[float]]:
    embeddings = DeterministicEmbeddingProvider()
    query = "সালোকসংশ্লেষণ কী?"
    query_vector = await embeddings.embed_query(query)
    metadata = {
        "provider": embeddings.name,
        "model": embeddings.name,
        "dimension": embeddings.dimension,
        "version": 1,
    }

    if kind == "memory":
        store = InMemoryVectorStore(
            embedding_metadata=VectorStoreEmbeddingMetadata(**metadata),
        )
        store.chunks = chunks
        store.vectors = [query_vector for _ in chunks]
        return embeddings, store, query_vector

    store_file = tmp_path / "scope_store.json"
    store_file.write_text(
        json.dumps(
            {
                "version": "1.0",
                "count": len(chunks),
                "metadata": {
                    "embeddingProvider": metadata["provider"],
                    "embeddingModel": metadata["model"],
                    "embeddingDimension": metadata["dimension"],
                    "embeddingVersion": metadata["version"],
                },
                "chunks": chunks,
                "vectors": [query_vector for _ in chunks],
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    store = PersistentVectorStore(
        file_path=store_file,
        embedding_metadata=VectorStoreEmbeddingMetadata(**metadata),
    )
    return embeddings, store, query_vector


@pytest.mark.parametrize("kind", ["memory", "persistent"])
@pytest.mark.asyncio
async def test_retrieval_scope_stays_within_class_and_subject(
    kind: str,
    tmp_path: Path,
) -> None:
    embeddings, store, _ = await build_store(tmp_path, build_chunks(), kind)
    rag = RagService(embedding_provider=embeddings, vector_store=store)

    results = await rag.search(
        RetrievalFilter(
            query="সালোকসংশ্লেষণ কী?",
            class_level=6,
            subject_id="science",
            top_k=5,
        )
    )

    assert results
    assert all(chunk.class_level == 6 for chunk in results)
    assert all(chunk.subject_id == "science" for chunk in results)


@pytest.mark.parametrize("kind", ["memory", "persistent"])
@pytest.mark.asyncio
async def test_retrieval_scope_falls_back_inside_same_subject_and_class(
    kind: str,
    tmp_path: Path,
) -> None:
    embeddings, store, _ = await build_store(tmp_path, build_chunks(), kind)
    rag = RagService(embedding_provider=embeddings, vector_store=store)

    results = await rag.search(
        RetrievalFilter(
            query="সালোকসংশ্লেষণ কী?",
            class_level=6,
            subject_id="science",
            chapter_id="unknown_chapter",
            lesson_id="unknown_lesson",
            top_k=5,
        )
    )

    assert results
    assert all(chunk.class_level == 6 for chunk in results)
    assert all(chunk.subject_id == "science" for chunk in results)


@pytest.mark.parametrize("kind", ["memory", "persistent"])
@pytest.mark.asyncio
async def test_retrieval_scope_returns_no_results_when_subject_is_absent(
    kind: str,
    tmp_path: Path,
) -> None:
    embeddings, store, _ = await build_store(tmp_path, build_chunks(include_science=False), kind)
    rag = RagService(embedding_provider=embeddings, vector_store=store)

    results = await rag.search(
        RetrievalFilter(
            query="সালোকসংশ্লেষণ কী?",
            class_level=6,
            subject_id="science",
            top_k=5,
        )
    )

    assert results == []


@pytest.mark.parametrize("kind", ["memory", "persistent"])
@pytest.mark.asyncio
async def test_unscoped_retrieval_can_search_global_index(
    kind: str,
    tmp_path: Path,
) -> None:
    embeddings, store, _ = await build_store(tmp_path, build_chunks(), kind)
    rag = RagService(embedding_provider=embeddings, vector_store=store)

    results = await rag.search(
        RetrievalFilter(
            query="সালোকসংশ্লেষণ কী?",
            top_k=5,
        )
    )

    assert results
    assert any(chunk.subject_id == "science" for chunk in results)
