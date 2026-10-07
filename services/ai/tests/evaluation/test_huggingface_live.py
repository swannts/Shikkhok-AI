import json
import os
import time

import pytest

from app.core.config import settings
from app.providers.llm.huggingface import HuggingFaceLlmProvider
from app.schemas.retrieval import RetrievalFilter, RetrievedChunk
from app.schemas.tutor import TutorGenerationRequest
from app.services.citation_service import CitationService
from app.services.model_router import ModelRouter
from app.services.moderation_service import ModerationService
from app.services.output_safety import OutputSafetyService
from app.services.tutor_service import TutorService
from tests.evaluation.curriculum_cases import (
    CURRICULUM_EVALUATION_CASES,
    CurriculumEvaluationCase,
)

LIVE_EVALUATION_ENABLED = os.getenv("RUN_LIVE_HF_EVALUATION", "").lower() == "true"
HF_TOKEN = os.getenv("HF_TOKEN", "")
pytestmark = pytest.mark.skipif(
    not LIVE_EVALUATION_ENABLED or not HF_TOKEN,
    reason="Set RUN_LIVE_HF_EVALUATION=true and HF_TOKEN to run paid live model evaluations.",
)


class EvaluationRagService:
    def __init__(self, chunk: RetrievedChunk | None) -> None:
        self.chunk = chunk

    async def search(self, filter_params: RetrievalFilter) -> list[RetrievedChunk]:
        if filter_params.class_level is None or filter_params.subject_id is None:
            return []
        return [self.chunk] if self.chunk is not None else []


def evaluation_chunk(case: CurriculumEvaluationCase) -> RetrievedChunk | None:
    if not case["should_answer"]:
        return None
    class_level = case["class_level"]
    if not isinstance(class_level, int):
        return None
    return RetrievedChunk(
        chunk_id=f"synthetic-eval-{case['name']}",
        text=(
            "সালোকসংশ্লেষণে উদ্ভিদ সূর্যালোক ও ক্লোরোফিল ব্যবহার করে খাদ্য তৈরি করে। "
            "(a+b)^2 = a^2 + 2ab + b^2। রবীন্দ্রনাথ ঠাকুর একজন কবি, যিনি বিশ্বকবি নামে পরিচিত।"
        ),
        score=1.0,
        book_name="Synthetic evaluation fixture (not an NCTB source)",
        class_level=class_level,
        subject_id=str(case["subject_id"]),
        subject_title="Evaluation fixture",
        chapter_title="Evaluation fixture",
        lesson_title="Evaluation fixture",
        page_start=1,
        page_end=1,
        curriculum_version="synthetic-evaluation-only",
        curriculum_year=2026,
        medium="bangla",
    )


def build_live_service(case: CurriculumEvaluationCase) -> TutorService:
    provider = HuggingFaceLlmProvider(
        api_key=HF_TOKEN,
        model=settings.huggingface_model,
        timeout_seconds=settings.llm_timeout_seconds,
    )
    return TutorService(
        moderation_service=ModerationService(),
        rag_service=EvaluationRagService(evaluation_chunk(case)),
        citation_service=CitationService(),
        output_safety_service=OutputSafetyService(),
        model_router=ModelRouter(primary=provider),
        grounding_mode="hybrid",
    )


@pytest.mark.parametrize("case", CURRICULUM_EVALUATION_CASES, ids=lambda case: case["name"])
@pytest.mark.asyncio
async def test_huggingface_against_curriculum_cases(
    case: CurriculumEvaluationCase, record_property
) -> None:
    service = build_live_service(case)
    request = TutorGenerationRequest(
        request_id=f"live-eval-{case['name']}",
        user_id="live-evaluation-actor",
        conversation_id="live-evaluation-conversation",
        message=case["question"],
        class_level=case["class_level"],
        curriculum_year=2026 if case["class_level"] else None,
        medium="bangla" if case["class_level"] else None,
        subject_id=case["subject_id"],
        chapter_id=case["chapter_id"],
        lesson_id=case["lesson_id"],
        history=[],
    )

    started = time.monotonic()
    events = [event async for event in service.stream_tutor_response(request)]
    latency_ms = round((time.monotonic() - started) * 1000)
    metadata = next(event.data for event in events if event.event == "metadata")
    done = next((event.data for event in events if event.event == "done"), {})
    citations = [event for event in events if event.event == "citation"]
    expected_grounding = bool(case["should_answer"])
    retrieved_chunk_count = int(metadata.get("retrievedChunkCount", 0))

    assert metadata["grounded"] is expected_grounding
    if not expected_grounding:
        assert not citations, "An evaluation miss must never generate citations."
    else:
        retrieved_ids = {f"synthetic-eval-{case['name']}"}
        assert all(citation.data["sourceId"] in retrieved_ids for citation in citations)

    if not case["is_safe"]:
        assert done.get("finishReason") == "moderation_block"

    record_property(
        "ai_metrics",
        json.dumps(
            {
                "case": case["name"],
                "retrievalHit": retrieved_chunk_count > 0,
                "grounded": metadata["grounded"],
                "retrievedChunkCount": retrieved_chunk_count,
                "citationCount": len(citations),
                "latencyMs": latency_ms,
                "provider": metadata.get("provider"),
                "model": metadata.get("model"),
                "safetyResult": "moderation_block" if not case["is_safe"] else "allowed",
            },
            ensure_ascii=False,
        ),
    )
