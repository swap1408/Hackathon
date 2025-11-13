from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_alerts():
    response = client.post("/api/alerts/predict", json={
        "age": 60, "aqi": 120, "health_flag": "asthma"
    })
    assert response.status_code == 200
    data = response.json()
    assert "alert_message" in data
    print("✅ Alerts API test passed:", data)
