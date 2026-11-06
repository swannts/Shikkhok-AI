from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class TutorHistoryMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class TutorMetadataPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    grounded: bool
    retrievalUnavailable: bool
    groundingMode: Literal["grounded", "ungrounded", "degraded"] | None = None
    provider: str | None = None
    model: str | None = None
    retrievalLatencyMs: int | None = Field(default=None, ge=0)
    retrievedChunkCount: int | None = Field(default=None, ge=0)
    citationCount: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def grounding_flags_are_consistent(self) -> "TutorMetadataPayload":
        if self.retrievalUnavailable and self.grounded:
            raise ValueError("unavailable retrieval cannot be marked grounded")
        if self.groundingMode == "grounded" and not self.grounded:
            raise ValueError("groundingMode grounded requires grounded=true")
        if self.groundingMode == "degraded" and not self.retrievalUnavailable:
            raise ValueError("degraded mode requires retrievalUnavailable=true")
        return self


class TutorDeltaPayload(BaseModel):
    text: str


class TutorCitationPayload(BaseModel):
    citationId: str = Field(min_length=1)
    sourceId: str = Field(min_length=1)
    sourceBook: str = Field(min_length=1)
    textChunk: str = Field(min_length=1)
    classLevel: int | None = Field(default=None, ge=1, le=12)
    pageStart: int | None = Field(default=None, ge=1)
    pageEnd: int | None = Field(default=None, ge=1)
    subject: str | None = None
    chapter: str | None = None
    lesson: str | None = None

    @model_validator(mode="after")
    def page_range_is_ordered(self) -> "TutorCitationPayload":
        if self.pageStart is not None and self.pageEnd is not None and self.pageEnd < self.pageStart:
            raise ValueError("citation pageEnd cannot precede pageStart")
        return self


class TutorDonePayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    messageId: str | None = None
    conversationId: str | None = None
    finishReason: str | None = None


class TutorErrorPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    code: str = Field(min_length=1)
    message: str = Field(min_length=1)


class TutorGenerationRequest(BaseModel):
    request_id: str = Field(..., description="Unique request tracing ID")
    user_id: str = Field(..., description="Authenticated student user ID")
    conversation_id: str = Field(..., description="Conversation ObjectId")

    message: str = Field(..., min_length=1, max_length=4000, description="Student query")
    language: Literal["bn", "en"] = Field(default="bn", description="Instruction medium")

    class_level: int | None = Field(None, ge=1, le=12, description="Student grade level (1-12)")
    curriculum_year: int | None = Field(
        default=None, ge=2000, le=2100, description="Curriculum year for grounding scope"
    )
    medium: Literal["bangla", "english"] | None = Field(
        default=None, description="Curriculum medium for grounding scope"
    )

    subject_id: str | None = None
    chapter_id: str | None = None
    lesson_id: str | None = None

    subject_title: str | None = None
    chapter_title: str | None = None
    lesson_title: str | None = None

    history: list[TutorHistoryMessage] = Field(default_factory=list)

    @field_validator("message", mode="before")
    @classmethod
    def trim_message(cls, value: str) -> str:
        if not isinstance(value, str):
            return value
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Tutor message cannot be empty")
        return trimmed

    @model_validator(mode="after")
    def validate_history(self) -> "TutorGenerationRequest":
        if len(self.history) > 12:
            raise ValueError("Tutor history cannot exceed 12 messages")

        total_history_chars = sum(len(message.content) for message in self.history)
        if total_history_chars > 12000:
            raise ValueError("Tutor history is too large")

        return self


class TutorStreamEvent(BaseModel):
    event: Literal["metadata", "delta", "citation", "done", "error"]
    data: dict[str, object]

    @model_validator(mode="after")
    def validate_event_payload(self) -> "TutorStreamEvent":
        payload_models = {
            "metadata": TutorMetadataPayload,
            "delta": TutorDeltaPayload,
            "citation": TutorCitationPayload,
            "done": TutorDonePayload,
            "error": TutorErrorPayload,
        }
        payload_models[self.event].model_validate(self.data)
        return self
