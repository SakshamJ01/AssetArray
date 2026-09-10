export type SupportedLocale =
  | "en"
  | "hi"
  | "ar"
  | "es"
  | "fr"
  | "de"
  | "zh";

export interface LocaleConfig {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  direction: "ltr" | "rtl";
  dateFormat: {
    short: string;
    long: string;
    time: string;
  };
  numberFormat: {
    decimal: string;
    group: string;
    currencyPattern: string;
  };
  firstDayOfWeek: 0 | 1 | 6;
}

export const LOCALE_REGISTRY: Record<SupportedLocale, LocaleConfig> = {
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    direction: "ltr",
    dateFormat: { short: "MM/dd/yyyy", long: "MMMM d, yyyy", time: "h:mm a" },
    numberFormat: { decimal: ".", group: ",", currencyPattern: "$#,##0.00" },
    firstDayOfWeek: 0,
  },
  hi: {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    direction: "ltr",
    dateFormat: { short: "dd/MM/yyyy", long: "d MMMM, yyyy", time: "h:mm a" },
    numberFormat: { decimal: ".", group: ",", currencyPattern: "₹#,##0.00" },
    firstDayOfWeek: 0,
  },
  ar: {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    direction: "rtl",
    dateFormat: { short: "dd/MM/yyyy", long: "d MMMM, yyyy", time: "h:mm a" },
    numberFormat: { decimal: ".", group: ",", currencyPattern: "د.إ#,##0.00" },
    firstDayOfWeek: 6,
  },
  es: {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    direction: "ltr",
    dateFormat: { short: "dd/MM/yyyy", long: "d 'de' MMMM 'de' yyyy", time: "H:mm" },
    numberFormat: { decimal: ",", group: ".", currencyPattern: "$#,##0.00" },
    firstDayOfWeek: 1,
  },
  fr: {
    code: "fr",
    name: "French",
    nativeName: "Français",
    direction: "ltr",
    dateFormat: { short: "dd/MM/yyyy", long: "d MMMM yyyy", time: "HH:mm" },
    numberFormat: { decimal: ",", group: " ", currencyPattern: "#,##0.00 €" },
    firstDayOfWeek: 1,
  },
  de: {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    direction: "ltr",
    dateFormat: { short: "dd.MM.yyyy", long: "d. MMMM yyyy", time: "HH:mm" },
    numberFormat: { decimal: ",", group: ".", currencyPattern: "#,##0.00 €" },
    firstDayOfWeek: 1,
  },
  zh: {
    code: "zh",
    name: "Chinese (Simplified)",
    nativeName: "中文 (简体)",
    direction: "ltr",
    dateFormat: { short: "yyyy/M/d", long: "yyyy年M月d日", time: "HH:mm" },
    numberFormat: { decimal: ".", group: ",", currencyPattern: "¥#,##0.00" },
    firstDayOfWeek: 1,
  },
};

export const DEFAULT_LOCALE: SupportedLocale = "en";
export const STORAGE_KEY = "@asset_array_locale";

export function isRTL(locale: SupportedLocale): boolean {
  return LOCALE_REGISTRY[locale].direction === "rtl";
}

export function getLocaleConfig(locale: SupportedLocale): LocaleConfig {
  return LOCALE_REGISTRY[locale] || LOCALE_REGISTRY.en;
}

export function getSupportedLocales(): LocaleConfig[] {
  return Object.values(LOCALE_REGISTRY);
}