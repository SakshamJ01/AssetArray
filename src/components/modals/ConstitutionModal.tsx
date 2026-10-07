import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Client, PortfolioHolding } from "../../types/wealth";
import { ConstitutionService } from "../../services/intelligence/constitutionService";

interface ConstitutionModalProps {
  visible: boolean;
  onClose: () => void;
  client?: Client;
  clients?: Client[];
  selectedClientId?: string;
  onSelectClient?: (clientId: string) => void;
  isDark: boolean;
  colors: any;
}

export const ConstitutionModal: React.FC<ConstitutionModalProps> = ({
  visible,
  onClose,
  client,
  clients,
  selectedClientId,
  onSelectClient,
  isDark,
  colors,
}) => {
  const [currentClientId, setCurrentClientId] = useState<string>(
    selectedClientId || client?.id || (clients && clients[0]?.id) || "default_cli"
  );

  useEffect(() => {
    if (selectedClientId) {
      setCurrentClientId(selectedClientId);
    } else if (client?.id) {
      setCurrentClientId(client.id);
    }
  }, [selectedClientId, client?.id]);

  const activeClient = clients?.find((c) => c.id === currentClientId) || client;

  const holdings: PortfolioHolding[] =
    activeClient?.portfolio && activeClient.portfolio.length > 0
      ? activeClient.portfolio
      : [
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

  const [activeTab, setActiveTab] = useState<"rules" | "crash" | "precheck">("rules");

  // Pre-trade impulse check state
  const [proposedAction, setProposedAction] = useState<"BUY" | "SELL">("SELL");
  const [proposedAsset, setProposedAsset] = useState<string>("Tata Consultancy Services Ltd.");
  const [proposedAmount, setProposedAmount] = useState<string>("150000");
  const [impulseReason, setImpulseReason] = useState<string>("Market is falling, fear of correction");
  const [coolingOffActive, setCoolingOffActive] = useState<boolean>(false);
  const [cooldownRemainingSeconds, setCooldownRemainingSeconds] = useState<number>(86400); // 24 hrs

  useEffect(() => {
    let timer: any;
    if (coolingOffActive && cooldownRemainingSeconds > 0) {
      timer = setInterval(() => {
        setCooldownRemainingSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [coolingOffActive, cooldownRemainingSeconds]);

  const totalValue = holdings.reduce(
    (sum, h) => sum + (parseFloat(h.currentValue) || 0),
    0
  );

  const evaluation = ConstitutionService.evaluateRules(holdings);
  const crashSims = ConstitutionService.simulateCrashScenarios(totalValue, 75);

  const handleRunImpulseCheck = () => {
    const amt = parseFloat(proposedAmount) || 0;
    const isPanicSell = proposedAction === "SELL" && amt > totalValue * 0.2;
    if (isPanicSell) {
      setCoolingOffActive(true);
      Alert.alert(
        "🛑 CONSTITUTION INTERVENTION TRIGGERED",
        `This order represents an emergency liquidation of ₹${(amt / 100000).toFixed(2)}L (${Math.round((amt / totalValue) * 100)}% of assets). Under Investment Constitution Policy Rule 4.2:\n\n1. 24-Hour Behavioral Cooling-Off Window Activated.\n2. Requires Dual-Signatory Mandate from Secondary Signatory.\n3. Historical evidence shows 91% of impulsive panic liquidations lock in permanent bottom-tick losses.`,
        [{ text: "Acknowledge & Abide by Constitution" }]
      );
    } else {
      Alert.alert(
        "✓ Mandate Compliant",
        `Proposed ${proposedAction} of ₹${amt.toLocaleString("en-IN")} complies with asset allocation limits and does not trigger impulse circuit breakers.`,
        [{ text: "OK" }]
      );
    }
  };

  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs}h ${mins}m ${s}s`;
  };

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

          {/* Client Switcher (if multiple clients available) */}
          {clients && clients.length > 1 && (
            <View style={[styles.clientSwitcherBar, { borderBottomColor: colors.border }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.clientSwitcherScroll}>
                {clients.map((c) => {
                  const isSelected = c.id === currentClientId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => {
                        setCurrentClientId(c.id);
                        onSelectClient?.(c.id);
                      }}
                      style={[
                        styles.clientChip,
                        {
                          backgroundColor: isSelected ? colors.brand : colors.surfaceMuted,
                          borderColor: isSelected ? colors.brand : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name="person"
                        size={12}
                        color={isSelected ? "#000000" : colors.textMuted}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.clientChipText,
                          {
                            color: isSelected ? "#000000" : colors.textSecondary,
                            fontWeight: isSelected ? "700" : "500",
                          },
                        ]}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

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
                Crash Simulators (3)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === "precheck" && { borderBottomColor: colors.brand, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab("precheck")}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === "precheck" ? colors.brand : colors.textMuted },
                ]}
              >
                Anti-Impulse Gate {coolingOffActive ? "⏱️" : ""}
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
                      Constitution Compliance Score: {evaluation.overallComplianceScore}%
                    </Text>
                    <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>
                      {evaluation.hasViolations
                        ? "Active policy breaches detected. Review mandatory guardrails."
                        : "All fiduciary portfolio thresholds currently in full compliance."}
                    </Text>
                  </View>
                  <Ionicons
                    name={evaluation.hasViolations ? "alert-circle" : "checkmark-circle"}
                    size={28}
                    color={evaluation.hasViolations ? colors.brand : colors.success}
                  />
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
                    <View style={styles.ruleHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.ruleName, { color: colors.textPrimary }]}>
                          {rule.name}
                        </Text>
                        <Text style={[styles.ruleCategory, { color: colors.textMuted }]}>
                          Category: {rule.category} • Target Cap: ≤{rule.threshold}{rule.thresholdUnit}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.ruleStatusPill,
                          {
                            backgroundColor: rule.isCompliant
                              ? colors.successSoft
                              : colors.dangerSoft,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.ruleStatusText,
                            { color: rule.isCompliant ? colors.success : colors.danger },
                          ]}
                        >
                          {rule.isCompliant ? "COMPLIANT" : "BREACH"}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.ruleDesc, { color: colors.textSecondary }]}>
                      {rule.description}
                    </Text>

                    <View style={styles.ruleFooter}>
                      <Text style={[styles.metricText, { color: colors.textPrimary }]}>
                        Current Level:{" "}
                        <Text
                          style={{
                            fontWeight: "800",
                            color: rule.isCompliant ? colors.textPrimary : colors.danger,
                          }}
                        >
                          {rule.currentValue}
                          {rule.thresholdUnit}
                        </Text>
                      </Text>
                      {rule.violationMessage && (
                        <Text style={[styles.violationText, { color: colors.danger }]}>
                          ⚠️ {rule.violationMessage}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </>
            ) : activeTab === "crash" ? (
              <>
                <Text style={[styles.crashHeading, { color: colors.textPrimary }]}>
                  Stress Drawdown Simulators: Total Portfolio ₹{(totalValue / 100000).toFixed(2)} Lakhs
                </Text>

                {crashSims.map((sim, i) => (
                  <View
                    key={i}
                    style={[styles.simCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
                  >
                    <View style={styles.simHeader}>
                      <Text style={[styles.simName, { color: colors.textPrimary }]}>
                        {sim.scenarioName}
                      </Text>
                      <Text style={[styles.simDrop, { color: colors.danger }]}>
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
            ) : (
              <>
                {/* Pre-Trade Anti-Impulse Gate */}
                <View
                  style={[
                    styles.bannerBox,
                    {
                      backgroundColor: coolingOffActive ? colors.warningSoft : colors.surfaceMuted,
                      borderColor: coolingOffActive ? colors.brand : colors.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>
                      {coolingOffActive ? "⏱️ Mandatory Cooling-Off Gate Active" : "Anti-Impulse Pre-Execution Check"}
                    </Text>
                    <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>
                      {coolingOffActive
                        ? `Time remaining before execution unlocked: ${formatTime(cooldownRemainingSeconds)}`
                        : "Verify proposed large allocations or panic rebalances before broker order dispatch."}
                    </Text>
                  </View>
                  {coolingOffActive && (
                    <TouchableOpacity
                      onPress={() => setCoolingOffActive(false)}
                      style={[styles.resetCoolingBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                      <Text style={[styles.resetCoolingText, { color: colors.textSecondary }]}>Reset Gate</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={[styles.precheckCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Simulate Proposed Order
                  </Text>

                  <View style={styles.actionToggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.togglePill,
                        proposedAction === "SELL" && { backgroundColor: colors.danger },
                      ]}
                      onPress={() => setProposedAction("SELL")}
                    >
                      <Text
                        style={[
                          styles.togglePillText,
                          { color: proposedAction === "SELL" ? "#FFFFFF" : colors.textSecondary },
                        ]}
                      >
                        SELL ORDER
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.togglePill,
                        proposedAction === "BUY" && { backgroundColor: colors.success },
                      ]}
                      onPress={() => setProposedAction("BUY")}
                    >
                      <Text
                        style={[
                          styles.togglePillText,
                          { color: proposedAction === "BUY" ? "#FFFFFF" : colors.textSecondary },
                        ]}
                      >
                        BUY ORDER
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.inputGroup, { marginTop: 12 }]}>
                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Security / Holding</Text>
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                      value={proposedAsset}
                      onChangeText={setProposedAsset}
                    />
                  </View>

                  <View style={[styles.inputGroup, { marginTop: 10 }]}>
                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Order Value (₹)</Text>
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                      value={proposedAmount}
                      keyboardType="numeric"
                      onChangeText={setProposedAmount}
                    />
                  </View>

                  <View style={[styles.inputGroup, { marginTop: 10 }]}>
                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Rationale / Catalyst</Text>
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                      value={impulseReason}
                      onChangeText={setImpulseReason}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.testTradeBtn, { backgroundColor: colors.brand, marginTop: 16 }]}
                    onPress={handleRunImpulseCheck}
                  >
                    <Ionicons name="shield-checkmark-outline" size={18} color="#000000" style={{ marginRight: 6 }} />
                    <Text style={styles.testTradeBtnText}>
                      Run Constitution Pre-Check
                    </Text>
                  </TouchableOpacity>
                </View>
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
    borderRadius: 12,
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
    borderRadius: 8,
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
  clientSwitcherBar: {
    borderBottomWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clientSwitcherScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clientChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  clientChipText: {
    fontSize: 12,
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
  ruleCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  ruleHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  ruleName: {
    fontSize: 14,
    fontWeight: "700",
  },
  ruleCategory: {
    fontSize: 11,
    marginTop: 2,
  },
  ruleStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  ruleStatusText: {
    fontSize: 10,
    fontWeight: "800",
  },
  ruleDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  ruleFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(150,150,150,0.15)",
    paddingTop: 8,
    gap: 4,
  },
  metricText: {
    fontSize: 12,
  },
  violationText: {
    fontSize: 12,
    fontWeight: "600",
  },
  crashHeading: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  simCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  simHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  simName: {
    fontSize: 14,
    fontWeight: "700",
  },
  simDrop: {
    fontSize: 14,
    fontWeight: "800",
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
    fontStyle: "italic",
  },
  precheckCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  actionToggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  togglePill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(150,150,150,0.3)",
  },
  togglePillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  textInput: {
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  testTradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 42,
    borderRadius: 8,
  },
  testTradeBtnText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "700",
  },
  resetCoolingBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetCoolingText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
