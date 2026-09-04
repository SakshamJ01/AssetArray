import "react-native-get-random-values";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
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
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { BottomTabBar } from "./src/components/BottomTabBar";
import { DashboardScreen } from "./src/components/DashboardScreen";
import { AdvisorMessagesScreen } from "./src/screens/workspace/AdvisorMessagesScreen";
import { AggregationScreen } from "./src/screens/workspace/AggregationScreen";
import { setHapticsEnabled, triggerSuccessHaptic } from "./src/services/haptics";
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
import { PurchasesPackage } from "react-native-purchases";
import { DEMO_CLIENTS } from "./src/services/demoData";
import { AssetAllocationBar } from "./src/components/AssetAllocationBar";

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

const emptyCloudSettings: CloudSettings = {
  endpoint: "",
  ownerName: "",
  authUsername: "",
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
  await SecureStore.setItemAsync(BIOMETRIC_KEY, JSON.stringify(value));
}

async function persistDarkMode(value: boolean) {
  await SecureStore.setItemAsync(DARK_MODE_KEY, JSON.stringify(value));
}

async function persistHaptics(value: boolean) {
  await SecureStore.setItemAsync(HAPTICS_KEY, JSON.stringify(value));
}

async function persistCloudSettings(value: CloudSettings) {
  await SecureStore.setItemAsync(CLOUD_SETTINGS_KEY, JSON.stringify(value));
}

async function persistAuthSession(value: AuthSession | null) {
  if (!value) {
    await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
    return;
  }
  await SecureStore.setItemAsync(AUTH_SESSION_KEY, JSON.stringify(value));
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
  const [revenueCatPackages, setRevenueCatPackages] = useState<PurchasesPackage[]>([]);
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
  const contentBottomPadding = insets.bottom + 100;

  useEffect(() => {
    async function load() {
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
          SecureStore.getItemAsync(PIN_KEY),
          AsyncStorage.getItem(CLIENTS_KEY),
          SecureStore.getItemAsync(BIOMETRIC_KEY),
          SecureStore.getItemAsync(CLOUD_SETTINGS_KEY),
          SecureStore.getItemAsync(MARKET_MESSAGE_KEY),
          SecureStore.getItemAsync(DARK_MODE_KEY),
          AsyncStorage.getItem(GOALS_KEY),
          AsyncStorage.getItem(ADVISOR_MESSAGES_KEY),
          AsyncStorage.getItem(VAULT_DOCUMENTS_KEY),
          SecureStore.getItemAsync(AUTH_SESSION_KEY),
          SecureStore.getItemAsync(HAPTICS_KEY),
        ]);

        setStoredPin(pin);
        setBiometricEnabled(parseStoredJson(rawBiometric, false));
        setClients(parseStoredJson(rawClients, [] as Client[]));
        setCloudSettings(parseStoredJson(rawCloudSettings, emptyCloudSettings));

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
        const hardware = await LocalAuthentication.hasHardwareAsync().catch(() => false);
        const enrolled = await LocalAuthentication.isEnrolledAsync().catch(() => false);
        setBiometricAvailable(hardware && enrolled);

        await initializeRevenueCat();
        const proStatus = await checkProStatus();
        setIsPro(proStatus);
        const pkgs = await getOfferings();
        setRevenueCatPackages(pkgs);

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
    void SecureStore.setItemAsync(MARKET_MESSAGE_KEY, marketMessage);
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
    const result = await LocalAuthentication.authenticateAsync({
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

    await SecureStore.setItemAsync(PIN_KEY, pinSetup);
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
    await SecureStore.deleteItemAsync(PIN_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
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

          <TextInput
            value={cloudSettings.endpoint}
            onChangeText={(value) =>
              setCloudSettings((current) => ({ ...current, endpoint: value }))
            }
            placeholder="Backend URL, e.g. http://192.168.1.10:4000"
            placeholderTextColor="#7f90a8"
            autoCapitalize="none"
            style={styles.authInput}
          />
          <TextInput
            value={cloudSettings.authUsername}
            onChangeText={(value) =>
              setCloudSettings((current) => ({ ...current, authUsername: value }))
            }
            placeholder="Username"
            placeholderTextColor="#7f90a8"
            autoCapitalize="none"
            style={styles.authInput}
          />
          <TextInput
            value={authPassword}
            onChangeText={setAuthPassword}
            placeholder="Password"
            placeholderTextColor="#7f90a8"
            secureTextEntry
            style={styles.authInput}
          />

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
          })).slice(0, 3)}
          reminderKpis={dashboardReminderKpis}
          stats={dashboardStats}
          theme={theme}
        />
      ) : (
      <ScrollView
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
        <View style={[styles.panel, styles.analyticsPanel]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.panelTitle}>Unified portfolio view & analytics</Text>
              <Text style={styles.panelSubtitle}>
                All tracked client portfolios in one place with performance, allocation,
                and risk visibility.
              </Text>
            </View>
            <Pressable
              style={[styles.primaryButton, { marginLeft: 12, paddingHorizontal: 14, paddingVertical: 8 }]}
              onPress={() => void refreshLiveMarketPrices()}
              disabled={isMarketRefreshing}
            >
              <Text style={styles.primaryButtonText}>
                {isMarketRefreshing ? "Updating..." : "⚡ Refresh Prices"}
              </Text>
            </Pressable>
          </View>
          <View style={styles.analyticsSummaryRow}>
            <View style={[styles.analyticsMetricCard, styles.analyticsBlue]}>
              <Text style={styles.analyticsMetricLabel}>Current value</Text>
              <Text style={styles.analyticsMetricValue}>
                {currencyDisplay(`${unifiedPortfolioAnalytics.totalCurrent}`)}
              </Text>
            </View>
            <View style={[styles.analyticsMetricCard, styles.analyticsSlate]}>
              <Text style={styles.analyticsMetricLabel}>Invested value</Text>
              <Text style={styles.analyticsMetricValue}>
                {currencyDisplay(`${unifiedPortfolioAnalytics.totalInvested}`)}
              </Text>
            </View>
            <View
              style={[
                styles.analyticsMetricCard,
                unifiedPortfolioAnalytics.totalGainLoss >= 0
                  ? styles.analyticsGreen
                  : styles.analyticsRed,
              ]}
            >
              <Text style={styles.analyticsMetricLabel}>Gain / loss</Text>
              <Text style={styles.analyticsMetricValue}>
                {currencyDisplay(`${unifiedPortfolioAnalytics.totalGainLoss}`)}
              </Text>
            </View>
            <View style={[styles.analyticsMetricCard, styles.analyticsGold]}>
              <Text style={styles.analyticsMetricLabel}>Tracked holdings</Text>
              <Text style={styles.analyticsMetricValue}>
                {unifiedPortfolioAnalytics.holdings.length}
              </Text>
            </View>
          </View>

          <View style={styles.dualColumn}>
            <View style={styles.column}>
              <Text style={styles.sectionLabel}>Asset allocation</Text>
              {unifiedPortfolioAnalytics.allocation.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No portfolio analytics yet</Text>
                  <Text style={styles.emptyText}>
                    Add holdings to client portfolios to unlock allocation analytics.
                  </Text>
                </View>
              ) : (
                unifiedPortfolioAnalytics.allocation.map((item) => (
                  <View key={item.assetClass} style={styles.allocationRow}>
                    <View style={styles.allocationHeader}>
                      <Text style={styles.clientName}>{item.assetClass}</Text>
                      <Text style={styles.clientMeta}>{item.weight.toFixed(1)}%</Text>
                    </View>
                    <View style={styles.allocationBarTrack}>
                      <View
                        style={[
                          styles.allocationBarFill,
                          { width: `${Math.min(item.weight, 100)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.clientSubMeta}>
                      {currencyDisplay(`${item.currentValue}`)}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.column}>
              <Text style={styles.sectionLabel}>Risk flags</Text>
              {unifiedPortfolioAnalytics.riskFlags.map((flag) => (
                <Text key={flag} style={styles.analyticsAlert}>
                  {flag}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.dualColumn}>
            <View style={styles.column}>
              <Text style={styles.sectionLabel}>Top performers</Text>
              {unifiedPortfolioAnalytics.topPerformers.length === 0 ? (
                <Text style={styles.detailBlock}>No performance data available yet.</Text>
              ) : (
                unifiedPortfolioAnalytics.topPerformers.map((item) => (
                  <View key={`${item.clientId}-${item.id}`} style={styles.analyticsListCard}>
                    <Text style={styles.clientName}>{item.assetName}</Text>
                    <Text style={styles.clientMeta}>
                      {item.clientName} | {item.assetClass}
                    </Text>
                    <Text style={styles.analyticsPositive}>
                      {item.returnPct.toFixed(1)}% | {currencyDisplay(`${item.gainLoss}`)}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.column}>
              <Text style={styles.sectionLabel}>Underperformers</Text>
              {unifiedPortfolioAnalytics.laggards.length === 0 ? (
                <Text style={styles.detailBlock}>No laggards detected yet.</Text>
              ) : (
                unifiedPortfolioAnalytics.laggards.map((item) => (
                  <View key={`${item.clientId}-${item.id}`} style={styles.analyticsListCard}>
                    <Text style={styles.clientName}>{item.assetName}</Text>
                    <Text style={styles.clientMeta}>
                      {item.clientName} | {item.assetClass}
                    </Text>
                    <Text
                      style={
                        item.gainLoss >= 0
                          ? styles.analyticsPositive
                          : styles.analyticsNegative
                      }
                    >
                      {item.returnPct.toFixed(1)}% | {currencyDisplay(`${item.gainLoss}`)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>

          <Text style={styles.sectionLabel}>Client portfolio snapshot</Text>
          {unifiedPortfolioAnalytics.clientSummaries.length === 0 ? (
            <Text style={styles.detailBlock}>No client portfolio summaries yet.</Text>
          ) : (
            unifiedPortfolioAnalytics.clientSummaries.map((item) => (
              <View key={item.clientId} style={styles.analyticsListCard}>
                <Text style={styles.clientName}>{item.clientName}</Text>
                <Text style={styles.clientMeta}>
                  {item.category} | {item.holdings} holding{item.holdings === 1 ? "" : "s"}
                </Text>
                <Text style={styles.clientSubMeta}>
                  Current: {currencyDisplay(`${item.current}`)} | Invested:{" "}
                  {currencyDisplay(`${item.invested}`)}
                </Text>
              </View>
            ))
          )}
        </View>
        ) : null}

        {activeTab === "Workspace" ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Daily market message</Text>
            <Text style={styles.panelSubtitle}>
              This message becomes your default update for direct outreach and campaigns.
            </Text>
            <TextInput
              multiline
              value={marketMessage}
              onChangeText={(value) => {
                setMarketMessage(value);
                setBroadcastMessage(value);
              }}
              style={[styles.input, styles.messageInput]}
            />
          </View>
        ) : null}

        {activeTab === "Workspace" || activeTab === "Tools" ? (
          <View style={styles.dualColumn}>
          {activeTab === "Workspace" ? <View style={styles.column}>
            <View style={[styles.panel, styles.calculatorPanel]}>
              <Text style={styles.panelTitle}>AI market research</Text>
              <Text style={styles.panelSubtitle}>
                Run a real Gemini-powered brief for a stock, fund, sector, or macro topic and turn it into advisor-ready outreach.
              </Text>
              <TextInput
                value={marketResearchNotes}
                onChangeText={setMarketResearchNotes}
                placeholder="e.g. Nifty IT, Reliance Industries, banking sector, gold ETF"
                placeholderTextColor="#7f90a8"
                style={styles.input}
              />
              <View style={styles.inlineActions}>
                <Pressable
                  style={styles.primaryButton}
                  onPress={() => void runWorkspaceAiBrief()}
                  disabled={isAiResearchLoading}
                >
                  <Text style={styles.primaryButtonText}>
                    {isAiResearchLoading ? "Researching..." : "Generate Brief"}
                  </Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={useAiBriefAsDailyMessage}>
                  <Text style={styles.secondaryButtonText}>Use for Broadcast</Text>
                </Pressable>
              </View>
              <Text style={styles.detailBlock}>{aiResearchState}</Text>
              {aiResearchResult ? (
                <View style={styles.aiResearchResult}>
                  <View style={styles.aiResearchHeader}>
                    <Text style={styles.sectionLabel}>Live brief</Text>
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
                  <Text style={styles.historyItem}>{aiResearchResult.summary}</Text>
                  <Text style={styles.sectionLabel}>Outlook</Text>
                  <Text style={styles.historyItem}>
                    Short term: {aiResearchResult.shortTermOutlook}
                  </Text>
                  <Text style={styles.historyItem}>
                    Long term: {aiResearchResult.longTermOutlook}
                  </Text>
                  {aiResearchResult.opportunities.slice(0, 2).map((item, index) => (
                    <Text key={`opp-${index}`} style={styles.historyItem}>
                      Opportunity: {item}
                    </Text>
                  ))}
                  {aiResearchResult.risks.slice(0, 2).map((item, index) => (
                    <Text key={`risk-${index}`} style={styles.historyItem}>
                      Risk: {item}
                    </Text>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No AI brief yet</Text>
                  <Text style={styles.emptyText}>
                    Run a topic through Gemini to generate a real market brief here.
                  </Text>
                </View>
              )}
            </View>
          </View> : null}

          {activeTab === "Tools" ? <View style={styles.column}>
            <View style={[styles.panel, styles.calculatorPanel]}>
              <Text style={styles.panelTitle}>Calculator hub</Text>
              <Text style={styles.panelSubtitle}>
                Use one clean tools tab to switch calculator types quickly.
              </Text>
              <View style={styles.optionRow}>
                {CALCULATOR_TABS.map((tab) => {
                  const active = activeCalculator === tab;
                  return (
                    <Pressable
                      key={tab}
                      style={[styles.optionChip, active ? styles.optionChipActive : null]}
                      onPress={() => setActiveCalculator(tab)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          active ? styles.optionChipTextActive : null,
                        ]}
                      >
                        {tab}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {activeCalculator === "Cash Flow" ? (
                <>
                  <Text style={styles.sectionLabel}>Cash flow calculator</Text>
                  <TextInput
                    value={cashFlowAmount}
                    onChangeText={setCashFlowAmount}
                    placeholder="Investment amount"
                    placeholderTextColor="#7f90a8"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                  <TextInput
                    value={cashFlowRate}
                    onChangeText={setCashFlowRate}
                    placeholder="Annual interest rate (%)"
                    placeholderTextColor="#7f90a8"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                  <TextInput
                    value={cashFlowYears}
                    onChangeText={setCashFlowYears}
                    placeholder="Duration in years"
                    placeholderTextColor="#7f90a8"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                  <Text style={styles.inputLabel}>Interest view</Text>
                  <View style={styles.optionRow}>
                    {CASH_FLOW_FREQUENCIES.map((option) => {
                      const active = cashFlowFrequency === option;
                      return (
                        <Pressable
                          key={option}
                          style={[
                            styles.optionChip,
                            active ? styles.optionChipActive : null,
                          ]}
                          onPress={() => setCashFlowFrequency(option)}
                        >
                          <Text
                            style={[
                              styles.optionChipText,
                              active ? styles.optionChipTextActive : null,
                            ]}
                          >
                            {option}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={styles.inputLabel}>Calculation type</Text>
                  <View style={styles.optionRow}>
                    {CASH_FLOW_MODES.map((option) => {
                      const active = cashFlowMode === option;
                      return (
                        <Pressable
                          key={option}
                          style={[
                            styles.optionChip,
                            active ? styles.optionChipActive : null,
                          ]}
                          onPress={() => setCashFlowMode(option)}
                        >
                          <Text
                            style={[
                              styles.optionChipText,
                              active ? styles.optionChipTextActive : null,
                            ]}
                          >
                            {option}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {cashFlowResults.ready ? (
                    <View style={styles.calculatorResultGrid}>
                      <View style={[styles.miniStat, styles.calculatorStat]}>
                        <Text style={styles.miniStatValue}>
                          {currencyDisplay(`${cashFlowResults.payoutPerPeriod}`)}
                        </Text>
                        <Text style={styles.miniStatLabel}>
                          {cashFlowMode === "Payout"
                            ? `${cashFlowFrequency} interest`
                            : `${cashFlowFrequency} avg growth`}
                        </Text>
                      </View>
                      <View style={[styles.miniStat, styles.calculatorStat]}>
                        <Text style={styles.miniStatValue}>
                          {currencyDisplay(`${cashFlowResults.annualInterest}`)}
                        </Text>
                        <Text style={styles.miniStatLabel}>Yearly interest</Text>
                      </View>
                      <View style={[styles.miniStat, styles.calculatorStat]}>
                        <Text style={styles.miniStatValue}>
                          {currencyDisplay(`${cashFlowResults.totalInterest}`)}
                        </Text>
                        <Text style={styles.miniStatLabel}>Total interest</Text>
                      </View>
                      <View style={[styles.miniStat, styles.calculatorStat]}>
                        <Text style={styles.miniStatValue}>
                          {currencyDisplay(`${cashFlowResults.maturityValue}`)}
                        </Text>
                        <Text style={styles.miniStatLabel}>
                          {cashFlowMode === "Payout"
                            ? "Principal at end"
                            : "Maturity value"}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyTitle}>Calculator ready</Text>
                      <Text style={styles.emptyText}>
                        Add amount, rate, and duration to see the interest calculation here.
                      </Text>
                    </View>
                  )}
                </>
              ) : null}

              {activeCalculator === "SIP" ? (
                <>
                  <Text style={styles.sectionLabel}>SIP calculator</Text>
                  <TextInput
                    value={sipAmount}
                    onChangeText={setSipAmount}
                    placeholder="SIP amount per installment"
                    placeholderTextColor="#7f90a8"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                  <TextInput
                    value={sipRate}
                    onChangeText={setSipRate}
                    placeholder="Expected annual return (%)"
                    placeholderTextColor="#7f90a8"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                  <TextInput
                    value={sipYears}
                    onChangeText={setSipYears}
                    placeholder="Duration in years"
                    placeholderTextColor="#7f90a8"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                  <Text style={styles.inputLabel}>SIP frequency</Text>
                  <View style={styles.optionRow}>
                    {SIP_FREQUENCIES.map((option) => {
                      const active = sipFrequency === option;
                      return (
                        <Pressable
                          key={option}
                          style={[
                            styles.optionChip,
                            active ? styles.optionChipActive : null,
                          ]}
                          onPress={() => setSipFrequency(option)}
                        >
                          <Text
                            style={[
                              styles.optionChipText,
                              active ? styles.optionChipTextActive : null,
                            ]}
                          >
                            {option}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {sipResults.ready ? (
                    <View style={styles.calculatorResultGrid}>
                      <View style={[styles.miniStat, styles.calculatorStat]}>
                        <Text style={styles.miniStatValue}>
                          {currencyDisplay(`${sipResults.totalInvested}`)}
                        </Text>
                        <Text style={styles.miniStatLabel}>Total invested</Text>
                      </View>
                      <View style={[styles.miniStat, styles.calculatorStat]}>
                        <Text style={styles.miniStatValue}>
                          {currencyDisplay(`${sipResults.estimatedReturns}`)}
                        </Text>
                        <Text style={styles.miniStatLabel}>Estimated returns</Text>
                      </View>
                      <View style={[styles.miniStat, styles.calculatorStat]}>
                        <Text style={styles.miniStatValue}>
                          {currencyDisplay(`${sipResults.maturityValue}`)}
                        </Text>
                        <Text style={styles.miniStatLabel}>Estimated maturity</Text>
                      </View>
                      <View style={[styles.miniStat, styles.calculatorStat]}>
                        <Text style={styles.miniStatValue}>{sipResults.installments}</Text>
                        <Text style={styles.miniStatLabel}>Installments</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyTitle}>SIP calculator ready</Text>
                      <Text style={styles.emptyText}>
                        Add SIP amount, expected rate, and duration to see the projection here.
                      </Text>
                    </View>
                  )}
                </>
              ) : null}

              {activeCalculator === "Goal Planner" ? (
                <>
                  <Text style={styles.sectionLabel}>Goal planner</Text>
                  <TextInput
                    value={goalTargetAmount}
                    onChangeText={setGoalTargetAmount}
                    placeholder="Target amount"
                    placeholderTextColor="#7f90a8"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                  <TextInput
                    value={goalExpectedReturn}
                    onChangeText={setGoalExpectedReturn}
                    placeholder="Expected annual return (%)"
                    placeholderTextColor="#7f90a8"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                  <TextInput
                    value={goalYears}
                    onChangeText={setGoalYears}
                    placeholder="Years to goal"
                    placeholderTextColor="#7f90a8"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                  {goalPlannerResults.ready ? (
                    <View style={styles.calculatorResultGrid}>
                      <View style={[styles.miniStat, styles.calculatorStat]}>
                        <Text style={styles.miniStatValue}>
                          {currencyDisplay(`${goalPlannerResults.requiredMonthlySip}`)}
                        </Text>
                        <Text style={styles.miniStatLabel}>Required monthly SIP</Text>
                      </View>
                      <View style={[styles.miniStat, styles.calculatorStat]}>
                        <Text style={styles.miniStatValue}>
                          {currencyDisplay(`${goalPlannerResults.totalInvested}`)}
                        </Text>
                        <Text style={styles.miniStatLabel}>Estimated invested</Text>
                      </View>
                      <View style={[styles.miniStat, styles.calculatorStat]}>
                        <Text style={styles.miniStatValue}>
                          {currencyDisplay(`${goalPlannerResults.estimatedGrowth}`)}
                        </Text>
                        <Text style={styles.miniStatLabel}>Expected growth</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyTitle}>Goal planner ready</Text>
                      <Text style={styles.emptyText}>
                        Add target amount, return, and years to calculate the required SIP.
                      </Text>
                    </View>
                  )}
                </>
              ) : null}

              {activeCalculator === "Retirement" ? (
                <>
                  <Text style={styles.sectionLabel}>Retirement planner</Text>
                  <TextInput
                    value={retirementMonthlyExpense}
                    onChangeText={setRetirementMonthlyExpense}
                    placeholder="Current monthly expense"
                    placeholderTextColor="#7f90a8"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                  <TextInput
                    value={retirementInflation}
                    onChangeText={setRetirementInflation}
                    placeholder="Inflation (%)"
                    placeholderTextColor="#7f90a8"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                  <TextInput
                    value={retirementReturn}
                    onChangeText={setRetirementReturn}
                    placeholder="Expected return before retirement (%)"
                    placeholderTextColor="#7f90a8"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                  <TextInput
                    value={retirementYearsToRetire}
                    onChangeText={setRetirementYearsToRetire}
                    placeholder="Years to retirement"
                    placeholderTextColor="#7f90a8"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                  <TextInput
                    value={retirementYearsAfterRetire}
                    onChangeText={setRetirementYearsAfterRetire}
                    placeholder="Years after retirement"
                    placeholderTextColor="#7f90a8"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                  {retirementResults.ready ? (
                    <View style={styles.calculatorResultGrid}>
                      <View style={[styles.miniStat, styles.calculatorStat]}>
                        <Text style={styles.miniStatValue}>
                          {currencyDisplay(`${retirementResults.futureMonthlyExpense}`)}
                        </Text>
                        <Text style={styles.miniStatLabel}>Future monthly expense</Text>
                      </View>
                      <View style={[styles.miniStat, styles.calculatorStat]}>
                        <Text style={styles.miniStatValue}>
                          {currencyDisplay(`${retirementResults.targetCorpus}`)}
                        </Text>
                        <Text style={styles.miniStatLabel}>Target corpus</Text>
                      </View>
                      <View style={[styles.miniStat, styles.calculatorStat]}>
                        <Text style={styles.miniStatValue}>
                          {currencyDisplay(`${retirementResults.requiredMonthlySip}`)}
                        </Text>
                        <Text style={styles.miniStatLabel}>Required monthly SIP</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyTitle}>Retirement planner ready</Text>
                      <Text style={styles.emptyText}>
                        Add expense, inflation, returns, and timeline to estimate retirement corpus.
                      </Text>
                    </View>
                  )}
                </>
              ) : null}
            </View>
          </View> : null}
          </View>
        ) : null}

        {activeTab === "Workspace" ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Smart segmentation</Text>
          <Text style={styles.panelSubtitle}>
            Client mix snapshot for campaign targeting and advisor review.
          </Text>
          <View style={styles.categoryGrid}>
            {categorySummary.map((item) => (
              <View key={item.label} style={styles.categoryCard}>
                <Text style={styles.categoryValue}>{item.value}</Text>
                <Text style={styles.categoryLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
        ) : null}

        {activeTab === "Clients" ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Search and filters</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, email, phone, city, or risk profile"
            placeholderTextColor="#7f90a8"
            style={styles.input}
          />
          <Text style={styles.inputLabel}>Client category</Text>
          <View style={styles.optionRow}>
            {CATEGORY_FILTER_OPTIONS.map((category) => {
              const active = categoryFilter === category;
              return (
                <Pressable
                  key={category}
                  style={[styles.optionChip, active ? styles.optionChipActive : null]}
                  onPress={() => setCategoryFilter(category)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      active ? styles.optionChipTextActive : null,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.inputLabel}>Focus mode</Text>
          <View style={styles.optionRow}>
            {(["All", "Due", "High Priority"] as const).map((mode) => {
              const active = filterMode === mode;
              return (
                <Pressable
                  key={mode}
                  style={[styles.optionChip, active ? styles.optionChipActive : null]}
                  onPress={() => setFilterMode(mode)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      active ? styles.optionChipTextActive : null,
                    ]}
                  >
                    {mode}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        ) : null}

        {activeTab === "Clients" ? (
        <View style={styles.broadcastStrip}>
          <Text style={styles.broadcastStripText}>
            {selectedClientIds.length} client{selectedClientIds.length === 1 ? "" : "s"} selected for bulk campaign.
          </Text>
          <View style={styles.inlineActions}>
            <Pressable style={styles.linkButton} onPress={selectAllVisibleClients}>
              <Text style={styles.linkButtonText}>Select Visible</Text>
            </Pressable>
            <Pressable style={styles.linkButton} onPress={clearSelectedClients}>
              <Text style={styles.linkButtonText}>Clear</Text>
            </Pressable>
            <Pressable
              style={styles.linkButton}
              onPress={() => setIsBroadcastModalOpen(true)}
            >
              <Text style={styles.linkButtonText}>Send Bulk Update</Text>
            </Pressable>
          </View>
        </View>
        ) : null}

        {activeTab === "Clients" ? (
        <View style={styles.dualColumn}>
          <View style={styles.column}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Client list</Text>
              <Text style={styles.panelSubtitle}>
                {filteredClients.length} visible client{filteredClients.length === 1 ? "" : "s"} in this view.
              </Text>
              {filteredClients.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No matching clients</Text>
                  <Text style={styles.emptyText}>
                    Adjust your filters, add a client, or load the institutional showcase portfolio.
                  </Text>
                  <Pressable
                    style={[styles.primaryButton, { marginTop: 14, backgroundColor: theme.colors.brand }]}
                    onPress={() => void seedDemoClients()}
                  >
                    <Text style={[styles.primaryButtonText, { color: "#050914", fontWeight: "800" }]}>
                      ⚡ Load Demo Roster & Holdings (Judge Showcase)
                    </Text>
                  </Pressable>
                </View>
              ) : (
                filteredClients.map((client) => {
                  const active = selectedClientId === client.id;
                  const selected = selectedClientIds.includes(client.id);
                  return (
                    <View key={client.id} style={styles.clientRowShell}>
                      <Pressable
                        style={[styles.selectorPill, selected ? styles.selectorPillActive : null]}
                        onPress={() => toggleSelectedClient(client.id)}
                      >
                        <Text
                          style={[
                            styles.selectorPillText,
                            selected ? styles.selectorPillTextActive : null,
                          ]}
                        >
                          {selected ? "Selected" : "Select"}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[styles.clientRow, active ? styles.clientRowActive : null]}
                        onPress={() => setSelectedClientId(client.id)}
                      >
                        <View style={styles.clientRowMain}>
                          <Text style={styles.clientName}>{client.name}</Text>
                          <Text style={styles.clientMeta}>
                            {client.category} | {client.priority} | {client.preferredChannel}
                          </Text>
                          <Text style={styles.clientSubMeta}>
                            Follow-up: {formatReminderDate(client.reminderDate)}
                          </Text>
                        </View>
                        {isReminderDue(client.reminderDate) ? (
                          <View style={styles.dueBadge}>
                            <Text style={styles.dueBadgeText}>Due</Text>
                          </View>
                        ) : null}
                      </Pressable>
                    </View>
                  );
                })
              )}
            </View>
          </View>

          <View style={styles.column}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Client details</Text>
              {selectedClient ? (
                <>
                  <Text style={styles.detailName}>{selectedClient.name}</Text>
                  <Text style={styles.detailLine}>{selectedClient.phone}</Text>
                  <Text style={styles.detailLine}>
                    {selectedClient.email || "No email saved"}
                  </Text>
                  <Text style={styles.detailLine}>
                    {selectedClient.city || "Location not saved"}
                  </Text>

                  <View style={styles.tagRow}>
                    {[selectedClient.category, selectedClient.priority, selectedClient.preferredChannel].map(
  (tag, index) => (
    <View key={`${tag}-${index}`} style={styles.tag}>
      <Text style={styles.tagText}>{tag}</Text>
    </View>
  )
)}
                  </View>

                  <Text style={styles.sectionLabel}>Risk profile</Text>
                  <Text style={styles.detailBlock}>
                    {selectedClient.riskProfile || "Not assigned"}
                  </Text>

                  <Text style={styles.sectionLabel}>Portfolio allocation</Text>
                  <AssetAllocationBar allocationString={selectedClient.allocation} theme={theme} />
                  <Text style={[styles.detailBlock, { marginTop: 6 }]}>
                    {selectedClient.allocation || "Not saved"}
                  </Text>

                  <Text style={styles.sectionLabel}>Watchlist</Text>
                  <Text style={styles.detailBlock}>
                    {selectedClient.watchlist.join(", ") || "No watchlist saved"}
                  </Text>

                  <Text style={styles.sectionLabel}>Private notes</Text>
                  <Text style={styles.detailBlock}>
                    {selectedClient.notes || "No notes added yet"}
                  </Text>

                  <Text style={styles.sectionLabel}>Next reminder</Text>
                  <Text style={styles.detailBlock}>
                    {formatReminderDate(selectedClient.reminderDate)}
                  </Text>

                  <Text style={styles.sectionLabel}>Quick contact</Text>
                  <View style={styles.optionRow}>
                    {CHANNEL_OPTIONS.map((channel) => (
                      <Pressable
                        key={channel}
                        style={styles.darkChip}
                        onPress={() => void contactClient(selectedClient, channel)}
                      >
                        <Text style={styles.darkChipText}>{channel}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.inlineActions}>
                    <Pressable
                      style={styles.linkButton}
                      onPress={() => {
                        if (!isPro) {
                          setIsPaywallVisible(true);
                          return;
                        }
                        void exportClientPdfReport({
                          client: selectedClient,
                          advisorName: authSession?.user?.username || cloudSettings.ownerName || "Asset Array Advisor",
                        });
                      }}
                    >
                      <Text style={[styles.linkButtonText, { color: theme.colors.warning }]}>
                        📄 Export PDF Report
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.linkButton}
                      onPress={() => openEditModal(selectedClient)}
                    >
                      <Text style={styles.linkButtonText}>Edit Client</Text>
                    </Pressable>
                    <Pressable
                      style={styles.linkButton}
                      onPress={() => deleteClient(selectedClient)}
                    >
                      <Text style={[styles.linkButtonText, styles.linkDanger]}>Delete</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.sectionLabel}>Recent update history</Text>
                  {selectedClient.updateHistory.length === 0 ? (
                    <Text style={styles.detailBlock}>No updates shared yet.</Text>
                  ) : (
                    (selectedClient.updateHistory || []).map((item, index) => (
                      <Text key={`history-${selectedClient.id}-${index}`} style={styles.historyItem}>
                        {item}
                      </Text>
                    ))
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Select a client</Text>
                  <Text style={styles.emptyText}>
                    Review profile details, reminders, and communication history here.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        ) : null}

        {activeTab === "Clients" || activeTab === "Portfolios" ? (
        <View style={styles.dualColumn}>
          <View style={styles.column}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Portfolio manager</Text>
              {selectedClient ? (
                <>
                  <Text style={styles.panelSubtitle}>
                    Add, rename, edit, or remove any holding in {selectedClient.name}'s
                    current portfolio.
                  </Text>
                  <View style={styles.statRow}>
                    <View style={styles.miniStat}>
                      <Text style={styles.miniStatValue}>{portfolioStats.holdings}</Text>
                      <Text style={styles.miniStatLabel}>Holdings</Text>
                    </View>
                    <View style={styles.miniStat}>
                      <Text style={styles.miniStatValue}>
                        {currencyDisplay(`${portfolioStats.invested}`)}
                      </Text>
                      <Text style={styles.miniStatLabel}>Invested</Text>
                    </View>
                    <View style={styles.miniStat}>
                      <Text style={styles.miniStatValue}>
                        {currencyDisplay(`${portfolioStats.current}`)}
                      </Text>
                      <Text style={styles.miniStatLabel}>Current</Text>
                    </View>
                  </View>
                  <Pressable style={styles.goldButton} onPress={openAddHoldingModal}>
                    <Text style={styles.goldButtonText}>+ Add Holding</Text>
                  </Pressable>
                  {selectedClient.portfolio.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyTitle}>No holdings yet</Text>
                      <Text style={styles.emptyText}>
                        Add stocks, funds, or any asset names you want to track and rename later.
                      </Text>
                    </View>
                  ) : (
                    selectedClient.portfolio.map((holding) => (
                      <View key={holding.id} style={styles.holdingCard}>
                        <Text style={styles.holdingTitle}>
                          {holding.assetName}
                          {holding.ticker ? ` (${holding.ticker})` : ""}
                        </Text>
                        <Text style={styles.holdingMeta}>
                          Class: {holding.assetClass ?? "Stocks"}
                        </Text>
                        <Text style={styles.holdingMeta}>
                          Qty: {holding.quantity || "-"} | Target: {holding.targetWeight || "-"}
                        </Text>
                        <Text style={styles.holdingMeta}>
                          Invested: {holding.investedValue ? currencyDisplay(holding.investedValue) : "-"}
                        </Text>
                        <Text style={styles.holdingMeta}>
                          Current: {holding.currentValue ? currencyDisplay(holding.currentValue) : "-"}
                        </Text>
                        {holding.notes ? (
                          <Text style={styles.holdingNote}>{holding.notes}</Text>
                        ) : null}
                        <View style={styles.inlineActions}>
                          <Pressable
                            style={styles.linkButton}
                            onPress={() => openEditHoldingModal(holding)}
                          >
                            <Text style={styles.linkButtonText}>Edit / Rename</Text>
                          </Pressable>
                          <Pressable
                            style={styles.linkButton}
                            onPress={() => deleteHolding(holding)}
                          >
                            <Text style={[styles.linkButtonText, styles.linkDanger]}>
                              Remove
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    ))
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Select a client first</Text>
                  <Text style={styles.emptyText}>
                    The portfolio manager opens for the client you are currently viewing.
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.column}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Follow-up reminders</Text>
              {dueClients.length === 0 ? (
                <Text style={styles.detailBlock}>
                  No client follow-ups are due today.
                </Text>
              ) : (
                dueClients.map((client) => (
                  <View key={client.id} style={styles.reminderRow}>
                    <View style={styles.clientRowMain}>
                      <Text style={styles.clientName}>{client.name}</Text>
                      <Text style={styles.clientSubMeta}>
                        Due on {formatReminderDate(client.reminderDate)}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.slimButton}
                      onPress={() => setSelectedClientId(client.id)}
                    >
                      <Text style={styles.slimButtonText}>Open</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Client categories</Text>
              <View style={styles.categoryGrid}>
                {categorySummary.map((item) => (
                  <View key={item.label} style={styles.categoryCard}>
                    <Text style={styles.categoryValue}>{item.value}</Text>
                    <Text style={styles.categoryLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
        ) : null}

        {activeTab === "Clients" ? (
        <View style={styles.dualColumn}>
          <View style={styles.column}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Client insight engine</Text>
              <Text style={styles.panelSubtitle}>
                Quick advisory insights and a personalized message draft for the selected client.
              </Text>
              {selectedClient ? (
                <>
                  {selectedClientInsights.map((item) => (
                    <Text key={item} style={styles.historyItem}>
                      {item}
                    </Text>
                  ))}
                  <Text style={styles.sectionLabel}>Personalised client message</Text>
                  <Text style={styles.historyItem}>{selectedClientMessageDraft}</Text>
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Select a client first</Text>
                  <Text style={styles.emptyText}>
                    The insight engine summarizes the selected client using profile and portfolio data.
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.column}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Report studio</Text>
              <Text style={styles.panelSubtitle}>
                PDF-ready report draft content that can be moved into an export workflow.
              </Text>
              {selectedClient ? (
                <Text style={styles.reportBlock}>{selectedClientReportDraft}</Text>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No report target selected</Text>
                  <Text style={styles.emptyText}>
                    Select a client first to generate a report draft.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        ) : null}

        {activeTab === "Tools" || activeTab === "Workspace" ? (
        <View style={styles.dualColumn}>
          {activeTab === "Tools" ? <View style={styles.column}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Goal center</Text>
              <Text style={styles.panelSubtitle}>
                Retirement, education, emergency, and wealth goals ko track karo with progress visibility.
              </Text>
              <View style={styles.analyticsSummaryRow}>
                <View style={[styles.analyticsMetricCard, styles.analyticsGold]}>
                  <Text style={styles.analyticsMetricLabel}>Target corpus</Text>
                  <Text style={styles.analyticsMetricValue}>
                    {currencyDisplay(`${goalCenterStats.totalTarget}`)}
                  </Text>
                </View>
                <View style={[styles.analyticsMetricCard, styles.analyticsBlue]}>
                  <Text style={styles.analyticsMetricLabel}>Current progress</Text>
                  <Text style={styles.analyticsMetricValue}>
                    {currencyDisplay(`${goalCenterStats.totalCurrent}`)}
                  </Text>
                </View>
                <View style={[styles.analyticsMetricCard, styles.analyticsRed]}>
                  <Text style={styles.analyticsMetricLabel}>Urgent goals</Text>
                  <Text style={styles.analyticsMetricValue}>{goalCenterStats.urgentGoals}</Text>
                </View>
              </View>
              <TextInput
                value={goalDraft.title}
                onChangeText={(value) => updateGoalDraft("title", value)}
                placeholder="Goal name"
                placeholderTextColor="#7f90a8"
                style={styles.input}
              />
              <View style={styles.optionRow}>
                {GOAL_TYPE_OPTIONS.map((option) => {
                  const active = goalDraft.goalType === option;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.optionChip, active ? styles.optionChipActive : null]}
                      onPress={() => updateGoalDraft("goalType", option)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          active ? styles.optionChipTextActive : null,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                value={goalDraft.targetAmount}
                onChangeText={(value) => updateGoalDraft("targetAmount", value)}
                placeholder="Target amount"
                placeholderTextColor="#7f90a8"
                keyboardType="decimal-pad"
                style={styles.input}
              />
              <TextInput
                value={goalDraft.currentAmount}
                onChangeText={(value) => updateGoalDraft("currentAmount", value)}
                placeholder="Current amount"
                placeholderTextColor="#7f90a8"
                keyboardType="decimal-pad"
                style={styles.input}
              />
              <TextInput
                value={goalDraft.targetYear}
                onChangeText={(value) => updateGoalDraft("targetYear", value)}
                placeholder="Target year"
                placeholderTextColor="#7f90a8"
                keyboardType="number-pad"
                style={styles.input}
              />
              <TextInput
                value={goalDraft.monthlyContribution}
                onChangeText={(value) => updateGoalDraft("monthlyContribution", value)}
                placeholder="Monthly contribution"
                placeholderTextColor="#7f90a8"
                keyboardType="decimal-pad"
                style={styles.input}
              />
              <View style={styles.optionRow}>
                {GOAL_PRIORITY_OPTIONS.map((option) => {
                  const active = goalDraft.priority === option;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.optionChip, active ? styles.optionChipActive : null]}
                      onPress={() => updateGoalDraft("priority", option)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          active ? styles.optionChipTextActive : null,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable style={styles.goldButton} onPress={saveGoalFromDraft}>
                <Text style={styles.goldButtonText}>Add Goal</Text>
              </Pressable>
              {goalCenterStats.rows.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No goals added yet</Text>
                  <Text style={styles.emptyText}>
                    Add target-based goals and track funding progress here.
                  </Text>
                </View>
              ) : (
                goalCenterStats.rows.map((goal) => (
                  <View key={goal.id} style={styles.analyticsListCard}>
                    <Text style={styles.clientName}>{goal.title}</Text>
                    <Text style={styles.clientMeta}>
                      {goal.goalType} | {goal.priority} | Target year {goal.targetYear}
                    </Text>
                    <Text style={styles.clientSubMeta}>
                      Current {currencyDisplay(goal.currentAmount)} / Target {currencyDisplay(goal.targetAmount)}
                    </Text>
                    <View style={styles.allocationBarTrack}>
                      <View
                        style={[
                          styles.allocationBarFill,
                          { width: `${Math.min(goal.progress, 100)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.clientSubMeta}>
                      Progress {goal.progress.toFixed(1)}% | Gap {currencyDisplay(`${goal.gap}`)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View> : null}

        {activeTab === "Workspace" ? <View style={styles.column}>
          <AdvisorMessagesScreen
            advisorMessages={advisorMessages}
            advisorMessageDraft={advisorMessageDraft}
            onUpdateDraft={updateAdvisorMessageDraft}
            onSaveDraft={saveAdvisorMessageDraftAction}
            styles={styles}
          />
        </View> : null}
        </View>
        ) : null}

        {activeTab === "Tools" || activeTab === "Workspace" ? (
        <View style={styles.dualColumn}>
          {activeTab === "Tools" ? <View style={styles.column}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Document vault</Text>
              <Text style={styles.panelSubtitle}>
                Secure document metadata storage for reports, KYC, tax files, and review packs.
              </Text>
              <TextInput
                value={vaultDocumentDraft.clientName}
                onChangeText={(value) =>
                  setVaultDocumentDraft((current) => ({ ...current, clientName: value }))
                }
                placeholder="Client name"
                placeholderTextColor="#7f90a8"
                style={styles.input}
              />
              <TextInput
                value={vaultDocumentDraft.fileName}
                onChangeText={(value) =>
                  setVaultDocumentDraft((current) => ({ ...current, fileName: value }))
                }
                placeholder="Document file name"
                placeholderTextColor="#7f90a8"
                style={styles.input}
              />
              <View style={styles.optionRow}>
                {(["Report", "KYC", "Tax", "Review"] as const).map((option) => {
                  const active = vaultDocumentDraft.category === option;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.optionChip, active ? styles.optionChipActive : null]}
                      onPress={() =>
                        setVaultDocumentDraft((current) => ({
                          ...current,
                          category: option,
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          active ? styles.optionChipTextActive : null,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable style={styles.goldButton} onPress={saveVaultDocumentDraftAction}>
                <Text style={styles.goldButtonText}>Add to Vault</Text>
              </Pressable>
              {(vaultDocuments || []).length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Vault is empty</Text>
                  <Text style={styles.emptyText}>
                    Store report, KYC, tax, and review document entries here.
                  </Text>
                </View>
              ) : (
                (vaultDocuments || []).slice(0, 5).map((doc) => (
                  <View key={doc.id} style={styles.analyticsListCard}>
                    <Text style={styles.clientName}>{doc.fileName}</Text>
                    <Text style={styles.clientMeta}>
                      {doc.clientName} | {doc.category} | {doc.status}
                    </Text>
                    <Text style={styles.clientSubMeta}>{doc.date}</Text>
                  </View>
                ))
              )}
            </View>
          </View> : null}

          {activeTab === "Workspace" ? <View style={styles.column}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Automated data aggregation</Text>
              <Text style={styles.panelSubtitle}>
                Linked account snapshot for banks, brokerages, cards, and retirement accounts.
              </Text>
              <View style={styles.analyticsSummaryRow}>
                <View style={[styles.analyticsMetricCard, styles.analyticsBlue]}>
                  <Text style={styles.analyticsMetricLabel}>Connected accounts</Text>
                  <Text style={styles.analyticsMetricValue}>{aggregationSnapshot.connectedCount}</Text>
                </View>
                <View style={[styles.analyticsMetricCard, styles.analyticsGold]}>
                  <Text style={styles.analyticsMetricLabel}>Needs review</Text>
                  <Text style={styles.analyticsMetricValue}>{aggregationSnapshot.reviewCount}</Text>
                </View>
                <View style={[styles.analyticsMetricCard, styles.analyticsSlate]}>
                  <Text style={styles.analyticsMetricLabel}>Total external value</Text>
                  <Text style={styles.analyticsMetricValue}>
                    {currencyDisplay(`${aggregationSnapshot.totalExternalValue}`)}
                  </Text>
                </View>
              </View>
              {connectedAccounts.slice(0, 2).map((account) => (
                <View key={account.id} style={styles.analyticsListCard}>
                  <Text style={styles.clientName}>{account.institution}</Text>
                  <Text style={styles.clientMeta}>
                    {account.accountType} | {account.status}
                  </Text>
                  <Text style={styles.clientSubMeta}>
                    {currencyDisplay(account.currentValue)}
                  </Text>
                </View>
              ))}
            </View>
          </View> : null}
        </View>
        ) : null}

        {activeTab === "Portfolios" ? (
        <View style={styles.dualColumn}>
          {activeTab === "Portfolios" ? <View style={styles.column}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Tax optimization & reporting</Text>
              <Text style={styles.panelSubtitle}>
                Unrealized gain/loss snapshot and tax-aware review notes based on tracked holdings.
              </Text>
              <View style={styles.analyticsSummaryRow}>
                <View style={[styles.analyticsMetricCard, styles.analyticsGreen]}>
                  <Text style={styles.analyticsMetricLabel}>Unrealized gains</Text>
                  <Text style={styles.analyticsMetricValue}>
                    {currencyDisplay(`${taxReporting.unrealizedGain}`)}
                  </Text>
                </View>
                <View style={[styles.analyticsMetricCard, styles.analyticsRed]}>
                  <Text style={styles.analyticsMetricLabel}>Unrealized losses</Text>
                  <Text style={styles.analyticsMetricValue}>
                    {currencyDisplay(`${Math.abs(taxReporting.unrealizedLoss)}`)}
                  </Text>
                </View>
              </View>
              {taxReporting.taxHints.map((hint) => (
                <Text key={hint} style={styles.analyticsAlert}>
                  {hint}
                </Text>
              ))}
              <Text style={styles.sectionLabel}>Tax-sensitive holdings</Text>
              {taxReporting.taxSensitiveHoldings.length === 0 ? (
                <Text style={styles.detailBlock}>No tax-sensitive holdings detected yet.</Text>
              ) : (
                taxReporting.taxSensitiveHoldings.map((holding) => (
                  <View key={`${holding.clientId}-${holding.id}`} style={styles.analyticsListCard}>
                    <Text style={styles.clientName}>{holding.assetName}</Text>
                    <Text style={styles.clientMeta}>
                      {holding.clientName} | {holding.assetClass}
                    </Text>
                    <Text
                      style={
                        holding.gainLoss >= 0
                          ? styles.analyticsPositive
                          : styles.analyticsNegative
                      }
                    >
                      {currencyDisplay(`${holding.gainLoss}`)} | {holding.returnPct.toFixed(1)}%
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View> : null}

        </View>
        ) : null}

        {activeTab === "Settings" ? (
          <>
            <View style={[styles.panel, styles.settingsOverviewPanel]}>
              <Text style={styles.panelTitle}>Settings</Text>
              <Text style={styles.panelSubtitle}>
                Manage security, sync, campaign controls, and app preferences from one place.
              </Text>
              <View style={styles.settingsStatusGrid}>
                <View style={styles.settingsStatusItem}>
                  <Text style={styles.settingsStatusLabel}>Backend</Text>
                  <Text style={styles.settingsStatusValue}>{authState}</Text>
                </View>
                <View style={styles.settingsStatusItem}>
                  <Text style={styles.settingsStatusLabel}>Cloud sync</Text>
                  <Text style={styles.settingsStatusValue}>{syncState}</Text>
                </View>
                <View style={styles.settingsStatusItem}>
                  <Text style={styles.settingsStatusLabel}>Plan</Text>
                  <Text style={[styles.settingsStatusValue, { color: isPro ? theme.colors.brand : theme.colors.textSecondary }]}>
                    {isPro ? "Pro ⭐" : "Free"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.panel}>
              <Text style={styles.settingsSectionTitle}>Subscription (RevenueCat)</Text>
              <View style={styles.settingsRow}>
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleTitle}>Current Plan</Text>
                  <Text style={styles.toggleText}>
                    {isPro ? "Pro Advisor (Active with AI & Unlimited Reports)" : "Free Plan (Gated AI & Reports)"}
                  </Text>
                </View>
                <Pressable
                  style={styles.darkChip}
                  onPress={() => setIsPaywallVisible(true)}
                >
                  <Text style={styles.darkChipText}>View Paywall</Text>
                </Pressable>
              </View>
              <Pressable
                style={styles.settingsActionRow}
                onPress={async () => {
                  if (isPro) {
                    await resetDemoProStatus();
                    setIsPro(false);
                    Alert.alert("Subscription Reset", "Switched back to Free Plan! You can now test the paywall triggers again.");
                  } else {
                    setIsPro(true);
                    Alert.alert("Pro Activated", "Pro Advisor plan activated!");
                  }
                }}
              >
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleTitle}>{isPro ? "Reset to Free Plan" : "Quick Activate Pro"}</Text>
                  <Text style={styles.toggleText}>
                    {isPro ? "Switch back to Free tier to test the paywall trigger again." : "Instantly activate Pro tier for testing."}
                  </Text>
                </View>
                <Text style={[styles.settingsActionText, { color: isPro ? theme.colors.danger : theme.colors.brand }]}>
                  {isPro ? "Reset" : "Activate"}
                </Text>
              </Pressable>
              <Pressable
                style={styles.settingsActionRow}
                onPress={() => void seedDemoClients()}
              >
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleTitle}>⚡ Load Demo Roster (Judge Mode)</Text>
                  <Text style={styles.toggleText}>
                    Populate 3 institutional client portfolios with holdings for judging evaluation.
                  </Text>
                </View>
                <Text style={[styles.settingsActionText, { color: theme.colors.brand }]}>
                  Load
                </Text>
              </Pressable>
            </View>

            <View style={styles.panel}>
              <Text style={styles.settingsSectionTitle}>Security</Text>
              <View style={styles.settingsRow}>
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleTitle}>Biometric unlock</Text>
                  <Text style={styles.toggleText}>
                    Use fingerprint or face authentication after PIN unlock.
                  </Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={(value) => void toggleBiometric(value)}
                />
              </View>
              <View style={styles.settingsRow}>
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleTitle}>Vibration feedback</Text>
                  <Text style={styles.toggleText}>
                    Turn tap vibration on or off for tabs and app actions.
                  </Text>
                </View>
                <Switch
                  value={hapticsEnabled}
                  onValueChange={(value) => void toggleHaptics(value)}
                />
              </View>
              <Pressable style={styles.settingsActionRow} onPress={() => void resetLock()}>
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleTitle}>Reset app lock</Text>
                  <Text style={styles.toggleText}>Remove the saved PIN and lock the workspace.</Text>
                </View>
                <Text style={styles.settingsActionText}>Reset</Text>
              </Pressable>
            </View>

            <View style={styles.panel}>
              <Text style={styles.settingsSectionTitle}>Appearance</Text>
              <View style={styles.settingsRow}>
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleTitle}>Dark mode</Text>
                  <Text style={styles.toggleText}>Enable the darker workspace shell.</Text>
                </View>
                <Switch
                  value={darkModeEnabled}
                  onValueChange={(value) => void toggleDarkMode(value)}
                />
              </View>
            </View>

            <View style={styles.panel}>
              <Text style={styles.settingsSectionTitle}>Cloud sync</Text>
              <Text style={styles.panelSubtitle}>
                Backend stores ciphertext only. Current status: {syncState}
              </Text>
              <View style={styles.settingsButtonRow}>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => setIsSyncModalOpen(true)}
                >
                  <Text style={styles.secondaryButtonText}>Configure</Text>
                </Pressable>
                <Pressable style={styles.darkChip} onPress={() => void syncToCloud()}>
                  <Text style={styles.darkChipText}>Push Backup</Text>
                </Pressable>
                <Pressable style={styles.darkChip} onPress={() => void restoreFromCloud()}>
                  <Text style={styles.darkChipText}>Restore Backup</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.panel}>
              <Text style={styles.settingsSectionTitle}>Campaigns</Text>
              <Pressable
                style={styles.settingsActionRow}
                onPress={() => setIsBroadcastModalOpen(true)}
              >
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleTitle}>Bulk notification campaigns</Text>
                  <Text style={styles.toggleText}>
                    Run one campaign for selected clients. Status: {broadcastState}
                  </Text>
                </View>
                <Text style={styles.settingsActionText}>Open</Text>
              </Pressable>
            </View>

            <View style={styles.panel}>
              <Text style={styles.settingsSectionTitle}>About and support</Text>
              <Text style={styles.panelSubtitle}>Asset Array version {APP_VERSION}</Text>
              <View style={styles.settingsButtonRow}>
                <Pressable style={styles.secondaryButton} onPress={openPrivacyPolicy}>
                  <Text style={styles.secondaryButtonText}>Privacy Policy</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={openTermsAndConditions}>
                  <Text style={styles.secondaryButtonText}>Terms & Conditions</Text>
                </Pressable>
                <Pressable style={styles.darkChip} onPress={() => void contactSupport()}>
                  <Text style={styles.darkChipText}>Contact Support</Text>
                </Pressable>
                <Pressable style={styles.darkChip} onPress={() => void reportBug()}>
                  <Text style={styles.darkChipText}>Report Bug</Text>
                </Pressable>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
      )}

      <BottomTabBar
        activeTab={visibleTabs.some((tab) => tab.key === activeTab) ? activeTab : "Dashboard"}
        bottomInset={insets.bottom}
        onChange={setActiveTab}
        tabs={visibleTabs}
        theme={theme}
      />

      <Modal visible={isEditorOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editorMode === "add" ? "Add client" : "Edit client"}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                value={draft.name}
                onChangeText={(value) => updateDraft("name", value)}
                placeholder="Client name"
                placeholderTextColor="#7f90a8"
                style={styles.input}
              />
              <TextInput
                value={draft.phone}
                onChangeText={(value) => updateDraft("phone", value)}
                placeholder="Phone number"
                placeholderTextColor="#7f90a8"
                keyboardType="phone-pad"
                style={styles.input}
              />
              <TextInput
                value={draft.email}
                onChangeText={(value) => updateDraft("email", value)}
                placeholder="Email address"
                placeholderTextColor="#7f90a8"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
              <TextInput
                value={draft.city}
                onChangeText={(value) => updateDraft("city", value)}
                placeholder="City"
                placeholderTextColor="#7f90a8"
                style={styles.input}
              />
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.optionRow}>
                {CATEGORY_OPTIONS.map((option) => {
                  const active = draft.category === option;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.optionChip, active ? styles.optionChipActive : null]}
                      onPress={() => updateDraft("category", option)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          active ? styles.optionChipTextActive : null,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                value={draft.riskProfile}
                onChangeText={(value) => updateDraft("riskProfile", value)}
                placeholder="Risk profile"
                placeholderTextColor="#7f90a8"
                style={styles.input}
              />
              <TextInput
                value={draft.allocation}
                onChangeText={(value) => updateDraft("allocation", value)}
                placeholder="Allocation summary"
                placeholderTextColor="#7f90a8"
                style={styles.input}
              />
              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.optionRow}>
                {PRIORITY_OPTIONS.map((option) => {
                  const active = draft.priority === option;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.optionChip, active ? styles.optionChipActive : null]}
                      onPress={() => updateDraft("priority", option)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          active ? styles.optionChipTextActive : null,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.inputLabel}>Preferred contact channel</Text>
              <View style={styles.optionRow}>
                {CHANNEL_OPTIONS.map((option) => {
                  const active = draft.preferredChannel === option;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.optionChip, active ? styles.optionChipActive : null]}
                      onPress={() => updateDraft("preferredChannel", option)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          active ? styles.optionChipTextActive : null,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                value={draft.watchlist}
                onChangeText={(value) => updateDraft("watchlist", value)}
                placeholder="Watchlist, comma separated"
                placeholderTextColor="#7f90a8"
                style={styles.input}
              />
              <TextInput
                value={draft.reminderDate}
                onChangeText={(value) => updateDraft("reminderDate", value)}
                placeholder="Next reminder date (YYYY-MM-DD)"
                placeholderTextColor="#7f90a8"
                style={styles.input}
              />
              <TextInput
                value={draft.notes}
                onChangeText={(value) => updateDraft("notes", value)}
                placeholder="Private notes"
                placeholderTextColor="#7f90a8"
                multiline
                style={[styles.input, styles.notesInput]}
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalSecondary} onPress={closeEditor}>
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={submitDraft}>
                <Text style={styles.primaryButtonText}>Save Client</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isPortfolioModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {portfolioMode === "add" ? "Add portfolio item" : "Edit portfolio item"}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                value={holdingDraft.assetName}
                onChangeText={(value) => updateHoldingDraft("assetName", value)}
                placeholder="Asset name"
                placeholderTextColor="#7f90a8"
                style={styles.input}
              />
              <Text style={styles.inputLabel}>Asset class</Text>
              <View style={styles.optionRow}>
                {ASSET_CLASS_OPTIONS.map((option) => {
                  const active = holdingDraft.assetClass === option;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.optionChip, active ? styles.optionChipActive : null]}
                      onPress={() => updateHoldingDraft("assetClass", option)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          active ? styles.optionChipTextActive : null,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                value={holdingDraft.ticker}
                onChangeText={(value) => updateHoldingDraft("ticker", value)}
                placeholder="Ticker or label"
                placeholderTextColor="#7f90a8"
                style={styles.input}
              />
              <TextInput
                value={holdingDraft.quantity}
                onChangeText={(value) => updateHoldingDraft("quantity", value)}
                placeholder="Quantity"
                placeholderTextColor="#7f90a8"
                keyboardType="decimal-pad"
                style={styles.input}
              />
              <TextInput
                value={holdingDraft.investedValue}
                onChangeText={(value) => updateHoldingDraft("investedValue", value)}
                placeholder="Invested value"
                placeholderTextColor="#7f90a8"
                keyboardType="decimal-pad"
                style={styles.input}
              />
              <TextInput
                value={holdingDraft.currentValue}
                onChangeText={(value) => updateHoldingDraft("currentValue", value)}
                placeholder="Current value"
                placeholderTextColor="#7f90a8"
                keyboardType="decimal-pad"
                style={styles.input}
              />
              <TextInput
                value={holdingDraft.targetWeight}
                onChangeText={(value) => updateHoldingDraft("targetWeight", value)}
                placeholder="Target weight, e.g. 15%"
                placeholderTextColor="#7f90a8"
                style={styles.input}
              />
              <TextInput
                value={holdingDraft.notes}
                onChangeText={(value) => updateHoldingDraft("notes", value)}
                placeholder="Holding notes"
                placeholderTextColor="#7f90a8"
                multiline
                style={[styles.input, styles.notesInput]}
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalSecondary} onPress={closeHoldingModal}>
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={saveHolding}>
                <Text style={styles.primaryButtonText}>Save Holding</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isSyncModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Encrypted cloud sync</Text>
            <Text style={styles.panelSubtitle}>
              Asset Array encrypts data on-device before it leaves your phone.
            </Text>
            <TextInput
              value={cloudSettings.ownerName}
              onChangeText={(value) =>
                setCloudSettings((current) => ({ ...current, ownerName: value }))
              }
              placeholder="Owner name"
              placeholderTextColor="#7f90a8"
              style={styles.input}
            />
            <TextInput
              value={cloudSettings.endpoint}
              onChangeText={(value) =>
                setCloudSettings((current) => ({ ...current, endpoint: value }))
              }
              placeholder="Backend URL, e.g. http://192.168.1.10:4000"
              placeholderTextColor="#7f90a8"
              autoCapitalize="none"
              style={styles.input}
            />
            {!cloudSettings.endpoint.trim() ? (
              <Pressable
                style={{ alignSelf: "flex-start", marginTop: 4, marginBottom: 8 }}
                onPress={() =>
                  setCloudSettings((current) => ({
                    ...current,
                    endpoint: "http://10.18.66.247:4000",
                    authUsername: current.authUsername || "admin",
                  }))
                }
              >
                <Text style={{ color: theme.colors.brand, fontSize: 12, fontWeight: "700" }}>
                  ✦ Auto-fill Local Backend (http://10.18.66.247:4000)
                </Text>
              </Pressable>
            ) : null}
            <Text style={styles.detailBlock}>Auth status: {authState}</Text>
            {authSession ? (
              <Pressable style={styles.linkButton} onPress={() => void logoutFromBackend()}>
                <Text style={styles.linkButtonText}>Sign Out</Text>
              </Pressable>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalSecondary}
                onPress={() => setIsSyncModalOpen(false)}
              >
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.primaryButton}
                onPress={() => void saveCloudSettingsAction()}
              >
                <Text style={styles.primaryButtonText}>Save Sync Settings</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isBroadcastModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: "88%", display: "flex", flexDirection: "column" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Broadcast Center</Text>
                <Text style={styles.panelSubtitle}>
                  One-tap mass outreach to selected high-net-worth clients.
                </Text>
              </View>
              <Pressable
                onPress={() => setIsBroadcastModalOpen(false)}
                style={{ padding: 4 }}
              >
                <Ionicons name="close-circle" size={26} color={theme.colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={{ gap: 10, paddingBottom: 16 }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={styles.inputLabel}>Dispatch Channel</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: authSession && cloudSettings.endpoint.trim() ? theme.colors.accent : theme.colors.brand }} />
                  <Text style={{ fontSize: 11, fontWeight: "700", color: authSession && cloudSettings.endpoint.trim() ? theme.colors.accent : theme.colors.brand }}>
                    {authSession && cloudSettings.endpoint.trim() ? "Cloud Sync Active" : "Direct Device Dispatch"}
                  </Text>
                </View>
              </View>

              <View style={styles.optionRow}>
                {BROADCAST_CHANNEL_OPTIONS.map((option) => {
                  const active = broadcastChannel === option;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.optionChip, active ? styles.optionChipActive : null]}
                      onPress={() => setBroadcastChannel(option)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          active ? styles.optionChipTextActive : null,
                        ]}
                      >
                        {option === "WhatsApp" ? "💬 WhatsApp" : option === "SMS" ? "📱 SMS" : option === "Email" ? "✉️ Email" : "✦ Preferred"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Advisory Brief</Text>
              <TextInput
                value={broadcastMessage}
                onChangeText={setBroadcastMessage}
                placeholder="Enter advisory brief for selected clients..."
                placeholderTextColor="#7f90a8"
                multiline
                style={[styles.input, styles.messageInput, { minHeight: 70, maxHeight: 110 }]}
              />

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.detailBlock}>
                  Ready: {broadcastPreview.eligible.length} | Skipped: {broadcastPreview.skipped.length}
                </Text>
                {clients.length > 0 ? (
                  <Pressable
                    onPress={() => {
                      if (selectedClientIds.length === clients.length) {
                        setSelectedClientIds([]);
                      } else {
                        setSelectedClientIds(clients.map((c) => c.id));
                      }
                    }}
                    style={{ paddingVertical: 4, paddingHorizontal: 8, backgroundColor: "rgba(224, 168, 76, 0.12)", borderRadius: 8 }}
                  >
                    <Text style={{ color: theme.colors.brand, fontSize: 11, fontWeight: "700" }}>
                      {selectedClientIds.length === clients.length ? "Deselect All" : "Select All"}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              <Text style={styles.sectionLabel}>
                Targeted Clients ({broadcastTargets.length}/{clients.length})
              </Text>
              {broadcastTargets.length === 0 ? (
                <Text style={styles.detailBlock}>No clients selected yet. Tap "Select All" above.</Text>
              ) : (
                <View style={{ gap: 6 }}>
                  {broadcastTargets.map((client) => {
                    const contact = resolveBroadcastContact(client, broadcastChannel);
                    return (
                      <View
                        key={client.id}
                        style={[
                          styles.historyItem,
                          {
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                            borderRadius: 8,
                            backgroundColor: "rgba(255, 255, 255, 0.03)",
                          },
                        ]}
                      >
                        <Text style={{ color: theme.colors.textPrimary, fontWeight: "700", fontSize: 13 }}>
                          {client.name}
                        </Text>
                        <Text
                          style={{
                            color: contact ? theme.colors.textSecondary : theme.colors.danger,
                            fontSize: 12,
                          }}
                        >
                          {contact || "Missing contact"}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {broadcastPreview.skipped.length > 0 ? (
                <>
                  <Text style={styles.sectionLabel}>Needs attention</Text>
                  {broadcastPreview.skipped.map((client) => (
                    <Text key={`skip-${client.id}`} style={styles.analyticsAlert}>
                      {client.name}: {client.reason}
                    </Text>
                  ))}
                </>
              ) : null}
            </ScrollView>

            <View style={[styles.modalActions, { paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
              <Pressable
                style={styles.modalSecondary}
                onPress={() => setIsBroadcastModalOpen(false)}
              >
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, { flex: 2 }]}
                onPress={() => void runBroadcastCampaign()}
              >
                <Text style={styles.primaryButtonText}>
                  {authSession && cloudSettings.endpoint.trim() ? "🚀 Dispatch Campaign" : "📱 Send via App"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(aboutSheet)} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{aboutSheet || "About Asset Array"}</Text>
            {aboutSheet === "Privacy Policy" ? (
              <Text style={styles.detailBlock}>
                Asset Array stores advisor and client records locally on-device and only sends encrypted
                cloud backups or authenticated service requests when you explicitly trigger them. Sensitive
                data such as PIN lock settings, login tokens, and privacy controls remain protected with
                secure local storage. Before public launch, replace this in-app policy summary with your
                final legal privacy policy URL and approved compliance text.
              </Text>
            ) : aboutSheet === "Terms & Conditions" ? (
              <Text style={styles.detailBlock}>
                Asset Array is an advisor workspace tool for client tracking, portfolio visibility,
                communication workflows, and research support. You are responsible for validating any
                market content, campaign output, or portfolio commentary before sharing it with clients.
                Before store submission, replace this in-app summary with your final legal terms and
                regulated business disclosures.
              </Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => setAboutSheet(null)}
              >
                <Text style={styles.primaryButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
  modalCard: {
    maxHeight: "90%",
    backgroundColor: "#111a2e",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1c2842",
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
});
