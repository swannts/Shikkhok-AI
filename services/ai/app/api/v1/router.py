from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.ingestion import router as ingestion_router
from app.api.v1.retrieval import router as retrieval_router
from app.api.v1.tutor import router as tutor_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(health_router)
api_v1_router.include_router(tutor_router)
api_v1_router.include_router(retrieval_router)
api_v1_router.include_router(ingestion_router)
