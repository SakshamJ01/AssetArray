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
import { generateTaxHarvestReport, INDIAN_TAX_RATES } from "../services/taxIntelligence";
import { PortfolioHolding } from "../types/wealth";
import { AppTheme } from "../theme";

interface TaxHarvestStudioModalProps {
  visible: boolean;
  theme: AppTheme;
  holdings: PortfolioHolding[];
  portfolioName: string;
  onClose: () => void;
}

export const TaxHarvestStudioModal: React.FC<TaxHarvestStudioModalProps> = ({
  visible,
  theme,
  holdings,
  portfolioName,
  onClose,
}) => {
  const { colors } = theme;
  const [selectedLots, setSelectedLots] = useState<Record<string, boolean>>({});

  const report = generateTaxHarvestReport(holdings, { shortTerm: 45000, longTerm: 180000 }, portfolioName);

  const toggleLot = (id: string) => {
    setSelectedLots((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Compute selected tax savings
  const harvestCandidates = report.harvestCandidates.filter((c) => c.isLossHarvestCandidate);
  const selectedSavings = harvestCandidates
    .filter((c) => selectedLots[c.holdingId] !== false) // default all selected
    .reduce((sum, c) => sum + c.potentialTaxShield, 0);

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
                Indian Tax-Loss Harvesting Studio
              </Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                Finance Act 2024 Rules Aligned (AY 2026-27) • {portfolioName}
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
            {/* KPI Cards */}
            <View style={styles.kpiRow}>
              <View
                style={[
                  styles.kpiCard,
                  { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.kpiCardLabel, { color: colors.textMuted }]}>
                  Harvestable Losses
                </Text>
                <Text style={[styles.kpiCardValue, { color: colors.danger }]}>
                  ₹{Math.round(report.totalHarvestableLoss).toLocaleString("en-IN")}
                </Text>
                <Text style={[styles.kpiCardSub, { color: colors.textMuted }]}>
                  {harvestCandidates.length} loss positions identified
                </Text>
              </View>

              <View
                style={[
                  styles.kpiCard,
                  { backgroundColor: colors.accentSoft, borderColor: colors.accent },
                ]}
              >
                <Text style={[styles.kpiCardLabel, { color: colors.textMuted }]}>
                  Estimated Tax Impact
                </Text>
                <Text style={[styles.kpiCardValue, { color: colors.accent }]}>
                  ₹{Math.round(selectedSavings).toLocaleString("en-IN")}
                </Text>
                <Text style={[styles.kpiCardSub, { color: colors.textSecondary }]}>
                  Potential immediate tax offset
                </Text>
              </View>

              <View
                style={[
                  styles.kpiCard,
                  { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.kpiCardLabel, { color: colors.textMuted }]}>
                  Exemption Used
                </Text>
                <Text style={[styles.kpiCardValue, { color: colors.brand }]}>
                  ₹{Math.round(report.ltcgExemptionUtilized || 0).toLocaleString("en-IN")}
                </Text>
                <Text style={[styles.kpiCardSub, { color: colors.textMuted }]}>
                  ₹1.25L statutory LTCG limit
                </Text>
              </View>
            </View>

            {/* Statutory Rates Explainer */}
            <View
              style={[
                styles.ratesBanner,
                { backgroundColor: colors.backgroundMuted, borderColor: colors.border },
              ]}
            >
              <Ionicons name="information-circle" size={18} color={colors.brand} />
              <Text style={[styles.ratesText, { color: colors.textSecondary }]}>
                Equity STCG (Sec 111A) is taxed at <Text style={{ fontWeight: "700" }}>20.0%</Text>. Equity LTCG (Sec 112A) is taxed at <Text style={{ fontWeight: "700" }}>12.5%</Text> on gains exceeding ₹1.25 Lakh. Realizing capital losses shields both taxable gain buckets.
              </Text>
            </View>

            {/* Harvest Candidates Table */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Recommended Loss-Harvest Trade Lots
            </Text>

            {harvestCandidates.length === 0 ? (
              <View
                style={[
                  styles.emptyBox,
                  { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                ]}
              >
                <Ionicons name="checkmark-circle-outline" size={32} color={colors.accent} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  No Loss Harvest Positions
                </Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  All portfolio holdings are currently in unrealized profit. No capital losses to harvest at this time.
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.tableContainer,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={[styles.tableHeader, { backgroundColor: colors.backgroundMuted }]}>
                  <Text style={[styles.thCell, { flex: 0.5 }]}>Pick</Text>
                  <Text style={[styles.thCell, { flex: 2, color: colors.textSecondary }]}>Asset / Ticker</Text>
                  <Text style={[styles.thCell, { flex: 1.2, color: colors.textSecondary }]}>Period</Text>
                  <Text style={[styles.thCell, { flex: 1.4, color: colors.textSecondary }]}>Unrealized Loss</Text>
                  <Text style={[styles.thCell, { flex: 1.3, color: colors.textSecondary }]}>Estimated Tax Impact</Text>
                </View>

                {harvestCandidates.map((lot, idx) => {
                  const isChecked = selectedLots[lot.holdingId] !== false;
                  return (
                    <Pressable
                      key={lot.holdingId || idx}
                      onPress={() => toggleLot(lot.holdingId)}
                      style={[
                        styles.tableRow,
                        {
                          borderBottomColor: colors.border,
                          backgroundColor: isChecked ? colors.accentSoft : "transparent",
                        },
                      ]}
                    >
                      <View style={{ flex: 0.5, alignItems: "center" }}>
                        <Ionicons
                          name={isChecked ? "checkbox" : "square-outline"}
                          size={18}
                          color={isChecked ? colors.accent : colors.textMuted}
                        />
                      </View>
                      <View style={{ flex: 2 }}>
                        <Text style={[styles.tdMain, { color: colors.textPrimary }]}>
                          {lot.assetName}
                        </Text>
                        <Text style={[styles.tdSub, { color: colors.textMuted }]}>
                          {lot.ticker} • {lot.applicableTaxRatePct}% Rate
                        </Text>
                      </View>
                      <Text style={[styles.tdCell, { flex: 1.2, color: colors.textSecondary }]}>
                        {lot.isLongTerm ? "LTCG (>12m)" : "STCG (<12m)"}
                      </Text>
                      <Text style={[styles.tdCell, { flex: 1.4, fontWeight: "700", color: colors.danger }]}>
                        -₹{Math.round(Math.abs(lot.unrealizedGainLoss)).toLocaleString("en-IN")}
                      </Text>
                      <Text style={[styles.tdCell, { flex: 1.3, fontWeight: "800", color: colors.accent }]}>
                        +₹{Math.round(lot.potentialTaxShield).toLocaleString("en-IN")}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Wash Sale Protection Advisory */}
            <View
              style={[
                styles.washSaleBox,
                { backgroundColor: colors.surfaceMuted, borderColor: colors.warning },
              ]}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.warning} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.washSaleTitle, { color: colors.textPrimary }]}>
                  30-Day Fiduciary Wash-Sale Advisory
                </Text>
                <Text style={[styles.washSaleSub, { color: colors.textSecondary }]}>
                  To avoid General Anti-Avoidance Rules (GAAR) scrutiny, avoid repurchasing the identical ticker within 30 days of loss realization. Substitute with a correlated peer ETF or mutual fund to preserve market beta.
                </Text>
              </View>
            </View>

            {/* Statutory Disclaimer */}
            <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
              {report.statutoryDisclaimer}
            </Text>
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
  kpiRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
  },
  kpiCardLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  kpiCardValue: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 2,
  },
  kpiCardSub: {
    fontSize: 9.5,
    fontWeight: "500",
    textAlign: "center",
  },
  ratesBanner: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  ratesText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  tableContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  thCell: {
    fontSize: 10.5,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  tdMain: {
    fontSize: 12,
    fontWeight: "600",
  },
  tdSub: {
    fontSize: 10,
  },
  tdCell: {
    fontSize: 11,
  },
  washSaleBox: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
    marginBottom: 14,
  },
  washSaleTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  washSaleSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  disclaimer: {
    fontSize: 10,
    lineHeight: 14,
    textAlign: "center",
    marginTop: 6,
  },
});
