# ASSETARRAY V3.2 — COMPLIANCE & STATUTORY DISCLOSURES

## Legal & Regulatory Stance

AssetArray is an institutional-grade wealth management software tool built to assist registered financial advisors, wealth managers, multi-family offices, and chartered accountants.

### 1. SEBI Regulatory Positioning (India)
AssetArray is **suitability-support tooling** and **portfolio diagnostic infrastructure**. It is **not** an automated trading platform, a SEBI-registered Investment Adviser (RIA), nor a Research Analyst (RA).
- All investment recommendations, rebalancing orders, and asset allocation decisions require independent professional review and explicit execution authorization by a qualified adviser or client.
- AssetArray does not provide guaranteed returns, investment assurances, or fiduciary advisory services in isolation.

### 2. Digital Personal Data Protection (DPDP) Act 2023 Alignment
AssetArray integrates privacy-preserving controls aligned with the DPDP Act 2023:
- **Server-Enforced Authorization**: Client records and cloud backups are partitioned strictly by authenticated user ownership (`ownerId`). Cross-client access attempts are rejected with `403 Forbidden`.
- **Zero Raw PII Exposure to AI Models**: Names, email addresses, phone numbers, permanent account numbers (PAN), Aadhaar numbers (12-digit format), and bank account/IFSC identifiers are redacted or substituted with deterministic anonymized mandating tokens (e.g., `Client Ref #AA-881`) prior to sending prompts to external AI inference providers.
- **Client Right to Erasure**: Advisors have administrative controls to delete client portfolios and associated diagnostic traces.

### 3. Statutory Indian Taxation (Finance Act 2024 / AY 2026-27)
- **Sections 111A, 112A, 112, 50AA, 70, 74**:
  - Listed equity STCG is modeled at **20.0%** (Section 111A).
  - Listed equity LTCG is modeled at **12.5%** (Section 112A) with a statutory annual exemption limit of **₹1,25,000**.
  - Section 70/74 loss set-off hierarchy: Long-Term Capital Loss (LTCL) is strictly restricted to setting off Long-Term Capital Gains (LTCG). Short-Term Capital Loss (STCL) sets off STCG first, followed by LTCG.
  - Specified mutual funds (debt funds with equity <= 35%) acquired after April 1, 2023 are treated as short-term capital assets under Section 50AA and taxed at applicable slab rates.
  - **Zero Synthetic Holding Classification**: If an asset holding lacks a verified acquisition date, it is classified as `DATE_MISSING` with `isLongTerm: null` and `quality: INSUFFICIENT_DATA`. It is never assumed to be short-term or long-term for immediate tax shield calculations.
  - **Disclaimer**: Tax calculations provided by AssetArray are estimates intended for portfolio planning and tax-loss harvesting screening only. They do not constitute formal tax filings or Chartered Accountant audit certificates.

### 4. GIPS 2020 Compliance Limitations
- **TWR Calculation Method**: AssetArray uses a Daily Subperiod Linking approximation (`DAILY_SUBPERIOD_APPROXIMATION`). Daily external cash flows are assumed to occur at the close of the trading day.
- True GIPS compliance requires intra-day revaluation at the exact time of any large external cash flow. In the absence of intra-day sub-period portfolio valuations, the methodology discloses this limitation explicitly.
