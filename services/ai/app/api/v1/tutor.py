import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from app.core.config import settings
from app.core.security import verify_service_hmac
from app.providers.embeddings.primary import DeterministicEmbeddingProvider
from app.providers.llm.base import LlmProvider
from app.providers.llm.gemini import GeminiLlmProvider
from app.providers.llm.mock import MockLlmProvider
from app.providers.vector_store.memory import InMemoryVectorStore
from app.providers.vector_store.persistent import PersistentVectorStore
from app.schemas.tutor import TutorGenerationRequest
from app.services.citation_service import CitationService
from app.services.model_router import ModelRouter
from app.services.moderation_service import ModerationService
from app.services.output_safety import OutputSafetyService
from app.services.rag_service import RagService
from app.services.tutor_service import TutorService

router = APIRouter(prefix="/tutor", tags=["Tutor"])


# Factory for creating TutorService instance
def get_tutor_service() -> TutorService:
    # 1. LLM Providers
    fallback_provider: LlmProvider = MockLlmProvider(
        name="mock-fallback",
        model=settings.llm_fallback_model,
        chunk_delay=0.005,
    )

    primary_provider: LlmProvider
    if settings.llm_provider == "gemini" and settings.llm_api_key:
        primary_provider = GeminiLlmProvider(
            api_key=settings.llm_api_key,
            model=settings.llm_model,
            timeout_seconds=settings.llm_timeout_seconds,
        )
    else:
        primary_provider = MockLlmProvider(
            name="mock-primary",
            model=settings.llm_model,
            chunk_delay=0.005,
        )

    model_router = ModelRouter(primary=primary_provider, fallback=fallback_provider)

    # 2. RAG components
    embedding_provider = DeterministicEmbeddingProvider()
    vector_store: InMemoryVectorStore | PersistentVectorStore
    if settings.vector_store_provider == "memory":
        vector_store = InMemoryVectorStore()
    else:
        vector_store = PersistentVectorStore()
    rag_service = RagService(embedding_provider=embedding_provider, vector_store=vector_store)

    # 3. Safety & Citations
    moderation_service = ModerationService()
    citation_service = CitationService()
    output_safety_service = OutputSafetyService()

    return TutorService(
        moderation_service=moderation_service,
        rag_service=rag_service,
        citation_service=citation_service,
        output_safety_service=output_safety_service,
        model_router=model_router,
    )


@router.post("/stream")
async def stream_tutor(
    payload: TutorGenerationRequest,
    request: Request,
    _caller_service: str = Depends(verify_service_hmac),
) -> StreamingResponse:
    tutor_service = get_tutor_service()

    async def event_generator() -> AsyncIterator[bytes]:
        try:
            async for event in tutor_service.stream_tutor_response(
                request=payload,
                is_disconnected=lambda: False,
            ):
                # Check client connection state
                if await request.is_disconnected():
                    break

                event_str = (
                    f"event: {event.event}\ndata: {json.dumps(event.data, ensure_ascii=False)}\n\n"
                )
                yield event_str.encode("utf-8")
        except Exception as exc:
            err_frame = f"event: error\ndata: {json.dumps({'code': 'STREAM_ABORTED', 'message': str(exc)}, ensure_ascii=False)}\n\n"
            yield err_frame.encode("utf-8")

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
