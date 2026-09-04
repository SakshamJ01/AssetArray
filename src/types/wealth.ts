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
  title: string;
  goalType: GoalType;
  targetAmount: string;
  currentAmount: string;
  targetYear: string;
  monthlyContribution: string;
  priority: GoalPriority;
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

export type VaultDocument = {
  id: string;
  title: string;
  category: "Investment" | "Compliance" | "Tax" | "Estate";
  clientName: string;
  uploadDate: string;
  notes: string;
  fileSize: string;
};
export type VaultDocumentDraft = Omit<VaultDocument, "id">;

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
