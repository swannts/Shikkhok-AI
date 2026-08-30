import pytest

from app.providers.embeddings.primary import DeterministicEmbeddingProvider
from app.providers.vector_store.memory import InMemoryVectorStore
from app.schemas.retrieval import RetrievalFilter, RetrievedChunk
from app.services.citation_service import CitationService
from app.services.rag_service import RagService


@pytest.mark.asyncio
async def test_rag_service_metadata_filtering() -> None:
    embeddings = DeterministicEmbeddingProvider()
    store = InMemoryVectorStore()
    rag = RagService(embedding_provider=embeddings, vector_store=store)

    # Search mathematics class 8
    res = await rag.search(
        RetrievalFilter(
            query="বীজগণিতীয় সূত্র",
            class_level=8,
            subject_id="mathematics",
            chapter_id="algebra",
            lesson_id="identities",
            top_k=2,
        )
    )

    assert len(res) > 0
    top = res[0]
    assert top.class_level == 8
    assert top.subject_id == "mathematics"
    assert top.chapter_id == "algebra"
    assert top.lesson_id == "identities"
    assert "বীজগণিতীয়" in top.text or "বর্গ" in top.text


def test_citation_service_maps_source_tags() -> None:
    citation_service = CitationService()

    mock_chunks = [
        RetrievedChunk(
            chunk_id="c1",
            text="Textbook passage on algebra formula",
            score=0.95,
            book_name="NCTB গণিত শ্রেণি ৮",
            class_level=8,
            subject_title="গণিত",
            chapter_title="বীজগণিতীয় রাশি",
            page_start=45,
            page_end=47,
        ),
        RetrievedChunk(
            chunk_id="c2",
            text="Second passage on difference of squares",
            score=0.91,
            book_name="NCTB গণিত শ্রেণি ৮",
            class_level=8,
            subject_title="গণিত",
            chapter_title="বীজগণিতীয় রাশি",
            page_start=48,
            page_end=50,
        ),
    ]

    llm_output = "সূত্রটি হলো (a+b)^2 = a^2 + 2ab + b^2 [source_1]। অন্য সূত্রটি [source_2] এ আছে।"
    citations = citation_service.extract_citations(llm_output, mock_chunks)

    assert len(citations) == 2
    assert citations[0].citation_id == "source_1"
    assert citations[0].source_id == "c1"
    assert citations[0].page_start == 45
    assert citations[0].page_end == 47

    assert citations[1].citation_id == "source_2"
    assert citations[1].source_id == "c2"
    assert citations[1].page_start == 48


def test_citation_service_fallback_to_top_chunk_when_no_tags() -> None:
    citation_service = CitationService()

    mock_chunks = [
        RetrievedChunk(
            chunk_id="c1",
            text="Relevant textbook passage",
            score=0.95,
            book_name="NCTB গণিত",
            class_level=8,
            page_start=10,
            page_end=12,
        )
    ]

    llm_output_no_tags = "এই প্রশ্নের সাধারণ ব্যাখ্যা নিচে দেওয়া হলো।"
    citations = citation_service.extract_citations(llm_output_no_tags, mock_chunks)

    assert len(citations) == 1
    assert citations[0].citation_id == "source_1"
    assert citations[0].source_id == "c1"
