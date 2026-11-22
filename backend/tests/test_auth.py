import uuid

def test_seller_register_and_login(client):
    unique_email = f"seller_{uuid.uuid4().hex[:6]}@foodloop.org"
    payload = {
        "email": unique_email,
        "password": "SecurePassword123!",
        "business_name": "Artisan Bakery",
        "category": "Bakery",
        "contact_person": "Anita Roy",
        "phone": "+91 9123456789",
        "address": "12 Commercial Street",
        "city": "Bengaluru",
        "state": "Karnataka",
        "country": "India",
        "postal_code": "560001",
        "latitude": 12.9815,
        "longitude": 77.6080,
        "operating_hours": "07:00 - 21:00",
        "food_categories": "Bakery, Desserts"
    }
    
    # 1. Register seller
    res = client.post("/api/auth/seller/register", json=payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "SELLER"
    assert data["business_name"] == "Artisan Bakery"

    # 2. Login
    login_res = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "SecurePassword123!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # 3. Fetch profile
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me = me_res.json()
    assert me["email"] == unique_email
    assert me["role"] == "SELLER"
    assert me["business"]["business_name"] == "Artisan Bakery"
    assert me["business"]["latitude"] == 12.9815

def test_recipient_register_and_isolation(client):
    unique_email = f"ngo_{uuid.uuid4().hex[:6]}@foodloop.org"
    payload = {
        "email": unique_email,
        "password": "SecurePassword123!",
        "org_name": "Hope Shelter",
        "org_type": "Shelter",
        "contact_person": "Mark D'Souza",
        "phone": "+91 9988776655",
        "address": "45 Brigade Road",
        "city": "Bengaluru",
        "state": "Karnataka",
        "country": "India",
        "postal_code": "560025",
        "latitude": 12.9716,
        "longitude": 77.6090,
        "daily_capacity_meals": 120,
        "storage_capabilities": "AMBIENT,CHILLED",
        "accepted_categories": "Prepared Meals, Bakery",
        "operating_hours": "08:00 - 18:00"
    }

    res = client.post("/api/auth/recipient/register", json=payload)
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]

    # Role isolation: Recipient should NOT be allowed to access seller products creation
    seller_endpoint_res = client.post(
        "/api/products",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Forbidden Item", "category": "Meals", "unit": "Portions"}
    )
    assert seller_endpoint_res.status_code == 403
    assert "Seller permissions required" in seller_endpoint_res.text
