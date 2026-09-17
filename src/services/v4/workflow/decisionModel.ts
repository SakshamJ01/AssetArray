import { AdvisorDecision, DecisionStatus, DecisionType, DecisionEvidence } from '../../../types/v4/workflow';

export class DecisionStateMachine {
  public static canTransition(currentStatus: DecisionStatus, targetStatus: DecisionStatus): boolean {
    if (currentStatus === targetStatus) return true;

    switch (currentStatus) {
      case 'DRAFT':
        return targetStatus === 'PENDING_APPROVAL' || targetStatus === 'SUPERSEDED';
      case 'PENDING_APPROVAL':
        return targetStatus === 'APPROVED' || targetStatus === 'REJECTED' || targetStatus === 'SUPERSEDED' || targetStatus === 'DRAFT';
      case 'APPROVED':
        return targetStatus === 'SUPERSEDED'; // Finalized decisions can only be superseded by a subsequent decision
      case 'REJECTED':
        return targetStatus === 'SUPERSEDED';
      case 'SUPERSEDED':
        return false; // Terminal state
      default:
        return false;
    }
  }

  public static approveDecision(
    decision: AdvisorDecision,
    actorId: string,
    actorRole: string,
    notes?: string
  ): AdvisorDecision {
    if (decision.decisionStatus === 'APPROVED') {
      throw new Error(`Decision ${decision.decisionId} is already approved (double approval prevented)`);
    }

    if (decision.decisionStatus !== 'PENDING_APPROVAL' && decision.decisionStatus !== 'DRAFT') {
      throw new Error(`Cannot approve decision in ${decision.decisionStatus} status`);
    }

    // RBAC: Only ADVISOR, ADMIN, or COMPLIANCE can approve fiduciary decisions
    if (!['ADVISOR', 'ADMIN', 'COMPLIANCE'].includes(actorRole)) {
      throw new Error(`Role ${actorRole} is not authorized to approve fiduciary decisions`);
    }

    const now = new Date().toISOString();
    return {
      ...decision,
      decision: 'APPROVE',
      decisionStatus: 'APPROVED',
      decidedBy: actorId,
      decidedAt: now,
      notes: notes || decision.notes,
      updatedAt: now
    };
  }

  public static rejectDecision(
    decision: AdvisorDecision,
    actorId: string,
    actorRole: string,
    reason: string
  ): AdvisorDecision {
    if (decision.decisionStatus === 'REJECTED') {
      throw new Error(`Decision ${decision.decisionId} is already rejected`);
    }

    if (decision.decisionStatus !== 'PENDING_APPROVAL' && decision.decisionStatus !== 'DRAFT') {
      throw new Error(`Cannot reject decision in ${decision.decisionStatus} status`);
    }

    if (!['ADVISOR', 'ADMIN', 'COMPLIANCE', 'OPERATIONS'].includes(actorRole)) {
      throw new Error(`Role ${actorRole} is not authorized to reject fiduciary decisions`);
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }

    const now = new Date().toISOString();
    return {
      ...decision,
      decision: 'REJECT',
      decisionStatus: 'REJECTED',
      decidedBy: actorId,
      decidedAt: now,
      reason: reason.trim(),
      updatedAt: now
    };
  }

  public static validateImmutability(decision: AdvisorDecision, modifications: Partial<AdvisorDecision>): void {
    if (decision.decisionStatus === 'APPROVED' || decision.decisionStatus === 'REJECTED') {
      // Check if critical fields are being changed
      const forbiddenKeys: (keyof AdvisorDecision)[] = [
        'subject',
        'context',
        'beforeState',
        'proposedAction',
        'evidence',
        'decision',
        'decidedBy',
        'decidedAt',
        'reason'
      ];

      for (const key of forbiddenKeys) {
        if (modifications[key] !== undefined && modifications[key] !== decision[key]) {
          throw new Error(
            `Fiduciary Decision ${decision.decisionId} is finalized (${decision.decisionStatus}) and immutable. Cannot modify ${String(key)}. Create a superseding decision instead.`
          );
        }
      }
    }
  }

  public static validatePayload(payload: Partial<AdvisorDecision>): void {
    if (!payload.tenantId) throw new Error('Decision validation error: tenantId is required');
    if (!payload.clientId) throw new Error('Decision validation error: clientId is required');
    if (!payload.subject || payload.subject.trim().length === 0) {
      throw new Error('Decision validation error: subject is required');
    }
    if (!payload.decisionType) throw new Error('Decision validation error: decisionType is required');
  }
}
