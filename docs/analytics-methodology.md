# AssetArray v3.2 Analytics Methodology

## 1. Time-Weighted Return (TWR) & GIPS 2020 Timing Disclosures

### 1.1 Mathematical Formulation
Time-Weighted Return removes the distorting effects of external cash inflows and outflows ($C_t$), measuring pure investment management skill:

$$R_{\text{TWR}} = \prod_{t=1}^{N} (1 + R_t) - 1$$

Where each sub-period return $R_t$ bounded by external cash flows is computed as:

$$R_t = \frac{V_t^{\text{end}} - C_t}{V_t^{\text{start}}} - 1$$

### 1.2 Institutional Timing Assumptions & GIPS 2020 Alignment
Located at `src/services/performance/twr.ts`:
- **Methodology Identifier**: `twr-gips-2020-v3.2`
- **Cash-Flow Timing Assumption**: Cash flows are assumed to occur at the end of the day (`END_OF_DAY`).
- **GIPS 2020 2.A.24 Disclosure**: While true GIPS 2020 compliance requires intra-day portfolio revaluation at the exact timestamp of any external cash flow, daily valuation feeds require a daily subperiod approximation (`DAILY_SUBPERIOD_APPROXIMATION`).
- **Non-Positive Starting NAV**: If initial portfolio NAV is zero or negative without an external capital inflow, the engine refuses to manufacture return numbers and marks `quality: INSUFFICIENT_DATA`.

---

## 2. Money-Weighted Return (XIRR) & Numerical Stability

### 2.1 Mathematical Formulation
The Extended Internal Rate of Return (XIRR) calculates the annualized discount rate $r$ that equates the Net Present Value (NPV) of all irregular cash flows and terminal valuation to zero:

$$\text{NPV}(r) = \sum_{i=1}^{M} \frac{C_i}{(1 + r)^{\frac{d_i - d_0}{365.25}}} = 0$$

Where:
- $C_i$: Cash flow on date $d_i$ (positive for inflows/deposits, negative for outflows/withdrawals, terminal value treated as positive cash flow).
- $d_0$: Date of initial cash flow.

### 2.2 Numerical Solver & Adversarial Invariants
Located at `src/services/performance/xirr.ts`:
- **Hybrid Solver**: Combines Newton-Raphson iterations with analytical first derivative and bounded bisection fallback across $[-0.999, 100.0]$.
- **Catastrophic Loss Invariant**: If ending valuation drops to zero and no distributions were made, the engine directly resolves $r = -1.0$ ($-100.0\%$) with `converged: true`, bypassing infinite loops or zero-division traps.
- **Descartes' Rule of Signs**: Flags non-conventional cash flow sequences with multiple sign changes, warning advisors that multiple real roots may exist.
- **Residual Verification**: Every convergent solution verifies $|\text{NPV}(r)| \le 10^{-4}$ against total capital invested.

---

## 3. Brinson-Fachler Performance Attribution

### 3.1 Mathematical Decomposition
AssetArray v3.2 decomposes total active excess return against benchmark profiles (e.g., CRISIL Hybrid 65:35, S&P 500) into three orthogonal components for each asset category $i$:

$$R_p - R_b = \sum_{i} \left( \text{Alloc}_i + \text{Select}_i + \text{Interact}_i \right)$$

1. **Allocation Effect**: $(w_{p,i} - w_{b,i}) \cdot (R_{b,i} - R_b)$
2. **Selection Effect**: $w_{b,i} \cdot (R_{p,i} - R_{b,i})$
3. **Interaction Effect**: $(w_{p,i} - w_{b,i}) \cdot (R_{p,i} - R_{b,i})$

### 3.2 Defensibility & Cross-Currency Provenance
Located at `src/services/attribution.ts`:
- Strictly verifies that $\sum_i (\text{Alloc}_i + \text{Select}_i + \text{Interact}_i) \equiv \text{ActiveReturn} \pm 10^{-4}$.
- **Cross-Currency Guardrail**: If portfolio base currency (e.g. `INR`) does not match benchmark currency (e.g. `USD`), the engine raises an explicit `Currency mismatch` warning, tags FX treatment as `UNHEDGED_BASE`, and lowers data quality to `MEDIUM`.

---

## 4. Multi-Pillar Explainable Health Score

Located at `src/services/health/`:
1. **Data Quality** (10%): Provenance, pricing freshness, identifier hygiene.
2. **Diversification** (20%): Entropy & Herfindahl-Hirschman Index across asset classes.
3. **Concentration Risk** (20%): Single asset and top-3 asset exposure penalties.
4. **Geographic & Currency** (15%): Global vs domestic macro exposure.
5. **Liquidity Buffer** (15%): Cash & cash-equivalent runway vs emergency floor.
6. **Liability Management** (10%): Debt-to-Asset ratio leverage safety.
7. **Goal Alignment** (10%): Goal funding progress and time-horizon match.

---

## 5. Unified Net Worth Desk (Anti-Double-Counting)

Located at `src/services/netWorth.ts`:
- Strictly enforces $\text{Net Worth} = \text{Total Assets} - \text{Total Liabilities}$.
- **Caller Immutability**: All input liabilities and accounts are cloned defensively; caller arrays are never mutated in place.
- **Double-Counting Elimination**: When an account balance is synchronized from an external depository or broker and individual underlying security holdings are already present, the engine reconciles positions to prevent inflating asset totals twice.

---

## 6. Smart Alerts Governance & Lifecycle

Located at `src/services/smartAlerts.ts`:
- **Lifecycle States**: `ACTIVE`, `ACKNOWLEDGED`, `SNOOZED`, `RESOLVED`.
- **Deduplication Cooldown**: Suppresses alert storms when an identical rule condition triggers during an active snooze window or within 24 hours of an advisor resolving the condition.
