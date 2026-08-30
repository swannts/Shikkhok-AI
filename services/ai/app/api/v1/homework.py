from fastapi import APIRouter, Depends

from app.core.dependencies import get_homework_service
from app.core.security import verify_service_hmac
from app.schemas.homework import HomeworkEvaluationRequest, HomeworkEvaluationResponse
from app.services.homework_service import HomeworkService

router = APIRouter(prefix="/homework", tags=["Homework"])


@router.post("/evaluate", response_model=HomeworkEvaluationResponse)
async def evaluate_homework(
    payload: HomeworkEvaluationRequest,
    _caller: str = Depends(verify_service_hmac),
    service: HomeworkService = Depends(get_homework_service),
) -> HomeworkEvaluationResponse:
    """Evaluates student homework with step-by-step correction and curriculum citations."""
    return await service.evaluate_submission(payload)
