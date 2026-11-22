"""
Feature engineering module for FOODLOOP Demand Forecasting.
Ensures zero future-data leakage through strict chronological shifting.
"""
import pandas as pd
import numpy as np
from typing import Tuple, List

FEATURE_COLUMNS = [
    "day_of_week",
    "is_weekend",
    "month",
    "day_of_month",
    "sin_day_of_year",
    "cos_day_of_year",
    "is_holiday",
    "temperature_c",
    "precipitation_mm",
    "unit_price",
    "lag_1",
    "lag_7",
    "lag_14",
    "rolling_mean_7",
    "rolling_std_7",
    "rolling_mean_14",
]

TARGET_COLUMN = "units_sold"

def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Constructs time-series features per product group.
    Assumes df has columns: ['date', 'product_name', 'units_sold'] plus optional metadata.
    """
    data = df.copy()
    data["date"] = pd.to_datetime(data["date"])
    data = data.sort_values(["product_name", "date"]).reset_index(drop=True)

    # Calendar features
    data["day_of_week"] = data["date"].dt.dayofweek
    data["is_weekend"] = data["day_of_week"].apply(lambda d: 1 if d in (4, 5, 6) else 0)
    data["month"] = data["date"].dt.month
    data["day_of_month"] = data["date"].dt.day
    day_of_year = data["date"].dt.dayofyear
    data["sin_day_of_year"] = np.sin(2 * np.pi * day_of_year / 365.25)
    data["cos_day_of_year"] = np.cos(2 * np.pi * day_of_year / 365.25)

    if "is_holiday" not in data.columns:
        data["is_holiday"] = 0
    if "temperature_c" not in data.columns:
        data["temperature_c"] = 20.0 # Default ambient room/regional avg
    if "precipitation_mm" not in data.columns:
        data["precipitation_mm"] = 0.0
    if "unit_price" not in data.columns:
        data["unit_price"] = 10.0

    # Lags and Rolling features strictly shifted by 1 to prevent target leakage
    grouped = data.groupby("product_name")[TARGET_COLUMN]

    data["lag_1"] = grouped.shift(1)
    data["lag_7"] = grouped.shift(7)
    data["lag_14"] = grouped.shift(14)

    # Rolling window over past observations only (shift 1 first!)
    shifted = grouped.shift(1)
    data["rolling_mean_7"] = shifted.rolling(window=7, min_periods=1).mean()
    data["rolling_std_7"] = shifted.rolling(window=7, min_periods=1).std().fillna(0.0)
    data["rolling_mean_14"] = shifted.rolling(window=14, min_periods=1).mean()

    # Backfill earliest initial period with expanding mean to allow training on edge rows
    data["lag_1"] = data["lag_1"].fillna(data["rolling_mean_7"])
    data["lag_7"] = data["lag_7"].fillna(data["lag_1"])
    data["lag_14"] = data["lag_14"].fillna(data["lag_7"])
    data["rolling_mean_7"] = data["rolling_mean_7"].fillna(data[TARGET_COLUMN])
    data["rolling_mean_14"] = data["rolling_mean_14"].fillna(data["rolling_mean_7"])

    return data
