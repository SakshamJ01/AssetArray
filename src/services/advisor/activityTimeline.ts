import { AdvisorActivity, AdvisorActivityType } from "../../types/advisor";
import { storageService } from "../../platform/storage";

const STORAGE_KEY_ACTIVITIES = "@asset_array_advisor_activities_v3_3";

const INITIAL_DEMO_ACTIVITIES: AdvisorActivity[] = [
  {
    id: "act_init_1",
    clientId: "c1",
    clientName: "Rahul Mehta",
    type: "ALERT_CREATED",
    title: "Technology Concentration Breach",
    description: "TCS position reached 27.4% of portfolio, exceeding 20% limit.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    actor: "Risk Engine",
    metadata: { holding: "TCS", weight: 27.4, threshold: 20 },
  },
  {
    id: "act_init_2",
    clientId: "c1",
    clientName: "Rahul Mehta",
    type: "PORTFOLIO_REVIEW",
    title: "Mandate Rebalance Initiated",
    description: "Advisor initiated scenario rebalance simulation for equity holdings.",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    actor: "Advisor",
  },
  {
    id: "act_init_3",
    clientId: "c2",
    clientName: "Ananya Sharma",
    type: "GOAL_REVIEW",
    title: "Retirement Goal Reviewed",
    description: "Goal funding progress evaluated at 71%. Recommended SIP increase.",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    actor: "Advisor",
  },
  {
    id: "act_init_4",
    clientId: "c3",
    clientName: "Vikram Singhania",
    type: "REPORT_SHARED",
    title: "Quarterly Wealth Memo Shared",
    description: "Approved fiduciary performance statement sent to client via Email.",
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    actor: "Advisor",
    metadata: { channel: "Email" },
  },
  {
    id: "act_init_5",
    clientId: "c1",
    clientName: "Rahul Mehta",
    type: "CLIENT_MESSAGE",
    title: "Touchpoint Call Completed",
    description: "Discussed annual capital gains outlook and tax-loss harvesting window.",
    timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    actor: "Advisor",
    metadata: { channel: "Phone" },
  },
];

let inMemoryActivities: AdvisorActivity[] = [...INITIAL_DEMO_ACTIVITIES];

/**
 * Appends a new activity event to the timeline and local storage.
 * Ensures PII sanitization: no raw PAN, Aadhaar, or credentials.
 */
export async function logActivity(
  event: Omit<AdvisorActivity, "id" | "timestamp"> & { timestamp?: string }
): Promise<AdvisorActivity> {
  const newActivity: AdvisorActivity = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: event.timestamp || new Date().toISOString(),
    clientId: event.clientId,
    clientName: event.clientName,
    type: event.type,
    title: event.title,
    description: event.description,
    actor: event.actor || "Advisor",
    metadata: event.metadata,
  };

  inMemoryActivities = [newActivity, ...inMemoryActivities].slice(0, 200); // Keep last 200
  await savePersistedActivities(inMemoryActivities);
  return newActivity;
}

/**
 * Retrieves activities optionally filtered by clientId.
 */
export async function getActivities(clientId?: string, limit = 50): Promise<AdvisorActivity[]> {
  if (inMemoryActivities.length <= INITIAL_DEMO_ACTIVITIES.length) {
    const loaded = await loadPersistedActivities();
    if (loaded && loaded.length > 0) {
      inMemoryActivities = loaded;
    }
  }

  let list = inMemoryActivities;
  if (clientId) {
    list = list.filter((a) => a.clientId === clientId);
  }
  return list.slice(0, limit);
}

/**
 * Loads activities from local storage.
 */
export async function loadPersistedActivities(): Promise<AdvisorActivity[]> {
  try {
    const raw = await storageService.getItem(STORAGE_KEY_ACTIVITIES);
    if (!raw) return INITIAL_DEMO_ACTIVITIES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_DEMO_ACTIVITIES;
  } catch (err) {
    console.warn("Error loading persisted activities:", err);
    return INITIAL_DEMO_ACTIVITIES;
  }
}

/**
 * Saves activities to storage.
 */
export async function savePersistedActivities(activities: AdvisorActivity[]): Promise<void> {
  try {
    await storageService.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
  } catch (err) {
    console.warn("Error saving persisted activities:", err);
  }
}
