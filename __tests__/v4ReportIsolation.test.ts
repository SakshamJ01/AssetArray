import { ClientSafeFilter } from '../src/services/v4/reporting/clientSafeFilter';
import { ReportGenerator } from '../src/services/v4/reporting/reportGenerator';
import { ReportSnapshotModel } from '../src/services/v4/reporting/reportSnapshotModel';

describe('V4 Phase 5 — Report Tenant & Client Isolation', () => {
  const tenantA = 'firm_alpha';
  const tenantB = 'firm_beta';
  const clientA = 'client_101';
  const clientB = 'client_202';

  test('Rejects client portal exposure of internal advisor reports', () => {
    const internalReport = ReportGenerator.generateSnapshot({
      tenantId: tenantA,
      clientId: clientA,
      reportType: 'INTERNAL_ADVISOR_REPORT',
      actorId: 'adv_1'
    });

    expect(() => {
      ClientSafeFilter.filterReportForClient(internalReport, 'Client A', 1000000);
    }).toThrow(/INTERNAL_ADVISOR_REPORT is an internal document/i);
  });

  test('Rejects client portal exposure of investment committee reports', () => {
    const committeeReport = ReportGenerator.generateSnapshot({
      tenantId: tenantA,
      clientId: clientA,
      reportType: 'INVESTMENT_COMMITTEE_REPORT',
      actorId: 'adv_1'
    });

    expect(() => {
      ClientSafeFilter.filterReportForClient(committeeReport, 'Client A', 1000000);
    }).toThrow(/INVESTMENT_COMMITTEE_REPORT is an internal document/i);
  });

  test('Rejects unapproved reports from client portal exposure', () => {
    const unapprovedReport = ReportGenerator.generateSnapshot({
      tenantId: tenantA,
      clientId: clientA,
      reportType: 'CLIENT_REVIEW_REPORT',
      actorId: 'adv_1'
    });

    expect(() => {
      ClientSafeFilter.filterReportForClient(unapprovedReport, 'Client A', 1000000);
    }).toThrow(/has not been approved for client viewing/i);
  });

  test('Permits approved client review report and sanitizes internal sections', () => {
    const clientReport = ReportGenerator.generateSnapshot({
      tenantId: tenantA,
      clientId: clientA,
      reportType: 'CLIENT_REVIEW_REPORT',
      actorId: 'adv_1',
      portfolioData: { totalAUM: 50000000 }
    });

    const approved = ReportSnapshotModel.transitionStatus(
      ReportSnapshotModel.transitionStatus(clientReport, 'REVIEWED', 'adv_1', 'ADVISOR'),
      'APPROVED',
      'adv_1',
      'ADVISOR'
    );

    const clientSafe = ClientSafeFilter.filterReportForClient(approved, 'Client A', 50000000);
    expect(clientSafe.reportId).toBe(clientReport.reportId);
    expect(clientSafe.clientName).toBe('Client A');
    expect(clientSafe.totalAUM).toBe(50000000);
  });
});
