# ASSETARRAY V3.2 — DATA PROVENANCE & CONFIDENCE SPECIFICATION

## Overview
AssetArray V3.2 enforces non-negotiable data provenance on all quantitative metrics, pricing points, benchmark returns, and statutory tax calculations.

## Provenance Schema (`DataProvenance`)

```typescript
export interface DataProvenance {
  sourceType: "EXCHANGE_FEED" | "MUTUAL_FUND_NAV" | "INDEX_PROVIDER" | "DEPOSITARY_CAS" | "MANUAL_ENTRY" | "SIMULATED";
  sourceName: string;            // e.g. "NSE_INDEX_SERVICES", "AMFI_INDIA", "CAMS_CAS_IMPORT"
  retrievedAt: string;           // ISO 8601 UTC timestamp
  asOf: string;                  // Market date of data record
  period?: string;               // e.g. "1Y", "3Y", "5Y", "FY2025-26"
  isSimulated: boolean;          // Strictly true for generated, sandbox, or synthetic records
  confidence: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_DATA";
  methodologyVersion: string;    // Versioned algorithm ID (e.g. "twr-gips-2020-v3.2")
}
```

## Zero-Synthetic Invariants

1. **Explicit Data Quality States**:
   - `HIGH`: Real, verified external market feed or CAMS/KFintech CAS statement import.
   - `MEDIUM`: Model projection or interpolated date series where exact intraday timestamp is absent.
   - `LOW`: Single-point valuation or unverified asset classification.
   - `INSUFFICIENT_DATA`: Missing required attributes (e.g. missing acquisition date for tax lots).

2. **Benchmark Comparison Integrity**:
   - Cross-currency comparisons (e.g. INR Portfolio vs USD S&P 500) trigger an `UNHEDGED_CROSS_CURRENCY_WARNING` and downgrade data quality to `MEDIUM`.
   - Simulated benchmark returns must flag `isSimulated: true` visibly in the UI.

3. **Tax Lot Invariants**:
   - If `acquiredAt` is missing or invalid:
     - `dateVerificationStatus`: `"DATE_MISSING"` or `"DATE_INVALID"`.
     - `isLongTerm`: `null` (never assumed).
     - `quality`: `"INSUFFICIENT_DATA"`.
     - Immediate tax shield calculation is suppressed (0 shield) until verified.
