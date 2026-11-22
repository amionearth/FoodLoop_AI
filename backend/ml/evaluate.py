"""
Evaluation metrics and baseline benchmarking for FOODLOOP Demand Forecasting.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any

def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """
    Computes MAE, RMSE, WAPE, and Forecast Bias.
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    
    # Clip negative forecasts at zero (sales cannot be negative)
    y_pred = np.clip(y_pred, 0, None)

    mae = float(np.mean(np.abs(y_true - y_pred)))
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
    
    sum_true = float(np.sum(y_true))
    wape = float(np.sum(np.abs(y_true - y_pred)) / (sum_true + 1e-8))
    bias = float(np.mean(y_pred - y_true))

    return {
        "mae": round(mae, 3),
        "rmse": round(rmse, 3),
        "wape": round(wape, 4),
        "bias": round(bias, 3)
    }

def evaluate_baselines(test_df: pd.DataFrame) -> Dict[str, Dict[str, float]]:
    """
    Evaluates:
    1. Naive Previous Day Baseline (y_hat = lag_1)
    2. Weekly Seasonal Naive Baseline (y_hat = lag_7)
    3. 7-Day Moving Average Baseline (y_hat = rolling_mean_7)
    """
    y_true = test_df["units_sold"].values
    
    # Naive lag_1
    pred_naive = test_df["lag_1"].values
    metrics_naive = calculate_metrics(y_true, pred_naive)

    # Seasonal naive lag_7
    pred_snaive = test_df["lag_7"].values
    metrics_snaive = calculate_metrics(y_true, pred_snaive)

    # 7-day moving average
    pred_ma7 = test_df["rolling_mean_7"].values
    metrics_ma7 = calculate_metrics(y_true, pred_ma7)

    return {
        "naive_previous_day": metrics_naive,
        "weekly_seasonal_naive": metrics_snaive,
        "moving_average_7day": metrics_ma7
    }
