import { runMonteCarloSimulation } from "../src/services/monteCarlo";

describe("Monte Carlo Simulation Engine", () => {
  it("should run 1000 simulations and generate consistent probability bounds", () => {
    const res = runMonteCarloSimulation({
      initialCapital: 1000000, // 10L
      monthlyContribution: 50000, // 50k
      years: 10,
      targetCorpus: 15000000, // 1.5 Cr
      expectedAnnualReturn: 0.12,
      annualVolatility: 0.15,
      numSimulations: 500,
    });

    expect(res.successProbability).toBeGreaterThanOrEqual(0);
    expect(res.successProbability).toBeLessThanOrEqual(100);
    expect(res.medianTerminalWealth).toBeGreaterThan(0);
    expect(res.p90TerminalWealth).toBeGreaterThan(res.medianTerminalWealth);
    expect(res.medianTerminalWealth).toBeGreaterThan(res.p10TerminalWealth);
    expect(res.trajectory.length).toBe(11); // Year 0 to 10
    expect(res.sampleRuns.length).toBe(5);
    expect(res.totalContributions).toBe(1000000 + 50000 * 12 * 10);
  });

  it("should report high probability when target is modest", () => {
    const res = runMonteCarloSimulation({
      initialCapital: 5000000, // 50L
      monthlyContribution: 50000,
      years: 15,
      targetCorpus: 6000000, // 60L (very modest target)
      expectedAnnualReturn: 0.12,
      numSimulations: 200,
    });

    expect(res.successProbability).toBeGreaterThanOrEqual(95);
    expect(res.targetMetYear).not.toBeNull();
  });

  it("should report lower probability when target is exceptionally aggressive", () => {
    const res = runMonteCarloSimulation({
      initialCapital: 100000, // 1L
      monthlyContribution: 5000, // 5k
      years: 5,
      targetCorpus: 50000000, // 5 Cr (extremely high target)
      numSimulations: 200,
    });

    expect(res.successProbability).toBeLessThan(5);
  });

  it("should factor inflation when adjustForInflation is true", () => {
    const nominalRes = runMonteCarloSimulation({
      initialCapital: 2000000,
      monthlyContribution: 25000,
      years: 10,
      targetCorpus: 10000000,
      expectedAnnualReturn: 0.12,
      annualVolatility: 0.10,
      adjustForInflation: false,
      numSimulations: 200,
    });

    const realRes = runMonteCarloSimulation({
      initialCapital: 2000000,
      monthlyContribution: 25000,
      years: 10,
      targetCorpus: 10000000,
      expectedAnnualReturn: 0.12,
      inflationRate: 0.06,
      annualVolatility: 0.10,
      adjustForInflation: true,
      numSimulations: 200,
    });

    // Real returns adjusted for inflation should yield lower median terminal wealth
    expect(realRes.medianTerminalWealth).toBeLessThan(nominalRes.medianTerminalWealth);
  });
});
