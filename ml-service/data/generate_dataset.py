"""
Synthetic Dataset Generator — Apollo No-Show Prediction Service
Generates 2000 realistic patient appointment records for model training.
Includes traffic_congestion_score correlated with time-of-day, day-of-week, and weather.

Run: python3 data/generate_dataset.py
Output: data/training_data.csv
"""

import pandas as pd
import numpy as np
import random
np.random.seed(42)
random.seed(42)

NUM_RECORDS = 2000
OUTPUT_PATH = "data/training_data.csv"


# ── Feature Generation ────────────────────────────────────────────────────────

def generate_past_no_show_count(n: int) -> np.ndarray:
    """60% = 0, 25% = 1-2, 15% = 3-8 (weighted distribution)."""
    choices = np.random.choice(
        a=[0, 1, 2, 3, 4, 5, 6, 7, 8],
        size=n,
        p=[0.60, 0.125, 0.125, 0.04, 0.03, 0.03, 0.025, 0.015, 0.01],
    )
    return choices


def generate_lead_time_days(n: int) -> np.ndarray:
    """Mixed distribution: 40% short, 35% mid, 25% long."""
    bins = np.random.choice(a=[0, 1, 2], size=n, p=[0.40, 0.35, 0.25])
    result = np.empty(n, dtype=int)
    short = bins == 0
    mid   = bins == 1
    long_ = bins == 2
    result[short] = np.random.randint(0, 4,  size=short.sum())
    result[mid]   = np.random.randint(4, 11, size=mid.sum())
    result[long_] = np.random.randint(11, 31, size=long_.sum())
    return result


def generate_hour_of_appointment(n: int) -> np.ndarray:
    """Weighted toward 9-12 and 14-16 (typical OPD hours)."""
    hours   = list(range(9, 19))
    weights = [0.12, 0.14, 0.14, 0.12, 0.06, 0.04,  # 9-14
               0.13, 0.12, 0.08, 0.05]               # 14-18
    return np.random.choice(hours, size=n, p=weights)


def generate_traffic_congestion_score(
    hour: np.ndarray,
    day_of_week: np.ndarray,
    weather_rain: np.ndarray,
) -> np.ndarray:
    """
    Rule-based traffic score (0.1–0.95) matching estimateTrafficLevel() on the frontend.
    Correlated with:
      - Peak hours (8-10am, 5-7pm) → higher congestion
      - Weekdays vs weekends → weekdays higher
      - Rain → bumps congestion up
    """
    n = len(hour)
    base = np.full(n, 0.3)

    # Morning rush: 8-10 AM
    morning_rush = (hour >= 8) & (hour <= 10)
    # Lunch: 12-13
    lunch = (hour >= 12) & (hour <= 13)
    # Evening rush: 17-19
    evening_rush = (hour >= 17) & (hour <= 19)
    # Late evening: 20+
    late = hour >= 20

    base[morning_rush] += 0.30
    base[lunch]        += 0.10
    base[evening_rush] += 0.35
    base[late]         += 0.05

    # Weekday bump (Mon=0 … Fri=4)
    weekday = day_of_week <= 4
    base[weekday] += 0.10

    # Rain bump
    rain = weather_rain == 1
    base[rain] += 0.12

    # Add noise
    noise = np.random.normal(0, 0.05, n)
    base  = base + noise

    return np.round(np.clip(base, 0.1, 0.95), 3)


def calculate_no_show_probability(row: dict) -> float:
    prob = 0.22  # base rate — real Apollo no-show rate ~25-30%

    # Past no-show history — STRONGEST predictor
    if row['past_no_show_count'] >= 4:
        prob += 0.30
    elif row['past_no_show_count'] >= 2:
        prob += 0.18
    elif row['past_no_show_count'] >= 1:
        prob += 0.08

    # Distance — HIGH predictor
    if row['distance_km'] > 30:
        prob += 0.18
    elif row['distance_km'] > 15:
        prob += 0.10
    elif row['distance_km'] > 8:
        prob += 0.04

    # Lead time — MEDIUM predictor
    if row['lead_time_days'] > 20:
        prob += 0.10
    elif row['lead_time_days'] > 10:
        prob += 0.05

    # Weather — MEDIUM predictor
    if row['weather_rain'] == 1:
        prob += 0.07

    # Traffic congestion — NEW predictor
    if row['traffic_congestion_score'] > 0.65:
        prob += 0.08   # high traffic → people give up on the trip
    elif row['traffic_congestion_score'] > 0.4:
        prob += 0.03

    # Day of week — SUPPORTING (Monday = higher risk per PRD)
    if row['day_of_week'] == 0:
        prob += 0.05

    # Doctor-level base rate — SUPPORTING
    prob += (row['doctor_avg_no_show_rate'] - 0.25) * 0.5

    # Persona set — NEW signal, REDUCES risk
    if row['persona_set'] == 1:
        prob -= 0.12

    # Family notified for elderly — NEW signal, strongly reduces risk
    if row['is_elderly'] == 1:
        if row['family_notified'] == 1:
            prob -= 0.18
        else:
            prob += 0.08  # elderly without family support = higher risk

    # Working professionals with very short lead time
    if row['is_working_professional'] == 1 and row['lead_time_days'] < 2:
        prob += 0.06

    # Follow-up visits slightly more reliable than new visits
    if row['consultation_type'] == 1:
        prob -= 0.05

    # Small random noise — prevents overly deterministic signal
    prob += np.random.normal(0, 0.03)

    return float(np.clip(prob, 0.03, 0.95))


def generate_dataset() -> pd.DataFrame:
    n = NUM_RECORDS

    # ── Core history features ─────────────────────────────────────────────────
    patient_id          = np.arange(1, n + 1)
    past_no_show_count  = generate_past_no_show_count(n)
    # past_visit_count always >= past_no_show_count (+ at least 1)
    past_visit_count    = past_no_show_count + np.random.randint(1, 15, size=n)
    no_show_rate        = np.where(
        past_visit_count > 0,
        np.round(past_no_show_count / past_visit_count, 4),
        0.0,
    )

    # ── Logistics features ────────────────────────────────────────────────────
    distance_km         = np.clip(np.random.lognormal(mean=2.0, sigma=0.8, size=n), 1, 50)
    distance_km         = np.round(distance_km, 2)
    lead_time_days      = generate_lead_time_days(n)

    # ── Demographics ──────────────────────────────────────────────────────────
    age                 = np.clip(np.random.normal(42, 15, size=n), 18, 85).astype(int)
    gender              = np.random.choice(['male', 'female'], size=n, p=[0.50, 0.50])

    # ── Appointment details ───────────────────────────────────────────────────
    day_of_week         = np.random.randint(0, 7, size=n)
    hour_of_appointment = generate_hour_of_appointment(n)
    departments = [
        'General Medicine', 'Cardiology', 'Orthopedics', 'Dermatology',
        'Neurology', 'ENT', 'Gynecology', 'Pediatrics',
    ]
    department          = np.random.choice(departments, size=n)
    consultation_type   = np.random.choice([0, 1], size=n, p=[0.65, 0.35])

    # ── Patient profile flags ─────────────────────────────────────────────────
    is_working_professional = (np.random.random(n) < 0.35).astype(int)

    # is_elderly: forced True if age >= 60, else 20% random
    is_elderly = ((age >= 60) | (np.random.random(n) < 0.20)).astype(int)

    # is_student: forced True if age <= 25 AND not elderly, else 15% random
    is_student = np.where(
        (age <= 25) & (is_elderly == 0),
        1,
        ((np.random.random(n) < 0.15) & (is_elderly == 0)).astype(int),
    ).astype(int)

    persona_set         = (np.random.random(n) < 0.55).astype(int)

    # family_notified: only meaningful for elderly patients
    family_notified     = np.where(
        is_elderly == 1,
        (np.random.random(n) < 0.60).astype(int),
        0,
    ).astype(int)

    # ── External factors ──────────────────────────────────────────────────────
    weather_rain            = (np.random.random(n) < 0.20).astype(int)
    doctor_avg_no_show_rate = np.round(np.random.uniform(0.10, 0.40, size=n), 3)

    # ── Traffic congestion (correlated with time, day, rain) ──────────────────
    traffic_congestion_score = generate_traffic_congestion_score(
        hour_of_appointment, day_of_week, weather_rain
    )

    # ── Assemble DataFrame (without target) ──────────────────────────────────
    df = pd.DataFrame({
        'patient_id':               patient_id,
        'past_no_show_count':       past_no_show_count,
        'past_visit_count':         past_visit_count,
        'no_show_rate':             no_show_rate,
        'distance_km':              distance_km,
        'lead_time_days':           lead_time_days,
        'age':                      age,
        'gender':                   gender,
        'day_of_week':              day_of_week,
        'hour_of_appointment':      hour_of_appointment,
        'department':               department,
        'is_working_professional':  is_working_professional,
        'is_elderly':               is_elderly,
        'is_student':               is_student,
        'persona_set':              persona_set,
        'family_notified':          family_notified,
        'weather_rain':             weather_rain,
        'traffic_congestion_score': traffic_congestion_score,
        'consultation_type':        consultation_type,
        'doctor_avg_no_show_rate':  doctor_avg_no_show_rate,
    })

    # ── Generate target variable ──────────────────────────────────────────────
    probabilities = df.apply(calculate_no_show_probability, axis=1).values
    no_show       = np.array([
        np.random.binomial(1, p) for p in probabilities
    ])
    df['no_show'] = no_show

    return df


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 58)
    print("  Apollo No-Show Dataset Generator (v2 + traffic)")
    print("=" * 58)

    df = generate_dataset()

    # Save to CSV
    df.to_csv(OUTPUT_PATH, index=False)

    # ── Summary statistics ────────────────────────────────────────────────────
    no_show_rate_pct = df['no_show'].mean() * 100
    n_rows, n_cols   = df.shape

    print(f"\n✓ Dataset saved → {OUTPUT_PATH}")
    print(f"  Rows    : {n_rows:,}")
    print(f"  Columns : {n_cols}  (20 features + 1 target)")
    print(f"\n  Overall no-show rate: {no_show_rate_pct:.2f}%")
    print(f"  No-show count       : {df['no_show'].sum():,} / {n_rows:,}")

    # ── Feature correlations with target ─────────────────────────────────────
    numeric_cols = [c for c in df.columns if df[c].dtype != object and c != 'no_show']
    corr = df[numeric_cols + ['no_show']].corr()['no_show'].drop('no_show').sort_values(
        key=abs, ascending=False
    )

    print("\n  Feature correlations with no_show (sorted by |r|):")
    print(f"  {'Feature':<30} {'Correlation':>12}")
    print("  " + "─" * 44)
    for feat, val in corr.items():
        marker = " ◀ NEW" if feat == "traffic_congestion_score" else ""
        print(f"  {feat:<30} {val:>+12.4f}{marker}")

    # ── Traffic stats ─────────────────────────────────────────────────────────
    tc = df['traffic_congestion_score']
    print(f"\n  traffic_congestion_score stats:")
    print(f"    mean={tc.mean():.3f}  median={tc.median():.3f}  "
          f"min={tc.min():.3f}  max={tc.max():.3f}")
    high_traffic = (tc > 0.65).mean() * 100
    print(f"    High congestion (>0.65): {high_traffic:.1f}% of appointments")

    print("\n" + "=" * 58)
    print("  ✓ Generation complete — ready for model training")
    print("=" * 58)


if __name__ == "__main__":
    main()
