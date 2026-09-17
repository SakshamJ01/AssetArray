import { ReportSnapshot, ReportStatus, ReportType } from '../../../types/v4/reporting';

export const VALID_REPORT_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  DRAFT: ['GENERATED', 'ARCHIVED'],
  GENERATED: ['REVIEWED', 'APPROVED', 'ARCHIVED', 'DRAFT'],
  REVIEWED: ['APPROVED', 'GENERATED', 'ARCHIVED'],
  APPROVED: ['PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED: [] // Terminal state
};

export class ReportSnapshotModel {
  public static canTransition(current: ReportStatus, target: ReportStatus): boolean {
    if (current === target) return true;
    const allowed = VALID_REPORT_TRANSITIONS[current] || [];
    return allowed.includes(target);
  }

  public static transitionStatus(
    report: ReportSnapshot,
    newStatus: ReportStatus,
    actorId: string,
    actorRole: string
  ): ReportSnapshot {
    if (!this.canTransition(report.status, newStatus)) {
      throw new Error(`Illegal report state transition from ${report.status} to ${newStatus}`);
    }

    if (newStatus === 'APPROVED' && !['ADVISOR', 'ADMIN', 'COMPLIANCE'].includes(actorRole)) {
      throw new Error(`Role ${actorRole} is not authorized to approve reports`);
    }

    if (newStatus === 'PUBLISHED' && report.status !== 'APPROVED') {
      throw new Error('Reports must be in APPROVED status before they can be PUBLISHED to clients');
    }

    const now = new Date().toISOString();
    const updated: ReportSnapshot = {
      ...report,
      status: newStatus,
      updatedAt: now
    };

    if (newStatus === 'REVIEWED') {
      updated.reviewedBy = actorId;
      updated.reviewedAt = now;
    } else if (newStatus === 'APPROVED') {
      updated.approvedBy = actorId;
      updated.approvedAt = now;
      updated.isImmutable = true;
    } else if (newStatus === 'PUBLISHED') {
      updated.publishedAt = now;
      updated.isImmutable = true;
    }

    return updated;
  }

  public static validateImmutability(report: ReportSnapshot, modifications: Partial<ReportSnapshot>): void {
    if (report.isImmutable || report.status === 'APPROVED' || report.status === 'PUBLISHED') {
      const protectedKeys: (keyof ReportSnapshot)[] = [
        'sections',
        'currency',
        'dataSnapshotVersion',
        'methodologyVersion',
        'asOf',
        'reportType',
        'clientId',
        'portfolioId'
      ];

      for (const key of protectedKeys) {
        if (modifications[key] !== undefined && modifications[key] !== report[key]) {
          throw new Error(
            `Report ${report.reportId} is immutable (${report.status}). Cannot modify protected field ${String(key)}. Generate a new version instead.`
          );
        }
      }
    }
  }

  public static validatePayload(payload: Partial<ReportSnapshot>): void {
    if (!payload.tenantId || typeof payload.tenantId !== 'string' || payload.tenantId.trim().length === 0) {
      throw new Error('Report validation error: tenantId is required');
    }
    if (!payload.clientId || typeof payload.clientId !== 'string' || payload.clientId.trim().length === 0) {
      throw new Error('Report validation error: clientId is required');
    }
    if (!payload.reportType) {
      throw new Error('Report validation error: reportType is required');
    }
  }
}
