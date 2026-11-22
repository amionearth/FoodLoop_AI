"""
Excel Template Generator for FOODLOOP AI.
Generates an official multi-sheet workbook with Instructions, Products, Daily Sales, Inventory, and Example sheets.
"""
import io
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def generate_foodloop_template() -> io.BytesIO:
    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)

    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1B4332", end_color="1B4332", fill_type="solid") # Forest Green
    title_font = Font(name="Calibri", size=14, bold=True, color="1B4332")
    thin_border = Border(
        left=Side(style="thin", color="CCCCCC"),
        right=Side(style="thin", color="CCCCCC"),
        top=Side(style="thin", color="CCCCCC"),
        bottom=Side(style="thin", color="CCCCCC"),
    )

    # ----------------------------------------------------
    # Sheet 1: Instructions
    # ----------------------------------------------------
    ws_inst = wb.create_sheet(title="Instructions")
    ws_inst.views.sheetView[0].showGridLines = True
    
    ws_inst["A1"] = "FOODLOOP AI — Official Sales & Inventory Import Template"
    ws_inst["A1"].font = title_font
    ws_inst["A2"] = "Version 1.0 | Predict. Rescue. Redistribute. Prevent."
    ws_inst["A2"].font = Font(name="Calibri", size=11, italic=True)

    instructions = [
        ("Overview", "This workbook allows food business operators to bulk-import products, historical daily sales, and current inventory batches into FOODLOOP AI."),
        ("Sheet: Products", "Define your menu/catalogue items. Units must be consistent (e.g., Portions, Meals, Kg, Litres)."),
        ("Sheet: Daily Sales", "Record daily opening stock, received stock, sales, waste, and physically counted closing stock. Sales numbers feed the AI Demand Forecasting engine."),
        ("Sheet: Inventory", "List active physical batches available on site with prep dates, expiry dates, and storage temperatures."),
        ("Sheet: Example", "Reference test data illustrating standard formatting. You may safely delete or ignore it."),
        ("Safety Rule", "Do not modify column headers in row 1 of any sheet. Dates must be formatted as YYYY-MM-DD."),
        ("Reconciliation", "FOODLOOP calculates: Expected Closing = Opening + Received - (Sold - Cancelled - Refunded) - Waste. Discrepancies are flagged for audit."),
    ]

    for idx, (section, text) in enumerate(instructions, start=4):
        ws_inst.cell(row=idx, column=1, value=section).font = Font(bold=True, color="1B4332")
        ws_inst.cell(row=idx, column=2, value=text)
    
    ws_inst.column_dimensions["A"].width = 25
    ws_inst.column_dimensions["B"].width = 90

    # ----------------------------------------------------
    # Sheet 2: Products
    # ----------------------------------------------------
    ws_prod = wb.create_sheet(title="Products")
    ws_prod.views.sheetView[0].showGridLines = True
    prod_headers = ["product_id", "product_name", "category", "unit", "unit_price", "active", "description"]
    for col_num, h in enumerate(prod_headers, 1):
        c = ws_prod.cell(row=1, column=col_num, value=h)
        c.font = header_font
        c.fill = header_fill
        c.alignment = Alignment(horizontal="center")
    
    # ----------------------------------------------------
    # Sheet 3: Daily Sales
    # ----------------------------------------------------
    ws_sales = wb.create_sheet(title="Daily Sales")
    ws_sales.views.sheetView[0].showGridLines = True
    sales_headers = [
        "business_date", "product_id", "product_name", "opening_stock", "stock_received",
        "units_sold", "cancelled_units", "refunded_units", "recorded_waste",
        "closing_stock", "unit", "selling_price", "promotion", "notes"
    ]
    for col_num, h in enumerate(sales_headers, 1):
        c = ws_sales.cell(row=1, column=col_num, value=h)
        c.font = header_font
        c.fill = header_fill
        c.alignment = Alignment(horizontal="center")

    # ----------------------------------------------------
    # Sheet 4: Inventory
    # ----------------------------------------------------
    ws_inv = wb.create_sheet(title="Inventory")
    ws_inv.views.sheetView[0].showGridLines = True
    inv_headers = [
        "product_id", "product_name", "batch_number", "available_quantity", "unit",
        "preparation_datetime", "expiry_datetime", "storage_method", "storage_temperature_c", "condition", "notes"
    ]
    for col_num, h in enumerate(inv_headers, 1):
        c = ws_inv.cell(row=1, column=col_num, value=h)
        c.font = header_font
        c.fill = header_fill
        c.alignment = Alignment(horizontal="center")

    # ----------------------------------------------------
    # Sheet 5: Example
    # ----------------------------------------------------
    ws_ex = wb.create_sheet(title="Example")
    ws_ex.views.sheetView[0].showGridLines = True
    ex_headers = ["business_date", "product_name", "opening_stock", "stock_received", "units_sold", "recorded_waste", "closing_stock", "unit"]
    for col_num, h in enumerate(ex_headers, 1):
        c = ws_ex.cell(row=1, column=col_num, value=h)
        c.font = header_font
        c.fill = PatternFill(start_color="2D6A4F", end_color="2D6A4F", fill_type="solid")
    
    example_rows = [
        ("2026-11-15", "Vegetable Biryani", 100, 20, 85, 2, 33, "Portions"),
        ("2026-11-16", "Vegetable Biryani", 33, 80, 90, 1, 22, "Portions"),
        ("2026-11-17", "Vegetable Biryani", 22, 90, 95, 3, 14, "Portions"),
        ("2026-11-18", "Vegetable Biryani", 14, 100, 88, 4, 22, "Portions"),
        ("2026-11-19", "Vegetable Biryani", 22, 95, 92, 2, 23, "Portions"),
    ]
    for r_idx, r_data in enumerate(example_rows, start=2):
        for c_idx, val in enumerate(r_data, start=1):
            ws_ex.cell(row=r_idx, column=c_idx, value=val).border = thin_border

    # Adjust column widths across sheets
    for ws in [ws_prod, ws_sales, ws_inv, ws_ex]:
        for col in ws.columns:
            max_len = max(len(str(cell.value or "")) for cell in col)
            col_letter = get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 4, 14)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output
