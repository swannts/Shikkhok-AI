import re
from dataclasses import dataclass


@dataclass
class OutputSafetyResult:
    is_safe: bool
    sanitized_text: str
    redacted_items: list[str]


class OutputSafetyService:
    def __init__(self) -> None:
        self.api_key_patterns = [
            re.compile(r"AIzaSy[0-9A-Za-z_-]{33}"),  # Google API keys
            re.compile(r"sk-[0-9a-zA-Z]{32,}"),  # OpenAI API keys
            re.compile(r"(?:ghp|gho|ghu|ghs|ghr)_[0-9a-zA-Z]{36}"),  # GitHub tokens
        ]

    def validate_and_sanitize(self, text: str) -> OutputSafetyResult:
        sanitized = text
        redacted: list[str] = []

        for pattern in self.api_key_patterns:
            matches = [match.group(0) for match in pattern.finditer(sanitized)]
            if not matches:
                continue
            redacted.extend(matches)
            sanitized = pattern.sub("[REDACTED_CREDENTIAL]", sanitized)

        return OutputSafetyResult(
            is_safe=True,
            sanitized_text=sanitized,
            redacted_items=redacted,
        )
