# ASSETARRAY 4.0 — DOMAIN DATA MODEL & EVENT ARCHITECTURE
**Institutional Advisor Platform Product Blueprint**

---

## 1. Conceptual Entity-Relationship (ER) Domain Model

```
+-------------------------------------------------------------------------------+
| CORE DOMAIN ENTITIES                                                          |
+-------------------------------------------------------------------------------+
|                                                                               |
|  [Firm / Tenant]                                                              |
|       | 1                                                                     |
|       |---< [User / Advisor]                                                  |
|       | 1                                                                     |
|       |---< [Model Portfolio] ---< [Model Allocation Target]                 |
|       | 1                                                                     |
|       |---< [Household]                                                       |
|                 | 1                                                           |
|                 |---< [Client Member]                                         |
|                             | 1                                               |
|                             |---< [Portfolio / Account]                       |
|                                         | 1                                   |
|                                         |---< [Holding]                       |
|                                         |         | 1                         |
|                                         |         |---< [Tax Lot]             |
|                                         | 1                                   |
|                                         |---< [Transaction Ledger]            |
|                                         | 1                                   |
|                                         |---< [Mandate Policy]                |
|                                                                               |
|  [Cross-Cutting Institutional Entities]                                       |
|  ├── [Goal] (Linked to Household / Member)                                    |
|  ├── [Liability] (Linked to Household / Member)                               |
|  ├── [Task] (Linked to Client / Portfolio / User)                             |
|  ├── [DecisionRecord] (Linked to Client / Meeting / User)                     |
|  ├── [ResearchDocument] (Linked to MarketInstrument)                          |
|  ├── [ReportArtifact] (Linked to Household / Client / Firm)                   |
|  ├── [AIInteractionLog] (Linked to User / Client / Task)                      |
|  └── [AuditEvent] (Immutable SHA-256 System-wide Log)                         |
+-------------------------------------------------------------------------------+
```

---

## 2. Key Entity Attribute Specifications

1. **`Firm`**: `id`, `name`, `sebiRegistrationNo`, `brandingConfig`, `createdAt`, `status`
2. **`Household`**: `id`, `firmId`, `name`, `primaryContactId`, `consolidatedAum`, `currency`, `mandateTier`
3. **`ClientMember`**: `id`, `householdId`, `pan`, `taxStatus` (Resident/NRI), `kycStatus`, `relationshipRole`
4. **`Portfolio`**: `id`, `clientMemberId`, `custodianType` (Zerodha/CAMS/NSDL), `accountNumber`, `totalValue`, `cashBalance`, `mandateId`, `assignedModelId`
5. **`Holding`**: `id`, `portfolioId`, `instrumentId` (ISIN), `assetClass`, `subAssetClass`, `quantity`, `averageBuyPrice`, `currentPrice`, `currentValue`, `unrealizedPnl`
6. **`TaxLot`**: `id`, `holdingId`, `acquisitionDate`, `quantity`, `costBasisPerUnit`, `holdingPeriodDays`, `taxClassification` (STCG/LTCG), `isHarvestEligible`
7. **`AuditEvent`**: `id`, `firmId`, `userId`, `actionType`, `entityType`, `entityId`, `beforeSnapshotJson`, `afterSnapshotJson`, `ipAddress`, `timestampHash`

---

## 3. Domain Event Architecture

AssetArray 4.0 introduces lightweight internal **Domain Events** to ensure data consistency without introducing distributed microservice overhead:

```
+----------------------------------------------------------------------------------------------------+
| DOMAIN EVENTS & DOWNSTREAM HANDLERS                                                                |
+----------------------+-----------------------------------------------------------------------------+
| Domain Event         | Automated Downstream Actions                                                |
+----------------------+-----------------------------------------------------------------------------+
| `HoldingUpdated`     | -> Recomputes Portfolio Net Worth                                           |
|                      | -> Recalculates Mandate Drift Corridors                                     |
|                      | -> Refreshes Goal Monte Carlo Funding Probability                           |
+----------------------+-----------------------------------------------------------------------------+
| `TaxLotAdjusted`     | -> Recalculates Section 70/74 Realized/Unrealized Gains                      |
|                      | -> Updates Year-End Tax Loss Harvesting Opportunity Queue                   |
+----------------------+-----------------------------------------------------------------------------+
| `ModelTargetChanged` | -> Scans all subscribed client portfolios for tracking error drift          |
|                      | -> Generates Advisor Rebalance Review Tasks                                 |
+----------------------+-----------------------------------------------------------------------------+
| `MeetingSaved`       | -> Auto-stages Post-Meeting Follow-Up Drafting Queue                        |
|                      | -> Commits agreed action items to Immutable Decision Ledger                 |
+----------------------+-----------------------------------------------------------------------------+
```

---

## 4. Real-Time vs Async Execution Boundaries

```
+---------------------+-------------------+---------------------+--------------------+
| Execution Tier      | Latency Target    | Data Domains        | Protocol / Method  |
+---------------------+-------------------+---------------------+--------------------+
| Real-Time (Sync)    | < 50ms (In-Memory)| UI State, Filtering,| React Query /      |
|                     |                   | Simulation Sliders  | Local Compute      |
+---------------------+-------------------+---------------------+--------------------+
| Near Real-Time      | < 500ms           | Market Ticker Feeds,| HTTP REST / Cache  |
|                     |                   | AI Streaming Tokens | SSE / WebSockets   |
+---------------------+-------------------+---------------------+--------------------+
| Async Background    | 2s - 15s          | CAS Statement Parse,| BullMQ / MongoDB   |
|                     |                   | PDF Report Batch Run| Worker Queue       |
+---------------------+-------------------+---------------------+--------------------+
| Nightly Batch       | Scheduled (02:00) | AMFI NAV Sync, Macro| Node Cron Worker   |
|                     |                   | DBIE Rate Ingestion |                    |
+---------------------+-------------------+---------------------+--------------------+
```
