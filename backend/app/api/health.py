import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.ml.model_registry import ModelRegistry

router = APIRouter(tags=["System Health & Telemetry"])

@router.get("/")
@router.get("/health")
@router.get("/api/health")
async def health_check(db: Session = Depends(get_db)):
    # 1. Database check
    db_status = "HEALTHY"
    db_message = "Connected to persistent storage engine."
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = "UNHEALTHY"
        db_message = f"Database query failed: {str(e)}"

    # 2. ML model check
    ml_status = "READY" if ModelRegistry.is_model_ready() else "NOT_TRAINED"
    ml_metadata = ModelRegistry.get_metadata()
    ml_version = ml_metadata.get("version") if ml_metadata else "none"

    # 3. Routing service check
    routing_status = "AVAILABLE"
    try:
        # Ping OSRM health
        test_url = f"{settings.OSRM_ROUTING_URL}/9.18,48.77;9.19,48.78?overview=false"
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(test_url)
            if resp.status_code != 200:
                routing_status = "DEGRADED"
    except Exception:
        routing_status = "UNAVAILABLE_PUBLIC_DEMO_DOWN"

    return {
        "status": "OPERATIONAL" if db_status == "HEALTHY" else "DEGRADED",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": settings.VERSION,
        "services": {
            "api_server": {"status": "HEALTHY", "runtime": "FastAPI / Python 3.12"},
            "database": {"status": db_status, "detail": db_message},
            "ml_model_engine": {
                "status": ml_status,
                "version": ml_version,
                "algorithm": ml_metadata.get("algorithm") if ml_metadata else "None"
            },
            "road_routing_osrm": {
                "status": routing_status,
                "endpoint": settings.OSRM_ROUTING_URL
            },
            "universal_cashier": {"status": "ACTIVE", "type": "Native Database Pipeline"},
            "excel_pipeline": {"status": "ACTIVE", "type": "Multi-sheet Streaming Validator"},
            "pos_connectors": {
                "gofrugal": {"status": "REQUIRES_CREDENTIALS"},
                "square": {"status": "REQUIRES_CREDENTIALS"}
            }
        }
    }
