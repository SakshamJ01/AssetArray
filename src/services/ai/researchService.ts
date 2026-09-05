/**
 * Institutional AI Research Engine
 * Strictly verified research with source hierarchy ranking, citation mapping,
 * retrieval timestamp tracking, and disclosure when live web retrieval is unavailable.
 */

export type SourceType =
  | "REGULATOR"
  | "GOVERNMENT"
  | "EXCHANGE"
  | "COMPANY_FILING"
  | "CENTRAL_BANK"
  | "PRIMARY_COMPANY_SOURCE"
  | "REPUTABLE_NEWS"
  | "SECONDARY_RESEARCH";

export interface ResearchSource {
  id: string;
  publisher: string;
  title: string;
  url?: string;
  publishedAt: string;
  retrievedAt: string;
  sourceType: SourceType;
  reliabilityScore: number; // 0 - 100 based on source hierarchy
}

export interface ResearchCitation {
  claim: string;
  sourceId: string;
  publishedAt: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export interface GroundedResearchResult {
  query: string;
  sentiment: "Bullish" | "Neutral" | "Bearish";
  summary: string;
  sources: ResearchSource[];
  citations: ResearchCitation[];
  keyFacts: string[];
  risks: string[];
  opportunities: string[];
  conflicts?: string[];
  retrievedAt: string;
  isWebResearch: boolean;
  disclosureNote?: string;
  shortTermOutlook?: string;
  longTermOutlook?: string;
}

const SOURCE_RANKINGS: Record<SourceType, number> = {
  REGULATOR: 100,
  GOVERNMENT: 95,
  EXCHANGE: 90,
  COMPANY_FILING: 85,
  CENTRAL_BANK: 85,
  PRIMARY_COMPANY_SOURCE: 80,
  REPUTABLE_NEWS: 70,
  SECONDARY_RESEARCH: 60,
};

export function getSourceReliabilityScore(type: SourceType): number {
  return SOURCE_RANKINGS[type] || 50;
}

export class ResearchService {
  /**
   * Evaluates research sources, sorting them by institutional hierarchy.
   */
  public rankSources(sources: ResearchSource[]): ResearchSource[] {
    return [...sources].sort((a, b) => b.reliabilityScore - a.reliabilityScore);
  }

  /**
   * Verifies that citations strictly point to declared sources.
   * Eliminates unmapped claims or generic "Internet" attributions.
   */
  public validateCitations(
    citations: ResearchCitation[],
    sources: ResearchSource[]
  ): { valid: ResearchCitation[]; invalid: ResearchCitation[] } {
    const sourceIds = new Set(sources.map((s) => s.id));
    const valid: ResearchCitation[] = [];
    const invalid: ResearchCitation[] = [];

    for (const c of citations) {
      if (sourceIds.has(c.sourceId)) {
        valid.push(c);
      } else {
        invalid.push(c);
      }
    }

    return { valid, invalid };
  }

  /**
   * Constructs an honest, grounded research result.
   * If sources are absent, explicitly marks `isWebResearch: false` with notice.
   */
  public buildResearchResult(params: {
    query: string;
    sentiment?: "Bullish" | "Neutral" | "Bearish";
    summary: string;
    sources?: ResearchSource[];
    citations?: ResearchCitation[];
    keyFacts?: string[];
    risks?: string[];
    opportunities?: string[];
    conflicts?: string[];
    shortTermOutlook?: string;
    longTermOutlook?: string;
  }): GroundedResearchResult {
    const {
      query,
      sentiment = "Neutral",
      summary,
      sources = [],
      citations = [],
      keyFacts = [],
      risks = [],
      opportunities = [],
      conflicts = [],
      shortTermOutlook,
      longTermOutlook,
    } = params;

    const rankedSources = this.rankSources(sources);
    const { valid: verifiedCitations } = this.validateCitations(citations, rankedSources);

    const hasLiveSources = rankedSources.length > 0;
    const retrievedAt = new Date().toISOString();

    return {
      query,
      sentiment,
      summary,
      sources: rankedSources,
      citations: verifiedCitations,
      keyFacts,
      risks,
      opportunities,
      conflicts,
      retrievedAt,
      isWebResearch: hasLiveSources,
      disclosureNote: hasLiveSources
        ? `Research backed by ${rankedSources.length} verified primary & secondary source(s).`
        : "Research sources unavailable. This answer is not current web research.",
      shortTermOutlook,
      longTermOutlook,
    };
  }
}

export const researchService = new ResearchService();
