# AssetArray V4.0 — Phase 4: Grounded Research Synthesis

## 1. Grounded Research Engine (`src/services/v4/ai/researchService.ts`)
Synthesizes verified institutional filings, broker reports, and financial documents:

```typescript
export interface ResearchSummary extends BaseAiOutput {
  query: string;
  entityName?: string;
  isEntityVerified: boolean;
  currentVsHistorical: {
    currentFacts: string[];
    historicalContext: string[];
  };
  thesisSynthesis: string;
  citations: string[];
}
```

## 2. Integrity Protections
- **Current vs Historical Separation**: Segregates real-time / current market observations from historical filings.
- **Unknown Entity Refusal**: When queried about unverified entities, the service returns `ENTITY_NOT_VERIFIED` rather than hallucinating financial statements or corporate actions.
- **Traceable Citations**: Every fact is linked back to its source document and publication date.
