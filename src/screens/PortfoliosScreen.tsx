import React from "react";
import { Pressable, Text, View } from "react-native";
import { AppTheme } from "../theme";

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
  styles: any;
}

export const PortfoliosScreen: React.FC<PortfoliosScreenProps> = ({
  theme,
  unifiedPortfolioAnalytics,
  taxReporting,
  isMarketRefreshing,
  refreshLiveMarketPrices,
  currencyDisplay,
  styles,
}) => {
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
    </>
  );
};
