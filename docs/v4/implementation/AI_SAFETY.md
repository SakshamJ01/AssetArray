# AssetArray V4.0 — Phase 4: AI Safety & Fiduciary Boundaries

## 1. Fiduciary Safety Principles
1. **No Autonomous Financial Mutation**: AI is forbidden from mutating trade orders, changing portfolio balances, modifying tax lots, or executing decisions.
2. **Human-in-the-Loop (HITL)**: All generated outputs (drafts, briefs, challenges) have `requiresHumanReview: true`.
3. **No Claim of Legal/Tax Certification**: Language strictly states "Advisory use only. Does not constitute certified tax or legal advice."
4. **PII Sanitization**: Sensitive identifiers (PAN, Aadhaar, bank accounts, phones) are sanitized before external model transmission.
5. **Audit Event Logging**: AI operations log `AI_REQUESTED`, `AI_COMPLETED`, and `AI_FAILED` events via the Phase 1 `AuditLogger`.
