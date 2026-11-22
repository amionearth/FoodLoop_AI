def test_surplus_calculation_and_human_review_workflow(client):
    login_res = client.post("/api/auth/login", json={
        "email": "seller.test@foodloop.local",
        "password": "FoodloopTest123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch surplus predictions
    surplus_res = client.get("/api/surplus/predictions", headers=headers)
    assert surplus_res.status_code == 200, surplus_res.text
    preds = surplus_res.json()
    assert len(preds) > 0
    pred = preds[0]
    
    # Available: 70-100 (accounting for reserved quantities), Predicted Demand > 0
    assert pred["available_quantity"] > 0
    assert pred["predicted_demand"] > 0
    assert pred["potential_surplus"] >= 0
    assert pred["review_status"] in ("ELIGIBLE_FOR_REVIEW", "PENDING_REVIEW")

    # 2. Human food safety approval gate
    review_res = client.post(
        f"/api/surplus/{pred['batch_id']}/review",
        headers=headers,
        json={
            "approved": True,
            "reason": "Temperature verified at 4.0 C. Sensory inspection passed.",
            "reviewer_name": "Rohan Sharma"
        }
    )
    assert review_res.status_code == 200
    rev_data = review_res.json()
    assert rev_data["review_status"] == "APPROVED"

def test_intelligent_recipient_matching_rules(client):
    login_res = client.post("/api/auth/login", json={
        "email": "seller.test@foodloop.local",
        "password": "FoodloopTest123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch inventory batch to create offer
    batches = client.get("/api/inventory", headers=headers).json()
    batch = batches[0]
    
    # Create donation offer of 40 portions
    offer_payload = {
        "product_id": batch["product_id"],
        "batch_id": batch["id"],
        "title": "Evening Surplus Veg Meals",
        "quantity": 40.0,
        "unit": "Portions",
        "notes": "Chilled containers ready for courier pickup"
    }
    offer_res = client.post("/api/donations/offers", headers=headers, json=offer_payload)
    assert offer_res.status_code == 201, offer_res.text
    offer_data = offer_res.json()
    offer_id = offer_data["id"]

    # Request intelligent matching candidates
    matches_res = client.get(f"/api/donations/offers/{offer_id}/matches", headers=headers)
    assert matches_res.status_code == 200, matches_res.text
    matches = matches_res.json()
    assert len(matches) >= 2 # Both Community Kitchen A and Food Bank B are in radius & accept Prepared Meals

    top_match = matches[0]
    assert top_match["match_score"] > 70.0
    assert "Prepared Meals" in top_match["match_explanation"] or "distance" in top_match["match_explanation"].lower()
    assert top_match["daily_capacity_meals"] >= 40
