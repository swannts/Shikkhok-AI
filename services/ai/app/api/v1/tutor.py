import asyncio
import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from app.core.dependencies import get_tutor_service
from app.core.security import verify_service_hmac
from app.schemas.tutor import TutorGenerationRequest
from app.services.tutor_service import TutorService

router = APIRouter(prefix="/tutor", tags=["Tutor"])


@router.post("/stream")
async def stream_tutor(
    payload: TutorGenerationRequest,
    request: Request,
    _caller_service: str = Depends(verify_service_hmac),
    tutor_service: TutorService = Depends(get_tutor_service),
) -> StreamingResponse:
    cancellation_event = asyncio.Event()

    async def disconnect_monitor() -> None:
        while not cancellation_event.is_set():
            if await request.is_disconnected():
                cancellation_event.set()
                break
            await asyncio.sleep(0.25)

    monitor_task = asyncio.create_task(disconnect_monitor())

    async def event_generator() -> AsyncIterator[bytes]:
        try:
            async for event in tutor_service.stream_tutor_response(
                request=payload,
                cancellation_event=cancellation_event,
            ):
                if cancellation_event.is_set():
                    break

                event_str = (
                    f"event: {event.event}\ndata: {json.dumps(event.data, ensure_ascii=False)}\n\n"
                )
                yield event_str.encode("utf-8")
        except Exception:
            err_frame = (
                "event: error\n"
                'data: {"code": "AI_STREAM_FAILED", "message": "AI generation is temporarily unavailable.", "banglaMessage": "এআই টিউটর সাময়িকভাবে সাড়া দিতে পারছে না।"}\n\n'
            )
            yield err_frame.encode("utf-8")
        finally:
            cancellation_event.set()
            monitor_task.cancel()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
