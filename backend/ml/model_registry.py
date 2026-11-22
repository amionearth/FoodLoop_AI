"""
Model Registry module for tracking, caching, and serving trained forecasting artifacts.
"""
import os
import json
import joblib
from typing import Optional, Dict, Any

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "models"))
LATEST_ARTIFACT_PATH = os.path.join(MODEL_DIR, "demand_forecaster_latest.joblib")
METADATA_PATH = os.path.join(MODEL_DIR, "model_metadata.json")

class ModelRegistry:
    _cached_artifact: Optional[Dict[str, Any]] = None

    @classmethod
    def load_latest_model(cls) -> Optional[Dict[str, Any]]:
        if cls._cached_artifact is not None:
            return cls._cached_artifact
        
        if os.path.exists(LATEST_ARTIFACT_PATH):
            cls._cached_artifact = joblib.load(LATEST_ARTIFACT_PATH)
            return cls._cached_artifact
        return None

    @classmethod
    def get_metadata(cls) -> Optional[Dict[str, Any]]:
        if os.path.exists(METADATA_PATH):
            with open(METADATA_PATH, "r") as f:
                return json.load(f)
        return None

    @classmethod
    def is_model_ready(cls) -> bool:
        return os.path.exists(LATEST_ARTIFACT_PATH)
