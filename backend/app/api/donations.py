import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_seller, require_recipient
from backend.app.models.entities import (
    DonationOffer, DonationAllocation, InventoryBatch, InventoryMovement,
    Product, Business, Recipient, User
)
from backend.app.models.schemas import (
    DonationOfferCreate, DonationOfferResponse, RecipientMatchCandidate,
    AllocationAcceptRequest, AllocationStatusUpdateRequest, AllocationResponse
)
from backend.app.services.matching_engine import match_recipients_for_offer
from backend.app.services.route_service import calculate_and_save_route

router = APIRouter(prefix="/donations", tags=["Donations & Allocations"])

@router.post("/offers", response_model=DonationOfferResponse, status_code=status.HTTP_201_CREATED)
def create_donation_offer(
    req: DonationOfferCreate,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    seller = db.query(Business).filter(Business.id == user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found.")

    batch = db.query(InventoryBatch).filter(
        InventoryBatch.id == req.batch_id,
        InventoryBatch.business_id == user.id
    ).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")

    available = float(batch.quantity) - float(batch.reserved_quantity)
    if req.quantity > available:
        raise HTTPException(
            status_code=400,
            detail=f"Requested offer quantity ({req.quantity}) exceeds available unreserved stock ({available})."
        )

    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    # Reserve the stock in the batch
    batch.reserved_quantity += req.quantity

    # Add ledger movement
    movement = InventoryMovement(
        batch_id=batch.id,
        movement_type="DONATION_RESERVED",
        quantity=-req.quantity,
        reason=f"Stock locked for donation offer '{req.title}'",
        created_at=datetime.now(timezone.utc)
    )
    db.add(movement)

    offer_code = f"OFF-{uuid.uuid4().hex[:8].upper()}"
    offer = DonationOffer(
        offer_code=offer_code,
        business_id=user.id,
        title=req.title,
        product_id=product.id,
        batch_id=batch.id,
        initial_quantity=req.quantity,
        remaining_quantity=req.quantity,
        unit=req.unit,
        food_category=product.category,
        storage_method=batch.storage_method,
        expiry_datetime=batch.expiry_datetime,
        pickup_address=f"{seller.address}, {seller.city}",
        pickup_latitude=seller.latitude,
        pickup_longitude=seller.longitude,
        status="OFFERED",
        notes=req.notes,
        created_at=datetime.now(timezone.utc)
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)

    return DonationOfferResponse(
        id=offer.id,
        offer_code=offer.offer_code,
        business_id=offer.business_id,
        business_name=seller.business_name,
        title=offer.title,
        product_id=offer.product_id,
        product_name=product.name,
        batch_id=offer.batch_id,
        initial_quantity=offer.initial_quantity,
        remaining_quantity=offer.remaining_quantity,
        unit=offer.unit,
        food_category=offer.food_category,
        storage_method=offer.storage_method,
        expiry_datetime=offer.expiry_datetime,
        pickup_address=offer.pickup_address,
        pickup_latitude=offer.pickup_latitude,
        pickup_longitude=offer.pickup_longitude,
        status=offer.status,
        notes=offer.notes,
        created_at=offer.created_at
    )

@router.get("/offers", response_model=List[DonationOfferResponse])
def list_offers(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(DonationOffer)
    if user.role == "SELLER":
        query = query.filter(DonationOffer.business_id == user.id)
    else:
        # Recipient can see open offers
        query = query.filter(DonationOffer.status.in_(["OFFERED", "PARTIALLY_ALLOCATED"]))

    offers = query.order_by(DonationOffer.created_at.desc()).all()
    results = []
    for o in offers:
        results.append(DonationOfferResponse(
            id=o.id,
            offer_code=o.offer_code,
            business_id=o.business_id,
            business_name=o.business.business_name if o.business else "Seller",
            title=o.title,
            product_id=o.product_id,
            product_name=o.business.products[0].name if o.business and o.business.products else "Item",
            batch_id=o.batch_id,
            initial_quantity=o.initial_quantity,
            remaining_quantity=o.remaining_quantity,
            unit=o.unit,
            food_category=o.food_category,
            storage_method=o.storage_method,
            expiry_datetime=o.expiry_datetime,
            pickup_address=o.pickup_address,
            pickup_latitude=o.pickup_latitude,
            pickup_longitude=o.pickup_longitude,
            status=o.status,
            notes=o.notes,
            created_at=o.created_at
        ))
    return results

@router.get("/offers/{offer_id}/matches", response_model=List[RecipientMatchCandidate])
def get_matches_for_offer(
    offer_id: str,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    offer = db.query(DonationOffer).filter(
        DonationOffer.id == offer_id,
        DonationOffer.business_id == user.id
    ).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Donation offer not found.")

    matches = match_recipients_for_offer(db, offer)
    return [RecipientMatchCandidate(**m) for m in matches]

@router.post("/offers/{offer_id}/accept", response_model=AllocationResponse)
def recipient_accept_offer(
    offer_id: str,
    req: AllocationAcceptRequest,
    user: User = Depends(require_recipient),
    db: Session = Depends(get_db)
):
    recipient = db.query(Recipient).filter(Recipient.id == user.id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient profile not found.")

    offer = db.query(DonationOffer).filter(DonationOffer.id == offer_id).with_for_update().first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found.")

    if offer.status not in ("OFFERED", "PARTIALLY_ALLOCATED"):
        raise HTTPException(status_code=400, detail=f"Offer is not available for acceptance (current status: {offer.status}).")

    if req.requested_quantity > offer.remaining_quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Requested quantity ({req.requested_quantity}) exceeds remaining offer quantity ({offer.remaining_quantity})."
        )

    # Check recipient capacity
    if req.requested_quantity > recipient.daily_capacity_meals:
        raise HTTPException(
            status_code=400,
            detail=f"Requested quantity exceeds your daily facility intake capacity ({recipient.daily_capacity_meals})."
        )

    # Decrement offer remaining
    offer.remaining_quantity -= req.requested_quantity
    if offer.remaining_quantity <= 0:
        offer.status = "ALLOCATED"
    else:
        offer.status = "PARTIALLY_ALLOCATED"

    alloc_code = f"ALC-{uuid.uuid4().hex[:8].upper()}"
    allocation = DonationAllocation(
        allocation_code=alloc_code,
        offer_id=offer.id,
        recipient_id=recipient.id,
        allocated_quantity=req.requested_quantity,
        unit=offer.unit,
        status="ACCEPTED",
        scheduled_time=req.scheduled_pickup_time,
        created_at=datetime.now(timezone.utc)
    )
    db.add(allocation)
    db.commit()
    db.refresh(allocation)

    return AllocationResponse(
        id=allocation.id,
        allocation_code=allocation.allocation_code,
        offer_id=offer.id,
        offer_title=offer.title,
        business_name=offer.business.business_name if offer.business else "Seller",
        business_address=offer.pickup_address,
        recipient_id=recipient.id,
        recipient_name=recipient.org_name,
        recipient_address=f"{recipient.address}, {recipient.city}",
        allocated_quantity=allocation.allocated_quantity,
        unit=allocation.unit,
        status=allocation.status,
        scheduled_time=allocation.scheduled_time,
        collected_at=allocation.collected_at,
        delivered_at=allocation.delivered_at,
        delivery_confirmation_notes=allocation.delivery_confirmation_notes,
        created_at=allocation.created_at
    )

@router.get("/allocations", response_model=List[AllocationResponse])
def list_allocations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(DonationAllocation)
    if user.role == "RECIPIENT":
        query = query.filter(DonationAllocation.recipient_id == user.id)
    elif user.role == "SELLER":
        query = query.join(DonationOffer).filter(DonationOffer.business_id == user.id)

    allocs = query.order_by(DonationAllocation.created_at.desc()).all()
    results = []
    for a in allocs:
        results.append(AllocationResponse(
            id=a.id,
            allocation_code=a.allocation_code,
            offer_id=a.offer_id,
            offer_title=a.offer.title if a.offer else "Offer",
            business_name=a.offer.business.business_name if a.offer and a.offer.business else "Seller",
            business_address=a.offer.pickup_address if a.offer else "",
            recipient_id=a.recipient_id,
            recipient_name=a.recipient.org_name if a.recipient else "Recipient",
            recipient_address=f"{a.recipient.address}, {a.recipient.city}" if a.recipient else "",
            allocated_quantity=a.allocated_quantity,
            unit=a.unit,
            status=a.status,
            scheduled_time=a.scheduled_time,
            collected_at=a.collected_at,
            delivered_at=a.delivered_at,
            delivery_confirmation_notes=a.delivery_confirmation_notes,
            created_at=a.created_at
        ))
    return results

@router.put("/allocations/{allocation_id}/status")
async def update_allocation_status(
    allocation_id: str,
    req: AllocationStatusUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alloc = db.query(DonationAllocation).filter(DonationAllocation.id == allocation_id).first()
    if not alloc:
        raise HTTPException(status_code=404, detail="Allocation not found.")

    offer = alloc.offer
    seller_id = offer.business_id

    # Check permission: Seller or Recipient must own this record
    if user.role == "SELLER" and seller_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this offer.")
    if user.role == "RECIPIENT" and alloc.recipient_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this allocation.")

    old_status = alloc.status
    new_status = req.status.upper()
    now = datetime.now(timezone.utc)

    alloc.status = new_status
    if req.notes:
        alloc.delivery_confirmation_notes = req.notes

    if new_status == "COLLECTED":
        alloc.collected_at = now
    elif new_status == "DELIVERED":
        alloc.delivered_at = now
    elif new_status in ("REJECTED", "CANCELLED"):
        # Release the quantity back to the offer and batch
        offer.remaining_quantity += alloc.allocated_quantity
        if offer.remaining_quantity > 0:
            offer.status = "PARTIALLY_ALLOCATED"

        batch = db.query(InventoryBatch).filter(InventoryBatch.id == offer.batch_id).first()
        if batch:
            batch.reserved_quantity = max(0.0, batch.reserved_quantity - alloc.allocated_quantity)
            movement = InventoryMovement(
                batch_id=batch.id,
                movement_type="DONATION_RELEASED",
                quantity=alloc.allocated_quantity,
                reason=f"Allocation {alloc.allocation_code} cancelled/rejected by {user.role}",
                created_at=now
            )
            db.add(movement)

        # Trigger event-driven reroute recalculation if there was an active delivery route
        try:
            active_allocs = db.query(DonationAllocation).join(DonationOffer).filter(
                DonationOffer.business_id == seller_id,
                DonationAllocation.status.in_(["ACCEPTED", "SCHEDULED", "COLLECTED"])
            ).all()
            remaining_rids = list({a.recipient_id for a in active_allocs if a.recipient_id != alloc.recipient_id})
            if remaining_rids:
                await calculate_and_save_route(
                    db=db,
                    seller_id=seller_id,
                    recipient_ids=remaining_rids,
                    trigger_event="RECIPIENT_REJECTED" if new_status == "REJECTED" else "ALLOCATION_CANCELLED",
                    reroute_reason=f"Stop {alloc.recipient.org_name if alloc.recipient else ''} was removed ({new_status}). Route recalculated."
                )
        except Exception as e:
            print("Notice: Rerouting recalculation note:", e)

    db.commit()
    return {
        "success": True,
        "allocation_id": alloc.id,
        "previous_status": old_status,
        "new_status": alloc.status,
        "updated_at": now.isoformat()
    }
