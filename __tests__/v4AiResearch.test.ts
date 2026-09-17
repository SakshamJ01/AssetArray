import { ResearchSynthesisService } from '../src/services/v4/ai/researchService';
import { AiContextSnapshot } from '../src/types/v4/ai';

describe('V4 Phase 4 — Grounded Research Synthesis & Entity Safety', () => {
  const baseSnapshot: AiContextSnapshot = {
    snapshotId: 'ctx_research_001',
    tenantId: 'firm_alpha',
    taskType: 'RESEARCH_SUMMARY',
    contextAsOf: new Date().toISOString(),
    version: 1,
    researchEvidence: [
      {
        sourceId: 'src_sec_10k',
        title: 'Infosys Annual Regulatory Filing',
        asOfDate: '2026-06-30',
        isCurrent: true,
        keyFacts: ['Revenue grew 8.4% YoY in constant currency', 'Operating margin expanded to 21.2%']
      },
      {
        sourceId: 'src_historical_report',
        title: 'Indian IT Sector Historical Analysis 2024',
        asOfDate: '2024-03-31',
        isCurrent: false,
        keyFacts: ['Headcount reduced across tier-1 IT firms during FY24']
      }
    ]
  };

  test('Distinguishes current facts from historical context with valid citations', () => {
    const result = ResearchSynthesisService.synthesizeResearch({
      query: 'Evaluate Infosys margin and revenue trajectory',
      entityName: 'Infosys Ltd',
      snapshot: baseSnapshot
    });

    expect(result.isEntityVerified).toBe(true);
    expect(result.currentVsHistorical.currentFacts).toContain('Revenue grew 8.4% YoY in constant currency');
    expect(result.currentVsHistorical.historicalContext).toContain('Headcount reduced across tier-1 IT firms during FY24');
    expect(result.citations).toHaveLength(2);
    expect(result.citations[0]).toContain('Infosys Annual Regulatory Filing');
  });

  test('Refuses unverified entities and returns ENTITY_NOT_VERIFIED', () => {
    const emptySnapshot: AiContextSnapshot = {
      ...baseSnapshot,
      researchEvidence: []
    };

    const result = ResearchSynthesisService.synthesizeResearch({
      query: 'What is the debt profile of FakeCorp Tech?',
      entityName: 'FakeCorp Tech',
      snapshot: emptySnapshot
    });

    expect(result.isEntityVerified).toBe(false);
    expect(result.confidence).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.thesisSynthesis).toContain('ENTITY_NOT_VERIFIED');
    expect(result.citations).toHaveLength(0);
  });
});
