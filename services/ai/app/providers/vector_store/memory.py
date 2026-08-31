import re
import math
from typing import Any

from app.schemas.vector_store import VectorStoreEmbeddingMetadata
from app.schemas.retrieval import RetrievalFilter, RetrievedChunk


class InMemoryVectorStore:
    name: str = "memory"

    def __init__(
        self,
        embedding_metadata: VectorStoreEmbeddingMetadata | None = None,
    ) -> None:
        self.embedding_metadata = embedding_metadata or VectorStoreEmbeddingMetadata(
            provider="deterministic",
            model="seeded-default",
            dimension=128,
        )
        # Seed default NCTB curriculum chunks for Class 6-10
        seed_dimension = self.embedding_metadata.dimension
        self.chunks: list[dict[str, Any]] = [
            {
                "chunk_id": "chunk_math_8_algebra_01",
                "text": "বীজগণিতীয় সূত্রাবলি: (a + b)² = a² + 2ab + b²। এটি দুটি পদের যোগফলের বর্গ নির্ণয়ের প্রাথমিক সূত্র।",
                "book_id": "nctb_math_class_8",
                "book_name": "NCTB গণিত (শ্রেণি ৮)",
                "class_level": 8,
                "subject_id": "mathematics",
                "subject_title": "গণিত",
                "chapter_id": "algebra",
                "chapter_title": "বীজগণিতীয় রাশি",
                "lesson_id": "identities",
                "lesson_title": "বর্গ সংবলিত সূত্রাবলি",
                "page_start": 45,
                "page_end": 47,
                "content_version": 1,
                "embedding_provider": self.embedding_metadata.provider,
                "embedding_model": self.embedding_metadata.model,
                "embedding_dimension": self.embedding_metadata.dimension,
                "embedding_version": self.embedding_metadata.version,
            },
            {
                "chunk_id": "chunk_math_8_algebra_02",
                "text": "বর্গের অন্তরের সূত্র: (a - b)² = a² - 2ab + b² এবং a² - b² = (a + b)(a - b)।",
                "book_id": "nctb_math_class_8",
                "book_name": "NCTB গণিত (শ্রেণি ৮)",
                "class_level": 8,
                "subject_id": "mathematics",
                "subject_title": "গণিত",
                "chapter_id": "algebra",
                "chapter_title": "বীজগণিতীয় রাশি",
                "lesson_id": "identities",
                "lesson_title": "বর্গ সংবলিত সূত্রাবলি",
                "page_start": 48,
                "page_end": 50,
                "content_version": 1,
                "embedding_provider": self.embedding_metadata.provider,
                "embedding_model": self.embedding_metadata.model,
                "embedding_dimension": self.embedding_metadata.dimension,
                "embedding_version": self.embedding_metadata.version,
            },
            {
                "chunk_id": "chunk_science_8_combustion_01",
                "text": "দহন বা Combustion হলো এমন একটি রাসায়নিক বিক্রিয়া যাতে কোনো পদার্থ অক্সিজেনের উপস্থিতিতে দ্রুত বিক্রিয়া করে তাপ ও আলো উৎপন্ন করে।",
                "book_id": "nctb_science_class_8",
                "book_name": "NCTB বিজ্ঞান (শ্রেণি ৮)",
                "class_level": 8,
                "subject_id": "science",
                "subject_title": "বিজ্ঞান",
                "chapter_id": "chemical_reactions",
                "chapter_title": "রাসায়নিক বিক্রিয়া",
                "lesson_id": "combustion",
                "lesson_title": "দহন প্রক্রিয়া",
                "page_start": 72,
                "page_end": 74,
                "content_version": 1,
                "embedding_provider": self.embedding_metadata.provider,
                "embedding_model": self.embedding_metadata.model,
                "embedding_dimension": self.embedding_metadata.dimension,
                "embedding_version": self.embedding_metadata.version,
            },
        ]
        self.vectors: list[list[float]] = [[0.1] * seed_dimension for _ in self.chunks]

    def _validate_vector_dimension(self, vector: list[float]) -> None:
        if len(vector) != self.embedding_metadata.dimension:
            raise ValueError(
                "Vector dimension mismatch for in-memory index: "
                f"expected {self.embedding_metadata.dimension}, got {len(vector)}"
            )

    def _validate_index_dimensions(self) -> None:
        for vector in self.vectors:
            self._validate_vector_dimension(vector)

    def _keyword_overlap_score(self, query: str, text: str) -> float:
        query_terms = {
            token for token in re.split(r"[^\w\u0980-\u09FF]+", query.lower()) if token.strip()
        }
        if not query_terms:
            return 0.0

        text_terms = {
            token for token in re.split(r"[^\w\u0980-\u09FF]+", text.lower()) if token.strip()
        }
        if not text_terms:
            return 0.0

        overlap = len(query_terms & text_terms)
        if overlap == 0:
            if any(term in text.lower() for term in query_terms):
                return 0.35
            return 0.0
        return min(1.0, overlap / max(len(query_terms), 1))

    def _select_active_version_chunks(
        self, candidates: list[tuple[dict[str, Any], list[float]]]
    ) -> list[tuple[dict[str, Any], list[float]]]:
        latest_versions: dict[str, int] = {}
        for chunk, _ in candidates:
            book_id = chunk.get("book_id")
            if not book_id:
                continue
            content_version = int(chunk.get("content_version") or 1)
            latest_versions[book_id] = max(latest_versions.get(book_id, 0), content_version)

        if not latest_versions:
            return candidates

        selected: list[tuple[dict[str, Any], list[float]]] = []
        for chunk, vector in candidates:
            book_id = chunk.get("book_id")
            if not book_id:
                selected.append((chunk, vector))
                continue
            if int(chunk.get("content_version") or 1) == latest_versions.get(book_id, 1):
                selected.append((chunk, vector))
        return selected

    def _cosine_similarity(self, vec_a: list[float], vec_b: list[float]) -> float:
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        dot = sum(a * b for a, b in zip(vec_a, vec_b, strict=False))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)

    async def search(
        self,
        query_vector: list[float],
        filter_params: RetrievalFilter,
    ) -> list[RetrievedChunk]:
        self._validate_vector_dimension(query_vector)
        self._validate_index_dimensions()

        candidates: list[tuple[dict[str, Any], list[float]]] = []

        for chunk, vector in zip(self.chunks, self.vectors, strict=False):
            # Metadata filtering
            if filter_params.class_level and chunk.get("class_level") != filter_params.class_level:
                continue
            if filter_params.subject_id and chunk.get("subject_id") != filter_params.subject_id:
                continue
            if filter_params.chapter_id and chunk.get("chapter_id") != filter_params.chapter_id:
                continue
            if filter_params.lesson_id and chunk.get("lesson_id") != filter_params.lesson_id:
                continue
            candidates.append((chunk, vector))

        # If strict filtering narrowed too much, fall back to broader class/subject filter
        if not candidates and (filter_params.lesson_id or filter_params.chapter_id):
            for chunk, vector in zip(self.chunks, self.vectors, strict=False):
                if (
                    filter_params.class_level
                    and chunk.get("class_level") != filter_params.class_level
                ):
                    continue
                if filter_params.subject_id and chunk.get("subject_id") != filter_params.subject_id:
                    continue
                candidates.append((chunk, vector))

        if not candidates:
            candidates = list(zip(self.chunks, self.vectors, strict=False))

        candidates = self._select_active_version_chunks(candidates)

        scored_chunks: list[RetrievedChunk] = []
        seen_chunk_ids: set[str] = set()
        for c, vector in candidates:
            cosine_score = self._cosine_similarity(query_vector, vector)
            keyword_score = self._keyword_overlap_score(filter_params.query, c["text"])
            score = max(cosine_score * 0.65 + keyword_score * 0.35, keyword_score)
            if score < filter_params.min_score:
                continue
            if c["chunk_id"] in seen_chunk_ids:
                continue
            seen_chunk_ids.add(c["chunk_id"])

            scored_chunks.append(
                RetrievedChunk(
                    chunk_id=c["chunk_id"],
                    text=c["text"],
                    score=round(min(score, 0.99), 4),
                    book_id=c.get("book_id"),
                    book_name=c.get("book_name"),
                    class_level=c.get("class_level"),
                    subject_id=c.get("subject_id"),
                    chapter_id=c.get("chapter_id"),
                    lesson_id=c.get("lesson_id"),
                    subject_title=c.get("subject_title"),
                    chapter_title=c.get("chapter_title"),
                    lesson_title=c.get("lesson_title"),
                    page_start=c.get("page_start"),
                    page_end=c.get("page_end"),
                    content_version=c.get("content_version"),
                    embedding_provider=c.get("embedding_provider"),
                    embedding_model=c.get("embedding_model"),
                    embedding_dimension=c.get("embedding_dimension"),
                    embedding_version=c.get("embedding_version"),
                    content_hash=c.get("content_hash"),
                )
            )

        scored_chunks.sort(key=lambda x: (x.score, x.page_start or 0, x.chunk_id), reverse=True)
        return scored_chunks[: filter_params.top_k]

    async def upsert_chunks(
        self,
        chunks: list[RetrievedChunk],
        vectors: list[list[float]],
    ) -> int:
        for chunk, vector in zip(chunks, vectors, strict=False):
            self._validate_vector_dimension(vector)
            # Check if chunk_id already exists and update
            existing_idx = next(
                (i for i, c in enumerate(self.chunks) if c["chunk_id"] == chunk.chunk_id),
                None,
            )
            data = chunk.model_dump()
            data["embedding_provider"] = self.embedding_metadata.provider
            data["embedding_model"] = self.embedding_metadata.model
            data["embedding_dimension"] = self.embedding_metadata.dimension
            data["embedding_version"] = self.embedding_metadata.version
            if existing_idx is not None:
                self.chunks[existing_idx] = data
                self.vectors[existing_idx] = vector
            else:
                self.chunks.append(data)
                self.vectors.append(vector)
        return len(chunks)

    async def count(self) -> int:
        return len(self.chunks)

    async def delete_by_book_id(self, book_id: str) -> int:
        initial = len(self.chunks)
        self.chunks = [c for c in self.chunks if c.get("book_id") != book_id]
        return initial - len(self.chunks)
