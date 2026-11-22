import io
import openpyxl

def test_excel_template_download_and_preview(client):
    login_res = client.post("/api/auth/login", json={
        "email": "seller.test@foodloop.local",
        "password": "FoodloopTest123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Download official template
    tmpl_res = client.get("/api/excel/template")
    assert tmpl_res.status_code == 200
    assert "openxmlformats-officedocument" in tmpl_res.headers["content-type"]

    # Verify workbook structure
    wb = openpyxl.load_workbook(io.BytesIO(tmpl_res.content))
    expected_sheets = {"Instructions", "Products", "Daily Sales", "Inventory", "Example"}
    assert expected_sheets.issubset(set(wb.sheetnames))

    # 2. Add test rows to Daily Sales sheet and upload for preview
    ws_sales = wb["Daily Sales"]
    ws_sales.append([
        "2026-11-21", "PROD-001", "Nutritious Veg Meal Platter",
        100, 20, 85, 2, 0, 3, 30, "Portions", 120.0, False, "Test imported row"
    ])
    
    upload_buf = io.BytesIO()
    wb.save(upload_buf)
    upload_buf.seek(0)

    preview_res = client.post(
        "/api/excel/preview",
        headers=headers,
        files={"file": ("test_workbook.xlsx", upload_buf.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    )
    assert preview_res.status_code == 200, preview_res.text
    preview_data = preview_res.json()
    assert preview_data["total_rows"] >= 1
    assert preview_data["valid_rows"] >= 1
    assert len(preview_data["rows"]) >= 1

    first_row = preview_data["rows"][0]
    assert first_row["is_valid"] is True
    assert first_row["data"]["product_name"] == "Nutritious Veg Meal Platter"
    assert first_row["data"]["units_sold"] == 85.0

    # 3. Confirm import to DB
    confirm_res = client.post(
        "/api/excel/confirm",
        headers=headers,
        json={"valid_rows": [first_row["data"]]}
    )
    assert confirm_res.status_code == 200
    confirm_data = confirm_res.json()
    assert confirm_data["success"] is True

    # Verify record in DB
    sales_res = client.get("/api/sales", headers=headers)
    assert sales_res.status_code == 200
    matches = [s for s in sales_res.json() if s["business_date"] == "2026-11-21"]
    assert len(matches) == 1
    assert matches[0]["source"] == "EXCEL_IMPORT"
