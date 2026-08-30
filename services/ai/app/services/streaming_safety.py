import re
from typing import ClassVar


class StreamingOutputSafetyFilter:
    """Incremental streaming output safety filter with a rolling buffer.

    Prevents leaking credentials or unsafe payloads that may be fragmented across
    individual token streaming chunks.
    """

    LOOKAHEAD_WINDOW: int = 40

    CREDENTIAL_PATTERNS: ClassVar[list[re.Pattern[str]]] = [
        re.compile(r"AIzaSy[0-9A-Za-z_-]{33}"),  # Google API keys
        re.compile(r"sk-[0-9a-zA-Z]{32,}"),  # OpenAI API keys
        re.compile(r"(ghp|gho|ghu|ghs|ghr)_[0-9a-zA-Z]{36}"),  # GitHub tokens
        re.compile(r"dev-internal-[a-zA-Z0-9_-]{10,}"),  # Internal secret signatures
    ]

    UNSAFE_TOPIC_PATTERNS: ClassVar[list[re.Pattern[str]]] = [
        re.compile(
            r"\b(how\s+to\s+)?(make|build|assemble)\s+(bomb|explosive|ied)\b",
            re.IGNORECASE,
        ),
        re.compile(
            r"(বোমা|বিস্ফোরক)\s*বানানো(র)?\s*(নিয়ম|পদ্ধতি)",
            re.IGNORECASE,
        ),
    ]

    def __init__(self, lookahead_window: int = 40) -> None:
        self.lookahead_window = lookahead_window
        self._buffer = ""
        self.redacted_count = 0

    def _sanitize(self, text: str) -> str:
        sanitized = text
        for pattern in self.CREDENTIAL_PATTERNS:
            matches = pattern.findall(sanitized)
            for m in matches:
                self.redacted_count += 1
                sanitized = sanitized.replace(m, "[REDACTED_CREDENTIAL]")

        for pattern in self.UNSAFE_TOPIC_PATTERNS:
            matches = pattern.findall(sanitized)
            for m in matches:
                match_str = m[0] if isinstance(m, tuple) else m
                self.redacted_count += 1
                sanitized = sanitized.replace(match_str, "[REDACTED_CONTENT]")

        return sanitized

    def feed(self, chunk: str) -> str:
        """Appends chunk to rolling buffer and returns safe prefix text to emit."""
        if not chunk:
            return ""

        self._buffer += chunk
        self._buffer = self._sanitize(self._buffer)

        if len(self._buffer) > self.lookahead_window:
            safe_emit = self._buffer[: -self.lookahead_window]
            self._buffer = self._buffer[-self.lookahead_window :]
            return safe_emit

        return ""

    def finalize(self) -> str:
        """Flushes and sanitizes any remaining text held in the rolling buffer."""
        remaining = self._sanitize(self._buffer)
        self._buffer = ""
        return remaining
