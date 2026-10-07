import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Client } from "../../types/wealth";
import { ShadowWealthService } from "../../services/intelligence/shadowWealthService";
import {
  PhysicalGoldHolding,
  RealEstateProperty,
  PrivateDebtNote,
} from "../../types/intelligence";

interface ShadowWealthModalProps {
  visible: boolean;
  onClose: () => void;
  client?: Client;
  isDark: boolean;
  colors: any;
}

export const ShadowWealthModal: React.FC<ShadowWealthModalProps> = ({
  visible,
  onClose,
  client,
  isDark,
  colors,
}) => {
  const [activeTab, setActiveTab] = useState<"gold" | "realestate" | "debt">("gold");

  const [goldHoldings, setGoldHoldings] = useState<PhysicalGoldHolding[]>([
    {
      id: "g_1",
      itemType: "Bar",
      purity: "24K",
      grossWeightGrams: 100,
      netWeightGrams: 100,
      purchaseDate: "2023-11-15",
      purchaseCostPerGram: 6150,
      currentSpotRatePerGram: 7250,
      lockerLocation: "HDFC Safe Deposit Vault #204, Mumbai",
      certificateRef: "MMTC-PAMP-9999",
    },
    {
      id: "g_2",
      itemType: "Coin",
      purity: "22K",
      grossWeightGrams: 50,
      netWeightGrams: 50,
      purchaseDate: "2024-04-10",
      purchaseCostPerGram: 5800,
      currentSpotRatePerGram: 7250,
      lockerLocation: "ICICI Bank Locker #110, Delhi",
    },
  ]);

  const [properties, setProperties] = useState<RealEstateProperty[]>([
    {
      id: "p_1",
      propertyType: "Commercial",
      address: "14th Floor, Maker Maxity, BKC",
      city: "Mumbai",
      carpetAreaSqFt: 2200,
      circleRatePerSqFt: 42000,
      estimatedMarketValue: 125000000,
      annualRentalYield: 7.2,
      propertyTaxDueDate: "2026-11-30",
      deedDocumentRef: "DEED-REG-2021-9921",
    },
  ]);

  const [privateNotes, setPrivateNotes] = useState<PrivateDebtNote[]>([
    {
      id: "d_1",
      borrowerName: "Solarium Green Energy Pvt. Ltd.",
      borrowerContact: "+91 98111 22334",
      principalAmount: 5000000,
      annualInterestRate: 14.5,
      interestType: "Compounded Annually",
      issueDate: "2025-03-01",
      maturityDate: "2027-03-01",
      collateralDetails: "First charge over solar plant receivables",
      accruedInterest: 0,
      totalReceivable: 0,
    },
  ]);

  const summary = ShadowWealthService.computeShadowSummary({
    goldHoldings,
    properties,
    privateNotes,
    spotRate24kPerGram: 7250,
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBadge, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="cube-outline" size={22} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                  Shadow Wealth & Physical Asset Desk
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                  Physical Bullion Lockers, Real Estate Deeds & Private Debt
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Consolidated KPI Summary Banner */}
          <View style={[styles.summaryBanner, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <View style={styles.summaryCol}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Total Shadow Net Worth</Text>
              <Text style={[styles.summaryBigVal, { color: colors.brand }]}>
                ₹{(summary.totalShadowNetWorth / 10000000).toFixed(2)} Cr
              </Text>
            </View>
            <View style={styles.summaryStatsRow}>
              <Text style={[styles.statChip, { color: colors.textSecondary }]}>
                Gold: ₹{(summary.totalPhysicalGoldValue / 100000).toFixed(1)}L ({summary.goldHoldingsCount})
              </Text>
              <Text style={[styles.statChip, { color: colors.textSecondary }]}>
                Real Estate: ₹{(summary.totalRealEstateValue / 10000000).toFixed(2)}Cr ({summary.propertiesCount})
              </Text>
              <Text style={[styles.statChip, { color: colors.textSecondary }]}>
                Private Notes: ₹{(summary.totalPrivateDebtValue / 100000).toFixed(1)}L ({summary.privateNotesCount})
              </Text>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === "gold" && { borderBottomColor: colors.brand, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab("gold")}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === "gold" ? colors.brand : colors.textMuted },
                ]}
              >
                Physical Gold ({goldHoldings.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === "realestate" && { borderBottomColor: colors.brand, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab("realestate")}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === "realestate" ? colors.brand : colors.textMuted },
                ]}
              >
                Real Estate ({properties.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === "debt" && { borderBottomColor: colors.brand, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab("debt")}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === "debt" ? colors.brand : colors.textMuted },
                ]}
              >
                Private Debt Notes ({privateNotes.length})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {activeTab === "gold" ? (
              <>
                {goldHoldings.map((g) => {
                  const purityFactor = g.purity === "24K" ? 1 : g.purity === "22K" ? 22 / 24 : 18 / 24;
                  const val = g.netWeightGrams * 7250 * purityFactor;
                  return (
                    <View
                      key={g.id}
                      style={[styles.itemCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
                    >
                      <View style={styles.itemHeader}>
                        <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                          {g.itemType} ({g.purity} Gold)
                        </Text>
                        <Text style={[styles.itemVal, { color: colors.brand }]}>
                          ₹{Math.round(val).toLocaleString("en-IN")}
                        </Text>
                      </View>
                      <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                        Weight: {g.netWeightGrams}g • Location: {g.lockerLocation}
                      </Text>
                      <Text style={[styles.itemMeta, { color: colors.textMuted }]}>
                        Purchased @ ₹{g.purchaseCostPerGram}/g • Live Spot: ₹7,250/g
                      </Text>
                    </View>
                  );
                })}
              </>
            ) : activeTab === "realestate" ? (
              <>
                {properties.map((p) => (
                  <View
                    key={p.id}
                    style={[styles.itemCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
                  >
                    <View style={styles.itemHeader}>
                      <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                        {p.propertyType} Property
                      </Text>
                      <Text style={[styles.itemVal, { color: colors.brand }]}>
                        ₹{(p.estimatedMarketValue / 10000000).toFixed(2)} Cr
                      </Text>
                    </View>
                    <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                      {p.address}, {p.city} ({p.carpetAreaSqFt} sq.ft)
                    </Text>
                    <Text style={[styles.itemMeta, { color: colors.textMuted }]}>
                      Circle Rate: ₹{p.circleRatePerSqFt}/sq.ft • Rental Yield: {p.annualRentalYield}% p.a.
                    </Text>
                  </View>
                ))}
              </>
            ) : (
              <>
                {privateNotes.map((d) => {
                  const accrued = ShadowWealthService.calculatePrivateDebtAccrual(d);
                  return (
                    <View
                      key={d.id}
                      style={[styles.itemCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
                    >
                      <View style={styles.itemHeader}>
                        <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                          Borrower: {d.borrowerName}
                        </Text>
                        <Text style={[styles.itemVal, { color: colors.brand }]}>
                          ₹{((d.principalAmount + accrued) / 100000).toFixed(2)} Lakhs
                        </Text>
                      </View>
                      <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                        Principal: ₹{(d.principalAmount / 100000).toFixed(1)}L @ {d.annualInterestRate}% p.a. ({d.interestType})
                      </Text>
                      <Text style={[styles.itemMeta, { color: colors.textMuted }]}>
                        Accrued Interest: ₹{accrued.toLocaleString("en-IN")} • Maturity: {d.maturityDate}
                      </Text>
                    </View>
                  );
                })}
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
  summaryBanner: {
    padding: 14,
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  summaryCol: {
    gap: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  summaryBigVal: {
    fontSize: 24,
    fontWeight: "800",
  },
  summaryStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statChip: {
    fontSize: 12,
    fontWeight: "600",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    marginTop: 12,
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
    gap: 12,
  },
  itemCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
  },
  itemVal: {
    fontSize: 15,
    fontWeight: "800",
  },
  itemSub: {
    fontSize: 12,
    lineHeight: 18,
  },
  itemMeta: {
    fontSize: 11,
    marginTop: 2,
  },
});
