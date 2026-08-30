import uuid
from contextvars import ContextVar

request_id_var: ContextVar[str] = ContextVar("request_id", default="")


def get_request_id() -> str:
    req_id = request_id_var.get()
    if not req_id:
        req_id = str(uuid.uuid4())
        request_id_var.set(req_id)
    return req_id


def set_request_id(req_id: str | None) -> str:
    active_id = req_id.strip() if req_id and req_id.strip() else str(uuid.uuid4())
    request_id_var.set(active_id)
    return active_id
