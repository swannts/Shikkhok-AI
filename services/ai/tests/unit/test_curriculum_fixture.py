import json
from pathlib import Path

import pytest

from app.ingestion.pipeline import IngestionPipeline
from app.providers.embeddings.primary import DeterministicEmbeddingProvider
from app.providers.vector_store.persistent import PersistentVectorStore
from app.schemas.retrieval import RetrievalFilter
from app.services.rag_service import RagService
from tests.fixtures.curriculum_fixture import (
    CLASS6_SCIENCE_PAGES,
    CLASS6_SCIENCE_PAGES_WITH_INJECTION,
    make_class6_science_metadata,
)


@pytest.mark.asyncio
async def test_curriculum_fixture_ingests_and_retrieves_bangla_content(tmp_path: Path) -> None:
    embeddings = DeterministicEmbeddingProvider()
    store_file = tmp_path / "fixture_store.json"
    store_file.write_text(
        json.dumps(
            {
                "version": "1.0",
                "count": 0,
                "metadata": {
                    "embeddingProvider": embeddings.name,
                    "embeddingModel": embeddings.name,
                    "embeddingDimension": embeddings.dimension,
                    "embeddingVersion": 1,
                },
                "chunks": [],
                "vectors": [],
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    store = PersistentVectorStore(file_path=store_file)
    pipeline = IngestionPipeline(embedding_provider=embeddings, vector_store=store)

    metadata_v1 = make_class6_science_metadata(content_version=1)
    result = await pipeline.ingest_pages(pages=CLASS6_SCIENCE_PAGES, metadata=metadata_v1)
    assert result.status == "success"
    assert result.chunks_created >= 1

    repeated = await pipeline.ingest_pages(pages=CLASS6_SCIENCE_PAGES, metadata=metadata_v1)
    assert repeated.status == "success"
    assert await store.count() == result.chunks_created

    rag = RagService(embedding_provider=embeddings, vector_store=store)
    chunks = await rag.search(
        RetrievalFilter(
            query="সালোকসংশ্লেষণ কী?",
            class_level=6,
            subject_id="science",
            chapter_id="plant_life",
            lesson_id="photosynthesis",
            top_k=3,
        )
    )

    assert chunks
    assert chunks[0].lesson_id == "photosynthesis"
    assert chunks[0].page_start == 12
    assert chunks[0].content_hash
    assert "সূর্যালোক" in chunks[0].text


@pytest.mark.asyncio
async def test_curriculum_fixture_with_injection_is_still_ingested_safely(tmp_path: Path) -> None:
    embeddings = DeterministicEmbeddingProvider()
    store_file = tmp_path / "fixture_store_injection.json"
    store_file.write_text(
        json.dumps(
            {
                "version": "1.0",
                "count": 0,
                "metadata": {
                    "embeddingProvider": embeddings.name,
                    "embeddingModel": embeddings.name,
                    "embeddingDimension": embeddings.dimension,
                    "embeddingVersion": 1,
                },
                "chunks": [],
                "vectors": [],
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    store = PersistentVectorStore(file_path=store_file)
    pipeline = IngestionPipeline(embedding_provider=embeddings, vector_store=store)

    metadata = make_class6_science_metadata(content_version=1)
    result = await pipeline.ingest_pages(
        pages=CLASS6_SCIENCE_PAGES_WITH_INJECTION,
        metadata=metadata,
    )

    assert result.status == "success"
    assert result.chunks_created >= 1
    assert await store.count() == result.chunks_created
