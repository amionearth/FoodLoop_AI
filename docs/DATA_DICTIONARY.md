# FOODLOOP AI — Data Dictionary & Entity Relationship Specification

## 1. Core Tables

### 1.1 `users`
Represents platform accounts (sellers, recipients, administrators).
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUID string identifier. |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Account email address. |
| `hashed_password`| VARCHAR(255) | NOT NULL | Bcrypt hashed credential. |
| `role` | VARCHAR(20) | NOT NULL | `SELLER`, `RECIPIENT`, or `ADMIN`. |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Registration timestamp. |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp. |

### 1.2 `businesses` (Sellers)
Detailed commercial profile for food business operators.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY, FK(users.id) | Linked user account ID. |
| `business_name` | VARCHAR(255) | NOT NULL | Trading or legal business name. |
| `category` | VARCHAR(50) | NOT NULL | `RESTAURANT`, `CAFE`, `BAKERY`, `SUPERMARKET`, `GROCERY`, `HOTEL`, `CATERING`, `OTHER`. |
| `contact_person` | VARCHAR(100) | NOT NULL | Authorized manager name. |
| `phone` | VARCHAR(50) | NOT NULL | Primary contact phone. |
| `address` | TEXT | NOT NULL | Street address. |
| `city` | VARCHAR(100) | NOT NULL | City name. |
| `state` | VARCHAR(100) | NOT NULL | State or province. |
| `postal_code` | VARCHAR(20) | NOT NULL | Postal / ZIP code. |
| `latitude` | FLOAT | NOT NULL | Validated WGS84 coordinate (-90 to 90). |
| `longitude` | FLOAT | NOT NULL | Validated WGS84 coordinate (-180 to 180). |
| `operating_hours`| VARCHAR(255) | NULL | Operating window, e.g. "09:00 - 22:00". |
| `food_categories`| TEXT | NOT NULL | Comma-separated list of handled categories. |

### 1.3 `recipients`
Profiles for NGOs, shelters, community kitchens, food banks.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY, FK(users.id) | Linked user account ID. |
| `org_name` | VARCHAR(255) | NOT NULL | Registered charity or trust name. |
| `org_type` | VARCHAR(50) | NOT NULL | `NGO`, `COMMUNITY_KITCHEN`, `FOOD_BANK`, `SHELTER`, `CHARITABLE_TRUST`, `OTHER`. |
| `contact_person` | VARCHAR(100) | NOT NULL | Primary representative name. |
| `phone` | VARCHAR(50) | NOT NULL | Primary telephone. |
| `address` | TEXT | NOT NULL | Delivery / operational facility address. |
| `city` | VARCHAR(100) | NOT NULL | City. |
| `state` | VARCHAR(100) | NOT NULL | State. |
| `postal_code` | VARCHAR(20) | NOT NULL | Postal code. |
| `latitude` | FLOAT | NOT NULL | Validated WGS84 latitude. |
| `longitude` | FLOAT | NOT NULL | Validated WGS84 longitude. |
| `verification_status` | VARCHAR(30) | NOT NULL | `PENDING`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`, `SUSPENDED`. |
| `daily_capacity_meals`| INT | NOT NULL | Maximum meals acceptable per day. |
| `storage_capabilities`| VARCHAR(255) | NOT NULL | Comma-separated: `AMBIENT`, `CHILLED`, `FROZEN`. |
| `accepted_categories` | TEXT | NOT NULL | Comma-separated categories accepted. |
| `operating_hours`| VARCHAR(255) | NOT NULL | Acceptance hours, e.g., "10:00 - 18:00". |

### 1.4 `products`
Catalogue of items sold or distributed by a business.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | Unique product ID. |
| `business_id` | VARCHAR(36) | FK(businesses.id), NOT NULL | Owning business. |
| `name` | VARCHAR(255) | NOT NULL | Item name. |
| `category` | VARCHAR(100) | NOT NULL | Category (e.g., Prepared Meals, Bakery, Produce). |
| `unit` | VARCHAR(20) | NOT NULL | `PORTIONS`, `MEALS`, `KG`, `GRAMS`, `LITRES`, `PIECES`, `BOXES`. |
| `unit_price` | FLOAT | NOT NULL | Standard unit sales price. |
| `active` | BOOLEAN | DEFAULT TRUE | Active catalogue flag. |
| `description` | TEXT | NULL | Item details / ingredients. |

### 1.5 `inventory_batches` & `inventory_movements`
Batch-level stock tracking with an immutable audit ledger.
| Column (`inventory_batches`) | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(36) PK | Unique batch ID. |
| `business_id` | VARCHAR(36) FK | Owning business. |
| `product_id` | VARCHAR(36) FK | Associated product. |
| `batch_number` | VARCHAR(100) | Traceable lot or batch number. |
| `quantity` | FLOAT | Current available physical quantity. |
| `reserved_quantity` | FLOAT | Quantity reserved for confirmed donation offers. |
| `unit` | VARCHAR(20) | Matching product unit. |
| `received_or_prep_time`| TIMESTAMP | Preparation or delivery timestamp. |
| `expiry_datetime`| TIMESTAMP | Shelf-life or use-by deadline. |
| `storage_method` | VARCHAR(50) | `AMBIENT`, `CHILLED`, `FROZEN`. |
| `storage_temp_c` | FLOAT NULL | Recorded temperature in Celsius. |
| `food_condition` | VARCHAR(50) | `EXCELLENT`, `GOOD`, `ACCEPTABLE`, `SPOILED`. |

### 1.6 `daily_sales`
Daily reconciliations from manual cashier, spreadsheet editor, or POS.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(36) PK | Unique daily record ID. |
| `business_id` | VARCHAR(36) FK | Business identifier. |
| `product_id` | VARCHAR(36) FK | Product identifier. |
| `business_date` | DATE | Date of trading. |
| `opening_stock` | FLOAT | Opening physical count. |
| `stock_received`| FLOAT | Deliveries or prep batches received during day. |
| `units_sold` | FLOAT | Total gross units rung through cashier. |
| `cancelled_units`| FLOAT | Voided / cancelled units. |
| `refunded_units`| FLOAT | Returned / refunded units. |
| `recorded_waste`| FLOAT | Kitchen scrap or expired waste logged. |
| `closing_stock` | FLOAT | Physically counted closing stock. |
| `expected_closing`| FLOAT | Calculated reconciliation value. |
| `discrepancy` | FLOAT | Difference: `closing_stock - expected_closing`. |
| `source` | VARCHAR(50) | `MANUAL_CASHIER`, `EXCEL_IMPORT`, `POS_SYNC`. |

### 1.7 `donation_offers` & `donation_allocations`
Redistribution transactions and recipient partition states.
- Status Lifecycle: `DRAFT` $\rightarrow$ `OFFERED` $\rightarrow$ `ACCEPTED` $\rightarrow$ `PARTIALLY_ALLOCATED` $\rightarrow$ `SCHEDULED` $\rightarrow$ `COLLECTED` $\rightarrow$ `DELIVERED` $\rightarrow$ `CANCELLED` $\rightarrow$ `EXPIRED`.
