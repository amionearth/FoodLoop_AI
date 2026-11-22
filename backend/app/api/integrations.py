from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from backend.app.core.database import get_db
from backend.app.core.security import require_seller
from backend.app.models.entities import PosIntegration, User
from backend.app.models.schemas import PosStatusResponse
from backend.app.services.pos_adapters import GoFrugalAdapter, SquareAdapter

router = APIRouter(prefix="/integrations", tags=["POS & Cashier Integrations"])

@router.get("/status", response_model=List[PosStatusResponse])
def get_integrations_status(
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    # Check if seller has saved pos integration
    saved = db.query(PosIntegration).filter(PosIntegration.business_id == user.id).first()
    
    gf_connected = False
    sq_connected = False
    if saved:
        if saved.provider == "GOFRUGAL" and saved.is_connected:
            gf_connected = True
        elif saved.provider == "SQUARE" and saved.is_connected:
            sq_connected = True

    return [
        PosStatusResponse(
            provider="GoFrugal Connect (TruePOS / RPOS)",
            is_connected=gf_connected,
            status="CONNECTED" if gf_connected else "NOT_CONFIGURED",
            last_sync_at=saved.last_sync_at if gf_connected else None,
            message="Live connection active." if gf_connected else "Not configured — add the required GoFrugal license key and auth token to connect."
        ),
        PosStatusResponse(
            provider="Square POS Connect",
            is_connected=sq_connected,
            status="CONNECTED" if sq_connected else "NOT_CONFIGURED",
            last_sync_at=saved.last_sync_at if sq_connected else None,
            message="Live OAuth session active." if sq_connected else "Not configured — add the required Square OAuth Access Token and Location ID."
        ),
        PosStatusResponse(
            provider="FOODLOOP Universal Cashier & Excel Pipeline",
            is_connected=True,
            status="CONNECTED",
            last_sync_at=None,
            message="Native zero-credential sales & stock reconciliation pipeline is fully operational."
        ),
    ]

@router.post("/connect")
async def connect_pos(
    provider: str,
    credentials: Dict[str, Any],
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    provider_upper = provider.upper()
    if provider_upper == "GOFRUGAL":
        adapter = GoFrugalAdapter()
    elif provider_upper == "SQUARE":
        adapter = SquareAdapter()
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported POS provider: {provider}")

    result = await adapter.connect(credentials)
    if not result["success"]:
        return {
            "success": False,
            "status": result["status"],
            "message": result["message"]
        }

    # Save integration record
    existing = db.query(PosIntegration).filter(PosIntegration.business_id == user.id).first()
    if not existing:
        existing = PosIntegration(business_id=user.id, provider=provider_upper)
        db.add(existing)
    
    existing.is_connected = True
    existing.status = "CONNECTED"
    existing.sync_logs = "Initial credentials handshake successful."
    db.commit()

    return {
        "success": True,
        "status": "CONNECTED",
        "message": result["message"]
    }

@router.post("/disconnect")
def disconnect_pos(
    provider: str,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    existing = db.query(PosIntegration).filter(
        PosIntegration.business_id == user.id,
        PosIntegration.provider == provider.upper()
    ).first()
    if existing:
        existing.is_connected = False
        existing.status = "NOT_CONFIGURED"
        db.commit()
    return {"success": True, "message": f"{provider} disconnected successfully."}
