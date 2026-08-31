import base64
import math
import struct

from app.schemas.voice import (
    AudioSynthesisRequest,
    AudioTranscriptionRequest,
    AudioTranscriptionResponse,
)


class MockSpeechToTextProvider:
    name: str = "mock-stt"

    async def transcribe(self, request: AudioTranscriptionRequest) -> AudioTranscriptionResponse:
        # Decode base64 payload to estimate audio activity
        try:
            audio_bytes = base64.b64decode(request.audio_base64)
            size_kb = len(audio_bytes) / 1024.0
        except Exception:
            size_kb = 10.0

        sample_transcripts = {
            "bn": "নিউটনের গতির দ্বিতীয় সূত্রটি ব্যাখ্যা করুন।",
            "en": "Explain Newton's second law of motion.",
        }
        lang = request.language_hint if request.language_hint in sample_transcripts else "bn"
        text = sample_transcripts[lang]

        return AudioTranscriptionResponse(
            transcript=text,
            detected_language=lang,
            confidence=0.96,
            duration_seconds=round(max(1.0, size_kb / 16.0), 2),
        )


class MockTextToSpeechProvider:
    name: str = "mock-tts"

    async def synthesize(self, request: AudioSynthesisRequest) -> bytes:
        # Generate a valid 44.1kHz 16-bit mono PCM WAV audio buffer
        sample_rate = 44100
        duration_s = min(max(0.5, len(request.text) * 0.05 / request.speech_rate), 10.0)
        num_samples = int(sample_rate * duration_s)
        frequency = 440.0 * request.pitch

        # Sine wave tone
        pcm_data = bytearray()
        for i in range(num_samples):
            val = int(32767.0 * 0.3 * math.sin(2.0 * math.pi * frequency * (i / sample_rate)))
            pcm_data.extend(struct.pack("<h", val))

        # Standard 44-byte WAV header
        header = bytearray(b"RIFF")
        total_data_len = len(pcm_data)
        header.extend(struct.pack("<I", total_data_len + 36))
        header.extend(b"WAVEfmt ")
        header.extend(struct.pack("<I", 16))  # Subchunk1Size (16 for PCM)
        header.extend(struct.pack("<H", 1))  # AudioFormat (1 for PCM)
        header.extend(struct.pack("<H", 1))  # NumChannels (1 mono)
        header.extend(struct.pack("<I", sample_rate))
        header.extend(struct.pack("<I", sample_rate * 2))  # ByteRate
        header.extend(struct.pack("<H", 2))  # BlockAlign
        header.extend(struct.pack("<H", 16))  # BitsPerSample
        header.extend(b"data")
        header.extend(struct.pack("<I", total_data_len))

        return bytes(header + pcm_data)
