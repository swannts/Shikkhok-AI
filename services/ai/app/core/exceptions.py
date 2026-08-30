from typing import Any


class AiServiceError(Exception):
    """Base exception for all Shikkhok AI Service domain errors."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_AI_ERROR",
        status_code: int = 500,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class InternalAuthenticationError(AiServiceError):
    def __init__(
        self,
        message: str = "Internal HMAC authentication failed",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            message=message, code="INTERNAL_AUTH_ERROR", status_code=401, details=details
        )


class InvalidAiRequestError(AiServiceError):
    def __init__(
        self, message: str = "Invalid AI generation request", details: dict[str, Any] | None = None
    ) -> None:
        super().__init__(
            message=message, code="INVALID_AI_REQUEST", status_code=400, details=details
        )


class ModerationBlockedError(AiServiceError):
    def __init__(
        self,
        message: str = "The request was blocked by content moderation policies",
        category: str = "general",
        safe_response_bn: str = "দুঃখিত, এই বিষয়টি নিয়ে আলোচনা করা সম্ভব নয়।",
    ) -> None:
        super().__init__(
            message=message,
            code="MODERATION_BLOCKED",
            status_code=400,
            details={"category": category, "safeResponseBn": safe_response_bn},
        )
        self.category = category
        self.safe_response_bn = safe_response_bn


class ProviderUnavailableError(AiServiceError):
    def __init__(
        self,
        message: str = "AI Provider is currently unavailable",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            message=message, code="PROVIDER_UNAVAILABLE", status_code=503, details=details
        )


class ProviderTimeoutError(AiServiceError):
    def __init__(
        self, message: str = "AI provider request timed out", details: dict[str, Any] | None = None
    ) -> None:
        super().__init__(message=message, code="PROVIDER_TIMEOUT", status_code=504, details=details)


class RetrievalError(AiServiceError):
    def __init__(
        self,
        message: str = "Error occurred during curriculum retrieval",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message=message, code="RETRIEVAL_ERROR", status_code=500, details=details)
