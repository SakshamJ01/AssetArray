# AssetArray v3.2 Risk & Benchmark Methodology

## 1. Modern Portfolio Theory (MPT) Risk Metrics & Mathematical Guardrails

AssetArray computes institutional risk statistics against standardized benchmark registries (Nifty 50, CRISIL Hybrid 65:35, S&P 500, NASDAQ-100, Conservative Debt Hybrid):

### 1.1 Annualized Volatility ($\sigma_p$)
$$\sigma_p = \sqrt{\frac{252}{N-1} \sum_{t=1}^N (R_{p,t} - \bar{R}_p)^2}$$

### 1.2 Beta ($\beta$) and Alpha ($\alpha$)
$$\beta = \frac{\text{Cov}(R_p, R_b)}{\text{Var}(R_b)}$$

$$\alpha_{\text{Jensen}} = (\bar{R}_p - R_f) - \beta \cdot (\bar{R}_b - R_f)$$

Where $R_f$ is the risk-free rate (calibrated to the 91-day Government of India Treasury Bill rate or US 3M T-Bill).
- **Zero-Volatility Guardrail**: If benchmark variance $\text{Var}(R_b) \le 10^{-8}$ or annualized benchmark volatility $\le 0.01\%$, Beta and Alpha are mathematically undefined and return `null` with explicit warnings.

### 1.3 Sharpe Ratio & Sortino Ratio
$$\text{Sharpe} = \frac{\bar{R}_p - R_f}{\sigma_p}$$

$$\text{Sortino} = \frac{\bar{R}_p - R_f}{\sigma_{\text{downside}}}$$

Where downside deviation $\sigma_{\text{downside}}$ measures volatility exclusively on returns below the minimum acceptable return (MAR):
$$\sigma_{\text{downside}} = \sqrt{\frac{252}{N} \sum_{t=1}^N \min(0, R_{p,t} - \text{MAR})^2}$$
- **Zero-Volatility Guardrail**: If $\sigma_p = 0$ or $\sigma_{\text{downside}} = 0$, Sharpe and Sortino ratios return `null` instead of $\pm\infty$ or deceptive zeroes.

### 1.4 Tracking Error & Information Ratio
$$\text{Tracking Error (TE)} = \sqrt{\frac{252}{N-1} \sum_{t=1}^N \left((R_{p,t} - R_{b,t}) - (\bar{R}_p - \bar{R}_b)\right)^2}$$

$$\text{Information Ratio (IR)} = \frac{\bar{R}_p - \bar{R}_b}{\text{Tracking Error}}$$
- **Zero Tracking Error Guardrail**: If $\text{TE} \le 10^{-8}$, Information Ratio returns `null`.

### 1.5 Up-Market & Down-Market Capture
$$\text{Up-Capture} = \frac{\text{Compound Return of Portfolio in Benchmark Up Periods}}{\text{Compound Return of Benchmark in Up Periods}} \times 100$$

$$\text{Down-Capture} = \frac{\text{Compound Return of Portfolio in Benchmark Down Periods}}{\text{Compound Return of Benchmark in Down Periods}} \times 100$$

---

## 2. High-Water Mark (HWM) Drawdown & Recovery Engine

Located at `src/services/risk/drawdown.ts`:
- Tracks running peak valuation (High-Water Mark).
- Calculates maximum peak-to-trough decline:
  $$\text{Drawdown}_t = \frac{V_t - \max_{\tau \le t} V_\tau}{\max_{\tau \le t} V_\tau}$$
- Computes:
  - **Max Drawdown (MDD)**
  - **Peak Date and Trough Date**
  - **Recovery Status**: Marked explicitly as `RECOVERED` or `NOT_RECOVERED`. The engine never fabricates speculative recovery dates for ongoing underwater episodes.
  - **Recovery Duration (Days)**: Calculated only if `recoveryStatus === "RECOVERED"`.
  - **Underwater Duration (Days)**: Cumulative calendar days portfolio remains below previous HWM peak.

---

## 3. Seeded Reproducible Monte Carlo Simulation

Located at `src/services/monteCarlo.ts`:

### 3.1 Mulberry32 Pseudorandom Number Generator
To ensure bit-for-bit auditability and cross-platform consistency between client devices and server verifications, AssetArray utilizes a seeded 32-bit PRNG (Mulberry32) combined with the Box-Muller transformation.

### 3.2 Stochastic Asset Path Projection
Paths are simulated via Geometric Brownian Motion with drift and volatility:
$$S_{t+\Delta t} = S_t \exp\left( \left(\mu - \frac{1}{2}\sigma^2\right)\Delta t + \sigma \sqrt{\Delta t} Z \right)$$

### 3.3 Percentile Distribution
Simulates 1,000 iterations over 1 to 30 year horizons, reporting:
- **P5 (Downside Tail Risk)**
- **P25 (Conservative)**
- **P50 (Median Expected Corpus)**
- **P75 (Optimistic)**
- **P95 (Upper Bull Case)**
- **Probability of Goal Success (%)**: Exposed as rounded integers with explicit confidence levels (`HIGH`, `MEDIUM`, `LOW`).

---

## 4. Empirical Macro Scenario Engine (Sandbox Immutability)

Located at `src/services/scenarioEngine.ts`:
- Replaced heuristic step functions with an empirical asset-weighted covariance model:
  - Equities: Full market beta exposure ($\beta \approx 1.0$).
  - Fixed Income / Debt: Low duration sensitivity ($\beta \approx 0.15$).
  - Liquid Cash: Capital preservation ($\beta = 0.0$).
  - Gold / Alternatives: Flight-to-safety buffering ($\beta \approx -0.10$).
- **Zero Production Mutation**: Scenarios operate strictly on cloned in-memory representations. Production client portfolios are never altered.
