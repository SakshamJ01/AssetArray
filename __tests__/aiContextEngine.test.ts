import { AiContextEngine } from "../src/services/aiGateway/contextEngine";
import { OpenRouterProvider } from "../src/services/aiGateway/providers/openrouter";
import { aiRouter } from "../src/services/aiGateway/router";
import { Client, Goal } from "../src/types/wealth";

describe("Institutional AI Context Engine & OpenRouter Provider", () => {
  const mockClients: Client[] = [
    {
      id: "c-101",
      name: "Rajesh Sharma",
      phone: "+91 98200 12345",
      email: "rajesh.sharma@example.com",
      category: "HNI",
      riskProfile: "Aggressive Growth",
      preferredChannel: "WhatsApp",
      watchlist: ["HDFCBANK", "INFY", "RELIANCE"],
      notes: "Client interested in shifting 15% allocation from Large Cap equity into Sovereign Gold Bonds.",
      city: "Mumbai",
      allocation: "70% Equity, 20% Debt, 10% Gold",
      reminderDate: "2026-10-15",
      priority: "High",
      lastContact: "10 Oct 2026",
      updateHistory: [],
      portfolio: [
        {
          id: "h-1",
          assetName: "HDFC Bank Ltd",
          assetClass: "Stocks",
          ticker: "HDFCBANK",
          quantity: "500",
          investedValue: "750000",
          currentValue: "925000",
          targetWeight: "25",
          notes: "Core financial holding",
        },
        {
          id: "h-2",
          assetName: "Sovereign Gold Bond 2030",
          assetClass: "Bonds",
          ticker: "SGB2030",
          quantity: "50",
          investedValue: "300000",
          currentValue: "360000",
          targetWeight: "10",
          notes: "Sovereign gold tranche",
        },
      ],
    },
    {
      id: "c-102",
      name: "Ananya Verma",
      phone: "+91 98111 22334",
      email: "ananya.verma@example.com",
      category: "Family Office",
      riskProfile: "Balanced",
      preferredChannel: "Email",
      watchlist: ["TCS", "ITC"],
      notes: "Target retirement corpus review in Q4.",
      city: "Bengaluru",
      allocation: "50% Equity, 40% Debt, 10% Alternative",
      reminderDate: "2026-12-01",
      priority: "Medium",
      lastContact: "01 Sep 2026",
      updateHistory: [],
      portfolio: [
        {
          id: "h-3",
          assetName: "Tata Consultancy Services",
          assetClass: "Stocks",
          ticker: "TCS",
          quantity: "300",
          investedValue: "1000000",
          currentValue: "1150000",
          targetWeight: "30",
          notes: "Tech holding",
        },
      ],
    },
  ];

  const mockGoals: Goal[] = [
    {
      id: "g-1",
      title: "Rajesh Sharma - Children Overseas Education",
      goalType: "Education",
      targetAmount: "5000000",
      currentAmount: "3500000",
      targetYear: "2029",
      monthlyContribution: "50000",
      priority: "Core",
    },
  ];

  describe("1. AiContextEngine - Grounded Client Extraction", () => {
    test("calculates accurate client portfolio totals, weights, and unrealized gains", () => {
      const client = mockClients[0];
      const context = AiContextEngine.buildClientContext(client, mockGoals, "INR");

      expect(context.id).toBe("c-101");
      expect(context.name).toBe("Rajesh Sharma");
      expect(context.totalInvested).toBe(1050000); // 750,000 + 300,000
      expect(context.totalCurrent).toBe(1285000); // 925,000 + 360,000
      expect(context.unrealizedGainLoss).toBe(235000); // 1,285,000 - 1,050,000
      expect(context.returnPct).toBeCloseTo(22.4, 0);

      // Verify holdings breakdown
      expect(context.holdings.length).toBe(2);
      expect(context.holdings[0].name).toBe("HDFC Bank Ltd");
      expect(context.holdings[0].ticker).toBe("HDFCBANK");
      expect(context.holdings[0].weightPct).toBeCloseTo(72.0, 0);
      expect(context.holdings[1].name).toBe("Sovereign Gold Bond 2030");
      expect(context.holdings[1].weightPct).toBeCloseTo(28.0, 0);

      // Verify goals linking
      expect(context.goals.length).toBe(1);
      expect(context.goals[0].title).toContain("Overseas Education");
      expect(context.goals[0].progressPct).toBe(70);
    });

    test("formats clean markdown tables with exact quantitative metrics for prompt injection", () => {
      const client = mockClients[0];
      const context = AiContextEngine.buildClientContext(client, mockGoals, "INR");
      const promptMarkdown = AiContextEngine.formatContextForPrompt(context, null, "INR");

      expect(promptMarkdown).toContain("### ACTIVE CLIENT MANDATE");
      expect(promptMarkdown).toContain("Rajesh Sharma");
      expect(promptMarkdown).toContain("INR 12,85,000");
      expect(promptMarkdown).toContain("| HDFC Bank Ltd (HDFCBANK) | Stocks |");
      expect(promptMarkdown).toContain("HDFCBANK");
      expect(promptMarkdown).toContain("Overseas Education");
      expect(promptMarkdown).toContain("Sovereign Gold Bond 2030");
      // Advisor notes should be present
      expect(promptMarkdown).toContain("shifting 15% allocation from Large Cap equity into Sovereign Gold Bonds");
    });
  });

  describe("2. AiContextEngine - Grounded Firm Extraction", () => {
    test("aggregates firm-wide AUM, top clients, and follow-up alerts", () => {
      const firmContext = AiContextEngine.buildFirmContext(mockClients, null, mockGoals);

      expect(firmContext.clientsCount).toBe(2);
      expect(firmContext.totalAum).toBe(1285000 + 1150000);
      expect(firmContext.topClients.length).toBe(2);
      expect(firmContext.topClients[0].name).toBe("Rajesh Sharma");
      expect(firmContext.highPriorityClientsCount).toBe(1);

      const promptMarkdown = AiContextEngine.formatContextForPrompt(null, firmContext, "INR");
      expect(promptMarkdown).toContain("### ADVISORY PRACTICE / FIRM-WIDE OVERVIEW");
      expect(promptMarkdown).toContain("Total Monitored AUM");
      expect(promptMarkdown).toContain("**High Priority Mandates**: 1");
    });
  });

  describe("3. OpenRouter Provider & Gateway Integration", () => {
    test("openrouter provider is registered in aiRouter", () => {
      const provider = aiRouter.getProvider("openrouter");
      expect(provider).toBeDefined();
      expect(provider?.id).toBe("openrouter");
      expect(provider?.name).toContain("OpenRouter");
    });

    test("OpenRouterProvider is configured with backend proxy endpoint", () => {
      const openRouter = new OpenRouterProvider("https://assetarray.onrender.com");
      expect(openRouter.isConfigured()).toBe(true);
      expect(openRouter.getStatus()).toBe("AVAILABLE");
    });
  });
});
