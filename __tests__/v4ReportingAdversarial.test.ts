import { describe, it, expect } from '@jest/globals';
import { ReportSnapshotModel } from '../src/services/v4/reporting/reportSnapshotModel';
import { ReportGenerator } from '../src/services/v4/reporting/reportGenerator';
import { ClientSafeFilter } from '../src/services/v4/reporting/clientSafeFilter';
import { ReportShareService } from '../src/services/v4/reporting/shareService';
import { PortalService } from '../src/services/v4/portal/portalService';
import { PortalActionService } from '../src/services/v4/portal/portalActionService';
import { ReportSnapshot, PortalActionItem, PortalPortfolioView } from '../src/types/v4/reporting';

describe('V4 Reporting & Portal Adversarial & Security Red Team Suite', () => {
  const tenantA = 'tenant_alpha_001';
  const tenantB = 'tenant_beta_002';
  const clientA = 'client_alice_101';
  const clientB = 'client_bob_102';

  const mockPortfolioViewB: PortalPortfolioView = {
    totalAUM: 2000000,
    currency: 'INR',
    asOfDate: '2026-09-15',
    assetAllocation: [],
    topHoldings: [],
    performanceSummary: []
  };

  const mockPortfolioViewA: PortalPortfolioView = {
    totalAUM: 1000000,
    currency: 'INR',
    asOfDate: '2026-09-15',
    assetAllocation: [],
    topHoldings: [],
    performanceSummary: []
  };

  it('1. Rejects cross-tenant report exposure during portal build', () => {
    const reportTenantA: ReportSnapshot = ReportGenerator.generateSnapshot({
      tenantId: tenantA,
      clientId: clientA,
      reportType: 'CLIENT_REVIEW_REPORT',
      currency: 'INR',
      actorId: 'adv_1',
      portfolioData: {
        totalAUM: 5000000,
        driftScore: 1.2,
        healthScore: 92,
        topHoldings: [{ symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', weightPct: 60, currentVal: 3000000 }]
      }
    });

    const approvedReport = ReportSnapshotModel.transitionStatus(reportTenantA, 'APPROVED', 'adv_1', 'ADVISOR');

    // Investor B in tenant B requests their portal view
    const portalDataB = PortalService.buildPortalView(
      { clientId: clientB, tenantId: tenantB, name: 'Bob', email: 'bob@example.com' },
      mockPortfolioViewB,
      [],
      [approvedReport], // All reports in system passed to aggregator
      [],
      []
    );

    // Tenant B portal MUST NOT contain Tenant A's report
    expect(portalDataB.publishedReports).toHaveLength(0);
  });

  it('2. ClientSafeFilter strictly denies internal report types from client exposure', () => {
    const internalReport: ReportSnapshot = ReportGenerator.generateSnapshot({
      tenantId: tenantA,
      clientId: clientA,
      reportType: 'INTERNAL_ADVISOR_REPORT',
      currency: 'INR',
      actorId: 'adv_1',
      portfolioData: {
        totalAUM: 5000000
      }
    });

    const approvedInternal = ReportSnapshotModel.transitionStatus(internalReport, 'APPROVED', 'adv_1', 'ADVISOR');

    expect(() => {
      ClientSafeFilter.filterReportForClient(approvedInternal, 'Alice', 5000000);
    }).toThrow(/INTERNAL_ADVISOR_REPORT is an internal document and cannot be exposed to clients/i);

    const icReport: ReportSnapshot = ReportGenerator.generateSnapshot({
      tenantId: tenantA,
      clientId: clientA,
      reportType: 'INVESTMENT_COMMITTEE_REPORT',
      currency: 'INR',
      actorId: 'adv_1',
      portfolioData: {
        totalAUM: 5000000
      }
    });

    const approvedIC = ReportSnapshotModel.transitionStatus(icReport, 'APPROVED', 'adv_1', 'ADVISOR');

    expect(() => {
      ClientSafeFilter.filterReportForClient(approvedIC, 'Alice', 5000000);
    }).toThrow(/INVESTMENT_COMMITTEE_REPORT is an internal document and cannot be exposed to clients/i);
  });

  it('3. Prevents skipping lifecycle stages (DRAFT cannot be directly PUBLISHED)', () => {
    const draftReport: ReportSnapshot = {
      reportId: 'rep_draft_01',
      tenantId: tenantA,
      clientId: clientA,
      reportType: 'CLIENT_REVIEW_REPORT',
      title: 'Draft Report',
      status: 'DRAFT',
      currency: 'INR',
      dataSnapshotVersion: 'snap_01',
      methodologyVersion: 'v4.0',
      templateVersion: 'v4.0.0',
      asOf: '2026-09-15',
      sections: [],
      fiduciaryDisclosures: [],
      aiNarrativeIncluded: false,
      createdBy: 'adv_1',
      createdAt: '2026-09-15T10:00:00Z',
      updatedAt: '2026-09-15T10:00:00Z',
      isImmutable: false
    };

    expect(() => {
      ReportSnapshotModel.transitionStatus(draftReport, 'PUBLISHED', 'adv_1', 'ADVISOR');
    }).toThrow(/Illegal report state transition/i);
  });

  it('4. Rejects report approval by unauthorized non-advisor/non-admin roles', () => {
    const report: ReportSnapshot = ReportGenerator.generateSnapshot({
      tenantId: tenantA,
      clientId: clientA,
      reportType: 'CLIENT_REVIEW_REPORT',
      currency: 'INR',
      actorId: 'adv_1',
      portfolioData: {
        totalAUM: 1000000
      }
    });

    const reviewed = ReportSnapshotModel.transitionStatus(report, 'REVIEWED', 'adv_1', 'ADVISOR');

    expect(() => {
      ReportSnapshotModel.transitionStatus(reviewed, 'APPROVED', 'viewer_1', 'VIEWER');
    }).toThrow(/Role VIEWER is not authorized to approve reports/i);

    expect(() => {
      ReportSnapshotModel.transitionStatus(reviewed, 'APPROVED', 'client_1', 'CLIENT');
    }).toThrow(/Role CLIENT is not authorized to approve reports/i);
  });

  it('5. Rejects expired ephemeral share token access', () => {
    const shareToken = ReportShareService.generateShareToken(tenantA, 'rep_001', clientA, -1);
    const validation = ReportShareService.validateToken(shareToken);

    expect(validation.isValid).toBe(false);
    expect(validation.reason).toContain('Share token has expired');
  });

  it('6. Rejects revoked ephemeral share token access', () => {
    const shareToken = ReportShareService.generateShareToken(tenantA, 'rep_001', clientA, 72);
    const revoked = ReportShareService.revokeToken(shareToken);
    const validation = ReportShareService.validateToken(revoked);

    expect(validation.isValid).toBe(false);
    expect(validation.reason).toContain('Share token has been explicitly revoked');
  });

  it('7. Prevents in-place mutation of approved/published snapshot', () => {
    const report: ReportSnapshot = ReportGenerator.generateSnapshot({
      tenantId: tenantA,
      clientId: clientA,
      reportType: 'CLIENT_REVIEW_REPORT',
      currency: 'EUR',
      actorId: 'adv_1',
      portfolioData: {
        totalAUM: 1000000
      }
    });

    const approved = ReportSnapshotModel.transitionStatus(report, 'APPROVED', 'adv_1', 'ADVISOR');

    expect(() => {
      ReportSnapshotModel.validateImmutability(approved, {
        currency: 'USD'
      });
    }).toThrow(/Cannot modify protected field currency/i);
  });

  it('8. ClientSafeFilter strips internal diagnostic & workflow sections', () => {
    const internalSectionsReport: ReportSnapshot = {
      reportId: 'rep_diag_01',
      tenantId: tenantA,
      clientId: clientA,
      reportType: 'CLIENT_REVIEW_REPORT',
      title: 'Review with Internal Diagnostics',
      status: 'APPROVED',
      currency: 'INR',
      dataSnapshotVersion: 'snap_01',
      methodologyVersion: 'v4.0',
      templateVersion: 'v4.0.0',
      asOf: '2026-09-15',
      sections: [
        { id: 'sec_portfolio_standing', title: 'Portfolio Overview', summaryText: 'Clean summary', metrics: [] },
        { id: 'sec_diagnostic_reconciliation_break', title: 'Internal Break Log', summaryText: 'Hidden break', metrics: [] },
        { id: 'sec_internal_audit_trace', title: 'Internal Audit Trace', summaryText: 'Internal traces', metrics: [] }
      ],
      fiduciaryDisclosures: ['Standard disclosure'],
      aiNarrativeIncluded: false,
      createdBy: 'adv_1',
      createdAt: '2026-09-15T10:00:00Z',
      updatedAt: '2026-09-15T10:00:00Z',
      isImmutable: true
    };

    const clientSafe = ClientSafeFilter.filterReportForClient(internalSectionsReport, 'Alice', 1000000);
    expect(clientSafe.sections).toHaveLength(1);
    expect(clientSafe.sections[0].id).toBe('sec_portfolio_standing');
  });

  it('9. Gracefully handles empty client with zero portfolio holdings without fabricating data', () => {
    const emptyClientReport: ReportSnapshot = ReportGenerator.generateSnapshot({
      tenantId: tenantA,
      clientId: 'client_empty_999',
      reportType: 'CLIENT_REVIEW_REPORT',
      currency: 'INR',
      actorId: 'adv_1',
      portfolioData: {
        totalAUM: 0,
        driftScore: 0,
        healthScore: 0,
        topHoldings: []
      }
    });

    expect(emptyClientReport.sections).toBeDefined();
    const overview = emptyClientReport.sections.find(s => s.id === 'sec_portfolio_standing');
    expect(overview).toBeDefined();
    const aumMetric = overview?.metrics.find(m => m.label === 'Total Portfolio Value');
    expect(aumMetric?.value).toBe(0);
  });

  it('10. Prevents duplicate responses on already resolved action items', () => {
    const action: PortalActionItem = {
      actionId: 'act_101',
      tenantId: tenantA,
      clientId: clientA,
      title: 'Sign Form 15G',
      description: 'Tax exemption declaration form',
      type: 'REVIEW_DOCUMENT',
      status: 'PENDING',
      dueAt: '2026-10-01',
      createdAt: '2026-09-15T10:00:00Z'
    };

    const completed = PortalActionService.respondToActionItem(action, 'Signed digitally', 'COMPLETED');
    expect(completed.status).toBe('COMPLETED');
    expect(completed.completedAt).toBeDefined();

    expect(() => {
      PortalActionService.respondToActionItem(completed, 'Duplicate response attempt', 'COMPLETED');
    }).toThrow(/already COMPLETED/i);
  });

  it('11. Disallows unapproved reports from being published in portal view', () => {
    const draftReport: ReportSnapshot = ReportGenerator.generateSnapshot({
      tenantId: tenantA,
      clientId: clientA,
      reportType: 'CLIENT_REVIEW_REPORT',
      currency: 'INR',
      actorId: 'adv_1',
      portfolioData: {
        totalAUM: 1000000
      }
    });

    // Report is GENERATED but NOT APPROVED
    const portalData = PortalService.buildPortalView(
      { clientId: clientA, tenantId: tenantA, name: 'Alice', email: 'alice@example.com' },
      mockPortfolioViewA,
      [],
      [draftReport],
      [],
      []
    );

    expect(portalData.publishedReports).toHaveLength(0);
  });

  it('12. Validates that fiduciary methodology notes use GIPS-aligned disclosure', () => {
    const report: ReportSnapshot = ReportGenerator.generateSnapshot({
      tenantId: tenantA,
      clientId: clientA,
      reportType: 'CLIENT_REVIEW_REPORT',
      actorId: 'adv_1'
    });

    const hasGipsAligned = report.fiduciaryDisclosures.some(d => d.toLowerCase().includes('gips-aligned'));
    const hasGipsCompliant = report.fiduciaryDisclosures.some(d => d.toLowerCase().includes('gips compliant'));

    expect(hasGipsAligned).toBe(true);
    expect(hasGipsCompliant).toBe(false);
  });
});
