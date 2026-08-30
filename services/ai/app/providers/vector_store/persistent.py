import asyncio
import json
import math
import os
from pathlib import Path
from typing import Any
from app.core.config import settings
from app.core.logging import logger
from app.schemas.retrieval import RetrievalFilter, RetrievedChunk


class PersistentVectorStore:
    name: str = "persistent"

    def __init__(self, file_path: str | Path | None = None) -> None:
        if file_path is None:
            file_path = Path(settings.vector_store_path)
        self.file_path = Path(file_path)
        self.lock = asyncio.Lock()

        self.chunks: list[dict[str, Any]] = []
        self.vectors: list[list[float]] = []

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
                logger.info(
                    f"Loaded {len(self.chunks)} persistent curriculum chunks from {self.file_path}"
                )
        except Exception as e:
            logger.error(f"Error loading vector store from {self.file_path}: {e}")
            self._seed_default_chunks()

    def _seed_default_chunks(self) -> None:
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
            },
        ]
        # Generate dummy 128-dim vectors for the seed chunks
        self.vectors = [[0.1] * 128 for _ in self.chunks]

    def _save_to_disk_sync(self) -> None:
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        tmp_path = self.file_path.with_suffix(".tmp")
        payload = {
            "version": "1.0",
            "count": len(self.chunks),
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
                if filter_params.class_level and chunk.get("class_level") != filter_params.class_level:
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
                data = chunk.model_dump()
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
