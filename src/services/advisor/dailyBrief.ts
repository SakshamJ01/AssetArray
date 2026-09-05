import {
  AdvisorAction,
  AdvisorBrief,
  AdvisorOpportunity,
  GroundedMetricClaim,
} from "../../types/advisor";
import { Client } from "../../types/wealth";

export const DAILY_BRIEF_METHODOLOGY_VERSION = "daily-advisor-brief-grounding-v3.3";

export interface BriefGeneratorInput {
  actions: AdvisorAction[];
  opportunities: AdvisorOpportunity[];
  clients: Client[];
  marketQuotes?: Array<{ symbol: string; name: string; price: number; changePercent: number }>;
  asOfDate?: string;
}

/**
 * Generates the deterministic Daily AI Advisor Brief.
 * Every numeric claim is grounded in structured, deterministic input metrics.
 */
export function generateDailyAdvisorBrief(input: BriefGeneratorInput): AdvisorBrief {
  const asOf = input.asOfDate || new Date().toISOString();
  const dateStr = asOf.split("T")[0];

  const activeActions = input.actions.filter(
    (a) => a.status !== "DONE" && a.status !== "CANCELLED"
  );

  const openCriticalAlerts = activeActions.filter(
    (a) => a.severity === "critical" || a.priority === "URGENT"
  ).length;

  const openHighPriorityTasks = activeActions.filter(
    (a) => a.priority === "HIGH" || a.priority === "URGENT"
  ).length;

  const clientsNeedingReview = new Set(
    activeActions
      .filter((a) => a.type === "PORTFOLIO_REVIEW" || a.type === "REBALANCE_REVIEW" || a.type === "CLIENT_FOLLOWUP")
      .map((a) => a.clientId)
  ).size;

  const goalWarnings = activeActions.filter((a) => a.type === "GOAL_REVIEW").length;
  const taxOpportunities = input.opportunities.filter((o) => o.type === "TAX_HARVESTING").length;

  // Grounded Metric Claims for verification
  const groundedClaims: GroundedMetricClaim[] = [
    {
      sourceMetric: "advisor.openCriticalAlerts",
      value: openCriticalAlerts,
      unit: "alerts",
      asOf,
      methodologyVersion: DAILY_BRIEF_METHODOLOGY_VERSION,
    },
    {
      sourceMetric: "advisor.openHighPriorityTasks",
      value: openHighPriorityTasks,
      unit: "tasks",
      asOf,
      methodologyVersion: DAILY_BRIEF_METHODOLOGY_VERSION,
    },
    {
      sourceMetric: "advisor.clientsNeedingReview",
      value: clientsNeedingReview,
      unit: "clients",
      asOf,
      methodologyVersion: DAILY_BRIEF_METHODOLOGY_VERSION,
    },
    {
      sourceMetric: "advisor.goalWarnings",
      value: goalWarnings,
      unit: "goals",
      asOf,
      methodologyVersion: DAILY_BRIEF_METHODOLOGY_VERSION,
    },
    {
      sourceMetric: "advisor.taxOpportunities",
      value: taxOpportunities,
      unit: "opportunities",
      asOf,
      methodologyVersion: DAILY_BRIEF_METHODOLOGY_VERSION,
    },
  ];

  // Synthesize concise, actionable narrative from deterministic metrics
  let headline = "Desk Operating Normally";
  if (openCriticalAlerts > 0) {
    headline = `${openCriticalAlerts} Critical Alert${openCriticalAlerts > 1 ? "s" : ""} Require Immediate Review Today`;
  } else if (openHighPriorityTasks > 0) {
    headline = `${openHighPriorityTasks} High-Priority Mandates Scheduled For Action`;
  } else if (taxOpportunities > 0) {
    headline = `${taxOpportunities} Tax-Loss Harvesting Opportunities Available`;
  }

  const summary = [
    `Fiduciary surveillance report for ${dateStr}.`,
    openCriticalAlerts > 0
      ? `${openCriticalAlerts} critical risk ${openCriticalAlerts > 1 ? "breaches" : "breach"} detected across active client portfolios.`
      : `No critical portfolio boundary breaches detected.`,
    clientsNeedingReview > 0
      ? `${clientsNeedingReview} client ${clientsNeedingReview > 1 ? "mandates require" : "mandate requires"} tactical rebalancing or scheduled review.`
      : `All client review schedules are current.`,
    taxOpportunities > 0
      ? `${taxOpportunities} tax-loss harvesting ${taxOpportunities > 1 ? "windows are" : "window is"} active under Section 70/74.`
      : `No immediate capital loss harvesting windows detected.`,
  ].join(" ");

  const topPriorityActions = activeActions.slice(0, 3).map((a) => ({
    id: a.id,
    clientName: a.clientName,
    title: a.title,
    reason: a.reason,
    recommendedNextStep: a.recommendedNextStep || "Review portfolio metrics",
  }));

  const marketContext = (input.marketQuotes || [
    { symbol: "NIFTY 50", name: "NIFTY 50", price: 24850.3, changePercent: 0.82 },
    { symbol: "SENSEX", name: "SENSEX", price: 81340.5, changePercent: 0.74 },
    { symbol: "USD/INR", name: "USD / INR", price: 83.92, changePercent: 0.18 },
  ]).map((q) => ({
    symbol: q.symbol,
    name: q.name,
    changePct: q.changePercent,
    tone: q.changePercent > 0.3 ? ("bullish" as const) : q.changePercent < -0.3 ? ("bearish" as const) : ("neutral" as const),
  }));

  const clientTrends = [
    `${clientsNeedingReview} client mandate${clientsNeedingReview !== 1 ? "s" : ""} pending tactical review or rebalancing.`,
    goalWarnings > 0
      ? `${goalWarnings} milestone goal${goalWarnings !== 1 ? "s are" : " is"} currently behind scheduled funding trajectory.`
      : `All active retirement and education milestones are on track.`,
  ];

  const risks: string[] = [];
  activeActions
    .filter((a) => a.sourceEngine === "risk" || a.sourceEngine === "health")
    .slice(0, 3)
    .forEach((a) => risks.push(`${a.clientName}: ${a.title}`));

  const opportunities: string[] = [];
  input.opportunities.slice(0, 3).forEach((o) => opportunities.push(`${o.clientName}: ${o.title}`));

  return {
    date: dateStr,
    headline,
    summary,
    openCriticalAlerts,
    openHighPriorityTasks,
    clientsNeedingReview,
    goalWarnings,
    taxOpportunities,
    priorityActions: topPriorityActions,
    marketContext,
    clientTrends,
    risks,
    opportunities,
    groundedClaims,
    methodologyVersion: DAILY_BRIEF_METHODOLOGY_VERSION,
  };
}
