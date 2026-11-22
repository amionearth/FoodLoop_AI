# FOODLOOP AI — External Research & Dataset Verification

## 1. Verified Public Datasets

### 1.1 Primary Restaurant Sales Dataset (Mendeley Data)
- **Dataset Title**: Restaurant Sales Data with Features
- **DOI / URL**: https://data.mendeley.com/datasets/xv5kp6mxv7/1
- **Date Checked**: 2026-11-19
- **License**: Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Source Context**: Daily sales over 2+ years from a restaurant in Stuttgart, Germany.
- **Coverage**: 7 distinct food menu items with calendar features (day of week, month, holidays), historical lags, and local meteorological observations (temperature, precipitation, sunshine duration).
- **Format**: Tabular CSV.
- **Suitability for FOODLOOP AI**: Serves as our primary benchmark training dataset for restaurant demand forecasting. Demonstrates seasonality, day-of-week demand variance, and weather impact.
- **Attribution**: Cite authors per Mendeley Data CC BY 4.0 terms.
- **Precaution**: German restaurant data should not be claimed as universal Indian or global restaurant data. The system must disclose this as a global restaurant benchmark.

### 1.2 FreshRetailNet-50K Perishable Retail Dataset
- **URL**: https://huggingface.co/datasets/Dingdong-Inc/FreshRetailNet-50K
- **Date Checked**: 2026-11-19
- **License**: Research Attribution per Dingdong-Inc dataset card.
- **Characteristics**: 4.85M rows across multi-store perishable retail categories with hourly stock status and normalized sales.
- **Suitability**: Studied for stockout-aware replenishment and perishability decay modeling. Normalized quantities must not be confused with raw kilograms or meal counts.

---

## 2. External APIs & Routing Services

### 2.1 OSRM (Open Source Routing Machine)
- **Documentation Checked**: https://project-osrm.org/docs/v5.24.0/api/
- **Endpoint Structure**: `http://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson`
- **Response Format**:
  - `routes[0].geometry.coordinates`: Array of `[lon, lat]` points representing the actual road polyline.
  - `routes[0].distance`: Meters along the road network.
  - `routes[0].duration`: Seconds based on road speed limits.
- **Fair Use Policy**: The public demo server is rate-limited and intended for testing/low-volume hackathons. Production deployments require self-hosted OSRM in Docker or a commercial OpenRouteService/Mapbox endpoint.
- **Implementation Safeguard**: If OSRM is unreachable, the system returns a clear error status: `ROUTING_SERVICE_UNAVAILABLE` and prompts the user, rather than drawing misleading straight lines as road routes.

### 2.2 Geocoding Providers
- **Nominatim / OpenStreetMap**:
  - Endpoint: `https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=1`
  - Requires: Valid `User-Agent` header according to OSM Nominatim Usage Policy.
  - Fallback: Direct coordinate selection via interactive map pin picker.

### 2.3 POS / Cashier Providers Research
- **GoFrugal**:
  - Research: GoFrugal provides ERP/POS systems common in India and South Asia (TruePOS / RPOS). Integration requires an enterprise GoFrugal Connect API key and merchant license. Historical sync is conducted via batch REST endpoints.
- **Square**:
  - Research: Square Connect API (`https://developer.squareup.com/`) supports OAuth 2.0, Catalog API, and Orders API. Square's payment card processing is restricted in certain jurisdictions (including India), but Square API can be connected by international merchants or in sandbox mode.
- **Provider-Neutral Adapter Interface**:
  - Implemented via `IPosAdapter` protocol. If credentials are missing, system marks status as `UNCONFIGURED` without falsifying synchronization.
