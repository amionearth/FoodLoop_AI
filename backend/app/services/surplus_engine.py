"""
Surplus Prediction and Food Safety Review Engine.
"""
from datetime import datetime, date, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.entities import InventoryBatch, Product, DailySale, SurplusPrediction
from backend.ml.predict import predict_demand_for_product

def calculate_potential_surplus_for_batch(
    db: Session,
    batch: InventoryBatch,
    forecast_date: Optional[date] = None
) -> Dict[str, Any]:
    """
    Computes potential surplus:
    Available Stock = batch.quantity - batch.reserved_quantity
    Expected Demand = ML Forecast for today/forecast_date
    Potential Surplus = max(0, Available Stock - Expected Demand)
    
    Applies Food Safety checks:
    - If expiry_datetime <= now: EXPIRED
    - If food_condition == 'SPOILED': REJECTED
    - If remaining hours < 2: HIGH_RISK
    - Else: ELIGIBLE_FOR_REVIEW
    """
    now = datetime.now(timezone.utc)
    target_date = forecast_date or now.date()

    # Net physically available unreserved stock
    net_available = max(0.0, float(batch.quantity) - float(batch.reserved_quantity))
    
    # Check food safety rules
    review_status = "PENDING_REVIEW"
    review_reason = "Awaiting human review"
    
    batch_expiry = batch.expiry_datetime
    if batch_expiry.tzinfo is None:
        batch_expiry = batch_expiry.replace(tzinfo=timezone.utc)

    if batch_expiry <= now:
        review_status = "EXPIRED"
        review_reason = "Batch has exceeded its safety use-by date."
    elif batch.food_condition == "SPOILED":
        review_status = "REJECTED"
        review_reason = "Visual or sensory audit flagged condition as spoiled."
    else:
        # Determine remaining shelf life in hours
        hours_remaining = (batch_expiry - now).total_seconds() / 3600.0
        if hours_remaining < 3.0:
            review_status = "CRITICAL_TIMEFRAME"
            review_reason = f"Urgent: Only {hours_remaining:.1f} hours of safe shelf life remaining."
        else:
            review_status = "ELIGIBLE_FOR_REVIEW"
            review_reason = f"Eligible for human safety sign-off. {hours_remaining:.1f} hours remaining."

    # Retrieve sales history for product to feed ML engine
    sales_records = db.query(DailySale).filter(
        DailySale.business_id == batch.business_id,
        DailySale.product_id == batch.product_id
    ).all()

    sales_history = [
        {
            "business_date": s.business_date,
            "units_sold": s.units_sold,
            "unit_price": s.selling_price
        }
        for s in sales_records
    ]

    product = db.query(Product).filter(Product.id == batch.product_id).first()
    product_name = product.name if product else "Unknown Product"

    # Get demand prediction
    forecast_result = predict_demand_for_product(
        product_name=product_name,
        forecast_date=target_date,
        historical_sales=sales_history
    )
    predicted_demand = float(forecast_result["predicted_demand"])

    # Calculate surplus
    # If safety check failed, potential surplus for donation is 0
    if review_status in ("EXPIRED", "REJECTED"):
        potential_surplus = 0.0
    else:
        potential_surplus = max(0.0, round(net_available - predicted_demand, 1))

    return {
        "product_id": batch.product_id,
        "product_name": product_name,
        "batch_id": batch.id,
        "batch_number": batch.batch_number,
        "available_quantity": net_available,
        "predicted_demand": predicted_demand,
        "reserved_quantity": batch.reserved_quantity,
        "potential_surplus": potential_surplus,
        "unit": batch.unit,
        "storage_method": batch.storage_method,
        "expiry_datetime": batch.expiry_datetime,
        "review_status": review_status,
        "review_reason": review_reason,
        "forecast_method": forecast_result["method"],
        "confidence_status": forecast_result["confidence_status"],
    }
