import { ClientInput } from "../src/services/aiAdvisor";

describe("PDF Report Data Formatter", () => {
  const sampleClient: ClientInput = {
    id: "test-client-1",
    name: "Alexander Hamilton",
    category: "HNI",
    priority: "High",
    portfolio: [
      {
        assetName: "Vanguard S&P 500 ETF",
        assetClass: "Stocks",
        ticker: "VOO",
        quantity: "150",
        investedValue: "60000",
        currentValue: "78000",
      },
      {
        assetName: "Treasury Bond Fund",
        assetClass: "Bonds",
        ticker: "BND",
        quantity: "500",
        investedValue: "40000",
        currentValue: "42000",
      },
    ],
  };

  it("calculates accurate total portfolio values and returns", () => {
    const holdings = sampleClient.portfolio || [];
    const totalValue = holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
    const totalCost = holdings.reduce((sum, h) => sum + (Number(h.investedValue) || 0), 0);
    const totalGainLoss = totalValue - totalCost;
    const gainLossPercent = totalCost > 0 ? ((totalGainLoss / totalCost) * 100).toFixed(1) : "0";

    expect(totalValue).toBe(120000);
    expect(totalCost).toBe(100000);
    expect(totalGainLoss).toBe(20000);
    expect(gainLossPercent).toBe("20.0");
  });

  it("handles empty portfolios gracefully without NaN", () => {
    const emptyClient: ClientInput = {
      id: "test-empty",
      name: "New Client",
      category: "Retail",
      priority: "Low",
      portfolio: [],
    };

    const holdings = emptyClient.portfolio || [];
    const totalValue = holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
    const totalCost = holdings.reduce((sum, h) => sum + (Number(h.investedValue) || 0), 0);
    const totalGainLoss = totalValue - totalCost;
    const gainLossPercent = totalCost > 0 ? ((totalGainLoss / totalCost) * 100).toFixed(1) : "0";

    expect(totalValue).toBe(0);
    expect(totalCost).toBe(0);
    expect(totalGainLoss).toBe(0);
    expect(gainLossPercent).toBe("0");
    expect(Number.isNaN(Number(gainLossPercent))).toBe(false);
  });

  it("exports client report HTML containing institutional v3.1 diagnostics", async () => {
    const { exportClientPdfReport } = await import("../src/services/pdfReport");
    const { documentExporter } = await import("../src/platform/export");
    const spy = jest.spyOn(documentExporter, "exportHtmlReport").mockResolvedValue();

    await exportClientPdfReport({ client: sampleClient, advisorName: "Jane Doe" });

    expect(spy).toHaveBeenCalledTimes(1);
    const callArg = spy.mock.calls[0][0];
    expect(callArg.filename).toContain("Alexander_Hamilton.pdf");
    expect(callArg.html).toContain("Institutional Analytics &amp; Risk Mandate (v3.1 Engine)".replace("&amp;", "&"));
    expect(callArg.html).toContain("Health Score");
    expect(callArg.html).toContain("Active Alpha vs Benchmark");
    expect(callArg.html).toContain("Tax Loss Harvesting Shield");
    expect(callArg.html).toContain("Stress Simulation Impact");

    spy.mockRestore();
  });
});
