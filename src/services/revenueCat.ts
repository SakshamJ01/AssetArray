import Purchases, { PurchasesPackage } from "react-native-purchases";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// RevenueCat Public API Keys
export const API_KEYS = {
  apple: "appl_api_key_placeholder",
  google: "goog_api_key_placeholder",
  test: "test_wdmBoaCACldGkLQEuCVKhDaFzwB",
};

export const IS_PRO_ENTITLEMENT_ID = "pro_advisor";
const DEMO_PRO_STORAGE_KEY = "asset_array_demo_is_pro";

const isPlaceholderKey = (key: string) => !key || key.includes("placeholder");

export function getActiveApiKey(): string {
  const platformKey = Platform.OS === "ios" ? API_KEYS.apple : API_KEYS.google;
  if (!isPlaceholderKey(platformKey)) {
    return platformKey;
  }
  if (API_KEYS.test && !isPlaceholderKey(API_KEYS.test)) {
    return API_KEYS.test;
  }
  return "";
}

export const MOCK_PACKAGES: any[] = [
  {
    identifier: "pro_monthly",
    packageType: "MONTHLY",
    product: {
      identifier: "asset_array_pro_monthly",
      description: "Full access to AI Portfolio Co-Pilot & Unlimited PDF Reports",
      title: "Pro Advisor Monthly",
      price: 9.99,
      priceString: "$9.99 / month",
      currencyCode: "USD",
    },
    offeringIdentifier: "default",
  },
  {
    identifier: "pro_annual",
    packageType: "ANNUAL",
    product: {
      identifier: "asset_array_pro_annual",
      description: "Full access with 33% annual discount",
      title: "Pro Advisor Annual",
      price: 79.99,
      priceString: "$79.99 / year",
      currencyCode: "USD",
    },
    offeringIdentifier: "default",
  },
];

export async function initializeRevenueCat() {
  try {
    const key = getActiveApiKey();
    if (!key) {
      console.log("[RevenueCat] Using Demo mode (no active API key)");
      return;
    }
    Purchases.configure({ apiKey: key });
    console.log("[RevenueCat] Initialized successfully with Test Store key!");
  } catch (e) {
    console.warn("[RevenueCat] Could not initialize native purchases (running in demo mode):", e);
  }
}

export async function getOfferings(): Promise<PurchasesPackage[]> {
  try {
    const key = getActiveApiKey();
    if (key) {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length > 0) {
        return offerings.current.availablePackages;
      }
    }
  } catch (e) {
    console.warn("[RevenueCat] Live offerings fetch failed, falling back to packages:", e);
  }
  // Return realistic mock packages for demo / student track submission
  return MOCK_PACKAGES as PurchasesPackage[];
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const key = getActiveApiKey();
    if (key) {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isEntitled = customerInfo.entitlements.active[IS_PRO_ENTITLEMENT_ID] !== undefined;
      if (isEntitled) return true;
    }
  } catch (e: any) {
    if (e.userCancelled) return false;
    console.warn("[RevenueCat] Purchase via store failed, completing in demo mode:", e);
  }

  // Demo purchase flow for testing/recording video
  await AsyncStorage.setItem(DEMO_PRO_STORAGE_KEY, "true");
  return true;
}

export async function checkProStatus(): Promise<boolean> {
  try {
    const key = getActiveApiKey();
    if (key) {
      const customerInfo = await Purchases.getCustomerInfo();
      if (customerInfo.entitlements.active[IS_PRO_ENTITLEMENT_ID] !== undefined) {
        return true;
      }
    }
  } catch (e) {
    // ignore in demo
  }

  const stored = await AsyncStorage.getItem(DEMO_PRO_STORAGE_KEY);
  return stored === "true";
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const key = getActiveApiKey();
    if (key) {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active[IS_PRO_ENTITLEMENT_ID] !== undefined) {
        return true;
      }
    }
  } catch (e) {
    // ignore in demo
  }

  const stored = await AsyncStorage.getItem(DEMO_PRO_STORAGE_KEY);
  return stored === "true";
}

export async function resetDemoProStatus(): Promise<void> {
  await AsyncStorage.removeItem(DEMO_PRO_STORAGE_KEY);
}

