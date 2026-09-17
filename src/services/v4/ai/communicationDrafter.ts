import {
  AiContextSnapshot,
  ClientCommunicationDraft,
  AiConfidence
} from '../../../types/v4/ai';
import { V4GroundingEngine } from './groundingEngine';

export interface DraftCommunicationInput {
  channel: 'EMAIL' | 'WHATSAPP' | 'SMS' | 'MEMO';
  purpose: string;
  keyPoints?: string[];
  snapshot: AiContextSnapshot;
}

export class CommunicationDrafterService {
  /**
   * Generates a reviewable draft of client communication (Email, WhatsApp, SMS, Memo).
   * Strictly enforces Human-in-the-Loop review before dispatch.
   */
  public static draftCommunication(input: DraftCommunicationInput): ClientCommunicationDraft {
    const { channel, purpose, keyPoints = [], snapshot } = input;
    const clientName = snapshot.clientSnapshot?.name || 'Valued Client';
    const aumStr = snapshot.portfolioSnapshot?.totalAUM
      ? `₹${snapshot.portfolioSnapshot.totalAUM.toLocaleString('en-IN')}`
      : 'your portfolio';

    let subject = '';
    let draftBody = '';
    const talkingPoints: string[] = [];

    if (channel === 'EMAIL') {
      subject = `AssetArray Portfolio Update — ${purpose}`;
      draftBody = `Dear ${clientName},\n\nI hope this email finds you well.\n\nI am writing regarding ${purpose.toLowerCase()}. Currently, your total portfolio under management stands at ${aumStr}.\n\nKey points for your review:\n` +
        (keyPoints.length > 0 ? keyPoints.map((k) => `• ${k}`).join('\n') : '• We have completed your scheduled portfolio review and rebalancing assessment.') +
        `\n\nPlease let me know when you are available for a brief call to discuss.\n\nWarm regards,\nYour Wealth Advisory Team`;
    } else if (channel === 'WHATSAPP' || channel === 'SMS') {
      draftBody = `Hi ${clientName}, this is regarding ${purpose}. Your portfolio is currently at ${aumStr}. Please let us know if you'd like to schedule a quick review call. Best regards.`;
    } else {
      subject = `Meeting Memo: ${purpose}`;
      draftBody = `CONFIDENTIAL MEMORANDUM\nClient: ${clientName}\nSubject: ${purpose}\nPortfolio AUM: ${aumStr}\n\nDiscussion Summary:\n` +
        (keyPoints.length > 0 ? keyPoints.map((k) => `- ${k}`).join('\n') : '- Scheduled review completed.');
    }

    talkingPoints.push(`Portfolio standing: ${aumStr}`, `Objective: ${purpose}`);

    const grounding = V4GroundingEngine.verifyOutput(draftBody, snapshot);

    return {
      taskType: 'CLIENT_COMMUNICATION_DRAFT',
      snapshotId: snapshot.snapshotId,
      confidence: grounding.confidence,
      channel,
      subject: subject || undefined,
      draftBody,
      audienceContext: `Client: ${clientName} (${snapshot.clientSnapshot?.taxStatus || 'Individual'})`,
      talkingPoints,
      claims: grounding.verifiedClaims.concat(grounding.unsupportedClaims),
      limitations: [
        'Draft communication is generated for advisor review and customization.',
        'Zero automated message dispatch. Advisor must review and approve before sending.'
      ],
      suggestedActions: [
        'Review and edit draft body for tone and specific client context',
        'Copy or send via authorized firm communication channel'
      ],
      requiresHumanReview: true,
      disclaimer: 'Draft communication only. Not sent automatically.'
    };
  }
}
