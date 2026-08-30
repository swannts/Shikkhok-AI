import re
from dataclasses import dataclass


@dataclass
class ModerationResult:
    is_safe: bool
    category: str = "none"
    reason: str = ""
    safe_response_bn: str = ""


class ModerationService:
    def __init__(self) -> None:
        # Prompt injection patterns
        self.injection_patterns = [
            re.compile(r"ignore\s+(all\s+)?(previous|prior)\s+instructions", re.IGNORECASE),
            re.compile(r"system\s+prompt\s+leak", re.IGNORECASE),
            re.compile(
                r"reveal\s+(your\s+)?(system|internal)\s+(prompt|instructions)", re.IGNORECASE
            ),
            re.compile(r"print\s+api\s*key", re.IGNORECASE),
            re.compile(r"give\s+me\s+your\s+instructions", re.IGNORECASE),
            re.compile(r"তুমি\s+তোমার\s+সিস্টেম\s+প্রম্পট\s+দেখা(ও|বে)", re.IGNORECASE),
        ]

        # Dangerous weapons / explosives (not normal educational chemistry)
        self.weapon_patterns = [
            re.compile(
                r"\b(how\s+to\s+)?(make|build|construct|assemble|create)\b.*\b(bomb|pipe\s+bomb|explosive|grenade|ied)\b",
                re.IGNORECASE,
            ),
            re.compile(r"\binstructions\s+to\s+.*\b(explosive|bomb|weapon|ied)\b", re.IGNORECASE),
            re.compile(r"(বোমা|গ্রেনেড|বিস্ফোরক)\s*বানানো(র)?\s*(নিয়ম|পদ্ধতি|উপায়)", re.IGNORECASE),
            re.compile(
                r"\b(synthesize|manufacture)\s+(ricin|sarin|cyanide|mustard\s+gas)\b", re.IGNORECASE
            ),
        ]

        # Self-harm
        self.self_harm_patterns = [
            re.compile(
                r"\b(how\s+to\s+(kill|hang|poison|slit)\s+(myself|yourself))\b", re.IGNORECASE
            ),
            re.compile(r"\b(commit\s+suicide|want\s+to\s+die|end\s+my\s+life)\b", re.IGNORECASE),
            re.compile(r"(আত্মহত্যা\s*করার\s*উপায়|মরতে\s*চাই|নিজেকে\s*শেষ\s*করতে)", re.IGNORECASE),
        ]

        # Explicit sexual content
        self.sexual_patterns = [
            re.compile(r"\b(porn|hardcore\s+pornography|explicit\s+sex\s+scene)\b", re.IGNORECASE),
            re.compile(r"(চটি\s*গল্প|যৌন\s*উদ্দীপক\s*গল্প)", re.IGNORECASE),
        ]

    def moderate_input(self, text: str) -> ModerationResult:
        trimmed = text.strip()
        if not trimmed:
            return ModerationResult(
                is_safe=False,
                category="empty_input",
                reason="Input text cannot be empty",
                safe_response_bn="অনুগ্রহ করে একটি স্পষ্ট প্রশ্ন লিখুন।",
            )

        # 1. Check self-harm
        for pattern in self.self_harm_patterns:
            if pattern.search(trimmed):
                return ModerationResult(
                    is_safe=False,
                    category="self_harm",
                    reason="Content related to self-harm detected",
                    safe_response_bn="তুমি একা নও। যে কোনো কঠিন সময়ে সহায়তার জন্য কান পেতে রই (Kaan Pete Roi) হেল্পলাইন: +8801779554391 এ যোগাযোগ করো। জীবন অনেক মূল্যবান।",
                )

        # 2. Check weapons and explosives
        for pattern in self.weapon_patterns:
            if pattern.search(trimmed):
                return ModerationResult(
                    is_safe=False,
                    category="dangerous_content",
                    reason="Weapons or explosive manufacturing instructions detected",
                    safe_response_bn="শিক্ষামূলক বিজ্ঞান ও রসায়নের তাত্ত্বিক নিয়ম আলোচনা করা গেলেও ধ্বংসাত্মক বা ক্ষতিকর বস্তু তৈরির নির্দেশনা দেওয়া নিরাপদ নয়।",
                )

        # 3. Check prompt injection / secret extraction
        for pattern in self.injection_patterns:
            if pattern.search(trimmed):
                return ModerationResult(
                    is_safe=False,
                    category="prompt_injection",
                    reason="Prompt injection or system instruction extraction detected",
                    safe_response_bn="আমি Shikkhok AI, পাঠ্যক্রম সংক্রান্ত যে কোনো পড়ালেখার প্রশ্নে তোমাকে সাহায্য করতে প্রস্তুত।",
                )

        # 4. Check sexual content
        for pattern in self.sexual_patterns:
            if pattern.search(trimmed):
                return ModerationResult(
                    is_safe=False,
                    category="sexual_content",
                    reason="Explicit sexual content detected",
                    safe_response_bn="এই ধরনের বিষয়বস্তু আমাদের শিক্ষামূলক প্ল্যাটফর্মে অনুমোদিত নয়।",
                )

        return ModerationResult(is_safe=True)
