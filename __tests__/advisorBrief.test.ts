import {
  DAILY_BRIEF_METHODOLOGY_VERSION,
  generateDailyAdvisorBrief,
} from "../src/services/advisor/dailyBrief";
import { AdvisorAction, AdvisorOpportunity } from "../src/types/advisor";
import { Client } from "../src/types/wealth";

describe("Daily AI Advisor Brief Grounding", () => {
  const asOfDate = "2026-09-05T10:00:00.000Z";

  const actions: AdvisorAction[] = [
    {
      id: "a1",
      canonicalKey: "c1:risk:h1:REBALANCE_REVIEW",
      clientId: "c1",
      clientName: "Rahul Mehta",
      type: "REBALANCE_REVIEW",
      priority: "URGENT",
      priorityScore: 92,
      priorityFactors: {
        severity: 5,
        clientImportance: 5,
        financialImpact: 4,
        urgency: 4,
        dataConfidence: 5,
        explanation: "Critical risk",
      },
      severity: "critical",
      title: "Concentration Breach: TCS",
      description: "TCS exceeds 20% limit",
      reason: "Diversification loss",
      evidence: { metric: "holdingWeightPct", observedValue: 27.4, threshold: 20 },
      createdAt: asOfDate,
      dueAt: "2026-09-05",
      status: "OPEN",
      sourceEngine: "risk",
      deepLink: { tab: "Portfolios" },
    },
    {
      id: "a2",
      canonicalKey: "c2:goals:g1:GOAL_REVIEW",
      clientId: "c2",
      clientName: "Ananya Sharma",
      type: "GOAL_REVIEW",
      priority: "HIGH",
      priorityScore: 68,
      priorityFactors: {
        severity: 3,
        clientImportance: 3,
        financialImpact: 3,
        urgency: 4,
        dataConfidence: 5,
        explanation: "Moderate risk",
      },
      severity: "warning",
      title: "Goal Deficit: Retirement",
      description: "Goal is underfunded",
      reason: "Probability dropped",
      evidence: { metric: "GoalFundingPct", observedValue: 25 },
      createdAt: asOfDate,
      dueAt: "2026-09-05",
      status: "OPEN",
      sourceEngine: "goals",
      deepLink: { tab: "Tools" },
    },
  ];

  const opportunities: AdvisorOpportunity[] = [
    {
      id: "o1",
      canonicalKey: "opp:c1:tax:h2:TAX_HARVESTING",
      clientId: "c1",
      clientName: "Rahul Mehta",
      type: "TAX_HARVESTING",
      title: "Capital Loss Harvesting",
      description: "Harvest losses",
      potentialBenefit: "Tax shield",
      estimatedFinancialValue: 50000,
      evidence: { metric: "Loss", observedValue: 50000 },
      recommendedAction: "Harvest",
      deepLink: { tab: "Portfolios" },
      createdAt: asOfDate,
      priorityScore: 75,
    },
  ];

  const clients: Client[] = [
    {
      id: "c1",
      name: "Rahul Mehta",
      phone: "",
      email: "",
      category: "HNI",
      riskProfile: "",
      preferredChannel: "Phone",
      watchlist: [],
      notes: "",
      city: "",
      allocation: "",
      reminderDate: "",
      priority: "High",
      lastContact: "",
      updateHistory: [],
      portfolio: [],
    },
    {
      id: "c2",
      name: "Ananya Sharma",
      phone: "",
      email: "",
      category: "Retail",
      riskProfile: "",
      preferredChannel: "Email",
      watchlist: [],
      notes: "",
      city: "",
      allocation: "",
      reminderDate: "",
      priority: "Medium",
      lastContact: "",
      updateHistory: [],
      portfolio: [],
    },
  ];

  test("generateDailyAdvisorBrief produces grounded claims matching deterministic inputs", () => {
    const brief = generateDailyAdvisorBrief({
      actions,
      opportunities,
      clients,
      asOfDate,
    });

    expect(brief.openCriticalAlerts).toBe(1);
    expect(brief.openHighPriorityTasks).toBe(2); // 1 URGENT + 1 HIGH
    expect(brief.goalWarnings).toBe(1);
    expect(brief.taxOpportunities).toBe(1);

    // Verify Grounded Metric Claims
    expect(brief.groundedClaims).toHaveLength(5);
    const criticalClaim = brief.groundedClaims.find(
      (c) => c.sourceMetric === "advisor.openCriticalAlerts"
    );
    expect(criticalClaim).toBeDefined();
    expect(criticalClaim?.value).toBe(1);
    expect(criticalClaim?.methodologyVersion).toBe(DAILY_BRIEF_METHODOLOGY_VERSION);

    const taxClaim = brief.groundedClaims.find(
      (c) => c.sourceMetric === "advisor.taxOpportunities"
    );
    expect(taxClaim?.value).toBe(1);

    // Headline mentions the 1 critical alert
    expect(brief.headline).toContain("1 Critical Alert");
  });
});
