import { PortalService } from '../src/services/v4/portal/portalService';
import { PortalActionService } from '../src/services/v4/portal/portalActionService';
import { ReportGenerator } from '../src/services/v4/reporting/reportGenerator';
import { ReportSnapshotModel } from '../src/services/v4/reporting/reportSnapshotModel';
import {
  PortalClientProfile,
  PortalPortfolioView,
  PortalGoalView,
  PortalDocument,
  PortalActionItem
} from '../src/types/v4/reporting';

describe('V4 Phase 5 — Investor / Client Portal Workflows', () => {
  const tenantId = 'firm_alpha';
  const clientId = 'client_101';

  const profile: PortalClientProfile = {
    clientId,
    tenantId,
    name: 'Meera Kapoor',
    riskProfile: 'MODERATE'
  };

  const portfolio: PortalPortfolioView = {
    totalAUM: 60000000,
    currency: 'INR',
    asOfDate: '2026-09-17',
    assetAllocation: [{ assetClass: 'EQUITY', percentage: 70, amount: 42000000 }],
    topHoldings: [{ symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', weightPct: 20, currentVal: 12000000 }],
    performanceSummary: [{ period: '1Y', returnPct: 15.2 }]
  };

  const goals: PortalGoalView[] = [
    {
      goalId: 'goal_edu_1',
      title: 'Higher Education 2030',
      targetAmount: 20000000,
      currentAmount: 12000000,
      targetDate: '2030-06-30',
      onTrack: true,
      probabilityPct: 85
    }
  ];

  const documents: PortalDocument[] = [
    {
      documentId: 'doc_stmt_q2',
      tenantId,
      clientId,
      name: 'Q2 2026 Portfolio Statement.pdf',
      category: 'STATEMENT',
      date: '2026-06-30',
      status: 'AVAILABLE',
      downloadUrl: '/api/v4/portal/documents/doc_stmt_q2/download'
    }
  ];

  const actionItems: PortalActionItem[] = [
    {
      actionId: 'act_meeting_confirm',
      tenantId,
      clientId,
      title: 'Confirm Attendance for Annual Review',
      description: 'Review call scheduled for Friday at 3:00 PM.',
      type: 'CONFIRM_MEETING_ITEM',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    }
  ];

  test('Aggregates full client-safe portal payload with published reports', () => {
    const rawReport = ReportGenerator.generateSnapshot({
      tenantId,
      clientId,
      reportType: 'CLIENT_REVIEW_REPORT',
      actorId: 'adv_1',
      portfolioData: { totalAUM: 60000000 }
    });

    const approvedReport = ReportSnapshotModel.transitionStatus(
      ReportSnapshotModel.transitionStatus(rawReport, 'REVIEWED', 'adv_1', 'ADVISOR'),
      'APPROVED',
      'adv_1',
      'ADVISOR'
    );

    const portalView = PortalService.buildPortalView(
      profile,
      portfolio,
      goals,
      [approvedReport],
      documents,
      actionItems
    );

    expect(portalView.profile.name).toBe('Meera Kapoor');
    expect(portalView.portfolio.totalAUM).toBe(60000000);
    expect(portalView.goals).toHaveLength(1);
    expect(portalView.publishedReports).toHaveLength(1);
    expect(portalView.documents).toHaveLength(1);
    expect(portalView.actionItems).toHaveLength(1);
  });

  test('Client can respond to an action item and mark it completed', () => {
    const item = actionItems[0];
    const completed = PortalActionService.respondToActionItem(
      item,
      'Confirmed availability for Friday call',
      'COMPLETED'
    );

    expect(completed.status).toBe('COMPLETED');
    expect(completed.clientResponse).toBe('Confirmed availability for Friday call');
    expect(completed.completedAt).toBeDefined();
  });
});
