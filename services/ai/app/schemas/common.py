from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "shikkhok-ai-service"
    version: str = "0.1.0"
    timestamp: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())


class DependencyStatus(BaseModel):
    name: str
    status: str
    latency_ms: float
    details: dict[str, Any] = Field(default_factory=dict)


class ReadyResponse(BaseModel):
    status: str = "ready"
    service: str = "shikkhok-ai-service"
    dependencies: list[DependencyStatus] = Field(default_factory=list)


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: dict[str, Any] = Field(default_factory=dict)


class ErrorResponse(BaseModel):
    error: ErrorDetail
    requestId: str
