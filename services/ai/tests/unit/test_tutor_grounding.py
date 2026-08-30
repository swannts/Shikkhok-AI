import pytest

from app.core.exceptions import RetrievalError
from app.providers.embeddings.primary import DeterministicEmbeddingProvider
from app.providers.llm.mock import MockLlmProvider
from app.schemas.retrieval import RetrievalFilter, RetrievedChunk
from app.schemas.tutor import TutorGenerationRequest
from app.schemas.vector_store import VectorStoreEmbeddingMetadata
from app.services.citation_service import CitationService
from app.services.model_router import ModelRouter
from app.services.moderation_service import ModerationService
from app.services.output_safety import OutputSafetyService
from app.services.rag_service import RagService
from app.services.tutor_service import TutorService


class TrackingLlmProvider(MockLlmProvider):
    def __init__(self) -> None:
        super().__init__(name="tracking-mock", model="tracking-model", chunk_delay=0.0)
        self.stream_called = False

    async def stream(self, messages, temperature=0.3, max_tokens=1500):
        self.stream_called = True
        async for chunk in super().stream(messages, temperature=temperature, max_tokens=max_tokens):
            yield chunk


class FakeRagService:
    def __init__(
        self,
        chunks: list[RetrievedChunk] | None = None,
        should_raise: bool = False,
    ) -> None:
        self.chunks = chunks or []
        self.should_raise = should_raise

    async def search(self, filter_params):  # type: ignore[no-untyped-def]
        if self.should_raise:
            raise RuntimeError("retrieval failed")
        return self.chunks


def make_request() -> TutorGenerationRequest:
    return TutorGenerationRequest(
        request_id="req-grounding-1",
        user_id="user-1",
        conversation_id="conv-1",
        message="বর্গ সূত্র বুঝিয়ে দাও",
        language="bn",
        class_level=8,
        subject_id="mathematics",
        subject_title="গণিত",
        chapter_id="algebra",
        chapter_title="বীজগণিতীয় রাশি",
        lesson_id="identities",
        lesson_title="বর্গ সংবলিত সূত্রাবলি",
        history=[],
    )


async def collect_events(service: TutorService) -> list:
    events = []
    async for event in service.stream_tutor_response(make_request()):
        events.append(event)
    return events


@pytest.mark.asyncio
async def test_hybrid_grounding_with_retrieved_chunks_emits_citations() -> None:
    llm = TrackingLlmProvider()
    service = TutorService(
        moderation_service=ModerationService(),
        rag_service=FakeRagService(
            chunks=[
                RetrievedChunk(
                    chunk_id="c1",
                    text="(a + b)^2 = a^2 + 2ab + b^2 [source_1]",
                    score=0.99,
                    book_name="NCTB গণিত",
                    page_start=45,
                    page_end=47,
                )
            ]
        ),
        citation_service=CitationService(),
        output_safety_service=OutputSafetyService(),
        model_router=ModelRouter(primary=llm),
        grounding_mode="hybrid",
    )

    events = await collect_events(service)
    metadata = next(event for event in events if event.event == "metadata")

    assert metadata.data["grounded"] is True
    assert metadata.data["retrievalUnavailable"] is False
    assert metadata.data["groundingMode"] == "hybrid"
    assert llm.stream_called is True
    assert any(event.event == "citation" for event in events)


@pytest.mark.asyncio
async def test_hybrid_grounding_failure_continues_without_citations() -> None:
    llm = TrackingLlmProvider()
    service = TutorService(
        moderation_service=ModerationService(),
        rag_service=FakeRagService(should_raise=True),
        citation_service=CitationService(),
        output_safety_service=OutputSafetyService(),
        model_router=ModelRouter(primary=llm),
        grounding_mode="hybrid",
    )

    events = await collect_events(service)
    metadata = next(event for event in events if event.event == "metadata")

    assert metadata.data["grounded"] is False
    assert metadata.data["retrievalUnavailable"] is True
    assert metadata.data["groundingMode"] == "hybrid"
    assert llm.stream_called is True
    assert not any(event.event == "citation" for event in events)


@pytest.mark.asyncio
async def test_hybrid_grounding_zero_chunks_continues_without_citations() -> None:
    llm = TrackingLlmProvider()
    service = TutorService(
        moderation_service=ModerationService(),
        rag_service=FakeRagService(chunks=[]),
        citation_service=CitationService(),
        output_safety_service=OutputSafetyService(),
        model_router=ModelRouter(primary=llm),
        grounding_mode="hybrid",
    )

    events = await collect_events(service)
    metadata = next(event for event in events if event.event == "metadata")

    assert metadata.data["grounded"] is False
    assert metadata.data["retrievalUnavailable"] is False
    assert metadata.data["groundingMode"] == "hybrid"
    assert llm.stream_called is True
    assert not any(event.event == "citation" for event in events)


@pytest.mark.asyncio
async def test_strict_grounding_failure_emits_error_without_generation() -> None:
    llm = TrackingLlmProvider()
    service = TutorService(
        moderation_service=ModerationService(),
        rag_service=FakeRagService(should_raise=True),
        citation_service=CitationService(),
        output_safety_service=OutputSafetyService(),
        model_router=ModelRouter(primary=llm),
        grounding_mode="strict",
    )

    events = await collect_events(service)

    assert [event.event for event in events] == ["error"]
    assert events[0].data["code"] == "GROUNDING_UNAVAILABLE"
    assert llm.stream_called is False


@pytest.mark.asyncio
async def test_strict_grounding_zero_chunks_emits_error_without_generation() -> None:
    llm = TrackingLlmProvider()
    service = TutorService(
        moderation_service=ModerationService(),
        rag_service=FakeRagService(chunks=[]),
        citation_service=CitationService(),
        output_safety_service=OutputSafetyService(),
        model_router=ModelRouter(primary=llm),
        grounding_mode="strict",
    )

    events = await collect_events(service)

    assert [event.event for event in events] == ["error"]
    assert events[0].data["code"] == "GROUNDING_UNAVAILABLE"
    assert llm.stream_called is False


@pytest.mark.asyncio
async def test_rag_service_rejects_embedding_dimension_mismatch() -> None:
    class FakeVectorStore:
        name = "fake"
        embedding_metadata = VectorStoreEmbeddingMetadata(
            provider="gemini",
            model="text-embedding-004",
            dimension=768,
        )

        async def search(self, query_vector, filter_params):  # type: ignore[no-untyped-def]
            raise AssertionError("search should not be reached")

    rag = RagService(
        embedding_provider=DeterministicEmbeddingProvider(),
        vector_store=FakeVectorStore(),
    )

    with pytest.raises(RetrievalError, match="Embedding dimension mismatch"):
        await rag.search(filter_params=RetrievalFilter(query="বীজগণিত", class_level=8))
