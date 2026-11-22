def test_end_to_end_donation_lifecycle_and_rerouting(client):
    # 1. Login Seller and create offer
    seller_login = client.post("/api/auth/login", json={
        "email": "seller.test@foodloop.local",
        "password": "FoodloopTest123!"
    })
    seller_token = seller_login.json()["access_token"]
    seller_headers = {"Authorization": f"Bearer {seller_token}"}

    batches = client.get("/api/inventory", headers=seller_headers).json()
    batch = batches[0]
    
    offer_res = client.post("/api/donations/offers", headers=seller_headers, json={
        "product_id": batch["product_id"],
        "batch_id": batch["id"],
        "title": "Hackathon Demonstration Offer",
        "quantity": 30.0,
        "unit": "Portions"
    })
    assert offer_res.status_code == 201
    offer = offer_res.json()
    offer_id = offer["id"]

    # 2. Login Recipient (Community Kitchen) separately
    kit_login = client.post("/api/auth/login", json={
        "email": "kitchen.test@foodloop.local",
        "password": "FoodloopTest123!"
    })
    kit_token = kit_login.json()["access_token"]
    kit_headers = {"Authorization": f"Bearer {kit_token}"}

    # Recipient views open offers
    offers_res = client.get("/api/donations/offers", headers=kit_headers)
    assert offers_res.status_code == 200
    assert any(o["id"] == offer_id for o in offers_res.json())

    # Recipient accepts 20 portions
    accept_res = client.post(
        f"/api/donations/offers/{offer_id}/accept",
        headers=kit_headers,
        json={"requested_quantity": 20.0}
    )
    assert accept_res.status_code == 200, accept_res.text
    alloc = accept_res.json()
    alloc_id = alloc["id"]
    assert alloc["allocated_quantity"] == 20.0
    assert alloc["status"] == "ACCEPTED"

    # Verify offer remaining quantity was reduced from 30 to 10
    seller_offers = client.get("/api/donations/offers", headers=seller_headers).json()
    updated_offer = next(o for o in seller_offers if o["id"] == offer_id)
    assert updated_offer["remaining_quantity"] == 10.0
    assert updated_offer["status"] == "PARTIALLY_ALLOCATED"

    # 3. Calculate delivery route for accepted allocation
    route_res = client.post(
        "/api/routing/calculate",
        headers=seller_headers,
        json={"recipient_ids": [alloc["recipient_id"]]}
    )
    assert route_res.status_code == 200, route_res.text
    route_data = route_res.json()
    assert route_data["total_distance_km"] > 0.0
    assert route_data["total_duration_minutes"] > 0.0
    assert "geometry" in route_data
    assert len(route_data["stops"]) == 2 # Seller pickup + Recipient delivery

    # 4. Confirm collection and delivery
    status_update_res = client.put(
        f"/api/donations/allocations/{alloc_id}/status",
        headers=seller_headers,
        json={"status": "DELIVERED", "notes": "Handed over directly to kitchen supervisor."}
    )
    assert status_update_res.status_code == 200
    assert status_update_res.json()["new_status"] == "DELIVERED"

    # 5. Verify Impact dashboard aggregated confirmed delivery
    impact_res = client.get("/api/impact/summary")
    assert impact_res.status_code == 200
    impact = impact_res.json()
    assert impact["quantity_delivered_meals"] >= 20.0
    assert impact["actual_rescued_kg"] >= 9.0 # 20 portions * 0.45 kg
    assert impact["estimated_co2e_avoided_kg"] >= 22.5 # 9 kg * 2.5
