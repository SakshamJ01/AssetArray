# AssetArray v3.1 Analytics Methodology

## 1. True Time-Weighted Return (TWR)

### 1.1 Mathematical Formulation
Time-Weighted Return removes the distorting effects of external cash inflows and outflows ($C_t$), measuring pure investment management skill:

$$R_{\text{TWR}} = \prod_{t=1}^{N} (1 + R_t) - 1$$

Where each sub-period return $R_t$ bounded by external cash flows is computed as:

$$R_t = \frac{V_t^{\text{end}} - (V_t^{\text{start}} + C_t)}{V_t^{\text{start}} + W_t \cdot C_t}$$

Where $W_t \in [0, 1]$ represents the day-weight of the cash flow (Modified Dietz convention, defaulting to $W_t = 0.5$ for mid-day cash flows).

### 1.2 Implementation Details
Located at `src/services/performance/twr.ts`:
- Segments timeline at cash flow boundaries.
- Reconciles daily unit valuation when valuation series is available.
- Eliminates naive cumulative return shortcuts that omit cash flows.

---

## 2. Money-Weighted Return (XIRR)

### 2.1 Mathematical Formulation
The Extended Internal Rate of Return (XIRR) calculates the annualized discount rate $r$ that equates the Net Present Value (NPV) of all irregular cash flows and terminal valuation to zero:

$$\text{NPV}(r) = \sum_{i=1}^{M} \frac{C_i}{(1 + r)^{\frac{d_i - d_0}{365.25}}} = 0$$

Where:
- $C_i$: Cash flow on date $d_i$ (negative for inflows/purchases, positive for outflows/redemptions, terminal value treated as final positive cash flow).
- $d_0$: Date of initial cash flow.

### 2.2 Numerical Solver
Located at `src/services/performance/xirr.ts`:
- Employs the **Newton-Raphson method**:
  $$r_{k+1} = r_k - \frac{\text{NPV}(r_k)}{\text{NPV}'(r_k)}$$
  Where $\text{NPV}'(r)$ is the exact first analytical derivative:
  $$\text{NPV}'(r) = -\sum_{i=1}^{M} \frac{d_i - d_0}{365.25} \cdot \frac{C_i}{(1 + r)^{\frac{d_i - d_0}{365.25} + 1}}$$
- Maximum iterations: 100.
- Convergence tolerance: $|\text{NPV}| < 10^{-7}$.
- **Robustness Fallback**: If derivative approaches zero or divergence occurs, the engine automatically switches to a bounded bisection search across $[-0.999, 10.0]$ with an iterative step of $10^{-6}$.

---

## 3. Brinson-Fachler Performance Attribution

### 3.1 Mathematical Decomposition
AssetArray v3.1 decomposes total active excess return against benchmark profiles (e.g., CRISIL Hybrid 65:35, Nifty 50, S&P 500) into three orthogonal components for each asset category $i$:

$$R_p - R_b = \sum_{i} \left( \text{Alloc}_i + \text{Select}_i + \text{Interact}_i \right)$$

1. **Allocation Effect**: Measures value added by overweighting/underweighting asset classes relative to benchmark returns:
   $$\text{Alloc}_i = (w_{p,i} - w_{b,i}) \cdot (R_{b,i} - R_b)$$
2. **Selection Effect**: Measures value added by picking superior individual securities within an asset class:
   $$\text{Select}_i = w_{b,i} \cdot (R_{p,i} - R_{b,i})$$
3. **Interaction Effect**: Joint effect of non-benchmark allocation weights and active asset selection:
   $$\text{Interact}_i = (w_{p,i} - w_{b,i}) \cdot (R_{p,i} - R_{b,i})$$

### 3.2 Defensibility & Reconciliation Guardrail
Located at `src/services/attribution.ts`:
- Strictly verifies that $\sum_i (\text{Alloc}_i + \text{Select}_i + \text{Interact}_i) \equiv \text{ActiveReturn} \pm 10^{-5}$.
- Generates institutional explanations specifying whether outperformance was driven by macro sector allocation or bottom-up security selection.

---

## 4. Multi-Pillar Explainable Health Score

### 4.1 Seven Factor Methodology
Located at `src/services/health/`:

| Factor | Weight | Evaluation Principle | Key Metrics |
|---|---|---|---|
| **Data Quality** | 10% | Provenance, pricing freshness, identifier hygiene | % verified prices, ticker presence |
| **Diversification** | 20% | Entropy & Herfindahl-Hirschman Index across asset classes | Active classes $\ge 3$, HHI $< 2500$ |
| **Concentration Risk** | 20% | Single asset and top-3 asset exposure penalties | Largest asset $\le 15\%$, Top 3 $\le 45\%$ |
| **Geographic & Currency** | 15% | Global vs domestic macro exposure | Domestic, International, Currency splits |
| **Liquidity Buffer** | 15% | Cash & cash-equivalent runway vs emergency floor | Months of liquidity, cash reserve $\%$ |
| **Liability Management** | 10% | Debt-to-Asset ratio leverage safety | Leverage ratio $< 30\%$ |
| **Goal Alignment** | 10% | Goal funding progress and on-track status | Funded percentage, time-horizon match |

### 4.2 Score Normalization & Rating Scale
- Overall Score: $\sum_{j=1}^{7} (\text{FactorScore}_j \times \text{Weight}_j)$, rounded to $[0, 100]$.
- **Grades**:
  - $\ge 85$: `Institutional`
  - $70 - 84$: `Balanced`
  - $50 - 69$: `Moderate Risk`
  - $< 50$: `High Fragility`
- **Audit Evidence**: Every factor outputs an `evidence` array containing exact numerical metrics and confidence states (`HIGH`, `MEDIUM`, `LOW`, `INSUFFICIENT_DATA`).
