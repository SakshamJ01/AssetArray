# AssetArray V4.0 — Report Data Models & Snapshots

## 1. Data Contract: `ReportSnapshot`

```typescript
export interface ReportSnapshot {
  reportId: string;
  tenantId: string;
  clientId: string;
  householdId?: string;
  portfolioId?: string;
  reportType: ReportType;
  title: string;
  status: ReportStatus;
  currency: string;
  dataSnapshotVersion: string;
  methodologyVersion: string;
  asOf: string;
  sections: ReportSection[];
  fiduciaryDisclosures: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  publishedAt?: string;
  isImmutable: boolean;
}
```

## 2. Report Sections & Modular Layout
Each report is composed of typed `ReportSection` elements:
- `ReportMetric`: Key performance indicators with labels, values, and optional units (`%`, `INR`, `USD`).
- `ReportTable`: Tabular breakdowns (e.g. Asset Allocation, Top Holdings, Goal Tracking, Action Items).
- `summaryText`: Narrative commentary (advisor-authored or grounded AI synthesis).

## 3. Client Safe Filter: `ClientSafeReportContext`
When a report is approved and exposed to the Investor Portal, internal metadata is stripped:
- Excludes diagnostic reconciliation traces.
- Excludes internal task references and private advisor notes.
- Strictly verifies client authorization to prevent cross-client data leakage.
