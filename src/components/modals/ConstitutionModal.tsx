import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Client, PortfolioHolding } from "../../types/wealth";
import { ConstitutionService } from "../../services/intelligence/constitutionService";

interface ConstitutionModalProps {
  visible: boolean;
  onClose: () => void;
  client?: Client;
  isDark: boolean;
  colors: any;
}

export const ConstitutionModal: React.FC<ConstitutionModalProps> = ({
  visible,
  onClose,
  client,
  isDark,
  colors,
}) => {
  const holdings: PortfolioHolding[] = client?.portfolio || [
    {
      id: "h_demo_1",
      assetName: "Tata Consultancy Services Ltd.",
      assetClass: "Stocks",
      ticker: "TCS",
      quantity: "100",
      investedValue: "300000",
      currentValue: "380000",
      targetWeight: "40",
      notes: "",
    },
    {
      id: "h_demo_2",
      assetName: "HDFC Nifty 50 ETF",
      assetClass: "Mutual Funds",
      ticker: "HDFCNIFTY",
      quantity: "500",
      investedValue: "200000",
      currentValue: "250000",
      targetWeight: "40",
      notes: "",
    },
    {
      id: "h_demo_3",
      assetName: "Liquid Cash Reserve",
      assetClass: "Cash",
      ticker: "CASH",
      quantity: "1",
      investedValue: "30000",
      currentValue: "30000",
      targetWeight: "20",
      notes: "",
    },
  ];

  const [activeTab, setActiveTab] = useState<"rules" | "crash">("rules");

  const totalValue = holdings.reduce(
    (sum, h) => sum + (parseFloat(h.currentValue) || 0),
    0
  );

  const evaluation = ConstitutionService.evaluateRules(holdings);
  const crashSims = ConstitutionService.simulateCrashScenarios(totalValue, 75);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBadge, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="scale-outline" size={22} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                  Investment Constitution
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                  Anti-Impulse Guardrails & Stress Drawdown Simulators
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === "rules" && { borderBottomColor: colors.brand, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab("rules")}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === "rules" ? colors.brand : colors.textMuted },
                ]}
              >
                Policy Rules ({evaluation.rules.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === "crash" && { borderBottomColor: colors.brand, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab("crash")}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === "crash" ? colors.brand : colors.textMuted },
                ]}
              >
                Historical Crash Simulation (3)
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {activeTab === "rules" ? (
              <>
                {/* Score Banner */}
                <View
                  style={[
                    styles.bannerBox,
                    {
                      backgroundColor:
                        evaluation.overallComplianceScore === 100
                          ? colors.successSoft
                          : colors.warningSoft,
                      borderColor:
                        evaluation.overallComplianceScore === 100 ? colors.success : colors.brand,
                    },
                  ]}
                >
                  <View>
                    <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>
                      IPS Compliance Rating
                    </Text>
                    <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>
                      {evaluation.hasViolations
                        ? "⚠️ Action Required: Behavioral covenants breached."
                        : "✓ Portfolio adheres 100% to client Investment Policy Statement."}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.scoreText,
                      {
                        color:
                          evaluation.overallComplianceScore === 100
                            ? colors.success
                            : colors.brand,
                      },
                    ]}
                  >
                    {evaluation.overallComplianceScore}%
                  </Text>
                </View>

                {/* Rules List */}
                {evaluation.rules.map((rule) => (
                  <View
                    key={rule.id}
                    style={[
                      styles.ruleCard,
                      {
                        backgroundColor: colors.surfaceMuted,
                        borderColor: rule.isCompliant ? colors.border : colors.danger,
                      },
                    ]}
                  >
                    <View style={styles.ruleTop}>
                      <View style={styles.ruleTitleRow}>
                        <Ionicons
                          name={rule.isCompliant ? "checkmark-circle" : "alert-circle"}
                          size={18}
                          color={rule.isCompliant ? colors.success : colors.danger}
                        />
                        <Text style={[styles.ruleName, { color: colors.textPrimary }]}>
                          {rule.name}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.ruleBadge,
                          {
                            color: rule.isCompliant ? colors.success : colors.danger,
                            backgroundColor: rule.isCompliant ? colors.successSoft : colors.dangerSoft,
                          },
                        ]}
                      >
                        {rule.isCompliant ? "PASS" : "BREACH"}
                      </Text>
                    </View>
                    <Text style={[styles.ruleDesc, { color: colors.textSecondary }]}>
                      {rule.description}
                    </Text>
                    <View style={styles.ruleMetricsRow}>
                      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                        Current: <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>{rule.currentValue}{rule.thresholdUnit}</Text>
                      </Text>
                      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                        Limit: <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>{rule.threshold}{rule.thresholdUnit}</Text>
                      </Text>
                    </View>
                    {rule.violationMessage ? (
                      <Text style={[styles.violationText, { color: colors.danger }]}>
                        {rule.violationMessage}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </>
            ) : (
              <>
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                  Historical Drawdown Stress Impacts
                </Text>
                <Text style={[styles.sectionSubtext, { color: colors.textMuted }]}>
                  Simulating what would happen to this portfolio during major historical market crashes.
                </Text>

                {crashSims.map((sim, index) => (
                  <View
                    key={index}
                    style={[styles.simCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
                  >
                    <View style={styles.simHeader}>
                      <Text style={[styles.simTitle, { color: colors.textPrimary }]}>
                        {sim.scenarioName}
                      </Text>
                      <Text style={[styles.dropBadge, { color: colors.danger, backgroundColor: colors.dangerSoft }]}>
                        -{sim.marketDropPct}% Drop
                      </Text>
                    </View>
                    <View style={styles.simNumbersRow}>
                      <View style={styles.simCol}>
                        <Text style={[styles.colLabel, { color: colors.textMuted }]}>Est. Capital Drawdown</Text>
                        <Text style={[styles.colVal, { color: colors.danger }]}>
                          -₹{(sim.estimatedLoss / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View style={styles.simCol}>
                        <Text style={[styles.colLabel, { color: colors.textMuted }]}>Value Post-Crash</Text>
                        <Text style={[styles.colVal, { color: colors.textPrimary }]}>
                          ₹{(sim.portfolioValueAfterCrash / 1000).toFixed(1)}k
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.warningBox, { color: colors.textSecondary }]}>
                      ⚠️ {sim.warningAlert}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 780,
    maxHeight: "90%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tabItem: {
    paddingVertical: 12,
    marginRight: 20,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  bannerBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  bannerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  scoreText: {
    fontSize: 22,
    fontWeight: "800",
  },
  ruleCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  ruleTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ruleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ruleName: {
    fontSize: 14,
    fontWeight: "700",
  },
  ruleBadge: {
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ruleDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  ruleMetricsRow: {
    flexDirection: "row",
    gap: 16,
  },
  metricLabel: {
    fontSize: 12,
  },
  violationText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
  },
  sectionSubtext: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 4,
  },
  simCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  simHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  simTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  dropBadge: {
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  simNumbersRow: {
    flexDirection: "row",
    gap: 20,
  },
  simCol: {
    gap: 2,
  },
  colLabel: {
    fontSize: 11,
  },
  colVal: {
    fontSize: 16,
    fontWeight: "800",
  },
  warningBox: {
    fontSize: 11,
    lineHeight: 16,
  },
});
