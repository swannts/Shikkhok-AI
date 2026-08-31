from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.schemas.citation import CitationPayload


class HomeworkCorrection(BaseModel):
    original: str = Field(
        ..., description="Student's original step or expression containing an error"
    )
    corrected: str = Field(..., description="The correct step, formula, or expression")
    explanation: str = Field(
        ..., description="Constructive pedagogical reason explaining the correction"
    )


class HomeworkEvaluationRequest(BaseModel):
    submission_id: str = Field(..., description="Unique homework submission identifier")
    student_id: str = Field(..., description="Identifier of the student who submitted the homework")
    language: Literal["bn", "en"] = Field(default="bn", description="Preferred response language")

    raw_text: str | None = Field(
        default=None,
        max_length=8000,
        description="Transcribed or entered homework text",
    )
    prompt: str | None = Field(
        default=None,
        max_length=4000,
        description="The original homework question or student note",
    )
    image_urls: list[str] = Field(
        default_factory=list, description="URLs to handwritten homework images"
    )

    class_level: int | None = Field(
        default=None, ge=1, le=12, description="Student grade level (1-12)"
    )
    subject_id: str | None = Field(default=None, description="Subject ID, e.g. 'mathematics'")
    chapter_id: str | None = Field(default=None, description="Chapter ID")
    lesson_id: str | None = Field(default=None, description="Lesson ID")

    subject_title: str | None = Field(default=None, description="Subject name in readable text")
    chapter_title: str | None = Field(default=None, description="Chapter title")
    lesson_title: str | None = Field(default=None, description="Lesson title")

    @field_validator("raw_text", "prompt", mode="before")
    @classmethod
    def trim_text_fields(cls, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None

    @model_validator(mode="after")
    def validate_submission_payload(self) -> "HomeworkEvaluationRequest":
        if not self.raw_text and not self.image_urls:
            raise ValueError("Homework submission must include raw text or at least one image URL")

        if len(self.image_urls) > 10:
            raise ValueError("Homework submission cannot include more than 10 images")

        total_chars = (
            len(self.raw_text or "")
            + len(self.prompt or "")
            + sum(len(url) for url in self.image_urls)
        )
        if total_chars > 20000:
            raise ValueError("Homework submission payload is too large")

        return self


class HomeworkEvaluationResponse(BaseModel):
    submission_id: str
    score: float = Field(..., ge=0, le=100, description="Overall evaluated score from 0 to 100")
    summary: str = Field(..., description="Overall constructive evaluation summary")
    strengths: list[str] = Field(
        default_factory=list, description="Observed strengths in student work"
    )
    weaknesses: list[str] = Field(
        default_factory=list, description="Key areas of improvement or errors"
    )
    corrections: list[HomeworkCorrection] = Field(
        default_factory=list,
        description="Specific step-by-step corrections",
    )
    recommendations: list[str] = Field(
        default_factory=list,
        description="Suggested textbook practice and study actions",
    )
    citations: list[CitationPayload] = Field(
        default_factory=list,
        description="Grounding citations to NCTB textbook references",
    )
    provider: str = "gemini"
    model: str = "gemini-1.5-pro"
    fallback_used: bool = False
    duration_ms: int = 0
