from dataclasses import dataclass
from typing import Literal
from pydantic import BaseModel, Field


class DocumentMetadata(BaseModel):
    curriculum_year: int = Field(default=2026, description="NCTB curriculum academic year")
    class_level: int = Field(..., ge=1, le=12, description="Target educational class grade (1-12)")
    medium: Literal["bangla", "english"] = Field(default="bangla", description="Instruction medium")

    subject_id: str = Field(..., description="Subject identifier, e.g. 'mathematics'")
    subject_title: str = Field(..., description="Human-readable subject name, e.g. 'গণিত'")

    chapter_id: str | None = None
    chapter_title: str | None = None

    lesson_id: str | None = None
    lesson_title: str | None = None

    source_book: str = Field(..., description="Name of the textbook or document source")
    book_id: str | None = None
    content_version: int = 1


@dataclass
class ExtractedPage:
    page_number: int
    text: str


class IngestionChunk(BaseModel):
    chunk_id: str
    text: str
    page_start: int
    page_end: int
    char_count: int
    metadata: DocumentMetadata
    content_hash: str


class IngestionJobResult(BaseModel):
    job_id: str
    source_name: str
    pages_extracted: int
    chunks_created: int
    vectors_generated: int
    duration_ms: int
    status: Literal["success", "partial", "failed"]
    error: str | None = None
