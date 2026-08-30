import json
import re
import time
from pathlib import Path
from typing import Any

from app.core.exceptions import ModerationBlockedError
from app.core.logging import logger
from app.schemas.citation import CitationPayload
from app.schemas.homework import (
    HomeworkCorrection,
    HomeworkEvaluationRequest,
    HomeworkEvaluationResponse,
)
from app.schemas.retrieval import RetrievalFilter, RetrievedChunk
from app.services.citation_service import CitationService
from app.services.model_router import ModelRouter
from app.services.moderation_service import ModerationService
from app.services.rag_service import RagService


class HomeworkService:
    def __init__(
        self,
        moderation_service: ModerationService,
        rag_service: RagService,
        citation_service: CitationService,
        model_router: ModelRouter,
        prompt_dir: Path | None = None,
    ) -> None:
        self.moderation_service = moderation_service
        self.rag_service = rag_service
        self.citation_service = citation_service
        self.model_router = model_router

        if prompt_dir is None:
            prompt_dir = Path(__file__).parent.parent / "prompts" / "homework"
        self.prompt_dir = prompt_dir

    def _load_prompt(self, filename: str) -> str:
        path = self.prompt_dir / filename
        if path.exists():
            return path.read_text(encoding="utf-8").strip()
        return "You are an NCTB tutor evaluating student homework."

    async def evaluate_submission(
        self,
        request: HomeworkEvaluationRequest,
    ) -> HomeworkEvaluationResponse:
        start_time = time.time()

        # 1. Moderation Check on text content if provided
        content_to_check = f"{request.prompt or ''} {request.raw_text or ''}".strip()
        if content_to_check:
            mod_result = self.moderation_service.moderate_input(content_to_check)
            if not mod_result.is_safe:
                raise ModerationBlockedError(
                    message=mod_result.reason,
                    category=mod_result.category,
                )

        # 2. RAG Retrieval for curriculum context
        retrieval_query = (
            request.raw_text or request.prompt or request.lesson_title or "অনুশীলনী ও সমাধান"
        )
        retrieved_chunks: list[RetrievedChunk] = []
        try:
            retrieved_chunks = await self.rag_service.search(
                filter_params=RetrievalFilter(
                    query=retrieval_query,
                    class_level=request.class_level,
                    subject_id=request.subject_id,
                    chapter_id=request.chapter_id,
                    lesson_id=request.lesson_id,
                    top_k=3,
                ),
            )
        except Exception as e:
            logger.warning(f"RAG retrieval failed during homework evaluation: {e}")

        # 3. Build Prompt
        system_file = f"system_{request.language}.txt"
        system_prompt = self._load_prompt(system_file)

        context_blocks = []
        for idx, chunk in enumerate(retrieved_chunks):
            source_id = f"source_{idx + 1}"
            context_blocks.append(
                f"[{source_id}: {chunk.book_name}, পৃঃ {chunk.page_start or 'N/A'}]\n{chunk.text}"
            )
        context_str = (
            "\n\n".join(context_blocks) if context_blocks else "প্রাসঙ্গিক পাঠ্যবই তথ্য পাওয়া যায়নি।"
        )

        user_content = (
            f"শিক্ষার্থীর শ্রেণি: {request.class_level or 'অজানা'}\n"
            f"বিষয়: {request.subject_title or request.subject_id or 'অজানা'}\n"
            f"অধ্যায়: {request.chapter_title or 'অজানা'}\n"
            f"পাঠ: {request.lesson_title or 'অজানা'}\n"
            f"প্রশ্ন / প্রম্পট: {request.prompt or 'কোনো প্রশ্ন দেওয়া নেই'}\n"
            f"শিক্ষার্থীর কাজ (টেক্সট): {request.raw_text or 'হস্তলিখিত ছবির মাধ্যমে জমা দেওয়া হয়েছে'}\n"
            f"ছবির সংখ্যা: {len(request.image_urls)}\n\n"
            f"=== পাঠ্যবইয়ের প্রাসঙ্গিক সূত্র ও বিষয়বস্তু ===\n{context_str}\n\n"
            f"উপরোক্ত তথ্যের ভিত্তিতে শিক্ষার্থীর জমা দেওয়া কাজটি মূল্যায়ন করে নিম্নলিখিত JSON স্কিমায় উত্তর দাও:\n"
            f"{{\n"
            f'  "score": 85.0,\n'
            f'  "summary": "সামগ্রিক মূল্যায়ন সংক্ষেপ",\n'
            f'  "strengths": ["সবল দিক ১", "সবল দিক ২"],\n'
            f'  "weaknesses": ["দুর্বল দিক বা ভুলের জায়গা"],\n'
            f'  "corrections": [\n'
            f'    {{"original": "ভুল ধাপ", "corrected": "সঠিক সমাধান", "explanation": "কারণ"}}\n'
            f"  ],\n"
            f'  "recommendations": ["পরামর্শ ১", "পরামর্শ ২"]\n'
            f"}}"
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ]

        # 4. Generate AI Evaluation
        raw_response, fallback_used = await self.model_router.generate(messages)

        # 5. Parse JSON response
        parsed = self._extract_json(raw_response)

        # 6. Resolve Citations
        citations: list[CitationPayload] = []
        if retrieved_chunks:
            citations = self.citation_service.resolve_citations(
                text=raw_response,
                retrieved_chunks=retrieved_chunks,
            )

        duration_ms = int((time.time() - start_time) * 1000)

        return HomeworkEvaluationResponse(
            submission_id=request.submission_id,
            score=float(parsed.get("score", 80.0)),
            summary=parsed.get("summary", "শিক্ষার্থীর বাড়ির কাজ সফলভাবে মূল্যায়ন করা হয়েছে।"),
            strengths=parsed.get("strengths", ["সমাধানের প্রয়াস ভালো হয়েছে।"]),
            weaknesses=parsed.get("weaknesses", []),
            corrections=[
                HomeworkCorrection(
                    original=c.get("original", ""),
                    corrected=c.get("corrected", ""),
                    explanation=c.get("explanation", ""),
                )
                for c in parsed.get("corrections", [])
                if isinstance(c, dict)
            ],
            recommendations=parsed.get("recommendations", ["পাঠ্যবইয়ের নিয়মাবলী নিয়মিত অনুশীলন করো।"]),
            citations=citations,
            provider=self.model_router.primary.name,
            model=self.model_router.primary.model,
            fallback_used=fallback_used,
            duration_ms=duration_ms,
        )

    def _extract_json(self, text: str) -> dict[str, Any]:
        # Try direct json parse
        try:
            val = json.loads(text)
            if isinstance(val, dict):
                return val
        except Exception:
            pass

        # Try extract json block ```json ... ```
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if match:
            try:
                val = json.loads(match.group(1))
                if isinstance(val, dict):
                    return val
            except Exception:
                pass

        # Try find first { to last }
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                val = json.loads(text[start : end + 1])
                if isinstance(val, dict):
                    return val
            except Exception:
                pass

        # Fallback structured dict
        return {
            "score": 80.0,
            "summary": text[:200] if text else "মূল্যায়ন সম্পন্ন হয়েছে।",
            "strengths": ["শিক্ষার্থী পাঠের সমাধান করার সক্রিয় চেষ্টা করেছে।"],
            "weaknesses": [],
            "corrections": [],
            "recommendations": ["পাঠ্যবইয়ের সংশ্লিষ্ট উদাহরণগুলো আবার দেখো।"],
        }
