import {
  AiContextSnapshot,
  DecisionChallenge,
  AiConfidence
} from '../../../types/v4/ai';
import { V4GroundingEngine } from './groundingEngine';

export class DecisionChallengeService {
  /**
   * Challenges an advisor's investment thesis by identifying supporting evidence,
   * counter-evidence, missing information, and probing questions.
   */
  public static challengeThesis(thesis: string, snapshot: AiContextSnapshot): DecisionChallenge {
    if (!thesis || thesis.trim().length === 0) {
      throw new Error('Thesis cannot be empty for Decision Challenge');
    }

    const supportingEvidence: string[] = [];
    const counterEvidence: string[] = [];
    const missingInformation: string[] = [];
    const probingQuestions: string[] = [];

    // Analyze portfolio snapshot
    const drift = snapshot.portfolioSnapshot?.driftScore;
    if (drift != null && drift > 10) {
      supportingEvidence.push(
        `Portfolio drift is currently ${drift}%, which may support rebalancing or reallocation actions.`
      );
    } else {
      counterEvidence.push(
        `Overall portfolio drift is modest (${drift || 0}%), indicating existing asset allocation is near target.`
      );
    }

    // Analyze tax consequences
    const stcg = snapshot.taxSnapshot?.shortTermLiabilityEst || 0;
    const ltcg = snapshot.taxSnapshot?.longTermLiabilityEst || 0;
    if (stcg + ltcg > 0) {
      counterEvidence.push(
        `Realizing positions may trigger estimated capital gains tax liabilities of ₹${(stcg + ltcg).toLocaleString('en-IN')}.`
      );
      missingInformation.push('Has the client exhausted capital loss set-off pools under Section 70/74 for the current fiscal year?');
    }

    // Formulate probing fiduciary questions
    probingQuestions.push(
      'What specific replacement asset or cash equivalent is planned for the proceeds?',
      'Does this tactical adjustment align with the client\'s stated long-term risk profile and liquidity horizon?',
      'Have transaction friction and exit load implications been evaluated?'
    );

    const summaryText = `Thesis Challenge for "${thesis}": Supporting: ${supportingEvidence.join(' ')}. Counter: ${counterEvidence.join(' ')}`;
    const grounding = V4GroundingEngine.verifyOutput(summaryText, snapshot);

    return {
      taskType: 'DECISION_CHALLENGE',
      snapshotId: snapshot.snapshotId,
      confidence: grounding.confidence,
      thesis,
      supportingEvidence: supportingEvidence.length > 0 ? supportingEvidence : ['Thesis addresses specific tactical perspective.'],
      counterEvidence: counterEvidence.length > 0 ? counterEvidence : ['Consider market impact and liquidity prior to execution.'],
      missingInformation,
      probingQuestions,
      claims: grounding.verifiedClaims.concat(grounding.unsupportedClaims),
      limitations: [
        'AI challenge engine acts as a devil\'s advocate and does not provide financial or legal advice.',
        'Advisor retains sole fiduciary responsibility for all decisions.'
      ],
      suggestedActions: [
        'Review tax lot report before finalizing sell orders',
        'Record formal decision rationale in AssetArray Decision ledger'
      ],
      requiresHumanReview: true,
      disclaimer: 'For advisor cognitive stress-testing only. Does not constitute an investment mandate or trade instruction.'
    };
  }
}
