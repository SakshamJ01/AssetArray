import { FundXrayService } from "../src/services/intelligence/fundXrayService";
import { PortfolioHolding } from "../src/types/wealth";

describe("Look-Through Fund X-Ray & Overlap Matrix Service", () => {
  const mockHoldings: PortfolioHolding[] = [
    {
      id: "h_nifty",
      assetName: "Nifty 50 Index ETF",
      assetClass: "Mutual Funds",
      ticker: "NIFTYBEES",
      quantity: "500",
      investedValue: "100000",
      currentValue: "120000",
      targetWeight: "50",
      notes: "",
    },
    {
      id: "h_flexi",
      assetName: "HDFC Flexi Cap Fund",
      assetClass: "Mutual Funds",
      ticker: "HDFC_FLEXI",
      quantity: "1000",
      investedValue: "150000",
      currentValue: "180000",
      targetWeight: "50",
      notes: "",
    },
  ];

  test("deconstructs mutual fund holdings into underlying constituent stocks", () => {
    const xray = FundXrayService.deconstructHolding(mockHoldings[0]);
    expect(xray.fundName).toBe("Nifty 50 Index ETF");
    expect(xray.topConstituents.length).toBeGreaterThan(0);
    expect(xray.topConstituents[0].ticker).toBe("HDFCBANK");
    expect(xray.expenseRatio).toBeLessThanOrEqual(1.5);
  });

  test("calculates portfolio overlap and estimated fee drag", () => {
    const analysis = FundXrayService.analyzePortfolioOverlap(mockHoldings);

    expect(analysis.totalAnalyzedValue).toBe(300000);
    expect(analysis.topOverlappingStocks.length).toBeGreaterThan(0);
    expect(analysis.averageExpenseRatio).toBeGreaterThan(0);
    expect(analysis.overlapScore).toBeGreaterThanOrEqual(0);
    expect(analysis.overlapScore).toBeLessThanOrEqual(100);
    expect(analysis.consolidationRecommendations.length).toBeGreaterThan(0);
  });
});
