"""
Preprocessing and Chronological Dataset Splitting
"""
import os
import pandas as pd
from typing import Tuple, Dict, Any
from backend.ml.features import build_features, FEATURE_COLUMNS, TARGET_COLUMN

DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "data", "restaurant_sales_stuttgart.csv"))

def load_and_preprocess(filepath: str = DATA_PATH) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Loads data, builds anti-leakage features, and performs chronological train/val/test split.
    Splits:
    - Train: First 70% of chronological time window
    - Validation: Next 15%
    - Test: Final 15% out-of-sample evaluation period
    """
    df = pd.read_csv(filepath)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)

    featured_df = build_features(df)
    
    unique_dates = sorted(featured_df["date"].unique())
    n_dates = len(unique_dates)
    
    train_end_idx = int(n_dates * 0.70)
    val_end_idx = int(n_dates * 0.85)
    
    train_end_date = unique_dates[train_end_idx]
    val_end_date = unique_dates[val_end_idx]
    
    train_df = featured_df[featured_df["date"] < train_end_date].copy()
    val_df = featured_df[(featured_df["date"] >= train_end_date) & (featured_df["date"] < val_end_date)].copy()
    test_df = featured_df[featured_df["date"] >= val_end_date].copy()

    print(f"Dataset Chronological Split Summary:")
    print(f"  Total date range: {unique_dates[0].strftime('%Y-%m-%d')} to {unique_dates[-1].strftime('%Y-%m-%d')}")
    print(f"  Train:      {len(train_df)} rows ({unique_dates[0].strftime('%Y-%m-%d')} to {train_end_date.strftime('%Y-%m-%d')})")
    print(f"  Validation: {len(val_df)} rows ({train_end_date.strftime('%Y-%m-%d')} to {val_end_date.strftime('%Y-%m-%d')})")
    print(f"  Test:       {len(test_df)} rows ({val_end_date.strftime('%Y-%m-%d')} to {unique_dates[-1].strftime('%Y-%m-%d')})")

    return train_df, val_df, test_df
