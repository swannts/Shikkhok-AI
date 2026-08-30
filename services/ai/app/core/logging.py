import json
import logging
import sys
from datetime import UTC, datetime
from typing import Any

from app.core.request_context import get_request_id

SENSITIVE_KEYS = {
    "api_key",
    "apikey",
    "secret",
    "token",
    "password",
    "authorization",
    "internal_service_secret",
}


def mask_sensitive_data(data: Any) -> Any:
    if isinstance(data, dict):
        return {
            k: "***MASKED***" if k.lower() in SENSITIVE_KEYS else mask_sensitive_data(v)
            for k, v in data.items()
        }
    if isinstance(data, list):
        return [mask_sensitive_data(item) for item in data]
    return data


class StructuredJsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict[str, Any] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "requestId": get_request_id(),
        }

        # Include extra attributes if present
        extra = getattr(record, "extra_data", None)
        if extra and isinstance(extra, dict):
            log_entry["data"] = mask_sensitive_data(extra)

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry, ensure_ascii=False)


def setup_logging(debug: bool = False) -> logging.Logger:
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG if debug else logging.INFO)

    # Remove existing handlers
    for handler in list(root_logger.handlers):
        root_logger.removeHandler(handler)

    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(StructuredJsonFormatter())
    root_logger.addHandler(stream_handler)

    # Quiet external loggers
    logging.getLogger("uvicorn.access").handlers = [stream_handler]
    logging.getLogger("uvicorn.error").handlers = [stream_handler]

    return logging.getLogger("shikkhok-ai")


logger = setup_logging()
