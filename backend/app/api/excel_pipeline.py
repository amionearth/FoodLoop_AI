import io
from datetime import datetime, date
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import openpyxl
from backend.app.core.database import get_db
from backend.app.core.security import require_seller
from backend.app.models.entities import DailySale, Product, InventoryBatch, InventoryMovement, User
from backend.app.services.excel_generator import generate_foodloop_template
from backend.app.models.schemas import ExcelPreviewResponse, ExcelRowValidation, ExcelImportConfirmRequest

router = APIRouter(prefix="/excel", tags=["Excel Pipeline"])

@router.get("/template")
def download_template():
    buffer = generate_foodloop_template()
    filename = "FOODLOOP_Sales_and_Inventory_Template.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/preview", response_model=ExcelPreviewResponse)
async def preview_excel(
    file: UploadFile = File(...),
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only Excel (.xlsx / .xls) files are supported.")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum allowed 10MB limit.")

    try:
        wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse Excel workbook: {str(e)}")

    valid_rows: List[ExcelRowValidation] = []
    total_count = 0
    valid_count = 0
    invalid_count = 0
    duplicate_count = 0

    # User's existing products map: name.lower() -> Product
    products = db.query(Product).filter(Product.business_id == user.id).all()
    prod_map = {p.name.strip().lower(): p for p in products}

    # User's existing dates for duplicate check
    existing_sales = db.query(DailySale).filter(DailySale.business_id == user.id).all()
    existing_keys = {(s.product_id, str(s.business_date)) for s in existing_sales}

    # Parse 'Daily Sales' sheet if present, or first sheet
    target_sheet = None
    for s_name in ["Daily Sales", "daily sales", "Sales", "Sheet1"]:
        if s_name in wb.sheetnames:
            target_sheet = wb[s_name]
            break
    if not target_sheet:
        target_sheet = wb.active

    # Read rows
    rows_iter = target_sheet.iter_rows(values_only=True)
    header_row = next(rows_iter, None)
    if not header_row:
        raise HTTPException(status_code=400, detail="Workbook is empty.")

    headers = [str(h).strip().lower() if h else f"col_{idx}" for idx, h in enumerate(header_row)]

    for row_idx, r_values in enumerate(rows_iter, start=2):
        if not any(r_values):
            continue # Skip empty row
        total_count += 1
        
        row_dict = {}
        for col_name, val in zip(headers, r_values):
            row_dict[col_name] = val

        errors = []
        warnings = []

        # Validate business_date
        b_date_raw = row_dict.get("business_date")
        b_date_obj = None
        if not b_date_raw:
            errors.append("Missing required 'business_date'.")
        elif isinstance(b_date_raw, (datetime, date)):
            b_date_obj = b_date_raw.date() if isinstance(b_date_raw, datetime) else b_date_raw
        else:
            try:
                b_date_obj = datetime.strptime(str(b_date_raw).strip()[:10], "%Y-%m-%d").date()
            except Exception:
                errors.append(f"Invalid date format '{b_date_raw}'. Expected YYYY-MM-DD.")

        # Validate product
        p_name = str(row_dict.get("product_name") or "").strip()
        matched_product = prod_map.get(p_name.lower())
        if not p_name:
            errors.append("Missing 'product_name'.")
        elif not matched_product:
            warnings.append(f"Product '{p_name}' not yet in catalogue. Will be created automatically on import.")

        # Validate numbers
        def parse_float(val, name, default=0.0):
            try:
                return float(val) if val is not None else default
            except (ValueError, TypeError):
                errors.append(f"Invalid numeric value for '{name}': {val}")
                return default

        opening = parse_float(row_dict.get("opening_stock"), "opening_stock")
        received = parse_float(row_dict.get("stock_received"), "stock_received")
        sold = parse_float(row_dict.get("units_sold"), "units_sold")
        cancelled = parse_float(row_dict.get("cancelled_units"), "cancelled_units")
        refunded = parse_float(row_dict.get("refunded_units"), "refunded_units")
        waste = parse_float(row_dict.get("recorded_waste"), "recorded_waste")
        closing = parse_float(row_dict.get("closing_stock"), "closing_stock")
        price = parse_float(row_dict.get("selling_price"), "selling_price")

        # Duplicate check
        if matched_product and b_date_obj:
            if (matched_product.id, str(b_date_obj)) in existing_keys:
                duplicate_count += 1
                warnings.append(f"Record for {p_name} on {b_date_obj} already exists in database. Importing will update it.")

        is_valid = len(errors) == 0
        if is_valid:
            valid_count += 1
        else:
            invalid_count += 1

        clean_data = {
            "business_date": str(b_date_obj) if b_date_obj else str(b_date_raw),
            "product_name": p_name,
            "opening_stock": opening,
            "stock_received": received,
            "units_sold": sold,
            "cancelled_units": cancelled,
            "refunded_units": refunded,
            "recorded_waste": waste,
            "closing_stock": closing,
            "unit": str(row_dict.get("unit") or "Portions").strip(),
            "selling_price": price,
            "notes": str(row_dict.get("notes") or "")
        }

        valid_rows.append(ExcelRowValidation(
            row_number=row_idx,
            sheet_name=target_sheet.title,
            data=clean_data,
            is_valid=is_valid,
            errors=errors,
            warnings=warnings
        ))

    return ExcelPreviewResponse(
        filename=file.filename,
        total_rows=total_count,
        valid_rows=valid_count,
        invalid_rows=invalid_count,
        duplicate_rows=duplicate_count,
        rows=valid_rows
    )

@router.post("/confirm")
def confirm_import(
    req: ExcelImportConfirmRequest,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    if not req.valid_rows:
        raise HTTPException(status_code=400, detail="No valid rows provided for import.")

    imported_count = 0
    updated_count = 0

    for row_data in req.valid_rows:
        p_name = row_data.get("product_name", "").strip()
        if not p_name:
            continue

        # Find or create product
        product = db.query(Product).filter(
            Product.business_id == user.id,
            Product.name == p_name
        ).first()

        if not product:
            product = Product(
                business_id=user.id,
                name=p_name,
                category="General Menu",
                unit=row_data.get("unit", "Portions"),
                unit_price=float(row_data.get("selling_price", 0.0)),
                active=True
            )
            db.add(product)
            db.flush()

        b_date = datetime.strptime(row_data["business_date"][:10], "%Y-%m-%d").date()
        opening = float(row_data.get("opening_stock", 0.0))
        received = float(row_data.get("stock_received", 0.0))
        sold = float(row_data.get("units_sold", 0.0))
        cancelled = float(row_data.get("cancelled_units", 0.0))
        refunded = float(row_data.get("refunded_units", 0.0))
        waste = float(row_data.get("recorded_waste", 0.0))
        closing = float(row_data.get("closing_stock", 0.0))
        
        net_sales = max(0.0, sold - cancelled - refunded)
        expected_closing = round(opening + received - net_sales - waste, 2)
        discrepancy = round(closing - expected_closing, 2)

        existing = db.query(DailySale).filter(
            DailySale.business_id == user.id,
            DailySale.product_id == product.id,
            DailySale.business_date == b_date
        ).first()

        if existing:
            existing.opening_stock = opening
            existing.stock_received = received
            existing.units_sold = sold
            existing.cancelled_units = cancelled
            existing.refunded_units = refunded
            existing.recorded_waste = waste
            existing.closing_stock = closing
            existing.expected_closing = expected_closing
            existing.discrepancy = discrepancy
            existing.unit = row_data.get("unit", product.unit)
            existing.selling_price = float(row_data.get("selling_price", product.unit_price))
            existing.source = "EXCEL_IMPORT"
            updated_count += 1
        else:
            new_sale = DailySale(
                business_id=user.id,
                product_id=product.id,
                business_date=b_date,
                opening_stock=opening,
                stock_received=received,
                units_sold=sold,
                cancelled_units=cancelled,
                refunded_units=refunded,
                recorded_waste=waste,
                closing_stock=closing,
                expected_closing=expected_closing,
                discrepancy=discrepancy,
                unit=row_data.get("unit", product.unit),
                selling_price=float(row_data.get("selling_price", product.unit_price)),
                source="EXCEL_IMPORT"
            )
            db.add(new_sale)
            imported_count += 1

    db.commit()
    return {
        "success": True,
        "message": f"Successfully processed {imported_count + updated_count} rows ({imported_count} new, {updated_count} updated).",
        "imported_rows": imported_count,
        "updated_rows": updated_count
    }
