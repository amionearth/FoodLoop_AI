"""
Seed script for FOODLOOP AI Hackathon Test Scenario.
Populates clearly labelled test accounts with persistent records.
"""
from datetime import datetime, date, timedelta, timezone
from backend.app.core.database import SessionLocal, Base, engine
from backend.app.core.security import get_password_hash
from backend.app.models.entities import (
    User, Business, Recipient, Product, InventoryBatch, InventoryMovement,
    DailySale, SurplusPrediction, DonationOffer, DonationAllocation
)
from backend.app.services.surplus_engine import calculate_potential_surplus_for_batch

def seed_test_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clean tables cleanly
    db.query(DonationAllocation).delete()
    db.query(DonationOffer).delete()
    db.query(SurplusPrediction).delete()
    db.query(InventoryMovement).delete()
    db.query(InventoryBatch).delete()
    db.query(DailySale).delete()
    db.query(Product).delete()
    db.query(Business).delete()
    db.query(Recipient).delete()
    db.query(User).delete()
    db.commit()

    print("=== Seeding FOODLOOP AI Hackathon Test Scenario ===")

    # 1. Register Test Restaurant A (Seller) - Koramangala, Bengaluru
    seller_user = User(
        email="seller.test@foodloop.local",
        hashed_password=get_password_hash("FoodloopTest123!"),
        role="SELLER"
    )
    db.add(seller_user)
    db.flush()

    seller_biz = Business(
        id=seller_user.id,
        business_name="Green Harvest Kitchen (Test)",
        category="Restaurant",
        contact_person="Rohan Sharma",
        phone="+91 98765 43210",
        address="100 Feet Road, 4th Block, Koramangala",
        city="Bengaluru",
        state="Karnataka",
        country="India",
        postal_code="560034",
        latitude=12.9352,
        longitude=77.6245,
        operating_hours="10:00 - 23:00",
        food_categories="Prepared Meals, Bakery, Fresh Produce",
        is_test_account=True
    )
    db.add(seller_biz)

    # 2. Register Test Recipient A: Community Kitchen - Indiranagar, Bengaluru (~5 km)
    kit_user = User(
        email="kitchen.test@foodloop.local",
        hashed_password=get_password_hash("FoodloopTest123!"),
        role="RECIPIENT"
    )
    db.add(kit_user)
    db.flush()

    kitchen_rec = Recipient(
        id=kit_user.id,
        org_name="Aashray Community Kitchen (Test)",
        org_type="Community Kitchen",
        contact_person="Priya Nair",
        phone="+91 98111 22334",
        address="12th Main Road, HAL 2nd Stage, Indiranagar",
        city="Bengaluru",
        state="Karnataka",
        country="India",
        postal_code="560038",
        latitude=12.9719,
        longitude=77.6412,
        verification_status="VERIFIED",
        daily_capacity_meals=150,
        storage_capabilities="AMBIENT,CHILLED",
        accepted_categories="Prepared Meals, Bakery, Rice & Curry",
        operating_hours="08:00 - 20:00",
        is_test_account=True
    )
    db.add(kitchen_rec)

    # 3. Register Test Recipient B: Food Bank - HSR Layout, Bengaluru (~4 km)
    fb_user = User(
        email="foodbank.test@foodloop.local",
        hashed_password=get_password_hash("FoodloopTest123!"),
        role="RECIPIENT"
    )
    db.add(fb_user)
    db.flush()

    foodbank_rec = Recipient(
        id=fb_user.id,
        org_name="Annapoorna Food Bank (Test)",
        org_type="Food Bank",
        contact_person="Vikram Rao",
        phone="+91 98222 33445",
        address="Sector 2, 27th Main, HSR Layout",
        city="Bengaluru",
        state="Karnataka",
        country="India",
        postal_code="560102",
        latitude=12.9116,
        longitude=77.6389,
        verification_status="VERIFIED",
        daily_capacity_meals=250,
        storage_capabilities="AMBIENT,CHILLED,FROZEN",
        accepted_categories="Prepared Meals, Grains, Dairy, Produce",
        operating_hours="09:00 - 19:00",
        is_test_account=True
    )
    db.add(foodbank_rec)

    # 4. Create Product for Seller: "Nutritious Veg Meal Platter"
    product = Product(
        business_id=seller_biz.id,
        name="Nutritious Veg Meal Platter",
        category="Prepared Meals",
        unit="Portions",
        unit_price=120.0,
        active=True,
        description="Freshly cooked multi-grain thali with lentils, seasonal vegetables, and rice."
    )
    db.add(product)
    db.flush()

    # 5. Populate 28 days of historical daily sales for this product
    today = datetime.now(timezone.utc).date()
    for i in range(28, 0, -1):
        sale_date = today - timedelta(days=i)
        dow = sale_date.weekday()
        # Weekend dinner rush vs weekday lunch
        base_demand = 80 if dow in (4, 5, 6) else 65
        sold = base_demand + (i % 7) * 2
        waste = 3 if i % 4 == 0 else 1
        closing = 20 + (i % 5)
        expected = closing

        sale = DailySale(
            business_id=seller_biz.id,
            product_id=product.id,
            business_date=sale_date,
            opening_stock=100.0,
            stock_received=sold + waste + closing - 100.0 if sold + waste + closing > 100 else 10.0,
            units_sold=float(sold),
            cancelled_units=1.0 if i % 5 == 0 else 0.0,
            refunded_units=0.0,
            recorded_waste=float(waste),
            closing_stock=float(closing),
            expected_closing=float(expected),
            discrepancy=0.0,
            unit="Portions",
            selling_price=120.0,
            source="MANUAL_CASHIER"
        )
        db.add(sale)

    # 6. Create Active Inventory Batch of 100 portions
    now = datetime.now(timezone.utc)
    batch = InventoryBatch(
        business_id=seller_biz.id,
        product_id=product.id,
        batch_number="BATCH-20261119-01",
        quantity=100.0,
        reserved_quantity=0.0,
        unit="Portions",
        received_or_prep_time=now - timedelta(hours=2),
        expiry_datetime=now + timedelta(hours=14),
        storage_method="CHILLED",
        storage_temp_c=4.0,
        food_condition="EXCELLENT",
        notes="Dinner prep batch held in compliant commercial chiller at 4 deg C."
    )
    db.add(batch)
    db.flush()

    # 7. Add stock-in ledger movement
    movement = InventoryMovement(
        batch_id=batch.id,
        movement_type="STOCK_IN",
        quantity=100.0,
        reason="Kitchen prep check-in for evening dinner service.",
        created_at=now - timedelta(hours=2)
    )
    db.add(movement)

    db.commit()
    print("Seed complete!")
    print(f"Seller: {seller_biz.business_name} (email: seller.test@foodloop.local)")
    print(f"Recipient 1: {kitchen_rec.org_name} (email: kitchen.test@foodloop.local)")
    print(f"Recipient 2: {foodbank_rec.org_name} (email: foodbank.test@foodloop.local)")
    print("Password for all test accounts: FoodloopTest123!")

if __name__ == "__main__":
    seed_test_data()
