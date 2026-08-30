from fastapi.testclient import TestClient


def test_health_endpoint(client: TestClient) -> None:
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "shikkhok" in data["service"]
    assert "timestamp" in data


def test_readiness_endpoint(client: TestClient) -> None:
    res = client.get("/api/v1/ready")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ("ready", "degraded")
    assert isinstance(data["dependencies"], list)
    assert len(data["dependencies"]) >= 2
