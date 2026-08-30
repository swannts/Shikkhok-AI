from typing import Literal

from pydantic import BaseModel, Field

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

    raw_text: str | None = Field(default=None, description="Transcribed or entered homework text")
    prompt: str | None = Field(
        default=None, description="The original homework question or student note"
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
