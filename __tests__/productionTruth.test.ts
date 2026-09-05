import { dataQualityEngine } from "../src/services/dataQuality";
import { snapshotStore, insightEngine } from "../src/services/clientInsights";
import { unifiedMarketProvider, validateQuoteSchema } from "../src/services/market";
import { aiRouter } from "../src/services/aiGateway";
import { Client } from "../src/types/wealth";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

describe("Production Truth — Master Regression Suite", () => {
  beforeEach(async () => {
    await snapshotStore.clear();
  });

  describe("Rule 0 & 3: Synthetic Client History Abolition", () => {
    it("never seeds synthetic baseline numbers (27.4, 72, 9.3, 14.2) for real clients", async () => {
      await snapshotStore.seedBaselineSnapshotsIfEmpty("real_client_audit_1");
      const snapshots = await snapshotStore.getSnapshots("real_client_audit_1");
      expect(snapshots.length).toBe(0);

      // Even when evaluateClientInsights is run on a client with zero history, no numbers are fabricated
      const realClient: Client = {
        id: "real_client_audit_1",
        name: "Devendra Singhal",
        phone: "+91 99999 88888",
        email: "devendra@example.com",
        city: "Mumbai",
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
            id: "h_real_1",
            ticker: "TCS",
            assetName: "Tata Consultancy Services",
            quantity: "100",
            investedValue: "350000",
            currentValue: "390000",
            assetClass: "Stocks",
            targetWeight: "15",
            notes: "",
          },
        ],
        lastContact: "",
      };

      const insights = await insightEngine.evaluateClientInsights(realClient);
      // New client with no prior history must report INSUFFICIENT_HISTORY, NOT fabricated drift
      expect(insights.length).toBe(1);
      expect(insights[0].type).toBe("INSUFFICIENT_HISTORY");
      expect(insights[0].evidence.confidence).toBe("INSUFFICIENT_DATA");
      expect(insights[0].summary).toContain("at least two valuation snapshots");
    });
  });

  describe("Rule 8: Frontend AI Secrets Abolition", () => {
    it("ensures provider instances contain zero exposed client secrets", () => {
      const providers = aiRouter.getAllProviders();
      expect(providers.length).toBe(3);

      for (const p of providers) {
        const serialized = JSON.stringify(p);
        expect(serialized).not.toContain("EXPO_PUBLIC_OPENAI_API_KEY");
        expect(serialized).not.toContain("EXPO_PUBLIC_GEMINI_API_KEY");
        expect(serialized).not.toContain("EXPO_PUBLIC_ANTHROPIC_API_KEY");
        expect(serialized).not.toContain("sk-");
      }
    });
  });

  describe("Rule 15: AI Fallback Transparency", () => {
    it("explicitly labels deterministic fallback as 'AI unavailable · Rule-based summary'", async () => {
      let stateMessage = "";
      let completedMeta: any = null;
      const originalFetch = global.fetch;
      global.fetch = jest.fn(() => Promise.reject(new Error("AI backend offline")));

      try {
        await aiRouter.executeStream("Explain tech exposure change", "FAST_SUMMARY", {
          clientName: "Rahul Mehta",
          totalAum: 5000000,
        }, {
          onStateChange: (state, msg) => {
            if (state === "UNAVAILABLE") stateMessage = msg || "";
          },
          onToken: () => {},
          onComplete: (meta) => {
            completedMeta = meta;
          },
        });
      } finally {
        global.fetch = originalFetch;
      }

      expect(stateMessage).toContain("AI unavailable · Rule-based summary");
      expect(completedMeta.isFallback).toBe(true);
      expect(completedMeta.fallbackLabel).toBe("AI unavailable · Rule-based summary");
      expect(completedMeta.model).toBe("verified-rule-engine");
    });
  });

  describe("Rule 19 & 25: Market Provider Truth", () => {
    it("returns null price and UNAVAILABLE for unknown ticker (never 100, 0.5%)", async () => {
      const quote = await unifiedMarketProvider.getQuote("NONEXISTENT_SYMBOL_404");
      expect(quote.symbol).toBe("NONEXISTENT_SYMBOL_404");
      expect(quote.price).toBeNull();
      expect(quote.change).toBeNull();
      expect(quote.changePercent).toBeNull();
    });

    it("strictly rejects negative, NaN, and Infinite market quotes via schema validator", () => {
      expect(validateQuoteSchema({ symbol: "INFY", price: 1800 }).isValid).toBe(true);
      expect(validateQuoteSchema({ symbol: "INFY", price: -100 }).isValid).toBe(false);
      expect(validateQuoteSchema({ symbol: "INFY", price: NaN }).isValid).toBe(false);
      expect(validateQuoteSchema({ symbol: "INFY", price: Infinity }).isValid).toBe(false);
      expect(validateQuoteSchema(null).isValid).toBe(false);
    });
  });

  describe("Rule 27: Data Quality Real Calculation", () => {
    it("never shows static 98% when data is empty", async () => {
      const report = await dataQualityEngine.evaluateDataQuality([]);
      expect(report.overallScore).toBe(0);
      expect(report.overallTier).toBe("MISSING");
      expect(report.overallScore).not.toBe(98);
    });
  });
});
