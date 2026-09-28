import pytest

from app.providers.llm.mock import MockLlmProvider
from app.schemas.retrieval import RetrievedChunk
from app.schemas.tutor import TutorGenerationRequest
from app.services.citation_service import CitationService
from app.services.model_router import ModelRouter
from app.services.moderation_service import ModerationService
from app.services.output_safety import OutputSafetyService
from app.services.tutor_service import TutorService
from tests.evaluation.curriculum_cases import CURRICULUM_EVALUATION_CASES


class FixedRagService:
    def __init__(self, chunks: list[RetrievedChunk] | None = None, should_raise: bool = False):
        self.chunks = chunks or []
        self.should_raise = should_raise

    async def search(self, filter_params):
        if self.should_raise:
            raise RuntimeError("retrieval failed")
        # Ensure we only return chunks if we actually have valid scoping metadata for the question
        if not filter_params.class_level or not filter_params.subject_id:
            return []
        return self.chunks


def build_service(case) -> tuple[TutorService, MockLlmProvider]:
    llm = MockLlmProvider(name="eval-mock", model="eval-v1", chunk_delay=0.0)
    chunk = RetrievedChunk(
        chunk_id="fixture-1",
        text="সালোকসংশ্লেষণ হলো উদ্ভিদের খাদ্য তৈরির প্রক্রিয়া। ক্লোরোফিল এর জন্য দায়ী। (a+b)^2 = a^2 + 2ab + b^2. রবীন্দ্রনাথ ঠাকুর বিশ্বকবি।",
        score=0.99,
        book_name="Synthetic Fixture",
        class_level=case["class_level"] if case["class_level"] else 8,
        subject_title="Mock Subject",
        chapter_title="Mock Chapter",
        lesson_title="Mock Lesson",
        page_start=12,
        page_end=13,
        curriculum_version="2024",
    )
    # Give answers only if should_answer is True and query is not malicious
    rag = FixedRagService(chunks=[chunk] if (case["should_answer"] and case["is_safe"]) else [])
    service = TutorService(
        moderation_service=ModerationService(),
        rag_service=rag,
        citation_service=CitationService(),
        output_safety_service=OutputSafetyService(),
        model_router=ModelRouter(primary=llm),
    )
    return service, llm


def make_eval_request(case) -> TutorGenerationRequest:
    return TutorGenerationRequest(
        request_id=f"req-eval-{case['name']}",
        user_id="eval-user",
        conversation_id="conv-eval",
        message=case["question"],
        class_level=case["class_level"],
        subject_id=case["subject_id"],
        chapter_id=case["chapter_id"],
        lesson_id=case["lesson_id"],
        history=[],
    )


@pytest.mark.parametrize("case", CURRICULUM_EVALUATION_CASES)
@pytest.mark.asyncio
async def test_reusable_rag_evaluation_cases(case) -> None:
    assert case["name"]
    assert case["question"]

    service, llm = build_service(case)
    request = make_eval_request(case)

    events = []
    async for event in service.stream_tutor_response(request):
        events.append(event)

    event_types = [e.event for e in events]

    assert "metadata" in event_types

    metadata_event = next(e for e in events if e.event == "metadata")
    done_event = next((e for e in events if e.event == "done"), None)

    if not case["is_safe"]:
        # Malicious queries should be blocked
        assert done_event is not None
        assert done_event.data.get("finishReason") == "moderation_block"
        return

    if case["should_answer"]:
        assert metadata_event.data["grounded"] is True
        assert metadata_event.data.get("retrievalUnavailable", False) is False
        assert "citation" in event_types

        citations = [e for e in events if e.event == "citation"]
        assert len(citations) > 0

        if "citationCount" in metadata_event.data:
            assert len(citations) == metadata_event.data["citationCount"]
    else:
        # Ungrounded mode (off-topic or missing context)
        assert metadata_event.data["grounded"] is False
        assert "citation" not in event_types

    # Ensure latency, provider, and model metrics are tracked in the done event
    assert done_event is not None
    assert "latencyMs" in done_event.data
    assert metadata_event.data["provider"] == llm.name
    assert metadata_event.data["model"] == llm.model
