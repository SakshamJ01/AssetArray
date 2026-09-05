import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  RefreshControl,
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
import { Client, Goal, SmartAlert } from "../../types/wealth";
import { AppTheme } from "../../theme";
import { PriorityQueue } from "./PriorityQueue";
import { OpportunityCenter } from "./OpportunityCenter";
import { DataQualityCenter } from "./DataQualityCenter";
import { WorkflowStats } from "./WorkflowStats";
import { Client360Modal } from "./Client360Modal";
import { DecisionJournalModal } from "./DecisionJournalModal";
import { AdvisorBriefModal } from "./AdvisorBriefModal";
import { CommandPalette } from "./CommandPalette";
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

export type HorizonPerspective = "TODAY" | "THIS_WEEK" | "THIS_MONTH";
export type CommandCenterTab = "ACTIONS" | "OPPORTUNITIES" | "DATA_QUALITY" | "KPIS";

export interface AdvisorCommandCenterProps {
  clients: Client[];
  goals?: Goal[];
  theme: AppTheme;
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

  // Modals state
  const [client360Id, setClient360Id] = useState<string | null>(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

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

    return {
      tasksCompletedToday: completedToday,
      overdueTasksCount: overdue,
      clientReviewsCompletedThisMonth: 14,
      reportsSentThisMonth: 18,
      openAlertsCount: criticalCount + highPriorityCount,
      avgResolutionTimeHours: 4.2,
    };
  }, [actions, criticalCount, highPriorityCount]);

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
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <View style={styles.headerTopRow}>
          <View>
            <Text style={[styles.greetingLabel, { color: theme.colors.brand }]}>
              ADVISOR COMMAND CENTER
            </Text>
            <Text style={[styles.greetingTitle, { color: theme.colors.textPrimary }]}>
              Good Morning, Advisor
            </Text>
            <Text style={[styles.dateText, { color: theme.colors.textMuted }]}>
              Daily workflow, governance, analytics and decision support
            </Text>
            <Text style={[styles.dateText, { color: theme.colors.textSecondary, marginTop: 2 }]}>
              {todayFormatted} • {attentionClientsCount} Clients Need Attention
            </Text>
          </View>

          {/* Quick Header Actions */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {onOpenAiCopilot && (
              <Pressable
                onPress={onOpenAiCopilot}
                style={[
                  styles.paletteBtn,
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
                { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
              ]}
            >
              <Ionicons name="search" size={14} color={theme.colors.brand} />
              <Text style={[styles.paletteBtnText, { color: theme.colors.textPrimary }]}>
                Command Palette
              </Text>
              <View style={styles.kbdBox}>
                <Text style={[styles.kbdText, { color: theme.colors.textMuted }]}>⌘K</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* 4 Status Breakdown Pills */}
        <View style={styles.breakdownRow}>
          <View style={[styles.breakdownPill, { backgroundColor: theme.colors.dangerSoft }]}>
            <View style={[styles.dot, { backgroundColor: theme.colors.danger }]} />
            <Text style={[styles.breakdownNumber, { color: theme.colors.danger }]}>
              {criticalCount}
            </Text>
            <Text style={[styles.breakdownLabel, { color: theme.colors.danger }]}>Critical</Text>
          </View>

          <View style={[styles.breakdownPill, { backgroundColor: theme.colors.warningSoft }]}>
            <View style={[styles.dot, { backgroundColor: theme.colors.warning }]} />
            <Text style={[styles.breakdownNumber, { color: theme.colors.warning }]}>
              {highPriorityCount}
            </Text>
            <Text style={[styles.breakdownLabel, { color: theme.colors.warning }]}>
              High Priority
            </Text>
          </View>

          <View style={[styles.breakdownPill, { backgroundColor: theme.colors.surfaceStrong }]}>
            <View style={[styles.dot, { backgroundColor: theme.colors.brand }]} />
            <Text style={[styles.breakdownNumber, { color: theme.colors.brand }]}>
              {reviewsDueCount}
            </Text>
            <Text style={[styles.breakdownLabel, { color: theme.colors.textPrimary }]}>
              Reviews Due
            </Text>
          </View>

          <View style={[styles.breakdownPill, { backgroundColor: theme.colors.accentSoft }]}>
            <View style={[styles.dot, { backgroundColor: theme.colors.accent }]} />
            <Text style={[styles.breakdownNumber, { color: theme.colors.accent }]}>
              {opportunities.length}
            </Text>
            <Text style={[styles.breakdownLabel, { color: theme.colors.accent }]}>
              Opportunities
            </Text>
          </View>
        </View>
      </View>

      {/* AI ADVISOR BRIEF BANNER */}
      {brief && (
        <View
          style={[
            styles.briefBanner,
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

          <Text style={[styles.briefHeadline, { color: theme.colors.textPrimary }]}>
            "{brief.headline}"
          </Text>
          <Text style={[styles.briefSummary, { color: theme.colors.textSecondary }]}>
            {brief.summary}
          </Text>
        </View>
      )}

      {/* HORIZON PERSPECTIVE & MODULE TABS */}
      <View style={[styles.subnavBar, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.moduleTabs}>
          {[
            { key: "ACTIONS", label: "Priority Actions" },
            { key: "OPPORTUNITIES", label: `Opportunities (${opportunities.length})` },
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
                  isActive && [
                    styles.moduleTabActive,
                    { borderBottomColor: theme.colors.brand },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.moduleTabText,
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
        </View>

        {/* Perspective Switcher */}
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
            onPress={() => onNavigateTab("Portfolios")}
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
        onOpenTaxHarvesting={() => onNavigateTab("Portfolios")}
        onOpenGoals={() => onNavigateTab("Tools")}
        onOpenAiBrief={() => setIsBriefModalOpen(true)}
        onOpenDecisionJournal={() => setIsDecisionModalOpen(true)}
        onOpenDataQuality={() => setActiveSection("DATA_QUALITY")}
        onOpenBroadcast={onBroadcastOutreach}
        onOpenAiCopilot={onOpenAiCopilot}
        onOpenAiResearch={onOpenAiResearch}
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
    borderRadius: 8,
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
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  greetingLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  dateText: {
    fontSize: 12,
    marginTop: 2,
  },
  paletteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  paletteBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
  kbdBox: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  kbdText: {
    fontSize: 9,
    fontWeight: "800",
  },
  breakdownRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  breakdownPill: {
    flex: 1,
    minWidth: 110,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  breakdownNumber: {
    fontSize: 14,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  briefBanner: {
    borderWidth: 1,
    borderRadius: 12,
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
    borderRadius: 8,
    padding: 2,
    marginBottom: 6,
  },
  horizonBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  horizonBtnText: {
    fontSize: 9,
    letterSpacing: 0.3,
  },
  quickActionsDock: {
    borderWidth: 1,
    borderRadius: 12,
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
    borderRadius: 8,
    paddingVertical: 10,
  },
  dockBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
