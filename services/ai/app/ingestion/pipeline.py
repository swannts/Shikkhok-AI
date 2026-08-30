import time
import uuid
from pathlib import Path
from app.core.logging import logger
from app.ingestion.chunker import BengaliTextChunker
from app.ingestion.models import (
    DocumentMetadata,
    ExtractedPage,
    IngestionJobResult,
)
from app.ingestion.pdf_parser import NctbPdfParser
from app.providers.embeddings.base import EmbeddingProvider
from app.providers.vector_store.base import VectorStore
from app.schemas.retrieval import RetrievedChunk


class IngestionPipeline:
    def __init__(
        self,
        embedding_provider: EmbeddingProvider,
        vector_store: VectorStore,
        chunker: BengaliTextChunker | None = None,
        pdf_parser: NctbPdfParser | None = None,
    ) -> None:
        self.embedding_provider = embedding_provider
        self.vector_store = vector_store
        self.chunker = chunker or BengaliTextChunker()
        self.pdf_parser = pdf_parser or NctbPdfParser()

    async def ingest_pages(
        self,
        pages: list[ExtractedPage],
        metadata: DocumentMetadata,
    ) -> IngestionJobResult:
        start_time = time.time()
        job_id = f"job_{uuid.uuid4().hex[:10]}"

        if not pages:
            return IngestionJobResult(
                job_id=job_id,
                source_name=metadata.source_book,
                pages_extracted=0,
                chunks_created=0,
                vectors_generated=0,
                duration_ms=0,
                status="failed",
                error="No text pages provided for ingestion",
            )

        try:
            # 1. Chunk pages
            chunks = self.chunker.chunk_pages(pages=pages, metadata=metadata)
            if not chunks:
                return IngestionJobResult(
                    job_id=job_id,
                    source_name=metadata.source_book,
                    pages_extracted=len(pages),
                    chunks_created=0,
                    vectors_generated=0,
                    duration_ms=int((time.time() - start_time) * 1000),
                    status="failed",
                    error="Chunking produced zero content chunks",
                )

            # 2. Batch calculate embeddings
            chunk_texts = [c.text for c in chunks]
            vectors = await self.embedding_provider.embed_documents(chunk_texts)

            # 3. Convert to RetrievedChunk instances for vector indexing
            retrieved_chunks = [
                RetrievedChunk(
                    chunk_id=c.chunk_id,
                    text=c.text,
                    score=1.0,
                    book_id=metadata.book_id or metadata.source_book,
                    book_name=metadata.source_book,
                    class_level=metadata.class_level,
                    subject_id=metadata.subject_id,
                    chapter_id=metadata.chapter_id,
                    lesson_id=metadata.lesson_id,
                    subject_title=metadata.subject_title,
                    chapter_title=metadata.chapter_title,
                    lesson_title=metadata.lesson_title,
                    page_start=c.page_start,
                    page_end=c.page_end,
                    content_version=metadata.content_version,
                )
                for c in chunks
            ]

            # 4. Upsert to Vector Store
            await self.vector_store.upsert_chunks(chunks=retrieved_chunks, vectors=vectors)

            duration_ms = int((time.time() - start_time) * 1000)
            logger.info(
                f"Ingestion job {job_id} succeeded: {len(chunks)} chunks indexed into {self.vector_store.name} in {duration_ms}ms"
            )

            return IngestionJobResult(
                job_id=job_id,
                source_name=metadata.source_book,
                pages_extracted=len(pages),
                chunks_created=len(chunks),
                vectors_generated=len(vectors),
                duration_ms=duration_ms,
                status="success",
            )
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error(f"Ingestion job {job_id} failed: {e}", exc_info=True)
            return IngestionJobResult(
                job_id=job_id,
                source_name=metadata.source_book,
                pages_extracted=len(pages),
                chunks_created=0,
                vectors_generated=0,
                duration_ms=duration_ms,
                status="failed",
                error=str(e),
            )

    async def ingest_pdf_file(
        self,
        pdf_path: str | Path,
        metadata: DocumentMetadata,
    ) -> IngestionJobResult:
        pages = self.pdf_parser.extract_pages_from_file(pdf_path)
        return await self.ingest_pages(pages, metadata)

    async def ingest_pdf_bytes(
        self,
        pdf_bytes: bytes,
        metadata: DocumentMetadata,
    ) -> IngestionJobResult:
        pages = self.pdf_parser.extract_pages_from_bytes(pdf_bytes, metadata.source_book)
        return await self.ingest_pages(pages, metadata)
