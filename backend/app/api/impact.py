from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.core.database import get_db
from backend.app.models.entities import (
    DonationOffer, DonationAllocation, SurplusPrediction, Business, Recipient
)
from backend.app.models.schemas import ImpactSummaryResponse

router = APIRouter(prefix="/impact", tags=["Measurable Impact Analytics"])

@router.get("/summary", response_model=ImpactSummaryResponse)
def get_impact_summary(db: Session = Depends(get_db)):
    # 1. Total potential surplus identified
    total_surplus_records = db.query(func.sum(SurplusPrediction.potential_surplus)).scalar() or 0.0
    
    # 2. Total offers created
    offers_count = db.query(func.count(DonationOffer.id)).scalar() or 0
    total_offered_qty = db.query(func.sum(DonationOffer.initial_quantity)).scalar() or 0.0

    # 3. Allocations by status
    accepted_qty = db.query(func.sum(DonationAllocation.allocated_quantity)).filter(
        DonationAllocation.status.in_(["ACCEPTED", "SCHEDULED", "COLLECTED", "DELIVERED"])
    ).scalar() or 0.0

    delivered_qty = db.query(func.sum(DonationAllocation.allocated_quantity)).filter(
        DonationAllocation.status == "DELIVERED"
    ).scalar() or 0.0

    # Counts of participating parties
    sellers_count = db.query(func.count(Business.id)).scalar() or 0
    recipients_count = db.query(func.count(Recipient.id)).scalar() or 0

    # Rescued calculations:
    # 1 standard portion/meal ~ 0.45 kg
    # 1 kg rescued ~ 2.5 kg CO2e avoided (UNEP Food Waste Index standard)
    rescued_kg = round(delivered_qty * 0.45, 1)
    co2e_kg = round(rescued_kg * 2.5, 1)

    completion_rate = round((delivered_qty / max(1.0, total_offered_qty)) * 100.0, 1)

    methodology = (
        "Delivered quantities represent actual recorded and confirmed handoffs. "
        "Estimated mass is calculated assuming 0.45 kg per standard meal portion. "
        "Carbon emissions avoided are estimated at 2.5 kg CO2e per kg food diverted from landfill "
        "per UNEP Food Waste Index and FAO guidelines."
    )

    return ImpactSummaryResponse(
        potential_surplus_identified_kg=round(total_surplus_records * 0.45, 1),
        offers_created_count=offers_count,
        quantity_offered_meals=round(total_offered_qty, 1),
        quantity_accepted_meals=round(accepted_qty, 1),
        quantity_delivered_meals=round(delivered_qty, 1),
        actual_rescued_kg=rescued_kg,
        estimated_co2e_avoided_kg=co2e_kg,
        participating_sellers_count=sellers_count,
        active_recipients_count=recipients_count,
        completion_rate_percentage=completion_rate,
        methodology_note=methodology
    )
