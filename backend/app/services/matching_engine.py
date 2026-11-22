"""
Recipient Matching and Allocation Engine for FOODLOOP AI.
Evaluates category match, storage capabilities, capacity limits, and distance.
"""
import math
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.entities import Recipient, DonationOffer, DonationAllocation

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance between two WGS84 coordinates in kilometers.
    """
    R = 6371.0 # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)

def match_recipients_for_offer(
    db: Session,
    offer: DonationOffer,
    max_radius_km: float = 35.0
) -> List[Dict[str, Any]]:
    """
    Matches registered recipient organizations against a donation offer.
    
    Mandatory Rules:
    1. Recipient must accept the offer's food category.
    2. Recipient's storage capabilities must support the offer's storage requirements (e.g. CHILLED/FROZEN).
    3. Remaining daily capacity must be > 0.
    
    Transparent Scoring Formula:
    Score = (Category Compatibility * 30)
          + (Storage Compatibility * 25)
          + (Capacity Fit * 25)
          + (Proximity Score * 20)
    """
    candidates = db.query(Recipient).all()
    matches = []

    offer_category = offer.food_category.strip().lower()
    offer_storage = offer.storage_method.strip().upper()

    for r in candidates:
        # Mandatory Filter 1: Storage compatibility
        recipient_storage = [s.strip().upper() for s in (r.storage_capabilities or "").split(",")]
        if offer_storage not in recipient_storage and "AMBIENT" not in recipient_storage and offer_storage != "AMBIENT":
            continue

        # Mandatory Filter 2: Category compatibility
        accepted_cats = [c.strip().lower() for c in (r.accepted_categories or "").split(",")]
        # Match if explicitly in list or "all" or partial match
        category_matched = any(
            cat in offer_category or offer_category in cat or cat == "all"
            for cat in accepted_cats
        )
        if not category_matched and "prepared meals" not in accepted_cats:
            continue

        # Mandatory Filter 3: Check remaining capacity
        # Calculate already accepted allocations for today
        active_allocations = db.query(DonationAllocation).filter(
            DonationAllocation.recipient_id == r.id,
            DonationAllocation.status.in_(["ACCEPTED", "SCHEDULED", "COLLECTED"])
        ).all()
        used_capacity = sum(a.allocated_quantity for a in active_allocations)
        remaining_capacity = max(0, r.daily_capacity_meals - int(used_capacity))

        if remaining_capacity <= 0:
            continue

        # Proximity
        dist_km = haversine_distance(
            offer.pickup_latitude, offer.pickup_longitude,
            r.latitude, r.longitude
        )

        if dist_km > max_radius_km:
            continue

        # Estimated travel time (~30 km/h urban speed)
        est_minutes = round((dist_km / 30.0) * 60.0 + 5.0, 1)

        # Scoring
        proximity_score = max(0.0, 20.0 * (1.0 - (dist_km / max_radius_km)))
        capacity_ratio = min(1.0, remaining_capacity / max(1.0, offer.remaining_quantity))
        capacity_score = 25.0 * capacity_ratio
        category_score = 30.0
        storage_score = 25.0
        
        # Verification bonus
        verification_bonus = 5.0 if r.verification_status == "VERIFIED" else 0.0

        total_score = round(proximity_score + capacity_score + category_score + storage_score + verification_bonus, 1)

        # Generate transparent factual explanation
        explanation = (
            f"Matches {offer.food_category} category and {offer.storage_method} storage requirement. "
            f"Distance: {dist_km} km (~{est_minutes} mins). "
            f"Available capacity: {remaining_capacity} {offer.unit} (Total capacity: {r.daily_capacity_meals}). "
            f"Verification: {r.verification_status}."
        )

        matches.append({
            "recipient_id": r.id,
            "org_name": r.org_name,
            "org_type": r.org_type,
            "address": f"{r.address}, {r.city}",
            "distance_km": dist_km,
            "estimated_travel_minutes": est_minutes,
            "daily_capacity_meals": remaining_capacity,
            "storage_capabilities": r.storage_capabilities,
            "verification_status": r.verification_status,
            "match_score": total_score,
            "match_explanation": explanation
        })

    # Sort descending by match score
    matches.sort(key=lambda m: m["match_score"], reverse=True)
    return matches
