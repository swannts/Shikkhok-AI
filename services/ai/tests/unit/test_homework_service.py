import pytest

from app.providers.embeddings.primary import DeterministicEmbeddingProvider
from app.providers.llm.mock import MockLlmProvider
from app.providers.vector_store.memory import InMemoryVectorStore
from app.schemas.homework import HomeworkEvaluationRequest
from app.services.citation_service import CitationService
from app.services.homework_service import HomeworkService
from app.services.model_router import ModelRouter
from app.services.moderation_service import ModerationService
from app.services.rag_service import RagService


@pytest.mark.asyncio
async def test_homework_service_evaluation_flow() -> None:
    moderation = ModerationService()
    rag = RagService(
        embedding_provider=DeterministicEmbeddingProvider(),
        vector_store=InMemoryVectorStore(),
    )
    citation = CitationService()
    # Mock LLM returning structured JSON
    mock_json = (
        "{\n"
        '  "score": 92.0,\n'
        '  "summary": "খুব সুন্দরভাবে বীজগণিতের বর্গ সূত্রের সমাধান করা হয়েছে।",\n'
        '  "strengths": ["সূত্র নির্বাচন নির্ভুল", "পরিচ্ছন্ন হস্তাক্ষর"],\n'
        '  "weaknesses": ["চিহ্নের পরিবর্তনে সামান্য অসতর্কতা"],\n'
        '  "corrections": [\n'
        "    {\n"
        '      "original": "4x^2 - 12xy - 9y^2",\n'
        '      "corrected": "4x^2 + 12xy + 9y^2",\n'
        '      "explanation": "(a+b)^2 সূত্রে সব পদ ধনাত্মক হয়। সূত্র: [source_1]"\n'
        "    }\n"
        "  ],\n"
        '  "recommendations": ["বর্গ সূত্রের অনুশীলনী ৪.১ আরও দুবার অনুশীলন করো।"]\n'
        "}"
    )
    mock_llm = MockLlmProvider(name="mock-test", model="mock-1", custom_response=mock_json)
    router = ModelRouter(primary=mock_llm, fallback=mock_llm)

    service = HomeworkService(
        moderation_service=moderation,
        rag_service=rag,
        citation_service=citation,
        model_router=router,
    )

    req = HomeworkEvaluationRequest(
        submission_id="sub_test_123",
        student_id="student_456",
        class_level=8,
        subject_id="mathematics",
        subject_title="গণিত",
        chapter_id="algebra",
        chapter_title="বীজগণিতীয় রাশি",
        prompt="(2x + 3y) এর বর্গ নির্ণয় করো",
        raw_text="(2x + 3y)^2 = 4x^2 - 12xy - 9y^2",
    )

    resp = await service.evaluate_submission(req)

    assert resp.submission_id == "sub_test_123"
    assert resp.score == 92.0
    assert len(resp.strengths) == 2
    assert len(resp.corrections) == 1
    assert resp.corrections[0].corrected == "4x^2 + 12xy + 9y^2"
    assert len(resp.citations) >= 1
