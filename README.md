# Heart Disease ML Classifier

An educational, end-to-end machine-learning practice project. A React interface collects the same feature columns used during training, sends them to a FastAPI API, and displays the output from a saved scikit-learn Logistic Regression pipeline.

> **Educational disclaimer:** This is not a clinical diagnostic system, medical device, or treatment tool. A model classification is not a medical diagnosis and the reported practice-dataset metrics do not represent real-world clinical performance.

## Current project state

The application structure and API are complete, but no trained model artifact was found in this repository. Predictions intentionally remain unavailable until the real exported model is added. No model has been fabricated.

## Architecture

```text
React + Vite form
        |
        | POST /predict (JSON)
        v
FastAPI + Pydantic validation
        |
        | pandas DataFrame with training column names
        v
backend/model/model.joblib (complete sklearn Pipeline)
        |
        v
Prediction JSON returned to the React result panel
```

## Tech stack

- Frontend: React, Vite, modern CSS
- Backend: Python, FastAPI, Uvicorn, Pydantic, pandas
- ML artifact: scikit-learn Pipeline saved with joblib

## Model details

The practice workflow creates `target = (num > 0).astype(int)`, uses an 80/20 stratified split, and evaluates Logistic Regression, Random Forest, and Gradient Boosting. The Logistic Regression pipeline is the selected model.

Practice-dataset results:

- Cross-validation accuracy: `82.6% ± 3.1%`
- Test accuracy: `85%`
- Disease-class recall: `92%`

The pipeline input features are:

| Numerical | Categorical |
| --- | --- |
| `age`, `trestbps`, `chol`, `thalch`, `oldpeak`, `ca` | `sex`, `dataset`, `cp`, `fbs`, `restecg`, `exang`, `slope`, `thal` |

## Export the trained model from Kaggle

After fitting your final complete pipeline in the notebook, run this exact cell:

```python
import joblib

# `best` must be the complete fitted sklearn Pipeline:
# Pipeline([("pre", pre), ("model", LogisticRegression(max_iter=1000))])
joblib.dump(best, "model.joblib")
```

Download `model.joblib` from Kaggle and place it at:

```text
backend/model/model.joblib
```

Do not export only the Logistic Regression estimator. The saved object must include the fitted preprocessing (`pre`) so the API uses the same median imputation, scaling, most-frequent imputation, and one-hot encoding behavior as training.

## Run locally

### 1. Backend

From the project root in PowerShell:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

The API runs at `http://localhost:8000`. `GET http://localhost:8000/health` returns `{"status":"ok"}` even before the model is installed. Once the model is in place, restart Uvicorn to load it.

### 2. Frontend

Open a second PowerShell window from the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL Vite prints, normally `http://localhost:5173`.

For an alternate backend URL, create `frontend/.env.local` with:

```text
VITE_API_URL=http://localhost:8000
```

## API

### `GET /health`

```json
{"status":"ok"}
```

### `POST /predict`

Example request:

```json
{
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
  "thal": "normal"
}
```

Example response after the real pipeline is installed:

```json
{
  "prediction": 1,
  "prediction_label": "Disease classification",
  "probability": 0.82
}
```

The API returns `503` with a human-readable message until `backend/model/model.joblib` exists. Invalid fields return FastAPI's standard `422` validation response. The browser converts these into user-friendly messages.

## Troubleshooting

- **“The backend is unavailable”**: start the Uvicorn command above and keep that terminal open.
- **“The trained model is not available yet”**: export the complete fitted `best` pipeline and put it in `backend/model/model.joblib`, then restart the backend.
- **“The saved model could not be loaded”**: install compatible Python package versions and confirm the uploaded file is a complete joblib pipeline, not a notebook or an individual estimator.
- **Input validation error**: select every dropdown value and use valid numeric values in each measurement field.
- **CORS error**: run the frontend on Vite's default `5173` port or add its local origin to `allow_origins` in `backend/main.py`.

## Developer note: dataset/source feature

The `dataset` column is intentionally retained because it is part of this practice model's trained input contract. In a real-world model, a source/dataset feature can encode collection-site differences or other data leakage. Review and likely remove or redesign it before considering any clinically meaningful use.
