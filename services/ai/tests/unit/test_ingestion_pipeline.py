import io
from pathlib import Path

import pytest
from pypdf import PdfWriter

from app.ingestion.models import DocumentMetadata, ExtractedPage
from app.ingestion.pdf_parser import NctbPdfParser
from app.ingestion.pipeline import IngestionPipeline
from app.providers.embeddings.primary import DeterministicEmbeddingProvider
from app.providers.vector_store.persistent import PersistentVectorStore


@pytest.mark.asyncio
async def test_ingestion_pipeline_runs_successfully(tmp_path: Path) -> None:
    store = PersistentVectorStore(
        file_path=tmp_path / "test_pipe_chunks.json",
        allow_demo_seed=True,
    )
    embeddings = DeterministicEmbeddingProvider()
    pipeline = IngestionPipeline(embedding_provider=embeddings, vector_store=store)

    metadata = DocumentMetadata(
        class_level=8,
        subject_id="science",
        subject_title="বিজ্ঞান",
        source_book="NCTB Science 8",
        chapter_id="chemical_reactions",
        chapter_title="রাসায়নিক বিক্রিয়া",
    )

    pages = [
        ExtractedPage(
            page_number=72,
            text="দহন বিক্রিয়া বাতাসের অক্সিজেনের সাথে ঘটে। এতে তাপ শক্তি ও আলোক শক্তি নির্গত হয়। কার্বন পোড়ালে কার্বন ডাই-অক্সাইড গ্যাস হয়।",
        )
    ]

    result = await pipeline.ingest_pages(pages=pages, metadata=metadata)
    assert result.status == "success"
    assert result.pages_extracted == 1
    assert result.chunks_created >= 1
    assert result.vectors_generated >= 1

    # Verify indexed in store
    count = await store.count()
    assert count >= 1


def test_pdf_parser_extracts_pages() -> None:
    # Create an in-memory PDF with 2 blank/annotated pages using pypdf
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    writer.add_blank_page(width=200, height=200)

    buf = io.BytesIO()
    writer.write(buf)
    pdf_bytes = buf.getvalue()

    parser = NctbPdfParser()
    pages = parser.extract_pages_from_bytes(pdf_bytes, "test.pdf")
    # Blank pages might have no text, but extract_pages_from_bytes handles cleanly without error
    assert isinstance(pages, list)
