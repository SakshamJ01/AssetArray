# ASSETARRAY V3.3.1 — COMPLIANCE & STATUTORY DISCLOSURES

## Legal & Regulatory Stance

AssetArray is an advisor operating system and decision-support software built to assist registered financial advisors, wealth managers, multi-family offices, and chartered accountants.

### 1. SEBI Regulatory Positioning (India)
AssetArray provides **suitability-support tooling** and **portfolio diagnostic infrastructure**. It is **not** an automated trading platform, a SEBI-registered Investment Adviser (RIA), nor a Research Analyst (RA).
- All investment recommendations, rebalancing orders, and asset allocation decisions require independent professional review and explicit execution authorization by a qualified adviser or client.
- AssetArray does not provide guaranteed returns, investment assurances, or fiduciary advisory services in isolation.
- The use of AssetArray does not confer SEBI-compliant status onto an entity; compliance remains the sole responsibility of the registered firm.

### 2. Digital Personal Data Protection (DPDP) Alignment
AssetArray integrates privacy-preserving controls aligned with the DPDP Act 2023:
- **Server-Enforced Authorization**: Client records and cloud backups are partitioned strictly by authenticated user ownership (`ownerId`). Cross-client access attempts are rejected with `403 Forbidden`.
- **Zero Raw PII Exposure to AI Models**: Names, email addresses, phone numbers, permanent account numbers (PAN), Aadhaar numbers (12-digit format), and bank account/IFSC identifiers are redacted or substituted with deterministic anonymized mandating tokens (e.g., `Client Ref #AA-881`) prior to sending prompts to external AI inference providers.
- **Client Right to Erasure**: Advisors have administrative controls to delete client portfolios and associated diagnostic traces.
- **Scope**: While technical safeguards align with DPDP data minimization principles, AssetArray does not claim statutory DPDP certification; organizational data fiduciary obligations remain with the deploying entity.

### 3. Statutory Indian Taxation (Finance Act 2024 / AY 2026-27)
- **Sections 111A, 112A, 112, 50AA, 70, 74**:
  - Listed equity STCG is modeled at **20.0%** (Section 111A).
  - Listed equity LTCG is modeled at **12.5%** (Section 112A) with a statutory annual exemption limit of **₹1,25,000**.
  - Section 70/74 loss set-off hierarchy: Long-Term Capital Loss (LTCL) is strictly restricted to setting off Long-Term Capital Gains (LTCG). Short-Term Capital Loss (STCL) sets off STCG first, followed by LTCG.
  - Specified mutual funds (debt funds with equity <= 35%) acquired after April 1, 2023 are treated as short-term capital assets under Section 50AA and taxed at applicable slab rates.
  - **Zero Synthetic Holding Classification**: If an asset holding lacks a verified acquisition date, it is classified as `DATE_MISSING` with `isLongTerm: null` and `quality: INSUFFICIENT_DATA`. It is never assumed to be short-term or long-term for immediate tax impact calculations.
  - **Disclaimer**: Tax calculations provided by AssetArray are illustrative scenario estimates intended for portfolio planning and tax-loss harvesting screening only. They do not constitute formal tax filings, chartered accountant certificates, or guaranteed cash savings.

### 4. GIPS® Performance Methodology Alignment
- **Software Vendor Clarification**: AssetArray is a software application and is not itself claiming GIPS compliance, certification, or verification. Official GIPS guidelines stipulate that software vendors cannot claim GIPS compliance; only investment management firms managing client assets can claim compliance for their composites.
- **TWR Calculation Method**: AssetArray uses a Daily Subperiod Linking approximation (`DAILY_SUBPERIOD_APPROXIMATION`) informed by GIPS concepts. Daily external cash flows are modeled at the close of the trading day.
- **Data Limitations**: Where intra-day sub-period portfolio valuations or exact transaction timing are unavailable, AssetArray flags the calculation method as a subperiod approximation rather than claiming full standard compliance.
- **Statutory Disclosure**: *AssetArray provides performance analytics using methodologies informed by the Global Investment Performance Standards (GIPS®). AssetArray is not itself claiming GIPS compliance, certification, or verification. Firms using AssetArray remain responsible for their own policies, data, calculations, disclosures, and applicable GIPS requirements.*
