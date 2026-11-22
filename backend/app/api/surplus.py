from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date, timezone
from backend.app.core.database import get_db
from backend.app.core.security import require_seller
from backend.app.models.entities import InventoryBatch, SurplusPrediction, User
from backend.app.models.schemas import SurplusPredictionResponse, SafetyReviewActionRequest
from backend.app.services.surplus_engine import calculate_potential_surplus_for_batch

router = APIRouter(prefix="/surplus", tags=["Surplus Prediction & Food Safety Review"])

@router.get("/predictions", response_model=List[SurplusPredictionResponse])
def get_surplus_predictions(
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    batches = db.query(InventoryBatch).filter(InventoryBatch.business_id == user.id).all()
    results = []

    for b in batches:
        surplus_data = calculate_potential_surplus_for_batch(db, b)
        
        # Check if record already persisted or update
        existing_pred = db.query(SurplusPrediction).filter(
            SurplusPrediction.business_id == user.id,
            SurplusPrediction.batch_id == b.id,
            SurplusPrediction.calculation_date == datetime.now(timezone.utc).date()
        ).first()

        if existing_pred:
            existing_pred.available_quantity = surplus_data["available_quantity"]
            existing_pred.predicted_demand = surplus_data["predicted_demand"]
            existing_pred.reserved_quantity = surplus_data["reserved_quantity"]
            existing_pred.potential_surplus = surplus_data["potential_surplus"]
            pred_record = existing_pred
        else:
            pred_record = SurplusPrediction(
                business_id=user.id,
                product_id=b.product_id,
                batch_id=b.id,
                calculation_date=datetime.now(timezone.utc).date(),
                available_quantity=surplus_data["available_quantity"],
                predicted_demand=surplus_data["predicted_demand"],
                reserved_quantity=surplus_data["reserved_quantity"],
                potential_surplus=surplus_data["potential_surplus"],
                unit=b.unit,
                review_status=surplus_data["review_status"],
                review_reason=surplus_data["review_reason"],
                human_approved=False
            )
            db.add(pred_record)
            db.flush()

        results.append(SurplusPredictionResponse(
            id=pred_record.id,
            product_id=b.product_id,
            product_name=surplus_data["product_name"],
            batch_id=b.id,
            batch_number=b.batch_number,
            calculation_date=pred_record.calculation_date,
            available_quantity=pred_record.available_quantity,
            predicted_demand=pred_record.predicted_demand,
            reserved_quantity=pred_record.reserved_quantity,
            potential_surplus=pred_record.potential_surplus,
            unit=b.unit,
            storage_method=b.storage_method,
            expiry_datetime=b.expiry_datetime,
            review_status=pred_record.review_status,
            review_reason=pred_record.review_reason,
            human_approved=pred_record.human_approved
        ))

    db.commit()
    return results

@router.post("/{batch_id}/review")
def review_food_safety(
    batch_id: str,
    action: SafetyReviewActionRequest,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    batch = db.query(InventoryBatch).filter(
        InventoryBatch.id == batch_id,
        InventoryBatch.business_id == user.id
    ).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Inventory batch not found.")

    pred = db.query(SurplusPrediction).filter(
        SurplusPrediction.batch_id == batch_id,
        SurplusPrediction.business_id == user.id
    ).order_by(SurplusPrediction.created_at.desc()).first()

    if not pred:
        raise HTTPException(status_code=404, detail="Surplus calculation not found for batch.")

    if action.approved:
        pred.review_status = "APPROVED"
        pred.review_reason = f"Human safety approval granted by {action.reviewer_name}: {action.reason}"
        pred.human_approved = True
        pred.approved_by = action.reviewer_name
    else:
        pred.review_status = "REJECTED"
        pred.review_reason = f"Rejected during safety inspection by {action.reviewer_name}: {action.reason}"
        pred.human_approved = False

    db.commit()
    return {
        "success": True,
        "batch_id": batch_id,
        "review_status": pred.review_status,
        "review_reason": pred.review_reason
    }
