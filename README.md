# FOODLOOP AI

> **Predict. Rescue. Redistribute. Prevent.**  
> A real, end-to-end AI-powered food surplus demand forecasting, food safety review, and intelligent redistribution platform.

---

## 1. System Overview

FOODLOOP AI connects food businesses (restaurants, bakeries, cafes, caterers) with recipient organizations (NGOs, community kitchens, food banks, shelters).

Unlike simple listing boards or chatbots, FOODLOOP AI implements the complete closed-loop supply chain:
```
[Historical Sales / POS] 
         │
         ▼
[Machine Learning Demand Forecast] ──▶ [Eligible Inventory Batches]
                                                  │
                                                  ▼
                                      [Surplus Prediction Engine]
                                                  │
                                                  ▼
                                      [Food Safety & Human Review Gate]
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
                                      [OSRM Road Routing & Dynamic Reroute]
                                                  │
                                                  ▼
                                      [Chain-of-Custody Delivery Confirmations]
                                                  │
                                                  ▼
                                      [Audit Trail & Impact Analytics]
```

---

## 2. Technical Architecture

- **Frontend**: Next.js App Router (TypeScript, Tailwind CSS, Leaflet, Lucide Icons)
- **Backend API**: Python FastAPI, Pydantic v2, SQLAlchemy 2.0 (SQLite local / PostgreSQL Supabase)
- **Machine Learning**: scikit-learn (`HistGradientBoostingRegressor` & `RandomForestRegressor`), pandas, NumPy, joblib. Evaluated against Naive, Seasonal Naive, and 7-day Moving Average baselines on out-of-sample chronological splits.
- **Routing & GIS**: OpenStreetMap tiles, Open Source Routing Machine (OSRM) driving API with GeoJSON polyline road geometry and dynamic event-triggered recalculation.
- **Data Ingestion**: Multi-sheet `.xlsx` streaming validator (openpyxl) and universal manual cashier with stock reconciliation formula.

---

## 3. Quickstart & Local Setup

### 3.1 Backend Setup (FastAPI & ML Engine)

1. **Activate Python environment & install dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

2. **Train the ML Demand Forecasting Model**:
   ```bash
   python -m backend.ml.train
   ```
   *Trains the candidate models on the Mendeley Data Stuttgart Restaurant Sales benchmark, calculates chronological MAE/RMSE/WAPE/Bias, and saves the versioned artifact to `backend/ml/models/`.*

3. **Seed Hackathon Test Data**:
   ```bash
   python -m backend.app.seed
   ```
   *Creates pre-configured test accounts (Seller, Community Kitchen, Food Bank) with 28 days of historical sales and inventory batches.*

4. **Run the Backend API Server**:
   ```bash
   uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *API documentation will be available at `http://localhost:8000/docs`.*

---

### 3.2 Frontend Setup (Next.js)

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Build and start the web application**:
   ```bash
   npm run build
   npm run start
   ```
   *(Or for local development: `npm run dev`)*  
   *Open `http://localhost:3000` in your browser.*

---

### 3.3 Running Automated Tests

Run the complete backend test suite:
```bash
python -m pytest backend/tests -v
```
All 9 test suites test seller authentication, recipient role isolation, manual cashier reconciliation, Excel workbook ingestion, ML prediction and model transparency, surplus calculations, safety review gates, recipient matching algorithms, and dynamic road rerouting.

---

## 4. Test Accounts for Hackathon Evaluation

| Persona | Role | Email | Password | Coordinates | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Green Harvest Kitchen** | `SELLER` | `seller.test@foodloop.local` | `FoodloopTest123!` | 12.9352, 77.6245 | Restaurant in Koramangala with 28 days of sales & active batch. |
| **Aashray Community Kitchen** | `RECIPIENT` | `kitchen.test@foodloop.local` | `FoodloopTest123!` | 12.9719, 77.6412 | Kitchen in Indiranagar. Daily capacity: 150 meals. Chilled/Ambient. |
| **Annapoorna Food Bank** | `RECIPIENT` | `foodbank.test@foodloop.local` | `FoodloopTest123!` | 12.9116, 77.6389 | Food Bank in HSR Layout. Daily capacity: 250 meals. Frozen/Chilled. |

*(1-click login buttons for all three accounts are available directly on the homepage `http://localhost:3000`)*.

---

## 5. Project Directory Structure

```
foodloop/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routers (auth, products, inventory, sales, excel, ml, surplus, donations, routing, integrations, impact, health)
│   │   ├── core/            # Config, database engine, security JWT & RBAC
│   │   ├── models/          # SQLAlchemy entity models & Pydantic schemas
│   │   ├── services/        # Matching engine, surplus engine, route service, pos adapters, excel generator
│   │   ├── main.py          # FastAPI application entrypoint
│   │   └── seed.py          # Test data seeder
│   ├── ml/
│   │   ├── data/            # Public dataset cache
│   │   ├── models/          # Trained model artifacts (.joblib) & metadata manifest
│   │   ├── download_data.py # Dataset retrieval & benchmark schema generator
│   │   ├── inspect_data.py  # Dataset inspection & EDA
│   │   ├── preprocess.py    # Anti-leakage chronological splitter
│   │   ├── features.py      # Time-series feature engineering
│   │   ├── train.py         # Baseline comparison & model selection pipeline
│   │   ├── evaluate.py      # Metric calculations (MAE, RMSE, WAPE, Bias)
│   │   ├── predict.py       # Hierarchical cold-start prediction service
│   │   └── model_registry.py# Artifact loader & manifest validator
│   ├── tests/               # 9 end-to-end automated tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages (Seller, Recipient, Map, Impact)
│   │   ├── components/      # UI components (Navbar, SellerNav, RecipientNav, MapComponent)
│   │   └── lib/             # API client & JWT token management
│   ├── package.json
│   └── next.config.ts
└── docs/
    ├── ARCHITECTURE.md
    ├── RESEARCH.md
    ├── DATA_DICTIONARY.md
    ├── ML_METHODOLOGY.md
    ├── API_INTEGRATIONS.md
    ├── TEST_PLAN.md
    ├── KNOWN_LIMITATIONS.md
    └── FINAL_FEATURE_REPORT.md
```
