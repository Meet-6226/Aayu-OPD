from pydantic import BaseModel
from typing import Optional, List


class PredictionRequest(BaseModel):
    past_no_show_count: int
    past_visit_count: int
    distance_km: float
    lead_time_days: int
    age: int
    gender: str                          # "male" or "female"
    day_of_week: int                     # 0-6
    hour_of_appointment: int
    department: str
    is_working_professional: bool
    is_elderly: bool
    is_student: bool
    persona_set: bool
    family_notified: bool
    weather_rain: bool = False
    traffic_congestion_score: float = 0.3   # 0.1 (clear) → 0.95 (gridlock)
    consultation_type: str = "new"       # "new" or "follow_up"
    doctor_avg_no_show_rate: float = 0.25
    patient_name: Optional[str] = "Patient"


class ShapFactor(BaseModel):
    feature: str
    impact: float
    direction: str   # "positive" = increases risk, "negative" = decreases risk
    detail: str


class PredictionResponse(BaseModel):
    risk_score: float
    risk_level: str  # "HIGH", "MEDIUM", "LOW"
    shap_factors: List[ShapFactor]
    summary: str
    model_version: str = "xgboost-v1"
