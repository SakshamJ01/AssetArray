import { AiContextSnapshot, V4AiTaskType } from '../../../types/v4/ai';
import { sanitizeUntrustedInput } from '../../aiGateway/grounding';

export interface ContextBuilderOptions {
  tenantId: string;
  taskType: V4AiTaskType;
  clientId?: string;
  householdId?: string;
  portfolioId?: string;
  rawClientData?: Record<string, any>;
  rawPortfolioData?: Record<string, any>;
  rawRiskData?: Record<string, any>;
  rawTaxData?: Record<string, any>;
  rawWorkflowData?: Record<string, any>;
  rawResearchData?: Record<string, any>[];
  untrustedNotes?: string[];
}

export class V4ContextBuilder {
  /**
   * Deterministically builds a data-minimized, prompt-injection-safe AI context snapshot.
   */
  public static buildSnapshot(options: ContextBuilderOptions): AiContextSnapshot {
    if (!options.tenantId || typeof options.tenantId !== 'string' || options.tenantId.trim().length === 0) {
      throw new Error('ContextBuilder error: tenantId is required');
    }
    if (!options.taskType) {
      throw new Error('ContextBuilder error: taskType is required');
    }

    const now = new Date().toISOString();
    const snapshotId = `ctx_${options.tenantId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const snapshot: AiContextSnapshot = {
      snapshotId,
      tenantId: options.tenantId,
      clientId: options.clientId,
      householdId: options.householdId,
      portfolioId: options.portfolioId,
      taskType: options.taskType,
      contextAsOf: now,
      version: 1
    };

    // 1. Data Minimization per Task Type
    const needsClient = ['ADVISOR_BRIEF', 'MEETING_BRIEF', 'CLIENT_SUMMARY', 'CLIENT_COMMUNICATION_DRAFT'].includes(options.taskType);
    if (needsClient && options.rawClientData) {
      snapshot.clientSnapshot = {
        name: options.rawClientData.name || 'Client',
        riskCategory: options.rawClientData.riskCategory || 'MODERATE',
        lifecycleStage: options.rawClientData.lifecycleStage,
        taxStatus: options.rawClientData.taxStatus || 'RESIDENT_INDIVIDUAL'
      };
    }

    const needsPortfolio = [
      'ADVISOR_BRIEF',
      'MEETING_BRIEF',
      'PORTFOLIO_EXPLANATION',
      'REBALANCE_EXPLANATION',
      'CLIENT_SUMMARY',
      'DECISION_CHALLENGE'
    ].includes(options.taskType);

    if (needsPortfolio && options.rawPortfolioData) {
      snapshot.portfolioSnapshot = {
        totalAUM: options.rawPortfolioData.totalAUM || 0,
        currency: options.rawPortfolioData.currency || 'INR',
        healthScore: options.rawPortfolioData.healthScore,
        driftScore: options.rawPortfolioData.driftScore,
        topHoldingsSummary: options.rawPortfolioData.topHoldingsSummary || [],
        assetAllocation: options.rawPortfolioData.assetAllocation || {}
      };
    }

    const needsRisk = ['ADVISOR_BRIEF', 'MEETING_BRIEF', 'RISK_EXPLANATION', 'DECISION_CHALLENGE'].includes(options.taskType);
    if (needsRisk && options.rawRiskData) {
      snapshot.riskSnapshot = {
        riskScore: options.rawRiskData.riskScore,
        var95: options.rawRiskData.var95,
        cvar95: options.rawRiskData.cvar95,
        beta: options.rawRiskData.beta,
        sharpeRatio: options.rawRiskData.sharpeRatio
      };
    }

    const needsTax = ['ADVISOR_BRIEF', 'MEETING_BRIEF', 'TAX_EXPLANATION'].includes(options.taskType);
    if (needsTax && options.rawTaxData) {
      snapshot.taxSnapshot = {
        unrealizedGains: options.rawTaxData.unrealizedGains || 0,
        unrealizedLosses: options.rawTaxData.unrealizedLosses || 0,
        harvestableLosses: options.rawTaxData.harvestableLosses || 0,
        shortTermLiabilityEst: options.rawTaxData.shortTermLiabilityEst || 0,
        longTermLiabilityEst: options.rawTaxData.longTermLiabilityEst || 0
      };
    }

    const needsWorkflow = ['ADVISOR_BRIEF', 'MEETING_BRIEF', 'CLIENT_SUMMARY'].includes(options.taskType);
    if (needsWorkflow && options.rawWorkflowData) {
      snapshot.workflowSnapshot = {
        openTasksCount: options.rawWorkflowData.openTasksCount || 0,
        criticalAlertsCount: options.rawWorkflowData.criticalAlertsCount || 0,
        pendingDecisionsCount: options.rawWorkflowData.pendingDecisionsCount || 0,
        lastMeetingDate: options.rawWorkflowData.lastMeetingDate,
        openTaskTitles: options.rawWorkflowData.openTaskTitles || []
      };
    }

    if (options.taskType === 'RESEARCH_SUMMARY' && options.rawResearchData) {
      snapshot.researchEvidence = options.rawResearchData.map((r, i) => ({
        sourceId: r.sourceId || `src_${i + 1}`,
        title: r.title || 'Research Document',
        asOfDate: r.asOfDate || now.split('T')[0],
        isCurrent: r.isCurrent !== false,
        keyFacts: r.keyFacts || []
      }));
    }

    // 2. Untrusted text sanitization & prompt injection neutralization
    if (options.untrustedNotes && options.untrustedNotes.length > 0) {
      snapshot.untrustedTextBlocks = options.untrustedNotes.map((note, index) => {
        const sanitized = sanitizeUntrustedInput(note);
        return {
          field: `note_${index + 1}`,
          sanitizedContent: sanitized.sanitizedText
        };
      });
    }

    return snapshot;
  }
}
