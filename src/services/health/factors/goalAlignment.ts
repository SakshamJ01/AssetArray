import { Goal } from "../../../types/wealth";
import { FactorScoreResult } from "../types";

export function scoreGoalAlignment(
  goals?: Goal[],
  weight = 0.10
): FactorScoreResult {
  if (!goals || goals.length === 0) {
    return {
      factorId: "goalAlignment",
      name: "Goal & Horizon Alignment",
      score: 75,
      weight,
      inputs: { totalGoals: 0 },
      explanation: "No specific financial goals linked to this portfolio.",
      confidence: "MEDIUM",
      recommendations: ["Link specific milestone goals (e.g. Retirement, Wealth Preservation) to calibrate asset-liability matching."],
      evidence: [{ metric: "linkedGoalsCount", value: 0 }],
    };
  }

  let fundedGoals = 0;
  goals.forEach((g) => {
    const cur = Number(g.currentAmount) || 0;
    const tgt = Number(g.targetAmount) || 1;
    if (cur / tgt >= 0.5) fundedGoals++;
  });

  const fundingRatio = fundedGoals / goals.length;
  const score = Math.round(60 + fundingRatio * 40);

  return {
    factorId: "goalAlignment",
    name: "Goal & Horizon Alignment",
    score,
    weight,
    inputs: { totalGoals: goals.length, onTrackGoals: fundedGoals },
    explanation: `${fundedGoals} of ${goals.length} defined wealth milestones are currently on track (>50% funded).`,
    confidence: "HIGH",
    recommendations:
      fundingRatio < 0.5
        ? ["Increase systematic monthly contributions to restore funding trajectory for key milestones."]
        : [],
    evidence: [
      { metric: "linkedGoalsCount", value: goals.length },
      { metric: "onTrackGoalsRatio", value: `${fundedGoals}/${goals.length}` },
    ],
  };
}
