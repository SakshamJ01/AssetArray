import "react-native-get-random-values";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,

  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useColorScheme,
  useWindowDimensions,
  View,
  Platform,
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import * as Font from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

if (Platform.OS === "web" && typeof document !== "undefined") {
  const fontStyleId = "expo-vector-icons-web-fonts";
  if (!document.getElementById(fontStyleId)) {
    const iconFontStyles = `
      @font-face {
        font-family: 'Ionicons';
        src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.0.3/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') format('truetype');
      }
      @font-face {
        font-family: 'Feather';
        src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.0.3/build/vendor/react-native-vector-icons/Fonts/Feather.ttf') format('truetype');
      }
      @font-face {
        font-family: 'MaterialIcons';
        src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.0.3/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf') format('truetype');
      }
    `;
    const style = document.createElement("style");
    style.id = fontStyleId;
    style.type = "text/css";
    style.appendChild(document.createTextNode(iconFontStyles));
    document.head.appendChild(style);
  }
}
import { BottomTabBar } from "./src/components/BottomTabBar";
import { DesktopSidebar } from "./src/components/DesktopSidebar";
import { DashboardScreen } from "./src/components/DashboardScreen";
import { AdvisorMessagesScreen } from "./src/screens/workspace/AdvisorMessagesScreen";
import { setHapticsEnabled, triggerSuccessHaptic } from "./src/services/haptics";
import {
  ClientEditorModal,
  HoldingEditorModal,
  SyncConfigModal,
  BroadcastModal,
  AboutLegalModal,
} from "./src/components/modals";
import {
  AiResearchResult,
  AuthUser,
  buildOwnerId,
  decryptPayload,
  encryptPayload,
  getAdvisorProfile,
  loginAdvisor,
  logoutAdvisor,
  pullPayload,
  pushPayload,
  requestAiResearch,
  refreshAdvisorToken,
  sendBroadcastCampaign,
} from "./src/services/secureSync";
import { buildAppTheme } from "./src/theme";
import { SyncBadge } from "./src/components/SyncBadge";
import { fetchLiveMarketQuotes, getQuoteForSymbol, MarketQuote } from "./src/services/marketData";
import { analyzeClientPortfolioWithAI, ClientAiRecommendation } from "./src/services/aiAdvisor";
import { useNetworkStatus } from "./src/services/network";
import { exportClientPdfReport } from "./src/services/pdfReport";
import { initializeRevenueCat, checkProStatus, getOfferings, purchasePackage, restorePurchases, resetDemoProStatus } from "./src/services/revenueCat";
import { PaywallScreen } from "./src/screens/PaywallScreen";
import {
  ClientsScreen,
  PortfoliosScreen,
  ToolsScreen,
  WorkspaceScreen,
  SettingsScreen,
} from "./src/screens";
import { PortfolioManagerSection } from "./src/components/PortfolioManagerSection";
import { DEMO_CLIENTS, getClientAvatar } from "./src/services/demoData";
import { AssetAllocationBar } from "./src/components/AssetAllocationBar";
import { storageService } from "./src/platform/storage";
import { localAuth } from "./src/platform/auth";
import { BillingPackage } from "./src/platform/billing";
import { GlobalStyleInjector } from "./src/components/GlobalStyleInjector";
import { LiveMarketTicker } from "./src/components/LiveMarketTicker";
import { ScreenTransition } from "./src/components/ScreenTransition";

type Channel = "Phone" | "SMS" | "Email" | "WhatsApp";
type Category = "HNI" | "Retail" | "Family Office" | "Trader" | "Long Term";
type Priority = "High" | "Medium" | "Low";
type FilterMode = "All" | "Due" | "High Priority";
type BroadcastChannel = "Preferred" | "SMS" | "Email" | "WhatsApp";
type CashFlowFrequency = "Monthly" | "Quarterly" | "Yearly";
type CashFlowMode = "Payout" | "Cumulative";
type SipFrequency = "Monthly" | "Quarterly";
type CalculatorTab = "Cash Flow" | "SIP" | "Goal Planner" | "Retirement";
type AppTab =
  | "Dashboard"
  | "Clients"
  | "Portfolios"
  | "Tools"
  | "Workspace"
  | "Settings"
  | "AI Research";
type AboutSheet = "Privacy Policy" | "Terms & Conditions";
type AssetClass =
  | "Stocks"
  | "Bonds"
  | "Mutual Funds"
  | "Cash"
  | "Alternatives";
type GoalType = "Retirement" | "Education" | "Wealth" | "Emergency";
type GoalPriority = "Core" | "Growth" | "Optional";
type Goal = {
  id: string;
  title: string;
  goalType: GoalType;
  targetAmount: string;
  currentAmount: string;
  targetYear: string;
  monthlyContribution: string;
  priority: GoalPriority;
};
type GoalDraft = Omit<Goal, "id">;
type AdvisorMessage = {
  id: string;
  clientName: string;
  title: string;
  body: string;
  date: string;
  status: "Pending" | "Sent" | "Reviewed";
};
type AdvisorMessageDraft = {
  clientName: string;
  title: string;
  body: string;
};
type VaultDocument = {
  id: string;
  clientName: string;
  fileName: string;
  category: "Report" | "KYC" | "Tax" | "Review";
  date: string;
  status: "Stored" | "Shared";
};
type VaultDocumentDraft = {
  clientName: string;
  fileName: string;
  category: "Report" | "KYC" | "Tax" | "Review";
};
type ConnectedAccount = {
  id: string;
  institution: string;
  accountType: "Bank" | "Broker" | "Card" | "Retirement";
  currentValue: string;
  status: "Connected" | "Review";
};

type PortfolioHolding = {
  id: string;
  assetName: string;
  assetClass: AssetClass;
  ticker: string;
  quantity: string;
  investedValue: string;
  currentValue: string;
  targetWeight: string;
  notes: string;
};

type Client = {
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
};

type ClientDraft = {
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

type HoldingDraft = {
  assetName: string;
  assetClass: AssetClass;
  ticker: string;
  quantity: string;
  investedValue: string;
  currentValue: string;
  targetWeight: string;
  notes: string;
};

type CloudSettings = {
  endpoint: string;
  ownerName: string;
  authUsername: string;
};

type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

const PIN_KEY = "asset_array_pin";
const CLIENTS_KEY = "asset_array_clients";
const BIOMETRIC_KEY = "asset_array_biometric";
const CLOUD_SETTINGS_KEY = "asset_array_cloud_settings";
const AUTH_SESSION_KEY = "asset_array_auth_session";
const MARKET_MESSAGE_KEY = "asset_array_market_message";
const DARK_MODE_KEY = "asset_array_dark_mode";
const HAPTICS_KEY = "asset_array_haptics";
const APP_VERSION = "1.0.1";
const SUPPORT_EMAIL = "support@assetarray.app";
const BUG_REPORT_EMAIL = "bugs@assetarray.app";
const GOALS_KEY = "asset_array_goals";
const ADVISOR_MESSAGES_KEY = "asset_array_advisor_messages";
const VAULT_DOCUMENTS_KEY = "asset_array_vault_documents";

const CATEGORY_OPTIONS: Category[] = [
  "HNI",
  "Retail",
  "Family Office",
  "Trader",
  "Long Term",
];
const ASSET_CLASS_OPTIONS: AssetClass[] = [
  "Stocks",
  "Bonds",
  "Mutual Funds",
  "Cash",
  "Alternatives",
];
const CATEGORY_FILTER_OPTIONS: Array<"All" | Category> = ["All", ...CATEGORY_OPTIONS];
const PRIORITY_OPTIONS: Priority[] = ["High", "Medium", "Low"];
const CHANNEL_OPTIONS: Channel[] = ["Phone", "SMS", "Email", "WhatsApp"];
const BROADCAST_CHANNEL_OPTIONS: BroadcastChannel[] = [
  "Preferred",
  "SMS",
  "Email",
  "WhatsApp",
];
const CASH_FLOW_FREQUENCIES: CashFlowFrequency[] = [
  "Monthly",
  "Quarterly",
  "Yearly",
];
const CASH_FLOW_MODES: CashFlowMode[] = ["Payout", "Cumulative"];
const SIP_FREQUENCIES: SipFrequency[] = ["Monthly", "Quarterly"];
const CALCULATOR_TABS: CalculatorTab[] = [
  "Cash Flow",
  "SIP",
  "Goal Planner",
  "Retirement",
];
const GOAL_TYPE_OPTIONS: GoalType[] = [
  "Retirement",
  "Education",
  "Wealth",
  "Emergency",
];
const GOAL_PRIORITY_OPTIONS: GoalPriority[] = ["Core", "Growth", "Optional"];

const defaultMessage =
  "Today's market update: stay selective, watch volatility, and review position sizing before entering fresh trades.";

const emptyDraft: ClientDraft = {
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

const emptyHoldingDraft: HoldingDraft = {
  assetName: "",
  assetClass: "Stocks",
  ticker: "",
  quantity: "",
  investedValue: "",
  currentValue: "",
  targetWeight: "",
  notes: "",
};

const DEFAULT_BACKEND_ENDPOINT = "https://assetarray.onrender.com";

const emptyCloudSettings: CloudSettings = {
  endpoint: DEFAULT_BACKEND_ENDPOINT,
  ownerName: "",
  authUsername: "admin",
};

const emptyGoalDraft: GoalDraft = {
  title: "",
  goalType: "Wealth",
  targetAmount: "",
  currentAmount: "",
  targetYear: `${new Date().getFullYear() + 5}`,
  monthlyContribution: "",
  priority: "Core",
};

const emptyAdvisorMessageDraft: AdvisorMessageDraft = {
  clientName: "",
  title: "",
  body: "",
};

const emptyVaultDocumentDraft: VaultDocumentDraft = {
  clientName: "",
  fileName: "",
  category: "Report",
};

const defaultConnectedAccounts: ConnectedAccount[] = [
  {
    id: "acc-bank-1",
    institution: "Primary Bank",
    accountType: "Bank",
    currentValue: "850000",
    status: "Connected",
  },
  {
    id: "acc-broker-1",
    institution: "Brokerage Account",
    accountType: "Broker",
    currentValue: "2450000",
    status: "Connected",
  },
  {
    id: "acc-card-1",
    institution: "Business Credit Card",
    accountType: "Card",
    currentValue: "95000",
    status: "Review",
  },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(date = new Date()) {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatReminderDate(value: string) {
  if (!value) {
    return "Not scheduled";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isReminderDue(value: string) {
  return Boolean(value) && value <= todayISO();
}

function numericValue(raw: string) {
  const cleaned = raw.replace(/,/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function currencyDisplay(raw: string) {
  const value = numericValue(raw);
  return value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

function compactText(text: string, fallback: string) {
  const cleaned = text.trim().replace(/\s+/g, " ");
  return cleaned || fallback;
}

function parseStoredJson<T>(raw: string | null, fallback: T) {
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function personalizedClientMessage(client: Client, marketNote: string) {
  return `Hello ${client.name}, based on your ${client.riskProfile || "current"} profile and ${client.category} segment, ${marketNote}`;
}

function resolveBroadcastContact(client: Client, channel: BroadcastChannel) {
  if (channel === "Email") {
    return client.email.trim();
  }

  if (channel === "SMS" || channel === "WhatsApp") {
    return client.phone.trim();
  }

  if (client.preferredChannel === "Email") {
    return client.email.trim();
  }

  if (client.preferredChannel === "SMS" || client.preferredChannel === "WhatsApp") {
    return client.phone.trim();
  }

  return client.phone.trim() || client.email.trim();
}

function clientInsightList(client: Client) {
  const insights: string[] = [];
  const holdingCount = client.portfolio.length;
  const totalCurrent = client.portfolio.reduce(
    (sum, item) => sum + numericValue(item.currentValue),
    0
  );
  const biggestHolding = [...client.portfolio].sort(
    (a, b) => numericValue(b.currentValue) - numericValue(a.currentValue)
  )[0];

  if (holdingCount === 0) {
    insights.push("Portfolio data missing. Add holdings to unlock portfolio review insights.");
  } else {
    insights.push(`Current portfolio tracks ${holdingCount} holding${holdingCount === 1 ? "" : "s"} worth about ${currencyDisplay(`${totalCurrent}`)}.`);
  }
  if (biggestHolding && totalCurrent > 0) {
    const concentration = (numericValue(biggestHolding.currentValue) / totalCurrent) * 100;
    insights.push(
      `${biggestHolding.assetName} is the largest exposure at roughly ${concentration.toFixed(1)}% of tracked current value.`
    );
  }
  if (!client.reminderDate) {
    insights.push("No follow-up reminder is scheduled yet.");
  } else if (isReminderDue(client.reminderDate)) {
    insights.push("Follow-up is due now and should be prioritised.");
  }
  if (!client.notes.trim()) {
    insights.push("Private note section is still empty, so meeting context may be incomplete.");
  }
  return insights;
}

function buildClientFromDraft(draft: ClientDraft, existing?: Client): Client {
  return {
    id: existing?.id ?? `${Date.now()}`,
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    email: draft.email.trim(),
    category: draft.category,
    riskProfile: draft.riskProfile.trim(),
    preferredChannel: draft.preferredChannel,
    watchlist: draft.watchlist
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    notes: draft.notes.trim(),
    city: draft.city.trim(),
    allocation: draft.allocation.trim(),
    reminderDate: draft.reminderDate,
    priority: draft.priority,
    lastContact: existing?.lastContact ?? "Not contacted yet",
    updateHistory: existing?.updateHistory ?? [],
    portfolio: existing?.portfolio ?? [],
  };
}

function buildDraftFromClient(client: Client): ClientDraft {
  return {
    name: client.name,
    phone: client.phone,
    email: client.email,
    category: client.category,
    riskProfile: client.riskProfile,
    preferredChannel: client.preferredChannel,
    watchlist: client.watchlist.join(", "),
    notes: client.notes,
    city: client.city,
    allocation: client.allocation,
    reminderDate: client.reminderDate,
    priority: client.priority,
  };
}

function buildHoldingFromDraft(
  draft: HoldingDraft,
  existing?: PortfolioHolding
): PortfolioHolding {
  return {
    id: existing?.id ?? `${Date.now()}`,
    assetName: draft.assetName.trim(),
    assetClass: draft.assetClass,
    ticker: draft.ticker.trim(),
    quantity: draft.quantity.trim(),
    investedValue: draft.investedValue.trim(),
    currentValue: draft.currentValue.trim(),
    targetWeight: draft.targetWeight.trim(),
    notes: draft.notes.trim(),
  };
}

function buildHoldingDraftFromHolding(holding: PortfolioHolding): HoldingDraft {
  return {
    assetName: holding.assetName,
    assetClass: holding.assetClass ?? "Stocks",
    ticker: holding.ticker,
    quantity: holding.quantity,
    investedValue: holding.investedValue,
    currentValue: holding.currentValue,
    targetWeight: holding.targetWeight,
    notes: holding.notes,
  };
}

async function persistClients(clients: Client[]) {
  await AsyncStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

async function persistBiometric(value: boolean) {
  await storageService.setSecureItem(BIOMETRIC_KEY, JSON.stringify(value));
}

async function persistDarkMode(value: boolean) {
  await storageService.setSecureItem(DARK_MODE_KEY, JSON.stringify(value));
}

async function persistHaptics(value: boolean) {
  await storageService.setSecureItem(HAPTICS_KEY, JSON.stringify(value));
}

async function persistCloudSettings(value: CloudSettings) {
  await storageService.setSecureItem(CLOUD_SETTINGS_KEY, JSON.stringify(value));
}

async function persistAuthSession(value: AuthSession | null) {
  if (!value) {
    await storageService.removeSecureItem(AUTH_SESSION_KEY);
    return;
  }
  await storageService.setSecureItem(AUTH_SESSION_KEY, JSON.stringify(value));
}

async function persistGoals(goals: Goal[]) {
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

async function persistAdvisorMessages(messages: AdvisorMessage[]) {
  await AsyncStorage.setItem(ADVISOR_MESSAGES_KEY, JSON.stringify(messages));
}

async function persistVaultDocuments(documents: VaultDocument[]) {
  await AsyncStorage.setItem(VAULT_DOCUMENTS_KEY, JSON.stringify(documents));
}

function isValidBackendEndpoint(value: string) {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function AppContent() {
  const systemColorScheme = useColorScheme();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = windowWidth >= 1024;
  const [isReady, setIsReady] = useState(false);
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [darkModeEnabled, setDarkModeEnabled] = useState(systemColorScheme === "dark");
  const [hapticsEnabled, setHapticsEnabledState] = useState(true);
  const [pinInput, setPinInput] = useState("");
  const [pinSetup, setPinSetup] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"add" | "edit">("add");
  const [draft, setDraft] = useState<ClientDraft>(emptyDraft);
  const [marketMessage, setMarketMessage] = useState(defaultMessage);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | Category>("All");
  const [filterMode, setFilterMode] = useState<FilterMode>("All");
  const [cloudSettings, setCloudSettings] = useState<CloudSettings>(emptyCloudSettings);
  const [syncState, setSyncState] = useState("Offline only");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [aboutSheet, setAboutSheet] = useState<AboutSheet | null>(null);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authPassword, setAuthPassword] = useState("");
  const [authState, setAuthState] = useState("Not connected");
  const [isAuthChecking, setIsAuthChecking] = useState(false);
  const [aiResearchQuery, setAiResearchQuery] = useState("");
  const [aiResearchResult, setAiResearchResult] = useState<AiResearchResult | null>(null);
  const [aiResearchState, setAiResearchState] = useState("Ready");
  const [isAiResearchLoading, setIsAiResearchLoading] = useState(false);
  const [isMarketRefreshing, setIsMarketRefreshing] = useState(false);
  const [selectedAiClient, setSelectedAiClient] = useState<Client | null>(null);
  const [clientAiRecommendation, setClientAiRecommendation] = useState<ClientAiRecommendation | null>(null);
  const [isClientAiLoading, setIsClientAiLoading] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);
  const [revenueCatPackages, setRevenueCatPackages] = useState<BillingPackage[]>([]);
  const [isPaywallLoading, setIsPaywallLoading] = useState(false);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [portfolioMode, setPortfolioMode] = useState<"add" | "edit">("add");
  const [holdingDraft, setHoldingDraft] = useState<HoldingDraft>(emptyHoldingDraft);
  const [editingHoldingId, setEditingHoldingId] = useState<string | null>(null);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState(defaultMessage);
  const [broadcastChannel, setBroadcastChannel] =
    useState<BroadcastChannel>("Preferred");
  const [broadcastState, setBroadcastState] = useState("No campaign sent yet");
  const [cashFlowAmount, setCashFlowAmount] = useState("");
  const [cashFlowRate, setCashFlowRate] = useState("");
  const [cashFlowYears, setCashFlowYears] = useState("1");
  const [cashFlowFrequency, setCashFlowFrequency] =
    useState<CashFlowFrequency>("Monthly");
  const [cashFlowMode, setCashFlowMode] = useState<CashFlowMode>("Payout");
  const [activeCalculator, setActiveCalculator] =
    useState<CalculatorTab>("Cash Flow");
  const [sipAmount, setSipAmount] = useState("");
  const [sipRate, setSipRate] = useState("");
  const [sipYears, setSipYears] = useState("5");
  const [sipFrequency, setSipFrequency] = useState<SipFrequency>("Monthly");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [goalExpectedReturn, setGoalExpectedReturn] = useState("");
  const [goalYears, setGoalYears] = useState("5");
  const [retirementMonthlyExpense, setRetirementMonthlyExpense] = useState("");
  const [retirementInflation, setRetirementInflation] = useState("6");
  const [retirementReturn, setRetirementReturn] = useState("12");
  const [retirementYearsToRetire, setRetirementYearsToRetire] = useState("15");
  const [retirementYearsAfterRetire, setRetirementYearsAfterRetire] =
    useState("25");
  const [marketResearchNotes, setMarketResearchNotes] = useState("");
  const [activeTab, setActiveTab] = useState<AppTab>("Dashboard");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalDraft, setGoalDraft] = useState<GoalDraft>(emptyGoalDraft);
  const [advisorMessages, setAdvisorMessages] = useState<AdvisorMessage[]>([]);
  const [advisorMessageDraft, setAdvisorMessageDraft] =
    useState<AdvisorMessageDraft>(emptyAdvisorMessageDraft);
  const [vaultDocuments, setVaultDocuments] = useState<VaultDocument[]>([]);
  const [vaultDocumentDraft, setVaultDocumentDraft] =
    useState<VaultDocumentDraft>(emptyVaultDocumentDraft);
  const [connectedAccounts] = useState<ConnectedAccount[]>(defaultConnectedAccounts);
  const theme = useMemo(
    () => buildAppTheme(darkModeEnabled ? "dark" : "light"),
    [darkModeEnabled]
  );
  const isCompactPageHeader = windowWidth < 420;
  const contentBottomPadding = isDesktop ? 32 : insets.bottom + 100;

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setActiveTab("Clients");
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        if (selectedClientIds.length === 0 && clients.length > 0) {
          setSelectedClientIds(clients.map((c) => c.id));
        }
        setIsBroadcastModalOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "l") {
        e.preventDefault();
        setIsUnlocked(false);
      } else if (e.key === "Escape") {
        setIsEditorOpen(false);
        setIsBroadcastModalOpen(false);
        setIsSyncModalOpen(false);
        setIsPortfolioModalOpen(false);
        setAboutSheet(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clients, selectedClientIds]);

  useEffect(() => {
    async function load() {
      try {
        await Font.loadAsync(Ionicons.font);
      } catch (fontErr) {
        console.warn("Ionicons font load notice:", fontErr);
      }
      try {
        const [
          pin,
          rawClients,
          rawBiometric,
          rawCloudSettings,
          storedMessage,
          rawDarkMode,
          rawGoals,
          rawAdvisorMessages,
          rawVaultDocuments,
          rawAuthSession,
          rawHaptics,
        ] = await Promise.all([
          storageService.getSecureItem(PIN_KEY),
          AsyncStorage.getItem(CLIENTS_KEY),
          storageService.getSecureItem(BIOMETRIC_KEY),
          storageService.getSecureItem(CLOUD_SETTINGS_KEY),
          storageService.getSecureItem(MARKET_MESSAGE_KEY),
          storageService.getSecureItem(DARK_MODE_KEY),
          AsyncStorage.getItem(GOALS_KEY),
          AsyncStorage.getItem(ADVISOR_MESSAGES_KEY),
          AsyncStorage.getItem(VAULT_DOCUMENTS_KEY),
          storageService.getSecureItem(AUTH_SESSION_KEY),
          storageService.getSecureItem(HAPTICS_KEY),
        ]);

        setStoredPin(pin);
        setBiometricEnabled(parseStoredJson(rawBiometric, false));
        const loadedClients = parseStoredJson(rawClients, [] as Client[]);
        const enrichedClients = (loadedClients.length > 0 ? loadedClients : DEMO_CLIENTS).map((c) => ({
          ...c,
          avatarUrl: getClientAvatar(c),
        }));
        setClients(enrichedClients);
        const loadedCloudSettings = parseStoredJson(rawCloudSettings, emptyCloudSettings);
        if (!loadedCloudSettings.endpoint || !loadedCloudSettings.endpoint.trim() || loadedCloudSettings.endpoint.includes("localhost") || loadedCloudSettings.endpoint.includes("127.0.0.1") || loadedCloudSettings.endpoint.includes("192.168") || loadedCloudSettings.endpoint.includes("10.18")) {
          loadedCloudSettings.endpoint = DEFAULT_BACKEND_ENDPOINT;
        }
        if (!loadedCloudSettings.authUsername) {
          loadedCloudSettings.authUsername = "admin";
        }
        setCloudSettings(loadedCloudSettings);

        if (storedMessage) {
          setMarketMessage(storedMessage);
          setBroadcastMessage(storedMessage);
        }

        setDarkModeEnabled(parseStoredJson(rawDarkMode, true));
        const nextHapticsEnabled = parseStoredJson(rawHaptics, true);
        setHapticsEnabledState(nextHapticsEnabled);
        setHapticsEnabled(nextHapticsEnabled);
        setGoals(parseStoredJson(rawGoals, [] as Goal[]));
        setAdvisorMessages(parseStoredJson(rawAdvisorMessages, [] as AdvisorMessage[]));
        setVaultDocuments(parseStoredJson(rawVaultDocuments, [] as VaultDocument[]));

        const parsedSession = parseStoredJson<AuthSession | null>(rawAuthSession, null);
        if (parsedSession) {
          setAuthSession(parsedSession);
          setAuthState(`Connected as ${parsedSession.user.username}`);
        } else {
          setAuthSession(null);
          setAuthState("Not connected");
        }
      } catch {
        setStoredPin(null);
        setBiometricEnabled(false);
        setClients([]);
        setCloudSettings(emptyCloudSettings);
        setHapticsEnabledState(true);
        setHapticsEnabled(true);
        setGoals([]);
        setAdvisorMessages([]);
        setVaultDocuments([]);
        setAuthSession(null);
        setAuthState("Not connected");
      } finally {
        const hardware = await localAuth.hasHardwareAsync().catch(() => false);
        const enrolled = await localAuth.isEnrolledAsync().catch(() => false);
        setBiometricAvailable(hardware && enrolled);

        await initializeRevenueCat();
        const proStatus = await checkProStatus();
        setIsPro(proStatus);
        const pkgs = await getOfferings();
        setRevenueCatPackages(pkgs);

        await Font.loadAsync(Ionicons.font).catch(() => {});
        setIsReady(true);
      }
    }
    

    void load();
  }, []);

  useEffect(() => {
    if (!isReady || !isUnlocked) {
      return;
    }

    void persistClients(clients);
    void storageService.setSecureItem(MARKET_MESSAGE_KEY, marketMessage);
  }, [clients, isReady, isUnlocked, marketMessage]);

  useEffect(() => {
    if (!isReady || !isUnlocked) {
      return;
    }
    void persistGoals(goals);
  }, [goals, isReady, isUnlocked]);

  useEffect(() => {
    if (!isReady || !isUnlocked) {
      return;
    }
    void persistAdvisorMessages(advisorMessages);
  }, [advisorMessages, isReady, isUnlocked]);

  useEffect(() => {
    if (!isReady || !isUnlocked) {
      return;
    }
    void persistVaultDocuments(vaultDocuments);
  }, [vaultDocuments, isReady, isUnlocked]);

  useEffect(() => {
    setSelectedClientIds((current) =>
      current.filter((clientId) => clients.some((client) => client.id === clientId))
    );
  }, [clients]);

  useEffect(() => {
    async function verifySession() {
      if (!isReady || !isUnlocked || !authSession || !cloudSettings.endpoint.trim()) {
        return;
      }

      setIsAuthChecking(true);
      try {
        const accessToken =
          authSession.expiresAt > Date.now() + 15_000
            ? authSession.accessToken
            : await refreshAccessTokenIfNeeded();

        if (!accessToken) {
          setAuthState("Session expired");
          return;
        }

        const profile = await getAdvisorProfile({
          endpoint: cloudSettings.endpoint,
          accessToken,
        });
        setAuthState(`Connected as ${profile.user.username}`);
      } catch {
        const refreshed = await refreshAccessTokenIfNeeded();
        if (refreshed) {
          setAuthState(`Connected as ${authSession.user.username}`);
        } else {
          setAuthState("Session expired");
        }
      } finally {
        setIsAuthChecking(false);
      }
    }

    void verifySession();
  }, [authSession?.accessToken, cloudSettings.endpoint, isReady, isUnlocked]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId]
  );

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        !searchQuery.trim() ||
        [client.name, client.email, client.phone, client.city, client.riskProfile]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase());

      const matchesCategory =
        categoryFilter === "All" || client.category === categoryFilter;

      const matchesMode =
        filterMode === "All" ||
        (filterMode === "Due" && isReminderDue(client.reminderDate)) ||
        (filterMode === "High Priority" && client.priority === "High");

      return matchesSearch && matchesCategory && matchesMode;
    });
  }, [categoryFilter, clients, filterMode, searchQuery]);

  const dueClients = useMemo(
    () => clients.filter((client) => isReminderDue(client.reminderDate)),
    [clients]
  );

  const highPriorityClients = useMemo(
    () => clients.filter((client) => client.priority === "High"),
    [clients]
  );

  const broadcastTargets = useMemo(
    () => clients.filter((client) => selectedClientIds.includes(client.id)),
    [clients, selectedClientIds]
  );
  const broadcastPreview = useMemo(() => {
    const eligible = broadcastTargets.filter((client) =>
      Boolean(resolveBroadcastContact(client, broadcastChannel))
    );
    const skipped = broadcastTargets
      .filter((client) => !resolveBroadcastContact(client, broadcastChannel))
      .map((client) => ({
        id: client.id,
        name: client.name,
        reason:
          broadcastChannel === "Email"
            ? "Missing email"
            : broadcastChannel === "SMS" || broadcastChannel === "WhatsApp"
              ? "Missing phone"
              : `Missing ${client.preferredChannel === "Email" ? "email" : "phone"}`,
      }));

    return {
      eligible,
      skipped,
    };
  }, [broadcastChannel, broadcastTargets]);

  const portfolioStats = useMemo(() => {
  if (!selectedClient || !Array.isArray(selectedClient.portfolio)) {
    return {
      invested: 0,
      current: 0,
      holdings: 0,
    };
  }

  const invested = selectedClient.portfolio.reduce(
    (sum, holding) => sum + numericValue(holding.investedValue),
    0
  );

  const current = selectedClient.portfolio.reduce(
    (sum, holding) => sum + numericValue(holding.currentValue),
    0
  );

  return {
    invested,
    current,
    holdings: selectedClient.portfolio.length,
  };
  }, [selectedClient]);

  const unifiedPortfolioAnalytics = useMemo(() => {
    const holdings = clients.flatMap((client) =>
      (client.portfolio ?? []).map((holding) => {
        const assetClass = holding.assetClass ?? "Stocks";
        const invested = numericValue(holding.investedValue);
        const current = numericValue(holding.currentValue);
        const gainLoss = current - invested;
        const returnPct = invested > 0 ? (gainLoss / invested) * 100 : 0;

        return {
          ...holding,
          assetClass,
          clientId: client.id,
          clientName: client.name,
          invested,
          current,
          gainLoss,
          returnPct,
        };
      })
    );

    const totalInvested = holdings.reduce((sum, holding) => sum + holding.invested, 0);
    const totalCurrent = holdings.reduce((sum, holding) => sum + holding.current, 0);
    const totalGainLoss = totalCurrent - totalInvested;

    const allocation = ASSET_CLASS_OPTIONS.map((assetClass) => {
      const currentValue = holdings
        .filter((holding) => holding.assetClass === assetClass)
        .reduce((sum, holding) => sum + holding.current, 0);
      const investedValue = holdings
        .filter((holding) => holding.assetClass === assetClass)
        .reduce((sum, holding) => sum + holding.invested, 0);
      return {
        assetClass,
        currentValue,
        investedValue,
        weight: totalCurrent > 0 ? (currentValue / totalCurrent) * 100 : 0,
      };
    }).filter((item) => item.currentValue > 0 || item.investedValue > 0);

    const sortedByReturn = [...holdings].sort((a, b) => b.returnPct - a.returnPct);
    const topPerformers = sortedByReturn.slice(0, 3);
    const laggards = [...sortedByReturn].reverse().slice(0, 3);

    const clientSummaries = clients
      .map((client) => {
        const clientHoldings = holdings.filter((holding) => holding.clientId === client.id);
        const invested = clientHoldings.reduce((sum, holding) => sum + holding.invested, 0);
        const current = clientHoldings.reduce((sum, holding) => sum + holding.current, 0);
        return {
          clientId: client.id,
          clientName: client.name,
          category: client.category,
          invested,
          current,
          gainLoss: current - invested,
          holdings: clientHoldings.length,
        };
      })
      .filter((item) => item.holdings > 0)
      .sort((a, b) => b.current - a.current)
      .slice(0, 5);

    const riskFlags: string[] = [];
    const largestHolding = [...holdings].sort((a, b) => b.current - a.current)[0];
    if (largestHolding && totalCurrent > 0) {
      const concentration = (largestHolding.current / totalCurrent) * 100;
      if (concentration >= 35) {
        riskFlags.push(
          `${largestHolding.assetName} is concentrated at ${concentration.toFixed(1)}% of the tracked portfolio.`
        );
      }
    }
    const largestAssetClass = [...allocation].sort((a, b) => b.weight - a.weight)[0];
    if (largestAssetClass && largestAssetClass.weight >= 60) {
      riskFlags.push(
        `${largestAssetClass.assetClass} dominates allocation at ${largestAssetClass.weight.toFixed(1)}%.`
      );
    }
    const untrackedClients = clients.filter((client) => (client.portfolio ?? []).length === 0);
    if (untrackedClients.length) {
      riskFlags.push(
        `${untrackedClients.length} client${untrackedClients.length === 1 ? " has" : "s have"} no portfolio data yet.`
      );
    }
    if (!riskFlags.length) {
      riskFlags.push("No major allocation concentration flags detected in tracked data.");
    }

    return {
      holdings,
      totalInvested,
      totalCurrent,
      totalGainLoss,
      totalClientsTracked: clientSummaries.length,
      allocation,
      topPerformers,
      laggards,
      clientSummaries,
      riskFlags,
    };
  }, [clients]);

  const cashFlowResults = useMemo(() => {
    const principal = numericValue(cashFlowAmount);
    const annualRate = numericValue(cashFlowRate);
    const years = numericValue(cashFlowYears);

    if (!principal || !annualRate || !years) {
      return {
        ready: false,
        payoutPerPeriod: 0,
        totalInterest: 0,
        maturityValue: 0,
        annualInterest: 0,
        periods: 0,
      };
    }

    const periodsPerYear =
      cashFlowFrequency === "Monthly"
        ? 12
        : cashFlowFrequency === "Quarterly"
        ? 4
        : 1;
    const periods = periodsPerYear * years;
    const annualInterest = principal * (annualRate / 100);

    if (cashFlowMode === "Payout") {
      const payoutPerPeriod = annualInterest / periodsPerYear;
      const totalInterest = annualInterest * years;
      return {
        ready: true,
        payoutPerPeriod,
        totalInterest,
        maturityValue: principal,
        annualInterest,
        periods,
      };
    }

    const periodRate = annualRate / 100 / periodsPerYear;
    const maturityValue = principal * Math.pow(1 + periodRate, periods);
    const totalInterest = maturityValue - principal;
    const payoutPerPeriod = totalInterest / periods;

    return {
      ready: true,
      payoutPerPeriod,
      totalInterest,
      maturityValue,
      annualInterest,
      periods,
    };
  }, [
    cashFlowAmount,
    cashFlowFrequency,
    cashFlowMode,
    cashFlowRate,
    cashFlowYears,
  ]);

  const sipResults = useMemo(() => {
    const installment = numericValue(sipAmount);
    const annualRate = numericValue(sipRate);
    const years = numericValue(sipYears);

    if (!installment || !annualRate || !years) {
      return {
        ready: false,
        totalInvested: 0,
        estimatedReturns: 0,
        maturityValue: 0,
        installments: 0,
      };
    }

    const periodsPerYear = sipFrequency === "Monthly" ? 12 : 4;
    const installments = periodsPerYear * years;
    const ratePerPeriod = annualRate / 100 / periodsPerYear;
    const totalInvested = installment * installments;

    const maturityValue =
      ratePerPeriod === 0
        ? totalInvested
        : installment *
          (((Math.pow(1 + ratePerPeriod, installments) - 1) / ratePerPeriod) *
            (1 + ratePerPeriod));

    const estimatedReturns = maturityValue - totalInvested;

    return {
      ready: true,
      totalInvested,
      estimatedReturns,
      maturityValue,
      installments,
    };
  }, [sipAmount, sipFrequency, sipRate, sipYears]);

  const goalPlannerResults = useMemo(() => {
    const targetAmount = numericValue(goalTargetAmount);
    const annualRate = numericValue(goalExpectedReturn);
    const years = numericValue(goalYears);

    if (!targetAmount || !annualRate || !years) {
      return {
        ready: false,
        requiredMonthlySip: 0,
        totalInvested: 0,
        estimatedGrowth: 0,
      };
    }

    const periods = years * 12;
    const monthlyRate = annualRate / 100 / 12;
    const requiredMonthlySip =
      monthlyRate === 0
        ? targetAmount / periods
        : targetAmount /
          (((Math.pow(1 + monthlyRate, periods) - 1) / monthlyRate) *
            (1 + monthlyRate));
    const totalInvested = requiredMonthlySip * periods;

    return {
      ready: true,
      requiredMonthlySip,
      totalInvested,
      estimatedGrowth: targetAmount - totalInvested,
    };
  }, [goalExpectedReturn, goalTargetAmount, goalYears]);

  const retirementResults = useMemo(() => {
    const monthlyExpense = numericValue(retirementMonthlyExpense);
    const inflation = numericValue(retirementInflation);
    const returnRate = numericValue(retirementReturn);
    const yearsToRetire = numericValue(retirementYearsToRetire);
    const retirementYears = numericValue(retirementYearsAfterRetire);

    if (
      !monthlyExpense ||
      !inflation ||
      !returnRate ||
      !yearsToRetire ||
      !retirementYears
    ) {
      return {
        ready: false,
        futureMonthlyExpense: 0,
        targetCorpus: 0,
        requiredMonthlySip: 0,
      };
    }

    const futureMonthlyExpense =
      monthlyExpense * Math.pow(1 + inflation / 100, yearsToRetire);
    const annualExpenseAtRetirement = futureMonthlyExpense * 12;
    const realReturn = (1 + returnRate / 100) / (1 + inflation / 100) - 1;
    const targetCorpus =
      realReturn > 0
        ? annualExpenseAtRetirement *
          ((1 - Math.pow(1 + realReturn, -retirementYears)) / realReturn)
        : annualExpenseAtRetirement * retirementYears;
    const monthlyRate = returnRate / 100 / 12;
    const periods = yearsToRetire * 12;
    const requiredMonthlySip =
      monthlyRate === 0
        ? targetCorpus / periods
        : targetCorpus /
          (((Math.pow(1 + monthlyRate, periods) - 1) / monthlyRate) *
            (1 + monthlyRate));

    return {
      ready: true,
      futureMonthlyExpense,
      targetCorpus,
      requiredMonthlySip,
    };
  }, [
    retirementInflation,
    retirementMonthlyExpense,
    retirementReturn,
    retirementYearsAfterRetire,
    retirementYearsToRetire,
  ]);

  const activeResearchSummary = useMemo(
    () =>
      compactText(
        aiResearchResult?.summary || marketResearchNotes,
        marketMessage || "Markets remain selective and risk-managed positioning is preferred."
      ),
    [aiResearchResult?.summary, marketMessage, marketResearchNotes]
  );

  const selectedClientInsights = useMemo(
    () => (selectedClient ? clientInsightList(selectedClient) : []),
    [selectedClient]
  );

  const selectedClientMessageDraft = useMemo(() => {
    if (!selectedClient) {
      return "";
    }
    return personalizedClientMessage(selectedClient, activeResearchSummary);
  }, [activeResearchSummary, selectedClient]);

  const selectedClientReportDraft = useMemo(() => {
    if (!selectedClient) {
      return "";
    }
    return [
      `Client Report: ${selectedClient.name}`,
      `Category: ${selectedClient.category}`,
      `Risk Profile: ${selectedClient.riskProfile || "Not assigned"}`,
      `Location: ${selectedClient.city || "Not saved"}`,
      `Preferred Channel: ${selectedClient.preferredChannel}`,
      `Portfolio Allocation: ${selectedClient.allocation || "Not saved"}`,
      `Tracked Holdings: ${selectedClient.portfolio.length}`,
      `Next Reminder: ${formatReminderDate(selectedClient.reminderDate)}`,
      `Market View: ${activeResearchSummary}`,
      `Advisor Notes: ${selectedClient.notes || "No private notes added yet."}`,
    ].join("\n");
  }, [activeResearchSummary, selectedClient]);

  const goalCenterStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const rows = goals.map((goal) => {
      const target = numericValue(goal.targetAmount);
      const current = numericValue(goal.currentAmount);
      const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
      const gap = Math.max(target - current, 0);
      const yearsLeft = Math.max(Number(goal.targetYear) - currentYear, 0);
      return {
        ...goal,
        progress,
        gap,
        yearsLeft,
      };
    });

    return {
      rows,
      totalTarget: rows.reduce((sum, goal) => sum + numericValue(goal.targetAmount), 0),
      totalCurrent: rows.reduce((sum, goal) => sum + numericValue(goal.currentAmount), 0),
      urgentGoals: rows.filter((goal) => goal.yearsLeft <= 3).length,
    };
  }, [goals]);

  const taxReporting = useMemo(() => {
    const unrealizedGain = unifiedPortfolioAnalytics.holdings.reduce(
      (sum, holding) => sum + Math.max(holding.gainLoss, 0),
      0
    );
    const unrealizedLoss = unifiedPortfolioAnalytics.holdings.reduce(
      (sum, holding) => sum + Math.min(holding.gainLoss, 0),
      0
    );
    const taxSensitiveHoldings = unifiedPortfolioAnalytics.holdings
      .filter((holding) => holding.gainLoss > 0 || holding.gainLoss < 0)
      .sort((a, b) => Math.abs(b.gainLoss) - Math.abs(a.gainLoss))
      .slice(0, 4);
    const taxHints: string[] = [];
    if (unrealizedLoss < 0) {
      taxHints.push(
        `Potential harvesting review: ${currencyDisplay(`${Math.abs(unrealizedLoss)}`)} of unrealized losses are visible in tracked holdings.`
      );
    }
    if (unrealizedGain > 0) {
      taxHints.push(
        `Unrealized gains currently stand near ${currencyDisplay(`${unrealizedGain}`)} and may need tax-aware planning before exits.`
      );
    }
    if (!taxHints.length) {
      taxHints.push("Tax view is limited until more holding values and transaction history are tracked.");
    }

    return {
      unrealizedGain,
      unrealizedLoss,
      taxSensitiveHoldings,
      taxHints,
    };
  }, [unifiedPortfolioAnalytics]);

  const aggregationSnapshot = useMemo(() => {
    const totalExternalValue = connectedAccounts.reduce(
      (sum, account) => sum + numericValue(account.currentValue),
      0
    );
    const connectedCount = connectedAccounts.filter(
      (account) => account.status === "Connected"
    ).length;
    return {
      totalExternalValue,
      connectedCount,
      reviewCount: connectedAccounts.length - connectedCount,
    };
  }, [connectedAccounts]);

  const dashboardStats = useMemo(
    () => [
      {
        label: "Portfolio Summary",
        value: currencyDisplay(`${unifiedPortfolioAnalytics.totalCurrent}`),
      },
      { label: "Client Count", value: `${clients.length}` },
      { label: "Due Today", value: `${dueClients.length}` },
      { label: "High Priority", value: `${highPriorityClients.length}` },
    ],
    [
      clients.length,
      dueClients.length,
      highPriorityClients.length,
      unifiedPortfolioAnalytics.totalCurrent,
    ]
  );

  const categorySummary = useMemo(
    () =>
      CATEGORY_OPTIONS.map((category) => ({
        label: category,
        value: `${clients.filter((client) => client.category === category).length}`,
      })),
    [clients]
  );

  const recentClients = useMemo(
    () =>
      [...clients]
        .sort((a, b) => {
          const aTime = Date.parse(a.lastContact || "") || 0;
          const bTime = Date.parse(b.lastContact || "") || 0;
          return bTime - aTime;
        })
        .slice(0, 5),
    [clients]
  );

  const dashboardAnalytics = useMemo(() => {
    const topPerformer = unifiedPortfolioAnalytics.topPerformers[0];
    const biggestCategory = categorySummary
      .slice()
      .sort((a, b) => Number(b.value) - Number(a.value))[0];

    return [
      {
        label: "Tracked Holdings",
        value: `${unifiedPortfolioAnalytics.holdings.length}`,
      },
      {
        label: "Gain / Loss",
        value: currencyDisplay(`${unifiedPortfolioAnalytics.totalGainLoss}`),
      },
      {
        label: "Top Performer",
        value: topPerformer ? topPerformer.assetName : "No data yet",
      },
      {
        label: "Largest Client Segment",
        value: biggestCategory ? biggestCategory.label : "No data yet",
      },
    ];
  }, [
    categorySummary,
    unifiedPortfolioAnalytics.holdings.length,
    unifiedPortfolioAnalytics.topPerformers,
    unifiedPortfolioAnalytics.totalGainLoss,
  ]);

  const dashboardReminderKpis = useMemo(() => {
    const today = todayISO();
    const scheduledClients = clients.filter((client) => Boolean(client.reminderDate));
    const dueTodayCount = scheduledClients.filter(
      (client) => client.reminderDate === today
    ).length;
    const overdueCount = scheduledClients.filter(
      (client) => client.reminderDate < today
    ).length;
    const upcomingCount = scheduledClients.filter(
      (client) => client.reminderDate > today
    ).length;

    return {
      dueToday: dueTodayCount,
      overdue: overdueCount,
      upcoming: upcomingCount,
    };
  }, [clients]);

  const visibleTabs = useMemo(
    () => [
      { key: "Dashboard" as AppTab, label: "Dashboard" },
      { key: "Clients" as AppTab, label: "Clients" },
      { key: "Portfolios" as AppTab, label: "Portfolios" },
      { key: "Tools" as AppTab, label: "Tools" },
      { key: "Workspace" as AppTab, label: "Workspace" },
      { key: "Settings" as AppTab, label: "Settings" },
    ],
    []
  );

  async function handleBiometricUnlock() {
    const result = await localAuth.authenticateAsync({
      promptMessage: "Unlock Asset Array",
      cancelLabel: "Cancel",
      fallbackLabel: "Use PIN",
    });

    if (result.success) {
      setIsUnlocked(true);
      setPinInput("");
    }
  }

  async function setupPinAction() {
    if (pinSetup.length < 4) {
      Alert.alert("PIN too short", "Please create a PIN with at least 4 digits.");
      return;
    }

    await storageService.setSecureItem(PIN_KEY, pinSetup);
    setStoredPin(pinSetup);
    setPinSetup("");
    setIsUnlocked(true);
  }

  function unlockAction() {
    if (pinInput === storedPin) {
      setIsUnlocked(true);
      setPinInput("");
      return;
    }

    Alert.alert("Access denied", "The PIN you entered is incorrect.");
  }

  function openAddModal() {
    setEditorMode("add");
    setDraft(emptyDraft);
    setIsEditorOpen(true);
  }

  function openEditModal(client: Client) {
    setEditorMode("edit");
    setDraft(buildDraftFromClient(client));
    setSelectedClientId(client.id);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setDraft(emptyDraft);
  }

  function updateDraft<K extends keyof ClientDraft>(key: K, value: ClientDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submitDraft() {
    if (!draft.name.trim() || !draft.phone.trim()) {
      Alert.alert("Missing details", "Client name and phone number are required.");
      return;
    }

    if (editorMode === "add") {
      const next = buildClientFromDraft(draft);
      setClients((current) => [next, ...current]);
      setSelectedClientId(next.id);
    } else if (selectedClient) {
      const updated = buildClientFromDraft(draft, selectedClient);
      setClients((current) =>
        current.map((client) => (client.id === updated.id ? updated : client))
      );
      setSelectedClientId(updated.id);
    }

    closeEditor();
  }

  function deleteClient(client: Client) {
    Alert.alert(
      "Delete client",
      `Remove ${client.name} and all linked notes from Asset Array?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setClients((current) =>
              current.filter((item) => item.id !== client.id)
            );
            setSelectedClientIds((current) =>
              current.filter((clientId) => clientId !== client.id)
            );
            if (selectedClientId === client.id) {
              setSelectedClientId(null);
            }
          },
        },
      ]
    );
  }

  async function seedDemoClients() {
    const nonDemo = clients.filter((c) => !c.id.startsWith("demo-client-"));
    const updated = [...(DEMO_CLIENTS as unknown as Client[]), ...nonDemo];
    setClients(updated);
    await persistClients(updated);
    setSelectedClientId(updated[0].id);
    await triggerSuccessHaptic();
    Alert.alert("Demo Roster Loaded", "Loaded 3 institutional client portfolios with holdings for judge evaluation!");
  }

  function toggleSelectedClient(clientId: string) {
    setSelectedClientIds((current) =>
      current.includes(clientId)
        ? current.filter((id) => id !== clientId)
        : [...current, clientId]
    );
  }

  function selectAllVisibleClients() {
    setSelectedClientIds(filteredClients.map((client) => client.id));
  }

  function clearSelectedClients() {
    setSelectedClientIds([]);
  }

  async function contactClient(client: Client, channel: Channel) {
    const encodedMessage = encodeURIComponent(
      `Hello ${client.name}, ${marketMessage}`
    );

    const targets: Record<Channel, string> = {
      Phone: `tel:${client.phone}`,
      SMS: `sms:${client.phone}?body=${encodedMessage}`,
      Email: `mailto:${client.email}?subject=Asset Array Market Update&body=${encodedMessage}`,
      WhatsApp: `https://wa.me/${client.phone.replace(/[^\d]/g, "")}?text=${encodedMessage}`,
    };

    const url = targets[channel];
    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      Alert.alert(
        "Action unavailable",
        `This device cannot open ${channel} for the selected client.`
      );
      return;
    }

    await Linking.openURL(url);
    const stamp = formatDate();
    const historyItem = `${stamp}: ${marketMessage}`;

    setClients((current) =>
      current.map((item) =>
        item.id === client.id
          ? {
              ...item,
              lastContact: stamp,
              updateHistory: [historyItem, ...item.updateHistory].slice(0, 10),
            }
          : item
      )
    );
  }

  async function openSystemLink(url: string, errorTitle: string, errorMessage: string) {
    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      Alert.alert(errorTitle, errorMessage);
      return;
    }

    await Linking.openURL(url);
  }

  function openPrivacyPolicy() {
    setAboutSheet("Privacy Policy");
  }

  function openTermsAndConditions() {
    setAboutSheet("Terms & Conditions");
  }

  async function contactSupport() {
    await openSystemLink(
      `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Asset Array Support")}`,
      "Support unavailable",
      "This device cannot open the support email composer."
    );
  }

  async function reportBug() {
    await openSystemLink(
      `mailto:${BUG_REPORT_EMAIL}?subject=${encodeURIComponent("Asset Array Bug Report")}`,
      "Bug reporting unavailable",
      "This device cannot open the bug report email composer."
    );
  }

  async function toggleBiometric(value: boolean) {
    if (value && !biometricAvailable) {
      Alert.alert(
        "Biometric unavailable",
        "This device does not have biometric authentication enabled."
      );
      return;
    }

    setBiometricEnabled(value);
    await persistBiometric(value);
  }

  async function toggleDarkMode(value: boolean) {
    setDarkModeEnabled(value);
    await persistDarkMode(value);
  }

  async function toggleHaptics(value: boolean) {
    setHapticsEnabledState(value);
    setHapticsEnabled(value);
    await persistHaptics(value);
  }

  async function saveCloudSettingsAction() {
    if (cloudSettings.endpoint.trim() && !isValidBackendEndpoint(cloudSettings.endpoint)) {
      Alert.alert("Invalid backend URL", "Backend URL must be a valid http or https address.");
      return;
    }

    await persistCloudSettings(cloudSettings);
    setIsSyncModalOpen(false);
    setSyncState(
      cloudSettings.endpoint.trim()
        ? `Cloud sync configured${authSession ? " + auth active" : ""}`
        : "Offline only"
    );
  }

  async function refreshAccessTokenIfNeeded() {
    if (!authSession || !cloudSettings.endpoint.trim()) {
      return null;
    }

    if (authSession.expiresAt > Date.now() + 15_000) {
      return authSession.accessToken;
    }

    try {
      const next = await refreshAdvisorToken({
        endpoint: cloudSettings.endpoint,
        refreshToken: authSession.refreshToken,
      });
      const nextSession: AuthSession = {
        user: next.user,
        accessToken: next.accessToken,
        refreshToken: next.refreshToken,
        expiresAt: Date.now() + next.expiresIn * 1000,
      };
      setAuthSession(nextSession);
      await persistAuthSession(nextSession);
      setAuthState(`Connected as ${nextSession.user.username}`);
      return nextSession.accessToken;
    } catch {
      setAuthSession(null);
      await persistAuthSession(null);
      setAuthState("Session expired");
      return null;
    }
  }

  async function loginToBackend() {
    if (!cloudSettings.endpoint.trim()) {
      Alert.alert("Backend URL needed", "Add backend URL before signing in.");
      return;
    }
    if (!cloudSettings.authUsername.trim() || !authPassword.trim()) {
      Alert.alert("Credentials missing", "Enter username and password.");
      return;
    }

    try {
      setAuthState("Signing in...");
      await persistCloudSettings(cloudSettings);
      const response = await loginAdvisor({
        endpoint: cloudSettings.endpoint,
        username: cloudSettings.authUsername.trim(),
        password: authPassword,
      });
      const session: AuthSession = {
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: Date.now() + response.expiresIn * 1000,
      };
      setAuthSession(session);
      await persistAuthSession(session);
      setAuthPassword("");
      setAuthState(`Connected as ${session.user.username}`);
      setSyncState("Cloud sync configured + auth active");
      Alert.alert("Login successful", `Signed in as ${session.user.username}.`);
    } catch (error) {
      setAuthState("Login failed");
      Alert.alert("Login failed", error instanceof Error ? error.message : "Unable to login.");
    }
  }

  async function quickDemoLogin() {
    const targetEndpoint = cloudSettings.endpoint.trim() || DEFAULT_BACKEND_ENDPOINT;
    const targetUser = "admin";
    const targetPass = "AssetArrayLocalAdmin2026";

    setCloudSettings((c) => ({
      ...c,
      endpoint: targetEndpoint,
      authUsername: targetUser,
    }));
    setAuthPassword(targetPass);

    try {
      setAuthState("Signing in as demo admin...");
      await persistCloudSettings({
        ...cloudSettings,
        endpoint: targetEndpoint,
        authUsername: targetUser,
      });
      const response = await loginAdvisor({
        endpoint: targetEndpoint,
        username: targetUser,
        password: targetPass,
      });
      const session: AuthSession = {
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: Date.now() + response.expiresIn * 1000,
      };
      setAuthSession(session);
      await persistAuthSession(session);
      setAuthPassword("");
      setAuthState(`Connected as ${session.user.username}`);
      setSyncState("Cloud sync configured + auth active");
      Alert.alert("Login successful", `Signed in as ${session.user.username}.`);
    } catch (error) {
      setAuthState("Login failed");
      Alert.alert(
        "Backend Connection Notice",
        (error instanceof Error ? error.message : "Unable to login.") +
          "\n\nTip: If the Render cloud backend was asleep, please retry in 10-15 seconds, or tap 'Continue in Offline Mode'."
      );
    }
  }

  async function continueOffline() {
    const offlineSession: AuthSession = {
      user: {
        id: "advisor-offline",
        username: cloudSettings.ownerName.trim() || "Lead Advisor",
        role: "advisor",
        createdAt: new Date().toISOString(),
        active: true,
      },
      accessToken: "offline-access-token",
      refreshToken: "offline-refresh-token",
      expiresAt: Date.now() + 86400 * 1000 * 30,
    };
    setAuthSession(offlineSession);
    await persistAuthSession(offlineSession);
    setAuthState("Offline mode active");
    setSyncState("Local storage only");
  }

  async function logoutFromBackend() {
    const session = authSession;
    if (session && cloudSettings.endpoint.trim()) {
      try {
        let accessToken = session.accessToken;
        if (session.expiresAt <= Date.now() + 15_000) {
          const refreshed = await refreshAdvisorToken({
            endpoint: cloudSettings.endpoint,
            refreshToken: session.refreshToken,
          });
          accessToken = refreshed.accessToken;
        }

        await logoutAdvisor({
          endpoint: cloudSettings.endpoint,
          accessToken,
          refreshToken: session.refreshToken,
        });
      } catch {
        // Local logout still protects the app if the server is unreachable.
      }
    }
    setAuthSession(null);
    setAuthPassword("");
    setSelectedClientIds([]);
    await persistAuthSession(null);
    setAuthState("Not connected");
    setSyncState(cloudSettings.endpoint.trim() ? "Cloud sync configured" : "Offline only");
  }

  async function runAiResearch() {
    await runAiResearchForQuery(aiResearchQuery.trim());
  }

  async function runAiResearchForQuery(query: string) {
    if (!query) {
      Alert.alert(
        "Research topic needed",
        "Enter a stock, company, fund, ETF, sector, or market topic."
      );
      return;
    }

    if (!cloudSettings.endpoint.trim()) {
      Alert.alert("Backend URL needed", "Configure your backend URL before using AI Research.");
      return;
    }

    try {
      setIsAiResearchLoading(true);
      setAiResearchState("Researching...");
      const accessToken = await refreshAccessTokenIfNeeded();
      if (!accessToken) {
        setAiResearchState("Backend login required");
        Alert.alert(
          "Backend login required",
          "Sign in to the backend before generating AI research."
        );
        return;
      }
      const result = await requestAiResearch({
        endpoint: cloudSettings.endpoint,
        query,
        accessToken,
        onUnauthorized: refreshAccessTokenIfNeeded,
      });
      setAiResearchQuery(query);
      setAiResearchResult(result);
      setAiResearchState(`Research complete for ${query}`);
    } catch (error) {
      setAiResearchState("Research failed");
      Alert.alert(
        "AI research failed",
        error instanceof Error ? error.message : "Unable to complete AI research."
      );
    } finally {
      setIsAiResearchLoading(false);
    }
  }

  async function runWorkspaceAiBrief() {
    await runAiResearchForQuery(marketResearchNotes.trim());
  }

  async function refreshLiveMarketPrices() {
    try {
      setIsMarketRefreshing(true);
      const quotes = await fetchLiveMarketQuotes();
      
      let updatedCount = 0;
      setClients((prevClients) =>
        prevClients.map((client) => {
          if (!client.portfolio || client.portfolio.length === 0) return client;
          const updatedPortfolio = client.portfolio.map((holding) => {
            const symbolKey = (holding.ticker || holding.assetName).toUpperCase().trim();
            const quote = quotes[symbolKey] || getQuoteForSymbol(symbolKey);
            if (quote) {
              updatedCount++;
              const qty = Number(holding.quantity) || 1;
              return {
                ...holding,
                currentValue: (quote.price * qty).toFixed(2),
              };
            }
            return holding;
          });
          return { ...client, portfolio: updatedPortfolio };
        })
      );

      Alert.alert(
        "Market Prices Updated",
        `Live market quotes fetched successfully. Updated ${updatedCount} holding valuation(s).`
      );
    } catch (err) {
      Alert.alert("Market Fetch Error", "Unable to refresh live market prices.");
    } finally {
      setIsMarketRefreshing(false);
    }
  }

  async function runClientAiCoPilot(targetClient: Client) {
    if (!isPro) {
      setIsPaywallVisible(true);
      return;
    }
    if (!cloudSettings.endpoint.trim()) {
      Alert.alert("Backend URL needed", "Configure your backend URL before using AI Co-Pilot.");
      return;
    }

    try {
      setIsClientAiLoading(true);
      setSelectedAiClient(targetClient);
      const accessToken = await refreshAccessTokenIfNeeded();
      if (!accessToken) {
        Alert.alert("Backend Login Required", "Please sign in to backend to use AI Co-Pilot.");
        return;
      }

      const recommendation = await analyzeClientPortfolioWithAI({
        endpoint: cloudSettings.endpoint,
        client: targetClient,
        accessToken,
        onUnauthorized: refreshAccessTokenIfNeeded,
      });

      setClientAiRecommendation(recommendation);
    } catch (err) {
      Alert.alert(
        "AI Co-Pilot Error",
        err instanceof Error ? err.message : "Failed to analyze client portfolio."
      );
    } finally {
      setIsClientAiLoading(false);
    }
  }

  function useAiBriefAsDailyMessage() {
    if (!aiResearchResult) {
      Alert.alert("Generate research first", "Create an AI brief before using it as your market message.");
      return;
    }

    const nextMessage = compactText(
      `${aiResearchResult.summary} Short term: ${aiResearchResult.shortTermOutlook}`,
      marketMessage
    );
    setMarketMessage(nextMessage);
    setBroadcastMessage(nextMessage);
    Alert.alert("Daily message updated", "The AI brief is now set as your default outreach message.");
  }

  function updateGoalDraft<K extends keyof GoalDraft>(key: K, value: GoalDraft[K]) {
    setGoalDraft((current) => ({ ...current, [key]: value }));
  }

  function saveGoalFromDraft() {
    if (!goalDraft.title.trim() || !goalDraft.targetAmount.trim()) {
      Alert.alert("Goal missing", "Please enter at least a goal title and target amount.");
      return;
    }

    setGoals((current) => [
      {
        id: `${Date.now()}`,
        ...goalDraft,
      },
      ...current,
    ]);
    setGoalDraft(emptyGoalDraft);
  }

  function addSelectedClientReportToVault() {
    if (!selectedClient) {
      Alert.alert("Select a client", "Open a client first before saving a report.");
      return;
    }

    const doc: VaultDocument = {
      id: `${Date.now()}`,
      clientName: selectedClient.name,
      fileName: `${selectedClient.name.replace(/\s+/g, "_")}_review_report.txt`,
      category: "Report",
      date: formatDate(),
      status: "Stored",
    };
    setVaultDocuments((current) => [doc, ...current]);
    Alert.alert("Saved to vault", "Client report draft has been stored in the document vault.");
  }

  function updateAdvisorMessageDraft<K extends keyof AdvisorMessageDraft>(
    key: K,
    value: AdvisorMessageDraft[K]
  ) {
    setAdvisorMessageDraft((current) => ({ ...current, [key]: value }));
  }

  function saveAdvisorMessageDraftAction() {
    if (!advisorMessageDraft.clientName.trim() || !advisorMessageDraft.title.trim()) {
      Alert.alert("Message missing", "Enter client name and message title first.");
      return;
    }

    const next: AdvisorMessage = {
      id: `${Date.now()}`,
      clientName: advisorMessageDraft.clientName.trim(),
      title: advisorMessageDraft.title.trim(),
      body: advisorMessageDraft.body.trim() || "No body added yet.",
      date: formatDate(),
      status: "Pending",
    };
    setAdvisorMessages((current) => [next, ...current]);
    setAdvisorMessageDraft(emptyAdvisorMessageDraft);
  }

  function saveVaultDocumentDraftAction() {
    if (!vaultDocumentDraft.clientName.trim() || !vaultDocumentDraft.fileName.trim()) {
      Alert.alert("Document missing", "Enter client name and file name first.");
      return;
    }

    const next: VaultDocument = {
      id: `${Date.now()}`,
      clientName: vaultDocumentDraft.clientName.trim(),
      fileName: vaultDocumentDraft.fileName.trim(),
      category: vaultDocumentDraft.category,
      date: formatDate(),
      status: "Stored",
    };
    setVaultDocuments((current) => [next, ...current]);
    setVaultDocumentDraft(emptyVaultDocumentDraft);
  }

  async function syncToCloud() {
    if (!storedPin) {
      return;
    }

    if (!cloudSettings.endpoint.trim()) {
      Alert.alert("Cloud setup needed", "Add your backend URL before syncing.");
      return;
    }

    try {
      setSyncState("Pushing encrypted backup...");
      const accessToken = await refreshAccessTokenIfNeeded();
      if (!accessToken) {
        setSyncState("Backend login required");
        Alert.alert("Backend login required", "Sign in before pushing encrypted backup.");
        return;
      }
      const encryptedPayload = encryptPayload(
        {
          app: "Asset Array",
          ownerName: cloudSettings.ownerName.trim(),
          exportedAt: new Date().toISOString(),
          clients,
          marketMessage,
        },
        storedPin
      );

      await pushPayload({
        endpoint: cloudSettings.endpoint,
        ownerId: buildOwnerId(storedPin),
        ciphertext: encryptedPayload,
        accessToken,
        onUnauthorized: refreshAccessTokenIfNeeded,
      });

      setSyncState("Encrypted backup pushed");
      Alert.alert("Sync complete", "Encrypted client data has been pushed to cloud.");
    } catch (error) {
      setSyncState("Sync failed");
      Alert.alert(
        "Sync failed",
        error instanceof Error ? error.message : "Unable to push encrypted backup."
      );
    }
  }

  async function restoreFromCloud() {
    if (!storedPin) {
      return;
    }

    if (!cloudSettings.endpoint.trim()) {
      Alert.alert("Cloud setup needed", "Add your backend URL before restoring.");
      return;
    }

    try {
      setSyncState("Pulling encrypted backup...");
      const accessToken = await refreshAccessTokenIfNeeded();
      if (!accessToken) {
        setSyncState("Backend login required");
        Alert.alert("Backend login required", "Sign in before restoring encrypted backup.");
        return;
      }
      const payload = await pullPayload({
        endpoint: cloudSettings.endpoint,
        ownerId: buildOwnerId(storedPin),
        accessToken,
        onUnauthorized: refreshAccessTokenIfNeeded,
      });

      const decoded = decryptPayload<{
        clients?: Array<
          Client & {
            portfolio?: PortfolioHolding[];
            watchlist?: string[];
            updateHistory?: string[];
          }
        >;
        marketMessage?: string;
      }>(payload.ciphertext, storedPin);

      const safeClients = Array.isArray(decoded?.clients)
        ? decoded.clients.map((client) => ({
            ...client,
            portfolio: Array.isArray(client.portfolio) ? client.portfolio : [],
            watchlist: Array.isArray(client.watchlist) ? client.watchlist : [],
            updateHistory: Array.isArray(client.updateHistory)
              ? client.updateHistory
              : [],
          }))
        : [];

      setClients(safeClients);
      setMarketMessage(decoded?.marketMessage ?? defaultMessage);
      setBroadcastMessage(decoded?.marketMessage ?? defaultMessage);
      setSelectedClientId(safeClients.length > 0 ? safeClients[0].id : null);
      setSyncState("Encrypted backup restored");
      Alert.alert("Restore complete", "Cloud backup has been restored to this device.");
    } catch (error) {
      setSyncState("Restore failed");
      Alert.alert(
        "Restore failed",
        error instanceof Error ? error.message : "Unable to restore cloud backup."
      );
    }
  }

  function openAddHoldingModal() {
    if (!selectedClient) {
      Alert.alert("Select a client", "Open a client first to manage a portfolio.");
      return;
    }

    setPortfolioMode("add");
    setHoldingDraft(emptyHoldingDraft);
    setEditingHoldingId(null);
    setIsPortfolioModalOpen(true);
  }

  function openEditHoldingModal(holding: PortfolioHolding) {
    setPortfolioMode("edit");
    setHoldingDraft(buildHoldingDraftFromHolding(holding));
    setEditingHoldingId(holding.id);
    setIsPortfolioModalOpen(true);
  }

  function closeHoldingModal() {
    setIsPortfolioModalOpen(false);
    setHoldingDraft(emptyHoldingDraft);
    setEditingHoldingId(null);
  }

  function updateHoldingDraft<K extends keyof HoldingDraft>(
    key: K,
    value: HoldingDraft[K]
  ) {
    setHoldingDraft((current) => ({ ...current, [key]: value }));
  }

  function saveHolding() {
    if (!selectedClient) {
      return;
    }

    if (!holdingDraft.assetName.trim()) {
      Alert.alert("Missing asset name", "Give this portfolio item a name first.");
      return;
    }

    const existingHolding = selectedClient.portfolio.find(
      (holding) => holding.id === editingHoldingId
    );
    const nextHolding = buildHoldingFromDraft(holdingDraft, existingHolding);

    setClients((current) =>
      current.map((client) => {
        if (client.id !== selectedClient.id) {
          return client;
        }

        const nextPortfolio =
          portfolioMode === "add"
            ? [nextHolding, ...client.portfolio]
            : client.portfolio.map((holding) =>
                holding.id === nextHolding.id ? nextHolding : holding
              );

        return {
          ...client,
          portfolio: nextPortfolio,
        };
      })
    );

    closeHoldingModal();
  }

  function deleteHolding(holding: PortfolioHolding) {
    if (!selectedClient) {
      return;
    }

    Alert.alert(
      "Delete portfolio item",
      `Remove ${holding.assetName} from ${selectedClient.name}'s portfolio?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setClients((current) =>
              current.map((client) =>
                client.id === selectedClient.id
                  ? {
                      ...client,
                      portfolio: client.portfolio.filter(
                        (item) => item.id !== holding.id
                      ),
                    }
                  : client
              )
            );
          },
        },
      ]
    );
  }

  async function runBroadcastCampaign() {
    const effectiveTargets = broadcastTargets.length > 0 ? broadcastTargets : clients;
    if (!effectiveTargets.length) {
      Alert.alert(
        "No clients found",
        "Add at least one client before sending a bulk notification campaign."
      );
      return;
    }

    const messageToSend =
      broadcastMessage.trim() ||
      marketMessage.trim() ||
      "Asset Array Fiduciary Briefing: Your multi-asset private portfolio has been reviewed with active risk controls in place.";

    const validTargets =
      broadcastPreview.eligible.length > 0
        ? broadcastPreview.eligible
        : effectiveTargets.filter((c) => Boolean(resolveBroadcastContact(c, broadcastChannel)));

    if (!validTargets.length) {
      Alert.alert(
        "No valid recipients",
        `The selected clients do not have contact details required for ${broadcastChannel}.`
      );
      return;
    }

    // 1. If cloud sync is configured AND authenticated, attempt cloud API dispatch
    if (cloudSettings.endpoint.trim() && authSession) {
      try {
        setBroadcastState("Sending campaign...");
        const accessToken = await refreshAccessTokenIfNeeded();
        if (accessToken) {
          const response = await sendBroadcastCampaign({
            endpoint: cloudSettings.endpoint,
            ownerName: cloudSettings.ownerName || "Asset Array Owner",
            channel: broadcastChannel,
            message: messageToSend,
            accessToken,
            onUnauthorized: refreshAccessTokenIfNeeded,
            clients: validTargets.map((client) => ({
              id: client.id,
              name: client.name,
              phone: client.phone,
              email: client.email,
              preferredChannel: client.preferredChannel,
            })),
          });

          const stamp = formatDate();
          setClients((current) =>
            current.map((client) =>
              validTargets.some((target) => target.id === client.id)
                ? {
                    ...client,
                    lastContact: stamp,
                    updateHistory: [
                      `${stamp}: Cloud broadcast (${broadcastChannel}) - ${messageToSend}`,
                      ...client.updateHistory,
                    ].slice(0, 10),
                  }
                : client
            )
          );

          setBroadcastState(
            `${response.queuedCount} queued${response.skippedCount ? `, ${response.skippedCount} skipped` : ""}`
          );
          setIsBroadcastModalOpen(false);
          Alert.alert(
            "Campaign Dispatched",
            `Cloud broadcast queued for ${response.totalClients} clients via ${broadcastChannel}. Audit trail logged.`
          );
          return;
        }
      } catch (cloudError) {
        console.warn("Cloud broadcast error, falling back to direct device dispatch:", cloudError);
      }
    }

    // 2. Direct Device Native Dispatch (WhatsApp / SMS / Email) - works 100% anytime
    try {
      setBroadcastState("Opening device app...");
      const stamp = formatDate();
      const encodedMessage = encodeURIComponent(messageToSend);
      let dispatchUrl = "";

      if (
        broadcastChannel === "WhatsApp" ||
        (broadcastChannel === "Preferred" && validTargets.some((c) => c.preferredChannel === "WhatsApp"))
      ) {
        const firstPhone = validTargets.find((c) => c.phone)?.phone.replace(/[^\d]/g, "") || "";
        dispatchUrl = firstPhone
          ? `whatsapp://send?phone=${firstPhone}&text=${encodedMessage}`
          : `whatsapp://send?text=${encodedMessage}`;
      } else if (
        broadcastChannel === "Email" ||
        (broadcastChannel === "Preferred" && validTargets.some((c) => c.preferredChannel === "Email"))
      ) {
        const emails = validTargets.map((c) => c.email).filter(Boolean).join(",");
        dispatchUrl = `mailto:${emails}?subject=${encodeURIComponent("Asset Array Portfolio Briefing")}&body=${encodedMessage}`;
      } else {
        const phones = validTargets.map((c) => c.phone).filter(Boolean).join(",");
        dispatchUrl = `sms:${phones}?body=${encodedMessage}`;
      }

      const canOpen = await Linking.canOpenURL(dispatchUrl);
      if (canOpen) {
        await Linking.openURL(dispatchUrl);
      } else {
        if (dispatchUrl.startsWith("whatsapp://")) {
          await Linking.openURL(`https://api.whatsapp.com/send?text=${encodedMessage}`);
        }
      }

      setClients((current) =>
        current.map((client) =>
          validTargets.some((target) => target.id === client.id)
            ? {
                ...client,
                lastContact: stamp,
                updateHistory: [
                  `${stamp}: Direct broadcast (${broadcastChannel}) - ${messageToSend}`,
                  ...client.updateHistory,
                ].slice(0, 10),
              }
            : client
        )
      );

      setBroadcastState(`${validTargets.length} dispatched`);
      setIsBroadcastModalOpen(false);
      Alert.alert(
        "Broadcast Dispatched",
        `Direct outreach initiated for ${validTargets.length} clients via ${broadcastChannel}. Client interaction history updated.`
      );
    } catch (deviceError) {
      setBroadcastState("Broadcast failed");
      Alert.alert(
        "Dispatch Failed",
        deviceError instanceof Error ? deviceError.message : "Unable to open messaging app."
      );
    }
  }

  async function resetLock() {
    await storageService.removeSecureItem(PIN_KEY);
    await storageService.removeSecureItem(BIOMETRIC_KEY);
    setStoredPin(null);
    setPinInput("");
    setPinSetup("");
    setBiometricEnabled(false);
    setIsUnlocked(false);
  }

  if (!isReady) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar style="light" />
        <Text style={styles.loadingTitle}>Preparing Asset Array...</Text>
      </SafeAreaView>
    );
  }

  if (!storedPin || !isUnlocked) {
    const needsSetup = !storedPin;

    return (
      <SafeAreaView style={[styles.authScreen, darkModeEnabled ? styles.authScreenDark : null]}>
        <StatusBar style="light" />
        <View style={styles.authCard}>
          <Text style={styles.authEyebrow}>Asset Array</Text>
          <Text style={styles.authTitle}>
            {needsSetup ? "Create your private lock" : "Unlock your advisory desk"}
          </Text>
          <Text style={styles.authText}>
            {needsSetup
              ? "Secure client records, portfolios, follow-up plans, and market communication behind your personal PIN."
              : "Use your PIN or biometrics to open your private client workspace."}
          </Text>

          <TextInput
            value={needsSetup ? pinSetup : pinInput}
            onChangeText={needsSetup ? setPinSetup : setPinInput}
            placeholder="Enter PIN"
            placeholderTextColor="#7f90a8"
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            style={styles.authInput}
          />

          <Pressable
            style={styles.primaryButton}
            onPress={needsSetup ? () => void setupPinAction() : unlockAction}
          >
            <Text style={styles.primaryButtonText}>
              {needsSetup ? "Save PIN & Enter" : "Unlock with PIN"}
            </Text>
          </Pressable>

          {!needsSetup && biometricEnabled && biometricAvailable ? (
            <Pressable
              style={styles.secondaryAction}
              onPress={() => void handleBiometricUnlock()}
            >
              <Text style={styles.secondaryActionText}>Use biometric unlock</Text>
            </Pressable>
          ) : null}

          {!needsSetup ? (
            <Pressable
              style={{ marginTop: 14, alignSelf: "center" }}
              onPress={() => void resetLock()}
            >
              <Text style={{ color: "#7f90a8", fontSize: 13, textDecorationLine: "underline" }}>
                Forgot PIN? Reset App Lock
              </Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  if (!authSession) {
    return (
      <SafeAreaView style={[styles.authScreen, darkModeEnabled ? styles.authScreenDark : null]}>
        <StatusBar style="light" />
        <View style={styles.authCard}>
          <Text style={styles.authEyebrow}>Asset Array</Text>
          <Text style={styles.authTitle}>Sign in to your advisor workspace</Text>
          <Text style={styles.authText}>
            Connect to the Asset Array backend before opening client records, cloud backup, and campaigns.
          </Text>

          <Pressable
            style={[styles.primaryButton, { backgroundColor: "#E0A84C", marginBottom: 10 }]}
            onPress={() => void quickDemoLogin()}
          >
            <Text style={[styles.primaryButtonText, { color: "#030712", fontWeight: "800" }]}>
              ⚡ 1-Click Sign In (Judge / Demo Admin)
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.secondaryButton,
              { width: "100%", justifyContent: "center", alignItems: "center", marginBottom: 8 },
            ]}
            onPress={() => void continueOffline()}
          >
            <Text style={[styles.secondaryButtonText, { color: "#E0A84C" }]}>
              Continue in Offline Mode (Demo)
            </Text>
          </Pressable>

          <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 12, width: "100%" }}>
            <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.12)" }} />
            <Text style={{ color: "#7f90a8", paddingHorizontal: 10, fontSize: 11, fontWeight: "600" }}>
              OR SIGN IN MANUALLY
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.12)" }} />
          </View>

          <TextInput
            value={cloudSettings.endpoint}
            onChangeText={(value) =>
              setCloudSettings((current) => ({ ...current, endpoint: value }))
            }
            placeholder="Backend URL (https://assetarray.onrender.com)"
            placeholderTextColor="#7f90a8"
            autoCapitalize="none"
            style={styles.authInput}
          />
          {!cloudSettings.endpoint.trim() ? (
            <Pressable
              style={{ alignSelf: "flex-start", marginBottom: 12, marginTop: -4 }}
              onPress={() =>
                setCloudSettings((current) => ({
                  ...current,
                  endpoint: DEFAULT_BACKEND_ENDPOINT,
                  authUsername: current.authUsername || "admin",
                }))
              }
            >
              <Text style={{ color: "#E0A84C", fontSize: 13, textDecorationLine: "underline" }}>
                ✦ Auto-fill Cloud Backend ({DEFAULT_BACKEND_ENDPOINT})
              </Text>
            </Pressable>
          ) : null}
          <TextInput
            value={cloudSettings.authUsername}
            onChangeText={(value) =>
              setCloudSettings((current) => ({ ...current, authUsername: value }))
            }
            placeholder="Username (e.g. admin)"
            placeholderTextColor="#7f90a8"
            autoCapitalize="none"
            style={styles.authInput}
          />
          <TextInput
            value={authPassword}
            onChangeText={setAuthPassword}
            placeholder="Password (e.g. AssetArrayLocalAdmin2026)"
            placeholderTextColor="#7f90a8"
            secureTextEntry
            style={styles.authInput}
          />
          <Text style={{ color: "#7f90a8", fontSize: 11, marginBottom: 12 }}>
            Demo credentials: admin / AssetArrayLocalAdmin2026
          </Text>

          <Pressable style={styles.primaryButton} onPress={() => void loginToBackend()}>
            <Text style={styles.primaryButtonText}>
              {authState === "Signing in..." ? "Signing In..." : "Sign In"}
            </Text>
          </Pressable>
          <Text style={styles.authStatusText}>{authState}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isAuthChecking) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar style="light" />
        <Text style={styles.loadingTitle}>Verifying secure session...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[
        styles.screen,
        darkModeEnabled ? styles.screenDark : null,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <StatusBar style={darkModeEnabled ? "light" : "dark"} />
      <View style={{ flex: 1, flexDirection: isDesktop ? "row" : "column", width: "100%", height: "100%" }}>
        {isDesktop && (
          <DesktopSidebar
            activeTab={visibleTabs.some((tab) => tab.key === activeTab) ? activeTab : "Dashboard"}
            advisorName={authSession?.user?.username || "Senior Wealth Advisor"}
            dueClientsCount={dueClients.length}
            isPro={isPro}
            onChange={setActiveTab}
            onLockDesk={() => setIsUnlocked(false)}
            onOpenProModal={() => setIsPaywallVisible(true)}
            onQuickAddClient={openAddModal}
            onQuickBroadcast={() => {
              if (selectedClientIds.length === 0 && clients.length > 0) {
                setSelectedClientIds(clients.map((client) => client.id));
              }
              setIsBroadcastModalOpen(true);
            }}
            syncStatus={syncState}
            tabs={visibleTabs}
            theme={theme}
          />
        )}
        <View style={{ flex: 1, height: "100%", overflow: "hidden" }}>
          <LiveMarketTicker
            theme={theme}
            onRefresh={() => void refreshLiveMarketPrices()}
            isRefreshing={isMarketRefreshing}
          />
          <ScreenTransition triggerKey={activeTab}>
            {activeTab === "Dashboard" ? (
        <DashboardScreen
          analytics={dashboardAnalytics}
          contentBottomPadding={contentBottomPadding}
          dueClients={dueClients.map((client) => ({
            id: client.id,
            name: client.name,
            category: client.category,
            reminderDate: formatReminderDate(client.reminderDate),
            lastContact: client.lastContact,
            priority: client.priority,
            avatarUrl: getClientAvatar(client),
          }))}
          onActionAddClient={openAddModal}
          onActionAiResearch={() => setActiveTab("AI Research")}
          onActionBroadcast={() => {
            if (selectedClientIds.length === 0 && clients.length > 0) {
              setSelectedClientIds(clients.map((client) => client.id));
            }
            setIsBroadcastModalOpen(true);
          }}
          onActionOpenClients={() => setActiveTab("Clients")}
          onOpenClient={(clientId) => {
            setSelectedClientId(clientId);
            setActiveTab("Clients");
          }}
          onViewAllClients={() => setActiveTab("Clients")}
          recentClients={recentClients.map((client) => ({
            id: client.id,
            name: client.name,
            category: client.category,
            reminderDate: formatReminderDate(client.reminderDate),
            lastContact: client.lastContact,
            priority: client.priority,
            avatarUrl: getClientAvatar(client),
          })).slice(0, 3)}
          reminderKpis={dashboardReminderKpis}
          stats={dashboardStats}
          theme={theme}
        />
      ) : (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: contentBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.pageHeader,
            isCompactPageHeader ? styles.pageHeaderCompact : null,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={[styles.heroCopy, isCompactPageHeader ? styles.heroCopyCompact : null]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <Text style={[styles.heroEyebrow, { color: theme.colors.brand }]}>Asset Array</Text>
              <SyncBadge isSyncing={isSyncing} />
              <Pressable
                onPress={() => setIsPaywallVisible(true)}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 12,
                  backgroundColor: isPro ? "rgba(224, 168, 76, 0.15)" : "rgba(255, 255, 255, 0.08)",
                  borderWidth: 1,
                  borderColor: isPro ? theme.colors.brand : "rgba(255, 255, 255, 0.15)",
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "800", color: isPro ? theme.colors.brand : theme.colors.textSecondary }}>
                  {isPro ? "👑 PRO" : "⚡ UPGRADE"}
                </Text>
              </Pressable>
            </View>
            <Text
              style={[
                styles.pageHeaderTitle,
                isCompactPageHeader ? styles.pageHeaderTitleCompact : null,
                { color: theme.colors.textPrimary },
              ]}
            >
              {activeTab}
            </Text>
          </View>
          <View
            style={[
              styles.heroActionRow,
              isCompactPageHeader ? styles.heroActionRowCompact : null,
            ]}
          >
            {activeTab !== "AI Research" ? (
              <Pressable
                style={[
                  styles.secondaryButton,
                  isCompactPageHeader ? styles.secondaryButtonCompact : null,
                  { backgroundColor: theme.colors.surfaceStrong },
                ]}
                onPress={() => setActiveTab("AI Research")}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.colors.textPrimary }]}>
                  AI Research
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              style={[
                styles.secondaryButton,
                styles.logoutButton,
                isCompactPageHeader ? styles.secondaryButtonCompact : null,
              ]}
              onPress={() => void logoutFromBackend()}
            >
              <Text style={[styles.secondaryButtonText, styles.logoutButtonText]}>Logout</Text>
            </Pressable>
          </View>
        </View>

        {activeTab === "AI Research" ? (
          <>
            <View style={[styles.panel, styles.analyticsPanel]}>
              <Text style={styles.panelTitle}>AI Research</Text>
              <Text style={styles.panelSubtitle}>
                Generate a structured market brief for a stock, company, mutual fund, ETF, sector, or market topic.
              </Text>
              <TextInput
                value={aiResearchQuery}
                onChangeText={setAiResearchQuery}
                placeholder="e.g. Reliance Industries, Nifty IT, Gold ETF, banking sector"
                placeholderTextColor="#7f90a8"
                autoCapitalize="words"
                style={styles.input}
              />
              <View style={styles.inlineActions}>
                <Pressable
                  style={styles.primaryButton}
                  onPress={() => void runAiResearch()}
                  disabled={isAiResearchLoading}
                >
                  <Text style={styles.primaryButtonText}>
                    {isAiResearchLoading ? "Researching..." : "Generate Research"}
                  </Text>
                </Pressable>
                <Text style={styles.clientSubMeta}>{aiResearchState}</Text>
              </View>

              {aiResearchResult ? (
                <View style={styles.aiResearchResult}>
                  <View style={styles.aiResearchHeader}>
                    <Text style={styles.sectionLabel}>Sentiment</Text>
                    <Text
                      style={[
                        styles.sentimentPill,
                        aiResearchResult.sentiment === "Bullish"
                          ? styles.sentimentBullish
                          : aiResearchResult.sentiment === "Bearish"
                            ? styles.sentimentBearish
                            : styles.sentimentNeutral,
                      ]}
                    >
                      {aiResearchResult.sentiment}
                    </Text>
                  </View>

                  <Text style={styles.sectionLabel}>Summary</Text>
                  <Text style={styles.detailBlock}>{aiResearchResult.summary}</Text>

                  <View style={styles.dualColumn}>
                    <View style={styles.column}>
                      <Text style={styles.sectionLabel}>Opportunities</Text>
                      {aiResearchResult.opportunities.map((item) => (
                        <Text key={item} style={styles.historyItem}>
                          {item}
                        </Text>
                      ))}
                    </View>
                    <View style={styles.column}>
                      <Text style={styles.sectionLabel}>Risks</Text>
                      {aiResearchResult.risks.map((item) => (
                        <Text key={item} style={styles.analyticsAlert}>
                          {item}
                        </Text>
                      ))}
                    </View>
                  </View>

                  <Text style={styles.sectionLabel}>Short-term outlook</Text>
                  <Text style={styles.historyItem}>{aiResearchResult.shortTermOutlook}</Text>
                  <Text style={styles.sectionLabel}>Long-term outlook</Text>
                  <Text style={styles.historyItem}>{aiResearchResult.longTermOutlook}</Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Research ready</Text>
                  <Text style={styles.emptyText}>
                    Enter a topic and generate a structured advisor-ready view.
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.panel, styles.analyticsPanel, { marginTop: 16 }]}>
              <Text style={styles.panelTitle}>Client Portfolio Co-Pilot</Text>
              <Text style={styles.panelSubtitle}>
                Select a client to generate personalized rebalancing strategies, risk alerts, and custom advisory messages.
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
                {clients.map((c) => {
                  const isSelected = selectedAiClient?.id === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      style={[
                        styles.darkChip,
                        { marginRight: 8, backgroundColor: isSelected ? theme.colors.brand : theme.colors.surfaceStrong },
                      ]}
                      onPress={() => setSelectedAiClient(c)}
                    >
                      <Text style={[styles.darkChipText, { color: isSelected ? "#ffffff" : theme.colors.textPrimary }]}>
                        {c.name} ({c.category})
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {selectedAiClient ? (
                <View style={{ marginTop: 8 }}>
                  <Pressable
                    style={[styles.primaryButton, { alignSelf: "flex-start" }]}
                    onPress={() => void runClientAiCoPilot(selectedAiClient)}
                    disabled={isClientAiLoading}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isClientAiLoading ? "Analyzing Portfolio..." : `🤖 Analyze ${selectedAiClient.name}'s Portfolio`}
                    </Text>
                  </Pressable>

                  {clientAiRecommendation ? (
                    <View style={[styles.aiResearchResult, { marginTop: 16 }]}>
                      <Text style={styles.sectionLabel}>Client Strategy & Sentiment</Text>
                      <Text style={styles.detailBlock}>{clientAiRecommendation.analysis.summary}</Text>

                      <Text style={styles.sectionLabel}>💬 Personal WhatsApp Message Draft</Text>
                      <Text style={[styles.detailBlock, { fontStyle: "italic", backgroundColor: "rgba(37, 211, 102, 0.1)" }]}>
                        {clientAiRecommendation.whatsappDraft}
                      </Text>
                      <Pressable
                        style={[styles.primaryButton, { backgroundColor: "#25D366", marginTop: 8, marginBottom: 16 }]}
                        onPress={() => {
                          const cleanPhone = (selectedAiClient.phone || "").replace(/[^0-9+]/g, "");
                          const encodedText = encodeURIComponent(clientAiRecommendation.whatsappDraft);
                          const url = cleanPhone
                            ? `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`
                            : `whatsapp://send?text=${encodedText}`;
                          Linking.openURL(url).catch(() => {
                            Alert.alert("WhatsApp not found", "Could not open WhatsApp on this device.");
                          });
                        }}
                      >
                        <Text style={[styles.primaryButtonText, { color: "#ffffff", fontWeight: "700" }]}>
                          📲 Send to {selectedAiClient.name} via WhatsApp
                        </Text>
                      </Pressable>

                      <Text style={styles.sectionLabel}>📧 Professional Email Draft</Text>
                      <Text style={[styles.detailBlock, { fontStyle: "italic" }]}>
                        {clientAiRecommendation.emailDraft}
                      </Text>
                      <Pressable
                        style={[styles.primaryButton, { backgroundColor: "#2f6fff", marginTop: 8 }]}
                        onPress={() => {
                          const email = selectedAiClient.email || "";
                          const subject = encodeURIComponent(`Portfolio Strategy & Allocation Review for ${selectedAiClient.name}`);
                          const body = encodeURIComponent(clientAiRecommendation.emailDraft);
                          const url = `mailto:${email}?subject=${subject}&body=${body}`;
                          Linking.openURL(url).catch(() => {
                            Alert.alert("Email client not found", "Could not open your default email app.");
                          });
                        }}
                      >
                        <Text style={[styles.primaryButtonText, { color: "#ffffff", fontWeight: "700" }]}>
                          ✉️ Open Draft in Email Client
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              ) : (
                <Text style={styles.clientSubMeta}>Select a client above to unlock AI Co-Pilot analysis.</Text>
              )}
            </View>
          </>
        ) : null}

        {activeTab === "Portfolios" ? (
          <>
            <PortfoliosScreen
              theme={theme}
              unifiedPortfolioAnalytics={unifiedPortfolioAnalytics}
              taxReporting={taxReporting}
              isMarketRefreshing={isMarketRefreshing}
              refreshLiveMarketPrices={refreshLiveMarketPrices}
              currencyDisplay={currencyDisplay}
              styles={styles}
            />
            <PortfolioManagerSection
              selectedClient={selectedClient}
              portfolioStats={portfolioStats}
              currencyDisplay={currencyDisplay}
              openAddHoldingModal={openAddHoldingModal}
              openEditHoldingModal={openEditHoldingModal}
              deleteHolding={deleteHolding}
              dueClients={dueClients}
              formatReminderDate={formatReminderDate}
              setSelectedClientId={setSelectedClientId}
              categorySummary={categorySummary}
              isDesktop={isDesktop}
              styles={styles}
            />
          </>
        ) : null}

        {activeTab === "Workspace" ? (
          <WorkspaceScreen
            theme={theme}
            marketMessage={marketMessage}
            setMarketMessage={setMarketMessage}
            setBroadcastMessage={setBroadcastMessage}
            marketResearchNotes={marketResearchNotes}
            setMarketResearchNotes={setMarketResearchNotes}
            runWorkspaceAiBrief={runWorkspaceAiBrief}
            useAiBriefAsDailyMessage={useAiBriefAsDailyMessage}
            isAiResearchLoading={isAiResearchLoading}
            aiResearchState={aiResearchState}
            aiResearchResult={aiResearchResult}
            categorySummary={categorySummary}
            advisorMessages={advisorMessages}
            advisorMessageDraft={advisorMessageDraft}
            updateAdvisorMessageDraft={updateAdvisorMessageDraft}
            saveAdvisorMessageDraftAction={saveAdvisorMessageDraftAction}
            aggregationSnapshot={aggregationSnapshot}
            connectedAccounts={connectedAccounts}
            currencyDisplay={currencyDisplay}
            styles={styles}
          />
        ) : null}

        {activeTab === "Tools" ? (
          <ToolsScreen
            theme={theme}
            activeCalculator={activeCalculator}
            setActiveCalculator={setActiveCalculator}
            cashFlowAmount={cashFlowAmount}
            setCashFlowAmount={setCashFlowAmount}
            cashFlowRate={cashFlowRate}
            setCashFlowRate={setCashFlowRate}
            cashFlowYears={cashFlowYears}
            setCashFlowYears={setCashFlowYears}
            cashFlowFrequency={cashFlowFrequency}
            setCashFlowFrequency={setCashFlowFrequency}
            cashFlowMode={cashFlowMode}
            setCashFlowMode={setCashFlowMode}
            cashFlowResults={cashFlowResults}
            sipAmount={sipAmount}
            setSipAmount={setSipAmount}
            sipRate={sipRate}
            setSipRate={setSipRate}
            sipYears={sipYears}
            setSipYears={setSipYears}
            sipFrequency={sipFrequency}
            setSipFrequency={setSipFrequency}
            sipResults={sipResults}
            goalTargetAmount={goalTargetAmount}
            setGoalTargetAmount={setGoalTargetAmount}
            goalExpectedReturn={goalExpectedReturn}
            setGoalExpectedReturn={setGoalExpectedReturn}
            goalYears={goalYears}
            setGoalYears={setGoalYears}
            goalPlannerResults={goalPlannerResults}
            retirementMonthlyExpense={retirementMonthlyExpense}
            setRetirementMonthlyExpense={setRetirementMonthlyExpense}
            retirementInflation={retirementInflation}
            setRetirementInflation={setRetirementInflation}
            retirementReturn={retirementReturn}
            setRetirementReturn={setRetirementReturn}
            retirementYearsToRetire={retirementYearsToRetire}
            setRetirementYearsToRetire={setRetirementYearsToRetire}
            retirementYearsAfterRetire={retirementYearsAfterRetire}
            setRetirementYearsAfterRetire={setRetirementYearsAfterRetire}
            retirementResults={retirementResults}
            goalDraft={goalDraft}
            updateGoalDraft={updateGoalDraft}
            saveGoalFromDraft={saveGoalFromDraft}
            goalCenterStats={goalCenterStats}
            vaultDocumentDraft={vaultDocumentDraft}
            setVaultDocumentDraft={setVaultDocumentDraft}
            saveVaultDocumentDraftAction={saveVaultDocumentDraftAction}
            vaultDocuments={vaultDocuments}
            currencyDisplay={currencyDisplay}
            styles={styles}
          />
        ) : null}

        {activeTab === "Clients" ? (
          <>
            <ClientsScreen
              theme={theme}
              isDesktop={isDesktop}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              filterMode={filterMode}
              setFilterMode={setFilterMode}
              selectedClientIds={selectedClientIds}
              selectAllVisibleClients={selectAllVisibleClients}
              clearSelectedClients={clearSelectedClients}
              setIsBroadcastModalOpen={setIsBroadcastModalOpen}
              filteredClients={filteredClients}
              selectedClientId={selectedClientId}
              setSelectedClientId={setSelectedClientId}
              toggleSelectedClient={toggleSelectedClient}
              selectedClient={selectedClient}
              getClientAvatar={getClientAvatar}
              formatReminderDate={formatReminderDate}
              isReminderDue={isReminderDue}
              contactClient={contactClient}
              isPro={isPro}
              setIsPaywallVisible={setIsPaywallVisible}
              exportClientPdfReport={exportClientPdfReport}
              advisorName={authSession?.user?.username || cloudSettings.ownerName || "Asset Array Advisor"}
              openEditModal={openEditModal}
              deleteClient={deleteClient}
              seedDemoClients={seedDemoClients}
              selectedClientInsights={selectedClientInsights}
              selectedClientMessageDraft={selectedClientMessageDraft}
              selectedClientReportDraft={selectedClientReportDraft}
              styles={styles}
            />
            <PortfolioManagerSection
              selectedClient={selectedClient}
              portfolioStats={portfolioStats}
              currencyDisplay={currencyDisplay}
              openAddHoldingModal={openAddHoldingModal}
              openEditHoldingModal={openEditHoldingModal}
              deleteHolding={deleteHolding}
              dueClients={dueClients}
              formatReminderDate={formatReminderDate}
              setSelectedClientId={setSelectedClientId}
              categorySummary={categorySummary}
              isDesktop={isDesktop}
              styles={styles}
            />
          </>
        ) : null}

        {activeTab === "Settings" ? (
          <SettingsScreen
            theme={theme}
            authState={authState}
            syncState={syncState}
            isPro={isPro}
            setIsPro={setIsPro}
            resetDemoProStatus={resetDemoProStatus}
            setIsPaywallVisible={setIsPaywallVisible}
            seedDemoClients={seedDemoClients}
            biometricEnabled={biometricEnabled}
            toggleBiometric={toggleBiometric}
            hapticsEnabled={hapticsEnabled}
            toggleHaptics={toggleHaptics}
            resetLock={resetLock}
            darkModeEnabled={darkModeEnabled}
            toggleDarkMode={toggleDarkMode}
            setIsSyncModalOpen={setIsSyncModalOpen}
            syncToCloud={syncToCloud}
            restoreFromCloud={restoreFromCloud}
            setIsBroadcastModalOpen={setIsBroadcastModalOpen}
            broadcastState={broadcastState}
            appVersion={APP_VERSION}
            openPrivacyPolicy={openPrivacyPolicy}
            openTermsAndConditions={openTermsAndConditions}
            contactSupport={contactSupport}
            reportBug={reportBug}
            styles={styles}
          />
        ) : null}
      </ScrollView>
      )}
          </ScreenTransition>
        </View>
      </View>

      {!isDesktop && (
        <BottomTabBar
          activeTab={visibleTabs.some((tab) => tab.key === activeTab) ? activeTab : "Dashboard"}
          bottomInset={insets.bottom}
          onChange={setActiveTab}
          tabs={visibleTabs}
          theme={theme}
        />
      )}

      <ClientEditorModal
        visible={isEditorOpen}
        isDesktop={isDesktop}
        editorMode={editorMode}
        draft={draft}
        updateDraft={updateDraft}
        onClose={closeEditor}
        onSubmit={submitDraft}
        theme={theme}
      />

      <HoldingEditorModal
        visible={isPortfolioModalOpen}
        isDesktop={isDesktop}
        portfolioMode={portfolioMode}
        holdingDraft={holdingDraft}
        updateHoldingDraft={updateHoldingDraft}
        onClose={closeHoldingModal}
        onSave={saveHolding}
        theme={theme}
      />

      <SyncConfigModal
        visible={isSyncModalOpen}
        isDesktop={isDesktop}
        cloudSettings={cloudSettings}
        setCloudSettings={setCloudSettings}
        defaultBackendEndpoint={DEFAULT_BACKEND_ENDPOINT}
        authState={authState}
        authSession={authSession}
        onLogout={() => void logoutFromBackend()}
        onClose={() => setIsSyncModalOpen(false)}
        onSave={() => void saveCloudSettingsAction()}
        theme={theme}
      />

      <BroadcastModal
        visible={isBroadcastModalOpen}
        isDesktop={isDesktop}
        insetsBottom={insets.bottom}
        onClose={() => setIsBroadcastModalOpen(false)}
        onSend={() => void runBroadcastCampaign()}
        broadcastChannel={broadcastChannel}
        setBroadcastChannel={setBroadcastChannel}
        broadcastMessage={broadcastMessage}
        setBroadcastMessage={setBroadcastMessage}
        clients={clients}
        selectedClientIds={selectedClientIds}
        setSelectedClientIds={setSelectedClientIds}
        toggleSelectedClient={toggleSelectedClient}
        broadcastPreview={broadcastPreview}
        broadcastTargets={broadcastTargets}
        resolveBroadcastContact={resolveBroadcastContact}
        authSession={authSession}
        cloudSettings={cloudSettings}
        theme={theme}
      />

      <AboutLegalModal
        visible={Boolean(aboutSheet)}
        isDesktop={isDesktop}
        aboutSheet={aboutSheet}
        onClose={() => setAboutSheet(null)}
        theme={theme}
      />

      <Modal
        visible={isPaywallVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsPaywallVisible(false)}
      >
        <PaywallScreen
          theme={theme}
          packages={revenueCatPackages}
          isLoading={isPaywallLoading}
          onPurchase={async (pkg) => {
            setIsPaywallLoading(true);
            const success = await purchasePackage(pkg);
            if (success) {
              setIsPro(true);
              setIsPaywallVisible(false);
              await triggerSuccessHaptic();
              Alert.alert("Welcome to Pro", "Thank you for subscribing to Pro Advisor!");
            }
            setIsPaywallLoading(false);
          }}
          onRestore={async () => {
            setIsPaywallLoading(true);
            const success = await restorePurchases();
            if (success) {
              setIsPro(true);
              setIsPaywallVisible(false);
              await triggerSuccessHaptic();
              Alert.alert("Purchases Restored", "Your Pro Advisor subscription has been restored.");
            } else {
              Alert.alert("Restore Failed", "No active subscription found.");
            }
            setIsPaywallLoading(false);
          }}
          onClose={() => setIsPaywallVisible(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GlobalStyleInjector />
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#070b14",
  },
  screenDark: {
    backgroundColor: "#050916",
  },
  container: {
    padding: 20,
    paddingBottom: 120,
    gap: 18,
  },
  bottomTabBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 12,
    backgroundColor: "#0b1630",
    borderWidth: 1,
    borderColor: "#1d3353",
    borderRadius: 18,
    padding: 8,
    flexDirection: "row",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  bottomTabItem: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#0f1d3a",
  },
  bottomTabItemActive: {
    backgroundColor: "#0cb38e",
  },
  bottomTabText: {
    color: "#c4d2e8",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  bottomTabTextActive: {
    color: "#041b16",
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f1b2d",
  },
  loadingTitle: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "700",
  },
  authScreen: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0f1b2d",
  },
  authScreenDark: {
    backgroundColor: "#09111d",
  },
  authCard: {
    backgroundColor: "#0b1630",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1a2a49",
  },
  authEyebrow: {
    color: "#a3bad5",
    fontSize: 13,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  authTitle: {
    color: "#f8fafc",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    marginBottom: 10,
  },
  authText: {
    color: "#d2ddeb",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  authInput: {
    backgroundColor: "#0b1522",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#27405e",
    color: "#f8fafc",
    fontSize: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  authStatusText: {
    color: "#9fb1c9",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
  },
  heroCard: {
    backgroundColor: "#0a1630",
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: "#213a61",
    gap: 16,
    shadowColor: "#0f1724",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 5,
  },
  pageHeader: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  pageHeaderCompact: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 14,
    justifyContent: "flex-start",
  },
  pageHeaderTitle: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
  },
  pageHeaderTitleCompact: {
    fontSize: 22,
    lineHeight: 28,
  },
  heroCopy: {
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  heroCopyCompact: {
    width: "100%",
  },
  heroEyebrow: {
    color: "#94abc7",
    fontSize: 13,
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#f8fafc",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
  },
  heroText: {
    color: "#d7e3ef",
    fontSize: 15,
    lineHeight: 22,
  },
  heroActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  heroActionRowCompact: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 10,
    width: "100%",
  },
  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flexGrow: 1,
    minWidth: 110,
    backgroundColor: "#0d1931",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f3352",
    shadowColor: "#15263c",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },
  statValue: {
    color: "#eef4ff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    color: "#8ca3c4",
    fontSize: 13,
  },
  miniStat: {
    flexGrow: 1,
    minWidth: 90,
    backgroundColor: "#101d39",
    borderRadius: 16,
    padding: 14,
  },
  calculatorResultGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
  },
  calculatorStat: {
    minWidth: 130,
    borderWidth: 1,
    borderColor: "#1d3354",
    backgroundColor: "#0f1b36",
  },
  miniStatValue: {
    color: "#f2f7ff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  miniStatLabel: {
    color: "#8ba2c5",
    fontSize: 12,
  },
  panel: {
    backgroundColor: "#111a2e",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1c2842",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },
  calculatorPanel: {
    backgroundColor: "#111a2e",
    borderColor: "#1c2842",
  },
  analyticsPanel: {
    backgroundColor: "#111a2e",
    borderColor: "#1c2842",
  },
  panelTitle: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  panelSubtitle: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  input: {
    backgroundColor: "#0c1322",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1e2c47",
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#f8fafc",
    fontSize: 15,
    marginBottom: 12,
  },
  messageInput: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  notesInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  inputLabel: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  optionChip: {
    backgroundColor: "#17233d",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#23355b",
  },
  optionChipActive: {
    backgroundColor: "#2563eb",
    borderColor: "#3b82f6",
  },
  optionChipText: {
    color: "#94a3b8",
    fontWeight: "600",
    fontSize: 13,
  },
  optionChipTextActive: {
    color: "#ffffff",
  },
  broadcastStrip: {
    backgroundColor: "#111a2e",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1c2842",
  },
  broadcastStripText: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  dualColumn: {
    gap: 18,
  },
  column: {
    flex: 1,
  },
  emptyState: {
    backgroundColor: "#0c1322",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1e2c47",
  },
  emptyTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 20,
  },
  clientRowShell: {
    flexDirection: "row",
    gap: 10,
    alignItems: "stretch",
    marginBottom: 8,
  },
  selectorPill: {
    width: 78,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#17233d",
    borderRadius: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#23355b",
  },
  selectorPillActive: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "#10b981",
  },
  selectorPillText: {
    color: "#94a3b8",
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },
  selectorPillTextActive: {
    color: "#10b981",
  },
  clientRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1c2842",
    backgroundColor: "#111a2e",
    gap: 12,
  },
  clientRowActive: {
    backgroundColor: "#172542",
    borderColor: "#3b82f6",
  },
  clientRowMain: {
    flex: 1,
    gap: 4,
  },
  clientName: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "700",
  },
  clientMeta: {
    color: "#94a3b8",
    fontSize: 13,
  },
  clientSubMeta: {
    color: "#64748b",
    fontSize: 12,
  },
  dueBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.18)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  dueBadgeText: {
    color: "#f59e0b",
    fontWeight: "700",
    fontSize: 12,
  },
  detailName: {
    color: "#f8fafc",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 6,
  },
  detailLine: {
    color: "#94a3b8",
    fontSize: 14,
    marginBottom: 4,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: "#17233d",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#23355b",
  },
  tagText: {
    color: "#cbd5e1",
    fontWeight: "600",
    fontSize: 13,
  },
  sectionLabel: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailBlock: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 22,
  },
  aiResearchResult: {
    gap: 12,
    marginTop: 12,
    padding: 16,
    backgroundColor: "#0c1322",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e2c47",
  },
  aiResearchHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  sentimentPill: {
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  sentimentBullish: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    color: "#10b981",
  },
  sentimentNeutral: {
    backgroundColor: "rgba(148, 163, 184, 0.15)",
    color: "#cbd5e1",
  },
  sentimentBearish: {
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    color: "#f43f5e",
  },
  darkChip: {
    backgroundColor: "#2563eb",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  darkChipText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 13,
  },
  lightChip: {
    backgroundColor: "#17233d",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#23355b",
  },
  lightChipText: {
    color: "#cbd5e1",
    fontWeight: "600",
    fontSize: 13,
  },
  inlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 10,
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkButtonText: {
    color: "#3b82f6",
    fontWeight: "700",
  },
  linkDanger: {
    color: "#f43f5e",
  },
  historyItem: {
    backgroundColor: "#0c1322",
    borderRadius: 14,
    padding: 12,
    color: "#cbd5e1",
    marginTop: 8,
    lineHeight: 20,
    borderWidth: 1,
    borderColor: "#1e2c47",
  },
  reportBlock: {
    backgroundColor: "#0c1322",
    borderRadius: 16,
    padding: 14,
    color: "#cbd5e1",
    lineHeight: 21,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#1e2c47",
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  slimButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  slimButtonText: {
    color: "#f8fafc",
    fontWeight: "700",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: "47%",
    backgroundColor: "#111a2e",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1c2842",
  },
  analyticsSummaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
    marginBottom: 18,
  },
  analyticsMetricCard: {
    flexGrow: 1,
    minWidth: 130,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  analyticsBlue: {
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    borderColor: "rgba(59, 130, 246, 0.35)",
  },
  analyticsSlate: {
    backgroundColor: "#162238",
    borderColor: "#283959",
  },
  analyticsGreen: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderColor: "rgba(16, 185, 129, 0.35)",
  },
  analyticsRed: {
    backgroundColor: "rgba(244, 63, 94, 0.08)",
    borderColor: "rgba(244, 63, 94, 0.35)",
  },
  analyticsGold: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderColor: "rgba(245, 158, 11, 0.35)",
  },
  analyticsMetricLabel: {
    color: "#c1d3ec",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  analyticsMetricValue: {
    color: "#f3f8ff",
    fontSize: 20,
    fontWeight: "700",
  },
  allocationRow: {
    backgroundColor: "#0f1d39",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#213b61",
    marginTop: 10,
  },
  allocationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  allocationBarTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#1b2f50",
    overflow: "hidden",
    marginBottom: 8,
  },
  allocationBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#2f6fff",
  },
  analyticsAlert: {
    backgroundColor: "#2f2530",
    borderRadius: 14,
    padding: 12,
    color: "#ffd5a1",
    lineHeight: 20,
    marginTop: 8,
  },
  analyticsListCard: {
    backgroundColor: "#0f1d39",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#213b61",
    marginTop: 10,
  },
  analyticsPositive: {
    color: "#0f8a4d",
    fontWeight: "700",
    marginTop: 6,
  },
  analyticsNegative: {
    color: "#b23a3a",
    fontWeight: "700",
    marginTop: 6,
  },
  categoryValue: {
    color: "#eef4ff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  categoryLabel: {
    color: "#8ea6c8",
    fontSize: 13,
  },
  holdingCard: {
    backgroundColor: "#0f1d39",
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
  },
  holdingTitle: {
    color: "#ecf3ff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  holdingMeta: {
    color: "#98afd0",
    fontSize: 13,
    marginBottom: 4,
  },
  holdingNote: {
    color: "#8ea8ca",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  settingsOverviewPanel: {
    backgroundColor: "#0b1b38",
    borderColor: "#294b79",
  },
  settingsStatusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  settingsStatusItem: {
    backgroundColor: "#09172d",
    borderColor: "#244164",
    borderRadius: 14,
    borderWidth: 1,
    flexGrow: 1,
    flexBasis: 150,
    padding: 12,
  },
  settingsStatusLabel: {
    color: "#8fa9cd",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 5,
    textTransform: "uppercase",
  },
  settingsStatusValue: {
    color: "#edf5ff",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },
  settingsSectionTitle: {
    color: "#ecf3ff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  settingsRow: {
    alignItems: "center",
    borderBottomColor: "#1b3355",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  settingsActionRow: {
    alignItems: "center",
    borderBottomColor: "#1b3355",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  settingsActionText: {
    color: "#bfd5f3",
    fontSize: 14,
    fontWeight: "800",
  },
  settingsButtonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  toggleCopy: {
    flex: 1,
  },
  toggleTitle: {
    color: "#e8f2ff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  toggleText: {
    color: "#8fa9cd",
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563eb",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  goldButton: {
    alignSelf: "flex-start",
    backgroundColor: "#10b981",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  goldButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: "#17233d",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#23355b",
  },
  secondaryButtonCompact: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 0,
  },
  secondaryButtonText: {
    color: "#cbd5e1",
    fontWeight: "600",
    fontSize: 14,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.35)",
    backgroundColor: "rgba(244, 63, 94, 0.1)",
  },
  logoutButtonText: {
    color: "#f43f5e",
    fontWeight: "700",
  },
  secondaryAction: {
    marginTop: 14,
    alignSelf: "center",
  },
  secondaryActionText: {
    color: "#3b82f6",
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  modalBackdropCenter: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    maxHeight: "90%",
    backgroundColor: "#111a2e",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1c2842",
  },
  modalCardCenter: {
    width: "100%",
    maxWidth: 580,
    maxHeight: "85%",
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderColor: "rgba(224, 168, 76, 0.18)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.55,
    shadowRadius: 40,
    elevation: 20,
  },
  modalTitle: {
    color: "#eaf3ff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  modalSecondary: {
    flex: 1,
    backgroundColor: "#102240",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalSecondaryText: {
    color: "#bfd3ef",
    fontWeight: "700",
  },
  clientDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  clientListAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(224, 168, 76, 0.35)",
  },
  clientListAvatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(224, 168, 76, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(224, 168, 76, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  clientListAvatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E0A84C",
  },
  clientDetailAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#E0A84C",
  },
  clientDetailAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(224, 168, 76, 0.15)",
    borderWidth: 2,
    borderColor: "#E0A84C",
    alignItems: "center",
    justifyContent: "center",
  },
  clientDetailAvatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#E0A84C",
  },
});
