import React, { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppTheme } from "../../theme";
import {
  MonteCarloConfig,
  MonteCarloResult,
  runMonteCarloSimulation,
} from "../../services/monteCarlo";

export interface MonteCarloModalProps {
  visible: boolean;
  onClose: () => void;
  theme: AppTheme;
  initialCapital?: number;
  monthlyContribution?: number;
  years?: number;
  targetCorpus?: number;
  clientName?: string;
}

export const MonteCarloModal: React.FC<MonteCarloModalProps> = ({
  visible,
  onClose,
  theme,
  initialCapital: defaultInit = 2500000,
  monthlyContribution: defaultMonthly = 100000,
  years: defaultYears = 15,
  targetCorpus: defaultTarget = 100000000, // 10 Cr
  clientName = "Client Portfolio",
}) => {
  const isDark =
    theme.colors.background === "#030712" ||
    theme.colors.textPrimary === "#ffffff" ||
    theme.colors.textPrimary === "#FFFFFF";

  const brandColor = theme.colors.brand || "#E0A84C";

  // Form State
  const [initialCapital, setInitialCapital] = useState<number>(defaultInit);
  const [monthlyContribution, setMonthlyContribution] =
    useState<number>(defaultMonthly);
  const [years, setYears] = useState<number>(defaultYears);
  const [targetCorpus, setTargetCorpus] = useState<number>(defaultTarget);
  const [expectedReturn, setExpectedReturn] = useState<number>(12); // in %
  const [volatility, setVolatility] = useState<number>(15); // in %
  const [adjustInflation, setAdjustInflation] = useState<boolean>(false);

  const [chartWidth, setChartWidth] = useState<number>(560);

  const simResult: MonteCarloResult = useMemo(() => {
    return runMonteCarloSimulation({
      initialCapital,
      monthlyContribution,
      years,
      targetCorpus,
      expectedAnnualReturn: expectedReturn / 100,
      annualVolatility: volatility / 100,
      inflationRate: 0.05,
      adjustForInflation: adjustInflation,
      numSimulations: 1000,
    });
  }, [
    initialCapital,
    monthlyContribution,
    years,
    targetCorpus,
    expectedReturn,
    volatility,
    adjustInflation,
  ]);

  const formatCr = (amount: number) => {
    const cr = amount / 10000000;
    if (cr >= 1) return `₹${cr.toFixed(2)} Cr`;
    const l = amount / 100000;
    return `₹${l.toFixed(1)} L`;
  };

  const getProbabilityColor = (prob: number) => {
    if (prob >= 85) return "#10B981"; // Emerald
    if (prob >= 65) return "#34D399";
    if (prob >= 45) return "#F59E0B"; // Amber
    return "#EF4444"; // Crimson
  };

  // SVG Chart Dimensions
  const chartHeight = 220;
  const paddingX = 40;
  const paddingTop = 20;
  const paddingBottom = 30;
  const usableHeight = chartHeight - paddingTop - paddingBottom;
  const usableWidth = Math.max(100, chartWidth - paddingX * 2);

  // Determine scaling
  const maxSimVal = Math.max(
    simResult.p90TerminalWealth,
    targetCorpus * 1.15,
    1000000
  );

  const getX = (year: number) => paddingX + (year / years) * usableWidth;
  const getY = (val: number) =>
    paddingTop + usableHeight - (Math.min(val, maxSimVal) / maxSimVal) * usableHeight;

  // Build polygon areas for confidence fan
  const p10_p90_Area = useMemo(() => {
    if (simResult.trajectory.length === 0) return "";
    const pts = simResult.trajectory;
    let forward = `M ${getX(pts[0].year)},${getY(pts[0].p90)}`;
    for (let i = 1; i < pts.length; i++) {
      forward += ` L ${getX(pts[i].year)},${getY(pts[i].p90)}`;
    }
    let backward = "";
    for (let i = pts.length - 1; i >= 0; i--) {
      backward += ` L ${getX(pts[i].year)},${getY(pts[i].p10)}`;
    }
    return `${forward} ${backward} Z`;
  }, [simResult.trajectory, usableWidth, maxSimVal]);

  const p25_p75_Area = useMemo(() => {
    if (simResult.trajectory.length === 0) return "";
    const pts = simResult.trajectory;
    let forward = `M ${getX(pts[0].year)},${getY(pts[0].p75)}`;
    for (let i = 1; i < pts.length; i++) {
      forward += ` L ${getX(pts[i].year)},${getY(pts[i].p75)}`;
    }
    let backward = "";
    for (let i = pts.length - 1; i >= 0; i--) {
      backward += ` L ${getX(pts[i].year)},${getY(pts[i].p25)}`;
    }
    return `${forward} ${backward} Z`;
  }, [simResult.trajectory, usableWidth, maxSimVal]);

  const medianLine = useMemo(() => {
    if (simResult.trajectory.length === 0) return "";
    return simResult.trajectory.reduce((acc, pt, idx) => {
      return idx === 0
        ? `M ${getX(pt.year)},${getY(pt.p50)}`
        : `${acc} L ${getX(pt.year)},${getY(pt.p50)}`;
    }, "");
  }, [simResult.trajectory, usableWidth, maxSimVal]);

  const targetY = getY(targetCorpus);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: isDark ? "#070D1B" : "#FFFFFF",
              borderColor: isDark
                ? "rgba(224, 168, 76, 0.35)"
                : "rgba(179, 126, 40, 0.35)",
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View
                style={[
                  styles.tagBadge,
                  {
                    backgroundColor: isDark
                      ? "rgba(224, 168, 76, 0.15)"
                      : "rgba(179, 126, 40, 0.15)",
                    borderColor: isDark
                      ? "rgba(224, 168, 76, 0.3)"
                      : "rgba(179, 126, 40, 0.3)",
                  },
                ]}
              >
                <Text style={[styles.tagText, { color: brandColor }]}>
                  STOCHASTIC WEALTH MODELING
                </Text>
              </View>
              <Text
                style={[
                  styles.title,
                  { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                ]}
              >
                Monte Carlo Goal Probability Simulator
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: isDark ? "#94A3B8" : theme.colors.textSecondary },
                ]}
              >
                1,000 randomized market paths with stochastic volatility for {clientName}.
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.06)"
                    : "rgba(15, 23, 42, 0.06)",
                },
              ]}
            >
              <Text
                style={[
                  styles.closeBtnText,
                  { color: isDark ? "#94A3B8" : theme.colors.textSecondary },
                ]}
              >
                ✕
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Probability KPI Banner */}
            <View
              style={[
                styles.probBanner,
                {
                  backgroundColor: isDark
                    ? "rgba(11, 19, 38, 0.85)"
                    : "rgba(248, 250, 252, 0.95)",
                  borderColor: getProbabilityColor(simResult.successProbability),
                },
              ]}
            >
              <View>
                <Text
                  style={[
                    styles.probLabel,
                    { color: isDark ? "#94A3B8" : theme.colors.textSecondary },
                  ]}
                >
                  EMPIRICAL PROBABILITY OF REACHING {formatCr(targetCorpus)}
                </Text>
                <Text
                  style={[
                    styles.probValue,
                    { color: getProbabilityColor(simResult.successProbability) },
                  ]}
                >
                  {simResult.successProbability.toFixed(1)}%
                </Text>
                <Text
                  style={[
                    styles.probSubtext,
                    { color: isDark ? "#64748B" : theme.colors.textMuted },
                  ]}
                >
                  {simResult.targetMetYear !== null
                    ? `Estimated median target achievement by Year ${simResult.targetMetYear}`
                    : `Target not achieved by median run within ${years} years`}
                </Text>
              </View>

              <View style={styles.metricTrio}>
                <View style={styles.miniMetric}>
                  <Text style={styles.miniLabel}>BEAR (10th %)</Text>
                  <Text style={[styles.miniVal, { color: "#EF4444" }]}>
                    {formatCr(simResult.p10TerminalWealth)}
                  </Text>
                </View>
                <View style={styles.miniMetric}>
                  <Text style={styles.miniLabel}>MEDIAN (50th %)</Text>
                  <Text style={[styles.miniVal, { color: brandColor }]}>
                    {formatCr(simResult.medianTerminalWealth)}
                  </Text>
                </View>
                <View style={styles.miniMetric}>
                  <Text style={styles.miniLabel}>BULL (90th %)</Text>
                  <Text style={[styles.miniVal, { color: "#10B981" }]}>
                    {formatCr(simResult.p90TerminalWealth)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Stochastic Fan Chart */}
            <View
              style={[
                styles.chartCard,
                {
                  backgroundColor: isDark
                    ? "rgba(11, 19, 38, 0.75)"
                    : "#FFFFFF",
                  borderColor: isDark
                    ? "rgba(224, 168, 76, 0.22)"
                    : "rgba(179, 126, 40, 0.25)",
                },
              ]}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 100 && w !== chartWidth) setChartWidth(w);
              }}
            >
              <View style={styles.chartHeaderRow}>
                <Text
                  style={[
                    styles.chartCardTitle,
                    { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                  ]}
                >
                  Stochastic Fan Chart (10th – 90th Percentile Dispersion)
                </Text>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendColorBox,
                        { backgroundColor: "rgba(224, 168, 76, 0.15)" },
                      ]}
                    />
                    <Text style={styles.legendLabel}>10th-90th Band</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendColorBox,
                        { backgroundColor: brandColor, height: 2 },
                      ]}
                    />
                    <Text style={styles.legendLabel}>Median</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendColorBox,
                        { backgroundColor: "#EF4444", height: 2 },
                      ]}
                    />
                    <Text style={styles.legendLabel}>Target Corpus</Text>
                  </View>
                </View>
              </View>

              {Platform.OS === "web" ? (
                // @ts-ignore
                <svg
                  width="100%"
                  height={chartHeight}
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  style={{ display: "block" }}
                >
                  <defs>
                    {/* @ts-ignore */}
                    <linearGradient id="outerFan" x1="0" y1="0" x2="0" y2="1">
                      {/* @ts-ignore */}
                      <stop offset="0%" stopColor={brandColor} stopOpacity="0.25" />
                      {/* @ts-ignore */}
                      <stop offset="100%" stopColor={brandColor} stopOpacity="0.06" />
                    </linearGradient>
                    {/* @ts-ignore */}
                    <linearGradient id="innerFan" x1="0" y1="0" x2="0" y2="1">
                      {/* @ts-ignore */}
                      <stop offset="0%" stopColor={brandColor} stopOpacity="0.38" />
                      {/* @ts-ignore */}
                      <stop offset="100%" stopColor={brandColor} stopOpacity="0.15" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
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
                      />
                    );
                  })}

                  {/* Outer Fan Area (10% to 90%) */}
                  {/* @ts-ignore */}
                  <path d={p10_p90_Area} fill="url(#outerFan)" />

                  {/* Inner Fan Area (25% to 75%) */}
                  {/* @ts-ignore */}
                  <path d={p25_p75_Area} fill="url(#innerFan)" />

                  {/* Sample Stochastic Paths */}
                  {simResult.sampleRuns.map((run, rIdx) => {
                    let d = `M ${getX(0)},${getY(run[0])}`;
                    for (let yr = 1; yr < run.length; yr++) {
                      d += ` L ${getX(yr)},${getY(run[yr])}`;
                    }
                    return (
                      // @ts-ignore
                      <path
                        key={`sample-${rIdx}`}
                        d={d}
                        fill="none"
                        stroke={brandColor}
                        strokeOpacity="0.25"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Median Line */}
                  {/* @ts-ignore */}
                  <path
                    d={medianLine}
                    fill="none"
                    stroke={brandColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Target Corpus Goal Line */}
                  {targetY >= paddingTop && targetY <= paddingTop + usableHeight && (
                    // @ts-ignore
                    <g>
                      {/* @ts-ignore */}
                      <line
                        x1={paddingX}
                        y1={targetY}
                        x2={chartWidth - paddingX}
                        y2={targetY}
                        stroke="#EF4444"
                        strokeWidth="1.75"
                        strokeDasharray="5 4"
                      />
                      {/* @ts-ignore */}
                      <text
                        x={chartWidth - paddingX - 4}
                        y={targetY - 5}
                        fill="#EF4444"
                        fontSize="10"
                        fontWeight="700"
                        textAnchor="end"
                      >
                        Target {formatCr(targetCorpus)}
                      </text>
                    </g>
                  )}

                  {/* X Axis Labels */}
                  {[0, Math.floor(years / 2), years].map((yr) => (
                    // @ts-ignore
                    <text
                      key={`axis-${yr}`}
                      x={getX(yr)}
                      y={chartHeight - 8}
                      fill={isDark ? "#94A3B8" : theme.colors.textSecondary}
                      fontSize="10"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      Yr {yr}
                    </text>
                  ))}
                </svg>
              ) : (
                <View style={styles.mobileFallbackBox}>
                  <Text style={{ color: brandColor, fontWeight: "700" }}>
                    Median Terminal: {formatCr(simResult.medianTerminalWealth)}
                  </Text>
                  <Text style={{ color: "#94A3B8", fontSize: 12, marginTop: 4 }}>
                    Simulation completed for {years} years.
                  </Text>
                </View>
              )}
            </View>

            {/* Interactive Simulation Controls */}
            <View
              style={[
                styles.controlsCard,
                {
                  backgroundColor: isDark
                    ? "rgba(11, 19, 38, 0.75)"
                    : "#FFFFFF",
                  borderColor: isDark
                    ? "rgba(224, 168, 76, 0.22)"
                    : "rgba(179, 126, 40, 0.25)",
                },
              ]}
            >
              <Text
                style={[
                  styles.controlsTitle,
                  { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                ]}
              >
                Simulation Parameters & Capital Assumptions
              </Text>

              <View style={styles.inputGrid}>
                <View style={styles.inputCol}>
                  <Text
                    style={[
                      styles.inputLabel,
                      { color: isDark ? "#94A3B8" : theme.colors.textSecondary },
                    ]}
                  >
                    Current Capital (₹)
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        color: isDark ? "#F8FAFC" : theme.colors.textPrimary,
                        backgroundColor: isDark
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(15, 23, 42, 0.04)",
                        borderColor: isDark
                          ? "rgba(255, 255, 255, 0.12)"
                          : "rgba(15, 23, 42, 0.12)",
                      },
                    ]}
                    value={initialCapital.toString()}
                    keyboardType="numeric"
                    onChangeText={(t) => setInitialCapital(Number(t) || 0)}
                  />
                </View>

                <View style={styles.inputCol}>
                  <Text
                    style={[
                      styles.inputLabel,
                      { color: isDark ? "#94A3B8" : theme.colors.textSecondary },
                    ]}
                  >
                    Monthly SIP (₹)
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        color: isDark ? "#F8FAFC" : theme.colors.textPrimary,
                        backgroundColor: isDark
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(15, 23, 42, 0.04)",
                        borderColor: isDark
                          ? "rgba(255, 255, 255, 0.12)"
                          : "rgba(15, 23, 42, 0.12)",
                      },
                    ]}
                    value={monthlyContribution.toString()}
                    keyboardType="numeric"
                    onChangeText={(t) => setMonthlyContribution(Number(t) || 0)}
                  />
                </View>
              </View>

              <View style={styles.inputGrid}>
                <View style={styles.inputCol}>
                  <Text
                    style={[
                      styles.inputLabel,
                      { color: isDark ? "#94A3B8" : theme.colors.textSecondary },
                    ]}
                  >
                    Horizon (Years)
                  </Text>
                  <View style={styles.pillRow}>
                    {[5, 10, 15, 20, 25].map((y) => (
                      <Pressable
                        key={y}
                        onPress={() => setYears(y)}
                        style={[
                          styles.pillBtn,
                          years === y && {
                            backgroundColor: brandColor,
                            borderColor: brandColor,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            years === y && { color: "#030712", fontWeight: "800" },
                          ]}
                        >
                          {y}Y
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.inputCol}>
                  <Text
                    style={[
                      styles.inputLabel,
                      { color: isDark ? "#94A3B8" : theme.colors.textSecondary },
                    ]}
                  >
                    Target Goal (₹)
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        color: isDark ? "#F8FAFC" : theme.colors.textPrimary,
                        backgroundColor: isDark
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(15, 23, 42, 0.04)",
                        borderColor: isDark
                          ? "rgba(255, 255, 255, 0.12)"
                          : "rgba(15, 23, 42, 0.12)",
                      },
                    ]}
                    value={targetCorpus.toString()}
                    keyboardType="numeric"
                    onChangeText={(t) => setTargetCorpus(Number(t) || 0)}
                  />
                </View>
              </View>

              {/* Advanced toggles */}
              <View style={styles.advancedRow}>
                <Pressable
                  onPress={() => setAdjustInflation(!adjustInflation)}
                  style={[
                    styles.toggleBtn,
                    adjustInflation && {
                      backgroundColor: isDark
                        ? "rgba(224, 168, 76, 0.2)"
                        : "rgba(179, 126, 40, 0.15)",
                      borderColor: brandColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      adjustInflation && { color: brandColor, fontWeight: "700" },
                    ]}
                  >
                    {adjustInflation ? "✓ Inflation-Adjusted (5% p.a.)" : "+ Adjust for Inflation"}
                  </Text>
                </Pressable>

                <View style={styles.sliderPresetWrap}>
                  <Text style={styles.presetLabel}>
                    Expected Return: <Text style={{ color: brandColor, fontWeight: "800" }}>{expectedReturn}%</Text> | Volatility: <Text style={{ color: brandColor, fontWeight: "800" }}>{volatility}%</Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* Fiduciary Advisory Takeaway */}
            <View
              style={[
                styles.advisoryCard,
                {
                  backgroundColor: isDark
                    ? "rgba(224, 168, 76, 0.06)"
                    : "rgba(179, 126, 40, 0.06)",
                  borderColor: isDark
                    ? "rgba(224, 168, 76, 0.25)"
                    : "rgba(179, 126, 40, 0.25)",
                },
              ]}
            >
              <Text style={[styles.advisoryHeader, { color: brandColor }]}>
                WEALTH MANAGEMENT TAKEAWAY
              </Text>
              <Text
                style={[
                  styles.advisoryBody,
                  { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                ]}
              >
                With an aggregate principal commitment of {formatCr(simResult.totalContributions)}, your client has an empirical {simResult.successProbability.toFixed(1)}% probability of exceeding the {formatCr(targetCorpus)} milestone. In a severe tail-risk bear market (10th percentile), terminal wealth is modeled at {formatCr(simResult.p10TerminalWealth)}.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(15, 23, 42, 0.08)",
              },
            ]}
          >
            <Pressable
              onPress={onClose}
              style={[styles.doneBtn, { backgroundColor: brandColor }]}
            >
              <Text style={styles.doneBtnText}>Close Monte Carlo Simulator</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(3, 7, 18, 0.82)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  dialog: {
    width: "100%",
    maxWidth: 860,
    maxHeight: "92%",
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  tagBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  scrollArea: {
    flex: 1,
  },
  probBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  probLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  probValue: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginVertical: 2,
  },
  probSubtext: {
    fontSize: 11,
    fontWeight: "600",
  },
  metricTrio: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  miniMetric: {
    alignItems: "flex-end",
  },
  miniLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  miniVal: {
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },
  chartCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  chartHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  chartCardTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  legendRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendColorBox: {
    width: 12,
    height: 10,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94A3B8",
  },
  mobileFallbackBox: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  controlsCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  controlsTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
  },
  inputGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  inputCol: {
    flex: 1,
    minWidth: 180,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: "600",
  },
  pillRow: {
    flexDirection: "row",
    gap: 6,
  },
  pillBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  pillText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "700",
  },
  advancedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  toggleText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  sliderPresetWrap: {
    alignItems: "flex-end",
  },
  presetLabel: {
    fontSize: 11,
    color: "#94A3B8",
  },
  advisoryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  advisoryHeader: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  advisoryBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  doneBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  doneBtnText: {
    color: "#030712",
    fontSize: 14,
    fontWeight: "800",
  },
});
