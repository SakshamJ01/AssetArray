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
  calculateRebalance,
  SimpleHolding,
  TARGET_MODELS,
  TargetModel,
} from "../../services/rebalancer";

export interface RebalanceModalProps {
  visible: boolean;
  onClose: () => void;
  holdings: SimpleHolding[];
  theme: AppTheme;
  clientName?: string;
}

export const RebalanceModal: React.FC<RebalanceModalProps> = ({
  visible,
  onClose,
  holdings,
  theme,
  clientName = "Portfolio",
}) => {
  const [selectedModelId, setSelectedModelId] = useState<string>("balanced_wealth");

  const selectedModel = useMemo(
    () =>
      TARGET_MODELS.find((m) => m.id === selectedModelId) || TARGET_MODELS[1],
    [selectedModelId]
  );

  const result = useMemo(
    () => calculateRebalance(holdings, selectedModel),
    [holdings, selectedModel]
  );

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
                <Text style={styles.tagText}>FIDUCIARY ENGINE</Text>
              </View>
              <Text style={styles.title}>Portfolio Rebalance & Tax Harvesting</Text>
              <Text style={styles.subtitle}>
                Simulate optimal allocation for {clientName} based on target models.
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Target Model Selector */}
            <Text style={styles.sectionHeader}>SELECT FIDUCIARY TARGET MODEL</Text>
            <View style={styles.modelsGrid}>
              {TARGET_MODELS.map((model) => {
                const isActive = model.id === selectedModelId;
                return (
                  <Pressable
                    key={model.id}
                    onPress={() => setSelectedModelId(model.id)}
                    style={[styles.modelCard, isActive && styles.modelCardActive]}
                  >
                    <View style={styles.modelCardHeader}>
                      <Text style={[styles.modelName, isActive && styles.modelNameActive]}>
                        {model.name}
                      </Text>
                      {isActive && <View style={styles.activeDot} />}
                    </View>
                    <Text style={styles.modelDesc}>{model.description}</Text>
                    <View style={styles.modelWeightsRow}>
                      {Object.entries(model.allocations).map(([cls, wt]) => (
                        <Text key={cls} style={styles.weightPill}>
                          {cls}: <Text style={{ color: "#F8FAFC" }}>{wt}%</Text>
                        </Text>
                      ))}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Drift Summary Pill */}
            <View style={styles.driftBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.driftLabel}>MAX ALLOCATION DRIFT</Text>
                <Text
                  style={[
                    styles.driftValue,
                    result.isRebalanceRecommended
                      ? { color: "#F59E0B" }
                      : { color: "#10B981" },
                  ]}
                >
                  {result.maxDrift}%
                </Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>
                  {result.isRebalanceRecommended
                    ? "REBALANCE RECOMMENDED"
                    : "PORTFOLIO BALANCED"}
                </Text>
              </View>
            </View>

            {/* Asset Class Drift & Order Tickets */}
            <Text style={styles.sectionHeader}>RECOMMENDED TRADE TICKETS</Text>
            {result.items.map((item) => {
              const isBuy = item.action === "BUY";
              const isSell = item.action === "SELL";
              return (
                <View key={item.assetClass} style={styles.ticketCard}>
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketAssetClass}>{item.assetClass}</Text>
                    <View
                      style={[
                        styles.actionBadge,
                        isBuy
                          ? styles.actionBuy
                          : isSell
                          ? styles.actionSell
                          : styles.actionHold,
                      ]}
                    >
                      <Text
                        style={[
                          styles.actionBadgeText,
                          isBuy
                            ? { color: "#10B981" }
                            : isSell
                            ? { color: "#EF4444" }
                            : { color: "#94A3B8" },
                        ]}
                      >
                        {item.action === "BALANCED" ? "ON TARGET" : `${item.action} ₹${item.amount.toLocaleString()}`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.weightsCompareRow}>
                    <Text style={styles.compareText}>
                      Current: <Text style={styles.valText}>{item.currentWeight}%</Text>
                    </Text>
                    <Text style={styles.arrowText}>→</Text>
                    <Text style={styles.compareText}>
                      Target: <Text style={styles.valText}>{item.targetWeight}%</Text>
                    </Text>
                    <Text
                      style={[
                        styles.driftDeltaText,
                        item.drift > 0 ? { color: "#EF4444" } : { color: "#10B981" },
                      ]}
                    >
                      ({item.drift > 0 ? `+${item.drift}%` : `${item.drift}%`})
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* Tax-Loss Harvesting Section */}
            <View style={styles.tlhSection}>
              <View style={styles.tlhHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tlhTitle}>Tax-Loss Harvesting Opportunities</Text>
                  <Text style={styles.tlhSubtitle}>
                    Offset taxable capital gains by realizing embedded portfolio losses.
                  </Text>
                </View>
                <View style={styles.taxShieldBox}>
                  <Text style={styles.taxShieldLabel}>POTENTIAL TAX SHIELD</Text>
                  <Text style={styles.taxShieldValue}>
                    ₹{result.potentialTaxShield.toLocaleString()}
                  </Text>
                </View>
              </View>

              {result.taxLossCandidates.length === 0 ? (
                <Text style={styles.emptyTlhText}>
                  No positions currently trading below cost basis. Zero tax harvesting needed.
                </Text>
              ) : (
                result.taxLossCandidates.map((c) => (
                  <View key={c.holdingId} style={styles.tlhCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tlhAssetName}>{c.assetName}</Text>
                      <Text style={styles.tlhAssetClass}>{c.assetClass}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.tlhLossValue}>
                        -₹{c.unrealizedLoss.toLocaleString()}
                      </Text>
                      <Text style={styles.tlhSavingsText}>
                        Save ~₹{c.estimatedTaxSavings.toLocaleString()} tax
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footer}>
            <Pressable
              style={styles.doneBtn}
              onPress={() => {
                Alert.alert(
                  "Rebalance Strategy Generated",
                  `Trade tickets ready for ${clientName}. Potential tax shield: ₹${result.potentialTaxShield.toLocaleString()}.`
                );
                onClose();
              }}
            >
              <Text style={styles.doneBtnText}>Apply & Close Simulator</Text>
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
    backgroundColor: "rgba(224, 168, 76, 0.15)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  tagText: {
    color: "#E0A84C",
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
  modelsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  modelCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 12,
  },
  modelCardActive: {
    backgroundColor: "rgba(224, 168, 76, 0.1)",
    borderColor: "#E0A84C",
  },
  modelCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  modelName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
  },
  modelNameActive: {
    color: "#F8FAFC",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E0A84C",
  },
  modelDesc: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 15,
    marginBottom: 8,
  },
  modelWeightsRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  weightPill: {
    fontSize: 10,
    color: "#94A3B8",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  driftBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(11, 19, 38, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(224, 168, 76, 0.2)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  driftLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
  },
  driftValue: {
    fontSize: 24,
    fontWeight: "900",
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: 0.8,
  },
  ticketCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  ticketAssetClass: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionBuy: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.35)",
  },
  actionSell: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
  },
  actionHold: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  weightsCompareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  compareText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  valText: {
    color: "#F8FAFC",
    fontWeight: "700",
  },
  arrowText: {
    color: "#64748B",
    fontSize: 12,
  },
  driftDeltaText: {
    fontSize: 12,
    fontWeight: "700",
  },
  tlhSection: {
    marginTop: 16,
    backgroundColor: "rgba(16, 185, 129, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    borderRadius: 14,
    padding: 14,
  },
  tlhHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  tlhTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#10B981",
  },
  tlhSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  taxShieldBox: {
    alignItems: "flex-end",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  taxShieldLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#34D399",
    letterSpacing: 0.8,
  },
  taxShieldValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#F8FAFC",
    marginTop: 2,
  },
  emptyTlhText: {
    fontSize: 12,
    color: "#64748B",
    fontStyle: "italic",
  },
  tlhCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  tlhAssetName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  tlhAssetClass: {
    fontSize: 10,
    color: "#94A3B8",
  },
  tlhLossValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#EF4444",
  },
  tlhSavingsText: {
    fontSize: 10,
    color: "#10B981",
    fontWeight: "600",
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
