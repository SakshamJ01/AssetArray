# ASSETARRAY 4.0 — RISK, TAX & GOAL ENGINES V4
**Institutional Advisor Platform Product Blueprint**

---

## 1. Risk V4: From Analytical Metrics to Advisor Decisions

AssetArray 4.0 eliminates "metric clutter". Every single risk indicator exists solely to drive a concrete advisor decision.

```
+----------------------------------------------------------------------------------------------------+
| RISK METRIC DECISION MATRIX                                                                        |
+----------------------+--------------------+---------------------+----------------------------------+
| Metric               | Primary Persona    | Decision Trigger    | Advisor Action Taken             |
+----------------------+--------------------+---------------------+----------------------------------+
| Value-at-Risk (95%)  | Senior Advisor     | Exceeds 15% 1Y VaR  | Hedge with Long-Duration G-Secs  |
| Expected Shortfall   | Investment Analyst | CVaR > 22% in shock | Rebalance out of Microcaps       |
| Max Drawdown         | Relationship Mgr   | Exceeds Client IPS  | Initiate Risk Review Meeting     |
| Single-Stock Cap     | Operations / Super | Holding > 10% AUM   | Flag Concentration Breach        |
| Sector Exposure      | Portfolio Lead     | Sector > 25% AUM    | Trim sector over-weights         |
| Liquidity Horizon    | Wealth Planner     | T+1 Liquidity < 5%  | Replenish Liquid Fund buffer     |
+----------------------+--------------------+---------------------+----------------------------------+
```

### Institutional Stress-Testing & Crisis Scenarios
The risk engine simulates real historical crisis distributions:
- **2008 Global Financial Crisis**: Global equity collapse, liquidity freeze, flight to USD/Sovereign debt.
- **2020 COVID Shock**: Sudden 30% equity plunge followed by rapid fiscal recovery.
- **2022 Inflation & Rate Spike**: Equity multiple compression and bond yield surge.
- **Custom Advisor Scenario**: "Simulate Crude Oil @ $120/bbl + INR Depreciation to 92 vs USD".

---

## 2. Tax Intelligence V4: Indian Statutory Optimization

The Indian tax framework requires exact adherence to statutory provisions under the Income Tax Act, 1961.

```
+----------------------------------------------------------------------------------------------------+
| INDIAN TAX ARCHITECTURE (Finance Act 2024 / FY 2025-26 Rules)                                      |
+----------------------------------------------------------------------------------------------------+
| Asset Class            | Holding Period (LTCG) | Short-Term Tax Rate | Long-Term Tax Rate (Exemption)|
+------------------------+-----------------------+---------------------+-------------------------------+
| Listed Equity & Eq MF  | > 12 Months           | 20% (STCG)          | 12.5% (Exempt up to ₹1.25L)   |
| Specified Mutual Funds | Any Period            | Slab Rate (STCG)    | Slab Rate (No LTCG benefit)   |
| Unlisted Shares & RE   | > 24 Months           | Slab Rate           | 12.5% (No Indexation)         |
| Sovereign Gold Bonds   | Held to Maturity      | N/A                 | 100% Tax Exempt at Redemption |
+------------------------+-----------------------+---------------------+-------------------------------+
```

### Section 70 & Section 74 Loss Harvesting Workflow
1. **Intra-Head Set-off (Sec 70)**: Short-Term Capital Losses (STCL) can be set off against both STCG and LTCG. Long-Term Capital Losses (LTCL) can ONLY be set off against LTCG.
2. **Carry-Forward Loss Ledger (Sec 74)**: Tracks unabsorbed losses across an 8-year statutory window, ensuring no client loses eligible offsets against future capital gains.
3. **Year-End Harvesting Sweep**: Deterministic scan in Q4 (Jan–March) identifying loss-making positions to realize and reinvest, saving clients direct tax cash.

---

## 3. Goals V4: Goal Feasibility & Actionable Remediation

AssetArray 4.0 transforms Goals from a static compound interest calculator into an **Active Wealth Planning Lifecycle Engine**.

```
[Goal: Daughter's Foreign Education in 2027 — Target: ₹1.5 Crore]
                                |
                                v
[Deterministic Monte Carlo & Cash-Flow Engine]
 Current Corpus: ₹ 65 Lakh | Ongoing SIP: ₹ 75,000 / month | Expected Return: 11.5%
 Computed Probability of Success: 64% (ALERT: Goal At-Risk / Target Threshold is 80%)
                                |
                                v
[Goal Remediation Recommendation Options]
 ├── Option A: Increase Monthly SIP by ₹ 22,500 (Success Probability -> 84%)
 ├── Option B: Reallocate ₹ 15 Lakh from Idle Savings to Target Strategy (Probability -> 88%)
 └── Option C: Extend Goal Horizon by 1 Year to 2028 (Probability -> 92%)
                                |
                                v
[Advisor Selects Option A -> Generates Client Goal Advice Memo & SIP Mandate Slip]
```

### Dynamic Goal Glide-Paths
As a goal approaches its maturity year (e.g., within 24 months of tuition payment), the engine automatically triggers a **De-risking Signal**, staging a systematic transfer from Volatile Equities into Ultra-Short Duration Debt and Liquid Funds to lock in the target capital.
