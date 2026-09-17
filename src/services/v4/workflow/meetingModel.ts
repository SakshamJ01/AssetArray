import {
  MeetingRecord,
  MeetingStatus,
  MeetingNote,
  MeetingAgendaItem,
  MeetingWorkspaceSnapshot,
  AdvisorTask
} from '../../../types/v4/workflow';

export class MeetingStateMachine {
  public static canTransition(currentStatus: MeetingStatus, targetStatus: MeetingStatus): boolean {
    if (currentStatus === targetStatus) return true;

    switch (currentStatus) {
      case 'SCHEDULED':
        return targetStatus === 'IN_PROGRESS' || targetStatus === 'CANCELLED';
      case 'IN_PROGRESS':
        return targetStatus === 'COMPLETED' || targetStatus === 'CANCELLED' || targetStatus === 'SCHEDULED';
      case 'COMPLETED':
        return false; // Terminal state - completed meetings are immutable historical records
      case 'CANCELLED':
        return targetStatus === 'SCHEDULED'; // Rescheduling allowed
      default:
        return false;
    }
  }

  public static startMeeting(meeting: MeetingRecord, actorId: string): MeetingRecord {
    if (!this.canTransition(meeting.status, 'IN_PROGRESS')) {
      throw new Error(`Cannot start meeting currently in ${meeting.status} state`);
    }

    const now = new Date().toISOString();
    return {
      ...meeting,
      status: 'IN_PROGRESS',
      startedAt: meeting.startedAt || now,
      updatedAt: now
    };
  }

  public static completeMeeting(
    meeting: MeetingRecord,
    actorId: string,
    followUpTasksData?: { title: string; description: string; priority?: string; dueDays?: number }[]
  ): { meeting: MeetingRecord; followUpTasks: Partial<AdvisorTask>[] } {
    if (meeting.status === 'COMPLETED') {
      throw new Error(`Meeting ${meeting.meetingId} is already completed (duplicate completion prevented)`);
    }

    if (meeting.status !== 'IN_PROGRESS' && meeting.status !== 'SCHEDULED') {
      throw new Error(`Cannot complete meeting with status ${meeting.status}`);
    }

    const now = new Date().toISOString();
    const completedMeeting: MeetingRecord = {
      ...meeting,
      status: 'COMPLETED',
      endedAt: now,
      updatedAt: now
    };

    // Generate follow-up task records
    const followUpTasks: Partial<AdvisorTask>[] = [];
    if (followUpTasksData && followUpTasksData.length > 0) {
      for (let i = 0; i < followUpTasksData.length; i++) {
        const item = followUpTasksData[i];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (item.dueDays || 3));

        followUpTasks.push({
          taskId: `task_fu_${meeting.meetingId}_${i + 1}`,
          tenantId: meeting.tenantId,
          clientId: meeting.clientId,
          householdId: meeting.householdId,
          title: item.title,
          description: item.description,
          type: 'MEETING_FOLLOW_UP',
          priority: (item.priority as any) || 'MEDIUM',
          status: 'OPEN',
          ownerUserId: actorId,
          createdBy: actorId,
          dueAt: dueDate.toISOString(),
          source: 'MEETING_FOLLOW_UP',
          sourceEntityId: meeting.meetingId,
          evidence: {
            sourceType: 'MEETING_FOLLOW_UP',
            sourceId: meeting.meetingId,
            details: { meetingTitle: meeting.title }
          },
          createdAt: now,
          updatedAt: now
        });
      }
    }

    // Attach generated task IDs to meeting record
    completedMeeting.tasks = [
      ...(completedMeeting.tasks || []),
      ...followUpTasks.map((t) => t.taskId as string)
    ];

    return { meeting: completedMeeting, followUpTasks };
  }

  public static addNote(meeting: MeetingRecord, authorId: string, content: string): MeetingRecord {
    if (meeting.status === 'COMPLETED' || meeting.status === 'CANCELLED') {
      throw new Error(`Cannot add notes to a ${meeting.status} meeting`);
    }
    if (!content || content.trim().length === 0) {
      throw new Error('Note content cannot be empty');
    }

    const now = new Date().toISOString();
    const newNote: MeetingNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      authorId,
      content: content.trim(),
      createdAt: now
    };

    return {
      ...meeting,
      notes: [...(meeting.notes || []), newNote],
      updatedAt: now
    };
  }

  public static validatePayload(payload: Partial<MeetingRecord>): void {
    if (!payload.tenantId) throw new Error('Meeting validation error: tenantId is required');
    if (!payload.clientId) throw new Error('Meeting validation error: clientId is required');
    if (!payload.title || payload.title.trim().length === 0) {
      throw new Error('Meeting validation error: title is required');
    }
    if (!payload.scheduledAt) throw new Error('Meeting validation error: scheduledAt timestamp is required');
  }
}
