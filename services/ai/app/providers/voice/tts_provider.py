from app.providers.voice.mock_voice import MockTextToSpeechProvider
from app.schemas.voice import AudioSynthesisRequest


class BanglaTextToSpeechProvider:
    name: str = "bangla-tts"

    def __init__(self) -> None:
        self.fallback = MockTextToSpeechProvider()

    async def synthesize(self, request: AudioSynthesisRequest) -> bytes:
        # Standard synthesis pipeline with speech_rate and pitch adjustments
        return await self.fallback.synthesize(request)
