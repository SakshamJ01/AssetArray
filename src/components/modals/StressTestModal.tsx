import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppTheme } from "../../theme";
import {
  CRISIS_SCENARIOS,
  CrisisScenario,
  runStressTest,
} from "../../services/stressTesting";
import { SimpleHolding } from "../../services/rebalancer";

export interface StressTestModalProps {
  visible: boolean;
  onClose: () => void;
  holdings: SimpleHolding[];
  theme: AppTheme;
  clientName?: string;
}

export const StressTestModal: React.FC<StressTestModalProps> = ({
  visible,
  onClose,
  holdings,
  theme,
  clientName = "Portfolio",
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("gfc_2008");

  const selectedScenario = useMemo(
    () =>
      CRISIS_SCENARIOS.find((s) => s.id === selectedScenarioId) ||
      CRISIS_SCENARIOS[0],
    [selectedScenarioId]
  );

  const result = useMemo(
    () => runStressTest(holdings, selectedScenario),
    [holdings, selectedScenario]
  );

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "AAA Fiduciary":
        return "#10B981";
      case "AA Resilient":
        return "#34D399";
      case "A Moderate":
        return "#F59E0B";
      default:
        return "#EF4444";
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>RISK ARCHITECTURE</Text>
              </View>
              <Text style={styles.title}>Macro Stress-Testing Crisis Simulator</Text>
              <Text style={styles.subtitle}>
                Simulate portfolio resilience under extreme macro stress events for {clientName}.
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Scenario Selector Chips */}
            <Text style={styles.sectionHeader}>SELECT MACRO CRISIS SCENARIO</Text>
            <View style={styles.scenariosGrid}>
              {CRISIS_SCENARIOS.map((scenario) => {
                const isActive = scenario.id === selectedScenarioId;
                return (
                  <Pressable
                    key={scenario.id}
                    onPress={() => setSelectedScenarioId(scenario.id)}
                    style={[
                      styles.scenarioCard,
                      isActive && styles.scenarioCardActive,
                    ]}
                  >
                    <View style={styles.scenarioCardTop}>
                      <Text
                        style={[
                          styles.scenarioName,
                          isActive && styles.scenarioNameActive,
                        ]}
                      >
                        {scenario.name}
                      </Text>
                      <Text style={styles.scenarioYear}>{scenario.yearReference}</Text>
                    </View>
                    <Text style={styles.scenarioDesc}>{scenario.description}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Stress Test Hero Metrics */}
            <View style={styles.heroSummary}>
              <View style={styles.heroColumn}>
                <Text style={styles.heroLabel}>PROJECTED DRAWDOWN</Text>
                <Text style={styles.drawdownValue}>
                  -₹{result.totalDrawdownDollars.toLocaleString()}
                </Text>
                <Text style={styles.drawdownPercent}>
                  (-{result.totalDrawdownPercentage}% Peak-to-Trough)
                </Text>
              </View>

              <View style={styles.heroDivider} />

              <View style={styles.heroColumn}>
                <Text style={styles.heroLabel}>RESILIENCE RATING</Text>
                <View
                  style={[
                    styles.ratingPill,
                    {
                      borderColor: getRatingColor(result.resilienceRating),
                      backgroundColor: `${getRatingColor(result.resilienceRating)}1A`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.ratingText,
                      { color: getRatingColor(result.resilienceRating) },
                    ]}
                  >
                    {result.resilienceRating}
                  </Text>
                </View>
                <Text style={styles.recoveryText}>
                  Est. Recovery: ~{result.projectedRecoveryMonths} Months
                </Text>
              </View>
            </View>

            {/* Asset Class Shock Impact Breakdown */}
            <Text style={styles.sectionHeader}>ASSET CLASS SHOCK TRAJECTORY</Text>
            {result.breakdown.map((item) => {
              const isGain = item.dollarChange >= 0;
              return (
                <View key={item.assetClass} style={styles.impactCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.impactClass}>{item.assetClass}</Text>
                    <Text style={styles.impactSubText}>
                      Pre-Crisis: ₹{item.initialValue.toLocaleString()} → Post: ₹
                      {item.projectedValue.toLocaleString()}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={[
                        styles.impactShock,
                        isGain ? { color: "#10B981" } : { color: "#EF4444" },
                      ]}
                    >
                      {isGain ? `+${item.shockPercentage}%` : `${item.shockPercentage}%`}
                    </Text>
                    <Text
                      style={[
                        styles.impactDelta,
                        isGain ? { color: "#10B981" } : { color: "#EF4444" },
                      ]}
                    >
                      {isGain ? `+₹${item.dollarChange.toLocaleString()}` : `-₹${Math.abs(item.dollarChange).toLocaleString()}`}
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* Fiduciary Advisory Action Plan */}
            <View style={styles.commentaryCard}>
              <Text style={styles.commentaryHeader}>FIDUCIARY COMMENTARY & ACTION PLAN</Text>
              <Text style={styles.commentaryBody}>
                {result.fiduciaryRecommendation}
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable
              style={styles.doneBtn}
              onPress={() => {
                Alert.alert(
                  "Stress Test Documented",
                  `Stress test for ${selectedScenario.name} saved with resilience rating: ${result.resilienceRating}.`
                );
                onClose();
              }}
            >
              <Text style={styles.doneBtnText}>Export Crisis Audit & Close</Text>
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
    backgroundColor: "rgba(3, 7, 18, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  dialog: {
    backgroundColor: "#070D1B",
    borderColor: "rgba(224, 168, 76, 0.3)",
    borderWidth: 1,
    borderRadius: 20,
    width: "100%",
    maxWidth: 680,
    maxHeight: "90%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  tagBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  tagText: {
    color: "#F87171",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  subtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    color: "#94A3B8",
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  scenariosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  scenarioCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 12,
  },
  scenarioCardActive: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "#EF4444",
  },
  scenarioCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  scenarioName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
  },
  scenarioNameActive: {
    color: "#F8FAFC",
  },
  scenarioYear: {
    fontSize: 10,
    color: "#E0A84C",
    fontWeight: "700",
  },
  scenarioDesc: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 15,
  },
  heroSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(11, 19, 38, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(224, 168, 76, 0.2)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  heroColumn: {
    flex: 1,
    alignItems: "center",
  },
  heroDivider: {
    width: 1,
    height: 48,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginHorizontal: 12,
  },
  heroLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 4,
  },
  drawdownValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#EF4444",
  },
  drawdownPercent: {
    fontSize: 11,
    color: "#F87171",
    fontWeight: "700",
    marginTop: 2,
  },
  ratingPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "800",
  },
  recoveryText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },
  impactCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  impactClass: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  impactSubText: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  impactShock: {
    fontSize: 14,
    fontWeight: "800",
  },
  impactDelta: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  commentaryCard: {
    marginTop: 14,
    backgroundColor: "rgba(224, 168, 76, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(224, 168, 76, 0.25)",
    borderRadius: 12,
    padding: 14,
  },
  commentaryHeader: {
    fontSize: 10,
    fontWeight: "800",
    color: "#E0A84C",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  commentaryBody: {
    fontSize: 12,
    color: "#F8FAFC",
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  doneBtn: {
    backgroundColor: "#E0A84C",
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
