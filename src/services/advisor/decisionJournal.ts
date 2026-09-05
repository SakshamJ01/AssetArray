import { AdvisorDecision } from "../../types/advisor";
import { storageService } from "../../platform/storage";
import { logActivity } from "./activityTimeline";

const STORAGE_KEY_DECISIONS = "@asset_array_advisor_decisions_v3_3";

const INITIAL_DEMO_DECISIONS: AdvisorDecision[] = [
  {
    id: "dec_demo_1",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    clientId: "c1",
    clientName: "Rahul Mehta",
    portfolioId: "port_c1",
    issue: "Technology concentration: TCS reached 27.4% of portfolio",
    evidence: "Risk Engine concentration diagnostic: limit 20.0%, current 27.4%",
    decision: "Staged reduction: Rebalance 7.4% from TCS to Nifty 50 Index Fund over 30 days",
    rationale: "Mitigate single-stock drawdown risk while preserving overall large-cap equity exposure",
    advisorFollowUp: "Review execution progress on September 15",
    status: "RECORDED",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "dec_demo_2",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    clientId: "c2",
    clientName: "Ananya Sharma",
    portfolioId: "port_c2",
    issue: "Tax loss harvesting opportunity: ₹1.2L harvestable losses",
    evidence: "Tax Intelligence Engine Section 70/74 harvestable loss report",
    decision: "Book ₹85,000 short-term losses in underperforming mid-cap lot to offset realized gains",
    rationale: "Maximize current-year tax shield prior to financial year-end",
    advisorFollowUp: "Send updated capital gains realization statement to client CA",
    status: "EXECUTED",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

let inMemoryDecisions: AdvisorDecision[] = [...INITIAL_DEMO_DECISIONS];

/**
 * Records an advisor decision in the fiduciary decision journal.
 * Automatically appends to the client activity timeline.
 */
export async function recordDecision(
  params: Omit<AdvisorDecision, "id" | "createdAt" | "status"> & {
    status?: AdvisorDecision["status"];
  }
): Promise<AdvisorDecision> {
  const now = new Date().toISOString();
  const decision: AdvisorDecision = {
    id: `dec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now,
    status: params.status || "RECORDED",
    ...params,
  };

  inMemoryDecisions = [decision, ...inMemoryDecisions];
  await savePersistedDecisions(inMemoryDecisions);

  // Automatically log an activity event for the audit trail
  await logActivity({
    clientId: decision.clientId,
    clientName: decision.clientName,
    type: "DECISION_LOGGED",
    title: `Decision Logged: ${decision.issue.substring(0, 40)}...`,
    description: `Decision: ${decision.decision}. Rationale: ${decision.rationale}`,
    actor: "Advisor",
    metadata: {
      decisionId: decision.id,
      issue: decision.issue,
      evidence: decision.evidence,
    },
  });

  return decision;
}

/**
 * Retrieves recorded decisions, optionally filtered by clientId.
 */
export async function getDecisions(clientId?: string): Promise<AdvisorDecision[]> {
  if (inMemoryDecisions.length <= INITIAL_DEMO_DECISIONS.length) {
    const loaded = await loadPersistedDecisions();
    if (loaded && loaded.length > 0) {
      inMemoryDecisions = loaded;
    }
  }

  if (clientId) {
    return inMemoryDecisions.filter((d) => d.clientId === clientId);
  }
  return inMemoryDecisions;
}

/**
 * Loads decisions from storage.
 */
export async function loadPersistedDecisions(): Promise<AdvisorDecision[]> {
  try {
    const raw = await storageService.getItem(STORAGE_KEY_DECISIONS);
    if (!raw) return INITIAL_DEMO_DECISIONS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_DEMO_DECISIONS;
  } catch (err) {
    console.warn("Error loading persisted decisions:", err);
    return INITIAL_DEMO_DECISIONS;
  }
}

/**
 * Saves decisions to storage.
 */
export async function savePersistedDecisions(decisions: AdvisorDecision[]): Promise<void> {
  try {
    await storageService.setItem(STORAGE_KEY_DECISIONS, JSON.stringify(decisions));
  } catch (err) {
    console.warn("Error saving persisted decisions:", err);
  }
}
