import {
  generateCommitteeMemo,
  anonymizeClientForAI,
} from "../src/services/committeeMemo";
import { Client } from "../src/types/wealth";

describe("AI Investment Committee Memo & DPDP Sanitizer", () => {
  const mockClient: Client = {
    id: "client-7781",
    name: "Vikramaditya Singhania",
    phone: "+919876543210",
    email: "vikram@singhaniafamilyoffice.in",
    category: "Family Office",
    riskProfile: "Aggressive",
    preferredChannel: "Email",
    watchlist: ["TCS", "RELIANCE"],
    notes: "HNW patriarch with multi-asset mandate",
    city: "Mumbai",
    allocation: "Balanced Wealth",
    reminderDate: "2026-10-01",
    priority: "High",
    lastContact: "2026-09-01",
    updateHistory: [],
    portfolio: [
      {
        id: "h1",
        assetName: "Reliance Industries",
        assetClass: "Stocks",
        ticker: "RELIANCE",
        quantity: "1000",
        investedValue: "2500000",
        currentValue: "3000000",
        targetWeight: "50",
        notes: "Core energy & digital",
      },
      {
        id: "h2",
        assetName: "Sovereign Gold Bonds",
        assetClass: "Alternatives",
        ticker: "SGB",
        quantity: "200",
        investedValue: "1000000",
        currentValue: "1200000",
        targetWeight: "30",
        notes: "Hedge",
      },
      {
        id: "h3",
        assetName: "Tech Growth Underperformer",
        assetClass: "Stocks",
        ticker: "TECHDOWN",
        quantity: "400",
        investedValue: "800000",
        currentValue: "600000", // ₹200,000 loss
        targetWeight: "20",
        notes: "Harvest candidate",
      },
    ],
  };

  it("anonymizes client PII for DPDP compliance", () => {
    const sanitized = anonymizeClientForAI(mockClient);

    expect(sanitized.anonymizedRef).toMatch(/Client Ref #AA-\d{3}/);
    expect(sanitized.anonymizedRef).not.toContain("Vikramaditya");
    expect(sanitized.category).toBe("Family Office");
  });

  it("generates a comprehensive Investment Committee Memorandum with all sections", () => {
    const memo = generateCommitteeMemo(mockClient);

    expect(memo.clientId).toBe("client-7781");
    expect(memo.anonymizedClientRef).toMatch(/Client Ref #AA-\d{3}/);
    expect(memo.executiveSummary).toContain("Investment Committee Review");
    expect(memo.allocationAndHealth).toContain("Health Score:");
    expect(memo.performanceAttribution).toContain("Brinson-Fachler Model");
    expect(memo.stressTestingSummary).toContain("Macro Stress Test");
    expect(memo.fiduciaryRecommendations.length).toBeGreaterThan(0);
    expect(memo.fullMarkdownReport).toContain("INVESTMENT COMMITTEE MEMORANDUM");

    // Ensure full markdown does not leak the real name
    expect(memo.fullMarkdownReport).not.toContain("Vikramaditya");
  });
});
