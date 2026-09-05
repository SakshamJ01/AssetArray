# AssetArray v3.1 Risk & Benchmark Methodology

## 1. Modern Portfolio Theory (MPT) Risk Metrics

AssetArray computes institutional risk statistics against standardized benchmark registries (Nifty 50, CRISIL Hybrid 65:35, S&P 500, NASDAQ-100, Conservative Debt Hybrid):

### 1.1 Annualized Volatility ($\sigma_p$)
$$\sigma_p = \sqrt{\frac{252}{N-1} \sum_{t=1}^N (R_{p,t} - \bar{R}_p)^2}$$

### 1.2 Beta ($\beta$) and Alpha ($\alpha$)
$$\beta = \frac{\text{Cov}(R_p, R_b)}{\text{Var}(R_b)}$$

$$\alpha_{\text{Jensen}} = (\bar{R}_p - R_f) - \beta \cdot (\bar{R}_b - R_f)$$

Where $R_f$ is the risk-free rate (calibrated to the 91-day Government of India Treasury Bill rate or US 3M T-Bill).

### 1.3 Sharpe Ratio & Sortino Ratio
$$\text{Sharpe} = \frac{\bar{R}_p - R_f}{\sigma_p}$$

$$\text{Sortino} = \frac{\bar{R}_p - R_f}{\sigma_{\text{downside}}}$$

Where downside deviation $\sigma_{\text{downside}}$ measures volatility exclusively on returns below the minimum acceptable return (MAR):
$$\sigma_{\text{downside}} = \sqrt{\frac{252}{N} \sum_{t=1}^N \min(0, R_{p,t} - \text{MAR})^2}$$

### 1.4 Tracking Error & Information Ratio
$$\text{Tracking Error (TE)} = \sqrt{\frac{252}{N-1} \sum_{t=1}^N \left((R_{p,t} - R_{b,t}) - (\bar{R}_p - \bar{R}_b)\right)^2}$$

$$\text{Information Ratio (IR)} = \frac{\bar{R}_p - \bar{R}_b}{\text{Tracking Error}}$$

### 1.5 Up-Market & Down-Market Capture
$$\text{Up-Capture} = \frac{\text{Compound Return of Portfolio in Benchmark Up Periods}}{\text{Compound Return of Benchmark in Up Periods}} \times 100$$

$$\text{Down-Capture} = \frac{\text{Compound Return of Portfolio in Benchmark Down Periods}}{\text{Compound Return of Benchmark in Down Periods}} \times 100$$

---

## 2. High-Water Mark (HWM) Drawdown Engine

Located at `src/services/risk/drawdown.ts`:
- Tracks running peak valuation (High-Water Mark).
- Calculates maximum peak-to-trough decline:
  $$\text{Drawdown}_t = \frac{V_t - \max_{\tau \le t} V_\tau}{\max_{\tau \le t} V_\tau}$$
- Computes:
  - **Max Drawdown (MDD)**
  - **Peak Date and Trough Date**
  - **Recovery Date and Recovery Duration (Days)**
  - **Underwater Duration Series**

---

## 3. Seeded Reproducible Monte Carlo Simulation

Located at `src/services/monteCarlo.ts`:

### 3.1 Mulberry32 Pseudorandom Number Generator
To ensure bit-for-bit auditability and cross-platform consistency between client devices and server verifications, AssetArray utilizes a seeded 32-bit PRNG (Mulberry32) combined with the Box-Muller transformation:

```typescript
function mulberry32(a: number) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}
```

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
- **Probability of Goal Success (%)**
