# AssetArray 4.0 — Computation Layer Architecture Specification

```
========================================================================================
ASSETARRAY V4.0 — COMPUTATION LAYER SPECIFICATION (PHASE 2)
Baseline: Ingestion, Normalization, Provenance, 3-Way Reconciliation & Rebalancing Sandbox
========================================================================================
```

## 1. Overview & Objective
The Computation Layer (Phase 2) establishes a deterministic processing pipeline for external financial data:
`EXTERNAL DATA → INGESTION → NORMALIZATION → VALIDATION → PROVENANCE → RECONCILIATION → CANONICAL PORTFOLIO STATE → TAX-AWARE DECISION INPUTS → DRIFT / REBALANCING INPUTS`

## 2. Guiding Principles
- **No Synthetic Financial Values:** Missing acquisition dates remain `UNVERIFIED` and `TAX_IMPACT_UNCERTAIN`. Missing quotes remain `UNAVAILABLE`.
- **Deterministic Severity Matrix:** Break severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) is computed via hard mathematical thresholds, never inferred by AI.
- **Corporate Action Safety:** Stock splits, bonus issues, and mergers trigger `CORPORATE_ACTION_REVIEW_REQUIRED` without silently altering portfolio ledgers.
- **Portfolio Input Immutability:** Rebalancing sandboxes return proposed allocation states without mutating input holdings.
- **Strict Tenant Isolation:** All ingestion and reconciliation endpoints bind strictly to authenticated server token context (`firmId`).
