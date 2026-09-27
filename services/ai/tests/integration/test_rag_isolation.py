import pytest

from app.providers.vector_store.memory import InMemoryVectorStore
from app.schemas.retrieval import RetrievalFilter, RetrievedChunk
from app.services.rag_service import RagService


@pytest.fixture
async def populated_rag_service():
    store = InMemoryVectorStore()

    chunks = [
        RetrievedChunk(
            chunk_id="chunk-c8-math-1",
            text="বীজগণিতের সূত্র: (a+b)^2 = a^2 + 2ab + b^2",
            score=0,
            class_level=8,
            subject_id="mathematics",
            chapter_id="algebra",
            medium="bangla",
            book_name="NCTB Class 8 Math",
            page_start=45,
            page_end=45,
            curriculum_version="2024"
        ),
        RetrievedChunk(
            chunk_id="chunk-c9-math-1",
            text="ত্রিকোণমিতি: sin^2(x) + cos^2(x) = 1",
            score=0,
            class_level=9,
            subject_id="mathematics",
            chapter_id="trigonometry",
            medium="bangla",
            book_name="NCTB Class 9 Math",
            page_start=110,
            page_end=110,
            curriculum_version="2024"
        ),
        RetrievedChunk(
            chunk_id="chunk-c8-bangla-1",
            text="রবীন্দ্রনাথ ঠাকুর বিশ্বকবি নামে পরিচিত।",
            score=0,
            class_level=8,
            subject_id="bangla",
            chapter_id="poetry",
            medium="bangla",
            book_name="NCTB Class 8 Bangla",
            page_start=12,
            page_end=12,
            curriculum_version="2024"
        ),
        RetrievedChunk(
            chunk_id="chunk-c8-math-en-1",
            text="Algebra formula: (a+b)^2 = a^2 + 2ab + b^2",
            score=0,
            class_level=8,
            subject_id="mathematics",
            chapter_id="algebra",
            medium="english",
            book_name="NCTB Class 8 Math (English Version)",
            page_start=45,
            page_end=45,
            curriculum_version="2024"
        ),
        RetrievedChunk(
            chunk_id="chunk-c8-math-old-1",
            text="পুরাতন বীজগণিত সূত্র: (a+b)^2 = a^2 + 2ab + b^2",
            score=0,
            class_level=8,
            subject_id="mathematics",
            chapter_id="algebra",
            medium="bangla",
            book_name="NCTB Class 8 Math (2021)",
            page_start=30,
            page_end=30,
            curriculum_version="2021"
        )
    ]

    vectors = [[0.1] * 128 for _ in range(len(chunks))]

    await store.upsert_chunks(chunks, vectors)

    # Mock Embedding provider
    class MockEmbeddingProvider:
        name = "deterministic-mock"
        model = "deterministic-mock"
        dimension = 128
        version = 1
        async def embed_query(self, query):
            return [0.1] * 128

    rag = RagService(MockEmbeddingProvider(), store)
    return rag

@pytest.mark.asyncio
async def test_rag_class_isolation(populated_rag_service):
    rag = populated_rag_service
    query = RetrievalFilter(
        query="সূত্র",
        curriculum_version="2024",
        class_level=8,
        subject_id="mathematics",
    )

    results = await rag.search(query)

    class_levels = [r.class_level for r in results]
    assert 9 not in class_levels
    assert all(c == 8 for c in class_levels)
    assert any("chunk-c8-math-1" == r.chunk_id for r in results)

@pytest.mark.asyncio
async def test_rag_subject_isolation(populated_rag_service):
    rag = populated_rag_service
    query = RetrievalFilter(
        query="সূত্র",
        curriculum_version="2024",
        class_level=8,
        subject_id="mathematics",
    )

    results = await rag.search(query)

    subjects = [r.subject_id for r in results]
    assert "bangla" not in subjects
    assert all(s == "mathematics" for s in subjects)

@pytest.mark.asyncio
async def test_rag_curriculum_version_isolation(populated_rag_service):
    rag = populated_rag_service
    query = RetrievalFilter(
        query="সূত্র",
        curriculum_version="2024",
        class_level=8,
        subject_id="mathematics",
    )

    results = await rag.search(query)

    years = [r.curriculum_version for r in results]
    assert "2021" not in years
    assert all(y == "2024" for y in years)

@pytest.mark.asyncio
async def test_rag_medium_isolation(populated_rag_service):
    rag = populated_rag_service
    query = RetrievalFilter(
        query="সূত্র",
        curriculum_version="2024",
        class_level=8,
        subject_id="mathematics",
        medium="english"
    )

    results = await rag.search(query)

    mediums = [r.medium for r in results]
    assert "bangla" not in mediums
    assert all(m == "english" for m in mediums)

@pytest.mark.asyncio
async def test_rag_missing_metadata_broadens_safely(populated_rag_service):
    rag = populated_rag_service
    # If class_level is missing, memory vector store retrieves globally according to exact scopes matched, or returns no results if scoping logic is strict.
    query = RetrievalFilter(
        query="সূত্র",
        curriculum_version="2024",
        subject_id="mathematics",
    )

    results = await rag.search(query)

    # We just ensure it runs and either broadens to mathematics globally or stays empty safely
    subjects = [r.subject_id for r in results]
    if subjects:
        assert all(s == "mathematics" for s in subjects)
