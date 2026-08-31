import base64
import time

from fastapi import APIRouter, Depends
from fastapi.responses import Response

from app.core.dependencies import get_rag_service, get_tutor_service
from app.core.security import verify_service_hmac
from app.providers.voice.gemini_stt import GeminiSpeechToTextProvider
from app.providers.voice.tts_provider import BanglaTextToSpeechProvider
from app.schemas.retrieval import RetrievalFilter
from app.schemas.tutor import TutorGenerationRequest
from app.schemas.voice import (
    AudioSynthesisRequest,
    AudioTranscriptionRequest,
    AudioTranscriptionResponse,
    VoiceTurnRequest,
    VoiceTurnResponse,
)
from app.services.rag_service import RagService
from app.services.tutor_service import TutorService

router = APIRouter(prefix="/voice", tags=["Voice AI"])

stt_provider = GeminiSpeechToTextProvider()
tts_provider = BanglaTextToSpeechProvider()


@router.post("/transcribe", response_model=AudioTranscriptionResponse)
async def transcribe_audio(
    payload: AudioTranscriptionRequest,
    _caller_service: str = Depends(verify_service_hmac),
) -> AudioTranscriptionResponse:
    return await stt_provider.transcribe(payload)


@router.post("/synthesize")
async def synthesize_speech(
    payload: AudioSynthesisRequest,
    _caller_service: str = Depends(verify_service_hmac),
) -> Response:
    audio_bytes = await tts_provider.synthesize(payload)
    media_type = "audio/wav" if payload.audio_format == "wav" else "audio/mpeg"
    return Response(
        content=audio_bytes,
        media_type=media_type,
        headers={"Content-Disposition": f'inline; filename="synthesized.{payload.audio_format}"'},
    )


@router.post("/turn", response_model=VoiceTurnResponse)
async def voice_conversation_turn(
    payload: VoiceTurnRequest,
    _caller_service: str = Depends(verify_service_hmac),
    tutor_service: TutorService = Depends(get_tutor_service),
    rag_service: RagService = Depends(get_rag_service),
) -> VoiceTurnResponse:
    # 1. Transcribe incoming student voice note
    stt_res = await stt_provider.transcribe(
        AudioTranscriptionRequest(
            audio_base64=payload.audio_base64,
            audio_format=payload.audio_format,
            language_hint="bn",
        )
    )
    user_query = stt_res.transcript

    # 2. Retrieve curriculum grounding context
    filter_params = RetrievalFilter(
        query=user_query,
        class_level=payload.class_level,
        subject_id=payload.subject_id,
        chapter_id=payload.chapter_id,
        lesson_id=payload.lesson_id,
        curriculum_version=payload.curriculum_version,
        academic_year=payload.academic_year,
        top_k=3,
        min_score=0.35,
    )
    retrieved_chunks = await rag_service.search(filter_params)
    grounded = bool(retrieved_chunks)

    # 3. Generate concise conversational voice reply
    tutor_req = TutorGenerationRequest(
        request_id=f"voice_{int(time.time() * 1000)}",
        user_id=payload.student_id,
        conversation_id=payload.conversation_id or f"voice_conv_{payload.student_id}",
        message=user_query,
        class_level=payload.class_level,
        subject_id=payload.subject_id,
        chapter_id=payload.chapter_id,
        lesson_id=payload.lesson_id,
        curriculum_year=payload.academic_year,
    )

    tutor_text_chunks: list[str] = []
    async for event in tutor_service.stream_tutor_response(tutor_req):
        if event.event == "delta" and isinstance(event.data, dict):
            tutor_text_chunks.append(event.data.get("text", ""))

    reply_text = "".join(tutor_text_chunks).strip()
    if not reply_text:
        reply_text = "আমি আপনার কথাটি বুঝতে পেরেছি। বিষয়টি আরেকটু বিস্তারিত বলবেন কি?"

    # 4. Synthesize reply text to audio
    audio_bytes = await tts_provider.synthesize(
        AudioSynthesisRequest(
            text=reply_text,
            speech_rate=payload.speech_rate,
            audio_format="wav",
        )
    )
    audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

    citations = [
        {
            "bookId": c.book_id,
            "bookName": c.book_name,
            "pageStart": c.page_start,
            "pageEnd": c.page_end,
            "chapterTitle": c.chapter_title,
        }
        for c in retrieved_chunks
    ]

    return VoiceTurnResponse(
        user_transcript=user_query,
        tutor_reply_text=reply_text,
        audio_base64=audio_b64,
        audio_format="wav",
        citations=citations,
        grounded=grounded,
    )
