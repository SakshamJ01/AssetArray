import {
  numericValue,
  formatReminderDate,
  isReminderDue,
  buildClientFromDraft,
  buildDraftFromClient,
  clientInsightList,
} from "../src/services/wealthHelpers";
import { emptyDraft, Client } from "../src/types/wealth";

describe("Modular Domain Architecture - wealthHelpers & Calculations", () => {
  describe("numericValue", () => {
    it("parses clean numbers and formatted strings with commas", () => {
      expect(numericValue("1,000,000")).toBe(1000000);
      expect(numericValue("250.50")).toBe(250.5);
      expect(numericValue("")).toBe(0);
      expect(numericValue("abc")).toBe(0);
    });
  });

  describe("formatReminderDate & isReminderDue", () => {
    it("returns 'Not scheduled' for empty date", () => {
      expect(formatReminderDate("")).toBe("Not scheduled");
    });

    it("evaluates reminder due dates accurately", () => {
      const past = "2020-01-01";
      const future = "2099-01-01";
      expect(isReminderDue(past)).toBe(true);
      expect(isReminderDue(future)).toBe(false);
      expect(isReminderDue("")).toBe(false);
    });
  });

  describe("Client draft roundtripping", () => {
    it("builds client from draft without data loss", () => {
      const draft = {
        ...emptyDraft,
        name: "Anand Mahindra",
        phone: "+91 98200 99999",
        email: "anand@mahindra.com",
        city: "Mumbai",
        allocation: "Balanced (60:30:10)",
        category: "Family Office" as const,
        priority: "High" as const,
      };

      const client = buildClientFromDraft(draft);
      expect(client.name).toBe("Anand Mahindra");
      expect(client.phone).toBe("+91 98200 99999");
      expect(client.city).toBe("Mumbai");
      expect(client.category).toBe("Family Office");

      const roundtrippedDraft = buildDraftFromClient(client);
      expect(roundtrippedDraft.name).toBe(draft.name);
      expect(roundtrippedDraft.phone).toBe(draft.phone);
      expect(roundtrippedDraft.email).toBe(draft.email);
    });

    it("generates faithful insights for clients", () => {
      const testClient: Client = {
        id: "c_1",
        name: "Test Client",
        phone: "+91 98000 00000",
        email: "test@example.com",
        category: "HNI",
        riskProfile: "Moderate",
        preferredChannel: "Email",
        watchlist: ["RELIANCE"],
        notes: "",
        city: "Mumbai",
        allocation: "60:30:10",
        reminderDate: "2020-01-01",
        priority: "High",
        avatarUrl: "",
        lastContact: "2026-01-01",
        updateHistory: [],
        portfolio: [
          {
            id: "h_1",
            assetName: "HDFC Bank",
            assetClass: "Stocks",
            ticker: "HDFCBANK",
            quantity: "100",
            investedValue: "150000",
            currentValue: "175000",
            targetWeight: "50",
            notes: "",
          },
        ],
      };

      const insights = clientInsightList(testClient);
      expect(insights.length).toBeGreaterThan(0);
      expect(insights.some((i) => i.includes("HDFC Bank"))).toBe(true);
      expect(insights.some((i) => i.includes("Follow-up is due now"))).toBe(true);
    });
  });
});
