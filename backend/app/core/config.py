import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "FOODLOOP AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("PYTHON_API_SECRET", "foodloop-super-secure-production-secret-key-32bytes-min")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database: Supports SQLite (local/dev/testing) and PostgreSQL (Supabase)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./foodloop.db")
    
    # Supabase (Optional for direct cloud sync)
    SUPABASE_URL: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "")
    
    # Regional Configuration (Kerala, India)
    DEFAULT_REGION: str = os.getenv("DEFAULT_REGION", "Kerala, India")
    DEFAULT_STATE: str = os.getenv("DEFAULT_STATE", "Kerala")
    DEFAULT_CITY: str = os.getenv("DEFAULT_CITY", "Kochi")
    DEFAULT_LATITUDE: float = float(os.getenv("DEFAULT_LATITUDE", "9.9816"))
    DEFAULT_LONGITUDE: float = float(os.getenv("DEFAULT_LONGITUDE", "76.2799"))
    DEFAULT_TIMEZONE: str = os.getenv("DEFAULT_TIMEZONE", "Asia/Kolkata")
    DEFAULT_CURRENCY: str = "INR"
    DEFAULT_CURRENCY_SYMBOL: str = "₹"
    
    # Routing & Mapping
    OSRM_ROUTING_URL: str = os.getenv("ROUTING_API_URL", "https://router.project-osrm.org/route/v1/driving")
    GEOCODING_PROVIDER: str = os.getenv("GEOCODING_PROVIDER", "nominatim")
    
    # ML Models directory
    MODEL_DIR: str = os.getenv("MODEL_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ml", "models")))
    DATA_DIR: str = os.getenv("DATA_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ml", "data")))

settings = Settings()
os.makedirs(settings.MODEL_DIR, exist_ok=True)
os.makedirs(settings.DATA_DIR, exist_ok=True)
