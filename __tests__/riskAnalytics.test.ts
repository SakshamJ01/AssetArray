import {
  calculateDrawdown,
  calculateBenchmarkAnalytics,
  getBenchmarkBySymbol,
} from "../src/services/risk";
import { DailyReturnPoint } from "../src/services/performance/types";

describe("Risk & Benchmark Analytics Engine", () => {
  describe("Drawdown & Recovery Analytics", () => {
    it("handles monotonic portfolio growth with 0% drawdown", () => {
      const vals = [
        { date: "2024-01-01", nav: 100000 },
        { date: "2024-02-01", nav: 105000 },
        { date: "2024-03-01", nav: 110000 },
        { date: "2024-04-01", nav: 115000 },
      ];
      const result = calculateDrawdown(vals);
      expect(result.maxDrawdownPercent).toBe(0);
      expect(result.currentDrawdownPercent).toBe(0);
      expect(result.episodes.length).toBe(0);
      expect(result.worstPeriod).toBeNull();
    });

    it("correctly measures single crash and full recovery episode", () => {
      // 100k peak on Jan 1 -> drops to 80k on Jan 15 (-20%) -> recovers to 102k on Feb 01
      const vals = [
        { date: "2024-01-01", nav: 100000 },
        { date: "2024-01-15", nav: 80000 }, // Peak Jan 1, Trough Jan 15
        { date: "2024-02-01", nav: 102000 }, // Full recovery Feb 01
      ];
      const result = calculateDrawdown(vals);
      expect(result.maxDrawdownPercent).toBe(-20.0);
      expect(result.currentDrawdownPercent).toBe(0);
      expect(result.episodes.length).toBe(1);

      const ep = result.episodes[0];
      expect(ep.peakNav).toBe(100000);
      expect(ep.troughNav).toBe(80000);
      expect(ep.recoveryDate).toBe("2024-02-01");
      expect(ep.isRecovered).toBe(true);
      expect(ep.drawdownDurationDays).toBe(14);
      expect(ep.recoveryDurationDays).toBe(17);
      expect(result.longestRecoveryDays).toBe(17);
    });

    it("tracks an ongoing unrecovered drawdown", () => {
      const vals = [
        { date: "2024-01-01", nav: 100000 },
        { date: "2024-01-15", nav: 85000 }, // -15%
        { date: "2024-02-01", nav: 90000 }, // Still below 100k peak
      ];
      const result = calculateDrawdown(vals);
      expect(result.currentDrawdownPercent).toBe(-10.0); // (90k - 100k) / 100k
      expect(result.maxDrawdownPercent).toBe(-15.0);
      expect(result.episodes.length).toBe(1);
      expect(result.episodes[0].isRecovered).toBe(false);
      expect(result.episodes[0].recoveryDate).toBeNull();
    });

    it("tracks multiple successive crashes and finds the worst period", () => {
      const vals = [
        { date: "2023-01-01", nav: 100000 },
        { date: "2023-03-01", nav: 90000 },  // Crash 1: -10%
        { date: "2023-06-01", nav: 105000 }, // Recovers
        { date: "2023-09-01", nav: 73500 },  // Crash 2: (73.5k - 105k) / 105k = -30%
        { date: "2023-12-01", nav: 110000 }, // Recovers
      ];
      const result = calculateDrawdown(vals);
      expect(result.maxDrawdownPercent).toBe(-30.0);
      expect(result.episodes.length).toBe(2);
      expect(result.worstPeriod?.drawdownPercent).toBe(-30.0);
    });
  });

  describe("Benchmark Analytics (Alpha, Beta, Sharpe, Sortino)", () => {
    it("returns INSUFFICIENT_DATA when observation count is below minimum (10)", () => {
      const pReturns: DailyReturnPoint[] = [
        { date: "2024-01-02", nav: 101000, dailyReturn: 0.01, netCashFlow: 0 },
        { date: "2024-01-03", nav: 102000, dailyReturn: 0.01, netCashFlow: 0 },
      ];
      const bReturns: DailyReturnPoint[] = [
        { date: "2024-01-02", nav: 20200, dailyReturn: 0.01, netCashFlow: 0 },
        { date: "2024-01-03", nav: 20400, dailyReturn: 0.01, netCashFlow: 0 },
      ];

      const result = calculateBenchmarkAnalytics(pReturns, bReturns);
      expect(result.quality).toBe("INSUFFICIENT_DATA");
      expect(result.beta).toBeNull();
      expect(result.alpha).toBeNull();
      expect(result.sharpeRatio).toBeNull();
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("accurately computes Beta = 1.0 and Alpha ≈ 0 when portfolio replicates benchmark", () => {
      const dates = Array.from({ length: 30 }, (_, i) => {
        const day = (i + 1).toString().padStart(2, "0");
        return `2024-01-${day}`;
      });

      const pReturns: DailyReturnPoint[] = dates.map((d, i) => ({
        date: d,
        nav: 100000 + i * 500,
        dailyReturn: i % 2 === 0 ? 0.008 : -0.004,
        netCashFlow: 0,
      }));

      const bReturns: DailyReturnPoint[] = dates.map((d, i) => ({
        date: d,
        nav: 20000 + i * 100,
        dailyReturn: i % 2 === 0 ? 0.008 : -0.004,
        netCashFlow: 0,
      }));

      const result = calculateBenchmarkAnalytics(pReturns, bReturns);
      expect(result.quality).toBe("MEDIUM");
      expect(result.beta).toBeCloseTo(1.0, 2);
      expect(result.alpha).toBeCloseTo(0.0, 2);
      expect(result.trackingError).toBeCloseTo(0.0, 2);
      expect(result.rSquared).toBeCloseTo(1.0, 2);
    });

    it("calculates positive Sharpe and Sortino for consistently positive returns", () => {
      const dates = Array.from({ length: 25 }, (_, i) => `2024-02-${(i + 1).toString().padStart(2, "0")}`);
      const pReturns: DailyReturnPoint[] = dates.map((d, i) => ({
        date: d,
        nav: 100000 * (1 + i * 0.005),
        dailyReturn: i % 2 === 0 ? 0.005 : 0.003, // Positive return with non-zero variance
        netCashFlow: 0,
      }));
      const bReturns: DailyReturnPoint[] = dates.map((d) => ({
        date: d,
        nav: 20000,
        dailyReturn: 0.002,
        netCashFlow: 0,
      }));

      const result = calculateBenchmarkAnalytics(pReturns, bReturns);
      expect(result.sharpeRatio).toBeGreaterThan(0);
      expect(result.activeReturn).toBeGreaterThan(0);
    });
  });

  describe("Benchmark Registry", () => {
    it("returns standard NIFTY 50 benchmark profile", () => {
      const b = getBenchmarkBySymbol("NIFTY50");
      expect(b.name).toContain("Nifty 50");
      expect(b.currency).toBe("INR");
      expect(b.totalReturnAvailable).toBe(true);
    });

    it("safely falls back to NIFTY 50 when symbol is unknown", () => {
      const b = getBenchmarkBySymbol("UNKNOWN_SYMBOL_123");
      expect(b.symbol).toBe("NIFTY50");
    });
  });
});
