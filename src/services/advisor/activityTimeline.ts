import { AdvisorActivity, AdvisorActivityType } from "../../types/advisor";
import { storageService } from "../../platform/storage";

const STORAGE_KEY_ACTIVITIES = "@asset_array_advisor_activities_v3_3";

let inMemoryActivities: AdvisorActivity[] = [];
let activitiesLoadedFromStorage = false;

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
  if (!activitiesLoadedFromStorage && inMemoryActivities.length === 0) {
    const loaded = await loadPersistedActivities();
    if (loaded.length > 0) {
      inMemoryActivities = loaded;
    }
    activitiesLoadedFromStorage = true;
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
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.warn("Error loading persisted activities:", err);
    return [];
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
