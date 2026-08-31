import httpx

from app.core.config import settings
from app.core.logging import logger
from app.providers.voice.mock_voice import MockSpeechToTextProvider
from app.schemas.voice import AudioTranscriptionRequest, AudioTranscriptionResponse


class GeminiSpeechToTextProvider:
    name: str = "gemini-stt"

    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key or settings.llm_api_key
        self.fallback = MockSpeechToTextProvider()

    async def transcribe(self, request: AudioTranscriptionRequest) -> AudioTranscriptionResponse:
        if not self.api_key:
            return await self.fallback.transcribe(request)

        # Build Gemini 1.5 audio transcription multimodal call
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
        mime_map = {
            "wav": "audio/wav",
            "mp3": "audio/mp3",
            "m4a": "audio/m4a",
            "aac": "audio/aac",
            "ogg": "audio/ogg",
            "pcm": "audio/wav",
        }
        mime_type = mime_map.get(request.audio_format, "audio/wav")

        prompt = (
            "You are an expert audio transcriber for Bangladeshi students. "
            "Accurately transcribe the spoken voice in this audio file verbatim in Bengali (or English if spoken). "
            "Output ONLY the transcribed text, without any explanations or quotation marks."
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": request.audio_base64,
                            }
                        },
                    ]
                }
            ],
            "generationConfig": {"temperature": 0.0},
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        content_parts = candidates[0].get("content", {}).get("parts", [])
                        if content_parts:
                            transcript_text = content_parts[0].get("text", "").strip()
                            return AudioTranscriptionResponse(
                                transcript=transcript_text,
                                detected_language="bn"
                                if any("\u0980" <= c <= "\u09ff" for c in transcript_text)
                                else "en",
                                confidence=0.98,
                            )
            logger.warning("Gemini STT API returned non-200, falling back to mock STT")
            return await self.fallback.transcribe(request)
        except Exception as err:
            logger.warning(f"Gemini STT failed with {err}, falling back to mock STT")
            return await self.fallback.transcribe(request)
