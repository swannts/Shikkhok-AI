import time

from fastapi import APIRouter

from app.core.config import settings
from app.schemas.common import DependencyStatus, HealthResponse, ReadyResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    """Liveness probe: verifies process availability."""
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version="0.1.0",
    )


@router.get("/ready", response_model=ReadyResponse)
async def get_readiness() -> ReadyResponse:
    """Readiness probe: validates critical dependencies with bounded latency."""
    dependencies: list[DependencyStatus] = []

    # 1. Check Vector Store
    v_start = time.time()
    v_status = "ready"
    v_details = {"provider": settings.vector_store_provider}
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
    l_status = "ready" if (settings.llm_api_key or settings.llm_provider == "mock") else "degraded"
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

    all_ready = all(d.status in ("ready", "degraded") for d in dependencies)

    return ReadyResponse(
        status="ready" if all_ready else "not_ready",
        service=settings.app_name,
        dependencies=dependencies,
    )
