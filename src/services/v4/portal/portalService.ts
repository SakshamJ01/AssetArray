import {
  PortalClientProfile,
  PortalPortfolioView,
  PortalGoalView,
  PortalDocument,
  PortalActionItem,
  ReportSnapshot,
  ClientSafeReportContext
} from '../../../types/v4/reporting';
import { ClientSafeFilter } from '../reporting/clientSafeFilter';

export interface PortalAggregatePayload {
  profile: PortalClientProfile;
  portfolio: PortalPortfolioView;
  goals: PortalGoalView[];
  publishedReports: ClientSafeReportContext[];
  documents: PortalDocument[];
  actionItems: PortalActionItem[];
}

export class PortalService {
  /**
   * Aggregates a completely client-safe portal payload for an authenticated investor.
   */
  public static buildPortalView(
    profile: PortalClientProfile,
    portfolio: PortalPortfolioView,
    goals: PortalGoalView[],
    allReports: ReportSnapshot[],
    documents: PortalDocument[],
    actionItems: PortalActionItem[]
  ): PortalAggregatePayload {
    // 1. Filter reports to include only APPROVED or PUBLISHED client-safe reports for this client
    const publishedReports: ClientSafeReportContext[] = [];

    for (const rep of allReports) {
      if (
        rep.tenantId === profile.tenantId &&
        rep.clientId === profile.clientId &&
        (rep.status === 'APPROVED' || rep.status === 'PUBLISHED') &&
        (rep.reportType === 'CLIENT_REVIEW_REPORT' || rep.reportType === 'MEETING_FOLLOW_UP_PACK')
      ) {
        publishedReports.push(
          ClientSafeFilter.filterReportForClient(rep, profile.name, portfolio.totalAUM)
        );
      }
    }

    // 2. Filter documents for this client
    const clientDocs = documents.filter(
      (d) => d.tenantId === profile.tenantId && d.clientId === profile.clientId && d.status === 'AVAILABLE'
    );

    // 3. Filter action items for this client
    const clientActions = actionItems.filter(
      (a) => a.tenantId === profile.tenantId && a.clientId === profile.clientId && a.status === 'PENDING'
    );

    return {
      profile,
      portfolio,
      goals,
      publishedReports,
      documents: clientDocs,
      actionItems: clientActions
    };
  }
}
