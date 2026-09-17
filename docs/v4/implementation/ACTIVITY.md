# AssetArray V4.0 — Phase 3: Consolidated Activity Timeline

## Activity Timeline Architecture
AssetArray V4.0 unifies events from across the domain foundation into a single, chronologically sorted activity feed.

```typescript
export interface ActivityEvent {
  eventId: string;
  tenantId: string;
  eventType: ActivityEventType;
  entityType: 'CLIENT' | 'HOUSEHOLD' | 'PORTFOLIO' | 'TASK' | 'DECISION' | 'MEETING' | 'RECONCILIATION' | 'REBALANCE';
  entityId: string;
  clientId?: string;
  householdId?: string;
  portfolioId?: string;
  actorId: string;
  actorRole: string;
  timestamp: string;
  summary: string;
  metadata?: Record<string, unknown>;
}
```

## Scoping & Query Capabilities
- Filterable by Tenant (`firmId` enforced server-side).
- Filterable by Client (`clientId`), Household (`householdId`), or Portfolio (`portfolioId`).
- Powered by the Phase 1 `AuditLogger` append-only store to prevent redundant event tables.
