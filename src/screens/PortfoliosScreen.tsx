import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AppTheme } from "../theme";
import { PerformanceChart, Sparkline, HoldingsTreemap } from "../components/charts";
import { RebalanceModal, StressTestModal } from "../components/modals";
import { HealthScoreCard } from "../components/HealthScoreCard";
import { AttributionModal } from "../components/AttributionModal";
import { TaxHarvestStudioModal } from "../components/TaxHarvestStudioModal";
import { ScenarioSandboxModal } from "../components/ScenarioSandboxModal";
import { CommitteeMemoModal } from "../components/CommitteeMemoModal";
import { calculateHealthScore } from "../services/healthScore";
import { Client } from "../types/wealth";

export interface PortfoliosScreenProps {
  theme: AppTheme;
  unifiedPortfolioAnalytics: {
    totalCurrent: number;
    totalInvested: number;
    totalGainLoss: number;
    holdings: any[];
    allocation: { assetClass: string; weight: number; currentValue: number; investedValue: number }[];
    riskFlags: string[];
    topPerformers: any[];
    laggards: any[];
    clientSummaries: any[];
  };
  taxReporting: {
    unrealizedGain: number;
    unrealizedLoss: number;
    taxHints: string[];
    taxSensitiveHoldings: any[];
  };
  isMarketRefreshing: boolean;
  refreshLiveMarketPrices: () => Promise<void> | void;
  currencyDisplay: (value: string) => string;
  activeModal?: string | null;
  onCloseActiveModal?: () => void;
  styles: any;
}

export const PortfoliosScreen: React.FC<PortfoliosScreenProps> = React.memo(({
  theme,
  unifiedPortfolioAnalytics,
  taxReporting,
  isMarketRefreshing,
  refreshLiveMarketPrices,
  currencyDisplay,
  activeModal,
  onCloseActiveModal,
  styles,
}) => {

  const [isRebalanceOpen, setIsRebalanceOpen] = useState(false);
  const [isStressTestOpen, setIsStressTestOpen] = useState(false);
  const [isAttributionOpen, setIsAttributionOpen] = useState(false);
  const [isTaxStudioOpen, setIsTaxStudioOpen] = useState(false);
  const [isScenarioOpen, setIsScenarioOpen] = useState(false);
  const [isMemoOpen, setIsMemoOpen] = useState(false);
  const [activeVisualization, setActiveVisualization] = useState<"both" | "chart" | "heatmap">("both");

  React.useEffect(() => {
    if (activeModal === "rebalance") setIsRebalanceOpen(true);
    else if (activeModal === "stress") setIsStressTestOpen(true);
    else if (activeModal === "attribution") setIsAttributionOpen(true);
    else if (activeModal === "tax-harvest") setIsTaxStudioOpen(true);
    else if (activeModal === "whatif") setIsScenarioOpen(true);
    else if (activeModal === "memo") setIsMemoOpen(true);
  }, [activeModal]);

  const healthResult = React.useMemo(() => {
    return calculateHealthScore(
      unifiedPortfolioAnalytics.holdings || [],
      0,
      "unified-portfolio"
    );
  }, [unifiedPortfolioAnalytics.holdings]);

  const unifiedClient: Client = React.useMemo(() => ({
    id: "unified-discretionary",
    name: "Unified Discretionary Wealth",
    phone: "+919876543210",
    email: "fiduciary@assetarray.com",
    category: "Family Office",
    riskProfile: "Balanced Wealth",
    preferredChannel: "Email",
    watchlist: [],
    notes: "Unified cross-client portfolio mandate",
    city: "Mumbai",
    allocation: "Balanced Wealth",
    reminderDate: new Date().toISOString(),
    priority: "High",
    lastContact: new Date().toISOString(),
    updateHistory: [],
    portfolio: unifiedPortfolioAnalytics.holdings || [],
  }), [unifiedPortfolioAnalytics.holdings]);

  const treemapHoldings = React.useMemo(() => {
    if (unifiedPortfolioAnalytics.holdings && unifiedPortfolioAnalytics.holdings.length > 0) {
      return unifiedPortfolioAnalytics.holdings;
    }
    return [];
  }, [unifiedPortfolioAnalytics.holdings]);

  return (
    <>
      <View style={[styles.panel, styles.analyticsPanel]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.panelTitle}>Unified portfolio view & analytics</Text>
            <Text style={styles.panelSubtitle}>
              All tracked client portfolios in one place with performance, allocation,
              and risk visibility.
            </Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginLeft: 12, justifyContent: "flex-end" }}>
            <Pressable
              style={[
                styles.secondaryButton,
                {
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: "rgba(224, 168, 76, 0.15)",
                  borderColor: "rgba(224, 168, 76, 0.4)",
                  borderWidth: 1,
                },
              ]}
              onPress={() => setIsRebalanceOpen(true)}
            >
              <Text style={[styles.secondaryButtonText, { color: "#E0A84C", fontWeight: "700" }]}>
                ⚖️ Rebalance
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.secondaryButton,
                {
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  borderColor: "rgba(239, 68, 68, 0.35)",
                  borderWidth: 1,
                },
              ]}
              onPress={() => setIsStressTestOpen(true)}
            >
              <Text style={[styles.secondaryButtonText, { color: "#F87171", fontWeight: "700" }]}>
                🛡️ Stress Test
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.secondaryButton,
                {
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: "rgba(13, 148, 136, 0.12)",
                  borderColor: "rgba(13, 148, 136, 0.4)",
                  borderWidth: 1,
                },
              ]}
              onPress={() => setIsAttributionOpen(true)}
            >
              <Text style={[styles.secondaryButtonText, { color: "#0D9488", fontWeight: "700" }]}>
                📊 Attribution
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.secondaryButton,
                {
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  borderColor: "rgba(16, 185, 129, 0.4)",
                  borderWidth: 1,
                },
              ]}
              onPress={() => setIsTaxStudioOpen(true)}
            >
              <Text style={[styles.secondaryButtonText, { color: "#10B981", fontWeight: "700" }]}>
                📑 Tax Harvest
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.secondaryButton,
                {
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: "rgba(99, 102, 241, 0.12)",
                  borderColor: "rgba(99, 102, 241, 0.4)",
                  borderWidth: 1,
                },
              ]}
              onPress={() => setIsScenarioOpen(true)}
            >
              <Text style={[styles.secondaryButtonText, { color: "#818CF8", fontWeight: "700" }]}>
                🎯 What-If
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.secondaryButton,
                {
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: "rgba(224, 168, 76, 0.18)",
                  borderColor: "rgba(224, 168, 76, 0.5)",
                  borderWidth: 1,
                },
              ]}
              onPress={() => setIsMemoOpen(true)}
            >
              <Text style={[styles.secondaryButtonText, { color: "#E0A84C", fontWeight: "700" }]}>
                📜 IC Memo
              </Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, { paddingHorizontal: 14, paddingVertical: 8 }]}
              onPress={() => void refreshLiveMarketPrices()}
              disabled={isMarketRefreshing}
            >
              <Text style={styles.primaryButtonText}>
                {isMarketRefreshing ? "Updating..." : "⚡ Refresh Prices"}
              </Text>
            </Pressable>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(34, 197, 94, 0.08)",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "rgba(34, 197, 94, 0.28)",
            paddingVertical: 9,
            paddingHorizontal: 14,
            marginTop: 14,
            marginBottom: 6,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#22c55e",
                shadowColor: "#22c55e",
                shadowRadius: 6,
                shadowOpacity: 0.8,
              }}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: "#22c55e",
                letterSpacing: 0.5,
              }}
            >
              MARKET DATA FEED • SIMULATED TICKS
            </Text>
          </View>
          <Text
            style={{
              fontSize: 10,
              color: theme.colors.textSecondary,
              fontWeight: "600",
            }}
          >
            Simulated Market Model • Portfolio Values Auto-Updated
          </Text>
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

        {/* AI Portfolio Health Score Diagnostic */}
        <HealthScoreCard
          theme={theme}
          healthResult={healthResult}
          onPressDetails={() => setIsAttributionOpen(true)}
        />

        <View style={{ flexDirection: "row", gap: 8, marginVertical: 12 }}>
          <Pressable
            style={[
              styles.optionChip,
              activeVisualization === "both" && styles.optionChipActive,
            ]}
            onPress={() => setActiveVisualization("both")}
          >
            <Text
              style={[
                styles.optionChipText,
                activeVisualization === "both" && styles.optionChipTextActive,
              ]}
            >
              All Visualizations
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.optionChip,
              activeVisualization === "chart" && styles.optionChipActive,
            ]}
            onPress={() => setActiveVisualization("chart")}
          >
            <Text
              style={[
                styles.optionChipText,
                activeVisualization === "chart" && styles.optionChipTextActive,
              ]}
            >
              📈 Return Trajectory
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.optionChip,
              activeVisualization === "heatmap" && styles.optionChipActive,
            ]}
            onPress={() => setActiveVisualization("heatmap")}
          >
            <Text
              style={[
                styles.optionChipText,
                activeVisualization === "heatmap" && styles.optionChipTextActive,
              ]}
            >
              🗺️ Treemap Heatmap
            </Text>
          </Pressable>
        </View>

        {(activeVisualization === "both" || activeVisualization === "chart") && (
          <PerformanceChart
            theme={theme}
            title="Consolidated Portfolio Trajectory"
            subtitle="Real-time multi-asset aggregate return curve"
          />
        )}

        {(activeVisualization === "both" || activeVisualization === "heatmap") && (
          <HoldingsTreemap
            holdings={treemapHoldings}
            theme={theme}
          />
        )}

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
                <View
                  key={`${item.clientId}-${item.id}`}
                  style={[
                    styles.analyticsListCard,
                    {
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clientName}>{item.assetName}</Text>
                    <Text style={styles.clientMeta}>
                      {item.clientName} | {item.assetClass}
                    </Text>
                    <Text style={styles.analyticsPositive}>
                      {item.returnPct.toFixed(1)}% | {currencyDisplay(`${item.gainLoss}`)}
                    </Text>
                  </View>
                  <Sparkline
                    data={[95, 96, 95.8, 98.2, 97.5, 100 + Math.max(1, item.returnPct)]}
                    color="#10B981"
                    width={56}
                    height={22}
                  />
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
                <View
                  key={`${item.clientId}-${item.id}`}
                  style={[
                    styles.analyticsListCard,
                    {
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
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
                  <Sparkline
                    data={[105, 103, 104, 101.5, 100.8, 100 + item.returnPct]}
                    color="#EF4444"
                    width={56}
                    height={22}
                  />
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

      {/* Tax Optimization & Reporting */}
      <View style={styles.dualColumn}>
        <View style={styles.column}>
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
        </View>
      </View>

      <RebalanceModal
        visible={isRebalanceOpen}
        onClose={() => {
          setIsRebalanceOpen(false);
          onCloseActiveModal?.();
        }}
        holdings={unifiedPortfolioAnalytics.holdings}
        theme={theme}
        clientName="All Discretionary Portfolios"
      />

      <StressTestModal
        visible={isStressTestOpen}
        onClose={() => {
          setIsStressTestOpen(false);
          onCloseActiveModal?.();
        }}
        holdings={unifiedPortfolioAnalytics.holdings}
        theme={theme}
        clientName="All Discretionary Portfolios"
      />

      <AttributionModal
        visible={isAttributionOpen}
        onClose={() => {
          setIsAttributionOpen(false);
          onCloseActiveModal?.();
        }}
        holdings={unifiedPortfolioAnalytics.holdings}
        theme={theme}
        portfolioName="All Discretionary Portfolios"
      />

      <TaxHarvestStudioModal
        visible={isTaxStudioOpen}
        onClose={() => {
          setIsTaxStudioOpen(false);
          onCloseActiveModal?.();
        }}
        holdings={unifiedPortfolioAnalytics.holdings}
        theme={theme}
        portfolioName="All Discretionary Portfolios"
      />

      <ScenarioSandboxModal
        visible={isScenarioOpen}
        onClose={() => {
          setIsScenarioOpen(false);
          onCloseActiveModal?.();
        }}
        holdings={unifiedPortfolioAnalytics.holdings}
        theme={theme}
        portfolioName="All Discretionary Portfolios"
      />

      <CommitteeMemoModal
        visible={isMemoOpen}
        onClose={() => {
          setIsMemoOpen(false);
          onCloseActiveModal?.();
        }}
        client={unifiedClient}
        theme={theme}
      />
    </>
  );
});

