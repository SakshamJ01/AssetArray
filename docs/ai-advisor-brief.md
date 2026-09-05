# Daily AI Advisor Brief & Grounding Methodology

## Strict Grounding Principle
The Daily AI Advisor Brief synthesizes operational priorities, active alerts, and market context without hallucination.

### Non-Negotiable Rules:
1. **The AI does NOT calculate numerical values**: Total AUM, client counts, return percentages, tax loss amounts, and probabilities are calculated strictly by the deterministic financial engines.
2. **Every numeric claim must map to a deterministic source metric**:
   ```typescript
   interface GroundedMetricClaim {
     sourceMetric: string; // e.g. "advisor.openCriticalAlerts"
     value: number | string; // e.g. 3
     unit?: string; // e.g. "alerts"
     asOf: string; // ISO timestamp
     methodologyVersion: string; // "daily-advisor-brief-grounding-v3.3"
   }
   ```
3. **PII Sanitization**: Brief context inputs are scrubbed of Indian Aadhaar numbers, PAN, bank account numbers, and sensitive client notes prior to synthesis.

---

## Example Payload Structure
```json
{
  "date": "2026-09-05",
  "headline": "3 Critical Alerts Require Immediate Review Today",
  "summary": "Fiduciary operational briefing for 2026-09-05. 3 critical risk breaches detected across active client portfolios. 4 client mandates require tactical rebalancing or scheduled review.",
  "openCriticalAlerts": 3,
  "openHighPriorityTasks": 5,
  "clientsNeedingReview": 4,
  "goalWarnings": 2,
  "taxOpportunities": 3,
  "groundedClaims": [
    {
      "sourceMetric": "advisor.openCriticalAlerts",
      "value": 3,
      "unit": "alerts",
      "asOf": "2026-09-05T10:00:00.000Z",
      "methodologyVersion": "daily-advisor-brief-grounding-v3.3"
    }
  ]
}
```
