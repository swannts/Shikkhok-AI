import hashlib
import hmac
import time

from fastapi import Header, Request

from app.core.config import settings
from app.core.exceptions import InternalAuthenticationError
from app.core.request_context import set_request_id


def compute_body_sha256(body: bytes) -> str:
    return hashlib.sha256(body).hexdigest()


def compute_hmac_signature(
    secret: str,
    timestamp: str,
    method: str,
    path: str,
    body: bytes,
) -> str:
    body_hash = compute_body_sha256(body)
    canonical = f"{timestamp}\n{method.upper()}\n{path}\n{body_hash}"
    return hmac.new(secret.encode("utf-8"), canonical.encode("utf-8"), hashlib.sha256).hexdigest()


async def verify_service_hmac(
    request: Request,
    x_service_name: str = Header(..., alias="X-Service-Name"),
    x_service_timestamp: str = Header(..., alias="X-Service-Timestamp"),
    x_service_signature: str = Header(..., alias="X-Service-Signature"),
    x_request_id: str | None = Header(None, alias="X-Request-Id"),
) -> str:
    # Propagate or generate request ID
    set_request_id(x_request_id)

    # 1. Verify service name
    if x_service_name not in settings.allowed_service_names:
        raise InternalAuthenticationError(
            message=f"Service '{x_service_name}' is not authorized to access AI Service",
            details={"serviceName": x_service_name},
        )

    # 2. Verify timestamp freshness (Replay Protection)
    try:
        req_timestamp = int(x_service_timestamp)
    except ValueError:
        raise InternalAuthenticationError(
            message="Invalid X-Service-Timestamp header: must be unix timestamp in seconds",
            details={"timestamp": x_service_timestamp},
        ) from None

    current_time = int(time.time())
    skew = abs(current_time - req_timestamp)
    if skew > settings.allowed_clock_skew_seconds:
        raise InternalAuthenticationError(
            message=f"Timestamp expired or excessive clock drift ({skew}s > {settings.allowed_clock_skew_seconds}s)",
            details={"driftSeconds": skew, "maxSkew": settings.allowed_clock_skew_seconds},
        )

    # 3. Read body bytes
    body_bytes = await request.body()

    # 4. Verify signature using constant-time comparison
    expected_signature = compute_hmac_signature(
        secret=settings.internal_service_secret,
        timestamp=x_service_timestamp,
        method=request.method,
        path=request.url.path,
        body=body_bytes,
    )

    if not hmac.compare_digest(expected_signature, x_service_signature.strip()):
        raise InternalAuthenticationError(
            message="Invalid HMAC signature for service request",
            details={"serviceName": x_service_name},
        )

    return x_service_name
