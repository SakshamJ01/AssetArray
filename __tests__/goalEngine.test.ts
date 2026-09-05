import { runMonteCarloSimulation } from "../src/services/monteCarlo";
import { evaluateGoal } from "../src/services/goals";
import { Goal } from "../src/types/wealth";

describe("Goal & Reproducible Monte Carlo Engine", () => {
  describe("Monte Carlo Stochastic Simulation", () => {
    it("guarantees 100% deterministic reproducibility when seed is specified", () => {
      const config = {
        initialCapital: 500000,
        monthlyContribution: 25000,
        years: 10,
        targetCorpus: 10000000,
        expectedAnnualReturn: 0.12,
        annualVolatility: 0.15,
        numSimulations: 500,
        seed: 777,
      };

      const run1 = runMonteCarloSimulation(config);
      const run2 = runMonteCarloSimulation(config);

      expect(run1.probabilityOfSuccess).toBe(run2.probabilityOfSuccess);
      expect(run1.expectedValue).toBe(run2.expectedValue);
      expect(run1.percentiles.p5).toBe(run2.percentiles.p5);
      expect(run1.percentiles.p50).toBe(run2.percentiles.p50);
      expect(run1.percentiles.p95).toBe(run2.percentiles.p95);
    });

    it("exposes complete percentile distribution (P5, P10, P25, P50, P75, P90, P95)", () => {
      const res = runMonteCarloSimulation({
        initialCapital: 1000000,
        monthlyContribution: 10000,
        years: 5,
        targetCorpus: 3000000,
        seed: 42,
      });

      expect(res.percentiles.p5).toBeLessThanOrEqual(res.percentiles.p10);
      expect(res.percentiles.p10).toBeLessThanOrEqual(res.percentiles.p25);
      expect(res.percentiles.p25).toBeLessThanOrEqual(res.percentiles.p50);
      expect(res.percentiles.p50).toBeLessThanOrEqual(res.percentiles.p75);
      expect(res.percentiles.p75).toBeLessThanOrEqual(res.percentiles.p90);
      expect(res.percentiles.p90).toBeLessThanOrEqual(res.percentiles.p95);
    });
  });

  describe("Goal Planner Engine", () => {
    const retirementGoal: Goal = {
      id: "goal_retire_1",
      title: "Executive Retirement Corpus",
      goalType: "Retirement",
      targetAmount: "10000000", // ₹1 Crore
      currentAmount: "3000000",  // ₹30 Lakhs
      targetYear: "2034",        // 10 years out (assuming ~2024 baseline)
      monthlyContribution: "35000",
      priority: "Core",
      inflationAssumption: 0.06,
      expectedReturnAssumption: 0.12,
      volatilityAssumption: 0.15,
    };

    it("evaluates inflation-adjusted target and required contribution", () => {
      const diag = evaluateGoal(retirementGoal, [], 2024);

      expect(diag.targetAmount).toBe(10000000);
      expect(diag.requiredFutureValueInflationAdjusted).toBeGreaterThan(10000000);
      expect(diag.currentFundingPct).toBeCloseTo(30.0, 1);
      expect(diag.yearsRemaining).toBe(10);
      expect(diag.monteCarloSuccessProbability).toBeGreaterThan(0);
      expect(typeof diag.actionSummary).toBe("string");
      expect(diag.assumptions.inflationAssumption).toBe(0.06);
    });
  });
});
