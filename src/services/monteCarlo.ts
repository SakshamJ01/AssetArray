/**
 * Monte Carlo Goal Probability Simulator Engine
 * Institutional-grade stochastic asset projection (Geometric Brownian Motion / lognormal returns)
 * Simulates 1,000+ portfolio trajectories to compute empirical probability of reaching financial goals.
 */

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
}

export interface TrajectoryPoint {
  year: number;
  p10: number; // 10th percentile (bear case)
  p25: number; // 25th percentile
  p50: number; // Median (50th percentile)
  p75: number; // 75th percentile
  p90: number; // 90th percentile (bull case)
}

export interface MonteCarloResult {
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
 * Standard Box-Muller transform for generating standard normal random variates
 */
function randomNormal(): number {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Run a multi-path Monte Carlo wealth simulation
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
  } = config;

  const totalMonths = Math.max(1, Math.round(years * 12));
  const effectiveAnnualReturn = adjustForInflation
    ? (1 + expectedAnnualReturn) / (1 + inflationRate) - 1
    : expectedAnnualReturn;

  const monthlyMean = effectiveAnnualReturn / 12;
  const monthlyVol = annualVolatility / Math.sqrt(12);

  // Array to store paths: numSimulations x (years + 1)
  const yearlyPaths: number[][] = [];
  let successfulRuns = 0;

  for (let sim = 0; sim < numSimulations; sim++) {
    let wealth = initialCapital;
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
      p10: getPercentile(10),
      p25: getPercentile(25),
      p50: getPercentile(50),
      p75: getPercentile(75),
      p90: getPercentile(90),
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
    Math.floor(numSimulations * 0.25),
    Math.floor(numSimulations * 0.5),
    Math.floor(numSimulations * 0.75),
    numSimulations - 1, // optimistic
  ];
  const sampleRuns = sampleIndices.map((i) => yearlyPaths[i] || yearlyPaths[0]);

  const successProbability = Math.round((successfulRuns / numSimulations) * 1000) / 10;
  const totalContributions = initialCapital + monthlyContribution * 12 * years;

  return {
    successProbability,
    medianTerminalWealth: getFinalPct(50),
    p10TerminalWealth: getFinalPct(10),
    p90TerminalWealth: getFinalPct(90),
    trajectory,
    sampleRuns,
    targetMetYear,
    targetCorpus,
    totalContributions,
  };
}
