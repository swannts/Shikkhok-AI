import hashlib
import re

from app.ingestion.models import DocumentMetadata, ExtractedPage, IngestionChunk


class BengaliTextChunker:
    def __init__(self, max_chunk_size: int = 500, chunk_overlap: int = 80) -> None:
        self.max_chunk_size = max_chunk_size
        self.chunk_overlap = chunk_overlap

        # Split on sentence boundaries: Bengali dāṛi (।), question mark (?), exclamation (!), double newlines (\n\n), or English period (.)
        self.sentence_pattern = re.compile(r"([।?!]|\n\n|\.\s+)")

    def _normalize_bengali_text(self, text: str) -> str:
        # Collapse excessive whitespace while preserving newlines
        normalized = re.sub(r"[ \t]+", " ", text)
        normalized = re.sub(r"\n{3,}", "\n\n", normalized)
        return normalized.strip()

    def _split_into_sentences(self, text: str) -> list[str]:
        raw_parts = self.sentence_pattern.split(text)
        sentences: list[str] = []
        i = 0
        while i < len(raw_parts):
            sentence = raw_parts[i]
            # If the next token is a delimiter, attach it to the sentence
            if i + 1 < len(raw_parts) and self.sentence_pattern.match(raw_parts[i + 1]):
                sentence += raw_parts[i + 1]
                i += 2
            else:
                i += 1
            trimmed = sentence.strip()
            if trimmed:
                sentences.append(trimmed)
        return sentences

    def chunk_pages(
        self,
        pages: list[ExtractedPage],
        metadata: DocumentMetadata,
    ) -> list[IngestionChunk]:
        chunks: list[IngestionChunk] = []
        chunk_idx = 1
        book_slug = metadata.book_id or re.sub(r"[^a-zA-Z0-9_]", "_", metadata.source_book.lower())

        current_sentences: list[str] = []
        current_len = 0
        page_start = pages[0].page_number if pages else 1
        current_page_end = page_start

        for page in pages:
            normalized_page_text = self._normalize_bengali_text(page.text)
            if not normalized_page_text:
                continue

            sentences = self._split_into_sentences(normalized_page_text)
            for sentence in sentences:
                sen_len = len(sentence)

                if current_len + sen_len > self.max_chunk_size and current_sentences:
                    # Emit current chunk
                    chunk_text = " ".join(current_sentences).strip()
                    content_hash = hashlib.sha256(chunk_text.encode("utf-8")).hexdigest()

                    chunk_id = f"{book_slug}_p{page_start}_{chunk_idx:04d}"
                    chunks.append(
                        IngestionChunk(
                            chunk_id=chunk_id,
                            text=chunk_text,
                            page_start=page_start,
                            page_end=current_page_end,
                            char_count=len(chunk_text),
                            metadata=metadata,
                            content_hash=content_hash,
                        )
                    )
                    chunk_idx += 1

                    # Prepare overlap
                    overlap_sentences: list[str] = []
                    overlap_len = 0
                    for s in reversed(current_sentences):
                        if overlap_len + len(s) <= self.chunk_overlap:
                            overlap_sentences.insert(0, s)
                            overlap_len += len(s)
                        else:
                            break

                    current_sentences = overlap_sentences
                    current_len = overlap_len
                    page_start = current_page_end

                current_sentences.append(sentence)
                current_len += sen_len
                current_page_end = page.page_number

        # Emit remaining sentences if any
        if current_sentences:
            chunk_text = " ".join(current_sentences).strip()
            if chunk_text:
                content_hash = hashlib.sha256(chunk_text.encode("utf-8")).hexdigest()
                chunk_id = f"{book_slug}_p{page_start}_{chunk_idx:04d}"
                chunks.append(
                    IngestionChunk(
                        chunk_id=chunk_id,
                        text=chunk_text,
                        page_start=page_start,
                        page_end=current_page_end,
                        char_count=len(chunk_text),
                        metadata=metadata,
                        content_hash=content_hash,
                    )
                )

        return chunks
