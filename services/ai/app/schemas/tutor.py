from typing import Any, Literal

from pydantic import BaseModel, Field


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

    subject_id: str | None = None
    chapter_id: str | None = None
    lesson_id: str | None = None

    subject_title: str | None = None
    chapter_title: str | None = None
    lesson_title: str | None = None

    history: list[TutorHistoryMessage] = Field(default_factory=list)


class TutorStreamEvent(BaseModel):
    event: Literal["metadata", "delta", "citation", "done", "error"]
    data: dict[str, Any]
