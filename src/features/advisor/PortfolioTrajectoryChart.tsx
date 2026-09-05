/**
 * Portfolio Trajectory & Benchmark Alpha Chart
 * Provides the executive context chart placed directly below summary KPIs
 * Visualizes 6-month portfolio trajectory vs 65/35 blended benchmark with active alpha metrics.
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppTheme } from "../../theme";

export interface PortfolioTrajectoryChartProps {
  theme: AppTheme;
  totalAum: number;
  onViewAttribution?: () => void;
}

type Period = "3M" | "6M" | "1Y" | "YTD";

const TRAJECTORY_DATA: Record<Period, { labels: string[]; portfolio: number[]; benchmark: number[]; alpha: string; sharpe: string }> = {
  "3M": {
    labels: ["Jun", "Jul", "Aug", "Sep"],
    portfolio: [100, 102.4, 104.1, 106.8],
    benchmark: [100, 101.2, 102.0, 103.4],
    alpha: "+3.4%",
    sharpe: "1.92",
  },
  "6M": {
    labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"],
    portfolio: [100, 103.1, 102.4, 107.5, 109.8, 114.2],
    benchmark: [100, 101.5, 101.0, 104.2, 106.1, 109.6],
    alpha: "+4.6%",
    sharpe: "1.84",
  },
  "1Y": {
    labels: ["Oct", "Dec", "Feb", "Apr", "Jun", "Aug", "Sep"],
    portfolio: [100, 105.2, 108.4, 112.0, 116.8, 121.4, 126.5],
    benchmark: [100, 103.0, 105.1, 107.8, 111.2, 114.6, 118.2],
    alpha: "+8.3%",
    sharpe: "1.79",
  },
  YTD: {
    labels: ["Jan", "Mar", "May", "Jul", "Sep"],
    portfolio: [100, 104.5, 107.8, 112.2, 115.8],
    benchmark: [100, 102.1, 104.8, 108.0, 110.6],
    alpha: "+5.2%",
    sharpe: "1.88",
  },
};

export const PortfolioTrajectoryChart: React.FC<PortfolioTrajectoryChartProps> = ({
  theme,
  totalAum,
  onViewAttribution,
}) => {
  const [period, setPeriod] = useState<Period>("6M");
  const data = TRAJECTORY_DATA[period];

  const minVal = Math.min(...data.portfolio, ...data.benchmark) - 1;
  const maxVal = Math.max(...data.portfolio, ...data.benchmark) + 1;
  const range = maxVal - minVal || 1;

  const isDark =
    theme.colors.background === "#030712" ||
    theme.colors.textPrimary === "#ffffff" ||
    theme.colors.textPrimary === "#FFFFFF";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.card || 14,
          ...theme.shadows.card,
        },
      ]}
    >
      {/* Header with Title & Range Switcher */}
      <View style={styles.headerRow}>
        <View>
          <View style={styles.titleWithBadge}>
            <Ionicons name="trending-up" size={16} color={theme.colors.brand} />
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              Portfolio Trajectory & Benchmark Alpha
            </Text>
            <View
              style={[
                styles.alphaBadge,
                { backgroundColor: theme.colors.successSoft, borderColor: theme.colors.success },
              ]}
            >
              <Text style={[styles.alphaText, { color: theme.colors.success }]}>
                Alpha {data.alpha}
              </Text>
            </View>
          </View>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Aggregate client AUM vs Blended Balanced 65/35 Benchmark
          </Text>
        </View>

        <View
          style={[
            styles.periodSelector,
            { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
          ]}
        >
          {(["3M", "6M", "1Y", "YTD"] as Period[]).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={[
                styles.periodBtn,
                period === p && { backgroundColor: theme.colors.brand },
              ]}
            >
              <Text
                style={[
                  styles.periodBtnText,
                  {
                    color: period === p ? "#000000" : theme.colors.textSecondary,
                    fontWeight: period === p ? "800" : "600",
                  },
                ]}
              >
                {p}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Trajectory Visual Bars / Sparkline Grid */}
      <View style={styles.chartArea}>
        <View style={styles.barsContainer}>
          {data.labels.map((lbl, idx) => {
            const pVal = data.portfolio[idx];
            const bVal = data.benchmark[idx];
            const pHeight = Math.round(((pVal - minVal) / range) * 90) + 10;
            const bHeight = Math.round(((bVal - minVal) / range) * 90) + 10;

            return (
              <View key={lbl} style={styles.barColumn}>
                <View style={styles.barsPair}>
                  {/* Portfolio Bar */}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: pHeight,
                        backgroundColor: theme.colors.brand,
                      },
                    ]}
                  />
                  {/* Benchmark Bar */}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: bHeight,
                        backgroundColor: isDark ? "rgba(148, 163, 184, 0.35)" : "rgba(100, 116, 139, 0.3)",
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: theme.colors.textMuted }]}>
                  {lbl}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Footer Metrics & Deep-Link */}
      <View style={[styles.footerRow, { borderTopColor: theme.colors.border }]}>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.brand }]} />
            <Text style={[styles.legendText, { color: theme.colors.textPrimary }]}>
              Desk Aggregate (+{((data.portfolio[data.portfolio.length - 1] - 100)).toFixed(1)}%)
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: isDark ? "rgba(148, 163, 184, 0.45)" : "rgba(100, 116, 139, 0.4)" },
              ]}
            />
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
              Blended Benchmark (+{((data.benchmark[data.benchmark.length - 1] - 100)).toFixed(1)}%)
            </Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={[styles.sharpeText, { color: theme.colors.textMuted }]}>
              Sharpe Ratio: <Text style={{ color: theme.colors.textPrimary, fontWeight: "700" }}>{data.sharpe}</Text>
            </Text>
          </View>
        </View>

        {onViewAttribution && (
          <Pressable onPress={onViewAttribution} style={styles.attributionLink}>
            <Text style={[styles.attributionLinkText, { color: theme.colors.brand }]}>
              Factor Attribution →
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 14,
  },
  titleWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  alphaBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  alphaText: {
    fontSize: 11,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  periodSelector: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
  },
  periodBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  periodBtnText: {
    fontSize: 11,
  },
  chartArea: {
    height: 120,
    justifyContent: "flex-end",
    paddingTop: 10,
    paddingBottom: 4,
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: 100,
  },
  barColumn: {
    alignItems: "center",
    flex: 1,
  },
  barsPair: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    height: 80,
  },
  bar: {
    width: 10,
    borderRadius: 3,
  },
  barLabel: {
    fontSize: 10,
    marginTop: 6,
    fontWeight: "600",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
    flexWrap: "wrap",
    gap: 10,
  },
  legendContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 14,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: "600",
  },
  sharpeText: {
    fontSize: 11,
  },
  attributionLink: {
    paddingVertical: 2,
  },
  attributionLinkText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
