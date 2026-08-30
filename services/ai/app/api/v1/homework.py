from fastapi import APIRouter, Depends

from app.core.config import settings
from app.core.security import verify_service_hmac
from app.providers.embeddings.primary import DeterministicEmbeddingProvider
from app.providers.llm.base import LlmProvider
from app.providers.llm.gemini import GeminiLlmProvider
from app.providers.llm.mock import MockLlmProvider
from app.providers.vector_store.persistent import PersistentVectorStore
from app.schemas.homework import HomeworkEvaluationRequest, HomeworkEvaluationResponse
from app.services.citation_service import CitationService
from app.services.homework_service import HomeworkService
from app.services.model_router import ModelRouter
from app.services.moderation_service import ModerationService
from app.services.rag_service import RagService

router = APIRouter(prefix="/homework", tags=["Homework"])


def get_homework_service() -> HomeworkService:
    # 1. LLM Router
    fallback_provider = MockLlmProvider(name="mock-fallback", model="mock-homework-fallback")
    primary_provider: LlmProvider
    if settings.llm_provider == "gemini" and settings.llm_api_key:
        primary_provider = GeminiLlmProvider(
            api_key=settings.llm_api_key,
            model=settings.llm_model,
        )
    else:
        primary_provider = MockLlmProvider(
            name="mock-primary",
            model=settings.llm_model,
        )
    model_router = ModelRouter(primary=primary_provider, fallback=fallback_provider)

    # 2. RAG & Citations
    embedding_provider = DeterministicEmbeddingProvider()
    vector_store = PersistentVectorStore()
    rag_service = RagService(embedding_provider=embedding_provider, vector_store=vector_store)
    citation_service = CitationService()
    moderation_service = ModerationService()

    return HomeworkService(
        moderation_service=moderation_service,
        rag_service=rag_service,
        citation_service=citation_service,
        model_router=model_router,
    )


@router.post("/evaluate", response_model=HomeworkEvaluationResponse)
async def evaluate_homework(
    payload: HomeworkEvaluationRequest,
    _caller: str = Depends(verify_service_hmac),
) -> HomeworkEvaluationResponse:
    """Evaluates student homework with step-by-step correction and curriculum citations."""
    service = get_homework_service()
    return await service.evaluate_submission(payload)
