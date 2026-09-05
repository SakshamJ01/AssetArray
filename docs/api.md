# AssetArray v3.1 REST API Specification

## Base URL
- Production: `https://assetarray.onrender.com`
- Local Development: `http://localhost:5000`

All request payloads and responses use `Content-Type: application/json`.

---

## 1. System & Health

### `GET /api/health`
Returns service availability, active engine version, and database connectivity.

**Response `200 OK`**:
```json
{
  "status": "healthy",
  "version": "3.1.0",
  "timestamp": "2026-09-05T04:30:00.000Z",
  "mongoConnected": true,
  "engines": {
    "attribution": "brinson-fachler-v1.1",
    "tax": "in-tax-ay2026-27",
    "healthScore": "health-score-v1.2",
    "monteCarlo": "mulberry32-seeded"
  }
}
```

---

## 2. Authentication & Session

### `POST /api/auth/login`
Authenticates advisor credentials and issues JWT token pair.

**Request Body**:
```json
{
  "username": "advisor@assetarray.app",
  "password": "AdvisorPassword123!"
}
```

**Response `200 OK`**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": "adv_01",
    "username": "advisor@assetarray.app",
    "role": "ADVISOR"
  }
}
```

---

## 3. Zero-Knowledge Synchronization

### `POST /api/sync/push`
Uploads client-side symmetrically encrypted vault state. The server stores ciphertext without access to decryption keys.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "ownerId": "adv_01_hash_abc",
  "payload": "encrypted_base64_string_salt_iv_ciphertext",
  "clientTimestamp": "2026-09-05T04:30:00.000Z"
}
```

**Response `200 OK`**:
```json
{
  "success": true,
  "updatedAt": "2026-09-05T04:30:01.120Z",
  "revision": 42
}
```

### `GET /api/sync/pull`
Retrieves the latest encrypted vault state for the authenticated advisor.

**Headers**: `Authorization: Bearer <token>`

**Response `200 OK`**:
```json
{
  "payload": "encrypted_base64_string_salt_iv_ciphertext",
  "updatedAt": "2026-09-05T04:30:01.120Z",
  "revision": 42
}
```

---

## 4. Server-Side Validated Analytics (Optional Compute)

### `POST /api/analytics/attribution`
Calculates Brinson-Fachler performance attribution against a standardized benchmark.

**Request Body**:
```json
{
  "holdings": [
    {
      "assetName": "HDFC Bank Ltd",
      "assetClass": "Stocks",
      "currentValue": 500000,
      "investedValue": 400000
    },
    {
      "assetName": "Govt of India 7.18% 2033",
      "assetClass": "Bonds",
      "currentValue": 300000,
      "investedValue": 290000
    }
  ],
  "benchmarkSymbol": "BALANCED_65_35"
}
```

**Response `200 OK`**:
```json
{
  "portfolioReturn": 0.174,
  "benchmarkReturn": 0.099,
  "totalActiveReturn": 0.075,
  "summary": {
    "allocationEffect": 0.008,
    "selectionEffect": 0.059,
    "interactionEffect": 0.008
  },
  "isReconciled": true,
  "methodologyVersion": "brinson-fachler-v1.1"
}
```

---

## 5. Tax Harvesting & Capital Gains

### `POST /api/tax/harvest`
Evaluates Section 70 / Section 74 set-off hierarchy and harvestable loss shields under Finance Act 2024 (AY 2026-27).

**Request Body**:
```json
{
  "holdings": [
    {
      "assetName": "Tata Motors Ltd",
      "assetClass": "Stocks",
      "currentValue": 80000,
      "investedValue": 100000,
      "purchaseDate": "2025-11-10T00:00:00.000Z"
    }
  ],
  "realizedGains": {
    "shortTerm": 50000,
    "longTerm": 150000
  }
}
```

**Response `200 OK`**:
```json
{
  "assessmentYear": "AY 2026-27",
  "totalHarvestableLoss": 20000,
  "estimatedImmediateTaxSavings": 4160,
  "ltcgExemptionAvailable": 125000,
  "ltcgExemptionUtilized": 125000,
  "netTaxLiability": 9880,
  "statutoryDisclaimer": "Calculations reflect Indian Finance (No. 2) Act 2024. For professional tax advisory only."
}
```
