# ASSETARRAY 4.0 — INVESTMENT RESEARCH PLATFORM
**Institutional Advisor Platform Product Blueprint**

---

## 1. Professional Research Architecture: Fact vs Interpretation

Institutional investment research must separate hard factual disclosures from analyst opinions and speculative forecasts.

```
+-------------------------------------------------------------------------------+
| THE RESEARCH KNOWLEDGE PYRAMID                                                |
+-------------------------------------------------------------------------------+
| LEVEL 4: PROJECTIONS (Scenario forward simulations, consensus estimates)     |
| LEVEL 3: INTERPRETATION (Analyst commentary, thesis notes, risk synthesis)   |
| LEVEL 2: OFFICIAL METRICS (Audited financials, quarterly reports, NAVs, PE)   |
| LEVEL 1: RAW GROUND TRUTH (Exchange filings, MCA filings, SEBI circulars)     |
+-------------------------------------------------------------------------------+
```

---

## 2. Multi-Source Pipeline & Retrieval Architecture

```
[User Query: "Evaluate Tata Motors EV commercial outlook & debt maturity"]
                                 |
                                 v
[Research Query Orchestrator]
 ├── Parallel Worker A: Fetch Financial Fundamentals (P/E, Debt/Equity, ROCE, FCF)
 ├── Parallel Worker B: Scrape Official Exchange Filings & Investor Presentations
 ├── Parallel Worker C: Retrieve Recent Quarterly Earnings Call Transcripts
 └── Parallel Worker D: Scan Macro & Industry News (EV subsidies, raw lithium price)
                                 |
                                 v
[Deduplication, Ranking & Source Verification Engine]
 ├── Strips duplicate syndicate news releases.
 ├── Scores primary sources (BSE/NSE/Company) higher than secondary aggregators.
 ├── Extracts quantitative tables and dates.
                                 |
                                 v
[Structured Synthesis LLM (Grounding Constrained)]
 Formats into standardized 4-Part Institutional Research Memo:
 1. Executive Summary & Thesis
 2. Financial Health & Debt Maturity Profile
 3. Catalyst & Risk Matrix
 4. Source Attribution & Footnotes
                                 |
                                 v
[Advisor Research Notebook]
 Advisor highlights key findings, adds internal firm investment rating (BUY/HOLD),
 and saves to Firm Model Portfolio Research Library.
```

---

## 3. Provenance & Citation Standards
Every single number cited in a research note must carry a verifiable citation badge:
- `[Source: BSE Corporate Announcement dated 14 Jan 2026]`
- `[Source: AMFI Monthly Portfolio Disclosure dated 31 Dec 2025]`
- `[Source: RBI Monetary Policy Committee Minutes dated 08 Feb 2026]`

If a data point cannot be grounded in an official public filing or licensed data feed, it is explicitly watermarked as `UNVERIFIED / THIRD-PARTY ESTIMATE`.
