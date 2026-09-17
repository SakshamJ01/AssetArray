import { AdvisorTask, TaskPriority, TaskSourceType, TaskEvidence } from '../../../types/v4/workflow';

export interface DiscrepancyInput {
  discrepancyId: string;
  tenantId: string;
  clientId: string;
  portfolioId?: string;
  holdingSymbol?: string;
  expectedQty: number;
  observedQty: number;
  differenceQty: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  source: string;
  asOfDate: string;
}

export interface RebalanceProposalInput {
  proposalId: string;
  tenantId: string;
  clientId: string;
  portfolioId: string;
  totalDriftScore: number;
  tradesCount: number;
  estimatedTaxImpact: number;
  createdAt: string;
}

export interface TaxOpportunityInput {
  opportunityId: string;
  tenantId: string;
  clientId: string;
  portfolioId: string;
  symbol: string;
  unrealizedLoss: number;
  estimatedTaxSavings: number;
}

export interface GoalDeteriorationInput {
  goalId: string;
  tenantId: string;
  clientId: string;
  goalName: string;
  previousProbability: number;
  currentProbability: number;
}

export class TaskGenerator {
  /**
   * Generates a Review Task from a Phase 2 Reconciliation discrepancy.
   */
  public static fromReconciliation(
    input: DiscrepancyInput,
    ownerUserId: string,
    existingOpenTasks: AdvisorTask[] = []
  ): AdvisorTask | null {
    // Deduplication check: Do not duplicate if an OPEN or IN_PROGRESS task exists for this discrepancy
    const exists = existingOpenTasks.some(
      (t) =>
        t.tenantId === input.tenantId &&
        t.source === 'RECONCILIATION' &&
        t.sourceEntityId === input.discrepancyId &&
        ['OPEN', 'IN_PROGRESS'].includes(t.status)
    );

    if (exists) {
      return null;
    }

    const now = new Date().toISOString();
    const evidence: TaskEvidence = {
      sourceType: 'RECONCILIATION',
      sourceId: input.discrepancyId,
      metric: input.holdingSymbol ? `Position Break: ${input.holdingSymbol}` : 'Reconciliation Break',
      discrepancyAmount: input.differenceQty,
      expectedValue: input.expectedQty,
      observedValue: input.observedQty,
      asOfDate: input.asOfDate,
      details: {
        source: input.source,
        portfolioId: input.portfolioId,
        holdingSymbol: input.holdingSymbol
      }
    };

    return {
      taskId: `task_recon_${input.discrepancyId}_${Date.now()}`,
      tenantId: input.tenantId,
      clientId: input.clientId,
      portfolioId: input.portfolioId,
      title: `Resolve Custody Discrepancy: ${input.holdingSymbol || 'Portfolio'} (${input.source})`,
      description: `Discrepancy detected between custodian feed and internal ledger: Expected ${input.expectedQty}, Observed ${input.observedQty} (Diff: ${input.differenceQty}).`,
      type: 'RECONCILIATION_REVIEW',
      priority: input.severity as TaskPriority,
      status: 'OPEN',
      ownerUserId,
      createdBy: 'SYSTEM_RECONCILIATION_ENGINE',
      source: 'RECONCILIATION',
      sourceEntityId: input.discrepancyId,
      evidence,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Generates a Rebalance Review Task from a Phase 2 Rebalance Proposal.
   */
  public static fromRebalanceProposal(
    input: RebalanceProposalInput,
    ownerUserId: string,
    existingOpenTasks: AdvisorTask[] = []
  ): AdvisorTask | null {
    const exists = existingOpenTasks.some(
      (t) =>
        t.tenantId === input.tenantId &&
        t.source === 'REBALANCE_PROPOSAL' &&
        t.sourceEntityId === input.proposalId &&
        ['OPEN', 'IN_PROGRESS'].includes(t.status)
    );

    if (exists) {
      return null;
    }

    const now = new Date().toISOString();
    const priority: TaskPriority = input.totalDriftScore > 15 ? 'HIGH' : 'MEDIUM';

    const evidence: TaskEvidence = {
      sourceType: 'REBALANCE_PROPOSAL',
      sourceId: input.proposalId,
      metric: 'Portfolio Drift & Rebalance Proposal',
      expectedValue: 'Target Allocation',
      observedValue: `Drift Score: ${input.totalDriftScore}%`,
      details: {
        tradesCount: input.tradesCount,
        estimatedTaxImpact: input.estimatedTaxImpact,
        portfolioId: input.portfolioId
      }
    };

    return {
      taskId: `task_rebal_${input.proposalId}_${Date.now()}`,
      tenantId: input.tenantId,
      clientId: input.clientId,
      portfolioId: input.portfolioId,
      title: `Review Rebalance Proposal (Drift: ${input.totalDriftScore}%)`,
      description: `Immutable rebalance proposal generated with ${input.tradesCount} proposed trades. Estimated tax impact: $${input.estimatedTaxImpact.toLocaleString()}.`,
      type: 'REBALANCE_REVIEW',
      priority,
      status: 'OPEN',
      ownerUserId,
      createdBy: 'SYSTEM_REBALANCE_ENGINE',
      source: 'REBALANCE_PROPOSAL',
      sourceEntityId: input.proposalId,
      evidence,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Generates a Tax Review Task from tax-loss harvesting opportunity.
   */
  public static fromTaxOpportunity(
    input: TaxOpportunityInput,
    ownerUserId: string,
    existingOpenTasks: AdvisorTask[] = []
  ): AdvisorTask | null {
    const exists = existingOpenTasks.some(
      (t) =>
        t.tenantId === input.tenantId &&
        t.source === 'TAX' &&
        t.sourceEntityId === input.opportunityId &&
        ['OPEN', 'IN_PROGRESS'].includes(t.status)
    );

    if (exists) {
      return null;
    }

    const now = new Date().toISOString();
    const priority: TaskPriority = Math.abs(input.unrealizedLoss) > 5000 ? 'HIGH' : 'MEDIUM';

    const evidence: TaskEvidence = {
      sourceType: 'TAX',
      sourceId: input.opportunityId,
      metric: `Tax Loss Opportunity (${input.symbol})`,
      discrepancyAmount: input.unrealizedLoss,
      details: {
        symbol: input.symbol,
        estimatedTaxSavings: input.estimatedTaxSavings,
        portfolioId: input.portfolioId
      }
    };

    return {
      taskId: `task_tax_${input.opportunityId}_${Date.now()}`,
      tenantId: input.tenantId,
      clientId: input.clientId,
      portfolioId: input.portfolioId,
      title: `Tax-Loss Harvesting Review: ${input.symbol}`,
      description: `Unrealized loss of $${Math.abs(input.unrealizedLoss).toLocaleString()} detected in ${input.symbol}. Potential tax savings: $${input.estimatedTaxSavings.toLocaleString()}.`,
      type: 'TAX_REVIEW',
      priority,
      status: 'OPEN',
      ownerUserId,
      createdBy: 'SYSTEM_TAX_ENGINE',
      source: 'TAX',
      sourceEntityId: input.opportunityId,
      evidence,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Generates a Goal Review Task when goal probability drops below threshold.
   */
  public static fromGoalDeterioration(
    input: GoalDeteriorationInput,
    ownerUserId: string,
    existingOpenTasks: AdvisorTask[] = []
  ): AdvisorTask | null {
    const exists = existingOpenTasks.some(
      (t) =>
        t.tenantId === input.tenantId &&
        t.source === 'GOAL' &&
        t.sourceEntityId === input.goalId &&
        ['OPEN', 'IN_PROGRESS'].includes(t.status)
    );

    if (exists) {
      return null;
    }

    const now = new Date().toISOString();
    const priority: TaskPriority = input.currentProbability < 50 ? 'CRITICAL' : 'HIGH';

    const evidence: TaskEvidence = {
      sourceType: 'GOAL',
      sourceId: input.goalId,
      metric: `Goal Success Probability (${input.goalName})`,
      expectedValue: `${input.previousProbability}%`,
      observedValue: `${input.currentProbability}%`,
      details: {
        goalName: input.goalName,
        probabilityDelta: input.currentProbability - input.previousProbability
      }
    };

    return {
      taskId: `task_goal_${input.goalId}_${Date.now()}`,
      tenantId: input.tenantId,
      clientId: input.clientId,
      title: `Goal Deterioration Alert: ${input.goalName}`,
      description: `Probability of achieving ${input.goalName} decreased from ${input.previousProbability}% to ${input.currentProbability}%.`,
      type: 'GOAL_REVIEW',
      priority,
      status: 'OPEN',
      ownerUserId,
      createdBy: 'SYSTEM_GOAL_ENGINE',
      source: 'GOAL',
      sourceEntityId: input.goalId,
      evidence,
      createdAt: now,
      updatedAt: now
    };
  }
}
