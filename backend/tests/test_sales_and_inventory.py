from datetime import datetime, date, timedelta, timezone

def test_manual_cashier_reconciliation_and_persistence(client):
    # Login as seeded test seller
    login_res = client.post("/api/auth/login", json={
        "email": "seller.test@foodloop.local",
        "password": "FoodloopTest123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch existing products
    prods_res = client.get("/api/products", headers=headers)
    assert prods_res.status_code == 200
    prods = prods_res.json()
    assert len(prods) > 0
    product_id = prods[0]["id"]

    # Reconcile day:
    # Opening: 100, Received: 10, Sold: 70, Cancelled: 2, Refunded: 0, Waste: 5, Closing: 33
    # Expected Closing: 100 + 10 - (70 - 2) - 5 = 37
    # Discrepancy: 33 - 37 = -4
    payload = {
        "product_id": product_id,
        "business_date": "2026-11-20",
        "opening_stock": 100.0,
        "stock_received": 10.0,
        "units_sold": 70.0,
        "cancelled_units": 2.0,
        "refunded_units": 0.0,
        "recorded_waste": 5.0,
        "closing_stock": 33.0,
        "unit": "Portions",
        "selling_price": 120.0,
        "notes": "Test cashier entry with stock discrepancy"
    }

    res = client.post("/api/sales/cashier", headers=headers, json=payload)
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["expected_closing"] == 37.0
    assert data["discrepancy"] == -4.0
    assert data["source"] == "MANUAL_CASHIER"

    # Reload from sales list
    list_res = client.get("/api/sales", headers=headers)
    assert list_res.status_code == 200
    records = list_res.json()
    match = [r for r in records if r["business_date"] == "2026-11-20" and r["product_id"] == product_id]
    assert len(match) == 1
    assert match[0]["closing_stock"] == 33.0
    assert match[0]["discrepancy"] == -4.0

def test_inventory_batch_creation_and_movement_ledger(client):
    login_res = client.post("/api/auth/login", json={
        "email": "seller.test@foodloop.local",
        "password": "FoodloopTest123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    prods = client.get("/api/products", headers=headers).json()
    product_id = prods[0]["id"]

    now = datetime.now(timezone.utc)
    batch_payload = {
        "product_id": product_id,
        "batch_number": "BATCH-LEDGER-TEST",
        "quantity": 50.0,
        "unit": "Portions",
        "received_or_prep_time": (now - timedelta(hours=1)).isoformat(),
        "expiry_datetime": (now + timedelta(hours=8)).isoformat(),
        "storage_method": "CHILLED",
        "storage_temp_c": 3.8,
        "food_condition": "EXCELLENT",
        "notes": "Ledger movement audit check"
    }

    res = client.post("/api/inventory", headers=headers, json=batch_payload)
    assert res.status_code == 201, res.text
    batch_data = res.json()
    batch_id = batch_data["id"]

    # Verify inventory movement ledger recorded the initial check-in
    movements_res = client.get(f"/api/inventory/{batch_id}/movements", headers=headers)
    assert movements_res.status_code == 200
    movements = movements_res.json()
    assert len(movements) == 1
    assert movements[0]["movement_type"] == "STOCK_IN"
    assert movements[0]["quantity"] == 50.0
