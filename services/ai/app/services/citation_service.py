import re

from app.schemas.citation import CitationPayload
from app.schemas.retrieval import RetrievedChunk


class CitationService:
    def __init__(self) -> None:
        self.tag_pattern = re.compile(r"\[source_(\d+)\]")

    def extract_citations(
        self,
        text: str,
        retrieved_chunks: list[RetrievedChunk],
    ) -> list[CitationPayload]:
        found_indices: set[int] = set()
        for match in self.tag_pattern.finditer(text):
            try:
                idx = int(match.group(1)) - 1
                if 0 <= idx < len(retrieved_chunks):
                    found_indices.add(idx)
            except (ValueError, IndexError):
                continue

        # If no explicit tags were generated but chunks were retrieved and relevant,
        # attach the top grounding chunk so the student always has verified reference
        if not found_indices and retrieved_chunks:
            found_indices.add(0)

        citations: list[CitationPayload] = []
        for idx in sorted(found_indices):
            chunk = retrieved_chunks[idx]
            citation_id = f"source_{idx + 1}"
            citations.append(
                CitationPayload(
                    citationId=citation_id,
                    sourceId=chunk.chunk_id,
                    sourceBook=chunk.book_name
                    or f"NCTB Class {chunk.class_level or 8} {chunk.subject_title or 'Textbook'}",
                    classLevel=chunk.class_level,
                    subject=chunk.subject_title,
                    chapter=chunk.chapter_title,
                    lesson=chunk.lesson_title,
                    pageStart=chunk.page_start,
                    pageEnd=chunk.page_end,
                    excerpt=chunk.text[:150] + "..." if len(chunk.text) > 150 else chunk.text,
                )
            )

        return citations
