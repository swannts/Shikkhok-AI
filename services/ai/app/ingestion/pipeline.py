import asyncio
import re
import time
import uuid
from pathlib import Path

from app.core.logging import logger
from app.ingestion.chunker import BengaliTextChunker
from app.ingestion.models import (
    DocumentMetadata,
    ExtractedPage,
    ExtractedSection,
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
            # Overlap and repeated source pages can produce identical content.
            # Keep one deterministic chunk per content hash before embedding.
            unique_chunks = []
            seen_hashes: set[str] = set()
            for chunk in chunks:
                if chunk.content_hash in seen_hashes:
                    continue
                seen_hashes.add(chunk.content_hash)
                unique_chunks.append(chunk)
            chunks = unique_chunks
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
                    curriculum_version=metadata.curriculum_version,
                    page_start=c.page_start,
                    page_end=c.page_end,
                    curriculum_year=metadata.curriculum_year,
                    medium=metadata.medium,
                    content_version=metadata.content_version,
                    embedding_provider=getattr(self.embedding_provider, "name", "unknown"),
                    embedding_model=getattr(self.embedding_provider, "model", "unknown"),
                    embedding_dimension=getattr(self.embedding_provider, "dimension", 0),
                    embedding_version=1,
                    content_hash=c.content_hash,
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
                sections=self._extract_sections(pages),
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
                # Preserve OCR-derived structure even when embeddings fail.
                # Chapter/lesson navigation is independent from vector search;
                # callers can persist this structure and mark indexing partial.
                status="partial",
                error=str(e),
                sections=self._extract_sections(pages),
            )

    def _extract_sections(self, pages: list[ExtractedPage]) -> list[ExtractedSection]:
        chapter_pattern = re.compile(r"^(?:অধ্যায়|অধ্যায়|chapter)\s*[-:.]?\s*(.*)$", re.I)
        lesson_pattern = re.compile(r"^(?:পাঠ|lesson|unit)\s*[-:.]?\s*(.*)$", re.I)
        sections: list[ExtractedSection] = []
        chapter = ""
        lesson = ""
        buffer: list[str] = []
        start = 1

        def flush(end: int) -> None:
            if chapter and lesson and " ".join(buffer).strip():
                sections.append(ExtractedSection(
                    chapter_title=chapter[:240], lesson_title=lesson[:240],
                    page_start=start, page_end=end, text=" ".join(buffer).strip(),
                ))

        for page in pages:
            for raw_line in page.text.splitlines():
                line = " ".join(raw_line.split()).strip()
                if not line:
                    continue
                chapter_match = chapter_pattern.match(line)
                lesson_match = lesson_pattern.match(line)
                if chapter_match:
                    flush(page.page_number - 1)
                    chapter = chapter_match.group(1).strip() or line
                    lesson = ""
                    buffer.clear()
                    start = page.page_number
                elif lesson_match:
                    # Some NCTB primary books are organized directly as
                    # numbered lessons and do not contain explicit chapter
                    # headings. Keep the source structure truthful by using a
                    # single navigation group rather than inventing chapters.
                    if not chapter:
                        chapter = "পাঠসমূহ"
                    flush(page.page_number - 1)
                    lesson = lesson_match.group(1).strip() or line
                    buffer.clear()
                    start = page.page_number
                elif chapter and lesson:
                    buffer.append(line)
        flush(pages[-1].page_number if pages else 1)
        return sections

    async def ingest_pdf_file(
        self,
        pdf_path: str | Path,
        metadata: DocumentMetadata,
    ) -> IngestionJobResult:
        pages = await asyncio.to_thread(self.pdf_parser.extract_pages_from_file, pdf_path)
        return await self.ingest_pages(pages, metadata)

    async def ingest_pdf_bytes(
        self,
        pdf_bytes: bytes,
        metadata: DocumentMetadata,
    ) -> IngestionJobResult:
        pages = await asyncio.to_thread(
            self.pdf_parser.extract_pages_from_bytes,
            pdf_bytes,
            metadata.source_book,
        )
        return await self.ingest_pages(pages, metadata)
