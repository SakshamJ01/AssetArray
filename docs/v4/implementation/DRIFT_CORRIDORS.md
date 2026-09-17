# AssetArray 4.0 — Drift Corridors Specification

## Drift Corridor Bands
Defines tolerance bands around target asset allocation weights:
- `targetWeightPct`: Benchmark weight (e.g. 50% Equity)
- `lowerBandPct`: Lower tolerance band (e.g. 5% → lower limit = 45%)
- `upperBandPct`: Upper tolerance band (e.g. 5% → upper limit = 55%)

Breaches generate rebalance signals:
- `currentWeightPct > upperLimit` → `OVERWEIGHT` (Triggers `SELL` candidate recommendation)
- `currentWeightPct < lowerLimit` → `UNDERWEIGHT` (Triggers `BUY` candidate recommendation)
