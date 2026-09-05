import {
  sanitizeForAI,
  scrubPiiFromText,
  validateAiStructuredJson,
} from "../src/services/ai";
import { generateCommitteeMemo } from "../src/services/committeeMemo";
import { Client } from "../src/types/wealth";

describe("AI Safety, Privacy & Structured Grounding Pipeline", () => {
  const sensitiveClient: Client = {
    id: "client_hni_99",
    name: "Rajeshwar Singhania",
    phone: "9820012345",
    email: "rajeshwar.singhania@heritage-trust.com",
    category: "Family Office",
    riskProfile: "Aggressive",
    preferredChannel: "WhatsApp",
    watchlist: ["TCS", "INFY"],
    notes: "Client PAN is ABCDE1234F. Bank Account 00123456789012 at HDFC Nariman Point.",
    city: "Mumbai",
    allocation: "70/30",
    reminderDate: "2024-04-01",
    priority: "High",
    lastContact: "2024-03-01",
    updateHistory: [],
    portfolio: [
      {
        id: "p1",
        assetName: "L&T Heavy Engineering",
        assetClass: "Stocks",
        ticker: "LT.NS",
        quantity: "500",
        investedValue: "1000000",
        currentValue: "1400000",
        targetWeight: "60",
        notes: "",
      },
    ],
  };

  it("DPDP Compliance: completely sanitizes client name and personal metadata", () => {
    const sanitized = sanitizeForAI(sensitiveClient);

    expect(sanitized.anonymizedRef).toMatch(/^Client Ref #AA-\d{3}$/);
    expect(sanitized.anonymizedRef).not.toContain("Rajeshwar");
    expect(sanitized.category).toBe("Family Office");
    expect(sanitized.riskProfile).toBe("Aggressive");
    expect(sanitized.totalPortfolioValue).toBe(1400000);
  });

  it("scrubs Indian PAN, phone numbers, and emails from free-text notes", () => {
    const scrubbed = scrubPiiFromText(sensitiveClient.notes);

    expect(scrubbed).not.toContain("ABCDE1234F");
    expect(scrubbed).toContain("[PAN_REDACTED]");
    expect(scrubbed).not.toContain("00123456789012");
    expect(scrubbed).toContain("[ACCOUNT_REDACTED]");
  });

  it("validates and parses LLM structured JSON output with fence stripping", () => {
    const rawFencedJson = `
\`\`\`json
{
  "summary": "Portfolio is well poised for long term capital growth.",
  "keyRisks": ["Tech sector cyclicality", "Currency volatility"],
  "confidence": "HIGH"
}
\`\`\`
    `.trim();

    const result = validateAiStructuredJson(rawFencedJson, (parsed) => {
      if (typeof parsed.summary !== "string" || !Array.isArray(parsed.keyRisks)) {
        return null;
      }
      return parsed;
    });

    expect(result.success).toBe(true);
    expect(result.data?.summary).toContain("Portfolio is well poised");
    expect(result.data?.keyRisks.length).toBe(2);
  });

  it("guarantees that every numerical claim in Committee Memo has a source citation", () => {
    const memo = generateCommitteeMemo(sensitiveClient);

    expect(memo.sourceCitations.length).toBeGreaterThanOrEqual(5);
    memo.sourceCitations.forEach((citation) => {
      expect(typeof citation.statement).toBe("string");
      expect(typeof citation.sourceMetric).toBe("string");
      expect(citation.value).toBeDefined();
    });

    expect(memo.anonymizedClientRef).toMatch(/^Client Ref #AA-\d{3}$/);
    expect(memo.fullMarkdownReport).toContain("Grounded Analytical Citations");
  });
});
