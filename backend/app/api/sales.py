from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timezone
from backend.app.core.database import get_db
from backend.app.core.security import require_seller
from backend.app.models.entities import DailySale, Product, User, InventoryBatch, InventoryMovement
from backend.app.models.schemas import CashierSalesEntry, DailySaleResponse

router = APIRouter(prefix="/sales", tags=["Sales & Universal Cashier"])

@router.get("", response_model=List[DailySaleResponse])
def list_sales(
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    sales = db.query(DailySale).filter(
        DailySale.business_id == user.id
    ).order_by(DailySale.business_date.desc()).all()

    results = []
    for s in sales:
        results.append(DailySaleResponse(
            id=s.id,
            business_id=s.business_id,
            product_id=s.product_id,
            product_name=s.product.name if s.product else "Unknown",
            business_date=s.business_date,
            opening_stock=s.opening_stock,
            stock_received=s.stock_received,
            units_sold=s.units_sold,
            cancelled_units=s.cancelled_units,
            refunded_units=s.refunded_units,
            recorded_waste=s.recorded_waste,
            closing_stock=s.closing_stock,
            expected_closing=s.expected_closing,
            discrepancy=s.discrepancy,
            unit=s.unit,
            selling_price=s.selling_price,
            promotion=s.promotion,
            notes=s.notes,
            source=s.source,
            created_at=s.created_at
        ))
    return results

@router.post("/cashier", response_model=DailySaleResponse, status_code=status.HTTP_201_CREATED)
def record_cashier_sales_reconciliation(
    req: CashierSalesEntry,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == req.product_id,
        Product.business_id == user.id
    ).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found or access denied.")

    # Net units sold = units_sold - cancelled_units - refunded_units
    net_sales = max(0.0, req.units_sold - req.cancelled_units - req.refunded_units)
    
    # Official Reconciliation Formula:
    # Expected Closing = Opening + Received - Net Sales - Recorded Waste
    expected_closing = round(req.opening_stock + req.stock_received - net_sales - req.recorded_waste, 2)
    discrepancy = round(req.closing_stock - expected_closing, 2)

    # Check for existing record for the same product and business_date (idempotency / update)
    existing = db.query(DailySale).filter(
        DailySale.business_id == user.id,
        DailySale.product_id == req.product_id,
        DailySale.business_date == req.business_date
    ).first()

    if existing:
        existing.opening_stock = req.opening_stock
        existing.stock_received = req.stock_received
        existing.units_sold = req.units_sold
        existing.cancelled_units = req.cancelled_units
        existing.refunded_units = req.refunded_units
        existing.recorded_waste = req.recorded_waste
        existing.closing_stock = req.closing_stock
        existing.expected_closing = expected_closing
        existing.discrepancy = discrepancy
        existing.unit = req.unit
        existing.selling_price = req.selling_price or product.unit_price
        existing.promotion = req.promotion
        existing.notes = req.notes
        existing.source = "MANUAL_CASHIER"
        sale_record = existing
    else:
        sale_record = DailySale(
            business_id=user.id,
            product_id=req.product_id,
            business_date=req.business_date,
            opening_stock=req.opening_stock,
            stock_received=req.stock_received,
            units_sold=req.units_sold,
            cancelled_units=req.cancelled_units,
            refunded_units=req.refunded_units,
            recorded_waste=req.recorded_waste,
            closing_stock=req.closing_stock,
            expected_closing=expected_closing,
            discrepancy=discrepancy,
            unit=req.unit,
            selling_price=req.selling_price or product.unit_price,
            promotion=req.promotion,
            notes=req.notes,
            source="MANUAL_CASHIER"
        )
        db.add(sale_record)

    db.commit()
    db.refresh(sale_record)

    return DailySaleResponse(
        id=sale_record.id,
        business_id=sale_record.business_id,
        product_id=sale_record.product_id,
        product_name=product.name,
        business_date=sale_record.business_date,
        opening_stock=sale_record.opening_stock,
        stock_received=sale_record.stock_received,
        units_sold=sale_record.units_sold,
        cancelled_units=sale_record.cancelled_units,
        refunded_units=sale_record.refunded_units,
        recorded_waste=sale_record.recorded_waste,
        closing_stock=sale_record.closing_stock,
        expected_closing=sale_record.expected_closing,
        discrepancy=sale_record.discrepancy,
        unit=sale_record.unit,
        selling_price=sale_record.selling_price,
        promotion=sale_record.promotion,
        notes=sale_record.notes,
        source=sale_record.source,
        created_at=sale_record.created_at
    )
