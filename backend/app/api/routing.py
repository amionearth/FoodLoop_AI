import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_seller
from backend.app.models.entities import RouteCalculation, Business, Recipient, User
from backend.app.models.schemas import RouteRequest, RouteCalculationResponse
from backend.app.services.route_service import calculate_and_save_route

router = APIRouter(prefix="/routing", tags=["GIS Road Routing & Rerouting"])

@router.get("/active")
def get_active_route(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seller_id = user.id if user.role == "SELLER" else None
    
    query = db.query(RouteCalculation).filter(RouteCalculation.status == "ACTIVE")
    if seller_id:
        query = query.filter(RouteCalculation.seller_id == seller_id)
        
    route = query.order_by(RouteCalculation.created_at.desc()).first()
    if not route:
        return {"has_active_route": False, "route": None}

    return {
        "has_active_route": True,
        "route": {
            "route_code": route.route_code,
            "seller_id": route.seller_id,
            "stops": json.loads(route.stops_json),
            "geometry": json.loads(route.geometry_geojson),
            "total_distance_km": route.total_distance_km,
            "total_duration_minutes": route.total_duration_minutes,
            "status": route.status,
            "routing_provider": route.routing_provider,
            "calculated_at": route.created_at,
            "reroute_reason": route.reroute_reason
        }
    }

@router.post("/calculate")
async def calculate_route(
    req: RouteRequest,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    if not req.recipient_ids:
        raise HTTPException(status_code=400, detail="At least one recipient stop is required.")

    try:
        route = await calculate_and_save_route(
            db=db,
            seller_id=user.id,
            recipient_ids=req.recipient_ids,
            trigger_event="MANUAL_REQUEST"
        )
        return {
            "route_code": route.route_code,
            "seller_id": route.seller_id,
            "stops": json.loads(route.stops_json),
            "geometry": json.loads(route.geometry_geojson),
            "total_distance_km": route.total_distance_km,
            "total_duration_minutes": route.total_duration_minutes,
            "status": route.status,
            "routing_provider": route.routing_provider,
            "calculated_at": route.created_at
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Routing calculation failed: {str(e)}")

@router.post("/reroute")
async def trigger_reroute(
    req: RouteRequest,
    reason: str = "Delivery conditions or stop list modified",
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    try:
        route = await calculate_and_save_route(
            db=db,
            seller_id=user.id,
            recipient_ids=req.recipient_ids,
            trigger_event="DYNAMIC_REROUTE",
            reroute_reason=reason
        )
        return {
            "route_code": route.route_code,
            "seller_id": route.seller_id,
            "stops": json.loads(route.stops_json),
            "geometry": json.loads(route.geometry_geojson),
            "total_distance_km": route.total_distance_km,
            "total_duration_minutes": route.total_duration_minutes,
            "status": route.status,
            "routing_provider": route.routing_provider,
            "calculated_at": route.created_at,
            "reroute_reason": route.reroute_reason
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rerouting failed: {str(e)}")
