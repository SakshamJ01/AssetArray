import { AuthUser } from "../services/secureSync";

export type Channel = "Phone" | "SMS" | "Email" | "WhatsApp";
export type Category = "HNI" | "Retail" | "Family Office" | "Trader" | "Long Term";
export type Priority = "High" | "Medium" | "Low";
export type FilterMode = "All" | "Due" | "High Priority";
export type BroadcastChannel = "Preferred" | "SMS" | "Email" | "WhatsApp";
export type CashFlowFrequency = "Monthly" | "Quarterly" | "Yearly";
export type CashFlowMode = "Payout" | "Cumulative";
export type SipFrequency = "Monthly" | "Quarterly";
export type CalculatorTab = "Cash Flow" | "SIP" | "Goal Planner" | "Retirement";
export type AppTab =
  | "Dashboard"
  | "Clients"
  | "Portfolios"
  | "Tools"
  | "Workspace"
  | "Settings"
  | "AI Research";
export type AboutSheet = "Privacy Policy" | "Terms & Conditions";
export type AssetClass =
  | "Stocks"
  | "Bonds"
  | "Mutual Funds"
  | "Cash"
  | "Alternatives";
export type GoalType = "Retirement" | "Education" | "Wealth" | "Emergency";
export type GoalPriority = "Core" | "Growth" | "Optional";

export type Goal = {
  id: string;
  clientId?: string;
  title: string;
  name?: string;
  goalType: GoalType;
  targetAmount: string;
  currentAmount: string;
  targetYear: string;
  monthlyContribution: string;
  priority: GoalPriority;
  targetDate?: string;
  currentFunding?: number;
  linkedPortfolios?: string[];
  inflationAssumption?: number;
  expectedReturnAssumption?: number;
  volatilityAssumption?: number;
};
export type GoalDraft = Omit<Goal, "id">;

export type AdvisorMessage = {
  id: string;
  clientName: string;
  title: string;
  body: string;
  date: string;
  status: "Pending" | "Sent" | "Reviewed";
};
export type AdvisorMessageDraft = {
  clientName: string;
  title: string;
  body: string;
};

export type VaultCategory = "Report" | "KYC" | "Tax" | "Review";

export type VaultDocument = {
  id: string;
  clientName: string;
  fileName: string;
  category: VaultCategory;
  date: string;
  status: "Stored" | "Shared";
};

export type VaultDocumentDraft = {
  clientName: string;
  fileName: string;
  category: VaultCategory;
};

export type ConnectedAccount = {
  id: string;
  institution: string;
  accountType: "Bank" | "Broker" | "Card" | "Retirement";
  currentValue: string;
  status: "Connected" | "Review";
};


export interface PortfolioHolding {
  id: string;
  assetName: string;
  assetClass: AssetClass;
  ticker: string;
  quantity: string;
  investedValue: string;
  currentValue: string;
  targetWeight: string;
  notes: string;
  country?: string;
  region?: string;
  currency?: string;
  sector?: string;
  industry?: string;
  acquiredAt?: string;
  taxLots?: TaxLot[];
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  category: Category;
  riskProfile: string;
  preferredChannel: Channel;
  watchlist: string[];
  notes: string;
  city: string;
  allocation: string;
  reminderDate: string;
  priority: Priority;
  lastContact: string;
  updateHistory: string[];
  portfolio: PortfolioHolding[];
  avatarUrl?: string;
}

export type ClientDraft = {
  name: string;
  phone: string;
  email: string;
  category: Category;
  riskProfile: string;
  preferredChannel: Channel;
  watchlist: string;
  notes: string;
  city: string;
  allocation: string;
  reminderDate: string;
  priority: Priority;
};

export type HoldingDraft = {
  assetName: string;
  assetClass: AssetClass;
  ticker: string;
  quantity: string;
  investedValue: string;
  currentValue: string;
  targetWeight: string;
  notes: string;
};

export type CloudSettings = {
  endpoint: string;
  ownerName: string;
  authUsername: string;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export const CATEGORY_OPTIONS: Category[] = [
  "HNI",
  "Retail",
  "Family Office",
  "Trader",
  "Long Term",
];
export const ASSET_CLASS_OPTIONS: AssetClass[] = [
  "Stocks",
  "Bonds",
  "Mutual Funds",
  "Cash",
  "Alternatives",
];
export const CATEGORY_FILTER_OPTIONS: Array<"All" | Category> = ["All", ...CATEGORY_OPTIONS];
export const PRIORITY_OPTIONS: Priority[] = ["High", "Medium", "Low"];
export const CHANNEL_OPTIONS: Channel[] = ["Phone", "SMS", "Email", "WhatsApp"];
export const BROADCAST_CHANNEL_OPTIONS: BroadcastChannel[] = [
  "Preferred",
  "SMS",
  "Email",
  "WhatsApp",
];
export const CASH_FLOW_FREQUENCIES: CashFlowFrequency[] = [
  "Monthly",
  "Quarterly",
  "Yearly",
];
export const CASH_FLOW_MODES: CashFlowMode[] = ["Payout", "Cumulative"];
export const SIP_FREQUENCIES: SipFrequency[] = ["Monthly", "Quarterly"];
export const CALCULATOR_TABS: CalculatorTab[] = [
  "Cash Flow",
  "SIP",
  "Goal Planner",
  "Retirement",
];
export const GOAL_TYPE_OPTIONS: GoalType[] = [
  "Retirement",
  "Education",
  "Wealth",
  "Emergency",
];
export const GOAL_PRIORITY_OPTIONS: GoalPriority[] = ["Core", "Growth", "Optional"];

export const emptyDraft: ClientDraft = {
  name: "",
  phone: "",
  email: "",
  category: "Retail",
  riskProfile: "",
  preferredChannel: "WhatsApp",
  watchlist: "",
  notes: "",
  city: "",
  allocation: "",
  reminderDate: "",
  priority: "Medium",
};

export const emptyHoldingDraft: HoldingDraft = {
  assetName: "",
  assetClass: "Stocks",
  ticker: "",
  quantity: "",
  investedValue: "",
  currentValue: "",
  targetWeight: "",
  notes: "",
};

export const defaultMessage =
  "Today's market update: stay selective, watch volatility, and review position sizing before entering fresh trades.";

// --- Institutional Engine Models (AssetArray v3.0) ---

export interface AttributionCategoryBreakdown {
  category: string;
  portfolioWeight: number; // e.g. 0.60 for 60%
  benchmarkWeight: number; // e.g. 0.40 for 40%
  portfolioReturn: number; // e.g. 0.12 for 12%
  benchmarkReturn: number; // e.g. 0.08 for 8%
  allocationEffect: number; // (wp - wb) * (Rb - R_total_b)
  selectionEffect: number; // wb * (rp - Rb)
  interactionEffect: number; // (wp - wb) * (rp - Rb)
  totalActiveContribution: number;
}

export interface AttributionResult {
  portfolioId: string;
  benchmarkSymbol: string;
  benchmarkName: string;
  portfolioReturn: number;
  benchmarkReturn: number;
  totalActiveReturn: number; // portfolioReturn - benchmarkReturn
  portfolioCurrency?: string;
  benchmarkCurrency?: string;
  fxTreatment?: "LOCAL_CURRENCY" | "UNHEDGED_BASE" | "FX_ADJUSTED";
  returnType?: "TOTAL_RETURN" | "PRICE_RETURN";
  isSimulated?: boolean;
  summary: {
    allocationEffect: number;
    selectionEffect: number;
    interactionEffect: number;
  };
  breakdown: AttributionCategoryBreakdown[];
  narrativeExplanation: string;
  quality?: PerformanceQuality;
  methodologyVersion?: string;
  isReconciled?: boolean;
  warnings?: string[];
}

export interface HealthScoreFactors {
  dataCompleteness: number; // 0 - 100
  assetDiversification: number; // 0 - 100 (HHI / entropy based)
  concentrationRisk: number; // 0 - 100 (100 = well balanced, lower = high concentration)
  geographicAndCurrency: number; // 0 - 100
  liabilityManagement: number; // 0 - 100
}

export interface HealthScoreResult {
  portfolioId: string;
  healthScore: number; // 0 - 100
  grade: "Institutional" | "Balanced" | "Moderate Risk" | "High Fragility";
  factors: HealthScoreFactors;
  categoryDistribution: Record<string, number>;
  recommendations: string[];
}

export interface IndianTaxLot {
  holdingId: string;
  assetName: string;
  ticker: string;
  assetClass: AssetClass;
  investedValue: number;
  currentValue: number;
  unrealizedGainLoss: number;
  holdingPeriodMonths: number;
  isLongTerm: boolean; // >= 12 months for listed equity
  applicableTaxRatePct: number; // 20% for STCG (Sec 111A), 12.5% for LTCG (Sec 112A)
  isLossHarvestCandidate: boolean;
  suggestedAction: "HARVEST_LOSS" | "HOLD" | "BOOK_PROFIT" | "VERIFY_DATE";
  potentialTaxShield: number;
  washSaleWarning: boolean;
}

export interface TaxHarvestReport {
  portfolioId: string;
  assessmentYear: string; // e.g. "AY 2026-27"
  realizedGains: {
    shortTerm: number;
    longTerm: number;
  };
  unrealizedGains: {
    shortTerm: number;
    longTerm: number;
  };
  ltcgExemptionAvailable: number; // ₹1,25,000 threshold (Sec 112A)
  ltcgExemptionUtilized: number;
  harvestCandidates: IndianTaxLot[];
  totalHarvestableLoss: number;
  estimatedImmediateTaxSavings: number;
  netTaxLiability: number;
  statutoryDisclaimer: string;
}

export interface ScenarioShockParams {
  name: string;
  equityShockPct: number; // e.g. -20 for -20%
  debtYieldBps: number; // e.g. +100 bps
  commodityShockPct: number; // e.g. +30%
  currencyDevaluationPct: number; // e.g. -5%
  inflationShockPct: number; // e.g. +2%
}

export interface ScenarioDistributionPoint {
  percentile: number; // e.g. 5, 25, 50, 75, 95
  value: number;
}

export interface ScenarioResult {
  portfolioId: string;
  scenarioName: string;
  initialValue: number;
  projectedValue: number;
  percentChange: number;
  postShockVolatility: number;
  postShockSharpe: number;
  goalSuccessProbability: number;
  valueDistribution: ScenarioDistributionPoint[];
  advisoryCommentary: string;
}

export type SmartAlertCondition =
  | "CONCENTRATION_BREACH"
  | "DRAWDOWN_EVENT"
  | "HEALTH_SCORE_DROP"
  | "TAX_HARVEST_WINDOW"
  | "REBALANCE_DRIFT"
  | "GOAL_SHORTFALL";

export interface SmartAlertRule {
  id: string;
  name: string;
  condition: SmartAlertCondition;
  thresholdValue: number;
  enabled: boolean;
}

export type SmartAlertSeverity =
  | "CRITICAL"
  | "WARNING"
  | "NOTICE"
  | "INFO"
  | "critical"
  | "warning"
  | "info";

export type SmartAlertStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING"
  | "DONE"
  | "CANCELLED"
  | "ACTIVE"
  | "ACKNOWLEDGED"
  | "RESOLVED"
  | "SNOOZED";

export interface SmartAlert {
  id: string;
  ruleId?: string;
  clientId: string;
  clientName: string;
  condition: SmartAlertCondition;
  title: string;
  message: string;
  severity: SmartAlertSeverity;
  timestamp: string;
  acknowledged: boolean;
  actionableRoute?: string;
  portfolioId?: string;
  metric?: string;
  observedValue?: number;
  threshold?: number;
  status?: SmartAlertStatus;
  createdAt?: string;
}

export interface CommitteeMemoResult {
  memoId: string;
  clientId: string;
  anonymizedClientRef: string; // DPDP compliant: e.g. "Client Ref #AA-881"
  date: string;
  executiveSummary: string;
  allocationAndHealth: string;
  performanceAttribution: string;
  stressTestingSummary: string;
  fiduciaryRecommendations: string[];
  fullMarkdownReport: string;
}

export interface NetWorthSnapshot {
  userId: string;
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  breakdown: {
    cashAndBank: number;
    investments: number;
    realEstateAndOther: number;
    loansAndLiabilities: number;
  };
}

// --- AssetArray v3.1 Institutional Hardening Foundations ---

export type DataProvenance =
  | "LIVE_MARKET"
  | "HISTORICAL"
  | "USER_INPUT"
  | "IMPORTED"
  | "SIMULATED"
  | "ESTIMATED";

export type DataQualityState =
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "INSUFFICIENT_DATA";

export type PerformanceQuality =
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "INSUFFICIENT_DATA";

export interface DataQuality {
  completeness: number; // 0 - 100%
  freshnessMinutes?: number;
  source: string;
  confidence: DataQualityState;
  warnings: string[];
}

export interface TaxLot {
  id: string;
  securityId: string;
  ticker: string;
  assetClass: AssetClass;
  quantity: number;
  acquiredAt: string; // ISO 8601 date e.g. "2023-08-15"
  costBasis: number; // Total cost basis or per-unit cost
  remainingQuantity: number;
  acquisitionSource?: string;
}

export type TransactionType =
  | "BUY"
  | "SELL"
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "DIVIDEND"
  | "INTEREST"
  | "FEE"
  | "TRANSFER";

export interface Transaction {
  id: string;
  portfolioId: string;
  holdingId?: string;
  ticker?: string;
  type: TransactionType;
  date: string; // ISO 8601 e.g. "2024-01-15"
  amount: number; // Positive for inflow, negative for outflow
  quantity?: number;
  price?: number;
  currency?: string;
  notes?: string;
}

export interface HistoricalValuationPoint {
  date: string; // YYYY-MM-DD
  nav: number;
  cashFlow?: number; // Net external flow on this date
}

export interface BenchmarkModel {
  id: string;
  symbol: string;
  name: string;
  currency: string;
  region: string;
  assetClass: string;
  methodology: string;
  dataSource: DataProvenance;
  totalReturnAvailable: boolean;
  priceReturnAvailable: boolean;
  categoryReturns?: Record<string, number>;
  historicalReturns?: { date: string; returnRate: number }[];
}

export type AdvisorTaskStatus = "OPEN" | "IN_PROGRESS" | "WAITING" | "DONE" | "CANCELLED";
export type AdvisorTaskPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";

export interface AdvisorTask {
  id: string;
  clientId?: string;
  clientName?: string;
  portfolioId?: string;
  title: string;
  description?: string;
  category:
    | "HIGH_PRIORITY"
    | "FOLLOW_UP"
    | "PENDING_REPORT"
    | "PORTFOLIO_ALERT"
    | "GOAL_REVIEW"
    | "TAX_REVIEW"
    | "CLIENT_MESSAGE";
  status: AdvisorTaskStatus;
  priority: AdvisorTaskPriority;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

export interface WhatIfScenarioChange {
  type:
    | "OVERWEIGHT"
    | "UNDERWEIGHT"
    | "BUY"
    | "SELL"
    | "ALLOCATION_SHIFT"
    | "CASH_INFLOW"
    | "CASH_OUTFLOW"
    | "BENCHMARK_SHIFT"
    | "MACRO_SHOCK";
  targetHoldingId?: string;
  targetTicker?: string;
  targetCategory?: AssetClass;
  deltaPercent?: number;
  deltaAmount?: number;
}

export interface WhatIfScenario {
  id: string;
  basePortfolioId: string;
  name: string;
  createdAt: string;
  changes: WhatIfScenarioChange[];
  assumptions: {
    equityShockPct?: number;
    debtYieldBps?: number;
    commodityShockPct?: number;
    currencyDevaluationPct?: number;
    inflationShockPct?: number;
  };
}


