import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Client, PortfolioHolding } from "../../types/wealth";
import { FundXrayService } from "../../services/intelligence/fundXrayService";

interface FundXrayModalProps {
  visible: boolean;
  onClose: () => void;
  client?: Client;
  clients?: Client[];
  selectedClientId?: string;
  onSelectClient?: (clientId: string) => void;
  isDark: boolean;
  colors: any;
}

export const FundXrayModal: React.FC<FundXrayModalProps> = ({
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
            assetName: "HDFC Nifty 50 ETF",
            assetClass: "Mutual Funds",
            ticker: "HDFCNIFTY",
            quantity: "500",
            investedValue: "150000",
            currentValue: "185000",
            targetWeight: "50",
            notes: "",
          },
          {
            id: "h_demo_2",
            assetName: "Parag Parikh Flexi Cap Fund",
            assetClass: "Mutual Funds",
            ticker: "PPFAS",
            quantity: "2000",
            investedValue: "200000",
            currentValue: "280000",
            targetWeight: "50",
            notes: "",
          },
        ];

  const analysis = FundXrayService.analyzePortfolioOverlap(holdings);

  const handleExecuteConsolidation = () => {
    Alert.alert(
      "⚡ Smart Fund Consolidation Plan",
      `Switching redundant overlapping holdings into low-cost index ETFs will save approximately ₹${analysis.estimatedAnnualFeeDrag.toLocaleString("en-IN")}/year with zero loss of market diversification. Would you like to create rebalancing execution orders?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Stage Rebalance Orders",
          onPress: () => {
            Alert.alert("Success", "Consolidation proposal staged into Advisor Rebalancing Desk.");
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBadge, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="scan" size={22} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                  Look-Through Fund X-Ray
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                  Stock Overlap Matrix & Redundant Expense Ratio Eliminator
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

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {/* KPI Cards Row */}
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Overlap Score</Text>
                <Text
                  style={[
                    styles.kpiValue,
                    {
                      color:
                        analysis.overlapScore > 50 ? colors.danger : colors.success,
                    },
                  ]}
                >
                  {analysis.overlapScore}%
                </Text>
                <Text style={[styles.kpiSub, { color: colors.textSecondary }]}>
                  {analysis.overlapScore > 50 ? "High Duplicate Exposure" : "Healthy Diversification"}
                </Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Est. Annual Fee Drag</Text>
                <Text style={[styles.kpiValue, { color: colors.brand }]}>
                  ₹{analysis.estimatedAnnualFeeDrag.toLocaleString("en-IN")}
                </Text>
                <Text style={[styles.kpiSub, { color: colors.textSecondary }]}>
                  Avg Expense: {analysis.averageExpenseRatio}%
                </Text>
              </View>
            </View>

            {/* Strategic Recommendations */}
            <View style={[styles.recomBox, { backgroundColor: colors.surfaceMuted, borderColor: colors.brand }]}>
              <View style={styles.recomHeader}>
                <Ionicons name="bulb-outline" size={18} color={colors.brand} />
                <Text style={[styles.recomTitle, { color: colors.textPrimary }]}>
                  Consolidation & Alpha Insights
                </Text>
              </View>
              {analysis.consolidationRecommendations.map((rec, idx) => (
                <Text key={idx} style={[styles.recomText, { color: colors.textSecondary }]}>
                  • {rec}
                </Text>
              ))}
            </View>

            {/* Top Consolidated Stock Exposure */}
            <View style={styles.headingRow}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                Consolidated Underlying Stock Weights (Look-Through)
              </Text>
            </View>

            {analysis.topOverlappingStocks.slice(0, 7).map((item) => (
              <View
                key={item.stockTicker}
                style={[styles.stockCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.stockLeft}>
                  <Text style={[styles.stockName, { color: colors.textPrimary }]}>
                    {item.stockName} <Text style={{ color: colors.textMuted }}>({item.stockTicker})</Text>
                  </Text>
                  <Text style={[styles.stockSector, { color: colors.textMuted }]}>
                    {item.sector} • Held across {item.fundsContaining.length} fund(s)
                  </Text>
                  <View style={styles.fundTagsRow}>
                    {item.fundsContaining.map((f, i) => (
                      <View
                        key={i}
                        style={[styles.fundTag, { backgroundColor: colors.neutralSoft }]}
                      >
                        <Text style={[styles.fundTagText, { color: colors.textSecondary }]}>
                          {f.fundName.split(" ")[0]}: {f.weightInFund}%
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.stockRight}>
                  <Text style={[styles.weightText, { color: colors.textPrimary }]}>
                    {item.totalConsolidatedWeight}%
                  </Text>
                  <Text style={[styles.valueText, { color: colors.textMuted }]}>
                    ₹{(item.totalConsolidatedValue / 1000).toFixed(1)}k
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Footer Action */}
          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.brand }]}
              onPress={handleExecuteConsolidation}
            >
              <Ionicons name="shuffle-outline" size={18} color="#000000" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>
                Eliminate Overlap: Stage Rebalance Order
              </Text>
            </TouchableOpacity>
          </View>
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
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  kpiSub: {
    fontSize: 11,
  },
  recomBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  recomHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recomTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  recomText: {
    fontSize: 12,
    lineHeight: 18,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
  },
  stockCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  stockLeft: {
    flex: 1,
    marginRight: 10,
  },
  stockName: {
    fontSize: 14,
    fontWeight: "600",
  },
  stockSector: {
    fontSize: 11,
    marginTop: 2,
  },
  fundTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  fundTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fundTagText: {
    fontSize: 10,
    fontWeight: "600",
  },
  stockRight: {
    alignItems: "flex-end",
  },
  weightText: {
    fontSize: 16,
    fontWeight: "800",
  },
  valueText: {
    fontSize: 11,
    marginTop: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 8,
  },
  actionBtnText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "700",
  },
});
