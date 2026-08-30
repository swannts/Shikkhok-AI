import asyncio
from collections.abc import AsyncIterator

from app.providers.llm.base import LlmTextDelta


class MockLlmProvider:
    name: str = "mock"
    model: str = "mock-tutor-v1"

    def __init__(
        self,
        name: str = "mock",
        model: str = "mock-tutor-v1",
        chunk_delay: float = 0.01,
        custom_response: str | None = None,
    ) -> None:
        self.name = name
        self.model = model
        self.chunk_delay = chunk_delay
        self.custom_response = custom_response

    async def generate(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1500,
    ) -> str:
        if self.custom_response is not None:
            return self.custom_response
        last_message = messages[-1]["content"] if messages else ""
        return f"ঠিক আছে! আমি বিষয়টি বুঝিয়ে দিচ্ছি। তোমার প্রশ্ন: {last_message}। বিস্তারিত [source_1] এ রয়েছে।"

    async def stream(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1500,
    ) -> AsyncIterator[LlmTextDelta]:
        last_message = messages[-1]["content"] if messages else ""
        chunks = [
            "ঠিক আছে! ",
            "আমি বিষয়টি ",
            "তোমাকে ধাপে ধাপে বুঝিয়ে দিচ্ছি। ",
            f"প্রশ্নের মূল ধারণা: {last_message[:60]}... ",
            "প্রথমত, মূল সংজ্ঞা এবং সূত্রটি মনে রাখা জরুরি। [source_1] ",
            "দ্বিতীয়ত, বাস্তব উদাহরণ দিয়ে অনুশীলন করলে সহজ লাগবে। ",
            "কোনো অংশ অস্পষ্ট লাগলে প্রশ্ন করতে পারো!",
        ]

        for chunk in chunks:
            if self.chunk_delay > 0:
                await asyncio.sleep(self.chunk_delay)
            yield LlmTextDelta(text=chunk)
