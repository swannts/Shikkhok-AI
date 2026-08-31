import pytest
from pydantic import ValidationError

from app.providers.llm.mock import MockLlmProvider
from app.schemas.homework import HomeworkEvaluationRequest
from app.schemas.retrieval import RetrievedChunk
from app.services.citation_service import CitationService
from app.services.homework_service import HomeworkService
from app.services.model_router import ModelRouter
from app.services.moderation_service import ModerationService


class FixtureRagService:
    async def search(self, filter_params):  # type: ignore[no-untyped-def]
        return [
            RetrievedChunk(
                chunk_id="fixture-1",
                text="উদ্ভিদ সূর্যালোক ব্যবহার করে খাদ্য তৈরি করে।",
                score=0.99,
                book_name="Synthetic Fixture",
                class_level=6,
                subject_title="বিজ্ঞান",
                chapter_title="উদ্ভিদের জীবন",
                lesson_title="সালোকসংশ্লেষণ",
                page_start=12,
                page_end=13,
            )
        ]


def test_homework_request_rejects_empty_submission() -> None:
    with pytest.raises(ValidationError, match="Homework submission must include raw text"):
        HomeworkEvaluationRequest(
            submission_id="submission-empty",
            student_id="student-1",
            class_level=6,
            subject_id="science",
            chapter_id="plant_life",
            lesson_id="photosynthesis",
            prompt="সালোকসংশ্লেষণ কী?",
        )


def test_homework_request_rejects_oversized_submission() -> None:
    with pytest.raises(ValidationError, match="too large"):
        HomeworkEvaluationRequest(
            submission_id="submission-large",
            student_id="student-1",
            class_level=6,
            subject_id="science",
            chapter_id="plant_life",
            lesson_id="photosynthesis",
            prompt="সালোকসংশ্লেষণ কী?",
            raw_text="উত্তর",
            image_urls=["https://example.com/" + ("a" * 2000)] * 10,
        )


@pytest.mark.asyncio
async def test_homework_service_falls_back_on_malformed_provider_response() -> None:
    moderation = ModerationService()
    citation = CitationService()
    mock_llm = MockLlmProvider(
        name="malformed-response", model="mock-1", custom_response="not json"
    )
    router = ModelRouter(primary=mock_llm, fallback=mock_llm)

    service = HomeworkService(
        moderation_service=moderation,
        rag_service=FixtureRagService(),
        citation_service=citation,
        model_router=router,
    )

    request = HomeworkEvaluationRequest(
        submission_id="sub-malformed",
        student_id="student-1",
        class_level=6,
        subject_id="science",
        subject_title="বিজ্ঞান",
        chapter_id="plant_life",
        chapter_title="উদ্ভিদের জীবন",
        lesson_id="photosynthesis",
        lesson_title="সালোকসংশ্লেষণ",
        prompt="সালোকসংশ্লেষণ কী?",
        raw_text="উদ্ভিদ সূর্যালোক ব্যবহার করে খাদ্য তৈরি করে।",
    )

    response = await service.evaluate_submission(request)

    assert response.summary
    assert response.score == 80.0
    assert response.citations
    assert response.citations[0].source_book == "Synthetic Fixture"
