# ASSETARRAY 4.0 — PORTFOLIO PLATFORM & MODEL MANAGEMENT
**Institutional Advisor Platform Product Blueprint**

---

## 1. Core Philosophy: Analytics vs Decision Support vs Execution

AssetArray 4.0 maintains absolute architectural clarity across three distinct portfolio layers:

```
+-------------------------------------------------------------------------------+
| LAYER 1: DETERMINISTIC ANALYTICAL ENGINE                                      |
| • Valuation (Multi-Currency, Multi-Asset)                                     |
| • Performance (TWR, MWR / XIRR, Benchmark Alpha, Tracking Error)              |
| • Multi-Factor Attribution (Asset Allocation vs Security Selection Effect)    |
| • Drift Calculation against Investment Policy Mandate                         |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
| LAYER 2: ADVISOR DECISION SUPPORT & REBALANCING                              |
| • Rebalance Scenario Sandbox (Simulate asset shifts before committing)        |
| • Tax-Aware Lot Selection (Minimizing STCG/LTCG under India Sec 70/74)        |
| • Restriction & Mandate Compliance Checks (Max single-stock / sector caps)    |
| • Model-to-Client Alignment & Rebalance Order Staging                         |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
| LAYER 3: ORDER STAGING & CUSTODIAN EXPORT                                     |
| • Staged Trade Pack Generation (Mutual Fund Switch Slips, Broker Basket CSV)  |
| • Advisor & Client Digital Approval Sign-Off                                  |
| • Reconciliation of Ingested Execution Notes against Staged Orders            |
| (NO autonomous live trading without explicit custodian/broker API agreement) |
+-------------------------------------------------------------------------------+
```

---

## 2. Model Portfolios & Reusable Investment Strategies

AssetArray 4.0 introduces an institutional **Model Portfolio Management Subsystem**, allowing advisory firms to scale standardized investment strategies across hundreds of client accounts.

```
+-------------------------------------------------------------------------------+
| CENTRAL FIRM MODEL LIBRARY (Managed by Investment Analyst / Head of Research) |
+-------------------------------------------------------------------------------+
| 1. "India Growth Leader Model"   -> 75% Large/Midcap Equity, 20% Debt, 5% Gold|
| 2. "Balanced Advantage Model"    -> 50% Dynamic Equity, 45% High-Yield, 5% SGB|
| 3. "Conservative Capital Model"  -> 25% Large Cap, 70% Sovereign Debt, 5% Cash|
| 4. "High-Conviction Tech PMS"    -> 100% Focused Thematic Equity (High Risk)  |
+-------------------------------------------------------------------------------+
                                      |
                         (Assigned with Custom Overrides)
                                      v
+-------------------------------------------------------------------------------+
| CLIENT PORTFOLIO INSTANCES                                                    |
| Client: Vikram Malhotra -> Assigned: "India Growth Leader Model"              |
| Custom Restriction: NO Tobacco Stocks (Excludes ITC from model buy list)      |
| Current Drift: +8.2% in Equity (Triggers Rebalance Signal)                     |
+-------------------------------------------------------------------------------+
```

### Key Model Features
- **Master-to-Instance Linking**: Changes to firm models propagate rebalance signals to all subscribed client portfolios without automatically overriding custom client restrictions.
- **Client Restrictions & Mandate Overrides**: Support for ESG filters, single-stock blacklists, and legacy lock-in restrictions.
- **Model vs Actual Comparison**: Visual side-by-side tracking error, return dispersion, and asset allocation variance.

---

## 3. Tax-Aware Rebalancing Workflow

```
[Drift Detected: Large Cap Equity +8.2% Over Upper Tolerance Band]
                           |
                           v
[Advisor Initiates: "Rebalance to Model Target"]
                           |
                           v
[Tax Lot Optimization Engine Evaluates All Tax Lots]
 ├── Step A: Scan for Capital Loss Lots (STCL / LTCL) to offset realized gains.
 ├── Step B: Select Long-Term Capital Gains lots qualifying for ₹1.25L exemption.
 └── Step C: Avoid short-term lots nearing the 12-month LTCG threshold (Tax cliff).
                           |
                           v
[Generated Rebalance Proposal]
 • Sell: 150 shares TATASTEEL (LTCG ₹45,000 - Exempt)
 • Sell: 40 shares RELIANCE (STCL ₹22,000 - Offsets trading gain)
 • Buy: ₹1,50,000 HDFC Short Duration Debt Fund
 • Estimated Net Tax Outgo: ₹ 0.00 (Tax Saved: ₹ 18,400)
                           |
                           v
[Advisor Approves -> Stages Export File for Custodian / NSE MF Platform]
```

---

## 4. Cash Management & Inflow Allocation
- **Smart Lump-Sum Deployment**: Automatically stages phased Systematic Transfer Plans (STPs) from Liquid Funds into Equity Models over 6 to 12 months.
- **Liquidity Buffers**: Enforces minimum liquid cash reserves (e.g., 3 months of family living expenses) before routing capital to long-term risk assets.
