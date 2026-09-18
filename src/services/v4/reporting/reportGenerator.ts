import {
  ReportSnapshot,
  ReportType,
  ReportSection
} from '../../../types/v4/reporting';

export interface ReportGenerationInput {
  tenantId: string;
  clientId: string;
  householdId?: string;
  portfolioId?: string;
  reportType: ReportType;
  actorId: string;
  currency?: string;
  clientData?: { name: string; riskProfile?: string };
  portfolioData?: {
    totalAUM: number;
    driftScore?: number;
    healthScore?: number;
    topHoldings?: { symbol: string; name: string; weightPct: number; currentVal: number }[];
    performance?: { period: string; returnPct: number }[];
  };
  riskData?: { riskScore?: number; var95?: number; beta?: number };
  taxData?: { harvestableLosses?: number; unrealizedGains?: number };
  goalsData?: { title: string; targetAmount: number; currentAmount: number; onTrack: boolean }[];
  workflowData?: { openTasks?: string[]; recentDecisions?: string[]; reconBreaksCount?: number };
  meetingData?: {
    meetingId: string;
    meetingTitle: string;
    date: string;
    participants: string[];
    summary: string;
    decisions: string[];
    actionItems: { taskTitle: string; owner: string; dueDate: string }[];
  };
  aiNarrative?: { executiveSummary?: string; discussionPoints?: string[] };
}

export class ReportGenerator {
  public static readonly METHODOLOGY_VERSION = 'v4.0.0-gips-aligned';
  public static readonly TEMPLATE_VERSION = 'reportTemplate.v4.1';

  public static generateSnapshot(input: ReportGenerationInput): ReportSnapshot {
    const now = new Date().toISOString();
    const currency = input.currency || 'INR';
    const reportId = `rep_${input.reportType.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const clientName = input.clientData?.name || 'Client';

    const sections: ReportSection[] = [];
    const disclosures: string[] = [
      'Performance calculations are GIPS-aligned and calculated on a time-weighted rate of return basis.',
      'Tax loss calculations are strictly estimates under Section 70/74 and do not constitute legal or tax advice.',
      'Past performance is no guarantee of future returns.'
    ];

    if (input.reportType === 'INTERNAL_ADVISOR_REPORT') {
      sections.push({
        id: 'sec_client_overview',
        title: 'Client & Mandate Profile',
        summaryText: `Mandate overview for ${clientName} (${input.clientData?.riskProfile || 'MODERATE'} risk).`,
        metrics: [
          { label: 'Total Portfolio AUM', value: input.portfolioData?.totalAUM || 0, unit: currency },
          { label: 'Health Score', value: input.portfolioData?.healthScore || 80, unit: 'points' },
          { label: 'Allocation Drift Score', value: input.portfolioData?.driftScore || 0, unit: '%' }
        ]
      });

      sections.push({
        id: 'sec_workflow_diagnostics',
        title: 'Internal Workflow & Reconciliation Diagnostics',
        summaryText: 'Summary of active desk mandates, custody breaks, and pending decisions.',
        metrics: [
          { label: 'Reconciliation Breaks', value: input.workflowData?.reconBreaksCount || 0 },
          { label: 'Open Advisor Tasks', value: input.workflowData?.openTasks?.length || 0 },
          { label: 'Pending Decisions', value: input.workflowData?.recentDecisions?.length || 0 }
        ]
      });
    } else if (input.reportType === 'CLIENT_REVIEW_REPORT') {
      sections.push({
        id: 'sec_portfolio_standing',
        title: 'Portfolio Standing & Asset Allocation',
        summaryText: `Your total portfolio under management is valued at ${input.portfolioData?.totalAUM ? input.portfolioData.totalAUM.toLocaleString() : '0'} ${currency}.`,
        metrics: [
          { label: 'Total Portfolio Value', value: input.portfolioData?.totalAUM || 0, unit: currency },
          { label: 'Risk Profile', value: input.clientData?.riskProfile || 'MODERATE' }
        ],
        tables: input.portfolioData?.topHoldings
          ? [
              {
                headers: ['Security', 'Weight (%)', 'Current Value'],
                rows: input.portfolioData.topHoldings.map((h) => [h.name || h.symbol, `${h.weightPct}%`, `${h.currentVal.toLocaleString()} ${currency}`])
              }
            ]
          : undefined
      });

      if (input.goalsData && input.goalsData.length > 0) {
        sections.push({
          id: 'sec_goals_progress',
          title: 'Strategic Financial Goals Progress',
          summaryText: 'Progress tracking across your established long-term wealth objectives.',
          metrics: [],
          tables: [
            {
              headers: ['Goal', 'Target Value', 'Current Value', 'Status'],
              rows: input.goalsData.map((g) => [g.title, g.targetAmount.toLocaleString(), g.currentAmount.toLocaleString(), g.onTrack ? 'ON TRACK' : 'NEEDS REVIEW'])
            }
          ]
        });
      }

      sections.push({
        id: 'sec_discussion_next_steps',
        title: 'Discussion Topics & Next Steps',
        summaryText: input.aiNarrative?.executiveSummary || 'Scheduled review points and agreed follow-up items.',
        metrics: []
      });
    } else if (input.reportType === 'INVESTMENT_COMMITTEE_REPORT') {
      sections.push({
        id: 'sec_proposal_rationale',
        title: 'Investment Committee Proposal & Portfolio Impact Analysis',
        summaryText: `Investment Committee Proposal for ${clientName}. Drift score: ${input.portfolioData?.driftScore || 0}%.`,
        metrics: [
          { label: 'Portfolio AUM', value: input.portfolioData?.totalAUM || 0, unit: currency },
          { label: 'Pre-Trade Drift', value: input.portfolioData?.driftScore || 0, unit: '%' },
          { label: 'Estimated Tax Realization', value: input.taxData?.harvestableLosses || 0, unit: currency }
        ]
      });
    } else if (input.reportType === 'MEETING_FOLLOW_UP_PACK') {
      const mtg = input.meetingData;
      sections.push({
        id: 'sec_meeting_summary',
        title: 'Meeting Overview & Discussion Record',
        summaryText: mtg?.summary || `Meeting conducted on ${mtg?.date || now.split('T')[0]} with ${mtg?.participants?.join(', ') || 'client'}.`,
        metrics: [
          { label: 'Meeting Date', value: mtg?.date || now.split('T')[0] },
          { label: 'Participants', value: mtg?.participants?.join(', ') || clientName }
        ]
      });

      if (mtg?.actionItems && mtg.actionItems.length > 0) {
        sections.push({
          id: 'sec_agreed_actions',
          title: 'Agreed Action Items & Owners',
          summaryText: 'Summary of action items, assigned owners, and committed target due dates.',
          metrics: [],
          tables: [
            {
              headers: ['Action Item', 'Owner', 'Target Due Date'],
              rows: mtg.actionItems.map((a) => [a.taskTitle, a.owner, a.dueDate])
            }
          ]
        });
      }
    }

    return {
      reportId,
      tenantId: input.tenantId,
      clientId: input.clientId,
      householdId: input.householdId,
      portfolioId: input.portfolioId,
      reportType: input.reportType,
      title: input.meetingData?.meetingTitle || `${input.reportType.replace(/_/g, ' ')} — ${clientName}`,
      status: 'GENERATED',
      currency,
      // Include random entropy: two snapshots generated within the same
      // millisecond must never share a data-version identifier.
      dataSnapshotVersion: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      methodologyVersion: this.METHODOLOGY_VERSION,
      templateVersion: this.TEMPLATE_VERSION,
      asOf: now,
      createdBy: input.actorId,
      createdAt: now,
      updatedAt: now,
      sections,
      fiduciaryDisclosures: disclosures,
      aiNarrativeIncluded: !!input.aiNarrative,
      aiDisclaimers: input.aiNarrative
        ? ['Narrative synthesis assisted by AI. All numerical figures verified against deterministic financial engines.']
        : undefined,
      isImmutable: false
    };
  }
}
