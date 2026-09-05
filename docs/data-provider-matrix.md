# AssetArray — Data Provider Matrix

**Audit Date**: September 2026  
**Release Family**: 3.3.x  
**Standard**: Real configuration required. No provider is advertised as active unless tested and configured. In live mode (`isDemoMode: false`), missing quotes or history return `UNAVAILABLE` or empty collections (`[]`), never silently falling back to simulated quotes.

---

## Market Data Provider Matrix

| Provider | India Equities | Global Equities | MF / NAV | Real-Time Support | Historical Support | Corporate Actions | Rate Limit / Quota | Commercial Licensing | Configured in Repo? | Live Production Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Finnhub** | Limited / ADRs | US / Global Major | No | WebSocket & REST (1 min delayed on free) | 1-year daily candles (free) | Dividends, Splits | 60 calls/min (Free) | Commercial tier available | Supported via `FINNHUB_API_KEY` | `CONFIGURED` if key set; else `NOT_CONFIGURED` |
| **Alpha Vantage** | NSE/BSE (partial/delayed) | US / Global | No | REST (~15-20 min delayed on standard) | Full daily/weekly/monthly | Stock splits, dividends | 25 requests/day (Free) / 75/min (Paid) | Proprietary; redistribution restricted | Supported via `ALPHA_VANTAGE_API_KEY` | `NOT_CONFIGURED` (default) |
| **Polygon.io** | No (US Only) | US Only | No | Real-time SIP WebSocket (Paid) | Multi-year tick/minute/day | Full corporate actions | 5 API calls/min (Free) / Unlimited (Paid) | Full commercial redistribution available | Adapter architecture ready | `NOT_CONFIGURED` (default) |
| **Financial Modeling Prep (FMP)** | Limited | US / European | Mutual funds (partial) | REST | 30+ years financial statements | Dividends, Earnings, Splits | 250 requests/day (Free) | Commercial tiers required for redistribution | Adapter architecture ready | `NOT_CONFIGURED` (default) |
| **AssetArray Simulation Provider** | Synthetic Indian Equities (RELIANCE, TCS, INFY, HDFCBANK) | Synthetic US Equities (AAPL, MSFT, GOOGL) | Synthetic Index NAVs (NIFTY50, SENSEX) | Simulated ticks (1.5s interval) | Simulated 30-day historical candles | Simulated | Unlimited (Local CPU) | Built-in / Educational & Demo Only | Built-in | **`AVAILABLE (DEMO ONLY)`** |

---

## Priority Alignment for AssetArray (Indian Wealth-Management Advisor Platform)

1. **Priority 1 (Core Domestic Wealth Management)**:
   - Indian Equities (NSE / BSE)
   - Indian Benchmarks (Nifty 50, Nifty Next 50, BSE Sensex)
   - Mutual Fund Daily NAVs (AMFI official feeds)
   - Corporate actions (Bonus, splits, dividend reinvestments)
   - Benchmark history for risk & Sharpe calculations
   - USD/INR FX rates

2. **Priority 2 (Fundamental Analysis & Research)**:
   - Company balance sheets, P&L, quarterly results (BSE/NSE filings)
   - Macroeconomic data (RBI policy rates, CPI inflation)
   - Credible financial disclosures

3. **Priority 3 (Global / Satellite)**:
   - Global equities (US tech ETFs, S&P 500)
   - Commodities (Gold / MCX)
   - *Crypto is explicitly out of scope for core Indian wealth management advisory compliance.*

---

## Live vs. Demo Enforcement Rules

1. **Unknown Quotes**:
   - Querying an unknown symbol (e.g. `UNKNOWN_SYM_XYZ`) in live mode must return `UNAVAILABLE` (`quote.source = "UNAVAILABLE"`, `quote.status = "UNAVAILABLE"`).
   - In live mode, synthetic quotes (`100`, `101`, `0.5%`) are **strictly prohibited**.

2. **Quote Schema Validation**:
   - Quotes with `price < 0`, `NaN`, `Infinity`, or impossible timestamps are rejected at the normalization layer.

3. **Historical Data Isolation**:
   - In live mode, if historical candles are not retrieved from an active market provider, the service returns empty candle array `[]` (`HISTORY_UNAVAILABLE`).
   - The UI displays `"Historical data unavailable — configure market data provider"`.
   - Simulation historical candles are **only** returned when `isDemoMode === true`.

4. **Freshness Tracking**:
   - Every quote is timestamped with `retrievedAt`.
   - Dynamic label emitted: `LIVE · <age>s old`, `DELAYED · <age>m old`, or `STALE · <age>m old`.
