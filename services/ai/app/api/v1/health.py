import asyncio
import time

from fastapi import APIRouter, Depends

from app.core.config import settings
from app.core.dependencies import get_vector_store
from app.providers.vector_store.base import VectorStore
from app.schemas.common import DependencyStatus, HealthResponse, ReadyResponse

router = APIRouter(tags=["Health"])


@router.get("/live", response_model=HealthResponse)
@router.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    """Liveness probe: verifies process availability (no dependency checks)."""
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version="0.1.0",
    )


@router.get("/ready", response_model=ReadyResponse)
async def get_readiness(
    vector_store: VectorStore = Depends(get_vector_store),
) -> ReadyResponse:
    """Readiness probe: validates critical dependencies with bounded latency."""
    dependencies: list[DependencyStatus] = []

    # 1. Check Vector Store
    v_start = time.time()
    v_status = "ready"
    chunk_count = 0
    try:
        chunk_count = await asyncio.wait_for(vector_store.count(), timeout=5.0)
    except Exception as e:
        v_status = "unhealthy"
        v_details = {"error": str(e)}
    else:
        v_details = {
            "provider": vector_store.name,
            "indexedChunks": str(chunk_count),
        }

    dependencies.append(
        DependencyStatus(
            name="vector_store",
            status=v_status,
            latency_ms=round((time.time() - v_start) * 1000, 2),
            details=v_details,
        )
    )

    # 2. Check LLM Provider Configuration
    l_start = time.time()
    is_prod = settings.app_env == "production"
    if is_prod and (settings.llm_provider == "mock" or not settings.llm_api_key):
        l_status = "unhealthy"
    elif settings.llm_api_key or settings.app_env in ("test", "development"):
        l_status = "ready"
    else:
        l_status = "degraded"

    dependencies.append(
        DependencyStatus(
            name="llm_provider",
            status=l_status,
            latency_ms=round((time.time() - l_start) * 1000, 2),
            details={
                "provider": settings.llm_provider,
                "model": settings.llm_model,
                "hasKey": bool(settings.llm_api_key),
            },
        )
    )

    # 3. Check Embedding Provider
    e_start = time.time()
    effective_embed_key = settings.embedding_api_key or settings.llm_api_key
    if is_prod and (settings.embedding_provider == "mock" or not effective_embed_key):
        e_status = "unhealthy"
    elif effective_embed_key or settings.app_env in ("test", "development"):
        e_status = "ready"
    else:
        e_status = "degraded"

    dependencies.append(
        DependencyStatus(
            name="embedding_provider",
            status=e_status,
            latency_ms=round((time.time() - e_start) * 1000, 2),
            details={
                "provider": settings.embedding_provider,
                "model": settings.embedding_model,
                "hasKey": bool(effective_embed_key),
            },
        )
    )

    all_ready = all(d.status == "ready" for d in dependencies)

    return ReadyResponse(
        status="ready" if all_ready else "not_ready",
        service=settings.app_name,
        dependencies=dependencies,
    )
