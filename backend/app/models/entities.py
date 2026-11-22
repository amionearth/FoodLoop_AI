import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, Date, Text, ForeignKey, Enum
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False) # SELLER, RECIPIENT, ADMIN
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    business = relationship("Business", back_populates="user", uselist=False, cascade="all, delete-orphan")
    recipient = relationship("Recipient", back_populates="user", uselist=False, cascade="all, delete-orphan")

class Business(Base):
    __tablename__ = "businesses"
    
    id = Column(String(36), ForeignKey("users.id"), primary_key=True)
    business_name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False) # Restaurant, Cafe, Bakery, Supermarket, Grocery, Hotel, Catering, Other
    contact_person = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    country = Column(String(100), default="India")
    postal_code = Column(String(20), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    operating_hours = Column(String(255), default="09:00 - 22:00")
    food_categories = Column(Text, nullable=False) # Comma-separated
    is_test_account = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="business")
    products = relationship("Product", back_populates="business", cascade="all, delete-orphan")
    inventory_batches = relationship("InventoryBatch", back_populates="business", cascade="all, delete-orphan")
    daily_sales = relationship("DailySale", back_populates="business", cascade="all, delete-orphan")
    donation_offers = relationship("DonationOffer", back_populates="business", cascade="all, delete-orphan")
    pos_integration = relationship("PosIntegration", back_populates="business", uselist=False)

class Recipient(Base):
    __tablename__ = "recipients"
    
    id = Column(String(36), ForeignKey("users.id"), primary_key=True)
    org_name = Column(String(255), nullable=False)
    org_type = Column(String(50), nullable=False) # NGO, Community Kitchen, Food Bank, Shelter, Charitable Trust, Other
    contact_person = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    country = Column(String(100), default="India")
    postal_code = Column(String(20), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    verification_status = Column(String(30), default="PENDING") # PENDING, UNDER_REVIEW, VERIFIED, REJECTED, SUSPENDED
    daily_capacity_meals = Column(Integer, default=100)
    storage_capabilities = Column(String(255), default="AMBIENT,CHILLED") # Comma-separated: AMBIENT, CHILLED, FROZEN
    accepted_categories = Column(Text, nullable=False) # Comma-separated
    operating_hours = Column(String(255), default="09:00 - 18:00")
    is_test_account = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="recipient")
    allocations = relationship("DonationAllocation", back_populates="recipient")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    unit = Column(String(20), nullable=False) # Portions, Meals, Kg, Grams, Litres, Boxes, Packs, Pieces
    unit_price = Column(Float, default=0.0)
    active = Column(Boolean, default=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    business = relationship("Business", back_populates="products")
    batches = relationship("InventoryBatch", back_populates="product", cascade="all, delete-orphan")
    sales = relationship("DailySale", back_populates="product", cascade="all, delete-orphan")

class InventoryBatch(Base):
    __tablename__ = "inventory_batches"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False, index=True)
    batch_number = Column(String(100), nullable=False)
    quantity = Column(Float, nullable=False) # Available quantity
    reserved_quantity = Column(Float, default=0.0) # Quantity locked in pending offers/allocations
    unit = Column(String(20), nullable=False)
    received_or_prep_time = Column(DateTime, nullable=False)
    expiry_datetime = Column(DateTime, nullable=False)
    storage_method = Column(String(50), default="AMBIENT") # AMBIENT, CHILLED, FROZEN
    storage_temp_c = Column(Float, nullable=True)
    food_condition = Column(String(50), default="GOOD") # EXCELLENT, GOOD, ACCEPTABLE, SPOILED
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    business = relationship("Business", back_populates="inventory_batches")
    product = relationship("Product", back_populates="batches")
    movements = relationship("InventoryMovement", back_populates="batch", cascade="all, delete-orphan")

class InventoryMovement(Base):
    __tablename__ = "inventory_movements"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    batch_id = Column(String(36), ForeignKey("inventory_batches.id"), nullable=False, index=True)
    movement_type = Column(String(50), nullable=False) # STOCK_IN, USAGE, SALES, WASTE, DONATION_RESERVED, DONATION_RELEASED, AUDIT_ADJUSTMENT
    quantity = Column(Float, nullable=False) # Positive or negative
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    batch = relationship("InventoryBatch", back_populates="movements")

class DailySale(Base):
    __tablename__ = "daily_sales"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False, index=True)
    business_date = Column(Date, nullable=False, index=True)
    opening_stock = Column(Float, default=0.0)
    stock_received = Column(Float, default=0.0)
    units_sold = Column(Float, default=0.0)
    cancelled_units = Column(Float, default=0.0)
    refunded_units = Column(Float, default=0.0)
    recorded_waste = Column(Float, default=0.0)
    closing_stock = Column(Float, default=0.0) # Physically counted
    expected_closing = Column(Float, default=0.0) # Calculated
    discrepancy = Column(Float, default=0.0) # closing_stock - expected_closing
    unit = Column(String(20), nullable=False)
    selling_price = Column(Float, default=0.0)
    promotion = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    source = Column(String(50), default="MANUAL_CASHIER") # MANUAL_CASHIER, EXCEL_IMPORT, POS_SYNC
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    business = relationship("Business", back_populates="daily_sales")
    product = relationship("Product", back_populates="sales")

class MLModelRegistry(Base):
    __tablename__ = "ml_models"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    model_name = Column(String(100), nullable=False)
    version = Column(String(50), nullable=False)
    algorithm = Column(String(100), nullable=False)
    trained_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    dataset_source = Column(String(255), nullable=False)
    metrics_json = Column(Text, nullable=False) # JSON string of MAE, RMSE, WAPE, Bias
    features_json = Column(Text, nullable=False)
    artifact_path = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)

class Forecast(Base):
    __tablename__ = "forecasts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False, index=True)
    forecast_date = Column(Date, nullable=False)
    predicted_demand = Column(Float, nullable=False)
    method = Column(String(100), nullable=False) # SELLER_SPECIFIC_ML, BENCHMARK_ML, STATISTICAL_BASELINE_MA7, NAIVE_PREVIOUS
    model_version = Column(String(50), nullable=False)
    confidence_status = Column(String(50), nullable=False) # HIGH_CONFIDENCE, MODERATE_CONFIDENCE, LIMITED_HISTORY
    metrics_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class SurplusPrediction(Base):
    __tablename__ = "surplus_predictions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False, index=True)
    batch_id = Column(String(36), ForeignKey("inventory_batches.id"), nullable=False)
    calculation_date = Column(Date, nullable=False)
    available_quantity = Column(Float, nullable=False)
    predicted_demand = Column(Float, nullable=False)
    reserved_quantity = Column(Float, default=0.0)
    potential_surplus = Column(Float, nullable=False) # max(0, available - predicted_demand)
    unit = Column(String(20), nullable=False)
    review_status = Column(String(50), default="PENDING_REVIEW") # PENDING_REVIEW, ELIGIBLE_FOR_REVIEW, APPROVED, REJECTED, EXPIRED
    review_reason = Column(Text, nullable=True)
    human_approved = Column(Boolean, default=False)
    approved_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DonationOffer(Base):
    __tablename__ = "donation_offers"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    offer_code = Column(String(50), unique=True, nullable=False, index=True)
    business_id = Column(String(36), ForeignKey("businesses.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    batch_id = Column(String(36), ForeignKey("inventory_batches.id"), nullable=False)
    initial_quantity = Column(Float, nullable=False)
    remaining_quantity = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    food_category = Column(String(100), nullable=False)
    storage_method = Column(String(50), nullable=False)
    expiry_datetime = Column(DateTime, nullable=False)
    pickup_address = Column(Text, nullable=False)
    pickup_latitude = Column(Float, nullable=False)
    pickup_longitude = Column(Float, nullable=False)
    status = Column(String(50), default="OFFERED") # OFFERED, PARTIALLY_ALLOCATED, ALLOCATED, EXPIRED, CANCELLED
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    business = relationship("Business", back_populates="donation_offers")
    allocations = relationship("DonationAllocation", back_populates="offer", cascade="all, delete-orphan")

class DonationAllocation(Base):
    __tablename__ = "donation_allocations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    allocation_code = Column(String(50), unique=True, nullable=False, index=True)
    offer_id = Column(String(36), ForeignKey("donation_offers.id"), nullable=False, index=True)
    recipient_id = Column(String(36), ForeignKey("recipients.id"), nullable=False, index=True)
    allocated_quantity = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    status = Column(String(50), default="PENDING") # PENDING, ACCEPTED, REJECTED, SCHEDULED, COLLECTED, DELIVERED, CANCELLED
    scheduled_time = Column(DateTime, nullable=True)
    collected_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    delivery_confirmation_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    offer = relationship("DonationOffer", back_populates="allocations")
    recipient = relationship("Recipient", back_populates="allocations")

class RouteCalculation(Base):
    __tablename__ = "route_calculations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    route_code = Column(String(50), unique=True, nullable=False, index=True)
    seller_id = Column(String(36), ForeignKey("businesses.id"), nullable=False, index=True)
    stops_json = Column(Text, nullable=False) # Sequence of stops with coordinates and details
    geometry_geojson = Column(Text, nullable=False) # Polyline coordinates
    total_distance_km = Column(Float, nullable=False)
    total_duration_minutes = Column(Float, nullable=False)
    status = Column(String(30), default="ACTIVE") # ACTIVE, SUPERSEDED, CANCELLED
    routing_provider = Column(String(50), default="OSRM")
    trigger_event = Column(String(100), default="MANUAL_REQUEST") # INITIAL_CALCULATION, RECIPIENT_REJECTED, ALLOCATION_MODIFIED
    reroute_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class PosIntegration(Base):
    __tablename__ = "pos_integrations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id"), unique=True, nullable=False)
    provider = Column(String(50), nullable=False) # GOFRUGAL, SQUARE, MANUAL
    is_connected = Column(Boolean, default=False)
    status = Column(String(50), default="NOT_CONFIGURED") # NOT_CONFIGURED, CONNECTED, ERROR, REQUIRES_CREDENTIALS
    last_sync_at = Column(DateTime, nullable=True)
    sync_logs = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    business = relationship("Business", back_populates="pos_integration")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=False, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(50), nullable=False)
    details_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
