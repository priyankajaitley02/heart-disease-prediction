from fastapi.testclient import TestClient

import main


def test_health_check():
    with TestClient(main.app) as client:
        assert client.get("/health").json() == {"status": "ok"}


def test_predict_reports_missing_model():
    main.model = None
    payload = {
        "age": 55,
        "sex": "Male",
        "dataset": "Cleveland",
        "cp": "asymptomatic",
        "trestbps": 140,
        "chol": 250,
        "fbs": "False",
        "restecg": "normal",
        "thalch": 150,
        "exang": "False",
        "oldpeak": 1.2,
        "slope": "flat",
        "ca": 0,
        "thal": "normal",
    }
    with TestClient(main.app) as client:
        response = client.post("/predict", json=payload)
    assert response.status_code == 503


def test_predict_validates_input():
    payload = {"age": "not-a-number"}
    with TestClient(main.app) as client:
        response = client.post("/predict", json=payload)
    assert response.status_code == 422
