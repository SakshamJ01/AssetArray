# ASSETARRAY 4.0 — DATA PROVIDER & FEEDS STRATEGY
**Institutional Advisor Platform Product Blueprint**

---

## 1. Provider Tier Matrix: Free-First & India-First Architecture

AssetArray 4.0 is engineered so that an independent advisor or boutique RIA can operate the full platform using free, official, and low-cost public data streams without requiring expensive multi-thousand-dollar data terminals.

```
+----------------------------------------------------------------------------------------------------+
| DATA PROVIDER ARCHITECTURE MATRIX                                                                  |
+-------------------+-----------------------------+-------------+------------+-----------------------+
| Data Domain       | Primary Provider / Source   | Tier        | Freshness  | Fallback Provider     |
+-------------------+-----------------------------+-------------+------------+-----------------------+
| Indian Equities   | Yahoo Finance / Open Quotes | Free / Open | Real-Time* | AlphaVantage / Cache  |
| Global Equities   | Finnhub / Yahoo Finance     | Free Tier   | 15-min     | AlphaVantage          |
| Indian MF NAVs    | AMFI Official Open Data     | FREE PUBLIC | Daily End  | Local NAV Cache       |
| Macro & Rates     | RBI DBIE / FRED             | FREE PUBLIC | Daily/Mo   | Central Bank API      |
| Financial Stmts   | Yahoo Finance / SEC EDGAR   | Free / Open | Quarterly  | Company Disclosures   |
| Corporate Actions | NSE/BSE Public RSS          | FREE PUBLIC | Daily      | Ingested CAS Records  |
| Currency (FX)     | Open Exchange Rates / Exch  | Free Tier   | Hourly     | Fixed Rate Fallback   |
| Crypto (Optional) | CoinGecko Free API          | Free Tier   | 5-min      | Binance Public API    |
+-------------------+-----------------------------+-------------+------------+-----------------------+
```
*\*Subject to standard exchange delayed quote terms where applicable.*

---

## 2. Indian Statutory & Public Source Integration

1. **AMFI (Association of Mutual Funds in India)**:
   - Automated nightly ingestion of the official daily NAV text feed (`portal.amfiindia.com/spages/NAVAll.txt`).
   - Maps 40,000+ active and historical mutual fund scheme codes, ISINs, and NAVs with 100% statutory accuracy.
2. **Reserve Bank of India (RBI Database on Indian Economy - DBIE)**:
   - Direct ingestion of benchmark repo rates, T-Bill yields (91-day, 182-day, 364-day), 10-Year Indian G-Sec benchmark yield, and inflation (CPI/WPI) metrics.
3. **NSE / BSE Corporate Announcements & Filings**:
   - Ingestion of public RSS feeds for dividend announcements, stock splits, bonus issues, and AGM dates.

---

## 3. Resilience, Caching & Degraded Offline Modes

```
+-------------------------------------------------------------------------------+
| THE THREE-TIER CACHING & RESILIENCE CHAIN                                     |
|                                                                               |
| [1. In-Memory Redis / Memory Cache] (10-second TTL for live quotes)           |
|                       | (Cache Miss / API Timeout)                            |
|                       v                                                       |
| [2. MongoDB Persistent Daily Snapshot] (Last known valid closing price)       |
|                       | (Database Offline / Air-gapped)                       |
|                       v                                                       |
| [3. Client-Side IndexedDB / Local Storage] (Client last synchronized state)   |
+-------------------------------------------------------------------------------+
```

### Truthful UI State Indicators
When external data feeds experience rate limits or downtime, the UI never fabricates numbers or displays blank errors. It clearly marks data freshness:
- `[🟢 Live: 14:32 IST]` (Fresh real-time feed)
- `[🟡 Stale: As of Yesterday 15:30 IST (Exchange API Offline)]`
- `[🔴 Disconnected: Using Local Cached Valuation]`
