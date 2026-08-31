import pytest

from app.providers.llm.mock import MockLlmProvider
from app.schemas.retrieval import RetrievedChunk
from app.services.citation_service import CitationService
from app.services.model_router import ModelRouter
from app.services.moderation_service import ModerationService
from app.services.output_safety import OutputSafetyService
from app.services.tutor_service import TutorService
from tests.evaluation.curriculum_cases import CURRICULUM_EVALUATION_CASES
from tests.unit.test_tutor_grounding import make_request


class FixedRagService:
    def __init__(self, chunks: list[RetrievedChunk] | None = None, should_raise: bool = False):
        self.chunks = chunks or []
        self.should_raise = should_raise

    async def search(self, filter_params):  # type: ignore[no-untyped-def]
        if self.should_raise:
            raise RuntimeError("retrieval failed")
        return self.chunks


def build_service(should_answer: bool) -> tuple[TutorService, MockLlmProvider]:
    llm = MockLlmProvider(name="eval-mock", model="eval-v1", chunk_delay=0.0)
    chunk = RetrievedChunk(
        chunk_id="fixture-1",
        text="সালোকসংশ্লেষণ হলো উদ্ভিদের খাদ্য তৈরির প্রক্রিয়া।",
        score=0.99,
        book_name="Synthetic Fixture",
        class_level=6,
        subject_title="বিজ্ঞান",
        chapter_title="উদ্ভিদের জীবন",
        lesson_title="সালোকসংশ্লেষণ",
        page_start=12,
        page_end=13,
    )
    rag = FixedRagService(chunks=[chunk] if should_answer else [])
    service = TutorService(
        moderation_service=ModerationService(),
        rag_service=rag,
        citation_service=CitationService(),
        output_safety_service=OutputSafetyService(),
        model_router=ModelRouter(primary=llm),
        grounding_mode="strict" if not should_answer else "hybrid",
    )
    return service, llm


@pytest.mark.parametrize("case", CURRICULUM_EVALUATION_CASES)
@pytest.mark.asyncio
async def test_reusable_rag_evaluation_cases(case) -> None:  # type: ignore[no-untyped-def]
    assert case["name"]
    assert case["question"]
    assert isinstance(case["expected_keywords"], list)

    service, llm = build_service(case["should_answer"])
    request = make_request()
    request.message = case["question"]

    events = []
    async for event in service.stream_tutor_response(request):
        events.append(event)

    if case["should_answer"]:
        assert any(event.event == "citation" for event in events)
    else:
        assert [event.event for event in events] == ["error"]
