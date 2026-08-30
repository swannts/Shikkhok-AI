from fastapi import Request

from app.core.container import AiServiceContainer
from app.providers.embeddings.base import EmbeddingProvider
from app.providers.vector_store.base import VectorStore
from app.services.homework_service import HomeworkService
from app.services.rag_service import RagService
from app.services.tutor_service import TutorService


def get_container(request: Request) -> AiServiceContainer:
    container: AiServiceContainer | None = getattr(request.app.state, "container", None)
    if container is None:
        # Fallback for isolated test clients where lifespan might be bypassed
        from app.core.container import build_service_container

        container = build_service_container()
        request.app.state.container = container
    return container


def get_tutor_service(request: Request) -> TutorService:
    return get_container(request).tutor_service


def get_homework_service(request: Request) -> HomeworkService:
    return get_container(request).homework_service


def get_rag_service(request: Request) -> RagService:
    return get_container(request).rag_service


def get_vector_store(request: Request) -> VectorStore:
    return get_container(request).vector_store


def get_embedding_provider(request: Request) -> EmbeddingProvider:
    return get_container(request).embedding_provider
