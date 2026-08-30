from dataclasses import dataclass

import httpx

from app.core.config import Settings, settings
from app.core.logging import logger
from app.providers.embeddings.base import EmbeddingProvider
from app.providers.embeddings.gemini import GeminiEmbeddingProvider
from app.providers.embeddings.primary import DeterministicEmbeddingProvider
from app.providers.llm.base import LlmProvider
from app.providers.llm.gemini import GeminiLlmProvider
from app.providers.llm.mock import MockLlmProvider
from app.providers.vector_store.base import VectorStore
from app.providers.vector_store.memory import InMemoryVectorStore
from app.providers.vector_store.persistent import PersistentVectorStore
from app.schemas.vector_store import VectorStoreEmbeddingMetadata
from app.services.citation_service import CitationService
from app.services.homework_service import HomeworkService
from app.services.model_router import ModelRouter
from app.services.moderation_service import ModerationService
from app.services.output_safety import OutputSafetyService
from app.services.rag_service import RagService
from app.services.tutor_service import TutorService


@dataclass
class AiServiceContainer:
    http_client: httpx.AsyncClient
    llm_provider: LlmProvider
    fallback_provider: LlmProvider | None
    embedding_provider: EmbeddingProvider
    vector_store: VectorStore
    model_router: ModelRouter
    rag_service: RagService
    moderation_service: ModerationService
    citation_service: CitationService
    output_safety_service: OutputSafetyService
    tutor_service: TutorService
    homework_service: HomeworkService

    async def aclose(self) -> None:
        """Gracefully shutdown and release all network resources."""
        if not self.http_client.is_closed:
            await self.http_client.aclose()
        logger.info("Closed shared HTTP client and released AI service container resources.")


def build_service_container(custom_settings: Settings | None = None) -> AiServiceContainer:
    cfg = custom_settings or settings

    # 1. Validate environment & safety rules first
    cfg.validate_runtime_safety()

    # 2. Shared reusable HTTP client
    http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(
            connect=5.0,
            read=cfg.llm_timeout_seconds,
            write=10.0,
            pool=30.0,
        )
    )

    # 3. LLM Providers
    primary_llm: LlmProvider
    fallback_llm: LlmProvider | None = None

    if cfg.llm_provider == "gemini":
        if not cfg.llm_api_key:
            raise RuntimeError(f"Missing LLM_API_KEY for {cfg.llm_provider} in {cfg.app_env}")
        primary_llm = GeminiLlmProvider(
            api_key=cfg.llm_api_key,
            model=cfg.llm_model,
            timeout_seconds=cfg.llm_timeout_seconds,
            client=http_client,
        )
    elif cfg.llm_provider == "mock":
        if not cfg.mock_providers_allowed():
            raise RuntimeError(f"Mock LLM is strictly prohibited in {cfg.app_env}")
        primary_llm = MockLlmProvider(name="mock-primary", model=cfg.llm_model)
    else:
        raise RuntimeError(f"Unsupported LLM provider: {cfg.llm_provider}")

    # Fallback LLM (Real fallback only, NEVER mock in production)
    if cfg.llm_fallback_provider == "gemini":
        if not cfg.llm_fallback_api_key:
            raise RuntimeError(
                f"Missing LLM_FALLBACK_API_KEY for {cfg.llm_fallback_provider} in {cfg.app_env}"
            )
        fallback_llm = GeminiLlmProvider(
            api_key=cfg.llm_fallback_api_key,
            model=cfg.llm_fallback_model or "gemini-1.5-flash",
            timeout_seconds=cfg.llm_timeout_seconds,
            client=http_client,
        )
    elif cfg.llm_fallback_provider != "none":
        raise RuntimeError(f"Unsupported fallback LLM provider: {cfg.llm_fallback_provider}")

    model_router = ModelRouter(primary=primary_llm, fallback=fallback_llm)

    # 4. Embedding Provider
    embedding_provider: EmbeddingProvider
    effective_embed_key = cfg.embedding_api_key or cfg.llm_api_key

    if cfg.embedding_provider == "gemini":
        if not effective_embed_key:
            raise RuntimeError(
                f"No API key configured for embedding provider {cfg.embedding_provider}"
            )
        embedding_provider = GeminiEmbeddingProvider(
            api_key=effective_embed_key,
            model=cfg.embedding_model,
            client=http_client,
        )
    elif cfg.embedding_provider == "mock":
        if not cfg.mock_providers_allowed():
            raise RuntimeError(f"Deterministic mock embeddings forbidden in {cfg.app_env}")
        logger.info("Using DeterministicEmbeddingProvider for test/development")
        embedding_provider = DeterministicEmbeddingProvider()
    else:
        raise RuntimeError(f"Unsupported embedding provider: {cfg.embedding_provider}")

    vector_embedding_metadata = VectorStoreEmbeddingMetadata(
        provider=getattr(embedding_provider, "name", "unknown"),
        model=getattr(embedding_provider, "model", getattr(embedding_provider, "name", "unknown")),
        dimension=getattr(embedding_provider, "dimension", 0),
    )

    # 5. Vector Store
    vector_store: VectorStore
    if cfg.vector_store_provider == "memory" or cfg.app_env == "test":
        vector_store = InMemoryVectorStore(embedding_metadata=vector_embedding_metadata)
    else:
        vector_store = PersistentVectorStore(
            file_path=cfg.vector_store_path,
            embedding_metadata=vector_embedding_metadata,
        )

    # 6. Core Subservices
    moderation_service = ModerationService()
    citation_service = CitationService()
    output_safety_service = OutputSafetyService()
    rag_service = RagService(embedding_provider=embedding_provider, vector_store=vector_store)

    tutor_service = TutorService(
        moderation_service=moderation_service,
        rag_service=rag_service,
        citation_service=citation_service,
        output_safety_service=output_safety_service,
        model_router=model_router,
        grounding_mode=cfg.tutor_grounding_mode,
    )

    homework_service = HomeworkService(
        moderation_service=moderation_service,
        rag_service=rag_service,
        citation_service=citation_service,
        model_router=model_router,
    )

    return AiServiceContainer(
        http_client=http_client,
        llm_provider=primary_llm,
        fallback_provider=fallback_llm,
        embedding_provider=embedding_provider,
        vector_store=vector_store,
        model_router=model_router,
        rag_service=rag_service,
        moderation_service=moderation_service,
        citation_service=citation_service,
        output_safety_service=output_safety_service,
        tutor_service=tutor_service,
        homework_service=homework_service,
    )
