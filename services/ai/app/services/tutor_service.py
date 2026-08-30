import asyncio
import time
from collections.abc import AsyncIterator, Callable
from pathlib import Path

from app.core.logging import logger
from app.schemas.retrieval import RetrievalFilter, RetrievedChunk
from app.schemas.tutor import TutorGenerationRequest, TutorStreamEvent
from app.services.citation_service import CitationService
from app.services.model_router import ModelRouter
from app.services.moderation_service import ModerationService
from app.services.output_safety import OutputSafetyService
from app.services.rag_service import RagService
from app.services.streaming_safety import StreamingOutputSafetyFilter


class TutorService:
    def __init__(
        self,
        moderation_service: ModerationService,
        rag_service: RagService,
        citation_service: CitationService,
        output_safety_service: OutputSafetyService,
        model_router: ModelRouter,
        prompts_dir: Path | None = None,
    ) -> None:
        self.moderation_service = moderation_service
        self.rag_service = rag_service
        self.citation_service = citation_service
        self.output_safety_service = output_safety_service
        self.model_router = model_router

        if prompts_dir is None:
            prompts_dir = Path(__file__).resolve().parent.parent / "prompts" / "tutor"
        self.prompts_dir = prompts_dir

        self.system_bn = self._load_prompt("system_bn.txt")
        self.system_en = self._load_prompt("system_en.txt")
        self.grounding_rules = self._load_prompt("grounding_rules.txt")

    def _load_prompt(self, filename: str) -> str:
        filepath = self.prompts_dir / filename
        if filepath.exists():
            return filepath.read_text(encoding="utf-8").strip()
        return ""

    def _build_prompt_messages(
        self,
        request: TutorGenerationRequest,
        retrieved_chunks: list[RetrievedChunk],
    ) -> list[dict[str, str]]:
        system_base = self.system_en if request.language == "en" else self.system_bn

        # Build context segment without inventing fake learner grade levels
        context_parts: list[str] = []
        if request.subject_title or request.chapter_title or request.lesson_title:
            class_str = (
                f"(শ্রেণি {request.class_level})" if request.class_level else "(শ্রেণি নির্ধারিত নয়)"
            )
            context_parts.append(
                f"পাঠ পরিচিতি: বিষয়: {request.subject_title or 'সাধারণ'}, "
                f"অধ্যায়: {request.chapter_title or 'নির্ধারিত নয়'}, "
                f"পাঠ: {request.lesson_title or 'নির্ধারিত নয়'} {class_str}"
            )

        if retrieved_chunks:
            context_parts.append("অনুমোদিত পাঠ্যপুস্তকের তথ্যসূত্র:")
            for i, chunk in enumerate(retrieved_chunks):
                source_tag = f"[source_{i + 1}]"
                book = chunk.book_name or "NCTB Textbook"
                pages = f"(পৃষ্ঠা {chunk.page_start}-{chunk.page_end})" if chunk.page_start else ""
                context_parts.append(f"{source_tag} {book} {pages}: {chunk.text}")
        else:
            context_parts.append(
                "সরাসরি পাঠ্যবইয়ের অনুচ্ছেদ পাওয়া যায়নি। সাধারণ শিক্ষাক্রম নীতিমালা অনুযায়ী ব্যাখ্যা করো।"
            )

        full_system_prompt = (
            f"{system_base}\n\n"
            f"{self.grounding_rules}\n\n"
            f"শিক্ষাক্রম প্রেক্ষাপট:\n" + "\n".join(context_parts)
        )

        messages: list[dict[str, str]] = [{"role": "system", "content": full_system_prompt}]

        # Append recent history
        for h in request.history[-6:]:
            messages.append({"role": h.role, "content": h.content})

        # Append current user prompt
        messages.append({"role": "user", "content": request.message})

        return messages

    async def stream_tutor_response(
        self,
        request: TutorGenerationRequest,
        is_disconnected: Callable[[], bool] | None = None,
        cancellation_event: asyncio.Event | None = None,
    ) -> AsyncIterator[TutorStreamEvent]:
        started_at = time.time()

        # Helper to detect client cancellation
        def check_cancelled() -> bool:
            if is_disconnected and is_disconnected():
                return True
            if cancellation_event and cancellation_event.is_set():
                return True
            return False

        # 1. Input Moderation Check
        moderation = self.moderation_service.moderate_input(request.message)
        if not moderation.is_safe:
            logger.warning(
                f"Request {request.request_id} blocked by moderation: {moderation.category}",
                extra={
                    "extra_data": {"category": moderation.category, "reason": moderation.reason}
                },
            )
            yield TutorStreamEvent(
                event="metadata",
                data={
                    "provider": "safety-guardrail",
                    "model": "shikkhok-moderation-v2",
                    "category": moderation.category,
                    "conversationId": request.conversation_id,
                    "fallbackUsed": False,
                    "grounded": False,
                },
            )
            yield TutorStreamEvent(
                event="delta",
                data={"text": moderation.safe_response_bn},
            )
            yield TutorStreamEvent(
                event="done",
                data={
                    "finishReason": "moderation_block",
                    "latencyMs": int((time.time() - started_at) * 1000),
                },
            )
            return

        # 2. RAG Retrieval with Metadata Filtering
        filter_params = RetrievalFilter(
            query=request.message,
            class_level=request.class_level,
            subject_id=request.subject_id,
            chapter_id=request.chapter_id,
            lesson_id=request.lesson_id,
            top_k=3,
        )

        retrieval_start = time.time()
        retrieved_chunks: list[RetrievedChunk] = []
        retrieval_unavailable = False
        try:
            retrieved_chunks = await self.rag_service.search(filter_params)
        except Exception as rag_err:
            logger.warning(
                f"RAG retrieval failed for request {request.request_id}: {rag_err}; proceeding ungrounded"
            )
            retrieval_unavailable = True

        retrieval_latency_ms = int((time.time() - retrieval_start) * 1000)

        # If client cancelled before generation starts, exit cleanly
        if check_cancelled():
            logger.info(f"Client cancelled before generation for request {request.request_id}")
            return

        # 3. Assemble Prompt Messages
        messages = self._build_prompt_messages(request, retrieved_chunks)

        # 4. Stream from ModelRouter with incremental output safety filter
        routed = await self.model_router.stream_chat(messages)

        yield TutorStreamEvent(
            event="metadata",
            data={
                "provider": routed.provider,
                "model": routed.model,
                "conversationId": request.conversation_id,
                "classLevel": request.class_level,
                "subject": request.subject_title,
                "fallbackUsed": routed.fallback_used,
                "grounded": bool(retrieved_chunks),
                "retrievalUnavailable": retrieval_unavailable,
                "retrievalLatencyMs": retrieval_latency_ms,
            },
        )

        safety_filter = StreamingOutputSafetyFilter()
        full_content = ""
        client_cancelled = False

        try:
            async for delta in routed.stream:
                if check_cancelled():
                    logger.info(
                        f"Client cancelled during generation for request {request.request_id}"
                    )
                    client_cancelled = True
                    break

                full_content += delta.text
                safe_chunk = safety_filter.feed(delta.text)
                if safe_chunk:
                    yield TutorStreamEvent(
                        event="delta",
                        data={"text": safe_chunk},
                    )

            if not client_cancelled:
                final_chunk = safety_filter.finalize()
                if final_chunk:
                    yield TutorStreamEvent(
                        event="delta",
                        data={"text": final_chunk},
                    )

        except Exception as stream_err:
            logger.error(
                f"Error during LLM token streaming for request {request.request_id}: {stream_err}"
            )
            yield TutorStreamEvent(
                event="error",
                data={
                    "code": "AI_STREAM_FAILED",
                    "message": "AI generation is temporarily unavailable.",
                    "banglaMessage": "এআই টিউটরের সাথে সংযোগ সাময়িকভাবে ব্যাহত হয়েছে।",
                },
            )
            return

        # If client cancelled, do NOT emit citations or done: stop!
        if client_cancelled:
            logger.info(
                f"Suppressing done and citation events due to client cancellation for {request.request_id}"
            )
            return

        # 5. Final Output Safety Validation
        safety_check = self.output_safety_service.validate_and_sanitize(full_content)

        # 6. Extract Grounded Citations (only from real retrieved chunks)
        citations = (
            self.citation_service.extract_citations(safety_check.sanitized_text, retrieved_chunks)
            if retrieved_chunks
            else []
        )
        for c in citations:
            yield TutorStreamEvent(
                event="citation",
                data=c.model_dump(by_alias=True),
            )

        # 7. Done Event
        latency_ms = int((time.time() - started_at) * 1000)
        yield TutorStreamEvent(
            event="done",
            data={
                "finishReason": "stop",
                "conversationId": request.conversation_id,
                "latencyMs": latency_ms,
                "citationCount": len(citations),
            },
        )
