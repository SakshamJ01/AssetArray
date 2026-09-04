import {
  calculateCashFlow,
  calculateSip,
  calculateGoalPlanner,
  calculateRetirement,
} from "../src/services/calculators";

describe("Financial Calculators Service", () => {
  describe("calculateCashFlow", () => {
    it("should correctly calculate payout mode cash flow", () => {
      const result = calculateCashFlow({
        principal: 100000,
        annualRate: 6,
        years: 5,
        frequency: "Monthly",
        mode: "Payout",
      });

      expect(result.ready).toBe(true);
      expect(result.annualInterest).toBe(6000);
      expect(result.payoutPerPeriod).toBe(500); // 6000 / 12
      expect(result.totalInterest).toBe(30000); // 6000 * 5
      expect(result.maturityValue).toBe(100000);
      expect(result.periods).toBe(60);
    });

    it("should correctly calculate cumulative mode cash flow", () => {
      const result = calculateCashFlow({
        principal: 100000,
        annualRate: 10,
        years: 2,
        frequency: "Yearly",
        mode: "Cumulative",
      });

      expect(result.ready).toBe(true);
      expect(result.maturityValue).toBeCloseTo(121000, 0); // 100000 * 1.1^2
      expect(result.totalInterest).toBeCloseTo(21000, 0);
    });

    it("should handle zero / invalid inputs gracefully", () => {
      const result = calculateCashFlow({
        principal: 0,
        annualRate: 5,
        years: 1,
        frequency: "Monthly",
        mode: "Payout",
      });
      expect(result.ready).toBe(false);
      expect(result.payoutPerPeriod).toBe(0);
    });
  });

  describe("calculateSip", () => {
    it("should calculate monthly SIP returns correctly", () => {
      const result = calculateSip({
        installment: 10000,
        annualRate: 12,
        years: 10,
        frequency: "Monthly",
      });

      expect(result.ready).toBe(true);
      expect(result.installments).toBe(120);
      expect(result.totalInvested).toBe(1200000);
      // At 12% annual for 10 years, maturity is approx 23.23 Lakhs
      expect(result.maturityValue).toBeGreaterThan(2300000);
      expect(result.maturityValue).toBeLessThan(2350000);
      expect(result.estimatedReturns).toBe(result.maturityValue - result.totalInvested);
    });

    it("should return ready:false when missing parameters", () => {
      const result = calculateSip({
        installment: 0,
        annualRate: 12,
        years: 5,
        frequency: "Monthly",
      });
      expect(result.ready).toBe(false);
      expect(result.totalInvested).toBe(0);
    });
  });

  describe("calculateGoalPlanner", () => {
    it("should calculate required SIP to reach a specific target", () => {
      const result = calculateGoalPlanner({
        targetAmount: 1000000,
        expectedReturn: 12,
        years: 5,
      });

      expect(result.ready).toBe(true);
      expect(result.requiredMonthlySip).toBeGreaterThan(11000);
      expect(result.requiredMonthlySip).toBeLessThan(13000);
      expect(result.totalInvested).toBeCloseTo(result.requiredMonthlySip * 60, 0);
      expect(result.estimatedGrowth).toBeCloseTo(1000000 - result.totalInvested, 0);
    });
  });

  describe("calculateRetirement", () => {
    it("should compute future monthly expense and target corpus", () => {
      const result = calculateRetirement({
        monthlyExpense: 50000,
        inflation: 6,
        returnRate: 12,
        yearsToRetire: 15,
        retirementYears: 25,
      });

      expect(result.ready).toBe(true);
      // Future expense = 50000 * (1.06)^15 ≈ 119827
      expect(result.futureMonthlyExpense).toBeGreaterThan(119000);
      expect(result.futureMonthlyExpense).toBeLessThan(121000);
      expect(result.targetCorpus).toBeGreaterThan(0);
      expect(result.requiredMonthlySip).toBeGreaterThan(0);
    });
  });
});
