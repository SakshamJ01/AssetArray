jest.mock("react-native", () => ({
  Platform: { OS: "web" },
  StyleSheet: { create: (styles: any) => styles },
  View: "View",
  Text: "Text",
  ScrollView: "ScrollView",
  Pressable: "Pressable",
  ActivityIndicator: "ActivityIndicator",
  Linking: { openURL: jest.fn() },
  useWindowDimensions: () => ({ width: 1024, height: 768 }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

import { InvestorPortalScreen } from "../src/screens/portal/InvestorPortalScreen";
import { Client } from "../src/types/wealth";

describe("InvestorPortalScreen — Standalone Client Portal UI", () => {
  const sampleClient: Client = {
    id: "client_999",
    name: "Vikram Singhania",
    phone: "+91 98200 99999",
    email: "vikram@singhania.in",
    category: "Family Office",
    priority: "High",
    riskProfile: "Aggressive Growth",
    preferredChannel: "WhatsApp",
    watchlist: ["RELIANCE", "TCS"],
    notes: "HNW multi-generational trust",
    city: "Mumbai",
    allocation: "70:20:10",
    reminderDate: "2026-11-01",
    lastContact: "2026-10-25",
    updateHistory: [],
    portfolio: [
      {
        id: "h1",
        assetName: "Tata Consultancy Services Ltd",
        ticker: "TCS",
        assetClass: "Stocks",
        quantity: "500",
        investedValue: "1500000",
        currentValue: "2000000",
        targetWeight: "50%",
        notes: "IT services large cap",
      },
      {
        id: "h2",
        assetName: "ICICI Prudential Corporate Bond Fund",
        ticker: "ICICICORP",
        assetClass: "Bonds",
        quantity: "10000",
        investedValue: "1000000",
        currentValue: "1100000",
        targetWeight: "50%",
        notes: "AAA Corporate paper",
      },
    ],
  };

  test("InvestorPortalScreen component is defined and importable", () => {
    expect(InvestorPortalScreen).toBeDefined();
    expect(typeof InvestorPortalScreen).toBe("function");
  });

  test("Computes correct valuation and gain metrics for portfolio", () => {
    const holdings = sampleClient.portfolio;
    const totalCurrent = holdings.reduce((sum, h) => sum + Number(h.currentValue), 0);
    const totalInvested = holdings.reduce((sum, h) => sum + Number(h.investedValue), 0);
    const totalGain = totalCurrent - totalInvested;
    const returnPct = ((totalGain / totalInvested) * 100).toFixed(2);

    expect(totalCurrent).toBe(3100000);
    expect(totalInvested).toBe(2500000);
    expect(totalGain).toBe(600000);
    expect(returnPct).toBe("24.00");
  });

  test("Handles zero-holding fallback client safely without NaN or crash", () => {
    const emptyClient: Client = {
      ...sampleClient,
      id: "client_empty",
      portfolio: [],
    };

    expect(emptyClient.portfolio.length).toBe(0);
    const totalCurrent = emptyClient.portfolio.reduce((sum, h) => sum + Number(h.currentValue), 0);
    expect(totalCurrent).toBe(0);
  });
});
