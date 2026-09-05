# Advisor Decision Journal & Governance Record

## Purpose & Governance Context
Under wealth advisory best practices and suitability frameworks, portfolio adjustments and allocation shifts should be documented with underlying evidence and clear rationale. The **Advisor Decision Journal** provides an auditable, structured ledger of strategic decisions recorded by advisors.

---

## Core Principle: Human in the Loop
> **AI may synthesize. The advisor decides. The system records the advisor's decision.**

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
  issue: string; // The condition triggering the review
  evidence: string; // Quantitative metric (e.g. 27.4% weight vs 20% limit)
  decision: string; // Specific allocation or rebalancing decision taken
  rationale: string; // Economic and governance reasoning
  advisorFollowUp: string; // Planned review date and action
  status: "RECORDED" | "PENDING_EXECUTION" | "EXECUTED";
  actionId?: string;
  createdAt: string;
}
```

---

## Automatic Timeline Dispatch
Whenever a decision is committed to the journal, the system automatically emits a `DECISION_LOGGED` domain activity event to the client's governance activity timeline.
