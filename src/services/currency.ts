import AsyncStorage from "@react-native-async-storage/async-storage";

export type CurrencyCode = "USD" | "INR" | "EUR" | "GBP" | "AED" | "SGD";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  fxRateFromUSD: number; // 1 USD = X Currency
  flag: string;
}

export const CURRENCY_REGISTRY: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    fxRateFromUSD: 1.0,
    flag: "🇺🇸",
  },
  INR: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    fxRateFromUSD: 83.9,
    flag: "🇮🇳",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    fxRateFromUSD: 0.92,
    flag: "🇪🇺",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    fxRateFromUSD: 0.77,
    flag: "🇬🇧",
  },
  AED: {
    code: "AED",
    symbol: "د.إ",
    name: "UAE Dirham",
    fxRateFromUSD: 3.67,
    flag: "🇦🇪",
  },
  SGD: {
    code: "SGD",
    symbol: "S$",
    name: "Singapore Dollar",
    fxRateFromUSD: 1.31,
    flag: "🇸🇬",
  },
};

const STORAGE_KEY = "@asset_array_currency_preference";

export async function saveCurrencyPreference(code: CurrencyCode): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Ignore storage errors
  }
}

export async function loadCurrencyPreference(): Promise<CurrencyCode> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved && saved in CURRENCY_REGISTRY) {
      return saved as CurrencyCode;
    }
  } catch {
    // Fallback to default
  }
  return "INR";
}

/**
 * Converts an amount from one currency to another using the FX rate table.
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) return amount;
  const fromRate = CURRENCY_REGISTRY[from]?.fxRateFromUSD || 1.0;
  const toRate = CURRENCY_REGISTRY[to]?.fxRateFromUSD || 1.0;

  // Convert to USD base first, then to target currency
  const usdAmount = amount / fromRate;
  return usdAmount * toRate;
}

/**
 * Institutional number and currency formatter supporting Indian numbering (Lakh/Crore)
 * and International numbering (M/K).
 */
export function formatWealthAmount(
  amount: number,
  currency: CurrencyCode = "INR",
  compact: boolean = false
): string {
  const config = CURRENCY_REGISTRY[currency] || CURRENCY_REGISTRY.INR;
  const sym = config.symbol;
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (compact) {
    if (currency === "INR") {
      if (absAmount >= 10000000) {
        return `${sign}${sym}${(absAmount / 10000000).toFixed(2)} Cr`;
      }
      if (absAmount >= 100000) {
        return `${sign}${sym}${(absAmount / 100000).toFixed(2)} L`;
      }
    } else {
      if (absAmount >= 1000000000) {
        return `${sign}${sym}${(absAmount / 1000000000).toFixed(2)}B`;
      }
      if (absAmount >= 1000000) {
        return `${sign}${sym}${(absAmount / 1000000).toFixed(2)}M`;
      }
      if (absAmount >= 1000) {
        return `${sign}${sym}${(absAmount / 1000).toFixed(1)}K`;
      }
    }
  }

  // Standard comma formatting
  if (currency === "INR") {
    // Indian Comma notation: 1,00,000
    const parts = absAmount.toFixed(2).split(".");
    let intPart = parts[0];
    const decPart = parts[1];

    if (intPart.length > 3) {
      const lastThree = intPart.substring(intPart.length - 3);
      const otherNumbers = intPart.substring(0, intPart.length - 3);
      intPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
    }
    return `${sign}${sym}${intPart}.${decPart}`;
  }

  // Western Comma notation: 1,000,000
  const formatted = absAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${sym}${formatted}`;
}
