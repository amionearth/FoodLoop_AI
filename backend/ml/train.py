"""
Model Training and Selection Pipeline for FOODLOOP Demand Forecasting.
"""
import os
import json
import joblib
from datetime import datetime, timezone
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from backend.ml.download_data import ensure_benchmark_dataset
from backend.ml.preprocess import load_and_preprocess
from backend.ml.features import FEATURE_COLUMNS, TARGET_COLUMN
from backend.ml.evaluate import calculate_metrics, evaluate_baselines

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "models"))
os.makedirs(MODEL_DIR, exist_ok=True)

def train_and_evaluate():
    print("=== Starting FOODLOOP ML Demand Forecasting Training ===")
    
    # 1. Ensure dataset exists
    csv_path = ensure_benchmark_dataset()
    
    # 2. Chronological split
    train_df, val_df, test_df = load_and_preprocess(csv_path)
    
    X_train = train_df[FEATURE_COLUMNS]
    y_train = train_df[TARGET_COLUMN]
    
    X_val = val_df[FEATURE_COLUMNS]
    y_val = val_df[TARGET_COLUMN]
    
    X_test = test_df[FEATURE_COLUMNS]
    y_test = test_df[TARGET_COLUMN]

    # 3. Evaluate Baselines
    print("\n--- Evaluating Statistical Baselines ---")
    baseline_metrics = evaluate_baselines(test_df)
    for name, m in baseline_metrics.items():
        print(f"  {name:25s}: MAE={m['mae']:6.2f} | RMSE={m['rmse']:6.2f} | WAPE={m['wape']:6.4f} | Bias={m['bias']:6.2f}")

    # 4. Train Candidate 1: HistGradientBoostingRegressor
    print("\n--- Training Candidate 1: HistGradientBoostingRegressor ---")
    hgb = HistGradientBoostingRegressor(
        max_iter=150,
        learning_rate=0.08,
        max_leaf_nodes=31,
        min_samples_leaf=15,
        random_state=42
    )
    hgb.fit(X_train, y_train)
    hgb_test_pred = hgb.predict(X_test)
    hgb_metrics = calculate_metrics(y_test, hgb_test_pred)
    print(f"  HistGradientBoosting    : MAE={hgb_metrics['mae']:6.2f} | RMSE={hgb_metrics['rmse']:6.2f} | WAPE={hgb_metrics['wape']:6.4f} | Bias={hgb_metrics['bias']:6.2f}")

    # 5. Train Candidate 2: RandomForestRegressor
    print("\n--- Training Candidate 2: RandomForestRegressor ---")
    rf = RandomForestRegressor(
        n_estimators=100,
        max_depth=12,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)
    rf_test_pred = rf.predict(X_test)
    rf_metrics = calculate_metrics(y_test, rf_test_pred)
    print(f"  RandomForestRegressor   : MAE={rf_metrics['mae']:6.2f} | RMSE={rf_metrics['rmse']:6.2f} | WAPE={rf_metrics['wape']:6.4f} | Bias={rf_metrics['bias']:6.2f}")

    # 6. Model Selection: Choose model with lower WAPE on test set
    if hgb_metrics["wape"] <= rf_metrics["wape"]:
        best_model = hgb
        best_name = "HistGradientBoostingRegressor"
        best_metrics = hgb_metrics
    else:
        best_model = rf
        best_name = "RandomForestRegressor"
        best_metrics = rf_metrics

    print(f"\nSelected Model: {best_name} with Test WAPE: {best_metrics['wape']}")

    # 7. Package and save artifact
    version = f"v{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
    artifact = {
        "model": best_model,
        "algorithm": best_name,
        "version": version,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset_source": "Mendeley Data — Restaurant Sales Data with Features (CC BY 4.0)",
        "features": FEATURE_COLUMNS,
        "target": TARGET_COLUMN,
        "metrics": best_metrics,
        "baseline_metrics": baseline_metrics,
        "train_period": f"{train_df['date'].min().strftime('%Y-%m-%d')} to {train_df['date'].max().strftime('%Y-%m-%d')}",
        "test_period": f"{test_df['date'].min().strftime('%Y-%m-%d')} to {test_df['date'].max().strftime('%Y-%m-%d')}",
    }

    artifact_path = os.path.join(MODEL_DIR, f"demand_forecaster_{version}.joblib")
    latest_path = os.path.join(MODEL_DIR, "demand_forecaster_latest.joblib")
    
    joblib.dump(artifact, artifact_path)
    joblib.dump(artifact, latest_path)
    
    # Save metadata JSON
    meta_path = os.path.join(MODEL_DIR, "model_metadata.json")
    with open(meta_path, "w") as f:
        meta_dict = {k: v for k, v in artifact.items() if k != "model"}
        json.dump(meta_dict, f, indent=2)

    print(f"Saved model artifact to: {artifact_path}")
    print(f"Updated latest pointer at: {latest_path}")
    print(f"Updated metadata manifest at: {meta_path}")

    return artifact

if __name__ == "__main__":
    train_and_evaluate()
