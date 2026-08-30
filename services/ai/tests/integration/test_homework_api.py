import json

from fastapi.testclient import TestClient

from tests.conftest import make_hmac_headers


def test_homework_evaluate_api_success(client: TestClient) -> None:
    payload = {
        "submission_id": "sub_eval_999",
        "student_id": "student_001",
        "language": "bn",
        "class_level": 8,
        "subject_id": "science",
        "subject_title": "বিজ্ঞান",
        "chapter_id": "chemical_reactions",
        "chapter_title": "রাসায়নিক বিক্রিয়া",
        "prompt": "দহন বিক্রিয়া ব্যাখ্যা করো",
        "raw_text": "C + O2 = CO2 + তাপ",
    }

    body = json.dumps(payload).encode("utf-8")
    headers = make_hmac_headers(path="/api/v1/homework/evaluate", body_bytes=body)
    headers["Content-Type"] = "application/json"

    res = client.post("/api/v1/homework/evaluate", content=body, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["submission_id"] == "sub_eval_999"
    assert "score" in data
    assert "summary" in data
    assert "strengths" in data
    assert "corrections" in data
    assert "recommendations" in data


def test_homework_evaluate_unauthorized(client: TestClient) -> None:
    payload = {
        "submission_id": "sub_unauth",
        "student_id": "student_x",
        "prompt": "Test question",
    }
    body = json.dumps(payload).encode("utf-8")

    # Missing headers
    res = client.post("/api/v1/homework/evaluate", content=body)
    assert res.status_code == 422

    # Invalid HMAC signature
    headers = make_hmac_headers(path="/api/v1/homework/evaluate", body_bytes=body)
    headers["X-Service-Signature"] = "invalid_signature"
    headers["Content-Type"] = "application/json"

    res_invalid = client.post("/api/v1/homework/evaluate", content=body, headers=headers)
    assert res_invalid.status_code == 401
