def test_ml_model_status_and_forecast_prediction(client):
    login_res = client.post("/api/auth/login", json={
        "email": "seller.test@foodloop.local",
        "password": "FoodloopTest123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Model status check
    status_res = client.get("/api/ml/model-status")
    assert status_res.status_code == 200
    st = status_res.json()
    assert st["status"] == "READY"
    assert "version" in st
    assert "HistGradientBoosting" in st["algorithm"] or "RandomForest" in st["algorithm"]
    assert "metrics" in st
    assert st["metrics"]["wape"] < 0.20 # Out of sample test WAPE verified

    # 2. Metrics endpoint
    metrics_res = client.get("/api/ml/metrics")
    assert metrics_res.status_code == 200
    met = metrics_res.json()
    assert "baseline_comparison" in met
    assert "mae" in met["metrics"]
    assert "rmse" in met["metrics"]
    assert "wape" in met["metrics"]

    # 3. Generate forecast for seeded product (28 days of seller history)
    prods = client.get("/api/products", headers=headers).json()
    product_id = prods[0]["id"]

    pred_res = client.post(
        "/api/ml/predict",
        headers=headers,
        json={"product_id": product_id, "forecast_date": "2026-11-22"}
    )
    assert pred_res.status_code == 200, pred_res.text
    pred_data = pred_res.json()
    assert pred_data["predicted_demand"] > 0
    assert pred_data["method"] in ("BENCHMARK_ML_ADAPTED", "SELLER_SPECIFIC_ML", "STATISTICAL_BASELINE_MA7")
    assert pred_data["model_status"] == "trained"
