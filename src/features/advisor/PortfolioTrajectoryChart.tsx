/**
 * Portfolio Trajectory Chart
 * Renders the desk-level AUM trajectory strictly from genuine recorded
 * valuation history (real point-in-time AUM snapshots aggregated across
 * clients). No fabricated benchmark, no invented alpha/sharpe: the delta is
 * computed from the actual first/last point of the selected period, and an
 * honest empty state is shown until real history accumulates.
 */

import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppTheme } from "../../theme";
import { DataPoint } from "../../components/charts/PerformanceChart";

export interface PortfolioTrajectoryChartProps {
  theme: AppTheme;
  totalAum: number;
  dataByPeriod?: Partial<Record<TrajectoryPeriod, DataPoint[]>>;
  onViewAttribution?: () => void;
  formatCurrency?: (value: number) => string;
}

export type TrajectoryPeriod = "3M" | "6M" | "1Y" | "YTD";

const PERIODS: TrajectoryPeriod[] = ["3M", "6M", "1Y", "YTD"];

export const PortfolioTrajectoryChart: React.FC<PortfolioTrajectoryChartProps> = ({
  theme,
  totalAum,
  dataByPeriod,
  onViewAttribution,
  formatCurrency,
}) => {
  const [period, setPeriod] = useState<TrajectoryPeriod>("6M");

  const series = dataByPeriod?.[period] || [];
  const hasTrajectory = series.length >= 2;

  const { deltaPct, bars } = useMemo(() => {
    if (series.length < 2) {
      return { deltaPct: 0, bars: [] as { label: string; height: number }[] };
    }
    const first = series[0].value;
    const last = series[series.length - 1].value;
    const pct = first > 0 ? ((last - first) / first) * 100 : 0;

    const minVal = Math.min(...series.map((p) => p.value));
    const maxVal = Math.max(...series.map((p) => p.value));
    const range = maxVal - minVal || 1;

    const mapped = series.map((p) => ({
      label: p.date,
      height: Math.round(((p.value - minVal) / range) * 90) + 10,
    }));
    return { deltaPct: pct, bars: mapped };
  }, [series]);

  const isDark =
    theme.colors.background === "#030712" ||
    theme.colors.textPrimary === "#ffffff" ||
    theme.colors.textPrimary === "#FFFFFF";

  const aumLabel =
    formatCurrency?.(totalAum) ??
    (totalAum >= 10000000
      ? `₹${(totalAum / 10000000).toFixed(2)} Cr`
      : `₹${(totalAum / 100000).toFixed(2)} L`);

  const isPositive = deltaPct >= 0;

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
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.titleWithBadge}>
            <Ionicons name="trending-up" size={16} color={theme.colors.brand} />
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              Portfolio Trajectory
            </Text>
            {hasTrajectory && (
              <View
                style={[
                  styles.alphaBadge,
                  {
                    backgroundColor: isPositive ? theme.colors.successSoft : theme.colors.dangerSoft,
                    borderColor: isPositive ? theme.colors.success : theme.colors.danger,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.alphaText,
                    { color: isPositive ? theme.colors.success : theme.colors.danger },
                  ]}
                >
                  {isPositive ? "▲" : "▼"} {Math.abs(deltaPct).toFixed(1)}% {period}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Tracked AUM {aumLabel} · genuine recorded valuation history
          </Text>
        </View>

        <View
          style={[
            styles.periodSelector,
            { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
          ]}
        >
          {PERIODS.map((p) => (
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

      {/* Trajectory Visual Bars / Empty State */}
      <View style={styles.chartArea}>
        {hasTrajectory ? (
          <View style={styles.barsContainer}>
            {bars.map((bar, idx) => (
              <View key={`${bar.label}-${idx}`} style={styles.barColumn}>
                <View style={styles.barsPair}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: bar.height,
                        backgroundColor: theme.colors.brand,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: theme.colors.textMuted }]}>
                  {bar.label}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={26} color={theme.colors.textMuted} />
            <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
              No trajectory history recorded yet. As valuation events and Client 360 diagnostics are
              captured, the real desk AUM curve will appear here.
            </Text>
          </View>
        )}
      </View>

      {/* Footer Metrics & Deep-Link */}
      <View style={[styles.footerRow, { borderTopColor: theme.colors.border }]}>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.brand }]} />
            <Text style={[styles.legendText, { color: theme.colors.textPrimary }]}>
              Desk Aggregate
              {hasTrajectory ? ` (${isPositive ? "+" : ""}${deltaPct.toFixed(1)}% ${period})` : " · awaiting history"}
            </Text>
          </View>
          {hasTrajectory && (
            <View style={styles.legendItem}>
              <Text style={[styles.sharpeText, { color: theme.colors.textMuted }]}>
                Data points: <Text style={{ color: theme.colors.textPrimary, fontWeight: "700" }}>{series.length}</Text>
              </Text>
            </View>
          )}
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
    flexWrap: "wrap",
    rowGap: 6,
    columnGap: 8,
    alignItems: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
    flexShrink: 1,
    minWidth: 0,
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
    flex: 1,
    minWidth: 0,
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
  emptyState: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyStateText: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 17,
    flex: 1,
  },
  attributionLink: {
    paddingVertical: 2,
  },
  attributionLinkText: {
    fontSize: 12,
    fontWeight: "700",
  },
});