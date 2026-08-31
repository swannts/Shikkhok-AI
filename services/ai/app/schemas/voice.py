from typing import Any, Literal

from pydantic import BaseModel, Field


class AudioTranscriptionRequest(BaseModel):
    audio_base64: str = Field(..., description="Base64-encoded raw audio file")
    audio_format: Literal["wav", "mp3", "m4a", "aac", "ogg", "pcm"] = Field(
        default="wav", description="Audio MIME format"
    )
    language_hint: str = Field(default="bn", description="Expected language (e.g. 'bn' or 'en')")


class AudioTranscriptionResponse(BaseModel):
    transcript: str
    detected_language: str
    confidence: float
    duration_seconds: float | None = None


class AudioSynthesisRequest(BaseModel):
    text: str = Field(..., description="Text content to synthesize to spoken audio")
    voice_id: str = Field(default="bn_female_standard", description="Voice profile ID")
    speech_rate: float = Field(default=1.0, ge=0.5, le=2.0, description="Speech rate multiplier")
    pitch: float = Field(default=1.0, ge=0.5, le=1.5, description="Voice pitch multiplier")
    audio_format: Literal["wav", "mp3"] = Field(default="wav", description="Output audio format")


class VoiceTurnRequest(BaseModel):
    audio_base64: str = Field(..., description="Base64 student audio query")
    audio_format: Literal["wav", "mp3", "m4a", "aac", "ogg", "pcm"] = "wav"
    student_id: str
    conversation_id: str | None = None
    class_level: int = 8
    subject_id: str = "general"
    chapter_id: str | None = None
    lesson_id: str | None = None
    curriculum_version: str = "2024-NCTB"
    academic_year: int = 2026
    speech_rate: float = 1.0


class VoiceTurnResponse(BaseModel):
    user_transcript: str
    tutor_reply_text: str
    audio_base64: str
    audio_format: str
    citations: list[dict[str, Any]] = []
    grounded: bool = True
