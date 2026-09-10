import AsyncStorage from "@react-native-async-storage/async-storage";
import { SupportedLocale, DEFAULT_LOCALE, STORAGE_KEY } from "./locale";
import en from "./translations/en.json";
import hi from "./translations/hi.json";
import ar from "./translations/ar.json";
import es from "./translations/es.json";
import fr from "./translations/fr.json";
import de from "./translations/de.json";
import zh from "./translations/zh.json";

const dictionaries: Record<SupportedLocale, Record<string, any>> = {
  en,
  hi,
  ar,
  es,
  fr,
  de,
  zh,
};

let currentLocale: SupportedLocale = DEFAULT_LOCALE;

export async function initI18n(): Promise<SupportedLocale> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved && saved in dictionaries) {
      currentLocale = saved as SupportedLocale;
    }
  } catch {
    // Fallback
  }
  return currentLocale;
}

export async function setLocale(locale: SupportedLocale): Promise<void> {
  if (locale in dictionaries) {
    currentLocale = locale;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Ignore
    }
  }
}

export function getCurrentLocale(): SupportedLocale {
  return currentLocale;
}

function getNestedValue(obj: any, path: string): string | undefined {
  const parts = path.split(".");
  let curr = obj;
  for (const p of parts) {
    if (curr && typeof curr === "object" && p in curr) {
      curr = curr[p];
    } else {
      return undefined;
    }
  }
  return typeof curr === "string" ? curr : undefined;
}

export function t(key: string, params?: Record<string, string | number>): string {
  let text = getNestedValue(dictionaries[currentLocale], key);
  
  // Fallback to English if not found in current locale
  if (text === undefined && currentLocale !== "en") {
    text = getNestedValue(dictionaries.en, key);
  }

  // Fallback to key itself if not found anywhere
  if (text === undefined) {
    return key;
  }

  // Interpolate parameters if provided
  if (params) {
    for (const [paramKey, paramVal] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, "g"), String(paramVal));
    }
  }

  return text;
}