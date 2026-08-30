from fastapi import APIRouter, Depends

from app.core.security import verify_service_hmac
from app.providers.embeddings.primary import DeterministicEmbeddingProvider
from app.providers.vector_store.memory import InMemoryVectorStore
from app.schemas.retrieval import RetrievalFilter, RetrievedChunk
from app.services.rag_service import RagService

router = APIRouter(prefix="/retrieval", tags=["Retrieval"])

rag_service_instance = RagService(
    embedding_provider=DeterministicEmbeddingProvider(),
    vector_store=InMemoryVectorStore(),
)


@router.post("/search", response_model=list[RetrievedChunk])
async def search_curriculum(
    filter_params: RetrievalFilter,
    _caller_service: str = Depends(verify_service_hmac),
) -> list[RetrievedChunk]:
    return await rag_service_instance.search(filter_params)
