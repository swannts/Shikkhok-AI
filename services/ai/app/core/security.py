import hashlib
import hmac
import time

from fastapi import Header, Request

from app.core.config import settings
from app.core.exceptions import InternalAuthenticationError
from app.core.logging import logger
from app.core.request_context import set_request_id

# Short-term in-memory replay protection cache: requestId -> timestamp
_seen_request_ids: dict[str, int] = {}


def _cleanup_old_request_ids(current_time: int, max_skew: int) -> None:
    cutoff = current_time - (max_skew * 2)
    to_delete = [rid for rid, ts in _seen_request_ids.items() if ts < cutoff]
    for rid in to_delete:
        del _seen_request_ids[rid]


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
    is_prod = settings.app_env == "production"

    # 1. Verify service name
    if x_service_name not in settings.allowed_service_names:
        logger.warning(
            f"Unauthorized service name attempt: '{x_service_name}'",
            extra={"extra_data": {"service": x_service_name}},
        )
        msg = (
            "Service authentication failed"
            if is_prod
            else f"Service '{x_service_name}' is not authorized to access AI Service"
        )
        raise InternalAuthenticationError(message=msg)

    # 2. Verify timestamp freshness (Replay Protection)
    try:
        req_timestamp = int(x_service_timestamp)
    except ValueError:
        msg = (
            "Service authentication failed"
            if is_prod
            else "Invalid X-Service-Timestamp header: must be unix timestamp in seconds"
        )
        raise InternalAuthenticationError(message=msg) from None

    current_time = int(time.time())
    skew = abs(current_time - req_timestamp)
    if skew > settings.allowed_clock_skew_seconds:
        logger.warning(
            f"Excessive timestamp skew ({skew}s) from {x_service_name}",
            extra={"extra_data": {"skew": skew, "service": x_service_name}},
        )
        msg = (
            "Service authentication failed: expired timestamp"
            if is_prod
            else f"Timestamp expired or excessive clock drift ({skew}s > {settings.allowed_clock_skew_seconds}s)"
        )
        raise InternalAuthenticationError(message=msg)

    # 3. Check for replay with same X-Request-Id (enabled in production/staging/dev, bypassed in test)
    if x_request_id and settings.app_env != "test":
        if x_request_id in _seen_request_ids:
            logger.warning(f"Replay attack detected: duplicate X-Request-Id {x_request_id}")
            raise InternalAuthenticationError(
                message="Duplicate request detected (replay protection)"
            )
        _seen_request_ids[x_request_id] = current_time
        if len(_seen_request_ids) > 1000:
            _cleanup_old_request_ids(current_time, settings.allowed_clock_skew_seconds)

    # 4. Read body bytes
    body_bytes = await request.body()

    # 5. Verify signature using constant-time comparison
    expected_signature = compute_hmac_signature(
        secret=settings.internal_service_secret,
        timestamp=x_service_timestamp,
        method=request.method,
        path=request.url.path,
        body=body_bytes,
    )

    if not hmac.compare_digest(expected_signature, x_service_signature.strip()):
        logger.warning(
            f"Invalid HMAC signature for service '{x_service_name}'",
            extra={"extra_data": {"service": x_service_name, "path": request.url.path}},
        )
        raise InternalAuthenticationError(message="Invalid HMAC signature for service request")

    return x_service_name
