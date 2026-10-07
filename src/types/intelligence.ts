export interface NomineeRecord {
  id: string;
  holdingId: string;
  holdingName: string;
  accountOrFolio: string;
  nomineeName?: string;
  nomineeRelationship?: string;
  allocationPercentage?: number;
  isRegistered: boolean;
  custodian: string;
  claimHotline: string;
}

export interface EmergencyPlaybook {
  generatedAt: string;
  clientId: string;
  clientName: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  };
  totalAssetsCovered: number;
  totalEstimatedValue: number;
  nomineeCompletenessScore: number;
  accounts: {
    institution: string;
    accountNumber: string;
    assetType: string;
    holdingName: string;
    currentValue: number;
    nomineeName: string;
    nomineeRegistered: boolean;
    claimInstructions: string;
    hotline: string;
  }[];
  criticalChecklist: string[];
}

export interface ConstituentStock {
  ticker: string;
  name: string;
  weight: number; // percentage, e.g. 9.5
  sector: string;
}

export interface FundXrayResult {
  fundName: string;
  isinOrTicker: string;
  expenseRatio: number;
  topConstituents: ConstituentStock[];
}

export interface OverlapItem {
  stockTicker: string;
  stockName: string;
  sector: string;
  fundsContaining: { fundName: string; weightInFund: number; valueInFund: number }[];
  totalConsolidatedWeight: number;
  totalConsolidatedValue: number;
}

export interface OverlapAnalysisResult {
  totalAnalyzedValue: number;
  averageExpenseRatio: number;
  estimatedAnnualFeeDrag: number;
  overlapScore: number; // 0 to 100
  topOverlappingStocks: OverlapItem[];
  highConcentrationWarning: boolean;
  consolidationRecommendations: string[];
}

export interface ConstitutionRule {
  id: string;
  name: string;
  description: string;
  category: "Concentration" | "AssetAllocation" | "Liquidity" | "Speculative";
  threshold: number; // e.g. 15 for 15%
  thresholdUnit: "%" | "INR";
  currentValue: number;
  isCompliant: boolean;
  violationMessage?: string;
}

export interface CrashSimulationImpact {
  scenarioName: string;
  marketDropPct: number;
  estimatedLoss: number;
  portfolioValueAfterCrash: number;
  maxDrawdownDurationMonths: number;
  warningAlert: string;
}

export interface PhysicalGoldHolding {
  id: string;
  itemType: "Bar" | "Coin" | "Jewelry" | "Sovereign Bond";
  purity: "24K" | "22K" | "18K";
  grossWeightGrams: number;
  netWeightGrams: number;
  purchaseDate: string;
  purchaseCostPerGram: number;
  currentSpotRatePerGram: number;
  lockerLocation: string;
  certificateRef?: string;
}

export interface RealEstateProperty {
  id: string;
  propertyType: "Residential" | "Commercial" | "Agricultural Land" | "Industrial";
  address: string;
  city: string;
  carpetAreaSqFt: number;
  circleRatePerSqFt: number;
  estimatedMarketValue: number;
  annualRentalYield: number;
  propertyTaxDueDate: string;
  deedDocumentRef?: string;
}

export interface PrivateDebtNote {
  id: string;
  borrowerName: string;
  borrowerContact: string;
  principalAmount: number;
  annualInterestRate: number;
  interestType: "Simple" | "Compounded Quarterly" | "Compounded Annually";
  issueDate: string;
  maturityDate: string;
  collateralDetails?: string;
  accruedInterest: number;
  totalReceivable: number;
}

export interface ShadowWealthSummary {
  totalPhysicalGoldValue: number;
  totalRealEstateValue: number;
  totalPrivateDebtValue: number;
  totalShadowNetWorth: number;
  goldHoldingsCount: number;
  propertiesCount: number;
  privateNotesCount: number;
}
