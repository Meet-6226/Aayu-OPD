# Apollo No-Show Prediction Service

A FastAPI microservice that predicts the probability of a patient **not attending** a scheduled appointment, powered by XGBoost and SHAP explainability.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API | FastAPI 0.111 + Uvicorn |
| ML Model | XGBoost 2.0 |
| Explainability | SHAP 0.45 (TreeExplainer) |
| Baseline | scikit-learn LogisticRegression |
| Data Generation | Faker 25 + Pandas |
| Deployment | Render.com (Singapore region) |

---

## Project Structure

```
ml-service/
├── data/
│   ├── generate_dataset.py     # Synthetic dataset generator (2000 records)
│   └── training_data.csv       # Generated training data
├── model/
│   ├── train_model.py          # XGBoost + LR training pipeline
│   ├── model.pkl               # ✅ Committed — trained XGBoost classifier
│   ├── explainer.pkl           # ✅ Committed — SHAP TreeExplainer
│   ├── feature_names.json      # ✅ Committed — ordered feature list (24 features)
│   └── metrics.json            # ✅ Committed — accuracy/AUC metrics
├── api/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app (/, /health, /predict, /model-info)
│   ├── schemas.py              # Pydantic request/response models
│   └── predictor.py            # Inference + SHAP formatting + summary generation
├── requirements.txt
├── render.yaml                 # Render.com deployment config
├── Procfile                    # Backup process config
├── .gitignore                  # Excludes venv/, __pycache__/ — NOT model/ files
└── README.md
```

---

## Quick Start (Local)

### 1. Create and activate virtual environment

```bash
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Generate synthetic training data

```bash
python3 data/generate_dataset.py
# Output: data/training_data.csv (2000 rows, 25.2% no-show rate)
```

### 4. Train the model

```bash
python3 model/train_model.py
# Saves: model/model.pkl, explainer.pkl, feature_names.json, metrics.json
```

### 5. Start the API server

```bash
uvicorn api.main:app --reload --port 8001
```

Docs available at → [http://localhost:8001/docs](http://localhost:8001/docs)

---

## API Reference

### `POST /predict`

Predict no-show probability for a single appointment.

**Request body:**
```json
{
  "past_no_show_count": 2,
  "past_visit_count": 6,
  "distance_km": 38,
  "lead_time_days": 21,
  "age": 28,
  "gender": "female",
  "day_of_week": 3,
  "hour_of_appointment": 10,
  "department": "Cardiology",
  "is_working_professional": true,
  "is_elderly": false,
  "is_student": false,
  "persona_set": true,
  "family_notified": false,
  "weather_rain": true,
  "consultation_type": "new",
  "doctor_avg_no_show_rate": 0.28,
  "patient_name": "Priya"
}
```

**Response:**
```json
{
  "risk_score": 54.55,
  "risk_level": "MEDIUM",
  "shap_factors": [
    {
      "feature": "Reminder preference set",
      "impact": -37,
      "direction": "negative",
      "detail": "Reminder preferences configured"
    },
    {
      "feature": "No-show rate",
      "impact": 27,
      "direction": "positive",
      "detail": "33% historical no-show rate"
    }
  ],
  "summary": "Priya lives 38 km from the hospital and has missed 2 of 6 past appointments...",
  "model_version": "xgboost-v1"
}
```

**Risk Levels:**
| Score | Level |
|-------|-------|
| ≥ 70% | `HIGH` |
| 40–69% | `MEDIUM` |
| < 40% | `LOW` |

### `GET /health`

```json
{"status": "healthy"}
```

### `GET /model-info`

Returns live accuracy and AUC-ROC metrics from `model/metrics.json`.

---

## Model Performance

| Metric | XGBoost | Logistic Regression |
|--------|---------|-------------------|
| Accuracy | 0.6875 | 0.7600 |
| AUC-ROC | 0.6704 | 0.7149 |
| Precision | 0.3800 | 0.5926 |
| **Recall** | **0.3762** | 0.1584 |
| **F1 Score** | **0.3781** | 0.2500 |

> **Why XGBoost over Logistic Regression?** XGBoost achieves 2.4× better recall (catching actual no-shows), which is the critical metric for a scheduling tool — missing a no-show (false negative) is far more costly than a false alarm. Logistic Regression's higher accuracy comes from predicting "Show" nearly always (only 15.8% no-show recall).

**Top 6 SHAP Features (global importance):**

| Rank | Feature | Mean \|SHAP\| |
|------|---------|-------------|
| 1 | family_notified | 0.3546 |
| 2 | persona_set | 0.3475 |
| 3 | no_show_rate | 0.3424 |
| 4 | doctor_avg_no_show_rate | 0.3424 |
| 5 | age | 0.1741 |
| 6 | past_no_show_count | 0.1738 |

---

## Deployment Steps

### Deploy to Render.com

1. **Push to GitHub** — commit this `ml-service/` folder to a GitHub repository.
   Can be a monorepo (with DEMO-DAY and APOLLO-PATIENT as top-level folders) or a standalone repo.

   ```bash
   git init
   git add .
   git commit -m "feat: Apollo No-Show Prediction Service"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Go to [render.com](https://render.com)** — sign up / log in.

3. Click **New +** → **Web Service**.

4. **Connect your GitHub repo**.

5. If using a monorepo, set **Root Directory** to `ml-service`.

6. Render auto-detects `render.yaml` and pre-fills:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn api.main:app --host 0.0.0.0 --port $PORT`

7. Click **Create Web Service**.

8. Wait **3–5 minutes** for the first build (XGBoost + SHAP are ~200MB of packages).

9. Note the live URL, e.g.:
   ```
   https://apollo-ml-service.onrender.com
   ```

10. **Verify the deployment:**
    ```bash
    curl https://apollo-ml-service.onrender.com/health
    # → {"status": "healthy"}
    ```

11. **Test a prediction:**
    ```bash
    curl -X POST https://apollo-ml-service.onrender.com/predict \
      -H "Content-Type: application/json" \
      -d '{"past_no_show_count":2,"past_visit_count":6,"distance_km":38,"lead_time_days":21,"age":28,"gender":"female","day_of_week":3,"hour_of_appointment":10,"department":"Cardiology","is_working_professional":true,"is_elderly":false,"is_student":false,"persona_set":true,"family_notified":false,"weather_rain":true,"consultation_type":"new","doctor_avg_no_show_rate":0.28,"patient_name":"Priya"}'
    ```

---

## ⚠️ Free Tier Cold Start Warning

Render's free tier **spins down after 15 minutes of inactivity** and takes **30–50 seconds** to wake up on the next request.

**For Demo Day — choose one:**

| Option | Description | Cost |
|--------|-------------|------|
| **(a) Manual wake-up** | Hit `/health` 2–3 minutes before presenting | Free |
| **(b) Upgrade for demo** | Render Starter plan for demo day only | ~$7/month |
| **(c) Keep-alive script** | Cron job that pings `/health` every 10 minutes | Free |

**Keep-alive curl command (run in a terminal tab before demo):**
```bash
while true; do curl -s https://apollo-ml-service.onrender.com/health; sleep 600; done
```

---

## CORS Configuration

The API is configured with `allow_origins=["*"]` — it accepts requests from any domain.
This allows both:
- `DEMO-DAY` frontend (demo dashboard)
- `APOLLO-PATIENT` frontend (patient-facing app)

To restrict in production, replace `"*"` with specific domains in `api/main.py`.
