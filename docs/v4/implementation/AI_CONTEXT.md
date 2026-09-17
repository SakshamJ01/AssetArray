# AssetArray V4.0 — Phase 4: Deterministic AI Context Builder

## 1. Context Architecture
The `V4ContextBuilder` (`src/services/v4/ai/contextBuilder.ts`) constructs data-minimized, prompt-injection-safe snapshots:

```typescript
export interface AiContextSnapshot {
  snapshotId: string;
  tenantId: string;
  clientId?: string;
  householdId?: string;
  portfolioId?: string;
  taskType: V4AiTaskType;
  contextAsOf: string;
  version: number;
  clientSnapshot?: ClientSnapshot;
  portfolioSnapshot?: PortfolioSnapshot;
  riskSnapshot?: RiskSnapshot;
  taxSnapshot?: TaxSnapshot;
  workflowSnapshot?: WorkflowSnapshot;
  researchEvidence?: ResearchEvidence[];
  untrustedTextBlocks?: UntrustedTextBlock[];
}
```

## 2. Key Protections
- **Tenant & Client Isolation**: Server-side resolution prevents cross-tenant or cross-client data bleeding.
- **Data Minimization**: Only packages attributes required for the requested task (e.g. `TAX_EXPLANATION` omits irrelevant personal contact details).
- **Prompt Injection Defense**: Client notes and external descriptions are sanitized to neutralize malicious instructions (`[BLOCKED: POTENTIAL_PROMPT_INJECTION]`).
- **Context Versioning**: Every snapshot carries a unique `snapshotId` and `contextAsOf` timestamp to ensure historical traceability.
