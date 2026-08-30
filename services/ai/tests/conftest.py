import time

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.security import compute_hmac_signature
from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def make_hmac_headers(
    path: str,
    body_bytes: bytes,
    method: str = "POST",
    service_name: str = "nestjs-backend",
    secret: str | None = None,
    timestamp: str | None = None,
    request_id: str = "req-test-12345",
) -> dict[str, str]:
    if secret is None:
        secret = settings.internal_service_secret
    if timestamp is None:
        timestamp = str(int(time.time()))

    sig = compute_hmac_signature(
        secret=secret,
        timestamp=timestamp,
        method=method,
        path=path,
        body=body_bytes,
    )

    return {
        "X-Service-Name": service_name,
        "X-Service-Timestamp": timestamp,
        "X-Request-Id": request_id,
        "X-Service-Signature": sig,
    }
