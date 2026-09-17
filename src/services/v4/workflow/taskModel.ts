import { AdvisorTask, TaskStatus, TaskPriority, TaskSourceType } from '../../../types/v4/workflow';

/**
 * Valid state transitions for AdvisorTask.
 * Strict finite state machine:
 * OPEN -> IN_PROGRESS, SNOOZED, BLOCKED, CANCELLED, DONE
 * IN_PROGRESS -> BLOCKED, SNOOZED, CANCELLED, DONE
 * SNOOZED -> OPEN, IN_PROGRESS, CANCELLED
 * BLOCKED -> OPEN, IN_PROGRESS, CANCELLED
 * CANCELLED -> Terminal (or explicitly reopened to OPEN by ADMIN)
 * DONE -> Terminal (or explicitly reopened to OPEN by ADMIN)
 */
export const VALID_TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  OPEN: ['IN_PROGRESS', 'SNOOZED', 'BLOCKED', 'CANCELLED', 'DONE'],
  IN_PROGRESS: ['BLOCKED', 'SNOOZED', 'CANCELLED', 'DONE', 'OPEN'],
  SNOOZED: ['OPEN', 'IN_PROGRESS', 'CANCELLED'],
  BLOCKED: ['OPEN', 'IN_PROGRESS', 'CANCELLED'],
  DONE: ['OPEN'], // Allowed only via explicit supervisor override
  CANCELLED: ['OPEN'] // Allowed only via explicit supervisor override
};

export class TaskStateMachine {
  public static canTransition(currentStatus: TaskStatus, newStatus: TaskStatus, userRole?: string): boolean {
    if (currentStatus === newStatus) return true;

    // Terminal state reopen protection
    if ((currentStatus === 'DONE' || currentStatus === 'CANCELLED') && newStatus === 'OPEN') {
      return userRole === 'ADMIN' || userRole === 'COMPLIANCE' || userRole === 'ADVISOR';
    }

    const allowed = VALID_TASK_TRANSITIONS[currentStatus] || [];
    return allowed.includes(newStatus);
  }

  public static transitionTask(
    task: AdvisorTask,
    newStatus: TaskStatus,
    actorId: string,
    actorRole: string,
    note?: string,
    snoozedUntil?: string
  ): AdvisorTask {
    if (!this.canTransition(task.status, newStatus, actorRole)) {
      throw new Error(
        `Illegal task state transition from ${task.status} to ${newStatus} for role ${actorRole}`
      );
    }

    const now = new Date().toISOString();
    const updated: AdvisorTask = {
      ...task,
      status: newStatus,
      updatedAt: now
    };

    if (newStatus === 'DONE') {
      updated.completedAt = now;
      updated.completionNote = note || task.completionNote;
    } else if (newStatus === 'SNOOZED') {
      if (!snoozedUntil) {
        throw new Error('Snoozing a task requires a valid snoozedUntil date');
      }
      updated.snoozedUntil = snoozedUntil;
    } else if (newStatus === 'BLOCKED') {
      updated.blockReason = note || 'Blocked pending dependency resolution';
    } else if (newStatus === 'CANCELLED') {
      updated.cancellationReason = note || 'Cancelled by advisor';
    }

    return updated;
  }

  public static validateTaskPayload(payload: Partial<AdvisorTask>): void {
    if (!payload.tenantId || typeof payload.tenantId !== 'string' || payload.tenantId.trim().length === 0) {
      throw new Error('Task validation error: tenantId is required');
    }
    if (!payload.clientId || typeof payload.clientId !== 'string' || payload.clientId.trim().length === 0) {
      throw new Error('Task validation error: clientId is required');
    }
    if (!payload.title || typeof payload.title !== 'string' || payload.title.trim().length === 0) {
      throw new Error('Task validation error: title is required');
    }
    if (!payload.ownerUserId || typeof payload.ownerUserId !== 'string' || payload.ownerUserId.trim().length === 0) {
      throw new Error('Task validation error: ownerUserId is required');
    }
    if (payload.priority && !['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(payload.priority)) {
      throw new Error(`Task validation error: invalid priority ${payload.priority}`);
    }
    if (payload.status && !['OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED', 'SNOOZED'].includes(payload.status)) {
      throw new Error(`Task validation error: invalid status ${payload.status}`);
    }
  }
}
