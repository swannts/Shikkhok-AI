from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator


class TutorHistoryMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


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
    data: dict[str, Any]
