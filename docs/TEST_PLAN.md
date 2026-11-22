# FOODLOOP AI — Test Plan & Acceptance Matrix

## 1. Acceptance Test Scenarios

| Test ID | Scenario | Preconditions | Steps | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Seller Registration & Profile Persistence | Clean DB | Register with valid business details & coords. Logout, login again. | Profile, coordinates, and categories persist; role is `SELLER`. | `PENDING_EXECUTION` |
| **TC-02** | Recipient Registration & Role Isolation | Clean DB | Register NGO with capacity & storage type. Attempt access to `/seller/dashboard`. | Access denied (403); redirected to `/recipient/dashboard`. | `PENDING_EXECUTION` |
| **TC-03** | Excel Template Generation & Ingestion | Seller logged in | Download `.xlsx` template. Add 5 rows. Upload. | Preview shows 5 parsed rows with validation flags. Data saved to DB upon confirmation. | `PENDING_EXECUTION` |
| **TC-04** | Duplicate Import Prevention (Idempotency) | TC-03 completed | Upload identical workbook file. | System flags duplicate business dates / records; skips duplicate rows. | `PENDING_EXECUTION` |
| **TC-05** | Manual Cashier Reconciliation Formula | Active products | Enter opening=100, received=10, sold=70, cancelled=2, waste=5, counted closing=33. | Expected closing = $100+10-(70-2)-5 = 37$. Discrepancy = $-4$. Record persists. | `PENDING_EXECUTION` |
| **TC-06** | Real ML Pipeline & Chronological Validation | Mendeley Data downloaded | Run `python -m ml.train`. | Chronological train/test split, baselines computed, candidate ML trained, metrics output to registry. | `PENDING_EXECUTION` |
| **TC-07** | Model Metric Transparency & Cold Start | Seller with < 7 days data | Request forecast. | UI displays `INSUFFICIENT_HISTORY` or `STATISTICAL_BASELINE`, never fakes 99% accuracy. | `PENDING_EXECUTION` |
| **TC-08** | Potential Surplus Calculation | Forecast & inventory exist | Run surplus engine on batch of 100 meals with forecast=65. | Surplus identified = $100 - 65 = 35$ meals. Reserved and expired stock excluded. | `PENDING_EXECUTION` |
| **TC-09** | Recipient Matching Rules & Capacity Filter | Offer of 50 chilled meals | Query candidate recipients (one ambient-only, one chilled with capacity 30, one chilled with capacity 100). | Ambient-only excluded. Chilled capacity 100 ranked top. Capacity limits enforced. | `PENDING_EXECUTION` |
| **TC-10** | Donation Chain of Custody & Recipient Acceptance | Offer created | Recipient accepts 30 meals. | Allocation status updates to `ACCEPTED`, batch reserved count updates, audit log created. | `PENDING_EXECUTION` |
| **TC-11** | GIS Map & OSRM Route Calculation | Saved coords | Request route from seller to recipient. | Real road polyline coordinates returned from OSRM with driving distance (km) and duration (mins). | `PENDING_EXECUTION` |
| **TC-12** | Event-Triggered Rerouting | Active multi-stop route | Recipient 2 cancels allocation. | New route calculation performed excluding stop 2. Prior route marked `SUPERSEDED`. Map updates. | `PENDING_EXECUTION` |
| **TC-13** | Impact Dashboard Aggregation | Completed deliveries | View impact dashboard. | Impact calculated only from confirmed deliveries. Sourced conversion formulas used (e.g. 0.45kg/meal). | `PENDING_EXECUTION` |
| **TC-14** | Mobile Responsiveness | Multiple screen viewports | Inspect responsive layout at 375px (iPhone) and 768px (iPad). | Navigation collapses into drawer, tables scroll horizontally or card format, no viewport overflow. | `PENDING_EXECUTION` |
| **TC-15** | Tenant Isolation & Security | Two registered sellers | Seller A attempts to read/edit Seller B's inventory batch via direct API ID injection. | Backend rejects request with 403 / 404 (ownership check). | `PENDING_EXECUTION` |
