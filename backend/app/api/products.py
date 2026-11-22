from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.app.core.database import get_db
from backend.app.core.security import require_seller
from backend.app.models.entities import Product, User
from backend.app.models.schemas import ProductCreate, ProductResponse

router = APIRouter(prefix="/products", tags=["Product Management"])

VALID_UNITS = {"Portions", "Meals", "Kg", "Grams", "Litres", "Boxes", "Packs", "Pieces"}

@router.get("", response_model=List[ProductResponse])
def list_products(
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    return db.query(Product).filter(Product.business_id == user.id).all()

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    req: ProductCreate,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    # Validate unit of measurement
    if req.unit not in VALID_UNITS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid unit '{req.unit}'. Permitted units: {', '.join(sorted(VALID_UNITS))}"
        )

    product = Product(
        business_id=user.id,
        name=req.name.strip(),
        category=req.category.strip(),
        unit=req.unit,
        unit_price=max(0.0, req.unit_price),
        active=req.active,
        description=req.description
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    req: ProductCreate,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.business_id == user.id
    ).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found or access denied.")

    if req.unit not in VALID_UNITS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid unit '{req.unit}'.")

    product.name = req.name.strip()
    product.category = req.category.strip()
    product.unit = req.unit
    product.unit_price = max(0.0, req.unit_price)
    product.active = req.active
    product.description = req.description

    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}")
def delete_product(
    product_id: str,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.business_id == user.id
    ).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found or access denied.")

    product.active = False
    db.commit()
    return {"message": "Product deactivated successfully."}
