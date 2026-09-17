import { ReportSnapshotModel } from '../src/services/v4/reporting/reportSnapshotModel';
import { ReportGenerator } from '../src/services/v4/reporting/reportGenerator';
import { ReportSnapshot } from '../src/types/v4/reporting';

describe('V4 Phase 5 — Reporting Model, Lifecycle & Immutability', () => {
  const tenantId = 'firm_alpha';
  const clientId = 'client_101';

  const baseReport: ReportSnapshot = ReportGenerator.generateSnapshot({
    tenantId,
    clientId,
    reportType: 'CLIENT_REVIEW_REPORT',
    actorId: 'advisor_1',
    clientData: { name: 'Kavita Iyer', riskProfile: 'GROWTH' },
    portfolioData: {
      totalAUM: 45000000,
      driftScore: 6.2,
      topHoldings: [{ symbol: 'INFY', name: 'Infosys Ltd', weightPct: 25.0, currentVal: 11250000 }]
    }
  });

  test('Permits legal lifecycle progression GENERATED -> REVIEWED -> APPROVED -> PUBLISHED', () => {
    expect(baseReport.status).toBe('GENERATED');

    const reviewed = ReportSnapshotModel.transitionStatus(baseReport, 'REVIEWED', 'advisor_1', 'ADVISOR');
    expect(reviewed.status).toBe('REVIEWED');
    expect(reviewed.reviewedBy).toBe('advisor_1');

    const approved = ReportSnapshotModel.transitionStatus(reviewed, 'APPROVED', 'advisor_1', 'ADVISOR');
    expect(approved.status).toBe('APPROVED');
    expect(approved.approvedBy).toBe('advisor_1');
    expect(approved.isImmutable).toBe(true);

    const published = ReportSnapshotModel.transitionStatus(approved, 'PUBLISHED', 'advisor_1', 'ADVISOR');
    expect(published.status).toBe('PUBLISHED');
    expect(published.publishedAt).toBeDefined();
  });

  test('Rejects direct publication of unapproved report', () => {
    expect(() => {
      ReportSnapshotModel.transitionStatus(baseReport, 'PUBLISHED', 'advisor_1', 'ADVISOR');
    }).toThrow(/must be in APPROVED status before they can be PUBLISHED|Illegal report state transition/i);
  });

  test('Prevents unauthorized report approval by non-advisor roles', () => {
    const reviewed = ReportSnapshotModel.transitionStatus(baseReport, 'REVIEWED', 'analyst_1', 'ANALYST');
    expect(() => {
      ReportSnapshotModel.transitionStatus(reviewed, 'APPROVED', 'analyst_1', 'ANALYST');
    }).toThrow(/not authorized to approve reports/i);
  });

  test('Enforces immutability: Rejects mutations on APPROVED or PUBLISHED report', () => {
    const approved = ReportSnapshotModel.transitionStatus(
      ReportSnapshotModel.transitionStatus(baseReport, 'REVIEWED', 'advisor_1', 'ADVISOR'),
      'APPROVED',
      'advisor_1',
      'ADVISOR'
    );

    expect(() => {
      ReportSnapshotModel.validateImmutability(approved, { currency: 'USD' });
    }).toThrow(/immutable/i);

    expect(() => {
      ReportSnapshotModel.validateImmutability(approved, { sections: [] });
    }).toThrow(/immutable/i);
  });
});
