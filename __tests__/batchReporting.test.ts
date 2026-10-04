import { generateFirmWideReviewPackage } from "../src/services/batchReporting";
import { Client } from "../src/types/wealth";

describe("BatchReporting Engine", () => {
  const sampleClients: Client[] = [
    {
      id: "c-1",
      name: "Rajesh Sharma",
      email: "rajesh@example.com",
      phone: "+91 98765 43210",
      category: "HNI",
      riskProfile: "Aggressive",
      preferredChannel: "Email",
      watchlist: ["RELIANCE", "TCS"],
      city: "Mumbai",
      allocation: "70% Equity, 20% Debt, 10% Gold",
      priority: "High",
      notes: "Family office principal",
      reminderDate: "2026-11-01",
      lastContact: "2026-09-15",
      updateHistory: [],
      portfolio: [
        {
          id: "h1",
          assetName: "Reliance Industries",
          assetClass: "Stocks",
          ticker: "RELIANCE",
          investedValue: "1000000",
          currentValue: "1500000",
          quantity: "500",
          targetWeight: "70",
          notes: "Core equity holding",
        },
        {
          id: "h2",
          assetName: "Govt Bond 2030",
          assetClass: "Bonds",
          ticker: "IN_10Y_GSEC",
          investedValue: "500000",
          currentValue: "500000",
          quantity: "500",
          targetWeight: "20",
          notes: "Sovereign bond",
        },
      ],
    },
    {
      id: "c-2",
      name: "Priya Patel",
      email: "priya@example.com",
      phone: "+91 98765 43211",
      category: "Family Office",
      riskProfile: "Moderate",
      preferredChannel: "WhatsApp",
      watchlist: ["HDFCBANK", "INFY"],
      city: "Bengaluru",
      allocation: "50% Equity, 40% Debt, 10% Gold",
      priority: "Medium",
      notes: "Tech founder",
      reminderDate: "2026-11-15",
      lastContact: "2026-09-20",
      updateHistory: [],
      portfolio: [
        {
          id: "h3",
          assetName: "HDFC Bank Ltd",
          assetClass: "Stocks",
          ticker: "HDFCBANK",
          investedValue: "800000",
          currentValue: "650000", // Loss position for tax harvesting
          quantity: "400",
          targetWeight: "50",
          notes: "Banking equity",
        },
      ],
    },
  ];

  it("handles empty client roster safely with honest zero metrics", () => {
    const emptyPkg = generateFirmWideReviewPackage([]);
    expect(emptyPkg.totalClients).toBe(0);
    expect(emptyPkg.totalFirmAum).toBe(0);
    expect(emptyPkg.reports.length).toBe(0);
    expect(emptyPkg.csvExport).toContain("Client ID");
    expect(emptyPkg.markdownSummary).toContain("No clients found");
  });

  it("generates a comprehensive firm-wide review package for active clients", () => {
    const pkg = generateFirmWideReviewPackage(sampleClients);

    expect(pkg.totalClients).toBe(2);
    expect(pkg.totalFirmAum).toBe(2650000); // 1.5M + 0.5M + 0.65M
    expect(pkg.reports.length).toBe(2);
    expect(pkg.reports[0].clientName).toBe("Rajesh Sharma");
    expect(pkg.reports[1].clientName).toBe("Priya Patel");

    // Check tax harvest detection on Priya Patel
    expect(pkg.reports[1].harvestableTaxSavings).toBeGreaterThan(0);

    // Verify CSV formatting
    expect(pkg.csvExport).toContain('"Rajesh Sharma"');
    expect(pkg.csvExport).toContain('"Priya Patel"');

    // Verify Executive Markdown summary
    expect(pkg.markdownSummary).toContain("# EXECUTIVE FIRM-WIDE ADVISORY REVIEW");
    expect(pkg.markdownSummary).toContain("Batch ID");
  });
});
