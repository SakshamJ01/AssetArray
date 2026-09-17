import { ReportSnapshotModel } from '../src/services/v4/reporting/reportSnapshotModel';
import { ReportGenerator } from '../src/services/v4/reporting/reportGenerator';
import { ReportSnapshot } from '../src/types/v4/reporting';

describe('V4 Phase 5 — Report Publishing & Approval Governance', () => {
  const tenantId = 'firm_alpha';
  const clientId = 'client_101';

  const report: ReportSnapshot = ReportGenerator.generateSnapshot({
    tenantId,
    clientId,
    reportType: 'CLIENT_REVIEW_REPORT',
    actorId: 'advisor_1',
    clientData: { name: 'Sunil Gavaskar' }
  });

  test('Enforces strict sequence GENERATED -> REVIEWED -> APPROVED -> PUBLISHED', () => {
    // 1. Initial State is GENERATED
    expect(report.status).toBe('GENERATED');

    // 2. Review
    const reviewed = ReportSnapshotModel.transitionStatus(report, 'REVIEWED', 'advisor_1', 'ADVISOR');
    expect(reviewed.status).toBe('REVIEWED');

    // 3. Approval
    const approved = ReportSnapshotModel.transitionStatus(reviewed, 'APPROVED', 'supervisor_1', 'ADMIN');
    expect(approved.status).toBe('APPROVED');
    expect(approved.approvedBy).toBe('supervisor_1');

    // 4. Publication
    const published = ReportSnapshotModel.transitionStatus(approved, 'PUBLISHED', 'advisor_1', 'ADVISOR');
    expect(published.status).toBe('PUBLISHED');
    expect(published.publishedAt).toBeDefined();

    // 5. Archival
    const archived = ReportSnapshotModel.transitionStatus(published, 'ARCHIVED', 'admin_1', 'ADMIN');
    expect(archived.status).toBe('ARCHIVED');
    expect(ReportSnapshotModel.canTransition('ARCHIVED', 'GENERATED')).toBe(false);
  });
});
