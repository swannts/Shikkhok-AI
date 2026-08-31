import time
from collections.abc import AsyncIterator, Callable
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request, Response
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.core.container import build_service_container
from app.core.exceptions import AiServiceError
from app.core.logging import logger
from app.core.metrics import (
    get_metrics_content_type,
    get_prometheus_metrics,
    http_request_duration_seconds,
    http_requests_total,
)
from app.core.request_context import get_request_id, set_request_id


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    logger.info(
        f"Starting {settings.app_name} in {settings.app_env} mode on port {settings.port}",
        extra={"extra_data": {"env": settings.app_env, "llmProvider": settings.llm_provider}},
    )
    container = build_service_container()
    app.state.container = container
    yield
    logger.info(f"Shutting down {settings.app_name}")
    await container.aclose()


app = FastAPI(
    title="Shikkhok-AI Dedicated AI Service",
    description="High-performance internal AI execution service for Shikkhok-AI (Tutor, RAG, Citations)",
    version="0.1.0",
    docs_url=None if settings.app_env == "production" else "/docs",
    redoc_url=None if settings.app_env == "production" else "/redoc",
    openapi_url=None if settings.app_env == "production" else "/openapi.json",
    lifespan=lifespan,
)


@app.get("/metrics", include_in_schema=False)
async def prometheus_metrics() -> Response:
    """Expose Prometheus scrape metrics."""
    return Response(
        content=get_prometheus_metrics(),
        media_type=get_metrics_content_type(),
    )


@app.middleware("http")
async def request_id_and_metrics_middleware(
    request: Request,
    call_next: Callable[[Request], Any],
) -> Response:
    start_time = time.time()
    # Preserve incoming X-Request-Id or generate fresh UUID
    incoming_id = request.headers.get("X-Request-Id")
    active_req_id = set_request_id(incoming_id)

    response: Response = await call_next(request)
    duration = time.time() - start_time

    # Record Prometheus metrics
    endpoint = request.url.path
    method = request.method
    status_code = str(response.status_code)

    http_request_duration_seconds.labels(method=method, endpoint=endpoint).observe(duration)
    http_requests_total.labels(method=method, endpoint=endpoint, status_code=status_code).inc()

    response.headers["X-Request-Id"] = active_req_id
    return response


@app.exception_handler(AiServiceError)
async def ai_service_exception_handler(request: Request, exc: AiServiceError) -> JSONResponse:
    logger.warning(
        f"AiServiceError: [{exc.code}] {exc.message}",
        extra={"extra_data": {"code": exc.code, "status": exc.status_code, "details": exc.details}},
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
            "requestId": get_request_id(),
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    errors = exc.errors()
    logger.warning(
        "Request validation failed",
        extra={"extra_data": {"errorCount": len(errors)}},
    )
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid request parameters",
                "details": {"validationErrors": jsonable_encoder(errors)},
            },
            "requestId": get_request_id(),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(
        f"Unhandled server error: {exc}",
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred in the AI service.",
                "details": {},
            },
            "requestId": get_request_id(),
        },
    )


# Register API v1 routes
app.include_router(api_v1_router)
