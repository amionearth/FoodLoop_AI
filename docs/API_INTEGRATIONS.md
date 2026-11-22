# FOODLOOP AI — API Integrations Specification

## 1. POS Integration Protocol & Status

FOODLOOP AI provides a provider-agnostic POS abstraction interface (`IPosAdapter`):

```python
class IPosAdapter(Protocol):
    async def connect(self, credentials: Dict[str, Any]) -> bool: ...
    async def disconnect(self) -> bool: ...
    async def fetch_products(self) -> List[ProductDTO]: ...
    async def fetch_historical_orders(self, start_date: date, end_date: date) -> List[OrderDTO]: ...
    async def fetch_inventory(self) -> List[InventoryBatchDTO]: ...
    async def get_sync_status(self) -> SyncStatusDTO: ...
```

### Connector Status Matrix
| Provider | Target Market | Auth Method | Current Status | Requirement for Activation |
| :--- | :--- | :--- | :--- | :--- |
| **GoFrugal Connect** | India / Global | API Key + Merchant Token | `REQUIRES_CREDENTIALS` | Merchant API License Key + Server Endpoint |
| **Square Connect** | US / UK / Canada / AU | OAuth 2.0 / Sandbox Token | `REQUIRES_CREDENTIALS` | `SQUARE_ACCESS_TOKEN` + `SQUARE_LOCATION_ID` |
| **Manual Cashier** | Global (Universal) | Native DB Transactions | `IMPLEMENTED_AND_TESTED` | None (Zero-credential native core) |
| **Excel / CSV Pipeline** | Global (Universal) | File Upload (.xlsx / .csv) | `IMPLEMENTED_AND_TESTED` | None (Zero-credential native core) |

*Notice: If credentials for GoFrugal or Square are missing, the UI displays "Not configured — add the required provider credentials to connect." We never fabricate synchronizations or invent orders.*

---

## 2. GIS, Geocoding & Routing Services

### 2.1 OSRM Routing Engine
- **Primary Endpoint**: `http://router.project-osrm.org/route/v1/driving/{coords}?overview=full&geometries=geojson`
- **Output Data**:
  - Distance in kilometers (converted from meters).
  - Duration in minutes (converted from seconds).
  - GeoJSON Feature / Coordinates array for polyline map rendering.
- **Error Handling**: If the endpoint fails or returns non-200, the system surfaces `ROUTING_SERVICE_ERROR` with a descriptive error message and the last valid timestamp.

### 2.2 Geocoding
- **Provider**: OpenStreetMap Nominatim / User interactive coordinate picker.
- **Constraints**: Validates latitude $\in [-90, 90]$ and longitude $\in [-180, 180]$.
