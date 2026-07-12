"""
Apollo No-Show Prediction Service — FastAPI Application
Serves XGBoost predictions with SHAP explanations.
Called by DEMO-DAY and APOLLO-PATIENT frontends over HTTP.
"""

import os
os.environ["OMP_NUM_THREADS"] = "1"

import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.schemas import PredictionRequest, PredictionResponse
from api.predictor import Predictor

app = FastAPI(
    title="Apollo No-Show Prediction API",
    version="1.0.0",
    description=(
        "Predicts patient no-show probability using XGBoost with SHAP explainability. "
        "Risk levels: HIGH (≥70%), MEDIUM (≥40%), LOW (<40%)."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allows calls from DEMO-DAY and APOLLO-PATIENT domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load once at startup — avoids cold-start latency per request
predictor = Predictor()


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "Apollo No-Show Prediction API is running",
        "model":  "XGBoost v1.0",
        "docs":   "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict(request: PredictionRequest):
    """
    Predict no-show probability for a single appointment.

    Returns risk_score (0–100), risk_level (HIGH/MEDIUM/LOW),
    top-6 SHAP factors with direction and detail, and a plain-English summary.
    """
    try:
        return predictor.predict(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/model-info", tags=["Metadata"])
def model_info():
    """Return training metrics so dashboards can display live accuracy/AUC numbers."""
    metrics_path = Path("model/metrics.json")
    if not metrics_path.exists():
        raise HTTPException(
            status_code=404,
            detail="metrics.json not found. Run model/train_model.py first.",
        )
    with open(metrics_path) as f:
        metrics = json.load(f)
    return {
        "model_version": "xgboost-v1",
        "metrics": metrics,
        "feature_count": len(predictor.feature_names),
        "features": predictor.feature_names,
    }
