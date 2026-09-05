import { calculateUnifiedNetWorth } from "../src/services/netWorth";
import {
  generateDailyAdvisorDeskTasks,
  transitionTaskStatus,
} from "../src/services/advisorDesk";
import { Client, ConnectedAccount, PortfolioHolding } from "../src/types/wealth";

describe("Unified Net Worth & Advisor CRM Desk Engine", () => {
  describe("Net Worth Calculation & Anti-Double-Counting", () => {
    it("strictly prevents double-counting between brokerage accounts and detailed holdings", () => {
      // Scenario from requirements:
      // A brokerage account holding equities must not count both:
      // Brokerage Account = ₹10L, Equities inside account = ₹10L as ₹20L!
      const holdings: PortfolioHolding[] = [
        {
          id: "h1",
          assetName: "Bluechip Equities",
          assetClass: "Stocks",
          ticker: "BLUE",
          quantity: "100",
          investedValue: "800000",
          currentValue: "1000000", // ₹10 Lakhs in equities
          targetWeight: "100",
          notes: "",
        },
      ];

      const connectedAccounts: ConnectedAccount[] = [
        {
          id: "acc_broker_1",
          institution: "Zerodha Demat",
          accountType: "Broker",
          currentValue: "1000000", // ₹10 Lakhs broker balance
          status: "Connected",
        },
        {
          id: "acc_bank_1",
          institution: "HDFC Savings",
          accountType: "Bank",
          currentValue: "500000", // ₹5 Lakhs liquid bank
          status: "Connected",
        },
      ];

      const snapshot = calculateUnifiedNetWorth({
        clientId: "client_1",
        holdings,
        connectedAccounts,
      });

      // Total assets should be ₹10L (Equities) + ₹5L (Bank) = ₹15 Lakhs, NOT ₹25 Lakhs!
      expect(snapshot.totalAssets).toBe(1500000);
      expect(snapshot.netWorth).toBe(1500000);
      expect(snapshot.deduplicationAdjustments.length).toBe(1);
      expect(snapshot.deduplicationAdjustments[0].amount).toBe(1000000);
    });

    it("correctly reconciles Net Worth = Total Assets - Total Liabilities", () => {
      const snapshot = calculateUnifiedNetWorth({
        clientId: "client_2",
        holdings: [
          {
            id: "h1",
            assetName: "Mutual Fund",
            assetClass: "Mutual Funds",
            ticker: "MF",
            quantity: "1",
            investedValue: "500000",
            currentValue: "600000",
            targetWeight: "100",
            notes: "",
          },
        ],
        liabilities: [
          {
            id: "l1",
            name: "Home Mortgage",
            category: "Mortgage",
            value: 200000,
          },
        ],
      });

      expect(snapshot.totalAssets).toBe(600000);
      expect(snapshot.totalLiabilities).toBe(200000);
      expect(snapshot.netWorth).toBe(400000);
    });
  });

  describe("Advisor Desk Daily Workflow", () => {
    const clients: Client[] = [
      {
        id: "c1",
        name: "Vikram Malhotra",
        phone: "9876543210",
        email: "vikram@example.com",
        category: "HNI",
        riskProfile: "Balanced",
        preferredChannel: "Phone",
        watchlist: [],
        notes: "Quarterly rebalance",
        city: "Mumbai",
        allocation: "60/40",
        reminderDate: "2024-01-01",
        priority: "High",
        lastContact: "2023-12-01",
        updateHistory: [],
        portfolio: [],
      },
    ];

    it("generates prioritized tasks and tracks task lifecycle transitions", () => {
      const tasks = generateDailyAdvisorDeskTasks({
        clients,
        asOfDate: "2024-01-05T00:00:00.000Z",
      });

      expect(tasks.length).toBeGreaterThan(0);
      const initialTask = tasks[0];
      expect(initialTask.status).toBe("OPEN");

      // Transition to IN_PROGRESS
      const inProgress = transitionTaskStatus(initialTask, "IN_PROGRESS", "Started review");
      expect(inProgress.status).toBe("IN_PROGRESS");
      expect(inProgress.notes).toContain("Started review");

      // Transition to DONE
      const done = transitionTaskStatus(inProgress, "DONE", "Review finalized with client");
      expect(done.status).toBe("DONE");
      expect(typeof done.completedAt).toBe("string");
    });
  });
});
