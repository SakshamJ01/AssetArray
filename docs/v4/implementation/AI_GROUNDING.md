# AssetArray V4.0 — Phase 4: Numerical Grounding & Claim Validation

## 1. Grounding Engine (`src/services/v4/ai/groundingEngine.ts`)
The `V4GroundingEngine` validates every statement in generated responses against the deterministic `AiContextSnapshot`.

## 2. Claim Classification
- `VERIFIED_NUMERIC`: Figures that match verified ledger, risk, tax, or health calculations within explicit tolerances.
- `VERIFIED_FACT`: Factual statements grounded in source documents.
- `SOURCE_DERIVED`: Direct synthesis from provided research evidence.
- `MODEL_INTERPRETATION`: Cognitive analysis and thesis evaluation.
- `MODEL_SUGGESTION`: Recommended follow-ups for advisor review.
- `UNSUPPORTED`: Hallucinated or unverified numbers (flagged with explicit disclaimers).

## 3. Negative Knowledge Enforcement
When queried about unheld assets (e.g. asking for Bitcoin analysis for an equity-only client), the grounding engine detects that the asset is not in the portfolio and refuses to hallucinate fictitious holdings, returning `INSUFFICIENT_EVIDENCE`.
