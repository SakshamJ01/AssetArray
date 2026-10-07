import React from "react";
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
import { FundXrayService } from "../../services/intelligence/fundXrayService";

interface FundXrayModalProps {
  visible: boolean;
  onClose: () => void;
  client?: Client;
  isDark: boolean;
  colors: any;
}

export const FundXrayModal: React.FC<FundXrayModalProps> = ({
  visible,
  onClose,
  client,
  isDark,
  colors,
}) => {
  const holdings: PortfolioHolding[] = client?.portfolio || [
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
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
              Consolidated Underlying Stock Weights (Look-Through)
            </Text>
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
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
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
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },
  kpiSub: {
    fontSize: 11,
    marginTop: 2,
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
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
  },
  stockCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
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
});
