from app.schemas.vector_store import VectorStoreEmbeddingMetadata


def validate_embedding_compatibility(
    active: VectorStoreEmbeddingMetadata,
    stored: VectorStoreEmbeddingMetadata,
) -> None:
    if active.provider != stored.provider:
        raise ValueError(
            "Embedding compatibility mismatch: provider differs "
            f"(active={active.provider}, stored={stored.provider})"
        )
    if active.model != stored.model:
        raise ValueError(
            "Embedding compatibility mismatch: model differs "
            f"(active={active.model}, stored={stored.model})"
        )
    if active.dimension != stored.dimension:
        raise ValueError(
            "Embedding compatibility mismatch: dimension differs "
            f"(active={active.dimension}, stored={stored.dimension})"
        )
    if active.version != stored.version:
        raise ValueError(
            "Embedding compatibility mismatch: version differs "
            f"(active={active.version}, stored={stored.version})"
        )
