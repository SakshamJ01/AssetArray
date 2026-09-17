import { ReportSnapshot, ClientSafeReportContext } from '../../../types/v4/reporting';

export class ClientSafeFilter {
  /**
   * Sanitizes a ReportSnapshot to ensure only client-authorized data is exposed.
   * Strips internal advisor diagnostics, custody break counters, and private notes.
   */
  public static filterReportForClient(
    report: ReportSnapshot,
    clientName: string,
    totalAUM: number
  ): ClientSafeReportContext {
    // Only permit client-safe report types for client portal exposure
    if (report.reportType === 'INTERNAL_ADVISOR_REPORT') {
      throw new Error('INTERNAL_ADVISOR_REPORT is an internal document and cannot be exposed to clients');
    }
    if (report.reportType === 'INVESTMENT_COMMITTEE_REPORT') {
      throw new Error('INVESTMENT_COMMITTEE_REPORT is an internal document and cannot be exposed to clients');
    }

    if (report.status !== 'APPROVED' && report.status !== 'PUBLISHED') {
      throw new Error(`Report in ${report.status} status has not been approved for client viewing`);
    }

    // Filter sections to remove any internal diagnostic sections
    const clientSafeSections = report.sections.filter((s) => {
      const lower = s.id.toLowerCase();
      return !lower.includes('workflow') && !lower.includes('diagnostic') && !lower.includes('reconciliation') && !lower.includes('internal');
    });

    return {
      reportId: report.reportId,
      title: report.title,
      reportType: report.reportType,
      clientName,
      asOf: report.asOf,
      currency: report.currency,
      totalAUM,
      sections: clientSafeSections,
      disclosures: report.fiduciaryDisclosures,
      publishedAt: report.publishedAt || report.updatedAt
    };
  }
}
