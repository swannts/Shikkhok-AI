import json
import time

from fastapi.testclient import TestClient

from tests.conftest import make_hmac_headers


def test_hmac_valid_request(client: TestClient) -> None:
    body = json.dumps({"query": "algebra", "class_level": 8}).encode("utf-8")
    headers = make_hmac_headers(path="/api/v1/retrieval/search", body_bytes=body)
    headers["Content-Type"] = "application/json"

    res = client.post("/api/v1/retrieval/search", content=body, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)


def test_hmac_tampered_body_rejected(client: TestClient) -> None:
    body = json.dumps({"query": "algebra"}).encode("utf-8")
    headers = make_hmac_headers(path="/api/v1/retrieval/search", body_bytes=body)
    headers["Content-Type"] = "application/json"

    tampered_body = json.dumps({"query": "tampered-payload"}).encode("utf-8")
    res = client.post("/api/v1/retrieval/search", content=tampered_body, headers=headers)
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "INTERNAL_AUTH_ERROR"


def test_hmac_expired_timestamp_rejected(client: TestClient) -> None:
    body = json.dumps({"query": "algebra"}).encode("utf-8")
    # Timestamp 10 minutes in the past
    stale_timestamp = str(int(time.time()) - 600)
    headers = make_hmac_headers(
        path="/api/v1/retrieval/search",
        body_bytes=body,
        timestamp=stale_timestamp,
    )
    headers["Content-Type"] = "application/json"

    res = client.post("/api/v1/retrieval/search", content=body, headers=headers)
    assert res.status_code == 401
    assert "expired" in res.json()["error"]["message"].lower()


def test_hmac_unauthorized_service_name_rejected(client: TestClient) -> None:
    body = json.dumps({"query": "algebra"}).encode("utf-8")
    headers = make_hmac_headers(
        path="/api/v1/retrieval/search",
        body_bytes=body,
        service_name="unauthorized-service",
    )
    headers["Content-Type"] = "application/json"

    res = client.post("/api/v1/retrieval/search", content=body, headers=headers)
    assert res.status_code == 401
    assert "not authorized" in res.json()["error"]["message"].lower()


def test_hmac_invalid_secret_rejected(client: TestClient) -> None:
    body = json.dumps({"query": "algebra"}).encode("utf-8")
    headers = make_hmac_headers(
        path="/api/v1/retrieval/search",
        body_bytes=body,
        secret="completely-wrong-secret-key",
    )
    headers["Content-Type"] = "application/json"

    res = client.post("/api/v1/retrieval/search", content=body, headers=headers)
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "INTERNAL_AUTH_ERROR"
