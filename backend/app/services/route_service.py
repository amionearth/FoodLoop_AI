"""
GIS and OSRM Road Routing Service for FOODLOOP AI.
Fetches real route geometry, distance, and duration, and supports event-triggered rerouting.
"""
import json
import uuid
import httpx
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.models.entities import RouteCalculation, Business, Recipient

async def calculate_osrm_route(
    coordinates: List[Dict[str, float]], # List of dicts with {"lat": float, "lon": float, "label": str, "type": str}
) -> Dict[str, Any]:
    """
    Calls OSRM driving service with ordered coordinates [lon, lat].
    Returns road distance (km), duration (mins), and decoded GeoJSON geometry.
    """
    if len(coordinates) < 2:
        raise ValueError("At least 2 coordinate stops (origin and destination) are required for routing.")

    # Format coords as lon,lat;lon,lat;...
    coord_str = ";".join([f"{c['lon']:.6f},{c['lat']:.6f}" for c in coordinates])
    url = f"{settings.OSRM_ROUTING_URL}/{coord_str}?overview=full&geometries=geojson"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                raise RuntimeError(f"OSRM Routing Server returned HTTP {resp.status_code}: {resp.text}")
            
            data = resp.json()
            if data.get("code") != "Ok" or not data.get("routes"):
                raise RuntimeError(f"OSRM did not find a valid driving route: {data.get('message', 'No routes')}")

            best_route = data["routes"][0]
            distance_km = round(best_route["distance"] / 1000.0, 2)
            duration_minutes = round(best_route["duration"] / 60.0, 1)
            geometry = best_route["geometry"] # GeoJSON LineString object

            return {
                "distance_km": distance_km,
                "duration_minutes": duration_minutes,
                "geometry": geometry,
                "provider": "OSRM OpenStreetMap Driving Engine"
            }
    except httpx.RequestError as exc:
        raise RuntimeError(f"Could not connect to OSRM routing service at {url}: {exc}")

async def calculate_and_save_route(
    db: Session,
    seller_id: str,
    recipient_ids: List[str],
    trigger_event: str = "INITIAL_CALCULATION",
    reroute_reason: Optional[str] = None
) -> RouteCalculation:
    """
    Constructs multi-stop delivery route starting at seller and visiting each recipient.
    Supercedes any previous active route for this seller.
    """
    seller = db.query(Business).filter(Business.id == seller_id).first()
    if not seller:
        raise ValueError("Seller business not found.")

    stops = [
        {
            "id": seller.id,
            "label": seller.business_name,
            "address": f"{seller.address}, {seller.city}",
            "lat": seller.latitude,
            "lon": seller.longitude,
            "stop_type": "PICKUP"
        }
    ]

    for rid in recipient_ids:
        r = db.query(Recipient).filter(Recipient.id == rid).first()
        if r:
            stops.append({
                "id": r.id,
                "label": r.org_name,
                "address": f"{r.address}, {r.city}",
                "lat": r.latitude,
                "lon": r.longitude,
                "stop_type": "DELIVERY"
            })

    if len(stops) < 2:
        raise ValueError("Route requires at least one recipient with valid coordinates.")

    # Mark existing active routes for this seller as SUPERSEDED
    existing_routes = db.query(RouteCalculation).filter(
        RouteCalculation.seller_id == seller_id,
        RouteCalculation.status == "ACTIVE"
    ).all()
    for er in existing_routes:
        er.status = "SUPERSEDED"

    # Compute road geometry from OSRM
    route_result = await calculate_osrm_route(stops)

    route_code = f"RT-{uuid.uuid4().hex[:8].upper()}"
    new_route = RouteCalculation(
        route_code=route_code,
        seller_id=seller_id,
        stops_json=json.dumps(stops),
        geometry_geojson=json.dumps(route_result["geometry"]),
        total_distance_km=route_result["distance_km"],
        total_duration_minutes=route_result["duration_minutes"],
        status="ACTIVE",
        routing_provider=route_result["provider"],
        trigger_event=trigger_event,
        reroute_reason=reroute_reason,
        created_at=datetime.now(timezone.utc)
    )

    db.add(new_route)
    db.commit()
    db.refresh(new_route)
    return new_route
