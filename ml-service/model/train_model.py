"""
Model Training Script — Apollo No-Show Prediction Service
Trains XGBoost classifier + Logistic Regression baseline, sets up SHAP explainability,
and saves all artifacts to the model/ directory.

Run: python3 model/train_model.py
Requires: data/training_data.csv (run data/generate_dataset.py first)
"""

import os
os.environ["OMP_NUM_THREADS"] = "1"

import json
import pickle
import warnings

import numpy as np
import pandas as pd
import shap
import xgboost as xgb
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

warnings.filterwarnings("ignore")

DATA_PATH    = "data/training_data.csv"
MODEL_DIR    = "model"


# ── Step 1: Load and prepare data ────────────────────────────────────────────

def load_and_prepare(path: str) -> tuple:
    print(f"Loading dataset from {path}...")
    df = pd.read_csv(path)
    print(f"  Shape: {df.shape}  |  No-show rate: {df['no_show'].mean()*100:.1f}%")

    # Encode gender: male->0, female->1
    df["gender"] = df["gender"].map({"male": 0, "female": 1})

    # One-hot encode department (drop_first avoids multicollinearity)
    df = pd.get_dummies(df, columns=["department"], drop_first=True)

    # Drop identifiers and target to isolate features
    drop_cols = ["patient_id", "no_show"]
    feature_columns = [c for c in df.columns if c not in drop_cols]

    X = df[feature_columns].astype(float)
    y = df["no_show"]

    print(f"  Features ({len(feature_columns)}): {feature_columns}")
    return X, y, feature_columns


# ── Step 2: Train / test split ────────────────────────────────────────────────

def split_data(X: pd.DataFrame, y: pd.Series):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\nTrain size: {len(X_train):,}  |  Test size: {len(X_test):,}")
    return X_train, X_test, y_train, y_test


# ── Step 3: Train XGBoost ─────────────────────────────────────────────────────

def train_xgboost(X_train, X_test, y_train, y_test):
    print("\nTraining XGBoost classifier...")
    neg = (y_train == 0).sum()
    pos = (y_train == 1).sum()

    model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=neg / pos,   # handle class imbalance
        random_state=42,
        eval_metric="logloss",
        use_label_encoder=False,
        n_jobs=1,
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False,
    )
    print("  XGBoost training complete.")
    return model


# ── Step 4: Train Logistic Regression baseline ────────────────────────────────

def train_logistic_regression(X_train, y_train):
    print("\nTraining Logistic Regression baseline...")
    lr_model = LogisticRegression(max_iter=1000, random_state=42)
    lr_model.fit(X_train, y_train)
    print("  Logistic Regression training complete.")
    return lr_model


# ── Step 5: Evaluate and compare ──────────────────────────────────────────────

def evaluate(model, X_test, y_test, label: str) -> dict:
    y_pred       = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]

    metrics = {
        "accuracy":  round(float(accuracy_score(y_test, y_pred)),  4),
        "auc_roc":   round(float(roc_auc_score(y_test, y_pred_proba)), 4),
        "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
        "recall":    round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
        "f1_score":  round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
    }
    return metrics


def print_comparison(xgb_metrics: dict, lr_metrics: dict):
    print("\n" + "=" * 62)
    print("  Model Comparison: XGBoost  vs  Logistic Regression")
    print("=" * 62)

    header = f"  {'Metric':<14}  {'XGBoost':>12}  {'Logistic Reg':>14}  {'Winner':>8}"
    print(header)
    print("  " + "─" * 58)

    for key in ["accuracy", "auc_roc", "precision", "recall", "f1_score"]:
        xv = xgb_metrics[key]
        lv = lr_metrics[key]
        winner = "XGBoost ✓" if xv >= lv else "LogReg  ✓"
        print(f"  {key:<14}  {xv:>12.4f}  {lv:>14.4f}  {winner:>9}")

    print("=" * 62)

    # Classification report for XGBoost
    print("\n  XGBoost Classification Report:")
    print("  (Run on the 20% holdout test set)\n")


def print_classification_report(model, X_test, y_test):
    y_pred = model.predict(X_test)
    report = classification_report(
        y_test, y_pred,
        target_names=["Show (0)", "No-Show (1)"],
        digits=4,
    )
    for line in report.splitlines():
        print(f"  {line}")


# ── Step 6: SHAP explainer ────────────────────────────────────────────────────

def build_shap_explainer(model, X_test: pd.DataFrame, feature_columns: list):
    print("\nBuilding SHAP TreeExplainer...")
    explainer   = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_test)

    # Global feature importance: mean |SHAP| per feature
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    importance_df = (
        pd.DataFrame({"feature": feature_columns, "mean_abs_shap": mean_abs_shap})
        .sort_values("mean_abs_shap", ascending=False)
        .reset_index(drop=True)
    )

    print("\n  Global Feature Importance (mean |SHAP value|):")
    print(f"  {'Rank':<6}{'Feature':<32}{'Mean |SHAP|':>12}")
    print("  " + "─" * 52)
    for i, row in importance_df.iterrows():
        marker = " ◀" if i < 6 else ""
        print(f"  {i+1:<6}{row['feature']:<32}{row['mean_abs_shap']:>12.4f}{marker}")

    print("\n  ◀  Top 6 features marked above")
    return explainer, importance_df


# ── Step 7: Save artifacts ────────────────────────────────────────────────────

def save_artifacts(model, explainer, feature_columns: list,
                   xgb_metrics: dict, lr_metrics: dict):
    model_path     = f"{MODEL_DIR}/model.pkl"
    explainer_path = f"{MODEL_DIR}/explainer.pkl"
    features_path  = f"{MODEL_DIR}/feature_names.json"
    metrics_path   = f"{MODEL_DIR}/metrics.json"

    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    print(f"\n  ✓ Model saved      → {model_path}")

    with open(explainer_path, "wb") as f:
        pickle.dump(explainer, f)
    print(f"  ✓ Explainer saved  → {explainer_path}")

    with open(features_path, "w") as f:
        json.dump(feature_columns, f, indent=2)
    print(f"  ✓ Features saved   → {features_path}")

    with open(metrics_path, "w") as f:
        json.dump(
            {"xgboost": xgb_metrics, "logistic_regression": lr_metrics},
            f,
            indent=2,
        )
    print(f"  ✓ Metrics saved    → {metrics_path}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 62)
    print("  Apollo No-Show Prediction — Model Training Pipeline")
    print("=" * 62)

    # 1. Load & prepare
    X, y, feature_columns = load_and_prepare(DATA_PATH)

    # 2. Split
    X_train, X_test, y_train, y_test = split_data(X, y)

    # 3. Train XGBoost
    xgb_model = train_xgboost(X_train, X_test, y_train, y_test)

    # 4. Train Logistic Regression baseline
    lr_model = train_logistic_regression(X_train, y_train)

    # 5. Evaluate & compare
    xgb_metrics = evaluate(xgb_model, X_test, y_test, "XGBoost")
    lr_metrics  = evaluate(lr_model,  X_test, y_test, "Logistic Regression")
    print_comparison(xgb_metrics, lr_metrics)
    print_classification_report(xgb_model, X_test, y_test)

    # 6. SHAP explainer
    explainer, importance_df = build_shap_explainer(xgb_model, X_test, feature_columns)

    # 7. Save all artifacts
    print("\nSaving artifacts...")
    save_artifacts(xgb_model, explainer, feature_columns, xgb_metrics, lr_metrics)

    # ── Final summary ─────────────────────────────────────────────────────────
    print("\n" + "=" * 62)
    print("  ✓ Training complete — Final Metrics Summary")
    print("=" * 62)
    print(f"\n  XGBoost Results:")
    for k, v in xgb_metrics.items():
        print(f"    {k:<14}: {v:.4f}")

    print(f"\n  Logistic Regression Results:")
    for k, v in lr_metrics.items():
        print(f"    {k:<14}: {v:.4f}")

    xgb_wins = sum(1 for k in xgb_metrics if xgb_metrics[k] >= lr_metrics[k])
    print(f"\n  XGBoost wins on {xgb_wins}/{len(xgb_metrics)} metrics ✓")

    print("\n  Top 6 Features by SHAP Importance:")
    for i, row in importance_df.head(6).iterrows():
        print(f"    {i+1}. {row['feature']:<30} {row['mean_abs_shap']:.4f}")

    print("\n" + "=" * 62)
    print("  All 4 model artifacts saved to model/")
    print("=" * 62)


if __name__ == "__main__":
    main()
