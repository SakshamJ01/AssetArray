import {
  AdvisorAction,
  AdvisorActionStatus,
  AdvisorOpportunity,
  OpportunityType,
} from "../../types/advisor";
import { Client, Goal, SmartAlert } from "../../types/wealth";
import { calculatePriorityScore, sortActionsByPriority } from "./prioritization";
import { storageService } from "../../platform/storage";

export const ACTION_ENGINE_VERSION = "aa-action-engine-v3.3";
const STORAGE_KEY_ACTIONS = "@asset_array_advisor_actions_v3_3";

export interface ScanWorkflowParams {
  clients: Client[];
  activeAlerts?: SmartAlert[];
  goals?: Goal[];
  persistedActions?: AdvisorAction[];
  asOfDate?: string;
}

/**
 * Builds canonical key for exact deduplication across engine runs.
 * Prevents multiple cards for the same underlying fiduciary condition.
 */
export function buildCanonicalKey(
  clientId: string,
  sourceType: string,
  sourceId: string,
  actionType: string
): string {
  return `${clientId}:${sourceType}:${sourceId}:${actionType}`;
}

/**
 * Scans all client portfolios, active alerts, review reminders, and goal milestones
 * to construct the consolidated, deduplicated Advisor Action Queue.
 */
export function scanAdvisorActions(params: ScanWorkflowParams): AdvisorAction[] {
  const {
    clients,
    activeAlerts = [],
    goals = [],
    persistedActions = [],
    asOfDate = new Date().toISOString(),
  } = params;

  const todayStr = asOfDate.split("T")[0];
  const nowMs = new Date(asOfDate).getTime();
  const generatedActions: AdvisorAction[] = [];

  // Map persisted actions by canonicalKey for state reconciliation
  const persistedMap = new Map<string, AdvisorAction>();
  persistedActions.forEach((a) => {
    if (a.canonicalKey) persistedMap.set(a.canonicalKey, a);
  });

  // Client lookup
  const clientMap = new Map<string, Client>();
  clients.forEach((c) => clientMap.set(c.id, c));

  // 1. Process Smart Alerts into Traceable Actions
  activeAlerts.forEach((alert) => {
    const client = alert.clientId ? clientMap.get(alert.clientId) : undefined;
    const clientName = client?.name || alert.clientName || "Private Client";
    const clientId = alert.clientId || "unknown";
    const isCritical = String(alert.severity).toLowerCase() === "critical";

    let actionType: AdvisorAction["type"] = "ALERT_REVIEW";
    let sourceEngine: AdvisorAction["sourceEngine"] = "risk";
    let reason = "Portfolio parameter breached institutional policy threshold.";
    let recommendedNextStep = "Review portfolio metrics and assess rebalancing options.";
    let deepLinkTab: AdvisorAction["deepLink"]["tab"] = "Portfolios";
    let deepLinkScreen = "Risk";

    switch (alert.condition) {
      case "CONCENTRATION_BREACH":
        actionType = "REBALANCE_REVIEW";
        sourceEngine = "risk";
        reason = `Single-asset concentration exceeds risk guidelines. Reduces portfolio diversification.`;
        recommendedNextStep = `Model reallocation in Scenario Sandbox or reduce position to policy target.`;
        deepLinkTab = "Portfolios";
        deepLinkScreen = "Concentration";
        break;

      case "HEALTH_SCORE_DROP":
        actionType = "PORTFOLIO_REVIEW";
        sourceEngine = "health";
        reason = `Overall portfolio composite health score has degraded below benchmark standards.`;
        recommendedNextStep = `Inspect health diagnostics to address asset-allocation drift or risk drag.`;
        deepLinkTab = "Portfolios";
        deepLinkScreen = "Health";
        break;

      case "TAX_HARVEST_WINDOW":
        actionType = "TAX_REVIEW";
        sourceEngine = "tax";
        reason = `Unrealized capital losses are available to offset realized taxable gains under Section 70/74.`;
        recommendedNextStep = `Execute tax-loss harvesting run before financial year-end.`;
        deepLinkTab = "Portfolios";
        deepLinkScreen = "Tax";
        break;

      case "DRAWDOWN_EVENT":
        actionType = "PORTFOLIO_REVIEW";
        sourceEngine = "risk";
        reason = `Portfolio has experienced significant peak-to-trough drawdown exceeding threshold.`;
        recommendedNextStep = `Conduct defensive mandate review and communicate risk mitigation to client.`;
        deepLinkTab = "Portfolios";
        deepLinkScreen = "Drawdown";
        break;

      case "REBALANCE_DRIFT":
        actionType = "REBALANCE_REVIEW";
        sourceEngine = "risk";
        reason = `Asset category has drifted from strategic asset allocation target weight.`;
        recommendedNextStep = `Execute target weight rebalancing order schedule.`;
        deepLinkTab = "Portfolios";
        deepLinkScreen = "Rebalancer";
        break;

      default:
        break;
    }

    const canonicalKey = buildCanonicalKey(clientId, "smart_alert", alert.id, actionType);

    // Calculate priority
    const portfolioVal = client?.portfolio?.reduce(
      (sum, h) => sum + (Number(h.currentValue) || 0),
      0
    ) || 0;

    const prioResult = calculatePriorityScore({
      severity: isCritical ? "critical" : "warning",
      clientCategory: client?.category,
      clientPriority: client?.priority,
      portfolioValue: portfolioVal,
      financialImpactValue: typeof alert.observedValue === "number" ? alert.observedValue : portfolioVal,
      financialImpactMetric: typeof alert.metric === "string" && alert.metric.includes("Pct") ? "PERCENT" : "AMOUNT",
      dueDate: todayStr,
      asOfDate,
      hasVerifiedData: true,
    });

    const action: AdvisorAction = {
      id: `act_alert_${alert.id}`,
      canonicalKey,
      clientId,
      clientName,
      portfolioId: alert.portfolioId || (client ? `port_${client.id}` : undefined),
      type: actionType,
      priority: prioResult.priority,
      priorityScore: prioResult.score,
      priorityFactors: prioResult.factors,
      severity: isCritical ? "critical" : "warning",
      title: alert.title,
      description: alert.message,
      reason,
      evidence: {
        metric: alert.metric || "Diagnostic",
        observedValue: alert.observedValue ?? "Breached",
        threshold: alert.threshold,
        unit: typeof alert.metric === "string" && alert.metric.includes("Pct") ? "%" : undefined,
      },
      createdAt: alert.timestamp || alert.createdAt || asOfDate,
      dueAt: todayStr,
      status: "OPEN",
      sourceEngine,
      sourceMetric: alert.metric,
      sourceValue: alert.observedValue,
      sourceThreshold: alert.threshold,
      recommendedNextStep,
      deepLink: {
        tab: deepLinkTab,
        screen: deepLinkScreen,
        params: { clientId, alertId: alert.id },
        actionLabel: actionType === "TAX_REVIEW" ? "Review Tax Loss" : "Review Portfolio",
      },
    };

    generatedActions.push(action);
  });

  // 2. Process Client Reminders & Mandate Touchpoints
  clients.forEach((c) => {
    const portfolioVal = c.portfolio?.reduce(
      (sum, h) => sum + (Number(h.currentValue) || 0),
      0
    ) || 0;

    // Follow-up reminder due
    if (c.reminderDate) {
      const isOverdue = c.reminderDate < todayStr;
      const isDueToday = c.reminderDate === todayStr;

      if (isOverdue || isDueToday) {
        const canonicalKey = buildCanonicalKey(c.id, "reminder", c.reminderDate, "CLIENT_FOLLOWUP");
        const prioResult = calculatePriorityScore({
          severity: isOverdue ? "warning" : "info",
          clientCategory: c.category,
          clientPriority: c.priority,
          portfolioValue: portfolioVal,
          dueDate: c.reminderDate,
          asOfDate,
        });

        generatedActions.push({
          id: `act_rem_${c.id}_${c.reminderDate}`,
          canonicalKey,
          clientId: c.id,
          clientName: c.name,
          portfolioId: `port_${c.id}`,
          type: "CLIENT_FOLLOWUP",
          priority: isOverdue ? "HIGH" : "MEDIUM",
          priorityScore: prioResult.score,
          priorityFactors: prioResult.factors,
          severity: isOverdue ? "warning" : "info",
          title: `Scheduled Follow-up: ${c.name}`,
          description: `Mandated touchpoint due via ${c.preferredChannel || "Phone"}. Notes: ${c.notes || "None"}.`,
          reason: isOverdue
            ? `Client follow-up is overdue since ${c.reminderDate}. Delays impact client retention.`
            : `Client follow-up is scheduled for today.`,
          evidence: {
            metric: "ReminderDate",
            observedValue: c.reminderDate,
            threshold: todayStr,
            notes: `Channel: ${c.preferredChannel || "Phone"}`,
          },
          createdAt: asOfDate,
          dueAt: c.reminderDate,
          status: "OPEN",
          sourceEngine: "reminders",
          recommendedNextStep: `Initiate contact via ${c.preferredChannel || "Phone"} and log interaction.`,
          deepLink: {
            tab: "Clients",
            screen: "Profile",
            params: { clientId: c.id },
            actionLabel: "Open Client",
          },
        });
      }
    }

    // High-priority client periodic mandate review
    if (c.priority === "High") {
      const canonicalKey = buildCanonicalKey(c.id, "mandate", "quarterly", "PORTFOLIO_REVIEW");
      const prioResult = calculatePriorityScore({
        severity: "warning",
        clientCategory: c.category,
        clientPriority: "High",
        portfolioValue: portfolioVal,
        dueDate: todayStr,
        asOfDate,
      });

      generatedActions.push({
        id: `act_mandate_${c.id}`,
        canonicalKey,
        clientId: c.id,
        clientName: c.name,
        portfolioId: `port_${c.id}`,
        type: "PORTFOLIO_REVIEW",
        priority: "HIGH",
        priorityScore: prioResult.score,
        priorityFactors: prioResult.factors,
        severity: "warning",
        title: `Tier-1 Mandate Review: ${c.name}`,
        description: `High-priority HNI client requires formal portfolio audit and performance reconciliation.`,
        reason: `HNI portfolios require active risk surveillance and quarterly fiduciary rebalancing.`,
        evidence: {
          metric: "ClientCategory",
          observedValue: c.category,
          threshold: "HNI / High Priority",
          notes: `AUM: ₹${Math.round(portfolioVal).toLocaleString("en-IN")}`,
        },
        createdAt: asOfDate,
        dueAt: todayStr,
        status: "OPEN",
        sourceEngine: "health",
        recommendedNextStep: `Review asset allocation, risk exposure, and generate performance summary.`,
        deepLink: {
          tab: "Portfolios",
          screen: "Overview",
          params: { clientId: c.id },
          actionLabel: "Review Mandate",
        },
      });
    }

    // Check Data Quality flaws (Missing acquisition dates or zero cost basis)
    let missingCostBasisCount = 0;
    let missingDateCount = 0;
    (c.portfolio || []).forEach((h) => {
      if (!h.investedValue || Number(h.investedValue) <= 0) missingCostBasisCount++;
      if (!h.acquisitionDate && !h.acquiredAt) missingDateCount++;
    });

    if (missingCostBasisCount > 0 || missingDateCount > 0) {
      const canonicalKey = buildCanonicalKey(c.id, "data_quality", "lots", "DATA_QUALITY");
      const prioResult = calculatePriorityScore({
        severity: "warning",
        clientCategory: c.category,
        clientPriority: c.priority,
        portfolioValue: portfolioVal,
        dueDate: todayStr,
        asOfDate,
        hasVerifiedData: false,
      });

      generatedActions.push({
        id: `act_dq_${c.id}`,
        canonicalKey,
        clientId: c.id,
        clientName: c.name,
        portfolioId: `port_${c.id}`,
        type: "DATA_QUALITY",
        priority: "MEDIUM",
        priorityScore: prioResult.score,
        priorityFactors: prioResult.factors,
        severity: "warning",
        title: `Data Quality Alert: ${c.name}`,
        description: `${missingDateCount} holdings missing acquisition dates, ${missingCostBasisCount} missing cost basis.`,
        reason: `Incomplete tax lot data prevents exact capital gains calculation and tax harvesting verification.`,
        evidence: {
          metric: "MissingLotDataCount",
          observedValue: missingCostBasisCount + missingDateCount,
          threshold: 0,
          notes: `${missingDateCount} missing dates, ${missingCostBasisCount} missing costs`,
        },
        createdAt: asOfDate,
        dueAt: todayStr,
        status: "OPEN",
        sourceEngine: "data_quality",
        recommendedNextStep: `Update acquisition dates and purchase prices from broker statement.`,
        deepLink: {
          tab: "Portfolios",
          screen: "Holdings",
          params: { clientId: c.id },
          actionLabel: "Verify Tax Lots",
        },
      });
    }
  });

  // 3. Process Goal Deficits & Milestones
  goals.forEach((g) => {
    const cur = parseFloat(g.currentAmount) || 0;
    const tgt = parseFloat(g.targetAmount) || 1;
    const fundedPct = (cur / tgt) * 100;

    if (fundedPct < 40) {
      const client = g.clientId ? clientMap.get(g.clientId) : undefined;
      const clientName = client?.name || "Client Milestone";
      const clientId = g.clientId || "goal_client";

      const canonicalKey = buildCanonicalKey(clientId, "goal", g.id, "GOAL_REVIEW");
      const prioResult = calculatePriorityScore({
        severity: fundedPct < 25 ? "warning" : "info",
        clientCategory: client?.category,
        clientPriority: client?.priority,
        financialImpactValue: tgt - cur,
        financialImpactMetric: "AMOUNT",
        dueDate: todayStr,
        asOfDate,
      });

      generatedActions.push({
        id: `act_goal_${g.id}`,
        canonicalKey,
        clientId,
        clientName,
        type: "GOAL_REVIEW",
        priority: g.priority === "Core" ? "HIGH" : "MEDIUM",
        priorityScore: prioResult.score,
        priorityFactors: prioResult.factors,
        severity: fundedPct < 25 ? "warning" : "info",
        title: `Goal Deficit: ${g.title || "Target Milestone"}`,
        description: `Goal is only ${fundedPct.toFixed(1)}% funded (Target: ₹${tgt.toLocaleString("en-IN")}). Shortfall: ₹${Math.round(tgt - cur).toLocaleString("en-IN")}.`,
        reason: `Material funding lag reduces probability of goal achievement on targeted horizon (${g.targetYear}).`,
        evidence: {
          metric: "GoalFundingPct",
          observedValue: parseFloat(fundedPct.toFixed(1)),
          threshold: 40,
          unit: "%",
          notes: `Deficit: ₹${Math.round(tgt - cur).toLocaleString("en-IN")}`,
        },
        createdAt: asOfDate,
        dueAt: todayStr,
        status: "OPEN",
        sourceEngine: "goals",
        recommendedNextStep: `Model SIP increase or asset reallocation in Goal Planner.`,
        deepLink: {
          tab: "Tools",
          screen: "Goal Planner",
          params: { clientId, goalId: g.id },
          actionLabel: "Review Goal",
        },
      });
    }
  });

  // Deduplicate and Reconcile with Persisted State
  const reconciledMap = new Map<string, AdvisorAction>();

  generatedActions.forEach((gen) => {
    const existing = persistedMap.get(gen.canonicalKey);
    if (existing) {
      // Check if snoozed
      let status = existing.status;
      if (status === "SNOOZED" && existing.snoozedUntil) {
        if (new Date(existing.snoozedUntil).getTime() <= nowMs) {
          status = "OPEN"; // Snooze window expired
        }
      }

      reconciledMap.set(gen.canonicalKey, {
        ...gen,
        id: existing.id,
        status,
        notes: existing.notes || gen.notes,
        completedAt: existing.completedAt,
        snoozedUntil: existing.snoozedUntil,
      });
    } else {
      reconciledMap.set(gen.canonicalKey, gen);
    }
  });

  // Include user-created manual tasks from persisted actions
  persistedActions.forEach((p) => {
    if (p.sourceEngine === "reminders" && !reconciledMap.has(p.canonicalKey)) {
      reconciledMap.set(p.canonicalKey, p);
    }
  });

  const allActions = Array.from(reconciledMap.values());
  return sortActionsByPriority(allActions);
}

/**
 * Transitions an action through the lifecycle:
 * OPEN -> IN_PROGRESS -> WAITING -> DONE / CANCELLED / SNOOZED
 */
export function transitionActionStatus(
  action: AdvisorAction,
  nextStatus: AdvisorActionStatus,
  notes?: string
): AdvisorAction {
  const now = new Date().toISOString();
  return {
    ...action,
    status: nextStatus,
    notes: notes ? (action.notes ? `${action.notes} | ${notes}` : notes) : action.notes,
    completedAt: nextStatus === "DONE" ? now : action.completedAt,
  };
}

/**
 * Snoozes an action for a given number of hours.
 */
export function snoozeAction(action: AdvisorAction, hours = 24): AdvisorAction {
  const snoozedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  return {
    ...action,
    status: "SNOOZED",
    snoozedUntil,
  };
}

/**
 * Extracts positive wealth opportunities from the action queue and client portfolios.
 */
export function extractOpportunitiesFromActions(
  actions: AdvisorAction[],
  clients: Client[]
): AdvisorOpportunity[] {
  const opportunities: AdvisorOpportunity[] = [];

  // 1. Tax loss opportunities from TAX_REVIEW actions
  actions
    .filter((a) => a.type === "TAX_REVIEW" && a.status !== "DONE" && a.status !== "CANCELLED")
    .forEach((a) => {
      opportunities.push({
        id: `opp_tax_${a.id}`,
        canonicalKey: `opp:${a.canonicalKey}`,
        clientId: a.clientId,
        clientName: a.clientName,
        portfolioId: a.portfolioId,
        type: "TAX_HARVESTING",
        title: `Capital Loss Harvesting: ${a.clientName}`,
        description: a.description,
        potentialBenefit: `Reduce statutory tax liability by offsetting against realized capital gains.`,
        estimatedFinancialValue: typeof a.sourceValue === "number" ? a.sourceValue : 50000,
        evidence: a.evidence,
        recommendedAction: `Harvest identified loss lots before fiscal year-end.`,
        deepLink: a.deepLink,
        createdAt: a.createdAt,
        priorityScore: a.priorityScore,
      });
    });

  // 2. Allocation rebalancing drift
  actions
    .filter((a) => a.type === "REBALANCE_REVIEW" && a.status !== "DONE" && a.status !== "CANCELLED")
    .forEach((a) => {
      opportunities.push({
        id: `opp_rebal_${a.id}`,
        canonicalKey: `opp:${a.canonicalKey}`,
        clientId: a.clientId,
        clientName: a.clientName,
        portfolioId: a.portfolioId,
        type: "REBALANCING_DRIFT",
        title: `Asset Allocation Alignment: ${a.clientName}`,
        description: a.description,
        potentialBenefit: `Restore optimal risk-adjusted return profile by trimming overweight assets.`,
        evidence: a.evidence,
        recommendedAction: `Execute rebalancing schedule in Rebalancer.`,
        deepLink: a.deepLink,
        createdAt: a.createdAt,
        priorityScore: a.priorityScore,
      });
    });

  // 3. Goal catch-up funding
  actions
    .filter((a) => a.type === "GOAL_REVIEW" && a.status !== "DONE" && a.status !== "CANCELLED")
    .forEach((a) => {
      opportunities.push({
        id: `opp_goal_${a.id}`,
        canonicalKey: `opp:${a.canonicalKey}`,
        clientId: a.clientId,
        clientName: a.clientName,
        type: "GOAL_CATCH_UP",
        title: `Goal SIP Acceleration: ${a.clientName}`,
        description: a.description,
        potentialBenefit: `Increase funding probability from degraded level back to target success threshold.`,
        evidence: a.evidence,
        recommendedAction: `Increase monthly SIP contribution by 15-20%.`,
        deepLink: a.deepLink,
        createdAt: a.createdAt,
        priorityScore: a.priorityScore,
      });
    });

  // 4. Excess cash drag detection across clients
  clients.forEach((c) => {
    const holdings = c.portfolio || [];
    const totalVal = holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
    const cashVal = holdings
      .filter((h) => h.assetClass === "Cash" || (h.assetName || "").toLowerCase().includes("liquid"))
      .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

    if (totalVal > 0 && cashVal / totalVal > 0.25) {
      const cashPct = (cashVal / totalVal) * 100;
      opportunities.push({
        id: `opp_cash_${c.id}`,
        canonicalKey: `opp:cash:${c.id}`,
        clientId: c.id,
        clientName: c.name,
        portfolioId: `port_${c.id}`,
        type: "IDLE_CASH_DRAG",
        title: `Excess Cash Deployment: ${c.name}`,
        description: `${cashPct.toFixed(1)}% (₹${Math.round(cashVal).toLocaleString("en-IN")}) held in cash or liquid funds.`,
        potentialBenefit: `Deploy idle cash into yielding debt or equity SIPs to eliminate inflation drag.`,
        estimatedFinancialValue: Math.round(cashVal * 0.05), // Estimated 5% excess yield
        evidence: {
          metric: "CashAllocationPct",
          observedValue: parseFloat(cashPct.toFixed(1)),
          threshold: 25,
          unit: "%",
        },
        recommendedAction: `Propose staged deployment (STP) into target equity/debt mandate.`,
        deepLink: {
          tab: "Portfolios",
          screen: "Rebalancer",
          params: { clientId: c.id },
          actionLabel: "Deploy Cash",
        },
        createdAt: new Date().toISOString(),
        priorityScore: 65,
      });
    }
  });

  return opportunities.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Loads persisted actions from local storage.
 */
export async function loadPersistedActions(): Promise<AdvisorAction[]> {
  try {
    const raw = await storageService.getItem(STORAGE_KEY_ACTIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Error loading persisted advisor actions:", err);
    return [];
  }
}

/**
 * Saves actions to local storage.
 */
export async function savePersistedActions(actions: AdvisorAction[]): Promise<void> {
  try {
    await storageService.setItem(STORAGE_KEY_ACTIONS, JSON.stringify(actions));
  } catch (err) {
    console.warn("Error saving persisted advisor actions:", err);
  }
}
