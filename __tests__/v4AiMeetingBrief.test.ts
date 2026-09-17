import { MeetingBriefService } from '../src/services/v4/ai/meetingBriefService';
import { DecisionChallengeService } from '../src/services/v4/ai/decisionChallengeService';
import { CommunicationDrafterService } from '../src/services/v4/ai/communicationDrafter';
import { AiContextSnapshot } from '../src/types/v4/ai';

describe('V4 Phase 4 — Meeting Brief, Decision Challenge & Communication Drafting', () => {
  const snapshot: AiContextSnapshot = {
    snapshotId: 'ctx_meeting_001',
    tenantId: 'firm_alpha',
    clientId: 'client_101',
    taskType: 'MEETING_BRIEF',
    contextAsOf: new Date().toISOString(),
    version: 1,
    clientSnapshot: {
      name: 'Pooja Agarwal',
      riskCategory: 'GROWTH'
    },
    portfolioSnapshot: {
      totalAUM: 75000000,
      currency: 'INR',
      driftScore: 16.4,
      topHoldingsSummary: [{ symbol: 'TCS', weightPct: 22.0 }]
    },
    riskSnapshot: {
      riskScore: 71,
      var95: 5.2
    },
    taxSnapshot: {
      harvestableLosses: 600000,
      shortTermLiabilityEst: 150000,
      longTermLiabilityEst: 200000
    },
    workflowSnapshot: {
      openTasksCount: 2,
      criticalAlertsCount: 0,
      openTaskTitles: ['Review Rebalance Proposal', 'Check Tax Lots']
    }
  };

  test('Generates structured Meeting Brief with verified 4-section breakdown', () => {
    const brief = MeetingBriefService.generateBrief(snapshot);

    expect(brief.taskType).toBe('MEETING_BRIEF');
    expect(brief.clientOverview).toContain('Pooja Agarwal');
    expect(brief.clientOverview).toContain('GROWTH');
    expect(brief.portfolioChanges.keyPoints.join(' ')).toContain('16.4%');
    expect(brief.taxOpportunities.keyPoints.join(' ')).toContain('6,00,000');
    expect(brief.goalsReview.keyPoints.join(' ')).toContain('2 open tasks');
    expect(brief.requiresHumanReview).toBe(true);
  });

  test('Decision Challenge stress-tests thesis with counter-evidence and probing questions', () => {
    const challenge = DecisionChallengeService.challengeThesis('We should liquidate 50% of TCS holding', snapshot);

    expect(challenge.taskType).toBe('DECISION_CHALLENGE');
    expect(challenge.thesis).toBe('We should liquidate 50% of TCS holding');
    expect(challenge.counterEvidence.join(' ')).toContain('capital gains tax liabilities');
    expect(challenge.probingQuestions.length).toBeGreaterThanOrEqual(2);
    expect(challenge.requiresHumanReview).toBe(true);
  });

  test('Communication Drafter drafts reviewable message requiring human sign-off', () => {
    const draft = CommunicationDrafterService.draftCommunication({
      channel: 'EMAIL',
      purpose: 'Quarterly Rebalance Review',
      keyPoints: ['Portfolio drift is 16.4%', '₹6 Lakh tax harvesting identified'],
      snapshot
    });

    expect(draft.channel).toBe('EMAIL');
    expect(draft.subject).toContain('Quarterly Rebalance Review');
    expect(draft.draftBody).toContain('Pooja Agarwal');
    expect(draft.draftBody).toContain('7,50,00,000');
    expect(draft.requiresHumanReview).toBe(true);
    expect(draft.disclaimer).toContain('Not sent automatically');
  });
});
