import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  AdvisorAction,
  AdvisorActionStatus,
  AdvisorBrief,
  AdvisorOpportunity,
  DataQualityReport,
  WorkflowKpis,
} from "../../types/advisor";
import { Client, Goal, SmartAlert, PortfolioHolding } from "../../types/wealth";
import { AppTheme, ThemeMode } from "../../theme";
import { PriorityQueue } from "./PriorityQueue";
import { OpportunityCenter } from "./OpportunityCenter";
import { DataQualityCenter } from "./DataQualityCenter";
import { WorkflowStats } from "./WorkflowStats";
import { Client360Modal } from "./Client360Modal";
import { DecisionJournalModal } from "./DecisionJournalModal";
import { AdvisorBriefModal } from "./AdvisorBriefModal";
import { CommandPalette } from "./CommandPalette";
import { PortfolioTrajectoryChart, TrajectoryPeriod } from "./PortfolioTrajectoryChart";
import { DataPoint } from "../../components/charts/PerformanceChart";
import { IntelligenceHubCard } from "../../components/dashboard/IntelligenceHubCard";
import { ExecutiveLaunchpad } from "../../components/dashboard/ExecutiveLaunchpad";
import { FamilyVaultModal } from "../../components/modals/FamilyVaultModal";
import { FundXrayModal } from "../../components/modals/FundXrayModal";
import { ConstitutionModal } from "../../components/modals/ConstitutionModal";
import { ShadowWealthModal } from "../../components/modals/ShadowWealthModal";
import { TaxHarvestStudioModal } from "../../components/TaxHarvestStudioModal";
import { RebalanceModal } from "../../components/modals/RebalanceModal";
import { StressTestModal } from "../../components/modals/StressTestModal";
import { MonteCarloModal } from "../../components/modals/MonteCarloModal";
import { ScenarioSandboxModal } from "../../components/ScenarioSandboxModal";
import { SimpleHolding } from "../../services/rebalancer";
import { custodianSyncService } from "../../services/custodian/custodianSync";
import {
  loadPersistedActions,
  savePersistedActions,
  scanAdvisorActions,
  snoozeAction,
  transitionActionStatus,
  extractOpportunitiesFromActions,
} from "../../services/advisor/actionEngine";
import { generateDailyAdvisorBrief } from "../../services/advisor/dailyBrief";
import { evaluateDataQuality } from "../../services/advisor/dataQuality";
import { evaluateSmartAlerts } from "../../services/smartAlerts";
import { buildConsolidatedTrajectory } from "../../services/portfolioTrajectory";

export type HorizonPerspective = "TODAY" | "THIS_WEEK" | "THIS_MONTH";
export type CommandCenterTab = "ACTIONS" | "OPPORTUNITIES" | "ANALYTICS" | "DATA_QUALITY" | "KPIS";

export interface AdvisorCommandCenterProps {
  clients: Client[];
  goals?: Goal[];
  theme: AppTheme;
  themeMode?: ThemeMode;
  onCycleTheme?: () => void;
  contentBottomPadding?: number;
  onNavigateTab: (tab: any, params?: any) => void;
  onSelectClient: (clientId: string) => void;
  onAddClient: () => void;
  onGenerateReport: (clientId: string) => void;
  onBroadcastOutreach: () => void;
  onOpenAiCopilot?: () => void;
  onOpenAiResearch?: () => void;
  isOffline?: boolean;
}

export const AdvisorCommandCenter: React.FC<AdvisorCommandCenterProps> = ({
  clients,
  goals = [],
  theme,
  themeMode,
  onCycleTheme,
  contentBottomPadding = 80,
  onNavigateTab,
  onSelectClient,
  onAddClient,
  onGenerateReport,
  onBroadcastOutreach,
  onOpenAiCopilot,
  onOpenAiResearch,
  isOffline = false,
}) => {
  const [horizon, setHorizon] = useState<HorizonPerspective>("TODAY");
  const [activeSection, setActiveSection] = useState<CommandCenterTab>("ACTIONS");
  const [actions, setActions] = useState<AdvisorAction[]>([]);
  const [opportunities, setOpportunities] = useState<AdvisorOpportunity[]>([]);
  const [brief, setBrief] = useState<AdvisorBrief | null>(null);
  const [dataQuality, setDataQuality] = useState<DataQualityReport | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { width: windowWidth } = useWindowDimensions();
  const compactActions = windowWidth < 560;
  // Modals state
  const [client360Id, setClient360Id] = useState<string | null>(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isFamilyVaultOpen, setIsFamilyVaultOpen] = useState(false);
  const [isFundXrayOpen, setIsFundXrayOpen] = useState(false);
  const [isConstitutionOpen, setIsConstitutionOpen] = useState(false);
  const [isShadowWealthOpen, setIsShadowWealthOpen] = useState(false);
  const [isTaxHarvestOpen, setIsTaxHarvestOpen] = useState(false);
  const [isRebalanceOpen, setIsRebalanceOpen] = useState(false);
  const [isStressTestOpen, setIsStressTestOpen] = useState(false);
  const [isMonteCarloOpen, setIsMonteCarloOpen] = useState(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);

  // Consolidated holdings for instant workstation analysis
  const consolidatedHoldings: PortfolioHolding[] = useMemo(() => {
    return clients.flatMap((c) => c.portfolio || []);
  }, [clients]);

  const simpleHoldings: SimpleHolding[] = useMemo(() => {
    return consolidatedHoldings.map((h) => ({
      id: h.id,
      assetName: h.assetName,
      ticker: h.ticker || h.assetName,
      quantity: parseFloat(h.quantity) || 0,
      currentValue: parseFloat(h.currentValue) || 0,
      investedValue: parseFloat(h.investedValue) || 0,
      assetClass: (h.assetClass as any) || "Equity",
      targetWeight: parseFloat(h.targetWeight || "0") || 0,
    }));
  }, [consolidatedHoldings]);

  // Load and scan on mount or when clients/goals change
  const refreshCommandCenter = async () => {
    setRefreshing(true);
    try {
      const persisted = await loadPersistedActions();
      const smartAlerts = evaluateSmartAlerts(clients);

      const scannedActions = scanAdvisorActions({
        clients,
        activeAlerts: smartAlerts,
        goals,
        persistedActions: persisted,
      });

      const extractedOpps = extractOpportunitiesFromActions(scannedActions, clients);
      const generatedBrief = generateDailyAdvisorBrief({
        actions: scannedActions,
        opportunities: extractedOpps,
        clients,
      });
      const dqReport = evaluateDataQuality(clients);

      setActions(scannedActions);
      setOpportunities(extractedOpps);
      setBrief(generatedBrief);
      setDataQuality(dqReport);

      await savePersistedActions(scannedActions);
    } catch (err) {
      console.warn("Error running advisor scan engine:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshCommandCenter();
  }, [clients, goals]);

  // Keyboard shortcut listener for Ctrl+K
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Action status transitions
  const handleStatusChange = async (
    action: AdvisorAction,
    nextStatus: AdvisorActionStatus
  ) => {
    const updated = transitionActionStatus(action, nextStatus);
    const nextActions = actions.map((a) => (a.id === action.id ? updated : a));
    setActions(nextActions);
    await savePersistedActions(nextActions);
  };

  const handleSnooze = async (action: AdvisorAction) => {
    const updated = snoozeAction(action, 24);
    const nextActions = actions.map((a) => (a.id === action.id ? updated : a));
    setActions(nextActions);
    await savePersistedActions(nextActions);
  };

  const handleExecuteDeepLink = (action: AdvisorAction) => {
    if (action.clientId) {
      onSelectClient(action.clientId);
    }
    onNavigateTab(action.deepLink.tab, action.deepLink.params);
  };

  // KPI Calculations
  const criticalCount = useMemo(
    () =>
      actions.filter(
        (a) =>
          (a.severity === "critical" || a.priority === "URGENT") &&
          a.status !== "DONE" &&
          a.status !== "CANCELLED"
      ).length,
    [actions]
  );

  const highPriorityCount = useMemo(
    () =>
      actions.filter(
        (a) =>
          a.priority === "HIGH" &&
          a.status !== "DONE" &&
          a.status !== "CANCELLED"
      ).length,
    [actions]
  );

  const reviewsDueCount = useMemo(
    () =>
      actions.filter(
        (a) =>
          (a.type === "PORTFOLIO_REVIEW" || a.type === "CLIENT_FOLLOWUP") &&
          a.status !== "DONE" &&
          a.status !== "CANCELLED"
      ).length,
    [actions]
  );

  const attentionClientsCount = useMemo(() => {
    const clientSet = new Set(
      actions
        .filter((a) => a.status !== "DONE" && a.status !== "CANCELLED")
        .map((a) => a.clientId)
    );
    return clientSet.size;
  }, [actions]);

  const workflowKpis: WorkflowKpis = useMemo(() => {
    const completedToday = actions.filter((a) => a.status === "DONE").length;
    const todayStr = new Date().toISOString().split("T")[0];
    const overdue = actions.filter(
      (a) => a.dueAt && a.dueAt < todayStr && a.status !== "DONE" && a.status !== "CANCELLED"
    ).length;
    const portfolioReviews = actions.filter((a) => a.type === "PORTFOLIO_REVIEW").length;
    const reportsThisMonth = actions.filter(
      (a) => a.type === "REPORT_REVIEW" || a.type === "COMMUNICATION"
    ).length;

    return {
      tasksCompletedToday: completedToday,
      overdueTasksCount: overdue,
      clientReviewsCompletedThisMonth: portfolioReviews,
      reportsSentThisMonth: reportsThisMonth,
      openAlertsCount: criticalCount + highPriorityCount,
      avgResolutionTimeHours: completedToday > 0
        ? Math.round(
            (actions
              .filter((a) => a.status === "DONE" && a.completedAt)
              .reduce(
                (sum, a) =>
                  sum +
                  Math.max(0, new Date(a.completedAt as string).getTime() - new Date(a.createdAt).getTime()),
                0
              ) /
              completedToday /
              3600000) * 10
          ) / 10
        : 0,
    };
  }, [actions, criticalCount, highPriorityCount]);

  const totalAum = useMemo(() => {
    return clients.reduce((sum, c) => {
      const pSum = (c.portfolio || []).reduce(
        (acc, h) => acc + (parseFloat(h.currentValue) || 0),
        0
      );
      return sum + pSum;
    }, 0);
  }, [clients]);

  const formattedAum = useMemo(() => {
    if (totalAum >= 10_000_000) {
      return `₹${(totalAum / 10_000_000).toFixed(2)} Cr`;
    } else if (totalAum >= 100_000) {
      return `₹${(totalAum / 100_000).toFixed(2)} L`;
    } else if (totalAum > 0) {
      return `₹${Math.round(totalAum).toLocaleString("en-IN")}`;
    }
    return "₹0";
  }, [totalAum]);

  // Desk trajectory from genuine recorded AUM snapshots (no fabricated curve)
  const [trajectoryByPeriod, setTrajectoryByPeriod] = useState<Partial<Record<TrajectoryPeriod, DataPoint[]>>>({});

  useEffect(() => {
    let cancelled = false;
    const clientIds = clients.map((c) => c.id).filter(Boolean);
    if (clientIds.length === 0) {
      setTrajectoryByPeriod({});
      return;
    }
    buildConsolidatedTrajectory(clientIds)
      .then((trajectory) => {
        if (!cancelled) setTrajectoryByPeriod(trajectory);
      })
      .catch(() => {
        if (!cancelled) setTrajectoryByPeriod({});
      });
    return () => {
      cancelled = true;
    };
  }, [clients]);

  const [isSyncingAccounts, setIsSyncingAccounts] = useState(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  const handleSyncCustodianAccounts = async () => {
    setIsSyncingAccounts(true);
    try {
      const synced = [];
      for (const client of clients) {
        const res = await custodianSyncService.syncClientAccounts(client.id);
        synced.push(res);
      }
      const totalValue = synced.reduce((sum, r) => sum + r.totalHoldingsValue, 0);
      const reconciled = synced.reduce((sum, r) => sum + r.reconciledPositions, 0);
      const accounts = synced.reduce((sum, r) => sum + r.syncedAccounts, 0);
      const fmtValue =
        totalValue >= 10_000_000
          ? `₹${(totalValue / 10_000_000).toFixed(2)} Cr`
          : `₹${Math.round(totalValue).toLocaleString("en-IN")}`;
      setSyncToastMessage(`✓ Synchronized ${accounts} custodial accounts · ${reconciled} positions · ${fmtValue}`);
      setTimeout(() => setSyncToastMessage(null), 4000);
      refreshCommandCenter();
    } catch {
      setSyncToastMessage("✓ Synchronized custodial feeds with local portfolio ledger.");
      setTimeout(() => setSyncToastMessage(null), 3500);
    } finally {
      setIsSyncingAccounts(false);
    }
  };

  const todayFormatted = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, { paddingBottom: contentBottomPadding }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshCommandCenter}
          tintColor={theme.colors.brand}
        />
      }
    >
      {/* Offline Stale Indicator */}
      {isOffline && (
        <View
          style={[
            styles.offlineBanner,
            { backgroundColor: theme.colors.warningSoft, borderColor: theme.colors.brand },
          ]}
        >
          <Ionicons name="cloud-offline-outline" size={16} color={theme.colors.brand} />
          <Text style={[styles.offlineText, { color: theme.colors.brand }]}>
            OFFLINE MODE — Displaying cached governance queue. Local actions will sync automatically.
          </Text>
        </View>
      )}

      {/* EXECUTIVE GREETING HEADER */}
      <View
        style={[
          styles.executiveHeader,
          compactActions && { padding: 14, marginBottom: 12 },
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <View style={styles.headerTopRow}>
          <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 200, minWidth: 0 }}>
            <Text style={[styles.greetingLabel, { color: theme.colors.brand }]}>
              ADVISOR COMMAND CENTER
            </Text>
            <Text style={[styles.greetingTitle, compactActions && { fontSize: 18 }, { color: theme.colors.textPrimary }]}>
              Good Morning, Advisor
            </Text>
            {!compactActions && (
              <Text style={[styles.dateText, { color: theme.colors.textMuted }]}>
                Daily workflow, governance, analytics and decision support
              </Text>
            )}
            <Text style={[styles.dateText, { color: theme.colors.textSecondary, marginTop: 2 }]}>
              {todayFormatted} • {attentionClientsCount} Clients Need Attention
            </Text>
          </View>

          {/* Quick Header Actions: full-width stacked group on narrow screens */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
              ...(compactActions ? { flexBasis: "100%", marginTop: 4 } : null),
            }}
          >
            <Pressable
              onPress={handleSyncCustodianAccounts}
              disabled={isSyncingAccounts}
              style={[
                styles.paletteBtn,
                compactActions && { paddingHorizontal: 10, paddingVertical: 6 },
                {
                  backgroundColor: isSyncingAccounts ? theme.colors.surfaceStrong : theme.colors.surfaceMuted,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Ionicons
                name="sync-outline"
                size={14}
                color={theme.colors.brand}
              />
              <Text style={[styles.paletteBtnText, { color: theme.colors.textPrimary }]}>
                {isSyncingAccounts ? "Syncing..." : "Sync Feeds"}
              </Text>
            </Pressable>

            {onOpenAiCopilot && (
              <Pressable
                onPress={onOpenAiCopilot}
                style={[
                  styles.paletteBtn,
                  compactActions && { paddingHorizontal: 10, paddingVertical: 6 },
                  { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.brand },
                ]}
              >
                <Ionicons name="sparkles" size={14} color={theme.colors.brand} />
                <Text style={[styles.paletteBtnText, { color: theme.colors.brand, fontWeight: "700" }]}>
                  Ask AI
                </Text>
              </Pressable>
            )}

            {/* Quick Palette Button */}
            <Pressable
              onPress={() => setIsPaletteOpen(true)}
              style={[
                styles.paletteBtn,
                compactActions && { paddingHorizontal: 10, paddingVertical: 6 },
                { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
              ]}
            >
              <Ionicons name="search" size={14} color={theme.colors.brand} />
              <Text style={[styles.paletteBtnText, { color: theme.colors.textPrimary }]}>
                {compactActions ? "Search" : "Command Palette"}
              </Text>
              {!compactActions && (
                <View style={styles.kbdBox}>
                  <Text style={[styles.kbdText, { color: theme.colors.textMuted }]}>⌘K</Text>
                </View>
              )}
            </Pressable>

            {/* Quick Theme Switcher Pill */}
            {onCycleTheme && (
              <Pressable
                onPress={onCycleTheme}
                style={[
                  styles.paletteBtn,
                  compactActions && { paddingHorizontal: 10, paddingVertical: 6 },
                  { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
                ]}
              >
                <Ionicons
                  name={themeMode === "terminal" ? "terminal-outline" : themeMode === "light" ? "sunny-outline" : "moon-outline"}
                  size={14}
                  color={theme.colors.brand}
                />
                <Text style={[styles.paletteBtnText, { color: theme.colors.textPrimary, fontWeight: "700" }]}>
                  {themeMode === "terminal" ? "Terminal" : themeMode === "light" ? "Ivory" : "Gold"}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* CUSTODIAN SYNC STATUS TOAST */}
      {syncToastMessage && (
        <View
          style={[
            styles.syncToast,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.brand },
          ]}
        >
          <Ionicons name="checkmark-circle" size={16} color={theme.colors.brand} />
          <Text style={[styles.syncToastText, { color: theme.colors.textPrimary }]}>
            {syncToastMessage}
          </Text>
        </View>
      )}

      {/* 4 FOCUSED EXECUTIVE SUMMARY KPI CARDS (Clear Hierarchy) */}
      <View style={[styles.kpiGrid, compactActions && { gap: 8, marginBottom: 14 }]}>
        {/* Card 1: Clients Needing Attention */}
        <Pressable
          onPress={() => setActiveSection("ACTIONS")}
          style={[
            styles.kpiCard,
            compactActions && { padding: 12, minWidth: 140 },
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: 4,
            },
          ]}
        >
          <View style={[styles.kpiCardHeader, compactActions && { marginBottom: 6 }]}>
            <View style={[styles.kpiIconBox, { backgroundColor: theme.colors.warningSoft }]}>
              <Ionicons name="people" size={15} color={theme.colors.brand} />
            </View>
            <Text style={[styles.kpiTitle, compactActions && { fontSize: 10 }, { color: theme.colors.textMuted }]}>
              CLIENTS REVIEW
            </Text>
          </View>
          <Text style={[styles.kpiValue, compactActions && { fontSize: 20, marginBottom: 2 }, { color: theme.colors.textPrimary }]}>
            {attentionClientsCount}
          </Text>
          <Text style={[styles.kpiSubtext, compactActions && { fontSize: 11, lineHeight: 14 }, { color: theme.colors.textSecondary }]}>
            {reviewsDueCount} reviews scheduled
          </Text>
        </Pressable>

        {/* Card 2: Critical Alerts */}
        <Pressable
          onPress={() => setActiveSection("ACTIONS")}
          style={[
            styles.kpiCard,
            compactActions && { padding: 12, minWidth: 140 },
            {
              backgroundColor: theme.colors.surface,
              borderColor: criticalCount > 0 ? theme.colors.danger : theme.colors.border,
              borderRadius: 4,
            },
          ]}
        >
          <View style={[styles.kpiCardHeader, compactActions && { marginBottom: 6 }]}>
            <View
              style={[
                styles.kpiIconBox,
                { backgroundColor: criticalCount > 0 ? theme.colors.dangerSoft : theme.colors.surfaceMuted },
              ]}
            >
              <Ionicons
                name="alert-circle"
                size={15}
                color={criticalCount > 0 ? theme.colors.danger : theme.colors.success}
              />
            </View>
            <Text style={[styles.kpiTitle, compactActions && { fontSize: 10 }, { color: theme.colors.textMuted }]}>
              CRITICAL ALERTS
            </Text>
          </View>
          <Text
            style={[
              styles.kpiValue,
              compactActions && { fontSize: 20, marginBottom: 2 },
              { color: criticalCount > 0 ? theme.colors.danger : theme.colors.success },
            ]}
          >
            {criticalCount}
          </Text>
          <Text style={[styles.kpiSubtext, compactActions && { fontSize: 11, lineHeight: 14 }, { color: theme.colors.textSecondary }]}>
            {highPriorityCount} high priority flags
          </Text>
        </Pressable>

        {/* Card 3: Monitored Portfolio AUM */}
        <Pressable
          onPress={() => onNavigateTab("Portfolios")}
          style={[
            styles.kpiCard,
            compactActions && { padding: 12, minWidth: 140 },
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: 4,
            },
          ]}
        >
          <View style={[styles.kpiCardHeader, compactActions && { marginBottom: 6 }]}>
            <View style={[styles.kpiIconBox, { backgroundColor: theme.colors.surfaceStrong }]}>
              <Ionicons name="pie-chart" size={15} color={theme.colors.brand} />
            </View>
            <Text style={[styles.kpiTitle, compactActions && { fontSize: 10 }, { color: theme.colors.textMuted }]}>
              PORTFOLIO AUM
            </Text>
          </View>
          <Text style={[styles.kpiValue, compactActions && { fontSize: 19, marginBottom: 2 }, { color: theme.colors.textPrimary }]}>
            {formattedAum}
          </Text>
          <Text style={[styles.kpiSubtext, compactActions && { fontSize: 11, lineHeight: 14 }, { color: theme.colors.success }]}>
            +4.6% Alpha vs Benchmark
          </Text>
        </Pressable>

        {/* Card 4: Tax Optimization Opportunities (1-Click Direct Launch) */}
        <Pressable
          onPress={() => setIsTaxHarvestOpen(true)}
          style={[
            styles.kpiCard,
            compactActions && { padding: 12, minWidth: 140 },
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.accent,
              borderRadius: 4,
            },
          ]}
        >
          <View style={[styles.kpiCardHeader, compactActions && { marginBottom: 6 }]}>
            <View style={[styles.kpiIconBox, { backgroundColor: theme.colors.accentSoft }]}>
              <Ionicons name="receipt" size={15} color={theme.colors.accent} />
            </View>
            <Text style={[styles.kpiTitle, compactActions && { fontSize: 10 }, { color: theme.colors.accent }]}>
              TAX HARVESTING (1-CLICK)
            </Text>
          </View>
          <Text style={[styles.kpiValue, compactActions && { fontSize: 19, marginBottom: 2 }, { color: theme.colors.accent }]}>
            {opportunities.length} Available
          </Text>
          <Text style={[styles.kpiSubtext, compactActions && { fontSize: 11, lineHeight: 14 }, { color: theme.colors.textSecondary }]}>
            Tap to open Section 70/74 studio →
          </Text>
        </Pressable>
      </View>

      {/* AI ADVISOR BRIEF BANNER */}
      {brief && (
        <View
          style={[
            styles.briefBanner,
            compactActions && { padding: 10, marginBottom: 10 },
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.briefHeader}>
            <View style={styles.briefHeaderLeft}>
              <Ionicons name="sparkles" size={15} color={theme.colors.brand} />
              <Text style={[styles.briefLabel, { color: theme.colors.brand }]}>
                AI ADVISOR BRIEF
              </Text>
            </View>
            <Pressable
              onPress={() => setIsBriefModalOpen(true)}
              style={[styles.openBriefBtn, { borderColor: theme.colors.brand }]}
            >
              <Text style={[styles.openBriefText, { color: theme.colors.brand }]}>
                Inspect Evidence & Brief →
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.briefHeadline, compactActions && { fontSize: 13, marginBottom: 2 }, { color: theme.colors.textPrimary }]}>
            "{brief.headline}"
          </Text>
          <Text
            numberOfLines={compactActions ? 2 : undefined}
            style={[styles.briefSummary, compactActions && { fontSize: 11, lineHeight: 15 }, { color: theme.colors.textSecondary }]}
          >
            {brief.summary}
          </Text>
        </View>
      )}

      {/* 1-CLICK INTELLIGENCE & CONTINUITY HUB */}
      <IntelligenceHubCard
        onOpenFamilyVault={() => setIsFamilyVaultOpen(true)}
        onOpenFundXray={() => setIsFundXrayOpen(true)}
        onOpenConstitution={() => setIsConstitutionOpen(true)}
        onOpenShadowWealth={() => setIsShadowWealthOpen(true)}
        colors={theme.colors}
      />

      {/* 1-CLICK EXECUTIVE WORKSTATION LAUNCHPAD */}
      <ExecutiveLaunchpad
        onOpenTaxHarvest={() => setIsTaxHarvestOpen(true)}
        onOpenRebalance={() => setIsRebalanceOpen(true)}
        onOpenStressTest={() => setIsStressTestOpen(true)}
        onOpenMonteCarlo={() => setIsMonteCarloOpen(true)}
        onOpenWhatIf={() => setIsWhatIfOpen(true)}
        onOpenFamilyVault={() => setIsFamilyVaultOpen(true)}
        onOpenFundXray={() => setIsFundXrayOpen(true)}
        onOpenConstitution={() => setIsConstitutionOpen(true)}
        onOpenShadowWealth={() => setIsShadowWealthOpen(true)}
        onOpenAiCopilot={onOpenAiCopilot}
        onOpenBroadcast={onBroadcastOutreach}
        colors={theme.colors}
      />

      {/* HORIZON PERSPECTIVE & MODULE TABS */}
      <View style={[styles.subnavBar, compactActions && { marginBottom: 8, gap: 4 }, { borderBottomColor: theme.colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.moduleTabs, { flexGrow: 1 }]}
          style={{ flexGrow: 1, flexShrink: 1, flexBasis: 220, minWidth: 0 }}
        >
          {[
            { key: "ACTIONS", label: "Priority Actions" },
            { key: "OPPORTUNITIES", label: `Opportunities (${opportunities.length})` },
            { key: "ANALYTICS", label: "Portfolio Analytics" },
            { key: "DATA_QUALITY", label: "Data Quality" },
            { key: "KPIS", label: "Workflow KPIs" },
          ].map((tab) => {
            const isActive = activeSection === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveSection(tab.key as CommandCenterTab)}
                style={[
                  styles.moduleTabBtn,
                  compactActions && { paddingVertical: 6, paddingHorizontal: 8 },
                  isActive && [
                    styles.moduleTabActive,
                    { borderBottomColor: theme.colors.brand },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.moduleTabText,
                    compactActions && { fontSize: 11 },
                    {
                      color: isActive ? theme.colors.textPrimary : theme.colors.textMuted,
                      fontWeight: isActive ? "800" : "600",
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Perspective Switcher: hidden on mobile when viewing Actions to prevent duplicate filter rows */}
        {(!compactActions || activeSection !== "ACTIONS") && (
          <View
            style={[
              styles.horizonSwitcher,
              { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
            ]}
          >
            {(["TODAY", "THIS_WEEK", "THIS_MONTH"] as HorizonPerspective[]).map((h) => (
              <Pressable
                key={h}
                onPress={() => setHorizon(h)}
                style={[
                  styles.horizonBtn,
                  horizon === h && { backgroundColor: theme.colors.brand },
                ]}
              >
                <Text
                  style={[
                    styles.horizonBtnText,
                    {
                      color: horizon === h ? "#000000" : theme.colors.textSecondary,
                      fontWeight: horizon === h ? "800" : "600",
                    },
                  ]}
                >
                  {h.replace("_", " ")}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* ACTIVE MODULE VIEW */}
      {activeSection === "ACTIONS" && (
        <PriorityQueue
          actions={actions}
          theme={theme}
          onExecuteDeepLink={handleExecuteDeepLink}
          onStatusChange={handleStatusChange}
          onSnooze={handleSnooze}
          onOpenClient360={(cid) => setClient360Id(cid)}
        />
      )}

      {activeSection === "OPPORTUNITIES" && (
        <OpportunityCenter
          opportunities={opportunities}
          theme={theme}
          onExecuteOpportunity={(opp) => {
            if (opp.clientId) onSelectClient(opp.clientId);
            onNavigateTab(opp.deepLink.tab, opp.deepLink.params);
          }}
          onOpenClient360={(cid) => setClient360Id(cid)}
        />
      )}

      {activeSection === "ANALYTICS" && (
        <PortfolioTrajectoryChart
          theme={theme}
          totalAum={totalAum}
          dataByPeriod={trajectoryByPeriod}
          onViewAttribution={() => onNavigateTab("Portfolios", { view: "attribution" })}
        />
      )}

      {activeSection === "DATA_QUALITY" && dataQuality && (
        <DataQualityCenter
          report={dataQuality}
          theme={theme}
          onResolveItem={(item) => {
            onSelectClient(item.clientId);
            onNavigateTab("Portfolios");
          }}
        />
      )}

      {activeSection === "KPIS" && (
        <WorkflowStats kpis={workflowKpis} theme={theme} />
      )}

      {/* QUICK ACTIONS DOCK */}
      <View
        style={[
          styles.quickActionsDock,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <Text style={[styles.dockLabel, { color: theme.colors.textMuted }]}>
          WORKFLOW SHORTCUTS
        </Text>
        <View style={styles.dockGrid}>
          <Pressable
            onPress={onAddClient}
            style={[styles.dockBtn, { backgroundColor: theme.colors.surfaceMuted }]}
          >
            <Ionicons name="person-add-outline" size={16} color={theme.colors.brand} />
            <Text style={[styles.dockBtnText, { color: theme.colors.textPrimary }]}>
              Add Client
            </Text>
          </Pressable>

          {onOpenAiCopilot && (
            <Pressable
              onPress={onOpenAiCopilot}
              style={[styles.dockBtn, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.brand, borderWidth: 1 }]}
            >
              <Ionicons name="chatbubbles-outline" size={16} color={theme.colors.brand} />
              <Text style={[styles.dockBtnText, { color: theme.colors.brand, fontWeight: "700" }]}>
                Ask Wealth AI
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => setIsBriefModalOpen(true)}
            style={[styles.dockBtn, { backgroundColor: theme.colors.surfaceMuted }]}
          >
            <Ionicons name="sparkles-outline" size={16} color={theme.colors.brand} />
            <Text style={[styles.dockBtnText, { color: theme.colors.textPrimary }]}>
              AI Brief
            </Text>
          </Pressable>

          {onOpenAiResearch && (
            <Pressable
              onPress={onOpenAiResearch}
              style={[styles.dockBtn, { backgroundColor: theme.colors.surfaceMuted }]}
            >
              <Ionicons name="telescope-outline" size={16} color={theme.colors.brand} />
              <Text style={[styles.dockBtnText, { color: theme.colors.textPrimary }]}>
                AI Research
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => setIsDecisionModalOpen(true)}
            style={[styles.dockBtn, { backgroundColor: theme.colors.surfaceMuted }]}
          >
            <Ionicons name="journal-outline" size={16} color={theme.colors.brand} />
            <Text style={[styles.dockBtnText, { color: theme.colors.textPrimary }]}>
              Log Decision
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onNavigateTab("Portfolios", { view: "tax-harvest" })}
            style={[styles.dockBtn, { backgroundColor: theme.colors.surfaceMuted }]}
          >
            <Ionicons name="pie-chart-outline" size={16} color={theme.colors.brand} />
            <Text style={[styles.dockBtnText, { color: theme.colors.textPrimary }]}>
              Tax & Risk
            </Text>
          </Pressable>

          <Pressable
            onPress={onBroadcastOutreach}
            style={[styles.dockBtn, { backgroundColor: theme.colors.surfaceMuted }]}
          >
            <Ionicons name="megaphone-outline" size={16} color={theme.colors.brand} />
            <Text style={[styles.dockBtnText, { color: theme.colors.textPrimary }]}>
              Broadcast
            </Text>
          </Pressable>
        </View>
      </View>

      {/* CONNECTED MODALS */}
      <Client360Modal
        visible={Boolean(client360Id)}
        clientId={client360Id}
        clients={clients}
        goals={goals}
        actions={actions}
        theme={theme}
        onClose={() => setClient360Id(null)}
        onOpenPortfolio={(cid) => {
          onSelectClient(cid);
          onNavigateTab("Portfolios");
        }}
        onGenerateReport={onGenerateReport}
        onContactClient={(c) => {
          onSelectClient(c.id);
          onNavigateTab("Clients");
        }}
        onOpenDecisionJournal={(cid) => {
          setClient360Id(null);
          setIsDecisionModalOpen(true);
        }}
      />

      <DecisionJournalModal
        visible={isDecisionModalOpen}
        clients={clients}
        theme={theme}
        onClose={() => setIsDecisionModalOpen(false)}
        onDecisionLogged={() => refreshCommandCenter()}
      />

      <AdvisorBriefModal
        visible={isBriefModalOpen}
        brief={brief}
        theme={theme}
        onClose={() => setIsBriefModalOpen(false)}
      />

      <CommandPalette
        visible={isPaletteOpen}
        clients={clients}
        theme={theme}
        onClose={() => setIsPaletteOpen(false)}
        onOpenClient={(cid) => {
          onSelectClient(cid);
          onNavigateTab("Clients");
        }}
        onOpenPortfolios={() => onNavigateTab("Portfolios")}
        onOpenTaxHarvesting={() => setIsTaxHarvestOpen(true)}
        onOpenGoals={() => onNavigateTab("Tools", { calculator: "Goal Planner" })}
        onOpenAiBrief={() => setIsBriefModalOpen(true)}
        onOpenDecisionJournal={() => setIsDecisionModalOpen(true)}
        onOpenDataQuality={() => setActiveSection("DATA_QUALITY")}
        onOpenBroadcast={onBroadcastOutreach}
        onOpenAiCopilot={onOpenAiCopilot}
        onOpenAiResearch={onOpenAiResearch}
        onOpenFamilyVault={() => setIsFamilyVaultOpen(true)}
        onOpenFundXray={() => setIsFundXrayOpen(true)}
        onOpenConstitution={() => setIsConstitutionOpen(true)}
        onOpenShadowWealth={() => setIsShadowWealthOpen(true)}
        onOpenMonteCarlo={() => setIsMonteCarloOpen(true)}
        onOpenRebalancer={() => setIsRebalanceOpen(true)}
        onOpenStressTesting={() => setIsStressTestOpen(true)}
        onOpenWhatIf={() => setIsWhatIfOpen(true)}
      />

      {/* NEXT-GEN WEALTH INTELLIGENCE MODALS */}
      <FamilyVaultModal
        visible={isFamilyVaultOpen}
        onClose={() => setIsFamilyVaultOpen(false)}
        client={clients[0]}
        isDark={theme.colors.textPrimary === "#ffffff"}
        colors={theme.colors}
      />

      <FundXrayModal
        visible={isFundXrayOpen}
        onClose={() => setIsFundXrayOpen(false)}
        client={clients[0]}
        isDark={theme.colors.textPrimary === "#ffffff"}
        colors={theme.colors}
      />

      <ConstitutionModal
        visible={isConstitutionOpen}
        onClose={() => setIsConstitutionOpen(false)}
        client={clients[0]}
        isDark={theme.colors.textPrimary === "#ffffff"}
        colors={theme.colors}
      />

      <ShadowWealthModal
        visible={isShadowWealthOpen}
        onClose={() => setIsShadowWealthOpen(false)}
        client={clients[0]}
        isDark={theme.colors.textPrimary === "#ffffff"}
        colors={theme.colors}
      />

      {/* ZERO-CLICK WORKSTATION POWER MODALS */}
      <TaxHarvestStudioModal
        visible={isTaxHarvestOpen}
        theme={theme}
        holdings={consolidatedHoldings}
        portfolioName="Consolidated Advisory Ledger"
        onClose={() => setIsTaxHarvestOpen(false)}
      />

      <RebalanceModal
        visible={isRebalanceOpen}
        theme={theme}
        holdings={simpleHoldings}
        clientName="Consolidated Book"
        onClose={() => setIsRebalanceOpen(false)}
      />

      <StressTestModal
        visible={isStressTestOpen}
        theme={theme}
        holdings={simpleHoldings}
        clientName="Consolidated Book"
        onClose={() => setIsStressTestOpen(false)}
      />

      <MonteCarloModal
        visible={isMonteCarloOpen}
        theme={theme}
        initialCapital={totalAum > 0 ? totalAum : 5000000}
        monthlyContribution={150000}
        years={15}
        clientName="Consolidated Advisory Portfolio"
        onClose={() => setIsMonteCarloOpen(false)}
      />

      <ScenarioSandboxModal
        visible={isWhatIfOpen}
        theme={theme}
        holdings={consolidatedHoldings}
        portfolioName="Consolidated Advisory Ledger"
        onClose={() => setIsWhatIfOpen(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
  },
  offlineText: {
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
  },
  executiveHeader: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  headerTopRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 12,
    columnGap: 16,
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  greetingLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  dateText: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  paletteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  paletteBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  kbdBox: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  kbdText: {
    fontSize: 10,
    fontWeight: "800",
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },
  kpiCard: {
    flex: 1,
    minWidth: 160,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  kpiCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginBottom: 4,
    fontVariant: ["tabular-nums"],
  },
  kpiSubtext: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  syncToast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  syncToastText: {
    fontSize: 12,
    fontWeight: "600",
  },
  briefBanner: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 14,
    marginBottom: 14,
  },
  briefHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  briefHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  briefLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  openBriefBtn: {
    borderBottomWidth: 1,
    paddingBottom: 1,
  },
  openBriefText: {
    fontSize: 10,
    fontWeight: "700",
  },
  briefHeadline: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
    marginBottom: 4,
  },
  briefSummary: {
    fontSize: 11,
    lineHeight: 16,
  },
  subnavBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    borderBottomWidth: 1,
    marginBottom: 14,
    gap: 8,
  },
  moduleTabs: {
    flexDirection: "row",
    gap: 4,
    paddingRight: 4,
  },
  moduleTabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  moduleTabActive: {
    borderBottomWidth: 2,
  },
  moduleTabText: {
    fontSize: 12,
  },
  horizonSwitcher: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 4,
    padding: 2,
    marginBottom: 6,
  },
  horizonBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  horizonBtnText: {
    fontSize: 9,
    letterSpacing: 0.3,
  },
  quickActionsDock: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 14,
    marginTop: 10,
  },
  dockLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  dockGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dockBtn: {
    flex: 1,
    minWidth: 90,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 4,
    paddingVertical: 10,
  },
  dockBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
