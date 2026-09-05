import {
  evaluateSmartAlerts,
  DEFAULT_ALERT_RULES,
} from "../src/services/smartAlerts";
import { Client } from "../src/types/wealth";

describe("Smart Alerts & Policy Violation Monitor", () => {
  const mockClients: Client[] = [
    {
      id: "c1",
      name: "Rohan Verma",
      phone: "+919876543210",
      email: "rohan@example.com",
      category: "HNI",
      riskProfile: "Balanced",
      preferredChannel: "WhatsApp",
      watchlist: ["INFY", "TCS"],
      notes: "High net worth tech founder",
      city: "Bengaluru",
      allocation: "Aggressive Growth",
      reminderDate: "2026-09-15",
      priority: "High",
      lastContact: "2026-09-01",
      updateHistory: [],
      portfolio: [
        {
          id: "h1",
          assetName: "Infosys Concentrated",
          assetClass: "Stocks",
          ticker: "INFY",
          quantity: "2000",
          investedValue: "1500000",
          currentValue: "2000000", // 20 Lakhs = 80% of portfolio
          targetWeight: "50",
          notes: "Single asset concentration breach",
        },
        {
          id: "h2",
          assetName: "Unrealized Loss Asset",
          assetClass: "Stocks",
          ticker: "LOSSCO",
          quantity: "500",
          investedValue: "600000",
          currentValue: "500000", // ₹100,000 harvestable loss (>50k threshold)
          targetWeight: "20",
          notes: "Tax loss candidate",
        },
      ],
    },
  ];

  it("detects concentration breaches exceeding 20% limit", () => {
    const alerts = evaluateSmartAlerts(mockClients, DEFAULT_ALERT_RULES);

    const concAlert = alerts.find(
      (a) => a.condition === "CONCENTRATION_BREACH"
    );
    expect(concAlert).toBeDefined();
    expect(concAlert?.clientName).toBe("Rohan Verma");
    expect(concAlert?.message).toContain("constitutes 80.0%");
    expect(concAlert?.severity).toBe("critical");
  });

  it("detects tax harvesting opportunities above threshold", () => {
    const alerts = evaluateSmartAlerts(mockClients, DEFAULT_ALERT_RULES);

    const taxAlert = alerts.find((a) => a.condition === "TAX_HARVEST_WINDOW");
    expect(taxAlert).toBeDefined();
    expect(taxAlert?.title).toBe("Tax Harvesting Opportunity");
    expect(taxAlert?.message).toContain("1,00,000");
  });

  it("returns empty alerts array when no clients violate rules", () => {
    const alerts = evaluateSmartAlerts([]);
    expect(alerts.length).toBe(0);
  });
});
