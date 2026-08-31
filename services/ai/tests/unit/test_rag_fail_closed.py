import pytest

from app.providers.embeddings.primary import DeterministicEmbeddingProvider
from app.providers.vector_store.memory import InMemoryVectorStore
from app.schemas.retrieval import RetrievalFilter
from app.services.rag_service import RagService


@pytest.fixture
def test_rag_service() -> RagService:
    provider = DeterministicEmbeddingProvider(dimension=128)
    store = InMemoryVectorStore()
    return RagService(embedding_provider=provider, vector_store=store)


@pytest.mark.asyncio
async def test_rag_returns_versioned_grounded_chunks(test_rag_service: RagService):
    # Query for Class 8 Math Algebra (present in in-memory seed)
    filter_params = RetrievalFilter(
        query="বীজগণিতীয় সূত্রাবলি ও বর্গ নির্ণয়",
        class_level=8,
        subject_id="mathematics",
        curriculum_version="2024-NCTB",
        academic_year=2026,
        min_score=0.35,
    )
    chunks = await test_rag_service.search(filter_params)
    assert len(chunks) > 0
    top = chunks[0]
    assert top.score >= 0.35
    assert top.class_level == 8
    assert top.subject_id == "mathematics"
    assert top.curriculum_version == "2024-NCTB"
    assert top.academic_year == 2026


@pytest.mark.asyncio
async def test_rag_fail_closed_on_unindexed_subject(test_rag_service: RagService):
    # Query for an unindexed class/subject combination
    filter_params = RetrievalFilter(
        query="Quantum Mechanics and black holes",
        class_level=6,
        subject_id="astrophysics",
        curriculum_version="2024-NCTB",
        academic_year=2026,
        min_score=0.35,
    )
    chunks = await test_rag_service.search(filter_params)
    # Must fail-closed: return empty list, not unrelated chunks
    assert chunks == []


@pytest.mark.asyncio
async def test_rag_fail_closed_on_version_mismatch(test_rag_service: RagService):
    # Query with non-matching old curriculum version
    filter_params = RetrievalFilter(
        query="বীজগণিতীয় সূত্রাবলি",
        class_level=8,
        subject_id="mathematics",
        curriculum_version="1996-OBSOLETE",
        academic_year=1996,
        min_score=0.35,
    )
    chunks = await test_rag_service.search(filter_params)
    assert chunks == []


@pytest.mark.asyncio
async def test_rag_min_score_enforcement(test_rag_service: RagService):
    # Query with irrelevantly strict min_score
    filter_params = RetrievalFilter(
        query="random irrelevant text 12345 xyz",
        class_level=8,
        subject_id="mathematics",
        min_score=0.85,
    )
    chunks = await test_rag_service.search(filter_params)
    assert chunks == []
