# Fiduciary Decision Journal & Audit Trail

## Purpose & Regulatory Context
Under fiduciary wealth advisory guidelines and SEBI regulations, investment decisions and asset allocation shifts must be documented with underlying evidence and clear rationale. The **Decision Journal** provides an auditable, immutable ledger of all strategic decisions made by advisors.

---

## Core Principle: Human in the Loop
> **AI may propose. The advisor decides. The system records the advisor's decision.**

AI models never execute portfolio transactions or generate client-facing advice autonomously. Every decision requires explicit human advisor sign-off.

---

## Decision Record Schema
```typescript
interface AdvisorDecision {
  id: string;
  date: string; // ISO YYYY-MM-DD
  clientId: string;
  clientName: string;
  portfolioId?: string;
  issue: string; // The strategic condition triggering the review
  evidence: string; // Quantitative metric (e.g. 27.4% weight vs 20% limit)
  decision: string; // Specific allocation or rebalancing decision taken
  rationale: string; // Economic/fiduciary reasoning
  advisorFollowUp: string; // Planned review date and action
  status: "RECORDED" | "PENDING_EXECUTION" | "EXECUTED";
  actionId?: string;
  createdAt: string;
}
```

---

## Automatic Timeline Dispatch
Whenever a decision is committed to the journal, the system automatically emits a `DECISION_LOGGED` domain activity event to the client's fiduciary timeline.
