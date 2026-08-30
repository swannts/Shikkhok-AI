import json

from fastapi.testclient import TestClient

from tests.conftest import make_hmac_headers


def test_ingestion_text_api(client: TestClient) -> None:
    payload = {
        "metadata": {
            "curriculum_year": 2026,
            "class_level": 8,
            "medium": "bangla",
            "subject_id": "mathematics",
            "subject_title": "গণিত",
            "chapter_id": "algebra",
            "chapter_title": "বীজগণিতীয় রাশি",
            "source_book": "NCTB Math 8",
            "book_id": "math_test_book",
        },
        "pages": [
            {
                "page_number": 50,
                "text": "বীজগণিতের সাধারণ অনুসিদ্ধান্ত এবং গাণিতিক সমস্যার সমাধান।",
            }
        ],
    }

    body = json.dumps(payload).encode("utf-8")
    headers = make_hmac_headers(path="/api/v1/ingestion/text", body_bytes=body)
    headers["Content-Type"] = "application/json"

    res = client.post("/api/v1/ingestion/text", content=body, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["chunks_created"] >= 1


def test_ingestion_stats_api(client: TestClient) -> None:
    headers = make_hmac_headers(path="/api/v1/ingestion/stats", body_bytes=b"", method="GET")

    res = client.get("/api/v1/ingestion/stats", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_chunks" in data
    assert data["total_chunks"] >= 1
    assert "class_breakdown" in data
    assert "subject_breakdown" in data


def test_delete_book_api(client: TestClient) -> None:
    headers = make_hmac_headers(
        path="/api/v1/ingestion/book/math_test_book",
        body_bytes=b"",
        method="DELETE",
    )

    res = client.delete("/api/v1/ingestion/book/math_test_book", headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
