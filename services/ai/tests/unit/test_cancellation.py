import asyncio

import pytest

from app.providers.embeddings.primary import DeterministicEmbeddingProvider
from app.providers.llm.mock import MockLlmProvider
from app.providers.vector_store.memory import InMemoryVectorStore
from app.schemas.tutor import TutorGenerationRequest
from app.services.citation_service import CitationService
from app.services.model_router import ModelRouter
from app.services.moderation_service import ModerationService
from app.services.output_safety import OutputSafetyService
from app.services.rag_service import RagService
from app.services.tutor_service import TutorService


@pytest.mark.asyncio
async def test_tutor_stream_cancellation():
    llm = MockLlmProvider(name="mock", model="mock", chunk_delay=0.01)
    router = ModelRouter(primary=llm)
    rag = RagService(
        embedding_provider=DeterministicEmbeddingProvider(),
        vector_store=InMemoryVectorStore(),
    )
    service = TutorService(
        moderation_service=ModerationService(),
        rag_service=rag,
        citation_service=CitationService(),
        output_safety_service=OutputSafetyService(),
        model_router=router,
    )

    req = TutorGenerationRequest(
        request_id="cancel-test-1",
        user_id="u1",
        conversation_id="c1",
        message="বীজগণিত কি?",
    )

    cancel_event = asyncio.Event()

    events = []
    async for event in service.stream_tutor_response(req, cancellation_event=cancel_event):
        events.append(event)
        # Cancel right after receiving metadata or first delta
        if event.event in ("metadata", "delta"):
            cancel_event.set()

    # Verify that 'done' event with finishReason 'stop' was NOT emitted
    event_names = [e.event for e in events]
    assert "done" not in event_names
