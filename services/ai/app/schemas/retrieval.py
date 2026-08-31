from pydantic import BaseModel, Field


class RetrievedChunk(BaseModel):
    chunk_id: str
    text: str
    score: float

    book_id: str | None = None
    book_name: str | None = None

    class_level: int | None = None
    subject_id: str | None = None
    chapter_id: str | None = None
    lesson_id: str | None = None

    subject_title: str | None = None
    chapter_title: str | None = None
    lesson_title: str | None = None

    page_start: int | None = None
    page_end: int | None = None
    curriculum_version: str | None = Field(default="2024-NCTB")
    academic_year: int | None = Field(default=2026)
    curriculum_year: int | None = None
    medium: str | None = None
    content_version: int | None = None
    embedding_provider: str | None = None
    embedding_model: str | None = None
    embedding_dimension: int | None = None
    embedding_version: int | None = None
    content_hash: str | None = None


class RetrievalFilter(BaseModel):
    query: str
    class_level: int | None = None
    subject_id: str | None = None
    chapter_id: str | None = None
    lesson_id: str | None = None
    curriculum_version: str | None = None
    academic_year: int | None = None
    curriculum_year: int | None = None
    medium: str | None = None
    top_k: int = Field(default=3, ge=1, le=10)
    min_score: float = Field(default=0.35, ge=0.0, le=1.0)
