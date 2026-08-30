from pathlib import Path
import pytest
from app.providers.vector_store.persistent import PersistentVectorStore
from app.schemas.retrieval import RetrievalFilter, RetrievedChunk


@pytest.mark.asyncio
async def test_persistent_vector_store_save_load_and_search(tmp_path: Path) -> None:
    store_file = tmp_path / "test_chunks.json"
    store = PersistentVectorStore(file_path=store_file)

    test_chunk = RetrievedChunk(
        chunk_id="test_chunk_001",
        text="ত্রিকোণমিতির সূত্রাবলি sin^2(theta) + cos^2(theta) = 1",
        score=1.0,
        book_id="math_class_9",
        book_name="NCTB গণিত শ্রেণি ৯",
        class_level=9,
        subject_id="mathematics",
        chapter_id="trigonometry",
        page_start=150,
        page_end=152,
    )
    test_vec = [0.2] * 128

    # 1. Upsert chunk
    count = await store.upsert_chunks(chunks=[test_chunk], vectors=[test_vec])
    assert count == 1

    # 2. Verify file saved to disk
    assert store_file.exists()

    # 3. Search with matching metadata filter
    results = await store.search(
        query_vector=[0.2] * 128,
        filter_params=RetrievalFilter(
            query="ত্রিকোণমিতি",
            class_level=9,
            subject_id="mathematics",
            chapter_id="trigonometry",
        ),
    )
    assert len(results) >= 1
    assert results[0].chunk_id == "test_chunk_001"
    assert results[0].class_level == 9

    # 4. Search with non-matching class filter (Class 8 should not find Class 9 chunk)
    mismatched = await store.search(
        query_vector=[0.2] * 128,
        filter_params=RetrievalFilter(
            query="ত্রিকোণমিতি",
            class_level=8,
            subject_id="mathematics",
        ),
    )
    # The chunk from class 9 should NOT be in the results
    assert not any(c.chunk_id == "test_chunk_001" for c in mismatched)

    # 5. Reload in a fresh instance and verify persistence
    store_reloaded = PersistentVectorStore(file_path=store_file)
    total_count = await store_reloaded.count()
    assert total_count >= 1

    # 6. Delete book chunks
    deleted = await store_reloaded.delete_by_book_id("math_class_9")
    assert deleted >= 1
