/**
 * AssetArray V4.0 — Phase 5 Reporting + Investor Portal
 * Type definitions for Versioned Report Snapshots, Client-Safe Boundaries, Portal Sessions, and Ephemeral Shares.
 */

export type ReportType =
  | 'INTERNAL_ADVISOR_REPORT'
  | 'CLIENT_REVIEW_REPORT'
  | 'INVESTMENT_COMMITTEE_REPORT'
  | 'MEETING_FOLLOW_UP_PACK';

export type ReportStatus =
  | 'DRAFT'
  | 'GENERATED'
  | 'REVIEWED'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'ARCHIVED';

export interface ReportSection {
  id: string;
  title: string;
  summaryText: string;
  metrics: { label: string; value: string | number; unit?: string; asOf?: string }[];
  tables?: { headers: string[]; rows: (string | number)[][] }[];
  disclosures?: string[];
}

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
  templateVersion: string;
  asOf: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  publishedAt?: string;
  sections: ReportSection[];
  fiduciaryDisclosures: string[];
  aiNarrativeIncluded: boolean;
  aiDisclaimers?: string[];
  isImmutable: boolean;
}

export interface ClientSafeReportContext {
  reportId: string;
  title: string;
  reportType: ReportType;
  clientName: string;
  asOf: string;
  currency: string;
  totalAUM: number;
  sections: ReportSection[];
  disclosures: string[];
  publishedAt: string;
}

export interface ReportShareToken {
  token: string;
  tenantId: string;
  reportId: string;
  clientId: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
  isRevoked: boolean;
  accessCount: number;
  lastAccessedAt?: string;
}

export interface PortalActionItem {
  actionId: string;
  tenantId: string;
  clientId: string;
  title: string;
  description: string;
  type: 'REVIEW_DOCUMENT' | 'CONFIRM_MEETING_ITEM' | 'RESPOND_TO_REQUEST' | 'REVIEW_REPORT';
  status: 'PENDING' | 'COMPLETED' | 'DISMISSED';
  dueAt?: string;
  completedAt?: string;
  clientResponse?: string;
  createdAt: string;
}

export interface PortalDocument {
  documentId: string;
  tenantId: string;
  clientId: string;
  name: string;
  category: 'STATEMENT' | 'TAX_PACK' | 'AGREEMENT' | 'REPORT' | 'DISCLOSURE';
  date: string;
  status: 'AVAILABLE' | 'ARCHIVED';
  downloadUrl: string;
}

export interface PortalClientProfile {
  clientId: string;
  tenantId: string;
  name: string;
  email?: string;
  riskProfile?: string;
  assignedAdvisorName?: string;
  lastLoginAt?: string;
}

export interface PortalPortfolioView {
  totalAUM: number;
  currency: string;
  asOfDate: string;
  assetAllocation: { assetClass: string; percentage: number; amount: number }[];
  topHoldings: { symbol: string; name: string; weightPct: number; currentVal: number }[];
  performanceSummary: { period: string; returnPct: number }[];
}

export interface PortalGoalView {
  goalId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  onTrack: boolean;
  probabilityPct?: number;
}
