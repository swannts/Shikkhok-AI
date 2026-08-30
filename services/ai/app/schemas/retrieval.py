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
    content_version: int | None = None


class RetrievalFilter(BaseModel):
    query: str
    class_level: int | None = None
    subject_id: str | None = None
    chapter_id: str | None = None
    lesson_id: str | None = None
    top_k: int = Field(default=3, ge=1, le=10)
