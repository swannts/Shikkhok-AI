import pytest

from app.providers.voice.mock_voice import (
    MockSpeechToTextProvider,
    MockTextToSpeechProvider,
)
from app.schemas.voice import (
    AudioSynthesisRequest,
    AudioTranscriptionRequest,
)


@pytest.mark.asyncio
async def test_mock_speech_to_text_transcription():
    stt = MockSpeechToTextProvider()
    res = await stt.transcribe(
        AudioTranscriptionRequest(
            audio_base64="UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
            audio_format="wav",
            language_hint="bn",
        )
    )
    assert res.transcript != ""
    assert res.detected_language == "bn"
    assert res.confidence >= 0.90


@pytest.mark.asyncio
async def test_mock_text_to_speech_synthesis():
    tts = MockTextToSpeechProvider()
    audio_bytes = await tts.synthesize(
        AudioSynthesisRequest(
            text="বল ও গতির সমীকরণ",
            speech_rate=1.0,
            pitch=1.0,
            audio_format="wav",
        )
    )
    assert len(audio_bytes) > 44
    assert audio_bytes[:4] == b"RIFF"
    assert audio_bytes[8:12] == b"WAVE"
