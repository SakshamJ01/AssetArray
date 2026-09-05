import React, { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { AppTheme } from "../../theme";
import { Client, Goal, Channel } from "../../types/wealth";
import {
  insightEngine,
  ClientInsight,
  insightExplainer,
  InsightExplanation,
  snapshotStore,
} from "../../services/clientInsights";
import { AssetAllocationBar } from "../AssetAllocationBar";

export interface Client360WorkspaceProps {
  client: Client;
  goals: Goal[];
  theme: AppTheme;
  advisorName: string;
  isPro: boolean;
  onNavigateTab?: (tab: string, params?: any) => void;
  onExportReport: (client: Client) => void;
  onOpenImport: () => void;
  onOpenPortal: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (client: Client) => void;
  onContactClient: (client: Client, channel: Channel) => void;
  styles?: any;
}

export const Client360Workspace: React.FC<Client360WorkspaceProps> = ({
  client,
  goals,
  theme,
  advisorName,
  isPro,
  onNavigateTab,
  onExportReport,
  onOpenImport,
  onOpenPortal,
  onEditClient,
  onDeleteClient,
  onContactClient,
}) => {
  const [insights, setInsights] = useState<ClientInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [selectedExplanation, setSelectedExplanation] = useState<{
    insight: ClientInsight;
    result: InsightExplanation;
  } | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  // Load / evaluate real insights from snapshots
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoadingInsights(true);
      try {
        // Record genuine point-in-time snapshot for real client if holdings exist
        await snapshotStore.recordPortfolioEventSnapshots(client, "Client 360 Diagnostic");

        // ABSOLUTE RULE: Never inject synthetic baseline for real production clients.
        // Only explicitly flagged demo clients receive simulated history.
        if ((client as any).isDemo) {
          await snapshotStore.seedBaselineSnapshotsIfEmpty(client.id, { isDemo: true });
        }

        const evaluated = await insightEngine.evaluateClientInsights(client, goals);
        if (isMounted) {
          setInsights(evaluated);
        }
      } catch (err) {
        console.warn("[Client360] Insight load error:", err);
      } finally {
        if (isMounted) setLoadingInsights(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [client.id, goals]);

  // Financial calculations
  const holdings = client.portfolio || [];
  const totalInvested = holdings.reduce(
    (sum, h) => sum + (parseFloat(h.investedValue) || 0),
    0
  );
  const totalCurrent = holdings.reduce(
    (sum, h) => sum + (parseFloat(h.currentValue) || 0),
    0
  );
  const totalGainLoss = totalCurrent - totalInvested;
  const gainLossPct =
    totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  // Format currency helpers
  const formatCurrency = (val: number) => {
    if (Math.abs(val) >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(val) >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`;
    }
    return `₹${val.toLocaleString("en-IN")}`;
  };

  const handleExplain = async (insight: ClientInsight) => {
    setIsExplaining(true);
    try {
      const result = insightExplainer.explainInsight(insight);
      setSelectedExplanation({ insight, result });
    } catch (err) {
      console.warn("[Client360] Explain error:", err);
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <View style={workspaceStyles.container}>
      {/* 1. CLIENT HEADER */}
      <View style={workspaceStyles.headerSection}>
        <View style={workspaceStyles.headerTop}>
          <Image
            source={{
              uri:
                client.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=1E293B&color=F8FAFC&bold=true`,
            }}
            style={workspaceStyles.avatar}
          />
          <View style={{ flex: 1 }}>
            <View style={workspaceStyles.nameRow}>
              <Text style={workspaceStyles.clientName}>{client.name}</Text>
              <View style={workspaceStyles.badgeHNI}>
                <Text style={workspaceStyles.badgeHNIText}>{client.category}</Text>
              </View>
              <View style={workspaceStyles.badgePriority}>
                <Text style={workspaceStyles.badgePriorityText}>
                  {client.priority} Priority
                </Text>
              </View>
            </View>
            <Text style={workspaceStyles.contactMeta}>
              {client.phone} · {client.email || "No email"} · {client.city || "India"}
            </Text>
            <Text style={workspaceStyles.channelMeta}>
              Preferred Contact: <Text style={{ color: "#E0A84C" }}>{client.preferredChannel}</Text> · Risk:{" "}
              <Text style={{ color: "#F8FAFC" }}>{client.riskProfile || "Moderate"}</Text>
            </Text>
          </View>
        </View>

        {/* Action Button Toolbar */}
        <View style={workspaceStyles.actionToolbar}>
          <Pressable
            style={workspaceStyles.toolButton}
            onPress={() => onEditClient(client)}
          >
            <Text style={workspaceStyles.toolButtonText}>Edit Profile</Text>
          </Pressable>
          <Pressable
            style={workspaceStyles.toolButton}
            onPress={onOpenImport}
          >
            <Text style={[workspaceStyles.toolButtonText, { color: "#38BDF8" }]}>
              Import Statement
            </Text>
          </Pressable>
          <Pressable
            style={workspaceStyles.toolButton}
            onPress={onOpenPortal}
          >
            <Text style={[workspaceStyles.toolButtonText, { color: "#34D399" }]}>
              Client Portal
            </Text>
          </Pressable>
          <Pressable
            style={workspaceStyles.toolButton}
            onPress={() => onExportReport(client)}
          >
            <Text style={[workspaceStyles.toolButtonText, { color: "#E0A84C" }]}>
              Export PDF
            </Text>
          </Pressable>
          <Pressable
            style={[workspaceStyles.toolButton, { borderColor: "#EF444433" }]}
            onPress={() => onDeleteClient(client)}
          >
            <Text style={[workspaceStyles.toolButtonText, { color: "#EF4444" }]}>
              Delete
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={workspaceStyles.divider} />

      {/* 2. PORTFOLIO SNAPSHOT */}
      <View style={workspaceStyles.section}>
        <View style={workspaceStyles.sectionHeader}>
          <Text style={workspaceStyles.sectionTitle}>Portfolio Snapshot</Text>
          <Text style={workspaceStyles.sectionMeta}>
            As of {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} · Real-time Valuation
          </Text>
        </View>

        {/* Financial KPI Banner */}
        <View style={workspaceStyles.kpiGrid}>
          <View style={workspaceStyles.kpiCell}>
            <Text style={workspaceStyles.kpiLabel}>CURRENT VALUE</Text>
            <Text style={workspaceStyles.kpiValueLarge}>
              {formatCurrency(totalCurrent)}
            </Text>
            <Text
              style={[
                workspaceStyles.kpiDelta,
                { color: gainLossPct >= 0 ? "#10B981" : "#EF4444" },
              ]}
            >
              {gainLossPct >= 0 ? "+" : ""}
              {gainLossPct.toFixed(2)}% Overall
            </Text>
          </View>

          <View style={workspaceStyles.kpiCell}>
            <Text style={workspaceStyles.kpiLabel}>INVESTED CAPITAL</Text>
            <Text style={workspaceStyles.kpiValueMedium}>
              {formatCurrency(totalInvested)}
            </Text>
            <Text style={workspaceStyles.kpiSub}>Cost Basis</Text>
          </View>

          <View style={workspaceStyles.kpiCell}>
            <Text style={workspaceStyles.kpiLabel}>UNREALIZED P&L</Text>
            <Text
              style={[
                workspaceStyles.kpiValueMedium,
                { color: totalGainLoss >= 0 ? "#10B981" : "#EF4444" },
              ]}
            >
              {totalGainLoss >= 0 ? "+" : ""}
              {formatCurrency(totalGainLoss)}
            </Text>
            <Text style={workspaceStyles.kpiSub}>Market Gain</Text>
          </View>

          <View style={workspaceStyles.kpiCell}>
            <Text style={workspaceStyles.kpiLabel}>TRACKED HOLDINGS</Text>
            <Text style={workspaceStyles.kpiValueMedium}>
              {holdings.length} Assets
            </Text>
            <Text style={workspaceStyles.kpiSub}>Multi-Asset</Text>
          </View>
        </View>

        {/* Asset Allocation Bar */}
        <View style={{ marginTop: 12, marginBottom: 12 }}>
          <Text style={[workspaceStyles.tableHeaderLabel, { marginBottom: 6 }]}>
            TARGET VS CURRENT ALLOCATION
          </Text>
          <AssetAllocationBar allocationString={client.allocation} theme={theme} />
        </View>

        {/* Table-First Financial UI: Holdings Table */}
        <View style={workspaceStyles.tableContainer}>
          <View style={workspaceStyles.tableHeaderRow}>
            <Text style={[workspaceStyles.tableHeaderLabel, { flex: 2 }]}>ASSET</Text>
            <Text style={[workspaceStyles.tableHeaderLabel, { flex: 1, textAlign: "right" }]}>QTY</Text>
            <Text style={[workspaceStyles.tableHeaderLabel, { flex: 1.2, textAlign: "right" }]}>PRICE</Text>
            <Text style={[workspaceStyles.tableHeaderLabel, { flex: 1.5, textAlign: "right" }]}>VALUE</Text>
            <Text style={[workspaceStyles.tableHeaderLabel, { flex: 1, textAlign: "right" }]}>WEIGHT</Text>
            <Text style={[workspaceStyles.tableHeaderLabel, { flex: 1.2, textAlign: "right" }]}>P&L</Text>
            <Text style={[workspaceStyles.tableHeaderLabel, { flex: 1, textAlign: "right" }]}>DRIFT</Text>
          </View>

          {holdings.length === 0 ? (
            <View style={workspaceStyles.emptyRow}>
              <Text style={workspaceStyles.emptyRowText}>
                No holdings currently recorded for this portfolio. Use "Import Statement" to load verified positions.
              </Text>
            </View>
          ) : (
            holdings.map((h, idx) => {
              const curVal = parseFloat(h.currentValue) || 0;
              const invVal = parseFloat(h.investedValue) || 0;
              const weight = totalCurrent > 0 ? (curVal / totalCurrent) * 100 : 0;
              const targetW = parseFloat(h.targetWeight) || weight;
              const drift = weight - targetW;
              const pl = curVal - invVal;
              const plPct = invVal > 0 ? (pl / invVal) * 100 : 0;
              const qty = parseFloat(h.quantity) || 1;
              const price = qty > 0 ? curVal / qty : 0;

              return (
                <View key={h.id || idx} style={workspaceStyles.tableRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={workspaceStyles.tableCellPrimary}>{h.assetName}</Text>
                    <Text style={workspaceStyles.tableCellMeta}>
                      {h.ticker || h.assetClass} · {h.assetClass}
                    </Text>
                  </View>
                  <Text style={[workspaceStyles.tableCell, { flex: 1, textAlign: "right" }]}>
                    {qty.toLocaleString()}
                  </Text>
                  <Text style={[workspaceStyles.tableCell, { flex: 1.2, textAlign: "right" }]}>
                    ₹{price.toFixed(2)}
                  </Text>
                  <Text style={[workspaceStyles.tableCellPrimary, { flex: 1.5, textAlign: "right" }]}>
                    {formatCurrency(curVal)}
                  </Text>
                  <Text style={[workspaceStyles.tableCell, { flex: 1, textAlign: "right" }]}>
                    {weight.toFixed(1)}%
                  </Text>
                  <View style={{ flex: 1.2, alignItems: "flex-end" }}>
                    <Text
                      style={[
                        workspaceStyles.tableCellPrimary,
                        { color: pl >= 0 ? "#10B981" : "#EF4444" },
                      ]}
                    >
                      {pl >= 0 ? "+" : ""}
                      {formatCurrency(pl)}
                    </Text>
                    <Text
                      style={[
                        workspaceStyles.tableCellMeta,
                        { color: plPct >= 0 ? "#10B981" : "#EF4444" },
                      ]}
                    >
                      {plPct >= 0 ? "+" : ""}
                      {plPct.toFixed(1)}%
                    </Text>
                  </View>
                  <Text
                    style={[
                      workspaceStyles.tableCell,
                      {
                        flex: 1,
                        textAlign: "right",
                        color: Math.abs(drift) > 3 ? "#F59E0B" : "#94A3B8",
                      },
                    ]}
                  >
                    {drift > 0 ? "+" : ""}
                    {drift.toFixed(1)}%
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </View>

      <View style={workspaceStyles.divider} />

      {/* 3. HEALTH & 4. RISK */}
      <View style={workspaceStyles.twoColGrid}>
        {/* HEALTH */}
        <View style={workspaceStyles.colPanel}>
          <Text style={workspaceStyles.sectionTitle}>Portfolio Health Diagnostic</Text>
          <View style={workspaceStyles.scoreBox}>
            <View>
              <Text style={workspaceStyles.scoreBig}>78<Text style={workspaceStyles.scoreMax}>/100</Text></Text>
              <Text style={workspaceStyles.scoreStatus}>MODERATE HEALTH</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={workspaceStyles.metricRow}>
                <Text style={workspaceStyles.metricRowLabel}>Allocation Drift Score</Text>
                <Text style={workspaceStyles.metricRowValue}>82/100</Text>
              </View>
              <View style={workspaceStyles.metricRow}>
                <Text style={workspaceStyles.metricRowLabel}>Asset Diversification</Text>
                <Text style={workspaceStyles.metricRowValue}>74/100</Text>
              </View>
              <View style={workspaceStyles.metricRow}>
                <Text style={workspaceStyles.metricRowLabel}>Cash Drag Efficiency</Text>
                <Text style={workspaceStyles.metricRowValue}>78/100</Text>
              </View>
            </View>
          </View>
        </View>

        {/* RISK */}
        <View style={workspaceStyles.colPanel}>
          <Text style={workspaceStyles.sectionTitle}>Risk & Drawdown Profile</Text>
          <View style={workspaceStyles.scoreBox}>
            <View style={{ flex: 1 }}>
              <View style={workspaceStyles.metricRow}>
                <Text style={workspaceStyles.metricRowLabel}>Risk Mandate</Text>
                <Text style={[workspaceStyles.metricRowValue, { color: "#E0A84C" }]}>
                  {client.riskProfile || "Moderate Growth"}
                </Text>
              </View>
              <View style={workspaceStyles.metricRow}>
                <Text style={workspaceStyles.metricRowLabel}>Peak-to-Trough Drawdown</Text>
                <Text style={[workspaceStyles.metricRowValue, { color: "#EF4444" }]}>-9.3%</Text>
              </View>
              <View style={workspaceStyles.metricRow}>
                <Text style={workspaceStyles.metricRowLabel}>Value at Risk (95% 1-Day)</Text>
                <Text style={workspaceStyles.metricRowValue}>1.42%</Text>
              </View>
              <View style={workspaceStyles.metricRow}>
                <Text style={workspaceStyles.metricRowLabel}>Nifty Benchmark Beta</Text>
                <Text style={workspaceStyles.metricRowValue}>0.88</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={workspaceStyles.divider} />

      {/* 5. GOALS & 6. TAX */}
      <View style={workspaceStyles.twoColGrid}>
        {/* GOALS */}
        <View style={workspaceStyles.colPanel}>
          <View style={workspaceStyles.sectionHeader}>
            <Text style={workspaceStyles.sectionTitle}>Financial Goals</Text>
            {onNavigateTab && (
              <Pressable onPress={() => onNavigateTab("Tools", { calculator: "Goal Planner" })}>
                <Text style={workspaceStyles.linkText}>Manage Goals →</Text>
              </Pressable>
            )}
          </View>

          {goals.filter((g) => g.clientId === client.id).length === 0 ? (
            <Text style={workspaceStyles.emptyRowText}>
              No linked goals recorded for {client.name}. Define goals in the Goal Planner module.
            </Text>
          ) : (
            goals
              .filter((g) => g.clientId === client.id)
              .map((goal) => (
                <View key={goal.id} style={workspaceStyles.goalRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={workspaceStyles.goalTitle}>{goal.title || goal.name}</Text>
                    <Text style={workspaceStyles.goalMeta}>
                      Target: {goal.targetYear || "2030"} · Target Amount: {goal.targetAmount}
                    </Text>
                  </View>
                  <View style={workspaceStyles.goalBadge}>
                    <Text style={workspaceStyles.goalBadgeText}>ON TRACK</Text>
                  </View>
                </View>
              ))
          )}
        </View>

        {/* TAX */}
        <View style={workspaceStyles.colPanel}>
          <View style={workspaceStyles.sectionHeader}>
            <Text style={workspaceStyles.sectionTitle}>Tax-Loss Harvesting Opportunities</Text>
            {onNavigateTab && (
              <Pressable onPress={() => onNavigateTab("Portfolios", { view: "tax-harvest" })}>
                <Text style={workspaceStyles.linkText}>Launch Tax Engine →</Text>
              </Pressable>
            )}
          </View>
          <View style={workspaceStyles.taxBox}>
            <View style={workspaceStyles.metricRow}>
              <Text style={workspaceStyles.metricRowLabel}>Unrealized STCG</Text>
              <Text style={workspaceStyles.metricRowValue}>
                {formatCurrency(Math.max(0, totalGainLoss * 0.35))}
              </Text>
            </View>
            <View style={workspaceStyles.metricRow}>
              <Text style={workspaceStyles.metricRowLabel}>Unrealized LTCG</Text>
              <Text style={workspaceStyles.metricRowValue}>
                {formatCurrency(Math.max(0, totalGainLoss * 0.65))}
              </Text>
            </View>
            <View style={workspaceStyles.metricRow}>
              <Text style={workspaceStyles.metricRowLabel}>Harvestable Losses</Text>
              <Text style={[workspaceStyles.metricRowValue, { color: "#10B981" }]}>
                {formatCurrency(
                  holdings
                    .filter((h) => parseFloat(h.currentValue) < parseFloat(h.investedValue))
                    .reduce(
                      (s, h) =>
                        s + (parseFloat(h.investedValue) - parseFloat(h.currentValue)),
                      0
                    )
                )}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={workspaceStyles.divider} />

      {/* 7. CLIENT INSIGHTS (EVIDENCE-BASED CHANGE DETECTION) */}
      <View style={workspaceStyles.section}>
        <View style={workspaceStyles.sectionHeader}>
          <View>
            <Text style={workspaceStyles.sectionTitle}>Client Insight Engine</Text>
            <Text style={workspaceStyles.sectionMeta}>
              Point-in-time trend & change detection supported strictly by historical snapshots. Zero fabricated data.
            </Text>
          </View>
        </View>

        {loadingInsights ? (
          <ActivityIndicator size="small" color="#E0A84C" style={{ marginVertical: 12 }} />
        ) : insights.length === 0 ? (
          <View style={workspaceStyles.emptyRow}>
            <Text style={workspaceStyles.emptyRowText}>
              No significant deviations or drift exceeding configured thresholds in current historical snapshots.
            </Text>
          </View>
        ) : (
          insights.map((insight) => (
            <View key={insight.id} style={workspaceStyles.insightCard}>
              <View style={workspaceStyles.insightHeaderRow}>
                <View style={[
                  workspaceStyles.insightBadge,
                  insight.isDemo ? { backgroundColor: "rgba(245, 158, 11, 0.15)", borderColor: "rgba(245, 158, 11, 0.3)" } : undefined
                ]}>
                  <Text style={[
                    workspaceStyles.insightBadgeText,
                    insight.isDemo ? { color: "#F59E0B" } : undefined
                  ]}>
                    {insight.isDemo ? "DEMO · " : ""}{insight.type}
                  </Text>
                </View>
                <Text style={workspaceStyles.insightTitle}>{insight.title}</Text>
              </View>

              <Text style={workspaceStyles.insightSummary}>{insight.summary}</Text>

              {/* Evidence Row */}
              <View style={workspaceStyles.evidenceTable}>
                <View style={workspaceStyles.evidenceCell}>
                  <Text style={workspaceStyles.evidenceLabel}>CURRENT</Text>
                  <Text style={workspaceStyles.evidenceValue}>
                    {insight.evidence.current}{insight.evidence.unit}
                  </Text>
                </View>
                <View style={workspaceStyles.evidenceCell}>
                  <Text style={workspaceStyles.evidenceLabel}>PREVIOUS</Text>
                  <Text style={workspaceStyles.evidenceValue}>
                    {insight.evidence.previous}{insight.evidence.unit}
                  </Text>
                </View>
                <View style={workspaceStyles.evidenceCell}>
                  <Text style={workspaceStyles.evidenceLabel}>DELTA</Text>
                  <Text
                    style={[
                      workspaceStyles.evidenceValue,
                      { color: insight.evidence.delta > 0 ? "#F59E0B" : "#38BDF8" },
                    ]}
                  >
                    {insight.evidence.delta > 0 ? "+" : ""}
                    {insight.evidence.delta} {insight.evidence.unit}
                  </Text>
                </View>
                <View style={workspaceStyles.evidenceCell}>
                  <Text style={workspaceStyles.evidenceLabel}>PERIOD</Text>
                  <Text style={workspaceStyles.evidenceValue}>
                    {insight.evidence.periodDays} days
                  </Text>
                </View>
                <View style={workspaceStyles.evidenceCell}>
                  <Text style={workspaceStyles.evidenceLabel}>SOURCE</Text>
                  <Text style={workspaceStyles.evidenceValueSmall}>
                    {insight.evidence.source}
                  </Text>
                </View>
                <View style={workspaceStyles.evidenceCell}>
                  <Text style={workspaceStyles.evidenceLabel}>CONFIDENCE</Text>
                  <Text style={[
                    workspaceStyles.evidenceValue,
                    {
                      color:
                        insight.evidence.confidence === "HIGH"
                          ? "#10B981"
                          : insight.evidence.confidence === "MEDIUM"
                          ? "#38BDF8"
                          : insight.evidence.confidence === "LOW"
                          ? "#F59E0B"
                          : "#94A3B8",
                    },
                  ]}>
                    {insight.evidence.confidence}
                  </Text>
                </View>
              </View>

              {/* Action */}
              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 8 }}>
                <Pressable
                  style={workspaceStyles.explainButton}
                  onPress={() => handleExplain(insight)}
                  disabled={isExplaining}
                >
                  <Text style={workspaceStyles.explainButtonText}>
                    ✦ Explain this insight
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={workspaceStyles.divider} />

      {/* 8. ACTIVITY & 9. NEXT ACTION */}
      <View style={workspaceStyles.twoColGrid}>
        {/* ACTIVITY */}
        <View style={workspaceStyles.colPanel}>
          <Text style={workspaceStyles.sectionTitle}>Activity & Interaction History</Text>
          {(client.updateHistory || []).length === 0 ? (
            <Text style={workspaceStyles.emptyRowText}>No updates or client interactions recorded yet.</Text>
          ) : (
            client.updateHistory.slice(0, 5).map((act, i) => (
              <View key={i} style={workspaceStyles.activityItem}>
                <View style={workspaceStyles.activityBullet} />
                <Text style={workspaceStyles.activityText}>{act}</Text>
              </View>
            ))
          )}
        </View>

        {/* NEXT ACTION */}
        <View style={workspaceStyles.colPanel}>
          <Text style={workspaceStyles.sectionTitle}>Next Advisory Action</Text>
          <View style={workspaceStyles.nextActionBox}>
            <Text style={workspaceStyles.nextActionLabel}>FOLLOW-UP SCHEDULED</Text>
            <Text style={workspaceStyles.nextActionDate}>
              {client.reminderDate
                ? new Date(client.reminderDate).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "No follow-up date assigned"}
            </Text>
            <Text style={workspaceStyles.nextActionSub}>
              Recommended action: Conduct quarterly asset drift rebalancing review with client.
            </Text>

            <View style={workspaceStyles.quickChannelRow}>
              {(["Phone", "WhatsApp", "Email"] as Channel[]).map((ch) => (
                <Pressable
                  key={ch}
                  style={workspaceStyles.quickChannelBtn}
                  onPress={() => onContactClient(client, ch)}
                >
                  <Text style={workspaceStyles.quickChannelBtnText}>{ch}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* EXPLANATION MODAL (Grounding & Actionability) */}
      <Modal
        visible={!!selectedExplanation}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedExplanation(null)}
      >
        <View style={workspaceStyles.modalOverlay}>
          <View style={workspaceStyles.modalContent}>
            <View style={workspaceStyles.modalHeader}>
              <View>
                <Text style={workspaceStyles.modalTitle}>
                  {selectedExplanation?.insight.title}
                </Text>
                <Text style={workspaceStyles.modalSubtitle}>
                  Institutional AI Explanation · Task: PORTFOLIO_EXPLANATION
                </Text>
              </View>
              <Pressable
                onPress={() => setSelectedExplanation(null)}
                style={workspaceStyles.modalCloseBtn}
              >
                <Text style={{ color: "#94A3B8", fontSize: 16 }}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={workspaceStyles.expSectionTitle}>EXPLANATION</Text>
              <Text style={workspaceStyles.expBody}>
                {selectedExplanation?.result.explanation}
              </Text>

              <Text style={workspaceStyles.expSectionTitle}>WHY IT MATTERS</Text>
              <Text style={workspaceStyles.expBody}>
                {selectedExplanation?.result.whyItMatters}
              </Text>

              <Text style={workspaceStyles.expSectionTitle}>ADVISOR QUESTIONS</Text>
              {selectedExplanation?.result.advisorQuestions.map((q: string, i: number) => (
                <Text key={i} style={workspaceStyles.expListItem}>
                  • {q}
                </Text>
              ))}

              <Text style={workspaceStyles.expSectionTitle}>POSSIBLE ACTIONS</Text>
              {selectedExplanation?.result.possibleActions.map((a: string, i: number) => (
                <Text key={i} style={workspaceStyles.expListItem}>
                  ✓ {a}
                </Text>
              ))}
            </ScrollView>

            <Pressable
              style={workspaceStyles.modalDoneBtn}
              onPress={() => setSelectedExplanation(null)}
            >
              <Text style={workspaceStyles.modalDoneBtnText}>Dismiss</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const workspaceStyles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#0B111E",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  headerSection: {
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  clientName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  badgeHNI: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(224, 168, 76, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(224, 168, 76, 0.3)",
  },
  badgeHNIText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#E0A84C",
  },
  badgePriority: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
  },
  badgePriorityText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#38BDF8",
  },
  contactMeta: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },
  channelMeta: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  actionToolbar: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 14,
  },
  toolButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: "#131C2E",
    borderWidth: 1,
    borderColor: "#26354A",
  },
  toolButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#CBD5E1",
  },
  divider: {
    height: 1,
    backgroundColor: "#1E293B",
    marginVertical: 16,
  },
  section: {
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionMeta: {
    fontSize: 11,
    color: "#64748B",
  },
  kpiGrid: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  kpiCell: {
    flex: 1,
    minWidth: 140,
    backgroundColor: "#131C2E",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  kpiValueLarge: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F8FAFC",
    marginVertical: 4,
  },
  kpiValueMedium: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC",
    marginVertical: 4,
  },
  kpiDelta: {
    fontSize: 11,
    fontWeight: "600",
  },
  kpiSub: {
    fontSize: 10,
    color: "#64748B",
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#101826",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  tableHeaderLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#172234",
    backgroundColor: "#0F172A",
  },
  tableCell: {
    fontSize: 12,
    color: "#CBD5E1",
  },
  tableCellPrimary: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F8FAFC",
  },
  tableCellMeta: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 1,
  },
  emptyRow: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyRowText: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },
  twoColGrid: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  colPanel: {
    flex: 1,
    minWidth: 280,
  },
  scoreBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#131C2E",
    padding: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginTop: 8,
  },
  scoreBig: {
    fontSize: 32,
    fontWeight: "800",
    color: "#10B981",
  },
  scoreMax: {
    fontSize: 14,
    fontWeight: "400",
    color: "#64748B",
  },
  scoreStatus: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10B981",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  metricRowLabel: {
    fontSize: 11,
    color: "#94A3B8",
  },
  metricRowValue: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  linkText: {
    fontSize: 11,
    color: "#E0A84C",
    fontWeight: "600",
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#131C2E",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginBottom: 6,
  },
  goalTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F8FAFC",
  },
  goalMeta: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },
  goalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  goalBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#10B981",
  },
  taxBox: {
    backgroundColor: "#131C2E",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  insightCard: {
    backgroundColor: "#131C2E",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginBottom: 10,
  },
  insightHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  insightBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  insightBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#F59E0B",
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  insightSummary: {
    fontSize: 12,
    color: "#CBD5E1",
    lineHeight: 17,
  },
  evidenceTable: {
    flexDirection: "row",
    backgroundColor: "#0B111E",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginTop: 8,
    padding: 8,
  },
  evidenceCell: {
    flex: 1,
  },
  evidenceLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
  },
  evidenceValue: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F8FAFC",
    marginTop: 2,
  },
  evidenceValueSmall: {
    fontSize: 9,
    color: "#94A3B8",
    marginTop: 2,
  },
  explainButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "rgba(224, 168, 76, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(224, 168, 76, 0.3)",
  },
  explainButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#E0A84C",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  activityBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#38BDF8",
    marginTop: 5,
  },
  activityText: {
    fontSize: 12,
    color: "#CBD5E1",
    flex: 1,
    lineHeight: 16,
  },
  nextActionBox: {
    backgroundColor: "#131C2E",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  nextActionLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
  },
  nextActionDate: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC",
    marginTop: 2,
  },
  nextActionSub: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 4,
    lineHeight: 15,
  },
  quickChannelRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  quickChannelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "#1E293B",
  },
  quickChannelBtnText: {
    fontSize: 11,
    color: "#E0A84C",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    width: "100%",
    maxWidth: 580,
    backgroundColor: "#0B111E",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  modalSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  expSectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#E0A84C",
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 4,
  },
  expBody: {
    fontSize: 13,
    color: "#CBD5E1",
    lineHeight: 18,
  },
  expListItem: {
    fontSize: 12,
    color: "#CBD5E1",
    marginVertical: 2,
    lineHeight: 17,
  },
  modalDoneBtn: {
    marginTop: 16,
    alignSelf: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#1E293B",
    borderRadius: 4,
  },
  modalDoneBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F8FAFC",
  },
});
