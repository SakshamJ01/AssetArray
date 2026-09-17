import { MeetingStateMachine } from '../src/services/v4/workflow/meetingModel';
import { MeetingRecord } from '../src/types/v4/workflow';

describe('V4 Phase 3 — Meeting Workspace Lifecycle & Follow-ups', () => {
  const baseMeeting: MeetingRecord = {
    meetingId: 'mtg_001',
    tenantId: 'firm_alpha',
    clientId: 'client_101',
    title: 'Annual Portfolio & Tax Review',
    status: 'SCHEDULED',
    participants: ['advisor_1', 'client_101'],
    scheduledAt: '2026-09-20T14:00:00Z',
    agenda: [
      { id: 'ag_1', title: 'Review 2026 Performance & TWR', completed: false },
      { id: 'ag_2', title: 'Discuss Retirement Goal Horizon', completed: false }
    ],
    notes: [],
    decisions: [],
    tasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  test('Permits legal transition SCHEDULED -> IN_PROGRESS', () => {
    const started = MeetingStateMachine.startMeeting(baseMeeting, 'advisor_1');
    expect(started.status).toBe('IN_PROGRESS');
    expect(started.startedAt).toBeDefined();
  });

  test('Allows adding live notes during meeting', () => {
    const withNote = MeetingStateMachine.addNote(
      baseMeeting,
      'advisor_1',
      'Client wants to reduce equity exposure before November.'
    );
    expect(withNote.notes).toHaveLength(1);
    expect(withNote.notes[0].content).toBe('Client wants to reduce equity exposure before November.');
  });

  test('Completing meeting transitions status to COMPLETED and generates follow-up tasks', () => {
    const inProgress = MeetingStateMachine.startMeeting(baseMeeting, 'advisor_1');
    const { meeting, followUpTasks } = MeetingStateMachine.completeMeeting(inProgress, 'advisor_1', [
      { title: 'Send updated asset allocation report', description: 'Include tax analysis', dueDays: 2, priority: 'HIGH' },
      { title: 'Schedule follow-up on trust estate documents', description: 'Check with attorney', dueDays: 7 }
    ]);

    expect(meeting.status).toBe('COMPLETED');
    expect(meeting.endedAt).toBeDefined();
    expect(followUpTasks).toHaveLength(2);
    expect(followUpTasks[0].source).toBe('MEETING_FOLLOW_UP');
    expect(followUpTasks[0].sourceEntityId).toBe('mtg_001');
    expect(meeting.tasks).toContain(followUpTasks[0].taskId);
  });

  test('Prevents duplicate completion of an already completed meeting', () => {
    const inProgress = MeetingStateMachine.startMeeting(baseMeeting, 'advisor_1');
    const { meeting } = MeetingStateMachine.completeMeeting(inProgress, 'advisor_1');

    expect(() => {
      MeetingStateMachine.completeMeeting(meeting, 'advisor_1');
    }).toThrow(/already completed/i);
  });

  test('Rejects adding notes to a completed meeting', () => {
    const inProgress = MeetingStateMachine.startMeeting(baseMeeting, 'advisor_1');
    const { meeting } = MeetingStateMachine.completeMeeting(inProgress, 'advisor_1');

    expect(() => {
      MeetingStateMachine.addNote(meeting, 'advisor_1', 'Belated note');
    }).toThrow(/cannot add notes to a COMPLETED meeting/i);
  });
});
