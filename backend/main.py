"""FastAPI service for the Heart Disease ML Classifier practice project."""

from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

MODEL_PATH = Path(__file__).parent / "model" / "model.joblib"
model = None
model_load_error: str | None = None


def load_model() -> None:
    """Load the complete sklearn pipeline once when the API starts."""
    global model, model_load_error
    model = None
    model_load_error = None

    if not MODEL_PATH.exists():
        model_load_error = f"Model file not found at {MODEL_PATH.name}."
        return

    try:
        model = joblib.load(MODEL_PATH)
    except Exception:
        # Keep implementation details out of the API response.
        model_load_error = "The saved model could not be loaded."


@asynccontextmanager
async def lifespan(_: FastAPI):
    load_model()
    yield


class PredictionInput(BaseModel):
    """Input schema matching the columns used by the trained pipeline."""

    age: int = Field(ge=1, le=120)
    sex: Literal["Female", "Male"]
    dataset: Literal["Cleveland", "Hungary", "Switzerland", "VA Long Beach"]
    cp: Literal["typical angina", "atypical angina", "non-anginal", "asymptomatic"]
    trestbps: float = Field(gt=0, le=300)
    chol: float = Field(gt=0, le=1000)
    fbs: Literal["False", "True"]
    restecg: Literal["normal", "st-t abnormality", "lv hypertrophy"]
    thalch: float = Field(gt=0, le=300)
    exang: Literal["False", "True"]
    oldpeak: float = Field(ge=0, le=20)
    slope: Literal["upsloping", "flat", "downsloping"]
    ca: int = Field(ge=0, le=4)
    thal: Literal["normal", "fixed defect", "reversible defect"]


app = FastAPI(
    title="Heart Disease ML Classifier API",
    description="Educational machine-learning demonstration API.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict")
def predict(payload: PredictionInput) -> dict[str, int | float | str]:
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="The trained model is not available yet. Export it from Kaggle and place it in backend/model/model.joblib.",
        )

    # Column order and names intentionally match the Kaggle training input.
    input_frame = pd.DataFrame([payload.model_dump()])

    try:
        prediction = int(model.predict(input_frame)[0])
        response: dict[str, int | float | str] = {
            "prediction": prediction,
            "prediction_label": (
                "Disease classification" if prediction == 1 else "No disease detected"
            ),
        }

        if hasattr(model, "predict_proba"):
            probability = float(model.predict_proba(input_frame)[0][1])
            response["probability"] = round(probability, 4)

        return response
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="The model could not process this input. Check that the exported pipeline matches the expected features.",
        )
