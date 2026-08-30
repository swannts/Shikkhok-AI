from typing import Any

from fastapi import APIRouter, Depends, File, Form, UploadFile
from pydantic import BaseModel

from app.core.dependencies import get_embedding_provider, get_vector_store
from app.core.security import verify_service_hmac
from app.ingestion.models import DocumentMetadata, ExtractedPage, IngestionJobResult
from app.ingestion.pipeline import IngestionPipeline
from app.providers.embeddings.base import EmbeddingProvider
from app.providers.vector_store.base import VectorStore

router = APIRouter(prefix="/ingestion", tags=["Ingestion"])


class TextIngestRequest(BaseModel):
    metadata: DocumentMetadata
    pages: list[ExtractedPage]


class IngestionStats(BaseModel):
    total_chunks: int
    vector_store_name: str
    class_breakdown: dict[str, int]
    subject_breakdown: dict[str, int]


@router.post("/text", response_model=IngestionJobResult)
async def ingest_structured_text(
    payload: TextIngestRequest,
    _caller: str = Depends(verify_service_hmac),
    vector_store: VectorStore = Depends(get_vector_store),
    embedding_provider: EmbeddingProvider = Depends(get_embedding_provider),
) -> IngestionJobResult:
    """Ingests structured curriculum pages into the persistent vector store."""
    pipeline = IngestionPipeline(
        embedding_provider=embedding_provider,
        vector_store=vector_store,
    )
    return await pipeline.ingest_pages(pages=payload.pages, metadata=payload.metadata)


@router.post("/pdf", response_model=IngestionJobResult)
async def ingest_pdf_upload(
    file: UploadFile = File(...),
    class_level: int = Form(...),
    subject_id: str = Form(...),
    subject_title: str = Form(...),
    source_book: str = Form(...),
    chapter_id: str | None = Form(None),
    chapter_title: str | None = Form(None),
    lesson_id: str | None = Form(None),
    lesson_title: str | None = Form(None),
    medium: str = Form("bangla"),
    _caller: str = Depends(verify_service_hmac),
    vector_store: VectorStore = Depends(get_vector_store),
    embedding_provider: EmbeddingProvider = Depends(get_embedding_provider),
) -> IngestionJobResult:
    """Ingests an uploaded NCTB PDF textbook into the vector store."""
    pdf_bytes = await file.read()
    metadata = DocumentMetadata(
        class_level=class_level,
        subject_id=subject_id,
        subject_title=subject_title,
        source_book=source_book,
        chapter_id=chapter_id,
        chapter_title=chapter_title,
        lesson_id=lesson_id,
        lesson_title=lesson_title,
        medium="bangla" if medium == "bangla" else "english",
    )
    pipeline = IngestionPipeline(
        embedding_provider=embedding_provider,
        vector_store=vector_store,
    )
    return await pipeline.ingest_pdf_bytes(pdf_bytes=pdf_bytes, metadata=metadata)


@router.get("/stats", response_model=IngestionStats)
async def get_ingestion_stats(
    _caller: str = Depends(verify_service_hmac),
    vector_store: VectorStore = Depends(get_vector_store),
) -> IngestionStats:
    """Returns indexed chunk statistics from the vector store."""
    total = await vector_store.count()
    class_breakdown: dict[str, int] = {}
    subject_breakdown: dict[str, int] = {}

    chunks = getattr(vector_store, "chunks", [])
    for chunk in chunks:
        c_lvl = f"Class {chunk.get('class_level') or 'Unknown'}"
        class_breakdown[c_lvl] = class_breakdown.get(c_lvl, 0) + 1

        subj = chunk.get("subject_id") or "unknown"
        subject_breakdown[subj] = subject_breakdown.get(subj, 0) + 1

    return IngestionStats(
        total_chunks=total,
        vector_store_name=vector_store.name,
        class_breakdown=class_breakdown,
        subject_breakdown=subject_breakdown,
    )


@router.delete("/book/{book_id}")
async def delete_book_chunks(
    book_id: str,
    _caller: str = Depends(verify_service_hmac),
    vector_store: VectorStore = Depends(get_vector_store),
) -> dict[str, Any]:
    """Deletes all indexed chunks for a specific textbook source."""
    deleted = await vector_store.delete_by_book_id(book_id)
    return {"status": "ok", "deleted_chunks": deleted, "book_id": book_id}
