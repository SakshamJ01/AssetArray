import {
  calculateTWR,
  calculateXIRR,
  generateDailyReturnSeries,
} from "../src/services/performance";
import {
  calculateAttribution,
  STANDARD_BENCHMARKS,
} from "../src/services/attribution";
import { PortfolioHolding } from "../src/types/wealth";

describe("Performance Engine — Institutional TWR & MWR / XIRR", () => {
  describe("Time-Weighted Return (TWR)", () => {
    it("returns INSUFFICIENT_DATA when less than 2 valuation points provided", () => {
      const result = calculateTWR([{ date: "2024-01-01", nav: 100000 }]);
      expect(result.quality).toBe("INSUFFICIENT_DATA");
      expect(result.twr).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("correctly calculates simple growth without external cash flows", () => {
      const valuations = [
        { date: "2024-01-01", nav: 100000 },
        { date: "2024-06-01", nav: 110000 }, // +10%
        { date: "2024-12-31", nav: 121000 }, // +10%
      ];
      const result = calculateTWR(valuations);
      // (1 + 0.10) * (1 + 0.10) - 1 = 0.21
      expect(result.twr).toBeCloseTo(0.21, 4);
      expect(result.subPeriods.length).toBe(2);
      expect(result.quality).toBe("LOW"); // Only 3 points
    });

    it("eliminates distortion from an external cash deposit (TWR invariant)", () => {
      // Portfolio grows from 100k to 120k (+20%).
      // An external deposit of 50k is added on June 1, bringing NAV to 170k.
      // From June 1 to Dec 31, it grows to 187k (+10%).
      // TWR must be: (1 + 0.20) * (1 + 0.10) - 1 = 32%, NOT (187k - 150k)/100k = 37%.
      const valuations = [
        { date: "2024-01-01", nav: 100000 },
        { date: "2024-06-01", nav: 170000, cashFlow: 50000 }, // Pre-growth 120k + 50k deposit = 170k
        { date: "2024-12-31", nav: 187000 }, // 170k * 1.10 = 187k
      ];
      const result = calculateTWR(valuations);
      expect(result.twr).toBeCloseTo(0.32, 4);
      expect(result.subPeriods[0].subPeriodReturn).toBeCloseTo(0.20, 4);
      expect(result.subPeriods[1].subPeriodReturn).toBeCloseTo(0.10, 4);
    });
  });

  describe("Money-Weighted Return (XIRR)", () => {
    it("returns null when insufficient cash flows exist", () => {
      const result = calculateXIRR([], 100000, "2024-12-31");
      expect(result.converged).toBe(false);
      expect(result.xirr).toBeNull();
      expect(result.quality).toBe("INSUFFICIENT_DATA");
    });

    it("accurately solves single 1-year annual return", () => {
      // 100,000 deposited on 2023-01-01; 112,000 on 2024-01-01 -> XIRR = 12%
      const flows = [{ date: "2023-01-01", amount: 100000 }];
      const result = calculateXIRR(flows, 112000, "2024-01-01");
      expect(result.converged).toBe(true);
      expect(result.annualizedPercent).toBeCloseTo(12.0, 1);
      expect(result.quality).toBe("HIGH");
    });

    it("solves multi-period cash flows with withdrawals", () => {
      const flows = [
        { date: "2023-01-01", amount: 100000 }, // Deposit 100k
        { date: "2023-07-01", amount: -20000 }, // Withdrawal 20k
        { date: "2024-01-01", amount: 50000 },  // Deposit 50k
      ];
      const result = calculateXIRR(flows, 160000, "2024-07-01");
      expect(result.converged).toBe(true);
      expect(typeof result.annualizedPercent).toBe("number");
      expect(result.netInvested).toBe(130000);
    });
  });

  describe("Daily Return Series Generator", () => {
    it("generates correct daily returns series with cash flows", () => {
      const vals = [
        { date: "2024-01-01", nav: 100000 },
        { date: "2024-01-02", nav: 102000 }, // +2%
        { date: "2024-01-03", nav: 107000, cashFlow: 5000 }, // (107000 - 5000) / 102000 - 1 = 0%
      ];
      const series = generateDailyReturnSeries(vals);
      expect(series.length).toBe(2);
      expect(series[0].dailyReturn).toBeCloseTo(0.02, 4);
      expect(series[1].dailyReturn).toBeCloseTo(0.0, 4);
    });
  });

  describe("Brinson-Fachler Reconciliation Identity Property Tests", () => {
    const complexHoldings: PortfolioHolding[] = [
      {
        id: "h1",
        assetName: "HDFC Bank",
        assetClass: "Stocks",
        ticker: "HDFCBANK.NS",
        quantity: "100",
        investedValue: "150000",
        currentValue: "180000", // +20%
        targetWeight: "0.40",
        notes: "",
      },
      {
        id: "h2",
        assetName: "Govt Gilt Fund",
        assetClass: "Bonds",
        ticker: "GILT.NS",
        quantity: "500",
        investedValue: "100000",
        currentValue: "108000", // +8%
        targetWeight: "0.30",
        notes: "",
      },
      {
        id: "h3",
        assetName: "Sovereign Gold Bond",
        assetClass: "Alternatives",
        ticker: "SGB.NS",
        quantity: "20",
        investedValue: "100000",
        currentValue: "125000", // +25%
        targetWeight: "0.20",
        notes: "",
      },
      {
        id: "h4",
        assetName: "Overnight Cash",
        assetClass: "Cash",
        ticker: "CASH",
        quantity: "1",
        investedValue: "50000",
        currentValue: "50000", // 0%
        targetWeight: "0.10",
        notes: "",
      },
    ];

    it("strictly reconciles Active Return = Allocation + Selection + Interaction", () => {
      const result = calculateAttribution(
        complexHoldings,
        STANDARD_BENCHMARKS.BALANCED_HYBRID,
        "test-port"
      );

      expect(result.isReconciled).toBe(true);
      const sumEffects =
        result.summary.allocationEffect +
        result.summary.selectionEffect +
        result.summary.interactionEffect;
      expect(sumEffects).toBeCloseTo(result.totalActiveReturn, 3);
    });

    it("handles negative category returns gracefully without violating reconciliation", () => {
      const downHoldings: PortfolioHolding[] = [
        {
          id: "d1",
          assetName: "SmallCap Stock",
          assetClass: "Stocks",
          ticker: "SMALL.NS",
          quantity: "100",
          investedValue: "200000",
          currentValue: "140000", // -30%
          targetWeight: "0.70",
          notes: "",
        },
        {
          id: "d2",
          assetName: "Liquid Fund",
          assetClass: "Cash",
          ticker: "LIQUID",
          quantity: "1",
          investedValue: "100000",
          currentValue: "106000", // +6%
          targetWeight: "0.30",
          notes: "",
        },
      ];

      const result = calculateAttribution(downHoldings, STANDARD_BENCHMARKS.NIFTY_50, "down-port");
      expect(result.isReconciled).toBe(true);
      expect(result.totalActiveReturn).toBeLessThan(0);
    });

    it("handles zero-weight benchmark categories without NaN", () => {
      // NIFTY_50 has 0% in Alternatives and Bonds
      const result = calculateAttribution(complexHoldings, STANDARD_BENCHMARKS.NIFTY_50, "zero-bench");
      expect(result.isReconciled).toBe(true);
      expect(result.breakdown.every((b) => !isNaN(b.allocationEffect))).toBe(true);
      expect(result.breakdown.every((b) => !isNaN(b.selectionEffect))).toBe(true);
      expect(result.breakdown.every((b) => !isNaN(b.interactionEffect))).toBe(true);
    });
  });
});
