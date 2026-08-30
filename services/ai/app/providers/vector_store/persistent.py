import asyncio
import json
import math
import os
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.core.logging import logger
from app.schemas.retrieval import RetrievalFilter, RetrievedChunk
from app.schemas.vector_store import VectorStoreEmbeddingMetadata


class PersistentVectorStore:
    name: str = "persistent"

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
                    if (
                        self.embedding_metadata is not None
                        and self.embedding_metadata.dimension != loaded_metadata.dimension
                    ):
                        raise ValueError(
                            "Persistent vector store embedding dimension mismatch: "
                            f"file has {loaded_metadata.dimension}, "
                            f"requested {self.embedding_metadata.dimension}"
                        )
                    if self.embedding_metadata is None:
                        self.embedding_metadata = loaded_metadata
                else:
                    inferred_metadata = self._infer_metadata()
                    if (
                        self.embedding_metadata is not None
                        and self.embedding_metadata.dimension != inferred_metadata.dimension
                    ):
                        raise ValueError(
                            "Persistent vector store embedding dimension mismatch: "
                            f"file has {inferred_metadata.dimension}, "
                            f"requested {self.embedding_metadata.dimension}"
                        )
                    self.embedding_metadata = self.embedding_metadata or inferred_metadata
                    self._apply_metadata_to_chunks()
                    self._save_to_disk_sync()
                self._apply_metadata_to_chunks()
                logger.info(
                    f"Loaded {len(self.chunks)} persistent curriculum chunks from {self.file_path}"
                )
        except Exception as e:
            if isinstance(e, ValueError) and "embedding dimension mismatch" in str(e):
                raise
            logger.error(f"Error loading vector store from {self.file_path}: {e}")
            self._seed_default_chunks()

    def _seed_default_chunks(self) -> None:
        seed_dimension = self.embedding_metadata.dimension if self.embedding_metadata else 128
        if self.embedding_metadata is None:
            self.embedding_metadata = VectorStoreEmbeddingMetadata(
                provider="deterministic",
                model="seeded-default",
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
        # Generate dummy 128-dim vectors for the seed chunks
        self.vectors = [[0.1] * self.embedding_metadata.dimension for _ in self.chunks]

    def _apply_metadata_to_chunks(self) -> None:
        for chunk in self.chunks:
            chunk["embedding_provider"] = self.embedding_metadata.provider
            chunk["embedding_model"] = self.embedding_metadata.model
            chunk["embedding_dimension"] = self.embedding_metadata.dimension
            chunk["embedding_version"] = self.embedding_metadata.version

    def _infer_metadata(self) -> VectorStoreEmbeddingMetadata:
        dimension = len(self.vectors[0]) if self.vectors else 128
        return VectorStoreEmbeddingMetadata(
            provider="unknown",
            model="unknown",
            dimension=dimension,
        )

    def _validate_vector_dimension(self, vector: list[float]) -> None:
        if len(vector) != self.embedding_metadata.dimension:
            raise ValueError(
                "Vector dimension mismatch for persistent index: "
                f"expected {self.embedding_metadata.dimension}, got {len(vector)}"
            )

    def _validate_index_dimensions(self) -> None:
        for vector in self.vectors:
            self._validate_vector_dimension(vector)

    def _save_to_disk_sync(self) -> None:
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        tmp_path = self.file_path.with_suffix(".tmp")
        payload = {
            "version": "1.0",
            "count": len(self.chunks),
            "metadata": {
                "embeddingProvider": self.embedding_metadata.provider,
                "embeddingModel": self.embedding_metadata.model,
                "embeddingDimension": self.embedding_metadata.dimension,
                "embeddingVersion": self.embedding_metadata.version,
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

        # Fallback to broader subject/class filter if strict match yields nothing
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

        scored: list[RetrievedChunk] = []
        for chunk, vector in candidates:
            sim = self._cosine_similarity(query_vector, vector)
            # Enhance score if keyword appears in text
            if filter_params.query and any(w in chunk["text"] for w in filter_params.query.split()):
                sim = max(sim, 0.75) + 0.15

            scored.append(
                RetrievedChunk(
                    chunk_id=chunk["chunk_id"],
                    text=chunk["text"],
                    score=round(min(sim, 0.99), 4),
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
                    content_version=chunk.get("content_version"),
                    embedding_provider=chunk.get("embedding_provider"),
                    embedding_model=chunk.get("embedding_model"),
                    embedding_dimension=chunk.get("embedding_dimension"),
                    embedding_version=chunk.get("embedding_version"),
                )
            )

        scored.sort(key=lambda x: x.score, reverse=True)
        return scored[: filter_params.top_k]

    async def upsert_chunks(
        self,
        chunks: list[RetrievedChunk],
        vectors: list[list[float]],
    ) -> int:
        async with self.lock:
            upserted_count = 0
            for chunk, vec in zip(chunks, vectors, strict=False):
                self._validate_vector_dimension(vec)
                data = chunk.model_dump()
                data["embedding_provider"] = self.embedding_metadata.provider
                data["embedding_model"] = self.embedding_metadata.model
                data["embedding_dimension"] = self.embedding_metadata.dimension
                data["embedding_version"] = self.embedding_metadata.version
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
