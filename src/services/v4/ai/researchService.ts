import {
  AiContextSnapshot,
  ResearchSummary,
  AiConfidence
} from '../../../types/v4/ai';
import { V4GroundingEngine } from './groundingEngine';

export interface ResearchQueryInput {
  query: string;
  entityName?: string;
  snapshot: AiContextSnapshot;
}

export class ResearchSynthesisService {
  /**
   * Synthesizes research evidence with explicit current vs historical distinctions
   * and unknown entity safety refusals.
   */
  public static synthesizeResearch(input: ResearchQueryInput): ResearchSummary {
    const { query, entityName, snapshot } = input;

    if (!query || query.trim().length === 0) {
      throw new Error('Research query cannot be empty');
    }

    const currentFacts: string[] = [];
    const historicalContext: string[] = [];
    const citations: string[] = [];

    const evidenceList = snapshot.researchEvidence || [];

    if (evidenceList.length === 0) {
      return {
        taskType: 'RESEARCH_SUMMARY',
        snapshotId: snapshot.snapshotId,
        confidence: 'INSUFFICIENT_EVIDENCE',
        query,
        entityName,
        isEntityVerified: false,
        currentVsHistorical: {
          currentFacts: [],
          historicalContext: []
        },
        thesisSynthesis: entityName
          ? `ENTITY_NOT_VERIFIED: No verified research or financial evidence found for entity "${entityName}". Financial analysis cannot be synthesized.`
          : 'INSUFFICIENT_EVIDENCE: No research sources or validated filings available in context for this query.',
        citations: [],
        claims: [],
        limitations: ['No primary filings, broker reports, or regulatory filings available in context.'],
        suggestedActions: ['Upload verified institutional research reports or SEC/SEBI filings.'],
        requiresHumanReview: true,
        disclaimer: 'Unverified research synthesis refused to prevent hallucination.'
      };
    }

    // Process available verified research evidence
    for (const doc of evidenceList) {
      citations.push(`${doc.title} (As of: ${doc.asOfDate})`);
      if (doc.isCurrent) {
        currentFacts.push(...doc.keyFacts);
      } else {
        historicalContext.push(...doc.keyFacts);
      }
    }

    const thesis = `Research summary for "${query}": Found ${currentFacts.length} current market points and ${historicalContext.length} historical context points across ${evidenceList.length} verified sources.`;
    const grounding = V4GroundingEngine.verifyOutput(thesis, snapshot);

    return {
      taskType: 'RESEARCH_SUMMARY',
      snapshotId: snapshot.snapshotId,
      confidence: grounding.confidence,
      query,
      entityName,
      isEntityVerified: true,
      currentVsHistorical: {
        currentFacts,
        historicalContext
      },
      thesisSynthesis: thesis,
      citations,
      claims: grounding.verifiedClaims.concat(grounding.unsupportedClaims),
      limitations: [
        'Synthesis is bounded strictly by provided research evidence.',
        'No real-time web scraping or unverified search feeds used.'
      ],
      suggestedActions: ['Cross-reference with client holdings before presenting to investment committee.'],
      requiresHumanReview: true,
      disclaimer: 'Institutional research compilation. Past performance does not guarantee future results.'
    };
  }
}
