from typing import Protocol, runtime_checkable

from app.schemas.voice import (
    AudioSynthesisRequest,
    AudioTranscriptionRequest,
    AudioTranscriptionResponse,
)


@runtime_checkable
class SpeechToTextProvider(Protocol):
    name: str

    async def transcribe(self, request: AudioTranscriptionRequest) -> AudioTranscriptionResponse:
        """Transcribe audio bytes to text."""
        ...


@runtime_checkable
class TextToSpeechProvider(Protocol):
    name: str

    async def synthesize(self, request: AudioSynthesisRequest) -> bytes:
        """Synthesize text into audio bytes."""
        ...
