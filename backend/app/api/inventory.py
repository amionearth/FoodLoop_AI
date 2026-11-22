from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from backend.app.core.database import get_db
from backend.app.core.security import require_seller
from backend.app.models.entities import InventoryBatch, InventoryMovement, Product, User
from backend.app.models.schemas import InventoryBatchCreate, InventoryBatchResponse

router = APIRouter(prefix="/inventory", tags=["Inventory Management"])

@router.get("", response_model=List[InventoryBatchResponse])
def list_inventory(
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    batches = db.query(InventoryBatch).filter(InventoryBatch.business_id == user.id).all()
    results = []
    for b in batches:
        results.append(InventoryBatchResponse(
            id=b.id,
            business_id=b.business_id,
            product_id=b.product_id,
            product_name=b.product.name if b.product else "Unknown",
            batch_number=b.batch_number,
            quantity=b.quantity,
            reserved_quantity=b.reserved_quantity,
            unit=b.unit,
            received_or_prep_time=b.received_or_prep_time,
            expiry_datetime=b.expiry_datetime,
            storage_method=b.storage_method,
            storage_temp_c=b.storage_temp_c,
            food_condition=b.food_condition,
            notes=b.notes,
            created_at=b.created_at
        ))
    return results

@router.post("", response_model=InventoryBatchResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_batch(
    req: InventoryBatchCreate,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    # Verify product ownership and unit match
    product = db.query(Product).filter(
        Product.id == req.product_id,
        Product.business_id == user.id
    ).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found or access denied.")

    if product.unit.lower() != req.unit.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incompatible unit: Product uses '{product.unit}' but batch was provided with '{req.unit}'."
        )

    if req.expiry_datetime <= req.received_or_prep_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expiry datetime must be after preparation or received datetime."
        )

    batch = InventoryBatch(
        business_id=user.id,
        product_id=req.product_id,
        batch_number=req.batch_number.strip(),
        quantity=max(0.0, req.quantity),
        reserved_quantity=0.0,
        unit=req.unit,
        received_or_prep_time=req.received_or_prep_time,
        expiry_datetime=req.expiry_datetime,
        storage_method=req.storage_method,
        storage_temp_c=req.storage_temp_c,
        food_condition=req.food_condition,
        notes=req.notes
    )
    db.add(batch)
    db.flush()

    # Record initial stock-in ledger movement
    movement = InventoryMovement(
        batch_id=batch.id,
        movement_type="STOCK_IN",
        quantity=batch.quantity,
        reason=f"Initial batch check-in #{batch.batch_number}",
        created_at=datetime.now(timezone.utc)
    )
    db.add(movement)
    db.commit()
    db.refresh(batch)

    return InventoryBatchResponse(
        id=batch.id,
        business_id=batch.business_id,
        product_id=batch.product_id,
        product_name=product.name,
        batch_number=batch.batch_number,
        quantity=batch.quantity,
        reserved_quantity=batch.reserved_quantity,
        unit=batch.unit,
        received_or_prep_time=batch.received_or_prep_time,
        expiry_datetime=batch.expiry_datetime,
        storage_method=batch.storage_method,
        storage_temp_c=batch.storage_temp_c,
        food_condition=batch.food_condition,
        notes=batch.notes,
        created_at=batch.created_at
    )

@router.get("/{batch_id}/movements")
def get_batch_movements(
    batch_id: str,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    batch = db.query(InventoryBatch).filter(
        InventoryBatch.id == batch_id,
        InventoryBatch.business_id == user.id
    ).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")

    movements = db.query(InventoryMovement).filter(InventoryMovement.batch_id == batch_id).order_by(InventoryMovement.created_at.desc()).all()
    return [
        {
            "id": m.id,
            "movement_type": m.movement_type,
            "quantity": m.quantity,
            "reason": m.reason,
            "created_at": m.created_at
        }
        for m in movements
    ]
