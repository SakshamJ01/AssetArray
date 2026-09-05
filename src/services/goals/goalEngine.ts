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
  monteCarloSuccessProbability: number; // 0 - 100% integer
  expectedCorpusAtHorizon: number;
  downsideCorpusP5: number;
  status: "ON_TRACK" | "AT_RISK" | "CRITICAL" | "EXPIRED_OR_DUE" | "ACHIEVED";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  assumptions: {
    inflationAssumption: number;
    expectedReturnAssumption: number;
    volatilityAssumption: number;
    years: number;
  };
  recommendedContributionChange: number; // Suggested +/- change
  actionSummary: string;
  methodologyVersion: string;
  warnings?: string[];
}

/**
 * Evaluates goal funding progress, required future value, and Monte Carlo probability of success.
 */
export function evaluateGoal(
  goal: Goal,
  linkedHoldings: PortfolioHolding[] = [],
  currentYear: number = new Date().getFullYear()
): GoalDiagnosticResult {
  const parsedTargetYear = parseInt(goal.targetYear, 10);
  const targetYear = !isNaN(parsedTargetYear) ? parsedTargetYear : currentYear + 10;
  const warnings: string[] = [];

  const targetAmount = Math.max(1, parseFloat(goal.targetAmount) || 1000000);
  let currentFunding = Math.max(0, parseFloat(goal.currentAmount) || 0);

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

  const currentFundingPct = parseFloat(
    ((currentFunding / targetAmount) * 100).toFixed(1)
  );

  // Check if goal has already matured or is past due
  if (targetYear <= currentYear) {
    const isPast = targetYear < currentYear;
    warnings.push(
      isPast
        ? `Goal target year (${targetYear}) is in the past. Review goal status with client.`
        : `Goal target year is the current calendar year (${currentYear}).`
    );

    const achieved = currentFunding >= targetAmount;
    return {
      goalId: goal.id,
      goalTitle: goal.title || "Untitled Goal",
      currentFunding,
      targetAmount,
      currentFundingPct,
      yearsRemaining: 0,
      requiredFutureValueInflationAdjusted: targetAmount,
      requiredMonthlyContribution: 0,
      currentMonthlyContribution,
      monthlyShortfallOrSurplus: currentMonthlyContribution,
      monteCarloSuccessProbability: achieved ? 100 : 0,
      expectedCorpusAtHorizon: currentFunding,
      downsideCorpusP5: currentFunding,
      status: achieved ? "ACHIEVED" : "EXPIRED_OR_DUE",
      confidence: achieved ? "HIGH" : "LOW",
      assumptions: {
        inflationAssumption: inflationRate,
        expectedReturnAssumption: expectedReturn,
        volatilityAssumption: volatility,
        years: 0,
      },
      recommendedContributionChange: 0,
      actionSummary: isPast
        ? `Goal deadline passed in ${targetYear}. Current funding is ${currentFundingPct}% of target.`
        : `Goal matures this year. Current funding is ${currentFundingPct}% of target.`,
      methodologyVersion: GOAL_ENGINE_METHODOLOGY_VERSION,
      warnings,
    };
  }

  const yearsRemaining = targetYear - currentYear;

  // Inflation-adjusted future target amount
  const requiredFutureValueInflationAdjusted = Math.round(
    targetAmount * Math.pow(1 + inflationRate, yearsRemaining)
  );

  // Compute required monthly contribution using Future Value of Annuity formula
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

  const probabilityOfSuccess = Math.round(mc.probabilityOfSuccess);

  let status: "ON_TRACK" | "AT_RISK" | "CRITICAL" | "EXPIRED_OR_DUE" | "ACHIEVED" = "ON_TRACK";
  let actionSummary = "";

  if (currentFunding >= requiredFutureValueInflationAdjusted) {
    status = "ACHIEVED";
    actionSummary = "Goal corpus fully funded under current valuation. Maintain defensive capital preservation.";
  } else if (probabilityOfSuccess >= 85) {
    status = "ON_TRACK";
    actionSummary = "Goal is well-funded. Current monthly SIP and asset growth path are sufficient.";
  } else if (probabilityOfSuccess >= 65) {
    status = "AT_RISK";
    const addAmt = Math.abs(monthlyShortfallOrSurplus);
    actionSummary = `Moderate shortfall. Increase monthly contributions by ₹${addAmt.toLocaleString("en-IN")} to achieve an 85%+ success probability.`;
  } else {
    status = "CRITICAL";
    const addAmt = Math.abs(monthlyShortfallOrSurplus);
    actionSummary = `High shortfall risk (${probabilityOfSuccess}% probability). Increase monthly savings by ₹${addAmt.toLocaleString("en-IN")} or extend horizon by 2-3 years.`;
  }

  const confidence: "HIGH" | "MEDIUM" | "LOW" =
    linkedHoldings.length > 0 && yearsRemaining <= 25 ? "HIGH" : yearsRemaining > 25 ? "LOW" : "MEDIUM";

  return {
    goalId: goal.id,
    goalTitle: goal.title || "Untitled Goal",
    currentFunding,
    targetAmount,
    currentFundingPct,
    yearsRemaining,
    requiredFutureValueInflationAdjusted,
    requiredMonthlyContribution,
    currentMonthlyContribution,
    monthlyShortfallOrSurplus,
    monteCarloSuccessProbability: probabilityOfSuccess,
    expectedCorpusAtHorizon: Math.round(mc.expectedValue),
    downsideCorpusP5: Math.round(mc.downsideValue),
    status,
    confidence,
    assumptions: {
      inflationAssumption: inflationRate,
      expectedReturnAssumption: expectedReturn,
      volatilityAssumption: volatility,
      years: yearsRemaining,
    },
    recommendedContributionChange: -monthlyShortfallOrSurplus,
    actionSummary,
    methodologyVersion: GOAL_ENGINE_METHODOLOGY_VERSION,
    warnings,
  };
}
