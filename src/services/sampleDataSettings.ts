import { storageService } from "../platform/storage";

const SAMPLE_DATA_STORAGE_KEY = "asset_array_show_sample_data";

type SampleDataChangeListener = (enabled: boolean) => void;
const listeners = new Set<SampleDataChangeListener>();

// Memory fallback to ensure instant synchronous initial read after first load
let cachedShowSampleData = true;
let isInitialized = false;

export async function getShowSampleDataSetting(): Promise<boolean> {
  try {
    const raw = await storageService.getItem(SAMPLE_DATA_STORAGE_KEY);
    if (raw === null) {
      cachedShowSampleData = true; // default to true for interactive testing
    } else {
      cachedShowSampleData = raw === "true";
    }
    isInitialized = true;
    return cachedShowSampleData;
  } catch {
    return cachedShowSampleData;
  }
}

export function getCachedShowSampleDataSetting(): boolean {
  return cachedShowSampleData;
}

export async function setShowSampleDataSetting(enabled: boolean): Promise<void> {
  cachedShowSampleData = enabled;
  isInitialized = true;
  try {
    await storageService.setItem(SAMPLE_DATA_STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    // Memory cache persists for runtime session
  }
  listeners.forEach((listener) => {
    try {
      listener(enabled);
    } catch {}
  });
}

export function subscribeToShowSampleData(listener: SampleDataChangeListener): () => void {
  listeners.add(listener);
  if (!isInitialized) {
    void getShowSampleDataSetting().then((val) => listener(val));
  } else {
    listener(cachedShowSampleData);
  }
  return () => {
    listeners.delete(listener);
  };
}
