import hashlib
import math


class DeterministicEmbeddingProvider:
    name: str = "deterministic-mock"
    dimension: int = 128

    def __init__(self, dimension: int = 128) -> None:
        self.dimension = dimension

    def _embed(self, text: str) -> list[float]:
        # Generate deterministic vector based on MD5 and character distributions
        vec: list[float] = []
        for i in range(self.dimension):
            h = hashlib.md5(f"{text}:{i}".encode()).digest()
            val = (h[0] / 255.0) * 2.0 - 1.0
            vec.append(val)

        # Normalize
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec

    async def embed_query(self, text: str) -> list[float]:
        return self._embed(text)

    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self._embed(t) for t in texts]
