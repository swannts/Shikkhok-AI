from dataclasses import dataclass


@dataclass(slots=True)
class VectorStoreEmbeddingMetadata:
    provider: str
    model: str
    dimension: int
    version: int = 1
