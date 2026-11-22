from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import (
    get_password_hash, verify_password, create_access_token, get_current_user
)
from backend.app.models.entities import User, Business, Recipient
from backend.app.models.schemas import (
    SellerRegisterRequest, RecipientRegisterRequest, LoginRequest, Token, UserProfileResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/seller/register", response_model=Token)
def register_seller(req: SellerRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Coordinates validation
    if not (-90.0 <= req.latitude <= 90.0) or not (-180.0 <= req.longitude <= 180.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid coordinates. Latitude must be in [-90, 90] and longitude in [-180, 180]."
        )

    user = User(
        email=req.email.lower(),
        hashed_password=get_password_hash(req.password),
        role="SELLER"
    )
    db.add(user)
    db.flush()

    business = Business(
        id=user.id,
        business_name=req.business_name,
        category=req.category,
        contact_person=req.contact_person,
        phone=req.phone,
        address=req.address,
        city=req.city,
        state=req.state,
        country=req.country,
        postal_code=req.postal_code,
        latitude=req.latitude,
        longitude=req.longitude,
        operating_hours=req.operating_hours,
        food_categories=req.food_categories,
        is_test_account=req.is_test_account
    )
    db.add(business)
    db.commit()

    token = create_access_token({"sub": user.id, "role": user.role, "name": business.business_name})
    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        business_name=business.business_name
    )

@router.post("/recipient/register", response_model=Token)
def register_recipient(req: RecipientRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    if not (-90.0 <= req.latitude <= 90.0) or not (-180.0 <= req.longitude <= 180.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid coordinates. Latitude must be in [-90, 90] and longitude in [-180, 180]."
        )

    user = User(
        email=req.email.lower(),
        hashed_password=get_password_hash(req.password),
        role="RECIPIENT"
    )
    db.add(user)
    db.flush()

    recipient = Recipient(
        id=user.id,
        org_name=req.org_name,
        org_type=req.org_type,
        contact_person=req.contact_person,
        phone=req.phone,
        address=req.address,
        city=req.city,
        state=req.state,
        country=req.country,
        postal_code=req.postal_code,
        latitude=req.latitude,
        longitude=req.longitude,
        verification_status="PENDING", # Accurately reflect review status
        daily_capacity_meals=req.daily_capacity_meals,
        storage_capabilities=req.storage_capabilities,
        accepted_categories=req.accepted_categories,
        operating_hours=req.operating_hours,
        is_test_account=req.is_test_account
    )
    db.add(recipient)
    db.commit()

    token = create_access_token({"sub": user.id, "role": user.role, "name": recipient.org_name})
    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        org_name=recipient.org_name
    )

@router.post("/login", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password credentials."
        )

    name = None
    if user.role == "SELLER" and user.business:
        name = user.business.business_name
    elif user.role == "RECIPIENT" and user.recipient:
        name = user.recipient.org_name

    token = create_access_token({"sub": user.id, "role": user.role, "name": name})
    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        business_name=name if user.role == "SELLER" else None,
        org_name=name if user.role == "RECIPIENT" else None
    )

@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(user: User = Depends(get_current_user)):
    biz_data = None
    rec_data = None
    if user.business:
        biz_data = {
            "id": user.business.id,
            "business_name": user.business.business_name,
            "category": user.business.category,
            "contact_person": user.business.contact_person,
            "phone": user.business.phone,
            "address": user.business.address,
            "city": user.business.city,
            "state": user.business.state,
            "postal_code": user.business.postal_code,
            "latitude": user.business.latitude,
            "longitude": user.business.longitude,
            "operating_hours": user.business.operating_hours,
            "food_categories": user.business.food_categories,
            "is_test_account": user.business.is_test_account
        }
    if user.recipient:
        rec_data = {
            "id": user.recipient.id,
            "org_name": user.recipient.org_name,
            "org_type": user.recipient.org_type,
            "contact_person": user.recipient.contact_person,
            "phone": user.recipient.phone,
            "address": user.recipient.address,
            "city": user.recipient.city,
            "state": user.recipient.state,
            "postal_code": user.recipient.postal_code,
            "latitude": user.recipient.latitude,
            "longitude": user.recipient.longitude,
            "verification_status": user.recipient.verification_status,
            "daily_capacity_meals": user.recipient.daily_capacity_meals,
            "storage_capabilities": user.recipient.storage_capabilities,
            "accepted_categories": user.recipient.accepted_categories,
            "operating_hours": user.recipient.operating_hours,
            "is_test_account": user.recipient.is_test_account
        }

    return UserProfileResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        business=biz_data,
        recipient=rec_data
    )
