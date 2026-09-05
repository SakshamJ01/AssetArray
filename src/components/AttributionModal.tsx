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
import {
  calculateAttribution,
  STANDARD_BENCHMARKS,
  BenchmarkProfile,
} from "../services/attribution";
import { PortfolioHolding } from "../types/wealth";
import { AppTheme } from "../theme";

interface AttributionModalProps {
  visible: boolean;
  theme: AppTheme;
  holdings: PortfolioHolding[];
  portfolioName: string;
  onClose: () => void;
}

export const AttributionModal: React.FC<AttributionModalProps> = ({
  visible,
  theme,
  holdings,
  portfolioName,
  onClose,
}) => {
  const { colors } = theme;
  const [selectedBenchmarkKey, setSelectedBenchmarkKey] =
    useState<keyof typeof STANDARD_BENCHMARKS>("BALANCED_HYBRID");

  const benchmark: BenchmarkProfile =
    STANDARD_BENCHMARKS[selectedBenchmarkKey] ||
    STANDARD_BENCHMARKS.BALANCED_HYBRID;

  const result = calculateAttribution(holdings, benchmark, portfolioName);

  const isAlphaPositive = result.totalActiveReturn >= 0;
  const alphaColor = isAlphaPositive ? colors.accent : colors.danger;

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
                Performance Attribution
              </Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                Brinson-Fachler Multi-Factor Model • {portfolioName}
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
            {/* Benchmark Selector Pills */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Benchmark Comparison
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.benchmarkPills}
            >
              {Object.keys(STANDARD_BENCHMARKS).map((key) => {
                const b = STANDARD_BENCHMARKS[key as keyof typeof STANDARD_BENCHMARKS];
                const active = selectedBenchmarkKey === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() =>
                      setSelectedBenchmarkKey(key as keyof typeof STANDARD_BENCHMARKS)
                    }
                    style={[
                      styles.pill,
                      {
                        backgroundColor: active ? colors.brand : colors.surfaceMuted,
                        borderColor: active ? colors.brand : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: active ? colors.textOnBrand : colors.textPrimary },
                      ]}
                    >
                      {b.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Performance Summary KPI Banner */}
            <View
              style={[
                styles.kpiContainer,
                { backgroundColor: colors.backgroundMuted, borderColor: colors.border },
              ]}
            >
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>
                  Portfolio Return
                </Text>
                <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
                  {(result.portfolioReturn * 100).toFixed(2)}%
                </Text>
              </View>

              <View style={styles.kpiDivider} />

              <View style={styles.kpiBox}>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>
                  Benchmark Return
                </Text>
                <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
                  {(result.benchmarkReturn * 100).toFixed(2)}%
                </Text>
              </View>

              <View style={styles.kpiDivider} />

              <View style={styles.kpiBox}>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>
                  Net Active Alpha
                </Text>
                <Text style={[styles.kpiValue, { color: alphaColor }]}>
                  {isAlphaPositive ? "+" : ""}
                  {(result.totalActiveReturn * 100).toFixed(2)}%
                </Text>
              </View>
            </View>

            {/* Plain-Language Explainability Synthesis */}
            <View
              style={[
                styles.narrativeBox,
                {
                  backgroundColor: isAlphaPositive
                    ? colors.accentSoft
                    : colors.dangerSoft,
                  borderColor: alphaColor,
                },
              ]}
            >
              <Ionicons
                name={isAlphaPositive ? "trending-up" : "alert-circle"}
                size={20}
                color={alphaColor}
                style={styles.narrativeIcon}
              />
              <Text style={[styles.narrativeText, { color: colors.textPrimary }]}>
                {result.narrativeExplanation}
              </Text>
            </View>

            {/* Factor Decomposition Waterfall Cards */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Active Return Factor Breakdown
            </Text>

            <View style={styles.summaryBarRow}>
              <View
                style={[
                  styles.effectCard,
                  { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.effectTitle, { color: colors.textMuted }]}>
                  Allocation Effect
                </Text>
                <Text
                  style={[
                    styles.effectVal,
                    {
                      color:
                        result.summary.allocationEffect >= 0
                          ? colors.accent
                          : colors.danger,
                    },
                  ]}
                >
                  {result.summary.allocationEffect >= 0 ? "+" : ""}
                  {(result.summary.allocationEffect * 10000).toFixed(0)} bps
                </Text>
                <Text style={[styles.effectSub, { color: colors.textMuted }]}>
                  Over/underweighting
                </Text>
              </View>

              <View
                style={[
                  styles.effectCard,
                  { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.effectTitle, { color: colors.textMuted }]}>
                  Selection Effect
                </Text>
                <Text
                  style={[
                    styles.effectVal,
                    {
                      color:
                        result.summary.selectionEffect >= 0
                          ? colors.accent
                          : colors.danger,
                    },
                  ]}
                >
                  {result.summary.selectionEffect >= 0 ? "+" : ""}
                  {(result.summary.selectionEffect * 10000).toFixed(0)} bps
                </Text>
                <Text style={[styles.effectSub, { color: colors.textMuted }]}>
                  Security alpha
                </Text>
              </View>

              <View
                style={[
                  styles.effectCard,
                  { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.effectTitle, { color: colors.textMuted }]}>
                  Interaction Effect
                </Text>
                <Text
                  style={[
                    styles.effectVal,
                    {
                      color:
                        result.summary.interactionEffect >= 0
                          ? colors.accent
                          : colors.danger,
                    },
                  ]}
                >
                  {result.summary.interactionEffect >= 0 ? "+" : ""}
                  {(result.summary.interactionEffect * 10000).toFixed(0)} bps
                </Text>
                <Text style={[styles.effectSub, { color: colors.textMuted }]}>
                  Combined synergy
                </Text>
              </View>
            </View>

            {/* Category Level Breakdown Table */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Asset Class Attribution Table
            </Text>

            <View
              style={[
                styles.tableContainer,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={[styles.tableHeader, { backgroundColor: colors.backgroundMuted }]}>
                <Text style={[styles.thCell, { flex: 2, color: colors.textSecondary }]}>
                  Asset Class
                </Text>
                <Text style={[styles.thCell, { flex: 1.2, color: colors.textSecondary }]}>
                  Port / Bmk
                </Text>
                <Text style={[styles.thCell, { flex: 1.2, color: colors.textSecondary }]}>
                  Alloc (bps)
                </Text>
                <Text style={[styles.thCell, { flex: 1.2, color: colors.textSecondary }]}>
                  Select (bps)
                </Text>
                <Text style={[styles.thCell, { flex: 1.2, color: colors.textSecondary }]}>
                  Total (bps)
                </Text>
              </View>

              {result.breakdown.map((row, idx) => {
                const totalBps = Math.round(row.totalActiveContribution * 10000);
                const allocBps = Math.round(row.allocationEffect * 10000);
                const selectBps = Math.round(row.selectionEffect * 10000);

                return (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      {
                        borderBottomColor: colors.border,
                        backgroundColor:
                          idx % 2 === 0 ? "transparent" : colors.surfaceMuted,
                      },
                    ]}
                  >
                    <Text style={[styles.tdCell, { flex: 2, fontWeight: "600", color: colors.textPrimary }]}>
                      {row.category}
                    </Text>
                    <Text style={[styles.tdCell, { flex: 1.2, color: colors.textMuted }]}>
                      {(row.portfolioWeight * 100).toFixed(0)}% / {(row.benchmarkWeight * 100).toFixed(0)}%
                    </Text>
                    <Text
                      style={[
                        styles.tdCell,
                        {
                          flex: 1.2,
                          color: allocBps >= 0 ? colors.accent : colors.danger,
                        },
                      ]}
                    >
                      {allocBps >= 0 ? "+" : ""}
                      {allocBps}
                    </Text>
                    <Text
                      style={[
                        styles.tdCell,
                        {
                          flex: 1.2,
                          color: selectBps >= 0 ? colors.accent : colors.danger,
                        },
                      ]}
                    >
                      {selectBps >= 0 ? "+" : ""}
                      {selectBps}
                    </Text>
                    <Text
                      style={[
                        styles.tdCell,
                        {
                          flex: 1.2,
                          fontWeight: "700",
                          color: totalBps >= 0 ? colors.accent : colors.danger,
                        },
                      ]}
                    >
                      {totalBps >= 0 ? "+" : ""}
                      {totalBps}
                    </Text>
                  </View>
                );
              })}
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
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.15)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
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
    padding: 18,
    paddingBottom: 28,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 6,
  },
  benchmarkPills: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  kpiContainer: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  kpiBox: {
    flex: 1,
    alignItems: "center",
  },
  kpiDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(150, 150, 150, 0.25)",
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  narrativeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  narrativeIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  narrativeText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "500",
  },
  summaryBarRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  effectCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  effectTitle: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  effectVal: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  effectSub: {
    fontSize: 9.5,
    fontWeight: "500",
    textAlign: "center",
  },
  tableContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  thCell: {
    fontSize: 10.5,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  tdCell: {
    fontSize: 11.5,
  },
});
