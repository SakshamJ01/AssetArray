import Purchases, { PurchasesPackage } from "react-native-purchases";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BillingPackage, IBillingService } from "./types";

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

export const MOCK_PACKAGES: BillingPackage[] = [
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
  },
];

class NativeBillingService implements IBillingService {
  async initialize(): Promise<void> {
    try {
      const key = getActiveApiKey();
      if (!key) {
        console.log("[RevenueCat Native] Using Demo mode (no active API key)");
        return;
      }
      Purchases.configure({ apiKey: key });
      console.log("[RevenueCat Native] Initialized successfully with Test Store key!");
    } catch (e) {
      console.warn("[RevenueCat Native] Could not initialize native purchases:", e);
    }
  }

  async getOfferings(): Promise<BillingPackage[]> {
    try {
      const key = getActiveApiKey();
      if (key) {
        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null && offerings.current.availablePackages.length > 0) {
          return offerings.current.availablePackages.map((p: PurchasesPackage) => ({
            identifier: p.identifier,
            packageType: p.packageType,
            product: {
              currencyCode: p.product.currencyCode,
              description: p.product.description,
              identifier: p.product.identifier,
              price: p.product.price,
              priceString: p.product.priceString,
              title: p.product.title,
            },
          }));
        }
      }
    } catch (e) {
      console.warn("[RevenueCat Native] Live offerings fetch failed, falling back to mock:", e);
    }
    return MOCK_PACKAGES;
  }

  async purchasePackage(pkg: BillingPackage): Promise<boolean> {
    const key = getActiveApiKey();

    if (!key || key.startsWith("test_") || isPlaceholderKey(key)) {
      console.log("[RevenueCat Native] Completed purchase in Test Store / Sandbox mode");
      await AsyncStorage.setItem(DEMO_PRO_STORAGE_KEY, "true");
      return true;
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg as unknown as PurchasesPackage);
      const isEntitled = customerInfo.entitlements.active[IS_PRO_ENTITLEMENT_ID] !== undefined;
      if (isEntitled) {
        await AsyncStorage.setItem(DEMO_PRO_STORAGE_KEY, "true");
        return true;
      }
    } catch (e: any) {
      if (e.userCancelled) return false;
      console.warn("[RevenueCat Native] Native purchase error, falling back to sandbox:", e);
    }

    await AsyncStorage.setItem(DEMO_PRO_STORAGE_KEY, "true");
    return true;
  }

  async checkProStatus(): Promise<boolean> {
    try {
      const key = getActiveApiKey();
      if (key) {
        const customerInfo = await Purchases.getCustomerInfo();
        if (customerInfo.entitlements.active[IS_PRO_ENTITLEMENT_ID] !== undefined) {
          return true;
        }
      }
    } catch (e) {
      // fallback in sandbox
    }

    const stored = await AsyncStorage.getItem(DEMO_PRO_STORAGE_KEY);
    return stored === "true";
  }

  async restorePurchases(): Promise<boolean> {
    const key = getActiveApiKey();
    if (!key || key.startsWith("test_") || isPlaceholderKey(key)) {
      const stored = await AsyncStorage.getItem(DEMO_PRO_STORAGE_KEY);
      return stored === "true";
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active[IS_PRO_ENTITLEMENT_ID] !== undefined) {
        await AsyncStorage.setItem(DEMO_PRO_STORAGE_KEY, "true");
        return true;
      }
    } catch (e) {
      // fallback
    }

    const stored = await AsyncStorage.getItem(DEMO_PRO_STORAGE_KEY);
    return stored === "true";
  }

  async resetDemoProStatus(): Promise<void> {
    await AsyncStorage.removeItem(DEMO_PRO_STORAGE_KEY);
  }
}

export const billingService: IBillingService = new NativeBillingService();
