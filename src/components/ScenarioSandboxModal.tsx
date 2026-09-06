import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { simulateScenario, PRESET_SCENARIOS } from "../services/scenarioEngine";
import { PortfolioHolding, ScenarioShockParams } from "../types/wealth";
import { AppTheme } from "../theme";

interface ScenarioSandboxModalProps {
  visible: boolean;
  theme: AppTheme;
  holdings: PortfolioHolding[];
  portfolioName: string;
  onClose: () => void;
}

export const ScenarioSandboxModal: React.FC<ScenarioSandboxModalProps> = ({
  visible,
  theme,
  holdings,
  portfolioName,
  onClose,
}) => {
  const { colors } = theme;
  const [selectedPresetKey, setSelectedPresetKey] =
    useState<keyof typeof PRESET_SCENARIOS>("TECH_CORRECTION");
  const [customEquityShock, setCustomEquityShock] = useState<number | null>(null);

  const basePreset = PRESET_SCENARIOS[selectedPresetKey];
  const activeParams: ScenarioShockParams = {
    ...basePreset,
    equityShockPct:
      customEquityShock !== null ? customEquityShock : basePreset.equityShockPct,
  };

  const currentTotalValue = holdings.reduce(
    (sum, h) => sum + (parseFloat(h.currentValue) || 0),
    0
  );

  const result = simulateScenario(holdings, activeParams, portfolioName);
  const isPositive = result.percentChange >= 0;
  const changeColor = isPositive ? colors.accent : colors.danger;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                What-If Scenario Sandbox
              </Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                Macro Stress-Testing & Monte Carlo Risk • {portfolioName}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close-circle" size={26} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Scenario Preset Selector */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Macro Scenario Templates
            </Text>

            <View style={styles.presetGrid}>
              {Object.keys(PRESET_SCENARIOS).map((key) => {
                const p = PRESET_SCENARIOS[key as keyof typeof PRESET_SCENARIOS];
                const active = selectedPresetKey === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      setSelectedPresetKey(key as keyof typeof PRESET_SCENARIOS);
                      setCustomEquityShock(null);
                    }}
                    style={[
                      styles.presetCard,
                      {
                        backgroundColor: active ? colors.brand + "18" : colors.surfaceMuted,
                        borderColor: active ? colors.brand : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetName,
                        { color: active ? colors.brand : colors.textPrimary },
                      ]}
                    >
                      {p.name}
                    </Text>
                    <Text style={[styles.presetMeta, { color: colors.textMuted }]}>
                      Equity: {p.equityShockPct > 0 ? "+" : ""}
                      {p.equityShockPct}% • Yield: {p.debtYieldBps > 0 ? "+" : ""}
                      {p.debtYieldBps} bps
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Interactive Shock Steppers */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Tune Equity Index Shock ({activeParams.equityShockPct > 0 ? "+" : ""}
              {activeParams.equityShockPct}%)
            </Text>

            <View style={styles.stepperRow}>
              {[-35, -20, -10, 0, +10, +25].map((shock) => {
                const active = activeParams.equityShockPct === shock;
                return (
                  <Pressable
                    key={shock}
                    onPress={() => setCustomEquityShock(shock)}
                    style={[
                      styles.stepperBtn,
                      {
                        backgroundColor: active ? colors.brand : colors.surfaceMuted,
                        borderColor: active ? colors.brand : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepperText,
                        { color: active ? colors.textOnBrand : colors.textPrimary },
                      ]}
                    >
                      {shock > 0 ? "+" : ""}
                      {shock}%
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* CURRENT VS SCENARIO SIDE-BY-SIDE (Desktop) / STACK (Mobile) (Rule 53) */}
            <View
              style={[
                styles.heroCard,
                { backgroundColor: colors.backgroundMuted, borderColor: colors.border, borderRadius: 4 },
              ]}
            >
              <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <View style={{ flex: 1, minWidth: 120 }}>
                  <Text style={[styles.heroLabel, { color: colors.textMuted }]}>
                    CURRENT NAV
                  </Text>
                  <Text style={[styles.heroVal, { color: colors.textPrimary, fontSize: 18, fontVariant: ["tabular-nums"] }]}>
                    ₹{Math.round(currentTotalValue).toLocaleString("en-IN")}
                  </Text>
                </View>

                <View style={{ alignItems: "center", paddingHorizontal: 4 }}>
                  <Ionicons name="arrow-forward" size={16} color={colors.brand} />
                </View>

                <View style={{ flex: 1, minWidth: 120 }}>
                  <Text style={[styles.heroLabel, { color: colors.textMuted }]}>
                    PROJECTED NAV
                  </Text>
                  <Text style={[styles.heroVal, { color: colors.textPrimary, fontSize: 18, fontVariant: ["tabular-nums"] }]}>
                    ₹{result.projectedValue.toLocaleString("en-IN")}
                  </Text>
                </View>

                <View
                  style={[
                    styles.changeBadge,
                    {
                      backgroundColor: isPositive ? colors.accentSoft : colors.dangerSoft,
                      borderColor: changeColor,
                      borderRadius: 4,
                    },
                  ]}
                >
                  <Text style={[styles.changeText, { color: changeColor, fontVariant: ["tabular-nums"] }]}>
                    {isPositive ? "+" : ""}
                    {result.percentChange}%
                  </Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    Goal Attainment
                  </Text>
                  <Text
                    style={[
                      styles.statVal,
                      {
                        fontSize: 15,
                        fontWeight: "800",
                        fontVariant: ["tabular-nums"],
                        color:
                          result.goalSuccessProbability >= 75
                            ? colors.accent
                            : colors.warning,
                      },
                    ]}
                  >
                    {result.goalSuccessProbability}%
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    Post-Shock Sharpe
                  </Text>
                  <Text style={[styles.statVal, { color: colors.textPrimary, fontVariant: ["tabular-nums"] }]}>
                    {result.postShockSharpe}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    Implied Volatility
                  </Text>
                  <Text style={[styles.statVal, { color: colors.textPrimary, fontVariant: ["tabular-nums"] }]}>
                    {result.postShockVolatility}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Distribution Tail Risk Cards (Rule 54) */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Monte Carlo Distribution (P10 · P50 · P90)
            </Text>

            <View style={styles.distRow}>
              {result.valueDistribution.map((point) => {
                const isTail = point.percentile === 5 || point.percentile === 10;
                const isMedian = point.percentile === 50;
                const isBull = point.percentile === 90 || point.percentile === 95;
                return (
                  <View
                    key={point.percentile}
                    style={[
                      styles.distCard,
                      {
                        backgroundColor: isTail
                          ? colors.dangerSoft
                          : isMedian
                          ? colors.surfaceStrong
                          : colors.surfaceMuted,
                        borderColor: isTail ? colors.danger : colors.border,
                        borderRadius: 4,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.distPct,
                        { color: isTail ? colors.danger : isBull ? colors.accent : colors.textMuted },
                      ]}
                    >
                      P{point.percentile} {isTail ? "(Downside)" : isMedian ? "(Median)" : isBull ? "(Upside)" : ""}
                    </Text>
                    <Text style={[styles.distVal, { color: colors.textPrimary, fontVariant: ["tabular-nums"] }]}>
                      ₹{Math.round(point.value / 1000).toLocaleString("en-IN")}k
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Fiduciary Risk Commentary */}
            <View
              style={[
                styles.advisoryBox,
                { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
              ]}
            >
              <Ionicons name="compass-outline" size={20} color={colors.brand} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.advisoryTitle, { color: colors.textPrimary }]}>
                  Fiduciary Risk Advisory
                </Text>
                <Text style={[styles.advisoryBody, { color: colors.textSecondary }]}>
                  {result.advisoryCommentary}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 680,
    maxHeight: "90%",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.15)",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 8,
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  presetCard: {
    width: "48.5%",
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
  },
  presetName: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  presetMeta: {
    fontSize: 10,
    fontWeight: "500",
  },
  stepperRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  stepperBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
  },
  stepperText: {
    fontSize: 12,
    fontWeight: "700",
  },
  heroCard: {
    padding: 14,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 16,
  },
  heroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroVal: {
    fontSize: 22,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  changeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
  },
  changeText: {
    fontSize: 14,
    fontWeight: "800",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(150, 150, 150, 0.15)",
    paddingTop: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "500",
    marginBottom: 3,
  },
  statVal: {
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  distRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 16,
  },
  distCard: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
  },
  distPct: {
    fontSize: 9.5,
    fontWeight: "700",
    marginBottom: 3,
  },
  distVal: {
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  advisoryBox: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  advisoryTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  advisoryBody: {
    fontSize: 12,
    lineHeight: 17,
  },
});
