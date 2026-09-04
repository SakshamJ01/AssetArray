import { billingService, BillingPackage } from "../platform/billing";

export type { BillingPackage };

export async function initializeRevenueCat(): Promise<void> {
  return billingService.initialize();
}

export async function getOfferings(): Promise<BillingPackage[]> {
  return billingService.getOfferings();
}

export async function purchasePackage(pkg: BillingPackage): Promise<boolean> {
  return billingService.purchasePackage(pkg);
}

export async function checkProStatus(): Promise<boolean> {
  return billingService.checkProStatus();
}

export async function restorePurchases(): Promise<boolean> {
  return billingService.restorePurchases();
}

export async function resetDemoProStatus(): Promise<void> {
  return billingService.resetDemoProStatus();
}
