/**
 * Monte Carlo Goal Probability Simulator Engine — Institutional Hardened v2.0
 * Institutional-grade stochastic asset projection (Geometric Brownian Motion / lognormal returns)
 * Deterministic reproducibility via optional PRNG seed.
 */

export const MONTE_CARLO_METHODOLOGY_VERSION = "monte-carlo-gbm-v2.0";

export interface MonteCarloConfig {
  initialCapital: number; // in base currency units (e.g. INR)
  monthlyContribution: number;
  years: number;
  targetCorpus: number;
  expectedAnnualReturn?: number; // e.g. 0.12 for 12%
  annualVolatility?: number; // e.g. 0.15 for 15%
  inflationRate?: number; // e.g. 0.05 for 5%
  adjustForInflation?: boolean;
  numSimulations?: number; // default 1000
  seed?: number; // Optional seed for 100% deterministic reproducibility
}

export interface TrajectoryPoint {
  year: number;
  p5?: number; // 5th percentile (deep bear case / tail risk)
  p10: number; // 10th percentile (bear case)
  p25: number; // 25th percentile
  p50: number; // Median (50th percentile)
  p75: number; // 75th percentile
  p90: number; // 90th percentile (bull case)
  p95?: number; // 95th percentile (extreme bull case)
}

export interface PercentileDistribution {
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
}

export interface MonteCarloResult {
  simulations: number;
  seed: number;
  assumptions: {
    expectedAnnualReturn: number;
    annualVolatility: number;
    inflationRate: number;
    adjustForInflation: boolean;
    years: number;
    monthlyContribution: number;
  };
  percentiles: PercentileDistribution;
  probabilityOfSuccess: number; // 0 to 100%
  expectedValue: number; // Mean terminal wealth
  downsideValue: number; // P5 tail value
  methodologyVersion: string;

  // Legacy backwards compatibility aliases
  successProbability: number; // 0 to 100%
  medianTerminalWealth: number;
  p10TerminalWealth: number;
  p90TerminalWealth: number;
  trajectory: TrajectoryPoint[];
  sampleRuns: number[][]; // 5 sample trajectories across all years
  targetMetYear: number | null;
  targetCorpus: number;
  totalContributions: number;
}

/**
 * Seeded Mulberry32 32-bit pseudo-random number generator
 */
function createMulberry32(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Seeded Box-Muller transform for generating standard normal random variates
 */
function createNormalGenerator(prng: () => number) {
  return function (): number {
    let u1 = 0;
    let u2 = 0;
    while (u1 === 0) u1 = prng();
    while (u2 === 0) u2 = prng();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  };
}

/**
 * Run a multi-path Monte Carlo wealth simulation with reproducible seed support
 */
export function runMonteCarloSimulation(
  config: MonteCarloConfig
): MonteCarloResult {
  const {
    initialCapital,
    monthlyContribution,
    years,
    targetCorpus,
    expectedAnnualReturn = 0.12,
    annualVolatility = 0.15,
    inflationRate = 0.05,
    adjustForInflation = false,
    numSimulations = 1000,
    seed = 42,
  } = config;

  const prng = createMulberry32(seed);
  const randomNormal = createNormalGenerator(prng);

  const boundedSims = Math.max(100, Math.min(10000, numSimulations));
  const boundedYears = Math.max(1, Math.min(50, years));
  const totalMonths = Math.max(1, Math.round(boundedYears * 12));

  const effectiveAnnualReturn = adjustForInflation
    ? (1 + expectedAnnualReturn) / (1 + inflationRate) - 1
    : expectedAnnualReturn;

  const monthlyMean = effectiveAnnualReturn / 12;
  const monthlyVol = annualVolatility / Math.sqrt(12);

  // Array to store paths: boundedSims x (years + 1)
  const yearlyPaths: number[][] = [];
  let successfulRuns = 0;
  let sumTerminalWealth = 0;

  for (let sim = 0; sim < boundedSims; sim++) {
    let wealth = Math.max(0, initialCapital);
    const path: number[] = [wealth];

    for (let m = 1; m <= totalMonths; m++) {
      // Geometric Brownian Motion step with monthly contribution
      const z = randomNormal();
      const returnRate =
        monthlyMean - 0.5 * monthlyVol * monthlyVol + monthlyVol * z;
      wealth = wealth * Math.exp(returnRate) + monthlyContribution;
      if (wealth < 0) wealth = 0;

      if (m % 12 === 0 || m === totalMonths) {
        path.push(Math.round(wealth));
      }
    }

    yearlyPaths.push(path);

    const terminalWealth = path[path.length - 1];
    sumTerminalWealth += terminalWealth;

    if (terminalWealth >= targetCorpus) {
      successfulRuns++;
    }
  }

  const numYears = Math.ceil(totalMonths / 12);
  const trajectory: TrajectoryPoint[] = [];

  for (let y = 0; y <= numYears; y++) {
    const valuesAtYear = yearlyPaths.map((p) => p[y] ?? p[p.length - 1]);
    valuesAtYear.sort((a, b) => a - b);

    const getPercentile = (p: number) => {
      const idx = Math.min(
        valuesAtYear.length - 1,
        Math.max(0, Math.floor((p / 100) * valuesAtYear.length))
      );
      return valuesAtYear[idx];
    };

    trajectory.push({
      year: y,
      p5: getPercentile(5),
      p10: getPercentile(10),
      p25: getPercentile(25),
      p50: getPercentile(50),
      p75: getPercentile(75),
      p90: getPercentile(90),
      p95: getPercentile(95),
    });
  }

  const finalValues = yearlyPaths.map((p) => p[p.length - 1]);
  finalValues.sort((a, b) => a - b);

  const getFinalPct = (p: number) =>
    finalValues[Math.min(finalValues.length - 1, Math.floor((p / 100) * finalValues.length))];

  // Check which year median crosses target
  let targetMetYear: number | null = null;
  for (const pt of trajectory) {
    if (pt.p50 >= targetCorpus) {
      targetMetYear = pt.year;
      break;
    }
  }

  // Pick 5 representative sample runs for visualization
  const sampleIndices = [
    0, // conservative
    Math.floor(boundedSims * 0.25),
    Math.floor(boundedSims * 0.5),
    Math.floor(boundedSims * 0.75),
    boundedSims - 1, // optimistic
  ];
  const sampleRuns = sampleIndices.map((i) => yearlyPaths[i] || yearlyPaths[0]);

  const successProbability = Math.round((successfulRuns / boundedSims) * 1000) / 10;
  const totalContributions = initialCapital + monthlyContribution * 12 * boundedYears;
  const expectedValue = Math.round(sumTerminalWealth / boundedSims);

  const percentiles: PercentileDistribution = {
    p5: getFinalPct(5),
    p10: getFinalPct(10),
    p25: getFinalPct(25),
    p50: getFinalPct(50),
    p75: getFinalPct(75),
    p90: getFinalPct(90),
    p95: getFinalPct(95),
  };

  return {
    simulations: boundedSims,
    seed,
    assumptions: {
      expectedAnnualReturn,
      annualVolatility,
      inflationRate,
      adjustForInflation,
      years: boundedYears,
      monthlyContribution,
    },
    percentiles,
    probabilityOfSuccess: successProbability,
    expectedValue,
    downsideValue: percentiles.p5,
    methodologyVersion: MONTE_CARLO_METHODOLOGY_VERSION,

    // Legacy backwards compatibility aliases
    successProbability,
    medianTerminalWealth: percentiles.p50,
    p10TerminalWealth: percentiles.p10,
    p90TerminalWealth: percentiles.p90,
    trajectory,
    sampleRuns,
    targetMetYear,
    targetCorpus,
    totalContributions,
  };
}
