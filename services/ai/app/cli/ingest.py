import argparse
import asyncio
import json
import sys
from pathlib import Path

from app.ingestion.models import DocumentMetadata, ExtractedPage
from app.ingestion.pipeline import IngestionPipeline
from app.providers.embeddings.primary import DeterministicEmbeddingProvider
from app.providers.vector_store.persistent import PersistentVectorStore


async def run_ingest(args: argparse.Namespace) -> None:
    embedding_provider = DeterministicEmbeddingProvider()
    vector_store = PersistentVectorStore()
    pipeline = IngestionPipeline(
        embedding_provider=embedding_provider,
        vector_store=vector_store,
    )

    metadata = DocumentMetadata(
        class_level=args.class_level,
        subject_id=args.subject_id,
        subject_title=args.subject_title,
        source_book=args.source_book or (Path(args.file).name if args.file else "NCTB Document"),
        chapter_id=args.chapter_id,
        chapter_title=args.chapter_title,
        lesson_id=args.lesson_id,
        lesson_title=args.lesson_title,
        medium="bangla" if args.medium == "bangla" else "english",
    )

    if args.file:
        file_path = Path(args.file)
        if not file_path.exists():
            print(f"Error: File not found: {file_path}", file=sys.stderr)
            sys.exit(1)

        if file_path.suffix.lower() == ".pdf":
            print(f"Ingesting PDF: {file_path}...")
            result = await pipeline.ingest_pdf_file(file_path, metadata)
        elif file_path.suffix.lower() == ".json":
            print(f"Ingesting structured JSON: {file_path}...")
            with open(file_path, encoding="utf-8") as f:
                data = json.load(f)
                pages = [
                    ExtractedPage(page_number=p.get("page_number", idx + 1), text=p.get("text", ""))
                    for idx, p in enumerate(data.get("pages", []))
                ]
            result = await pipeline.ingest_pages(pages, metadata)
        else:
            print(f"Unsupported file format: {file_path.suffix}", file=sys.stderr)
            sys.exit(1)

        print("\n=== Ingestion Result ===")
        print(f"Status:            {result.status.upper()}")
        print(f"Job ID:            {result.job_id}")
        print(f"Pages Extracted:   {result.pages_extracted}")
        print(f"Chunks Created:    {result.chunks_created}")
        print(f"Vectors Generated: {result.vectors_generated}")
        print(f"Duration:          {result.duration_ms}ms")
        if result.error:
            print(f"Error:             {result.error}", file=sys.stderr)
            sys.exit(1)

    print("\nIngestion completed successfully!")


def main() -> None:
    parser = argparse.ArgumentParser(description="Shikkhok-AI NCTB Curriculum Ingestion CLI")
    parser.add_argument("--file", type=str, help="Path to PDF or JSON curriculum file to ingest")
    parser.add_argument("--dir", type=str, help="Path to directory containing curriculum files")
    parser.add_argument(
        "--class-level", type=int, required=True, help="Target class grade (e.g. 8)"
    )
    parser.add_argument(
        "--subject-id", type=str, required=True, help="Subject ID (e.g. 'mathematics')"
    )
    parser.add_argument(
        "--subject-title", type=str, required=True, help="Subject Title (e.g. 'গণিত')"
    )
    parser.add_argument("--source-book", type=str, help="Name of textbook source")
    parser.add_argument("--chapter-id", type=str, help="Chapter ID")
    parser.add_argument("--chapter-title", type=str, help="Chapter Title")
    parser.add_argument("--lesson-id", type=str, help="Lesson ID")
    parser.add_argument("--lesson-title", type=str, help="Lesson Title")
    parser.add_argument(
        "--medium", choices=["bangla", "english"], default="bangla", help="Instruction medium"
    )

    args = parser.parse_args()
    if not args.file and not args.dir:
        parser.error("Either --file or --dir must be specified")

    asyncio.run(run_ingest(args))


if __name__ == "__main__":
    main()
