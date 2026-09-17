# AssetArray 4.0 — Reconciliation Engine Documentation

## 3-Way Reconciliation Matrix
Compares:
- **Source Ledger** (Ingested Canonical Records)
- **Canonical Portfolio** (Current System Holdings)
- **Derived Valuation** (Calculated Total Portfolio Values)

## Break Types & Severity Matrix
- `QUANTITY_MISMATCH`: Difference between source and portfolio units.
- `VALUE_MISMATCH`: Valuation discrepancy above variance tolerance.
- `MISSING_POSITION`: Holding in portfolio ledger missing from source.
- `UNEXPECTED_POSITION`: Holding in source missing from portfolio.
- `CORPORATE_ACTION_MISMATCH`: Suspected stock split or bonus issue ratio (e.g. 2:1, 5:1). Flags `requiresCorporateActionReview = true`.

## Discrepancy Lifecycle
`OPEN` → `UNDER_REVIEW` → `RESOLVED` / `IGNORED`
Emits audit event `RECONCILIATION_RESOLVED` upon resolution.
