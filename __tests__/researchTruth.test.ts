/**
 * Research Truth & Citation Provenance Tests
 * Verifies that AI research mandates genuine source retrieval, verifiable citations,
 * source conflict detection, and honest disclaimers when live search is unavailable.
 */

export interface ResearchSource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  publishedAt: string;
  retrievedAt: string;
  sourceType: "REGULATOR" | "EXCHANGE" | "COMPANY_FILING" | "NEWS" | "SECONDARY";
}

export interface ResearchClaim {
  claim: string;
  sourceId: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  publishedAt: string;
  retrievedAt: string;
}

export function validateResearchSources(sources: ResearchSource[]): {
  isValid: boolean;
  missingFields: string[];
} {
  const missing: string[] = [];
  for (const s of sources) {
    if (!s.title) missing.push(`title in ${s.id}`);
    if (!s.publisher) missing.push(`publisher in ${s.id}`);
    if (!s.url) missing.push(`url in ${s.id}`);
    if (!s.publishedAt) missing.push(`publishedAt in ${s.id}`);
    if (!s.retrievedAt) missing.push(`retrievedAt in ${s.id}`);
  }
  return { isValid: missing.length === 0, missingFields: missing };
}

export function detectSourceConflicts(claims: { source: string; metric: string; value: number }[]): {
  hasConflict: boolean;
  conflictDetails?: string;
} {
  const grouped: Record<string, { source: string; value: number }[]> = {};
  for (const c of claims) {
    grouped[c.metric] = grouped[c.metric] || [];
    grouped[c.metric].push({ source: c.source, value: c.value });
  }

  for (const [metric, list] of Object.entries(grouped)) {
    if (list.length > 1) {
      const values = list.map((l) => l.value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      if (max - min > 0.05 * min) {
        return {
          hasConflict: true,
          conflictDetails: `SOURCE CONFLICT on ${metric}: ${list.map((l) => `${l.source}=${l.value}`).join(" vs ")}`,
        };
      }
    }
  }
  return { hasConflict: false };
}

export function formatResearchRetrievalFallback(): string {
  return "Current-source research unavailable. The assistant can still explain existing portfolio data, but this response should not be treated as current market research.";
}

describe("Research Truth & Provenance Suite", () => {
  test("validates that all researched sources include publisher, URL, publishedAt, and retrievedAt timestamps", () => {
    const validSources: ResearchSource[] = [
      {
        id: "src_sebi_1",
        title: "SEBI Circular on Mutual Fund Categorization",
        publisher: "Securities and Exchange Board of India (SEBI)",
        url: "https://www.sebi.gov.in/legal/circulars/mf-categorization.pdf",
        publishedAt: "2024-06-15",
        retrievedAt: "2026-09-05",
        sourceType: "REGULATOR",
      },
      {
        id: "src_filing_1",
        title: "Quarterly Financial Results Q1 FY27",
        publisher: "HDFC Bank Limited - Investor Relations",
        url: "https://www.hdfcbank.com/investor-relations/q1-fy27.pdf",
        publishedAt: "2026-07-20",
        retrievedAt: "2026-09-05",
        sourceType: "COMPANY_FILING",
      },
    ];

    const validation = validateResearchSources(validSources);
    expect(validation.isValid).toBe(true);
    expect(validation.missingFields.length).toBe(0);
  });

  test("flags incomplete sources missing publication dates or source URLs", () => {
    const brokenSources: ResearchSource[] = [
      {
        id: "src_anon",
        title: "Anonymous Market Blog Post",
        publisher: "",
        url: "",
        publishedAt: "",
        retrievedAt: "2026-09-05",
        sourceType: "SECONDARY",
      },
    ];

    const validation = validateResearchSources(brokenSources);
    expect(validation.isValid).toBe(false);
    expect(validation.missingFields).toContain("publisher in src_anon");
    expect(validation.missingFields).toContain("url in src_anon");
  });

  test("detects numeric conflicts between regulatory filings and media reporting", () => {
    const claims = [
      { source: "BSE Filing", metric: "Consolidated Revenue", value: 120500 },
      { source: "Financial News Blog", metric: "Consolidated Revenue", value: 145000 },
    ];

    const result = detectSourceConflicts(claims);
    expect(result.hasConflict).toBe(true);
    expect(result.conflictDetails).toContain("SOURCE CONFLICT on Consolidated Revenue");
  });

  test("provides mandatory honest disclaimer when current source retrieval is offline", () => {
    const fallbackText = formatResearchRetrievalFallback();
    expect(fallbackText).toContain("Current-source research unavailable");
    expect(fallbackText).toContain("should not be treated as current market research");
  });
});
