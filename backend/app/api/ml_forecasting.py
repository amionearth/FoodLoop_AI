from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import Dict, Any
from backend.app.core.database import get_db
from backend.app.core.security import require_seller
from backend.app.models.entities import Product, DailySale, Forecast, User
from backend.app.models.schemas import ForecastRequest, ForecastResponse
from backend.ml.model_registry import ModelRegistry
from backend.ml.predict import predict_demand_for_product
from backend.ml.train import train_and_evaluate

router = APIRouter(prefix="/ml", tags=["Machine Learning Demand Forecasting"])

@router.get("/model-status")
def get_model_status():
    metadata = ModelRegistry.get_metadata()
    if not metadata:
        return {
            "status": "NOT_TRAINED",
            "message": "No model artifact loaded. Run training pipeline or retrain endpoint."
        }
    return {
        "status": "READY",
        "algorithm": metadata.get("algorithm"),
        "version": metadata.get("version"),
        "trained_at": metadata.get("trained_at"),
        "dataset_source": metadata.get("dataset_source"),
        "metrics": metadata.get("metrics"),
        "baseline_metrics": metadata.get("baseline_metrics"),
        "train_period": metadata.get("train_period"),
        "test_period": metadata.get("test_period")
    }

@router.get("/metrics")
def get_model_metrics():
    metadata = ModelRegistry.get_metadata()
    if not metadata:
        raise HTTPException(status_code=404, detail="Model metadata not found.")
    return {
        "algorithm": metadata.get("algorithm"),
        "version": metadata.get("version"),
        "metrics": metadata.get("metrics"),
        "baseline_comparison": metadata.get("baseline_metrics"),
        "metric_definitions": {
            "mae": "Mean Absolute Error: Average absolute difference between forecasted and actual demand.",
            "rmse": "Root Mean Squared Error: Penalizes larger demand deviations.",
            "wape": "Weighted Absolute Percentage Error: Total absolute error divided by total actual demand.",
            "bias": "Mean Forecast Bias: Positive implies surplus over-forecasting, negative implies under-forecasting."
        }
    }

@router.post("/predict", response_model=ForecastResponse)
def generate_forecast(
    req: ForecastRequest,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    # Verify product belongs to authenticated seller
    product = db.query(Product).filter(
        Product.id == req.product_id,
        Product.business_id == user.id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or access denied.")

    # Retrieve seller's real historical sales for this product
    sales = db.query(DailySale).filter(
        DailySale.business_id == user.id,
        DailySale.product_id == req.product_id
    ).order_by(DailySale.business_date.asc()).all()

    sales_history = [
        {
            "business_date": s.business_date,
            "units_sold": s.units_sold,
            "unit_price": s.selling_price
        }
        for s in sales
    ]

    result = predict_demand_for_product(
        product_name=product.name,
        forecast_date=req.forecast_date,
        historical_sales=sales_history
    )

    # Persist the forecast record
    forecast_record = Forecast(
        business_id=user.id,
        product_id=product.id,
        forecast_date=req.forecast_date,
        predicted_demand=result["predicted_demand"],
        method=result["method"],
        model_version=result["model_version"],
        confidence_status=result["confidence_status"],
        metrics_json=str(result.get("evaluation_metrics", {}))
    )
    db.add(forecast_record)
    db.commit()

    return ForecastResponse(
        product_id=product.id,
        product_name=product.name,
        forecast_date=req.forecast_date,
        predicted_demand=result["predicted_demand"],
        model_version=result["model_version"],
        model_status=result["model_status"],
        method=result["method"],
        confidence_status=result["confidence_status"],
        evaluation_metrics=result.get("evaluation_metrics", {})
    )

@router.post("/retrain")
def trigger_retraining(user: User = Depends(require_seller)):
    # Triggers reproducible training run
    try:
        artifact = train_and_evaluate()
        return {
            "success": True,
            "message": f"Successfully retrained model {artifact['algorithm']} ({artifact['version']})",
            "metrics": artifact["metrics"],
            "version": artifact["version"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model retraining failed: {str(e)}")
