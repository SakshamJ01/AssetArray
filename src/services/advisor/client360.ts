import { AdvisorAction, Client360Snapshot } from "../../types/advisor";
import { Client, Goal } from "../../types/wealth";
import { calculateHealthScore } from "../healthScore";
import { getActivities } from "./activityTimeline";

/**
 * Compiles a holistic, instant 360° overview of a client mandate.
 * Reuses existing deterministic calculations without duplicating client stores.
 */
export async function buildClient360Snapshot(params: {
  client: Client;
  goals?: Goal[];
  actions?: AdvisorAction[];
}): Promise<Client360Snapshot> {
  const { client, goals = [], actions = [] } = params;

  const holdings = client.portfolio || [];
  const portfolioValue = holdings.reduce(
    (sum, h) => sum + (Number(h.currentValue) || 0),
    0
  );
  const totalInvested = holdings.reduce(
    (sum, h) => sum + (Number(h.investedValue) || 0),
    0
  );

  const unrealizedGainLoss = portfolioValue - totalInvested;
  const unrealizedGainLossPct =
    totalInvested > 0 ? (unrealizedGainLoss / totalInvested) * 100 : 0;

  // Health diagnostic
  const healthResult = calculateHealthScore(holdings, 0, client.id);

  // Client goals
  const clientGoals = goals.filter((g) => g.clientId === client.id);
  const goalsCount = clientGoals.length;
  let goalsOnTrack = 0;
  let goalsAtRisk = 0;

  clientGoals.forEach((g) => {
    const cur = parseFloat(g.currentAmount) || 0;
    const tgt = parseFloat(g.targetAmount) || 1;
    if (cur / tgt >= 0.4) {
      goalsOnTrack++;
    } else {
      goalsAtRisk++;
    }
  });

  // Risk & Drawdown
  const currentDrawdownPct =
    totalInvested > 0 && portfolioValue < totalInvested
      ? ((totalInvested - portfolioValue) / totalInvested) * 100
      : 0;

  // Tax loss harvesting potential
  let taxHarvestPotential = 0;
  holdings.forEach((h) => {
    const cur = Number(h.currentValue) || 0;
    const inv = Number(h.investedValue) || 0;
    if (inv > cur) {
      taxHarvestPotential += inv - cur;
    }
  });

  // Client Actions & Alerts
  const clientActions = actions.filter((a) => a.clientId === client.id);
  const openTasksCount = clientActions.filter(
    (a) => a.status !== "DONE" && a.status !== "CANCELLED"
  ).length;
  const openAlertsCount = clientActions.filter(
    (a) =>
      (a.sourceEngine === "risk" || a.sourceEngine === "health") &&
      a.status !== "DONE" &&
      a.status !== "CANCELLED"
  ).length;
  const criticalAlertsCount = clientActions.filter(
    (a) =>
      a.severity === "critical" &&
      a.status !== "DONE" &&
      a.status !== "CANCELLED"
  ).length;

  const nextAction = clientActions.find(
    (a) => a.status === "OPEN" || a.status === "IN_PROGRESS"
  );

  // Activities
  const recentActivities = await getActivities(client.id, 10);

  return {
    client,
    portfolioValue,
    totalInvested,
    unrealizedGainLoss,
    unrealizedGainLossPct,
    healthScore: healthResult.healthScore,
    healthGrade: healthResult.grade,
    goalsCount,
    goalsOnTrack,
    goalsAtRisk,
    riskProfile: client.riskProfile || "Moderate",
    currentDrawdownPct: parseFloat(currentDrawdownPct.toFixed(1)),
    taxHarvestPotential: Math.round(taxHarvestPotential),
    openAlertsCount,
    criticalAlertsCount,
    openTasksCount,
    lastReviewDate: client.lastContact || "Not Recorded",
    nextReviewDate: client.reminderDate || "None Scheduled",
    preferredChannel: client.preferredChannel || "Phone",
    recentActivities,
    nextAction,
  };
}
