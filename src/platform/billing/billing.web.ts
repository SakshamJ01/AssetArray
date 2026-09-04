import AsyncStorage from "@react-native-async-storage/async-storage";
import { BillingPackage, IBillingService } from "./types";

const DEMO_PRO_STORAGE_KEY = "asset_array_demo_is_pro";

export const WEB_MOCK_PACKAGES: BillingPackage[] = [
  {
    identifier: "pro_monthly",
    packageType: "MONTHLY",
    product: {
      currencyCode: "USD",
      description: "Full access to AI Portfolio Co-Pilot & Unlimited Fiduciary PDF Reports",
      identifier: "asset_array_pro_monthly",
      price: 9.99,
      priceString: "$9.99 / month",
      title: "Pro Advisor Monthly",
    },
  },
  {
    identifier: "pro_annual",
    packageType: "ANNUAL",
    product: {
      currencyCode: "USD",
      description: "Full access with 33% annual savings and 7-day free trial",
      identifier: "asset_array_pro_annual",
      price: 79.99,
      priceString: "$79.99 / year",
      title: "Pro Advisor Annual",
    },
  },
];

class WebBillingService implements IBillingService {
  async initialize(): Promise<void> {
    console.log("[RevenueCat Web] Web Billing initialized in Sandbox/Stripe mode.");
  }

  async checkProStatus(): Promise<boolean> {
    try {
      const demoVal = await AsyncStorage.getItem(DEMO_PRO_STORAGE_KEY);
      return demoVal === "true";
    } catch {
      return false;
    }
  }

  async getOfferings(): Promise<BillingPackage[]> {
    return WEB_MOCK_PACKAGES;
  }

  async purchasePackage(pkg: BillingPackage): Promise<boolean> {
    console.log("[RevenueCat Web] Processed purchase for:", pkg.identifier);
    await AsyncStorage.setItem(DEMO_PRO_STORAGE_KEY, "true");
    return true;
  }

  async restorePurchases(): Promise<boolean> {
    return this.checkProStatus();
  }

  async resetDemoProStatus(): Promise<void> {
    await AsyncStorage.removeItem(DEMO_PRO_STORAGE_KEY);
  }
}

export const billingService: IBillingService = new WebBillingService();
