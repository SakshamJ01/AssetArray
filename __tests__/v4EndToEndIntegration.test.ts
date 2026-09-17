import { describe, it, expect, beforeEach } from '@jest/globals';
import { runIngestionPipeline, clearIngestionMemory } from '../src/services/v4/ingestion/ingestionPipeline';
import { generateRebalanceProposal } from '../src/services/v4/rebalancing/rebalanceSandbox';
import { DecisionStateMachine } from '../src/services/v4/workflow/decisionModel';
import { MeetingStateMachine } from '../src/services/v4/workflow/meetingModel';
import { V4AiTaskRouter } from '../src/services/v4/ai/aiTaskRouter';
import { V4ContextBuilder } from '../src/services/v4/ai/contextBuilder';
import { ReportGenerator } from '../src/services/v4/reporting/reportGenerator';
import { ReportSnapshotModel } from '../src/services/v4/reporting/reportSnapshotModel';
import { ClientSafeFilter } from '../src/services/v4/reporting/clientSafeFilter';
import { ReportShareService } from '../src/services/v4/reporting/shareService';
import { PortalService } from '../src/services/v4/portal/portalService';
import { PortalActionService } from '../src/services/v4/portal/portalActionService';
import { CanonicalRecord, DriftCorridorConfig } from '../src/types/v4/computation';
import { AdvisorDecision, MeetingRecord } from '../src/types/v4/workflow';
import { ReportSnapshot, PortalActionItem, PortalPortfolioView } from '../src/types/v4/reporting';

describe('AssetArray V4.0 — Integrated End-to-End Pipeline (Phases 1 → 5)', () => {
  const tenantId = 'firm_apex_wealth';
  const advisorId = 'adv_rahul_kapoor';
  const clientId = 'cli_pooja_sharma';
  const householdId = 'hh_sharma_family';
  const portfolioId = 'port_primary_growth';

  beforeEach(() => {
    clearIngestionMemory();
  });

  it('Executes the complete canonical pipeline: Ingestion → Computation → Workflow → AI → Report → Portal', () => {
    // ==========================================
    // STEP 1: INGESTION & DATA PROVENANCE (Phase 2)
    // ==========================================
    const csvData = `Symbol,Instrument,Quantity,Avg Price,LTP,Current Value
HDFCBANK,HDFC Bank Ltd,2000,1400.00,1650.00,3300000
INFY,Infosys Ltd,1500,1300.00,1500.00,2250000
GOI_BOND,Government of India Bond 7.18%,1000,1000.00,1020.00,1020000
CASH_INR,Cash Reserves,500000,1.00,1.00,500000`;

    const ingestionJob = runIngestionPipeline({
      tenantId,
      sourceType: 'STATEMENT_TEXT',
      sourceName: 'Apex Custodial Statement',
      rawInput: csvData,
      createdBy: advisorId
    });

    expect(ingestionJob.status).toBe('COMPLETED');
    expect(ingestionJob.records).toBeDefined();
    expect(ingestionJob.records?.length).toBe(4);

    const records = ingestionJob.records || [];
    const totalAUM = records.reduce((sum: number, r: any) => sum + r.currentValue, 0);
    expect(totalAUM).toBe(7070000);

    // ==========================================
    // STEP 2: DETERMINISTIC COMPUTATION (Phase 2)
    // ==========================================
    const holdings: CanonicalRecord[] = records.map((r, idx) => ({
      canonicalId: `c_${idx}`,
      tenantId,
      symbol: r.symbol,
      securityName: r.securityName,
      quantity: r.quantity,
      price: r.price,
      investedAmount: r.investedAmount,
      currentValue: r.currentValue,
      currency: 'INR',
      assetClass: r.assetClass || (r.symbol.includes('BOND') ? 'Fixed Income' : r.symbol.includes('CASH') ? 'Cash' : 'Equity'),
      acquisitionDate: '2023-01-15',
      provenance: { source: 'CSV', ingestionJobId: ingestionJob.jobId, asOf: '2026-09-17', method: 'INGESTION', confidence: 'HIGH' },
      qualityState: 'COMPLETE',
      unmappedFields: []
    }));

    const corridors: DriftCorridorConfig[] = [
      { assetClass: 'Equity', targetWeightPct: 60, lowerBandPct: 5, upperBandPct: 5 },
      { assetClass: 'Fixed Income', targetWeightPct: 30, lowerBandPct: 5, upperBandPct: 5 },
      { assetClass: 'Cash', targetWeightPct: 10, lowerBandPct: 5, upperBandPct: 5 }
    ];

    const rebalanceProposal = generateRebalanceProposal({
      tenantId,
      portfolioId,
      holdings,
      corridors
    });

    expect(rebalanceProposal.isImmutable).toBe(true);
    expect(rebalanceProposal.candidates).toBeDefined();
    expect(rebalanceProposal.candidates.length).toBeGreaterThan(0);

    // ==========================================
    // STEP 3: WORKFLOW, DECISION & MEETING (Phase 3)
    // ==========================================
    const baseDecision: AdvisorDecision = {
      decisionId: 'dec_reb_001',
      tenantId,
      clientId,
      portfolioId,
      decisionType: 'REBALANCE',
      subject: 'Quarterly Rebalancing to Correct Equity Drift',
      context: 'Equity allocation drifted to 78.5% versus 60% target model.',
      evidence: {
        sourceType: 'REBALANCE_PROPOSAL',
        sourceId: 'prop_001',
        riskImpact: { priorRiskScore: 72, targetRiskScore: 65, postTradeRiskScore: 66 }
      },
      beforeState: { driftScore: 13.5 },
      proposedAction: { targetDriftScore: 1.0 },
      decision: 'DEFER',
      decisionStatus: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    // Advisor reviews and approves decision
    const approvedDecision = DecisionStateMachine.approveDecision(
      baseDecision,
      advisorId,
      'ADVISOR',
      'Client verbally approved reallocation during quarterly review call.'
    );
    expect(approvedDecision.decisionStatus).toBe('APPROVED');
    expect(approvedDecision.decidedBy).toBe(advisorId);

    // Conduct and record meeting
    const baseMeeting: MeetingRecord = {
      meetingId: 'mtg_001',
      tenantId,
      clientId,
      title: 'Q3 Comprehensive Wealth Review',
      status: 'SCHEDULED',
      participants: [advisorId, clientId],
      scheduledAt: '2026-09-17T14:00:00Z',
      agenda: [
        { id: 'ag_1', title: 'Review 2026 Performance & TWR', completed: true },
        { id: 'ag_2', title: 'Approve Rebalance Proposal', completed: true }
      ],
      notes: [{ id: 'n_1', authorId: advisorId, content: 'Client aligned with mandate.', createdAt: new Date().toISOString() }],
      decisions: [approvedDecision.decisionId],
      tasks: ['task_followup_tax_lots'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const inProgressMeeting = MeetingStateMachine.startMeeting(baseMeeting, advisorId);
    const completedResult = MeetingStateMachine.completeMeeting(inProgressMeeting, advisorId);
    expect(completedResult.meeting.status).toBe('COMPLETED');

    // ==========================================
    // STEP 4: GROUNDED AI SYNTHESIS (Phase 4)
    // ==========================================
    const aiContext = V4ContextBuilder.buildSnapshot({
      tenantId,
      taskType: 'CLIENT_SUMMARY',
      rawClientData: { name: 'Pooja Sharma', riskProfile: 'BALANCED' },
      rawPortfolioData: {
        totalAUM,
        driftScore: 13.5,
        healthScore: 88,
        topHoldings: [{ symbol: 'HDFCBANK', weightPct: 46.7, currentVal: 3300000 }]
      },
      rawTaxData: { harvestableLosses: 45000 }
    });

    const aiSynthesis = V4AiTaskRouter.executeDeterministicFallback(aiContext);
    expect(aiSynthesis.isDeterministicFallback).toBe(true);
    expect(aiSynthesis.rawText).toContain('Pooja Sharma');

    // ==========================================
    // STEP 5: REPORT GENERATION & APPROVAL (Phase 5)
    // ==========================================
    const draftReport: ReportSnapshot = ReportGenerator.generateSnapshot({
      tenantId,
      clientId,
      householdId,
      portfolioId,
      reportType: 'CLIENT_REVIEW_REPORT',
      currency: 'INR',
      actorId: advisorId,
      clientData: { name: 'Pooja Sharma', riskProfile: 'BALANCED' },
      portfolioData: {
        totalAUM,
        driftScore: 13.5,
        healthScore: 88,
        topHoldings: [
          { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', weightPct: 46.7, currentVal: 3300000 },
          { symbol: 'INFY', name: 'Infosys Ltd', weightPct: 31.8, currentVal: 2250000 }
        ]
      },
      goalsData: [
        { title: 'Children Education Fund', targetAmount: 10000000, currentAmount: 7070000, onTrack: true }
      ],
      aiNarrative: { executiveSummary: aiSynthesis.rawText }
    });

    expect(draftReport.status).toBe('GENERATED');

    // Lifecycle transitions: REVIEWED → APPROVED → PUBLISHED
    const reviewedReport = ReportSnapshotModel.transitionStatus(draftReport, 'REVIEWED', advisorId, 'ADVISOR');
    const approvedReport = ReportSnapshotModel.transitionStatus(reviewedReport, 'APPROVED', advisorId, 'ADVISOR');
    expect(approvedReport.isImmutable).toBe(true);

    const publishedReport = ReportSnapshotModel.transitionStatus(approvedReport, 'PUBLISHED', advisorId, 'ADVISOR');
    expect(publishedReport.status).toBe('PUBLISHED');

    // ==========================================
    // STEP 6: CLIENT-SAFE FILTER & EPHEMERAL SHARING (Phase 5)
    // ==========================================
    const clientSafeView = ClientSafeFilter.filterReportForClient(publishedReport, 'Pooja Sharma', totalAUM);
    expect(clientSafeView.reportId).toBe(publishedReport.reportId);
    expect(clientSafeView.totalAUM).toBe(totalAUM);
    expect(clientSafeView.disclosures.length).toBeGreaterThan(0);

    const shareToken = ReportShareService.generateShareToken(tenantId, publishedReport.reportId, clientId, 72);
    const tokenValidation = ReportShareService.validateToken(shareToken);
    expect(tokenValidation.isValid).toBe(true);

    // ==========================================
    // STEP 7: INVESTOR PORTAL AGGREGATOR & ACTIONS (Phase 5)
    // ==========================================
    const mockPortfolioView: PortalPortfolioView = {
      totalAUM,
      currency: 'INR',
      asOfDate: '2026-09-17',
      assetAllocation: [
        { assetClass: 'Equity', percentage: 78.5, amount: 5550000 },
        { assetClass: 'Fixed Income', percentage: 14.4, amount: 1020000 },
        { assetClass: 'Cash', percentage: 7.1, amount: 500000 }
      ],
      topHoldings: [
        { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', weightPct: 46.7, currentVal: 3300000 },
        { symbol: 'INFY', name: 'Infosys Ltd', weightPct: 31.8, currentVal: 2250000 }
      ],
      performanceSummary: [
        { period: '1Y', returnPct: 16.4 },
        { period: 'Since Inception', returnPct: 24.8 }
      ]
    };

    const actionItem: PortalActionItem = {
      actionId: 'act_sign_mandate',
      tenantId,
      clientId,
      title: 'Review updated risk mandate disclosure',
      description: 'Annual suitability and mandate risk profile review',
      type: 'REVIEW_DOCUMENT',
      status: 'PENDING',
      dueAt: '2026-10-15',
      createdAt: '2026-09-17T10:00:00Z'
    };

    const portalOverview = PortalService.buildPortalView(
      { clientId, tenantId, name: 'Pooja Sharma', email: 'pooja@sharmafamily.com' },
      mockPortfolioView,
      [
        { goalId: 'goal_1', title: 'Children Education Fund', targetAmount: 10000000, currentAmount: 7070000, targetDate: '2032-06-01', onTrack: true, probabilityPct: 91 }
      ],
      [publishedReport],
      [],
      [actionItem]
    );

    // Client views portal
    expect(portalOverview.profile.name).toBe('Pooja Sharma');
    expect(portalOverview.portfolio.totalAUM).toBe(7070000);
    expect(portalOverview.publishedReports).toHaveLength(1);
    expect(portalOverview.publishedReports[0].reportId).toBe(publishedReport.reportId);
    expect(portalOverview.actionItems).toHaveLength(1);

    // Client completes action item
    const completedAction = PortalActionService.respondToActionItem(
      actionItem,
      'Confirmed review of mandate parameters. Agreed to balanced profile.',
      'COMPLETED'
    );
    expect(completedAction.status).toBe('COMPLETED');
    expect(completedAction.completedAt).toBeDefined();

    // Verify immutability: published report cannot be altered
    expect(() => {
      ReportSnapshotModel.validateImmutability(publishedReport, {
        currency: 'USD'
      });
    }).toThrow(/Cannot modify protected field currency/i);
  });
});
