import asyncio
import json
import math
import os
import re
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.core.logging import logger
from app.providers.vector_store.compatibility import validate_embedding_compatibility
from app.providers.vector_store.scoping import build_retrieval_scope_chain, chunk_matches_scope
from app.schemas.retrieval import RetrievalFilter, RetrievedChunk
from app.schemas.vector_store import VectorStoreEmbeddingMetadata


class PersistentVectorStore:
    name: str = "persistent"
    embedding_metadata: VectorStoreEmbeddingMetadata | None

    def __init__(
        self,
        file_path: str | Path | None = None,
        embedding_metadata: VectorStoreEmbeddingMetadata | None = None,
    ) -> None:
        if file_path is None:
            file_path = Path(settings.vector_store_path)
        self.file_path = Path(file_path)
        self.lock = asyncio.Lock()

        self.chunks: list[dict[str, Any]] = []
        self.vectors: list[list[float]] = []
        self.embedding_metadata = embedding_metadata

        self._load_from_disk()
        if self.embedding_metadata is None:
            self.embedding_metadata = self._infer_metadata()

    def _load_from_disk(self) -> None:
        if not self.file_path.exists():
            # Seed with default curriculum chunks if file does not exist yet
            self._seed_default_chunks()
            self._save_to_disk_sync()
            return

        try:
            with open(self.file_path, encoding="utf-8") as f:
                data = json.load(f)
                self.chunks = data.get("chunks", [])
                self.vectors = data.get("vectors", [])
                metadata = data.get("metadata")
                if metadata:
                    loaded_metadata = VectorStoreEmbeddingMetadata(
                        provider=str(metadata.get("embeddingProvider", "unknown")),
                        model=str(metadata.get("embeddingModel", "unknown")),
                        dimension=int(metadata.get("embeddingDimension", 0) or 0),
                        version=int(metadata.get("embeddingVersion", 1) or 1),
                    )
                    if self.embedding_metadata is not None:
                        validate_embedding_compatibility(self.embedding_metadata, loaded_metadata)
                    else:
                        self.embedding_metadata = loaded_metadata
                else:
                    if settings.app_env not in ("development", "test"):
                        raise ValueError(
                            "Persistent vector store metadata missing in non-development environment"
                        )
                    inferred_metadata = self._infer_metadata()
                    if self.embedding_metadata is not None:
                        validate_embedding_compatibility(self.embedding_metadata, inferred_metadata)
                    self.embedding_metadata = self.embedding_metadata or inferred_metadata
                    self._apply_metadata_to_chunks()
                    self._save_to_disk_sync()
                self._apply_metadata_to_chunks()
                logger.info(
                    f"Loaded {len(self.chunks)} persistent curriculum chunks from {self.file_path}"
                )
        except Exception as e:
            if isinstance(e, ValueError) and (
                "embedding compatibility mismatch" in str(e).lower()
                or "embedding dimension mismatch" in str(e).lower()
            ):
                raise
            if settings.app_env in ("development", "test"):
                logger.error(f"Error loading vector store from {self.file_path}: {e}")
                self._seed_default_chunks()
                return
            raise RuntimeError(
                f"Failed to load persistent vector store from {self.file_path}: {e}"
            ) from e

    def _seed_default_chunks(self) -> None:
        seed_dimension = self.embedding_metadata.dimension if self.embedding_metadata else 128
        if self.embedding_metadata is None:
            self.embedding_metadata = VectorStoreEmbeddingMetadata(
                provider="deterministic-mock",
                model="deterministic-mock",
                dimension=seed_dimension,
            )
        self.chunks = [
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
                "curriculum_year": 2026,
                "medium": "bangla",
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
                "curriculum_year": 2026,
                "medium": "bangla",
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
                "curriculum_year": 2026,
                "medium": "bangla",
                "content_version": 1,
                "embedding_provider": self.embedding_metadata.provider,
                "embedding_model": self.embedding_metadata.model,
                "embedding_dimension": self.embedding_metadata.dimension,
                "embedding_version": self.embedding_metadata.version,
            },
        ]
        # Generate dummy 128-dim vectors for the seed chunks
        self.vectors = [[0.1] * self.embedding_metadata.dimension for _ in self.chunks]

    def _get_metadata(self) -> VectorStoreEmbeddingMetadata:
        if self.embedding_metadata is None:
            self.embedding_metadata = self._infer_metadata()
        return self.embedding_metadata

    def _apply_metadata_to_chunks(self) -> None:
        meta = self._get_metadata()
        for chunk in self.chunks:
            chunk["embedding_provider"] = meta.provider
            chunk["embedding_model"] = meta.model
            chunk["embedding_dimension"] = meta.dimension
            chunk["embedding_version"] = meta.version

    def _infer_metadata(self) -> VectorStoreEmbeddingMetadata:
        dimension = len(self.vectors[0]) if self.vectors else 128
        return VectorStoreEmbeddingMetadata(
            provider="unknown",
            model="unknown",
            dimension=dimension,
        )

    def _validate_vector_dimension(self, vector: list[float]) -> None:
        meta = self._get_metadata()
        if len(vector) != meta.dimension:
            raise ValueError(
                "Vector dimension mismatch for persistent index: "
                f"expected {meta.dimension}, got {len(vector)}"
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

    def _score_candidates(
        self,
        query_vector: list[float],
        candidates: list[tuple[dict[str, Any], list[float]]],
        filter_params: RetrievalFilter,
    ) -> list[RetrievedChunk]:
        scored: list[RetrievedChunk] = []
        seen_chunk_ids: set[str] = set()
        for chunk, vector in candidates:
            cosine_score = self._cosine_similarity(query_vector, vector)
            keyword_score = self._keyword_overlap_score(filter_params.query, chunk["text"])
            score = max(cosine_score * 0.65 + keyword_score * 0.35, keyword_score)
            if score < filter_params.min_score:
                continue
            if chunk["chunk_id"] in seen_chunk_ids:
                continue
            seen_chunk_ids.add(chunk["chunk_id"])

            scored.append(
                RetrievedChunk(
                    chunk_id=chunk["chunk_id"],
                    text=chunk["text"],
                    score=round(min(score, 0.99), 4),
                    book_id=chunk.get("book_id"),
                    book_name=chunk.get("book_name"),
                    class_level=chunk.get("class_level"),
                    subject_id=chunk.get("subject_id"),
                    chapter_id=chunk.get("chapter_id"),
                    lesson_id=chunk.get("lesson_id"),
                    subject_title=chunk.get("subject_title"),
                    chapter_title=chunk.get("chapter_title"),
                    lesson_title=chunk.get("lesson_title"),
                    page_start=chunk.get("page_start"),
                    page_end=chunk.get("page_end"),
                    curriculum_version=chunk.get("curriculum_version", "2024-NCTB"),
                    academic_year=chunk.get("academic_year", 2026),
                    curriculum_year=chunk.get("curriculum_year"),
                    medium=chunk.get("medium"),
                    content_version=chunk.get("content_version"),
                    embedding_provider=chunk.get("embedding_provider"),
                    embedding_model=chunk.get("embedding_model"),
                    embedding_dimension=chunk.get("embedding_dimension"),
                    embedding_version=chunk.get("embedding_version"),
                    content_hash=chunk.get("content_hash"),
                )
            )

        scored.sort(key=lambda x: (x.score, x.page_start or 0, x.chunk_id), reverse=True)
        return scored[: filter_params.top_k]

    def _save_to_disk_sync(self) -> None:
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        tmp_path = self.file_path.with_suffix(".tmp")
        meta = self._get_metadata()
        payload = {
            "version": "1.0",
            "count": len(self.chunks),
            "metadata": {
                "embeddingProvider": meta.provider,
                "embeddingModel": meta.model,
                "embeddingDimension": meta.dimension,
                "embeddingVersion": meta.version,
            },
            "chunks": self.chunks,
            "vectors": self.vectors,
        }
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, self.file_path)

    async def _save_to_disk(self) -> None:
        async with self.lock:
            await asyncio.to_thread(self._save_to_disk_sync)

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

        for scope in build_retrieval_scope_chain(filter_params):
            candidates = [
                (chunk, vector)
                for chunk, vector in zip(self.chunks, self.vectors, strict=False)
                if chunk_matches_scope(chunk, scope)
            ]
            if not candidates:
                continue
            candidates = self._select_active_version_chunks(candidates)
            scored = self._score_candidates(query_vector, candidates, filter_params)
            if scored:
                return scored

        return []

    async def upsert_chunks(
        self,
        chunks: list[RetrievedChunk],
        vectors: list[list[float]],
    ) -> int:
        async with self.lock:
            upserted_count = 0
            meta = self._get_metadata()
            for chunk, vec in zip(chunks, vectors, strict=False):
                self._validate_vector_dimension(vec)
                data = chunk.model_dump()
                data["embedding_provider"] = meta.provider
                data["embedding_model"] = meta.model
                data["embedding_dimension"] = meta.dimension
                data["embedding_version"] = meta.version
                existing_idx = next(
                    (i for i, c in enumerate(self.chunks) if c["chunk_id"] == chunk.chunk_id),
                    None,
                )
                if existing_idx is not None:
                    self.chunks[existing_idx] = data
                    self.vectors[existing_idx] = vec
                else:
                    self.chunks.append(data)
                    self.vectors.append(vec)
                upserted_count += 1

            self._apply_metadata_to_chunks()
            await asyncio.to_thread(self._save_to_disk_sync)
            return upserted_count

    async def count(self) -> int:
        return len(self.chunks)

    async def delete_by_book_id(self, book_id: str) -> int:
        async with self.lock:
            initial = len(self.chunks)
            new_chunks = []
            new_vectors = []
            for c, v in zip(self.chunks, self.vectors, strict=False):
                if c.get("book_id") != book_id:
                    new_chunks.append(c)
                    new_vectors.append(v)
            self.chunks = new_chunks
            self.vectors = new_vectors
            deleted = initial - len(self.chunks)
            if deleted > 0:
                await asyncio.to_thread(self._save_to_disk_sync)
            return deleted
