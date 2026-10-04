# Honest Analytics & Empty State Integrity

In wealth management, risk models, and portfolio calculation engines:

1. **Zero / Insufficient Holdings**: Never fall back to simulated, hardcoded, or fabricated metrics (e.g. default fragility scores like 30/100, synthetic alpha, or arbitrary Brinson-Fachler attribution percentages) when portfolio holdings are absent or insufficient.
2. **Explicit Status Contracts**: Return explicit statuses such as `INSUFFICIENT_DATA`, `HISTORY_UNAVAILABLE`, or `NO_HOLDINGS`.
3. **UI Transparency**: UI components must render honest dashed empty states, clear explanatory guidance, or "NO DATA" badges rather than misleading numeric gauges or mock figures.
