import { Goal, PortfolioHolding } from "../../types/wealth";
import { runMonteCarloSimulation } from "../monteCarlo";

export const GOAL_ENGINE_METHODOLOGY_VERSION = "goal-planner-v1.1";

export interface GoalDiagnosticResult {
  goalId: string;
  goalTitle: string;
  currentFunding: number;
  targetAmount: number;
  currentFundingPct: number;
  yearsRemaining: number;
  requiredFutureValueInflationAdjusted: number;
  requiredMonthlyContribution: number;
  currentMonthlyContribution: number;
  monthlyShortfallOrSurplus: number; // positive = surplus, negative = shortfall
  monteCarloSuccessProbability: number; // 0 - 100%
  expectedCorpusAtHorizon: number;
  downsideCorpusP5: number;
  assumptions: {
    inflationAssumption: number;
    expectedReturnAssumption: number;
    volatilityAssumption: number;
    years: number;
  };
  recommendedContributionChange: number; // Suggested +/- change
  actionSummary: string;
  methodologyVersion: string;
}

/**
 * Evaluates goal funding progress, required future value, and Monte Carlo probability of success.
 */
export function evaluateGoal(
  goal: Goal,
  linkedHoldings: PortfolioHolding[] = [],
  currentYear: number = new Date().getFullYear()
): GoalDiagnosticResult {
  const targetYear = parseInt(goal.targetYear, 10) || currentYear + 10;
  const yearsRemaining = Math.max(1, targetYear - currentYear);

  const targetAmount = Math.max(1, parseFloat(goal.targetAmount) || 1000000);
  let currentFunding = parseFloat(goal.currentAmount) || 0;

  // If linked holdings provided, add up their current value
  if (linkedHoldings.length > 0) {
    const holdingsVal = linkedHoldings.reduce(
      (sum, h) => sum + (Number(h.currentValue) || 0),
      0
    );
    if (holdingsVal > 0) {
      currentFunding = holdingsVal;
    }
  }

  const currentMonthlyContribution = Math.max(
    0,
    parseFloat(goal.monthlyContribution) || 0
  );

  const inflationRate = goal.inflationAssumption ?? 0.06; // 6% default Indian inflation
  const expectedReturn = goal.expectedReturnAssumption ?? 0.12; // 12% default blended equity/debt return
  const volatility = goal.volatilityAssumption ?? 0.15; // 15% annual volatility

  // Inflation-adjusted future target amount
  const requiredFutureValueInflationAdjusted = Math.round(
    targetAmount * Math.pow(1 + inflationRate, yearsRemaining)
  );

  // Compute required monthly contribution using Future Value of Annuity formula
  // FV = PV * (1 + r)^n + PMT * [ ((1 + r)^n - 1) / r ]
  const totalMonths = yearsRemaining * 12;
  const monthlyRate = expectedReturn / 12;
  const compoundFactor = Math.pow(1 + monthlyRate, totalMonths);
  const futureValueOfPV = currentFunding * compoundFactor;

  let requiredMonthlyContribution = 0;
  if (futureValueOfPV < requiredFutureValueInflationAdjusted) {
    const neededFromContributions =
      requiredFutureValueInflationAdjusted - futureValueOfPV;
    const annuityFactor = (compoundFactor - 1) / monthlyRate;
    requiredMonthlyContribution = Math.max(
      0,
      Math.round(neededFromContributions / annuityFactor)
    );
  }

  const monthlyShortfallOrSurplus =
    currentMonthlyContribution - requiredMonthlyContribution;

  // Run reproducible Monte Carlo simulation (1,000 runs, seed 101)
  const mc = runMonteCarloSimulation({
    initialCapital: currentFunding,
    monthlyContribution: currentMonthlyContribution,
    years: yearsRemaining,
    targetCorpus: requiredFutureValueInflationAdjusted,
    expectedAnnualReturn: expectedReturn,
    annualVolatility: volatility,
    inflationRate,
    adjustForInflation: false,
    numSimulations: 1000,
    seed: 101,
  });

  const currentFundingPct = parseFloat(
    ((currentFunding / targetAmount) * 100).toFixed(1)
  );

  let actionSummary = "";
  if (mc.probabilityOfSuccess >= 85) {
    actionSummary = `Goal is in exceptional health (${mc.probabilityOfSuccess}% success probability). Maintain current monthly SIP of ₹${currentMonthlyContribution.toLocaleString("en-IN")}.`;
  } else if (mc.probabilityOfSuccess >= 65) {
    actionSummary = `Goal is on track (${mc.probabilityOfSuccess}% probability), but vulnerable to market downturns. Consider increasing monthly contribution by ₹${Math.abs(monthlyShortfallOrSurplus).toLocaleString("en-IN")} to achieve institutional certainty (>85%).`;
  } else {
    actionSummary = `Funding deficit detected (${mc.probabilityOfSuccess}% probability). A monthly contribution increase of ₹${Math.max(0, requiredMonthlyContribution - currentMonthlyContribution).toLocaleString("en-IN")} is recommended to eliminate the projected shortfall.`;
  }

  return {
    goalId: goal.id,
    goalTitle: goal.title || goal.name || "Wealth Milestone",
    currentFunding,
    targetAmount,
    currentFundingPct,
    yearsRemaining,
    requiredFutureValueInflationAdjusted,
    requiredMonthlyContribution,
    currentMonthlyContribution,
    monthlyShortfallOrSurplus,
    monteCarloSuccessProbability: mc.probabilityOfSuccess,
    expectedCorpusAtHorizon: mc.expectedValue,
    downsideCorpusP5: mc.downsideValue,
    assumptions: {
      inflationAssumption: inflationRate,
      expectedReturnAssumption: expectedReturn,
      volatilityAssumption: volatility,
      years: yearsRemaining,
    },
    recommendedContributionChange: Math.max(
      0,
      requiredMonthlyContribution - currentMonthlyContribution
    ),
    actionSummary,
    methodologyVersion: GOAL_ENGINE_METHODOLOGY_VERSION,
  };
}
