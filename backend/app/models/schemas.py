from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import date, datetime

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: str
    business_name: Optional[str] = None
    org_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class SellerRegisterRequest(BaseModel):
    email: str
    password: str
    business_name: str
    category: str # Restaurant, Cafe, Bakery, Supermarket, Grocery, Hotel, Catering, Other
    contact_person: str
    phone: str
    address: str
    city: str
    state: str
    country: str = "India"
    postal_code: str
    latitude: float
    longitude: float
    operating_hours: str = "09:00 - 22:00"
    food_categories: str # Comma-separated
    is_test_account: bool = False

class RecipientRegisterRequest(BaseModel):
    email: str
    password: str
    org_name: str
    org_type: str # NGO, Community Kitchen, Food Bank, Shelter, Charitable Trust, Other
    contact_person: str
    phone: str
    address: str
    city: str
    state: str
    country: str = "India"
    postal_code: str
    latitude: float
    longitude: float
    daily_capacity_meals: int = 100
    storage_capabilities: str = "AMBIENT,CHILLED"
    accepted_categories: str
    operating_hours: str = "09:00 - 18:00"
    is_test_account: bool = False

class UserProfileResponse(BaseModel):
    id: str
    email: str
    role: str
    business: Optional[Dict[str, Any]] = None
    recipient: Optional[Dict[str, Any]] = None

# --- Product Schemas ---
class ProductCreate(BaseModel):
    name: str
    category: str
    unit: str # Portions, Meals, Kg, Grams, Litres, Boxes, Pieces
    unit_price: float = 0.0
    active: bool = True
    description: Optional[str] = None

class ProductResponse(ProductCreate):
    id: str
    business_id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Inventory Schemas ---
class InventoryBatchCreate(BaseModel):
    product_id: str
    batch_number: str
    quantity: float
    unit: str
    received_or_prep_time: datetime
    expiry_datetime: datetime
    storage_method: str = "AMBIENT" # AMBIENT, CHILLED, FROZEN
    storage_temp_c: Optional[float] = None
    food_condition: str = "GOOD"
    notes: Optional[str] = None

class InventoryBatchResponse(BaseModel):
    id: str
    business_id: str
    product_id: str
    product_name: Optional[str] = None
    batch_number: str
    quantity: float
    reserved_quantity: float
    unit: str
    received_or_prep_time: datetime
    expiry_datetime: datetime
    storage_method: str
    storage_temp_c: Optional[float]
    food_condition: str
    notes: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Cashier & Sales Schemas ---
class CashierSalesEntry(BaseModel):
    product_id: str
    business_date: date
    opening_stock: float
    stock_received: float = 0.0
    units_sold: float
    cancelled_units: float = 0.0
    refunded_units: float = 0.0
    recorded_waste: float = 0.0
    closing_stock: float # Physical count
    unit: str
    selling_price: float = 0.0
    promotion: bool = False
    notes: Optional[str] = None

class DailySaleResponse(CashierSalesEntry):
    id: str
    business_id: str
    product_name: Optional[str] = None
    expected_closing: float
    discrepancy: float
    source: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Excel Pipeline Schemas ---
class ExcelRowValidation(BaseModel):
    row_number: int
    sheet_name: str
    data: Dict[str, Any]
    is_valid: bool
    errors: List[str]
    warnings: List[str]

class ExcelPreviewResponse(BaseModel):
    filename: str
    total_rows: int
    valid_rows: int
    invalid_rows: int
    duplicate_rows: int
    rows: List[ExcelRowValidation]

class ExcelImportConfirmRequest(BaseModel):
    valid_rows: List[Dict[str, Any]]

# --- ML & Forecasting Schemas ---
class ForecastRequest(BaseModel):
    product_id: str
    forecast_date: date

class ForecastResponse(BaseModel):
    product_id: str
    product_name: str
    forecast_date: date
    predicted_demand: float
    model_version: str
    model_status: str
    method: str
    confidence_status: str
    evaluation_metrics: Dict[str, Any]

# --- Surplus & Safety Review Schemas ---
class SurplusPredictionResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    batch_id: str
    batch_number: str
    calculation_date: date
    available_quantity: float
    predicted_demand: float
    reserved_quantity: float
    potential_surplus: float
    unit: str
    storage_method: str
    expiry_datetime: datetime
    review_status: str
    review_reason: Optional[str]
    human_approved: bool

class SafetyReviewActionRequest(BaseModel):
    approved: bool
    reason: str
    reviewer_name: str

# --- Recipient Matching & Donation Schemas ---
class RecipientMatchCandidate(BaseModel):
    recipient_id: str
    org_name: str
    org_type: str
    address: str
    distance_km: float
    estimated_travel_minutes: float
    daily_capacity_meals: int
    storage_capabilities: str
    verification_status: str
    match_score: float
    match_explanation: str

class DonationOfferCreate(BaseModel):
    product_id: str
    batch_id: str
    title: str
    quantity: float
    unit: str
    notes: Optional[str] = None

class DonationOfferResponse(BaseModel):
    id: str
    offer_code: str
    business_id: str
    business_name: Optional[str] = None
    title: str
    product_id: str
    product_name: Optional[str] = None
    batch_id: str
    initial_quantity: float
    remaining_quantity: float
    unit: str
    food_category: str
    storage_method: str
    expiry_datetime: datetime
    pickup_address: str
    pickup_latitude: float
    pickup_longitude: float
    status: str
    notes: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AllocationAcceptRequest(BaseModel):
    requested_quantity: float
    scheduled_pickup_time: Optional[datetime] = None

class AllocationStatusUpdateRequest(BaseModel):
    status: str # ACCEPTED, REJECTED, SCHEDULED, COLLECTED, DELIVERED, CANCELLED
    notes: Optional[str] = None

class AllocationResponse(BaseModel):
    id: str
    allocation_code: str
    offer_id: str
    offer_title: Optional[str] = None
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    recipient_id: str
    recipient_name: Optional[str] = None
    recipient_address: Optional[str] = None
    allocated_quantity: float
    unit: str
    status: str
    scheduled_time: Optional[datetime]
    collected_at: Optional[datetime]
    delivered_at: Optional[datetime]
    delivery_confirmation_notes: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- GIS & Routing Schemas ---
class CoordinatePoint(BaseModel):
    latitude: float
    longitude: float
    label: str
    stop_type: str # PICKUP, DELIVERY

class RouteRequest(BaseModel):
    seller_id: Optional[str] = None
    recipient_ids: List[str]

class RouteCalculationResponse(BaseModel):
    route_code: str
    seller_id: str
    stops: List[Dict[str, Any]]
    geometry: Dict[str, Any] # GeoJSON Feature or coordinates
    total_distance_km: float
    total_duration_minutes: float
    status: str
    routing_provider: str
    calculated_at: datetime
    reroute_reason: Optional[str] = None

# --- Impact Schemas ---
class ImpactSummaryResponse(BaseModel):
    potential_surplus_identified_kg: float
    offers_created_count: int
    quantity_offered_meals: float
    quantity_accepted_meals: float
    quantity_delivered_meals: float
    actual_rescued_kg: float
    estimated_co2e_avoided_kg: float
    participating_sellers_count: int
    active_recipients_count: int
    completion_rate_percentage: float
    methodology_note: str

# --- POS Schemas ---
class PosStatusResponse(BaseModel):
    provider: str
    is_connected: bool
    status: str # NOT_CONFIGURED, CONNECTED, REQUIRES_CREDENTIALS, ERROR
    last_sync_at: Optional[datetime]
    message: str
