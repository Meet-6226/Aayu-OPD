"""
Predictor — Apollo No-Show Prediction Service
Loads trained artifacts, builds feature vectors, runs XGBoost inference,
computes SHAP explanations, and returns a structured PredictionResponse.
"""

import json
import pickle
from pathlib import Path

import numpy as np
import pandas as pd

from api.schemas import PredictionRequest, PredictionResponse, ShapFactor

MODEL_DIR = Path("model")

# ── Human-readable display names for SHAP output ─────────────────────────────
FEATURE_DISPLAY_NAMES: dict[str, str] = {
    "past_no_show_count":       "Past no-show history",
    "past_visit_count":         "Total past visits",
    "no_show_rate":             "No-show rate",
    "distance_km":              "Distance from hospital",
    "lead_time_days":           "Lead time (booking advance)",
    "age":                      "Patient age",
    "gender":                   "Patient gender",
    "day_of_week":              "Day of week",
    "hour_of_appointment":      "Appointment time slot",
    "is_working_professional":  "Working professional status",
    "is_elderly":               "Elderly patient",
    "is_student":               "Student patient",
    "persona_set":              "Reminder preference set",
    "family_notified":          "Family notified",
    "weather_rain":             "Weather forecast",
    "traffic_congestion_score": "Traffic congestion level",
    "consultation_type":        "Visit type",
    "doctor_avg_no_show_rate":  "Doctor's historical no-show rate",
}

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


class Predictor:
    """Loads model artifacts once and serves predictions."""

    def __init__(self):
        model_path     = MODEL_DIR / "model.pkl"
        explainer_path = MODEL_DIR / "explainer.pkl"
        features_path  = MODEL_DIR / "feature_names.json"

        if not model_path.exists():
            raise FileNotFoundError(
                f"Model not found at {model_path}. "
                "Run `python3 model/train_model.py` first."
            )

        with open(model_path, "rb") as f:
            self.model = pickle.load(f)

        with open(explainer_path, "rb") as f:
            self.explainer = pickle.load(f)

        with open(features_path, "r") as f:
            self.feature_names: list[str] = json.load(f)

        # Discover which department_X columns exist from training
        self.dept_columns = [c for c in self.feature_names if c.startswith("department_")]

    # ── Feature engineering ───────────────────────────────────────────────────

    def build_feature_vector(self, req: PredictionRequest) -> pd.DataFrame:
        """
        Converts a PredictionRequest into a DataFrame with exactly the same
        column order that was used during training (read from feature_names.json).
        """
        # Derived features
        no_show_rate    = req.past_no_show_count / max(req.past_visit_count, 1)
        gender_enc      = 0 if req.gender.lower() == "male" else 1
        consult_enc     = 1 if req.consultation_type == "follow_up" else 0

        # Base row (all scalar features)
        row: dict[str, float] = {
            "past_no_show_count":       float(req.past_no_show_count),
            "past_visit_count":         float(req.past_visit_count),
            "no_show_rate":             round(no_show_rate, 4),
            "distance_km":              float(req.distance_km),
            "lead_time_days":           float(req.lead_time_days),
            "age":                      float(req.age),
            "gender":                   float(gender_enc),
            "day_of_week":              float(req.day_of_week),
            "hour_of_appointment":      float(req.hour_of_appointment),
            "is_working_professional":  float(req.is_working_professional),
            "is_elderly":               float(req.is_elderly),
            "is_student":               float(req.is_student),
            "persona_set":              float(req.persona_set),
            "family_notified":          float(req.family_notified),
            "weather_rain":             float(req.weather_rain),
            "traffic_congestion_score": float(req.traffic_congestion_score),
            "consultation_type":        float(consult_enc),
            "doctor_avg_no_show_rate":  float(req.doctor_avg_no_show_rate),
        }

        # One-hot encode department — must match training columns exactly
        # Training used pd.get_dummies(..., drop_first=True) on 8 departments
        # so "Cardiology" was the dropped first → no column for it → all zeros
        dept_col = f"department_{req.department}"
        for col in self.dept_columns:
            row[col] = 1.0 if col == dept_col else 0.0

        # Build DataFrame in EXACT training column order
        df = pd.DataFrame([row])[self.feature_names]
        return df

    # ── SHAP detail strings ───────────────────────────────────────────────────

    def _detail_string(self, feature: str, req: PredictionRequest) -> str:
        """Returns a human-readable context string for a given feature."""
        r = req
        if feature == "past_no_show_count":
            return f"Missed {r.past_no_show_count} of {r.past_visit_count} past visits"
        if feature == "no_show_rate":
            rate = r.past_no_show_count / max(r.past_visit_count, 1)
            return f"{rate*100:.0f}% historical no-show rate"
        if feature == "distance_km":
            return f"{r.distance_km:.0f} km from the hospital"
        if feature == "lead_time_days":
            return f"Booked {r.lead_time_days} days in advance"
        if feature == "weather_rain":
            return "Rain forecasted on appointment day" if r.weather_rain else "Clear weather expected"
        if feature == "traffic_congestion_score":
            score = r.traffic_congestion_score
            if score > 0.65:
                level = "High"
            elif score > 0.4:
                level = "Moderate"
            else:
                level = "Low"
            return f"{level} congestion (score {score:.2f}) on appointment route"
        if feature == "persona_set":
            return "Reminder preferences configured" if r.persona_set else "No reminder preferences set"
        if feature == "family_notified":
            return "Family member notified" if r.family_notified else "Family not notified"
        if feature == "day_of_week":
            return f"Appointment on {DAYS[r.day_of_week]}"
        if feature == "age":
            return f"Patient is {r.age} years old"
        if feature == "is_working_professional":
            return "Working professional" if r.is_working_professional else "Not a working professional"
        if feature == "is_elderly":
            return "Elderly patient (65+)" if r.is_elderly else "Not elderly"
        if feature == "is_student":
            return "Student patient" if r.is_student else "Not a student"
        if feature == "hour_of_appointment":
            hour = r.hour_of_appointment
            period = "AM" if hour < 12 else "PM"
            display = hour if hour <= 12 else hour - 12
            return f"Appointment at {display}:00 {period}"
        if feature == "doctor_avg_no_show_rate":
            return f"Doctor's avg no-show rate: {r.doctor_avg_no_show_rate*100:.0f}%"
        if feature == "consultation_type":
            return "Follow-up visit" if r.consultation_type == "follow_up" else "New patient visit"
        if feature == "past_visit_count":
            return f"{r.past_visit_count} total past appointments"
        if feature.startswith("department_"):
            dept_name = feature.replace("department_", "")
            return f"{r.department} department appointment"
        return feature.replace("_", " ").title()

    # ── Summary string ────────────────────────────────────────────────────────

    def _build_summary(
        self,
        req: PredictionRequest,
        risk_score: float,
        top_factors: list[ShapFactor],
    ) -> str:
        name = req.patient_name or "The patient"

        # Pull details from top positive-risk factors for narrative
        pos_factors = [f for f in top_factors if f.direction == "positive"]
        neg_factors = [f for f in top_factors if f.direction == "negative"]

        parts: list[str] = []

        if req.distance_km > 15:
            parts.append(f"lives {req.distance_km:.0f} km from the hospital")
        if req.past_no_show_count > 0:
            parts.append(
                f"has missed {req.past_no_show_count} of {req.past_visit_count} past appointments"
            )
        if req.lead_time_days > 10:
            parts.append(f"booked {req.lead_time_days} days in advance")
        if req.weather_rain:
            parts.append("rain is forecasted on the appointment day")

        if len(parts) >= 2:
            narrative = f"{name} {parts[0]} and {parts[1]}"
            if len(parts) > 2:
                narrative += f", and {parts[2]}"
        elif len(parts) == 1:
            narrative = f"{name} {parts[0]}"
        else:
            narrative = f"{name}'s appointment profile"

        # Mention a negative factor if present
        if neg_factors:
            neg_detail = neg_factors[0].detail.lower()
            narrative += f". Mitigating factor: {neg_detail}"

        narrative += (
            f". Our model estimates a {risk_score:.0f}% chance of no-show."
        )
        return narrative

    # ── Main predict method ───────────────────────────────────────────────────

    def predict(self, req: PredictionRequest) -> PredictionResponse:
        features    = self.build_feature_vector(req)

        # Probability → risk score (0–100)
        risk_score  = float(self.model.predict_proba(features)[0][1]) * 100

        # Risk tier
        if risk_score >= 70:
            risk_level = "HIGH"
        elif risk_score >= 40:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # SHAP values for this single prediction
        shap_values = self.explainer.shap_values(features)
        sv_array    = shap_values[0]  # shape: (n_features,)

        # Pair feature names with SHAP values, sort by |SHAP| descending
        pairs = sorted(
            zip(self.feature_names, sv_array),
            key=lambda x: abs(x[1]),
            reverse=True,
        )

        # Build top-6 ShapFactor objects
        shap_factors: list[ShapFactor] = []
        for feat, sv in pairs[:6]:
            display_name = (
                FEATURE_DISPLAY_NAMES.get(feat)
                or (f"Department: {feat.replace('department_', '')}" if feat.startswith("department_") else feat)
            )
            shap_factors.append(
                ShapFactor(
                    feature=display_name,
                    impact=round(float(sv) * 100),          # percentage-style display
                    direction="positive" if sv > 0 else "negative",
                    detail=self._detail_string(feat, req),
                )
            )

        summary = self._build_summary(req, risk_score, shap_factors)

        return PredictionResponse(
            risk_score=round(risk_score, 2),
            risk_level=risk_level,
            shap_factors=shap_factors,
            summary=summary,
        )
