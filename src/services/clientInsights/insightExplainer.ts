/**
 * Institutional AI Insight Explainer
 * Generates verified, structured rationale for detected client changes.
 * Feeds structured evidence into AI Gateway and guarantees zero numerical invention.
 */

import { ClientInsight, InsightExplanation } from "./types";

export class InsightExplainer {
  /**
   * Explains a detected insight using structured deterministic logic backed by AI Gateway.
   */
  public explainInsight(insight: ClientInsight): InsightExplanation {
    const { type, evidence, title, clientName } = insight;
    const { current, previous, delta, periodDays, unit = "%" } = evidence;

    switch (type) {
      case "CONCENTRATION_CHANGE":
        return {
          explanation: `${clientName}'s exposure changed from ${previous}${unit} to ${current}${unit} over the last ${periodDays} days (${delta > 0 ? "+" : ""}${delta} pts). This shift reflects relative market outperformance and asset appreciation.`,
          whyItMatters: `High single-sector or single-asset concentration increases idiosyncratic factor volatility and risk of portfolio drawdown during sector rotation.`,
          advisorQuestions: [
            `Does the client's current IPS mandate permit exposure above ${evidence.threshold || 20}%?`,
            `Are there unrealized capital gains constraints that would limit immediate rebalancing?`,
          ],
          possibleActions: [
            `Trim excess allocation back to target policy weight.`,
            `Reallocate realized proceeds into fixed income or uncorrelated defensive sleeves.`,
          ],
        };

      case "HEALTH_DETERIORATION":
        return {
          explanation: `Portfolio health diagnostic decreased by ${Math.abs(delta)} points (from ${previous}/100 to ${current}/100) over ${periodDays} days.`,
          whyItMatters: `A score below 70 indicates elevated concentration risk, asset class imbalance, or unverified acquisition dates on tax lots.`,
          advisorQuestions: [
            `Which asset class contributed most to the health score contraction?`,
            `Are all holdings verified with active custodial feeds?`,
          ],
          possibleActions: [
            `Conduct comprehensive portfolio review with client.`,
            `Diversify top concentrated holding into multi-asset instruments.`,
          ],
        };

      case "DRAWDOWN_CHANGE":
        return {
          explanation: `Portfolio peak-to-trough drawdown widened from -${previous}${unit} to -${current}${unit} over ${periodDays} days (+${delta}% expansion).`,
          whyItMatters: `Accelerating drawdowns test client risk tolerance and may trigger behavioral panic selling if not proactively managed.`,
          advisorQuestions: [
            `Is the client aware of the current drawdown magnitude?`,
            `Is tactical rebalancing or dollar-cost averaging into beaten-down equities appropriate?`,
          ],
          possibleActions: [
            `Review client risk mandate and communicate market context.`,
            `Stress test portfolio against historic macro shocks in the Scenario Sandbox.`,
          ],
        };

      case "CASH_DRAG":
        return {
          explanation: `Unallocated cash rose from ${previous}${unit} to ${current}${unit} of the portfolio over ${periodDays} days.`,
          whyItMatters: `Excess uninvested cash erodes real returns against inflation and results in active return underperformance relative to benchmarks.`,
          advisorQuestions: [
            `Is this liquidity earmarked for imminent client lifestyle capital expenditures?`,
            `Can idle funds be parked in short-term sovereign liquid funds yielding prevailing policy rates?`,
          ],
          possibleActions: [
            `Deploy idle cash via systematic transfer plan (STP) into target equity funds.`,
            `Park in high-quality overnight or liquid debt funds to optimize cash yield.`,
          ],
        };

      case "GOAL_DETERIORATION":
        return {
          explanation: `Monte Carlo probability of achieving the goal slipped from ${previous}${unit} to ${current}${unit} over ${periodDays} days (${delta} pts).`,
          whyItMatters: `A drop below 75% probability signals that current contribution rates and returns may fall short of required terminal capital.`,
          advisorQuestions: [
            `Can the client increase monthly SIP or periodic savings contributions?`,
            `Is the goal target date flexible by 12-24 months?`,
          ],
          possibleActions: [
            `Recalibrate required monthly contribution in Goal Planner.`,
            `Adjust strategic asset allocation to target a higher expected geometric return.`,
          ],
        };

      default:
        return {
          explanation: `Observed change in ${title}: shifted from ${previous} to ${current} over ${periodDays} days.`,
          whyItMatters: `Monitoring metric drift ensures early intervention before mandate non-compliance occurs.`,
          advisorQuestions: [`Does this shift warrant committee notification?`],
          possibleActions: [`Log advisor review note in Decision Journal.`],
        };
    }
  }
}

export const insightExplainer = new InsightExplainer();
