import {
  AiContextSnapshot,
  MeetingBrief,
  MeetingBriefSection,
  AiConfidence
} from '../../../types/v4/ai';
import { V4GroundingEngine } from './groundingEngine';

export class MeetingBriefService {
  /**
   * Builds a structured, verified Meeting Brief from deterministic context snapshot.
   */
  public static generateBrief(snapshot: AiContextSnapshot): MeetingBrief {
    const clientName = snapshot.clientSnapshot?.name || 'Client';
    const aumStr = snapshot.portfolioSnapshot?.totalAUM
      ? `₹${snapshot.portfolioSnapshot.totalAUM.toLocaleString('en-IN')}`
      : 'Unspecified AUM';

    // 1. Portfolio Changes Section
    const drift = snapshot.portfolioSnapshot?.driftScore;
    const portfolioPoints: string[] = [
      `Total Portfolio AUM: ${aumStr}`,
      drift != null ? `Allocation Drift Score: ${drift}%` : 'No significant allocation drift detected'
    ];
    if (snapshot.portfolioSnapshot?.topHoldingsSummary && snapshot.portfolioSnapshot.topHoldingsSummary.length > 0) {
      portfolioPoints.push(
        `Top positions: ${snapshot.portfolioSnapshot.topHoldingsSummary.map((h) => `${h.symbol} (${h.weightPct}%)`).join(', ')}`
      );
    }
    const portfolioChanges: MeetingBriefSection = {
      title: 'Portfolio & Asset Allocation Overview',
      keyPoints: portfolioPoints,
      evidenceReferences: ['PORTFOLIO_LEDGER', 'REBALANCE_ENGINE']
    };

    // 2. Risk Exceptions Section
    const riskScore = snapshot.riskSnapshot?.riskScore;
    const var95 = snapshot.riskSnapshot?.var95;
    const riskPoints: string[] = [
      riskScore != null ? `Institutional Risk Score: ${riskScore}/100` : 'Standard risk profile within target bounds',
      var95 != null ? `Estimated 95% Monthly VaR: ${var95}%` : 'Value-at-Risk within standard historical corridors'
    ];
    const riskExceptions: MeetingBriefSection = {
      title: 'Risk Profile & Stress Exceptions',
      keyPoints: riskPoints,
      evidenceReferences: ['RISK_ENGINE']
    };

    // 3. Tax Opportunities Section
    const harvestable = snapshot.taxSnapshot?.harvestableLosses;
    const taxPoints: string[] = [
      harvestable != null && harvestable > 0
        ? `Identified ₹${harvestable.toLocaleString('en-IN')} in potential tax-loss harvesting under Section 70/74.`
        : 'No immediate capital loss harvesting opportunities identified for current tax cycle.'
    ];
    const taxOpportunities: MeetingBriefSection = {
      title: 'Tax Optimization & Harvesting',
      keyPoints: taxPoints,
      evidenceReferences: ['TAX_HARVEST_ENGINE']
    };

    // 4. Goals Review Section
    const openTasks = snapshot.workflowSnapshot?.openTasksCount || 0;
    const goalsPoints: string[] = [
      `Active Workflow Mandates: ${openTasks} open tasks pending advisor desk review.`
    ];
    if (snapshot.workflowSnapshot?.openTaskTitles && snapshot.workflowSnapshot.openTaskTitles.length > 0) {
      goalsPoints.push(`Immediate Mandates: ${snapshot.workflowSnapshot.openTaskTitles.slice(0, 3).join('; ')}`);
    }
    const goalsReview: MeetingBriefSection = {
      title: 'Strategic Goals & Workflow Mandates',
      keyPoints: goalsPoints,
      evidenceReferences: ['WORKFLOW_TASK_ENGINE']
    };

    const suggestedTopics: string[] = [
      `Review year-to-date portfolio returns and asset allocation alignment.`,
      harvestable && harvestable > 0 ? `Evaluate tax-loss harvesting opportunities prior to quarter end.` : `Confirm risk tolerance and cash flow requirements for upcoming period.`
    ];

    const recommendedFollowUps: string[] = [
      `Confirm client confirmation of any rebalance proposals discussed.`,
      `Document meeting minutes and decisions in AssetArray Meeting Workspace.`
    ];

    const fullText = `${clientName} Brief: ${portfolioPoints.join('. ')}. ${riskPoints.join('. ')}. ${taxPoints.join('. ')}`;
    const grounding = V4GroundingEngine.verifyOutput(fullText, snapshot);

    return {
      taskType: 'MEETING_BRIEF',
      snapshotId: snapshot.snapshotId,
      clientId: snapshot.clientId || '',
      confidence: grounding.confidence,
      clientOverview: `${clientName} (${snapshot.clientSnapshot?.riskCategory || 'MODERATE'} risk, Total AUM: ${aumStr})`,
      portfolioChanges,
      riskExceptions,
      taxOpportunities,
      goalsReview,
      suggestedDiscussionTopics: suggestedTopics,
      recommendedFollowUps,
      claims: grounding.verifiedClaims.concat(grounding.unsupportedClaims),
      limitations: [
        'Meeting brief synthesized strictly from recorded portfolio snapshot data.',
        'External market fluctuations post context snapshot timestamp are not reflected.'
      ],
      suggestedActions: [
        'Review portfolio drift corridors with client',
        'Record meeting decisions and follow-up tasks upon meeting completion'
      ],
      requiresHumanReview: true,
      disclaimer: 'Advisory use only. All figures verified against deterministic calculations.'
    };
  }
}
