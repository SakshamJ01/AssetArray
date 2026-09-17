# AssetArray 4.0 — Tax-Aware Rebalancing Sandbox Documentation

## Core Workflow
1. **Inputs:** `PortfolioHolding[]` (Immutable), Target Corridors (`DriftCorridorConfig[]`).
2. **Drift Evaluation:** Identifies breached asset class corridors (`OVERWEIGHT` / `UNDERWEIGHT`).
3. **Trade Candidate Generation:** Recommends `BUY`, `SELL`, or `NO_ACTION` candidate trade slips.
4. **Tax Lot Sensitivity:** Evaluates individual tax lots using statutory Section 70/74 set-off rules.
   - If acquisition date is unverified, tax impact is strictly marked `TAX_IMPACT_UNCERTAIN`.
   - Never infers holding periods or invents tax savings.
5. **Comparison State Output:** Produces current vs proposed allocation, estimated turnover, estimated tax impact, concentration change, and risk change.
