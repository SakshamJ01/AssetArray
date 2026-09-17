import { ReportGenerator } from '../src/services/v4/reporting/reportGenerator';
import { ReportSnapshotModel } from '../src/services/v4/reporting/reportSnapshotModel';

describe('V4 Phase 5 — Report Versioning & Reproducibility Across Data Mutations', () => {
  const tenantId = 'firm_alpha';
  const clientId = 'client_101';

  test('Historical report snapshot v1 remains unchanged when portfolio data updates and v2 is generated', () => {
    // 1. Generate Report v1 at Time T1
    const reportV1 = ReportGenerator.generateSnapshot({
      tenantId,
      clientId,
      reportType: 'CLIENT_REVIEW_REPORT',
      actorId: 'adv_1',
      clientData: { name: 'Arjun Rampal' },
      portfolioData: {
        totalAUM: 50000000,
        driftScore: 2.1,
        topHoldings: [{ symbol: 'TCS', name: 'TCS Ltd', weightPct: 20, currentVal: 10000000 }]
      }
    });

    const approvedV1 = ReportSnapshotModel.transitionStatus(
      ReportSnapshotModel.transitionStatus(reportV1, 'REVIEWED', 'adv_1', 'ADVISOR'),
      'APPROVED',
      'adv_1',
      'ADVISOR'
    );

    expect(approvedV1.sections[0].metrics[0].value).toBe(50000000);

    // 2. Portfolio undergoes massive deposit and rebalance at Time T2 (AUM: 80,000,000)
    const reportV2 = ReportGenerator.generateSnapshot({
      tenantId,
      clientId,
      reportType: 'CLIENT_REVIEW_REPORT',
      actorId: 'adv_1',
      clientData: { name: 'Arjun Rampal' },
      portfolioData: {
        totalAUM: 80000000,
        driftScore: 0.5,
        topHoldings: [{ symbol: 'TCS', name: 'TCS Ltd', weightPct: 15, currentVal: 12000000 }]
      }
    });

    // 3. Verify V1 is unmodified and retains original data snapshot
    expect(approvedV1.sections[0].metrics[0].value).toBe(50000000);
    expect(approvedV1.dataSnapshotVersion).not.toBe(reportV2.dataSnapshotVersion);
    expect(reportV2.sections[0].metrics[0].value).toBe(80000000);
  });
});
