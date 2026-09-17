# AssetArray V4.0 — Phase 3: Advisor Workflow Layer

## Overview
The Advisor Workflow Layer is the operational interface of AssetArray V4.0. It converts the trusted calculations produced by the Phase 2 Computation Layer (Reconciliation, Drift Corridors, Rebalancing Proposals, Tax-Lot Normalization, and Goal Probabilities) into a structured, human-in-the-loop advisor workflow.

## Core Operational Loop
```
DATA (Phase 1 & 2)
  ↓
INSIGHT (Discrepancy / Drift / Tax Opportunity)
  ↓
DECISION (Fiduciary Proposal / Rationale)
  ↓
ACTION (Human Approval / Task Creation)
  ↓
APPROVAL (Authorized Fiduciary Sign-off)
  ↓
AUDIT (Immutable Audit Event)
  ↓
FOLLOW-UP (Automated Task Generation)
```

## Architectural Principles
1. **Human-in-the-Loop Approval**: Consequential financial decisions (rebalances, tax actions, allocation shifts) require explicit human advisor sign-off.
2. **Deterministic State Machines**: Tasks, Decisions, and Meetings transition through verified finite state machines.
3. **No Synthetic Data / No AI Fabrication**: All actions originate from validated computation or explicit advisor intent.
4. **Tenant Isolation**: Every task, decision, meeting, and activity event is strictly scoped to `firmId` (tenant) and verified server-side.
5. **Traceable Source Provenance**: Every generated task and decision retains links back to its underlying computation evidence (`sourceType`, `sourceEntityId`).
