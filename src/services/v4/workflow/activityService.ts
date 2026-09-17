import { ActivityEvent, ActivityEventType } from '../../../types/v4/workflow';

export class ActivityTimelineService {
  /**
   * Builds an ActivityEvent record.
   */
  public static createEvent(
    tenantId: string,
    eventType: ActivityEventType,
    entityType: ActivityEvent['entityType'],
    entityId: string,
    actorId: string,
    actorRole: string,
    summary: string,
    context?: {
      clientId?: string;
      householdId?: string;
      portfolioId?: string;
      metadata?: Record<string, unknown>;
    }
  ): ActivityEvent {
    if (!tenantId) throw new Error('ActivityEvent requires tenantId');
    if (!eventType) throw new Error('ActivityEvent requires eventType');
    if (!entityId) throw new Error('ActivityEvent requires entityId');

    return {
      eventId: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      tenantId,
      eventType,
      entityType,
      entityId,
      clientId: context?.clientId,
      householdId: context?.householdId,
      portfolioId: context?.portfolioId,
      actorId: actorId || 'SYSTEM',
      actorRole: actorRole || 'SYSTEM',
      timestamp: new Date().toISOString(),
      summary,
      metadata: context?.metadata
    };
  }

  /**
   * Filters and sorts an array of activity events chronologically (most recent first).
   */
  public static filterTimeline(
    events: ActivityEvent[],
    tenantId: string,
    filters?: {
      clientId?: string;
      householdId?: string;
      portfolioId?: string;
      entityType?: string;
      limit?: number;
    }
  ): ActivityEvent[] {
    return events
      .filter((e) => {
        if (e.tenantId !== tenantId) return false;
        if (filters?.clientId && e.clientId !== filters.clientId) return false;
        if (filters?.householdId && e.householdId !== filters.householdId) return false;
        if (filters?.portfolioId && e.portfolioId !== filters.portfolioId) return false;
        if (filters?.entityType && e.entityType !== filters.entityType) return false;
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, filters?.limit || 50);
  }
}
