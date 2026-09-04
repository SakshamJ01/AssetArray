export type BillingProduct = {
  currencyCode: string;
  description: string;
  identifier: string;
  price: number;
  priceString: string;
  title: string;
};

export type BillingPackage = {
  identifier: string;
  packageType: string;
  product: BillingProduct;
};

export interface IBillingService {
  checkProStatus(): Promise<boolean>;
  getOfferings(): Promise<BillingPackage[]>;
  initialize(): Promise<void>;
  purchasePackage(pkg: BillingPackage): Promise<boolean>;
  resetDemoProStatus(): Promise<void>;
  restorePurchases(): Promise<boolean>;
}
