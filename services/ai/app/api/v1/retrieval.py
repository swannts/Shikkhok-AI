from fastapi import APIRouter, Depends

from app.core.dependencies import get_rag_service
from app.core.security import verify_service_hmac
from app.schemas.retrieval import RetrievalFilter, RetrievedChunk
from app.services.rag_service import RagService

router = APIRouter(prefix="/retrieval", tags=["Retrieval"])


@router.post("/search", response_model=list[RetrievedChunk])
async def search_curriculum(
    filter_params: RetrievalFilter,
    _caller_service: str = Depends(verify_service_hmac),
    rag_service: RagService = Depends(get_rag_service),
) -> list[RetrievedChunk]:
    return await rag_service.search(filter_params)
