# FOODLOOP AI — System Architecture Specification

## 1. Executive Summary

FOODLOOP AI is an end-to-end, AI-powered food surplus prediction, safety review, and intelligent redistribution platform. It closes the loop between food businesses with perishable inventory and charitable organizations (food banks, shelters, community kitchens) capable of distributing food safely to communities in need.

### Core Value Flow
```
[Historical Sales & POS] 
         │
         ▼
[Machine Learning Demand Forecast] ──▶ [Eligible Inventory Batches]
                                                  │
                                                  ▼
                                      [Surplus Prediction Engine]
                                                  │
                                                  ▼
                                      [Food Safety & Human Review]
                                                  │
                                                  ▼
                                      [Donation Offer Creation]
                                                  │
                                                  ▼
                                      [Intelligent Recipient Matching]
                                                  │
                                                  ▼
                                      [Multi-party Allocation Engine]
                                                  │
                                                  ▼
                                      [OSRM Routing & Dynamic Reroute]
                                                  │
                                                  ▼
                                      [Chain-of-Custody Delivery Confirmations]
                                                  │
                                                  ▼
                                      [Audit Trail & Impact Analytics]
```

---

## 2. Technical Stack Selection & Justification

| Layer | Technology | Version | Justification |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js App Router | 14+ | High-performance server/client component rendering, strict route isolation, mobile-responsive layout. |
| **Language** | TypeScript / Python | TS 5.x / Python 3.12 | End-to-end type safety on UI and data science / analytical capabilities in backend. |
| **Styling & Design** | Tailwind CSS + Lucide Icons | 3.4+ | Rapid development of the "Premium Sustainability Technology SaaS" aesthetic (forest green, charcoal, off-white, muted sage). |
| **Mapping & GIS** | Leaflet + React-Leaflet + OSRM | Leaflet 1.9+ | Production-capable OpenStreetMap integration, geo-coordinate validation, zero-cost routing with route geometry and polyline recalculation. |
| **Backend API** | FastAPI + Uvicorn | FastAPI 0.115+ | High throughput async Python, automatic OpenAPI documentation, native Pydantic v2 schemas. |
| **Data Persistence** | SQLAlchemy 2.0 + SQLite/PostgreSQL | SQLite (local/test) / Postgres (Supabase) | Multi-dialect engine supporting full offline testing, zero-configuration local execution, and seamless production Supabase deployment with RLS. |
| **Machine Learning** | scikit-learn, NumPy, pandas, joblib | scikit-learn 1.5+ | Interpretable, reproducible tabular regression (RandomForestRegressor, HistGradientBoostingRegressor) with chronological splits and baseline benchmarking. |
| **Data Interchange** | openpyxl, pandas | openpyxl 3.1+ | Robust multi-sheet Excel workbook generation, cell formatting, validation dropdowns, and streaming parsing. |

---

## 3. System Components & Boundaries

### 3.1 Backend Modular Service Architecture
The FastAPI backend (`backend/app`) is decomposed into decoupled services:
1. **Auth & Security (`api/auth.py`, `core/security.py`)**:
   - JWT token issuance and cryptographic verification (HS256).
   - Strict role-based access control (`SELLER`, `RECIPIENT`, `ADMIN`).
   - Tenant isolation: All seller queries filter by `seller_id = token.user_id`; all recipient queries filter by `recipient_id = token.user_id`. Browser-supplied business IDs are never trusted.
2. **Product & Inventory Ledger (`api/products.py`, `api/inventory.py`)**:
   - Double-entry-style inventory ledger recording all movements (`STOCK_IN`, `USAGE`, `SALES`, `WASTE`, `DONATION_RESERVED`, `PHYSICAL_AUDIT`).
   - Unit-of-measurement safety checks: Prevents mixing incompatible units (e.g., kg with portions).
3. **Universal Cashier & Spreadsheet Pipeline (`api/sales.py`, `api/excel_pipeline.py`)**:
   - Manual Cashier for businesses without POS APIs.
   - Stock reconciliation formula:
     $$\text{Expected Closing} = \text{Opening} + \text{Received} - (\text{Sold} - \text{Refunded} - \text{Cancelled}) - \text{Waste} - \text{Other Movements}$$
   - Row-level Excel validation, preview, and idempotent ingestion.
4. **Machine Learning & Forecasting Engine (`ml/`, `api/ml_forecasting.py`)**:
   - Time-series feature engineering (lags, rolling averages, calendar seasonality).
   - Chronological validation (no future-data leakage).
   - Seller-specific fallback hierarchy: Seller-specific trained model $\rightarrow$ Compatible global model $\rightarrow$ 7-day Moving Average $\rightarrow$ Naive previous period $\rightarrow$ Insufficient data notice.
5. **Surplus Calculation & Food Safety Review (`api/surplus.py`)**:
   - Potential surplus calculation:
     $$\text{Potential Surplus} = \max(0, \text{Eligible Available Stock} - \text{Forecasted Demand})$$
   - Food safety compliance state machine: `PENDING_REVIEW` $\rightarrow$ `ELIGIBLE_FOR_REVIEW` $\rightarrow$ `APPROVED` $\rightarrow$ `REJECTED` / `EXPIRED`.
   - Explicit human review step required prior to donation listing.
6. **Recipient Matching & Allocation Engine (`services/matching_engine.py`)**:
   - Multi-criteria candidate evaluation:
     - Mandatory filters: Category match, storage match (Cold / Frozen / Dry), operating hours, non-zero remaining daily capacity, verified status preference.
     - Transparent scoring function combining distance (haversine/OSRM travel time), capacity match ratio, and historical acceptance rate.
   - Atomic multi-recipient quantity partitioning.
7. **Mapping, Routing & Event-Driven Rerouting (`services/route_service.py`, `api/routing.py`)**:
   - Direct integration with OSRM (Open Source Routing Machine) API.
   - Real route geometry decoding (polyline coordinates), distance in km, duration in minutes.
   - Event triggers for rerouting: Recipient rejection, allocation modification, collection cancellations.
8. **Donation State Machine (`api/donations.py`)**:
   - Complete chain of custody with immutable timestamped audit logs.
9. **Impact Analytics (`api/impact.py`)**:
   - Aggregation of actual delivered kilograms/meals from confirmed delivery receipts only. No fabricated metrics.

---

## 4. Network & Deployment Topology

```
             ┌──────────────────────────────┐
             │      End User Browsers       │
             │   (Desktop, Tablet, Phone)   │
             └──────────────┬───────────────┘
                            │ HTTPS
                            ▼
             ┌──────────────────────────────┐
             │      Next.js App Server      │
             │   (Vercel / Node Runtime)    │
             │     Port 3000 (Frontend)     │
             └──────────────┬───────────────┘
                            │ REST / JSON (JWT Authenticated)
                            ▼
             ┌──────────────────────────────┐
             │     FastAPI Python Backend   │
             │   (Render / Uvicorn Runtime) │
             │      Port 8000 (Backend)     │
             └───────┬──────────────┬───────┘
                     │              │
          SQLAlchemy │              │ HTTP REST
                     ▼              ▼
     ┌───────────────────────┐   ┌───────────────────────┐
     │ Supabase / SQLite DB  │   │  OSRM Routing Engine  │
     │  (Postgres w/ RLS or  │   │ (OpenStreetMap Demo / │
     │   Local Persistence)  │   │   Self-hosted OSRM)   │
     └───────────────────────┘   └───────────────────────┘
```

---

## 5. Security Architecture

1. **Authentication:**
   - Password hashing with bcrypt / argon2.
   - Stateless JWT tokens containing user UUID, role, and expiration timestamp.
2. **Authorization & Tenant Boundary:**
   - User identity extracted exclusively from decoded JWT subject.
   - API endpoints enforce role requirements (`require_seller`, `require_recipient`).
   - Cross-tenant queries return HTTP 403 Forbidden or filtered empty sets.
3. **Data Protection:**
   - No sensitive tokens or secrets exposed through client-side bundles (`NEXT_PUBLIC_` restricted to public endpoints and keys).
   - Excel upload file size caps (max 10MB) and strict mimetype validation to prevent denial of service and malicious file execution.
