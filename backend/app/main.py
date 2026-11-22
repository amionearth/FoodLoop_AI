from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import Base, engine
from backend.app.api import (
    auth, products, inventory, sales, excel_pipeline,
    ml_forecasting, surplus, donations, routing, integrations, impact, health
)

# Auto-create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="FOODLOOP AI — Real End-to-End AI-Powered Food Surplus Prediction & Redistribution Platform"
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API routers under /api
app.include_router(health.router)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(inventory.router, prefix=settings.API_V1_STR)
app.include_router(sales.router, prefix=settings.API_V1_STR)
app.include_router(excel_pipeline.router, prefix=settings.API_V1_STR)
app.include_router(ml_forecasting.router, prefix=settings.API_V1_STR)
app.include_router(surplus.router, prefix=settings.API_V1_STR)
app.include_router(donations.router, prefix=settings.API_V1_STR)
app.include_router(routing.router, prefix=settings.API_V1_STR)
app.include_router(integrations.router, prefix=settings.API_V1_STR)
app.include_router(impact.router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
