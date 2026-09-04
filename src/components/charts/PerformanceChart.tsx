import React, { useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppTheme } from "../../theme";

export type ChartPeriod = "1M" | "3M" | "YTD" | "1Y" | "ALL";

export interface DataPoint {
  date: string;
  value: number;
}

export interface PerformanceChartProps {
  theme: AppTheme;
  title?: string;
  subtitle?: string;
  dataByPeriod?: Record<ChartPeriod, DataPoint[]>;
  initialPeriod?: ChartPeriod;
  currencyPrefix?: string;
  onPeriodChange?: (period: ChartPeriod) => void;
}

const DEFAULT_SERIES: Record<ChartPeriod, DataPoint[]> = {
  "1M": [
    { date: "Aug 05", value: 168.4 },
    { date: "Aug 10", value: 170.2 },
    { date: "Aug 15", value: 169.8 },
    { date: "Aug 20", value: 173.5 },
    { date: "Aug 25", value: 177.1 },
    { date: "Aug 30", value: 179.8 },
    { date: "Sep 04", value: 184.2 },
  ],
  "3M": [
    { date: "Jun 01", value: 154.2 },
    { date: "Jun 15", value: 158.9 },
    { date: "Jul 01", value: 162.4 },
    { date: "Jul 15", value: 167.1 },
    { date: "Aug 01", value: 171.3 },
    { date: "Aug 15", value: 176.8 },
    { date: "Sep 04", value: 184.2 },
  ],
  YTD: [
    { date: "Jan 01", value: 142.0 },
    { date: "Feb 15", value: 148.5 },
    { date: "Apr 01", value: 155.1 },
    { date: "May 15", value: 161.4 },
    { date: "Jul 01", value: 168.2 },
    { date: "Aug 15", value: 177.0 },
    { date: "Sep 04", value: 184.2 },
  ],
  "1Y": [
    { date: "Sep '23", value: 132.5 },
    { date: "Nov '23", value: 139.1 },
    { date: "Jan '24", value: 146.4 },
    { date: "Mar '24", value: 153.2 },
    { date: "May '24", value: 162.7 },
    { date: "Jul '24", value: 172.9 },
    { date: "Sep '24", value: 184.2 },
  ],
  ALL: [
    { date: "2021", value: 85.0 },
    { date: "2022", value: 104.2 },
    { date: "2023", value: 132.5 },
    { date: "2024", value: 184.2 },
  ],
};

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  theme,
  title = "AUM Performance Velocity",
  subtitle = "Consolidated discretionary & non-discretionary assets",
  dataByPeriod = DEFAULT_SERIES,
  initialPeriod = "YTD",
  currencyPrefix = "₹",
  onPeriodChange,
}) => {
  const [period, setPeriod] = useState<ChartPeriod>(initialPeriod);
  const [chartWidth, setChartWidth] = useState<number>(600);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const series = useMemo(() => dataByPeriod[period] || DEFAULT_SERIES[period], [
    dataByPeriod,
    period,
  ]);

  const height = 180;
  const paddingX = 16;
  const paddingTop = 20;
  const paddingBottom = 26;
  const usableHeight = height - paddingTop - paddingBottom;

  const minVal = useMemo(() => Math.min(...series.map((p) => p.value)), [series]);
  const maxVal = useMemo(() => Math.max(...series.map((p) => p.value)), [series]);
  const valRange = maxVal - minVal || 1;

  const startVal = series[0]?.value || 0;
  const endVal = series[series.length - 1]?.value || 0;
  const deltaVal = endVal - startVal;
  const deltaPercent = startVal > 0 ? (deltaVal / startVal) * 100 : 0;
  const isPositive = deltaVal >= 0;

  const activePoint = hoverIndex !== null && series[hoverIndex] ? series[hoverIndex] : null;
  const displayVal = activePoint ? activePoint.value : endVal;
  const displayDate = activePoint ? activePoint.date : `Current • ${period}`;

  // Calculate coordinates
  const points = useMemo(() => {
    const step = (chartWidth - paddingX * 2) / Math.max(1, series.length - 1);
    return series.map((pt, idx) => ({
      x: paddingX + idx * step,
      y: paddingTop + usableHeight - ((pt.value - minVal) / valRange) * usableHeight,
      date: pt.date,
      value: pt.value,
    }));
  }, [chartWidth, minVal, series, usableHeight, valRange]);

  // Build SVG path with smooth cubic control points
  const pathData = useMemo(() => {
    if (points.length === 0) return "";
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx},${p0.y} ${cx},${p1.y} ${p1.x},${p1.y}`;
    }
    return d;
  }, [points]);

  const fillData = useMemo(() => {
    if (points.length === 0) return "";
    const last = points[points.length - 1];
    const first = points[0];
    return `${pathData} L ${last.x},${height - paddingBottom} L ${first.x},${height - paddingBottom} Z`;
  }, [height, paddingBottom, pathData, points]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 50 && w !== chartWidth) {
      setChartWidth(w);
    }
  };

  const handlePeriodSelect = (p: ChartPeriod) => {
    setPeriod(p);
    setHoverIndex(null);
    if (onPeriodChange) onPeriodChange(p);
  };

  const isDark =
    theme.colors.background === "#030712" ||
    theme.colors.textPrimary === "#ffffff" ||
    theme.colors.textPrimary === "#FFFFFF";

  const brandColor = theme.colors.brand || "#E0A84C";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "rgba(11, 19, 38, 0.75)" : "#FFFFFF",
          borderColor: isDark ? "rgba(224, 168, 76, 0.22)" : "rgba(179, 126, 40, 0.25)",
        },
      ]}
    >
      {/* Header with Title, Live AUM, and Delta Badge */}
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <Text style={[styles.title, { color: isDark ? "#F8FAFC" : theme.colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: isDark ? "#94A3B8" : theme.colors.textSecondary }]}>{subtitle}</Text>
        </View>

        {/* Period Selector Tabs */}
        <View
          style={[
            styles.periodTabs,
            {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(15, 23, 42, 0.05)",
            },
          ]}
        >
          {(["1M", "3M", "YTD", "1Y", "ALL"] as ChartPeriod[]).map((p) => (
            <Pressable
              key={p}
              onPress={() => handlePeriodSelect(p)}
              style={[
                styles.tab,
                period === p && {
                  backgroundColor: isDark
                    ? "rgba(224, 168, 76, 0.25)"
                    : "rgba(179, 126, 40, 0.18)",
                  borderWidth: 1,
                  borderColor: isDark
                    ? "rgba(224, 168, 76, 0.45)"
                    : "rgba(179, 126, 40, 0.45)",
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isDark ? "#94A3B8" : theme.colors.textSecondary },
                  period === p && {
                    color: isDark ? "#F8FAFC" : theme.colors.brandStrong,
                    fontWeight: "800",
                  },
                ]}
              >
                {p}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Metric Value & Performance Badge */}
      <View style={styles.metricRow}>
        <View style={styles.valuationRow}>
          <Text style={[styles.currencyPrefix, { color: brandColor }]}>{currencyPrefix}</Text>
          <Text style={[styles.valuationValue, { color: isDark ? "#F8FAFC" : theme.colors.textPrimary }]}>
            {displayVal.toFixed(2)}
          </Text>
          <Text style={[styles.denominationLabel, { color: isDark ? "#94A3B8" : theme.colors.textSecondary }]}>
            Cr
          </Text>
        </View>

        <View
          style={[
            styles.deltaBadge,
            isPositive ? styles.deltaBadgePos : styles.deltaBadgeNeg,
          ]}
        >
          <Text
            style={[
              styles.deltaText,
              isPositive ? styles.deltaTextPos : styles.deltaTextNeg,
            ]}
          >
            {isPositive ? "▲" : "▼"} {Math.abs(deltaPercent).toFixed(1)}% (
            {isPositive ? "+" : "-"}
            {currencyPrefix}
            {Math.abs(deltaVal).toFixed(2)} Cr)
          </Text>
        </View>

        <Text style={[styles.scrubDateText, { color: isDark ? "#64748B" : theme.colors.textMuted }]}>
          {displayDate}
        </Text>
      </View>

      {/* SVG Interactive Canvas */}
      <View style={styles.chartContainer} onLayout={handleLayout}>
        {Platform.OS === "web" ? (
          // @ts-ignore
          <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${chartWidth} ${height}`}
            style={{ display: "block", overflow: "visible" }}
            onMouseLeave={() => setHoverIndex(null)}
            onMouseMove={(e: any) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              let closestIdx = 0;
              let closestDist = Infinity;
              points.forEach((pt, idx) => {
                const dist = Math.abs(pt.x - mouseX);
                if (dist < closestDist) {
                  closestDist = dist;
                  closestIdx = idx;
                }
              });
              setHoverIndex(closestIdx);
            }}
          >
            <defs>
              {/* @ts-ignore */}
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                {/* @ts-ignore */}
                <stop offset="0%" stopColor={brandColor} stopOpacity={isDark ? "0.35" : "0.22"} />
                {/* @ts-ignore */}
                <stop offset="70%" stopColor={brandColor} stopOpacity={isDark ? "0.05" : "0.03"} />
                {/* @ts-ignore */}
                <stop offset="100%" stopColor={isDark ? "#030712" : "#FFFFFF"} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Subtle Horizontal Grid lines */}
            {[0.25, 0.5, 0.75].map((pct, idx) => {
              const yPos = paddingTop + usableHeight * pct;
              return (
                // @ts-ignore
                <line
                  key={`grid-${idx}`}
                  x1={paddingX}
                  y1={yPos}
                  x2={chartWidth - paddingX}
                  y2={yPos}
                  stroke={isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(15, 23, 42, 0.06)"}
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              );
            })}

            {/* Area Fill */}
            {/* @ts-ignore */}
            <path d={fillData} fill="url(#chartGradient)" />

            {/* Glowing Stroke Curve */}
            {/* @ts-ignore */}
            <path
              d={pathData}
              fill="none"
              stroke={brandColor}
              strokeWidth="2.75"
              strokeLinecap="round"
            />

            {/* Active Hover Scrub Hairline & Dot */}
            {hoverIndex !== null && points[hoverIndex] && (
              // @ts-ignore
              <g>
                {/* @ts-ignore */}
                <line
                  x1={points[hoverIndex].x}
                  y1={paddingTop}
                  x2={points[hoverIndex].x}
                  y2={height - paddingBottom}
                  stroke={brandColor}
                  strokeOpacity="0.65"
                  strokeDasharray="3 3"
                  strokeWidth="1.5"
                />
                {/* @ts-ignore */}
                <circle
                  cx={points[hoverIndex].x}
                  cy={points[hoverIndex].y}
                  r="6"
                  fill={isDark ? "#030712" : "#FFFFFF"}
                  stroke={brandColor}
                  strokeWidth="2.5"
                />
              </g>
            )}

            {/* X-Axis Date Labels */}
            {points.map((pt, idx) => (
              // @ts-ignore
              <text
                key={`label-${idx}`}
                x={pt.x}
                y={height - 6}
                fill={isDark ? "rgba(148, 163, 184, 0.75)" : "#64748B"}
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
              >
                {pt.date}
              </text>
            ))}
          </svg>
        ) : (
          // Mobile Fallback Bar Graphic
          <View style={styles.mobileFallback}>
            {points.map((pt, idx) => (
              <View key={idx} style={styles.mobileBarCol}>
                <View
                  style={[
                    styles.mobileBar,
                    {
                      height: Math.max(10, height - pt.y - paddingBottom),
                      backgroundColor:
                        hoverIndex === idx ? brandColor : isDark ? "rgba(224, 168, 76, 0.65)" : "rgba(179, 126, 40, 0.65)",
                    },
                  ]}
                />
                <Text style={styles.mobileDate}>{pt.date}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(11, 19, 38, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(224, 168, 76, 0.22)",
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  headerTitles: {
    flex: 1,
    minWidth: 200,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  periodTabs: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    padding: 3,
    gap: 2,
  },
  tab: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: "rgba(224, 168, 76, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(224, 168, 76, 0.45)",
  },
  tabText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
  },
  tabTextActive: {
    color: "#F8FAFC",
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    marginTop: 6,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  valuationRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: "800",
    color: "#E0A84C",
    marginRight: 2,
  },
  valuationValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#F8FAFC",
    letterSpacing: -0.5,
  },
  denominationLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#94A3B8",
    marginLeft: 4,
  },
  deltaBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  deltaBadgePos: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.35)",
  },
  deltaBadgeNeg: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
  },
  deltaText: {
    fontSize: 11,
    fontWeight: "800",
  },
  deltaTextPos: {
    color: "#10B981",
  },
  deltaTextNeg: {
    color: "#EF4444",
  },
  scrubDateText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    marginLeft: "auto",
  },
  chartContainer: {
    width: "100%",
    height: 180,
    marginTop: 4,
  },
  mobileFallback: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  mobileBarCol: {
    alignItems: "center",
    gap: 6,
  },
  mobileBar: {
    width: 20,
    borderRadius: 4,
  },
  mobileDate: {
    fontSize: 9,
    color: "#64748B",
  },
});
