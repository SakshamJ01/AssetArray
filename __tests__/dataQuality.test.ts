import { dataQualityEngine } from "../src/services/dataQuality";
import { snapshotStore } from "../src/services/clientInsights/snapshotStore";
import { Client, Goal } from "../src/types/wealth";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

describe("DataQualityEngine & Institutional Hygiene", () => {
  beforeEach(async () => {
    await snapshotStore.clear();
  });

  it("returns 0% and MISSING tier when no clients exist (never hardcoded 98%)", async () => {
    const report = await dataQualityEngine.evaluateDataQuality([]);
    expect(report.overallScore).toBe(0);
    expect(report.overallTier).toBe("MISSING");
    expect(report.dimensions.transactions.percentage).toBe(0);
    expect(report.dimensions.taxLots.percentage).toBe(0);
    expect(report.dimensions.historicalData.percentage).toBe(0);
  });

  it("identifies missing cost basis and unclassified tax lots", async () => {
    const incompleteClient: Client = {
      id: "client_inc_1",
      name: "Vikram Malhotra",
      phone: "+91 99000 11111",
      email: "vikram@example.com",
      city: "Bengaluru",
      category: "HNI",
      priority: "High",
      preferredChannel: "WhatsApp",
      reminderDate: new Date().toISOString(),
      notes: "",
      riskProfile: "Moderate",
      allocation: "Stocks 100%",
      watchlist: [],
      updateHistory: [],
      portfolio: [
        {
          id: "h_incomplete",
          ticker: "INFY",
          assetName: "Infosys Ltd",
          quantity: "50",
          investedValue: "0", // Missing cost basis!
          currentValue: "85000",
          assetClass: "Stocks",
          targetWeight: "10",
          notes: "",
          // Missing acquisitionDate!
        },
      ],
      lastContact: "",
    };

    const report = await dataQualityEngine.evaluateDataQuality([incompleteClient]);
    expect(report.overallScore).toBeLessThan(60);
    expect(report.dimensions.transactions.percentage).toBe(0); // 0/1 cost-verified
    expect(report.dimensions.taxLots.percentage).toBe(0); // 0/1 dated
    expect(report.dimensions.prices.percentage).toBe(100); // 1/1 live price
    expect(report.issues.length).toBeGreaterThanOrEqual(2);

    const costIssue = report.issues.find((i) => i.dimension === "Transactions & Holdings");
    expect(costIssue).toBeDefined();
    expect(costIssue?.severity).toBe("CRITICAL");

    const taxIssue = report.issues.find((i) => i.dimension === "Tax Lots");
    expect(taxIssue).toBeDefined();
  });

  it("calculates weighted overall score correctly for complete client portfolio", async () => {
    const completeClient: Client = {
      id: "client_comp_1",
      name: "Priya Sundaram",
      phone: "+91 98888 77777",
      email: "priya@example.com",
      city: "Chennai",
      category: "Family Office",
      priority: "High",
      preferredChannel: "Email",
      reminderDate: new Date().toISOString(),
      notes: "",
      riskProfile: "Aggressive",
      allocation: "Stocks 80%, Cash 20%",
      watchlist: [],
      updateHistory: [],
      portfolio: [
        {
          id: "h_comp_1",
          ticker: "HDFCBANK",
          assetName: "HDFC Bank Ltd",
          quantity: "100",
          investedValue: "150000",
          currentValue: "175000",
          assetClass: "Stocks",
          targetWeight: "15",
          acquisitionDate: "2023-04-15",
          notes: "",
        },
      ],
      lastContact: "",
    };

    // Seed 2 genuine historical snapshots so history dimension passes
    await snapshotStore.recordSnapshot({
      entityId: "client_comp_1",
      entityType: "PORTFOLIO",
      metric: "total_aum",
      value: 160000,
      timestamp: new Date(Date.now() - 30 * 86400000).toISOString(),
    });
    await snapshotStore.recordSnapshot({
      entityId: "client_comp_1",
      entityType: "PORTFOLIO",
      metric: "total_aum",
      value: 175000,
      timestamp: new Date().toISOString(),
    });

    const goals: Goal[] = [
      {
        id: "goal_comp_1",
        clientId: "client_comp_1",
        title: "Retirement Corpus",
        goalType: "Retirement",
        targetAmount: "50000000",
        currentAmount: "175000",
        targetYear: "2038",
        monthlyContribution: "100000",
        priority: "Core",
      },
    ];

    const report = await dataQualityEngine.evaluateDataQuality([completeClient], goals);
    expect(report.dimensions.transactions.percentage).toBe(100);
    expect(report.dimensions.taxLots.percentage).toBe(100);
    expect(report.dimensions.prices.percentage).toBe(100);
    expect(report.dimensions.historicalData.percentage).toBe(100);
    expect(report.dimensions.clientMetadata.percentage).toBe(100);
    expect(report.dimensions.goals.percentage).toBe(100);

    expect(report.overallScore).toBe(100);
    expect(report.overallTier).toBe("COMPLETE");
    expect(report.missingIssuesCount).toBe(0);
  });
});
