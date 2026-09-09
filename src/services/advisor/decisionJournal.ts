import { AdvisorDecision } from "../../types/advisor";
import { storageService } from "../../platform/storage";
import { logActivity } from "./activityTimeline";

const STORAGE_KEY_DECISIONS = "@asset_array_advisor_decisions_v3_3";

let inMemoryDecisions: AdvisorDecision[] = [];
let decisionsLoadedFromStorage = false;

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
  if (!decisionsLoadedFromStorage && inMemoryDecisions.length === 0) {
    const loaded = await loadPersistedDecisions();
    if (loaded.length > 0) {
      inMemoryDecisions = loaded;
    }
    decisionsLoadedFromStorage = true;
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
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.warn("Error loading persisted decisions:", err);
    return [];
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
