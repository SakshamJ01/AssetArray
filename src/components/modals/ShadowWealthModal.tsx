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
  clients?: Client[];
  selectedClientId?: string;
  onSelectClient?: (clientId: string) => void;
  isDark: boolean;
  colors: any;
}

export const ShadowWealthModal: React.FC<ShadowWealthModalProps> = ({
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

  const [activeTab, setActiveTab] = useState<"gold" | "realestate" | "debt">("gold");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  const initialGold: PhysicalGoldHolding[] = [
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
  ];

  const initialProperties: RealEstateProperty[] = [
    {
      id: "p_1",
      propertyType: "Commercial",
      address: "14th Floor, Maker Maxity, BKC",
      city: "Mumbai",
      carpetAreaSqFt: 2200,
      circleRatePerSqFt: 42000,
      estimatedMarketValue: 145000000,
      annualRentalYield: 6.8,
      propertyTaxDueDate: "2026-12-31",
      deedDocumentRef: "DEED-MAH-2021-9921",
    },
    {
      id: "p_2",
      propertyType: "Residential",
      address: "Villa 18, Palm Meadows, Whitefield",
      city: "Bengaluru",
      carpetAreaSqFt: 4500,
      circleRatePerSqFt: 18000,
      estimatedMarketValue: 85000000,
      annualRentalYield: 3.2,
      propertyTaxDueDate: "2026-10-31",
      deedDocumentRef: "DEED-BLR-2019-3310",
    },
  ];

  const initialDebt: PrivateDebtNote[] = [
    {
      id: "d_1",
      borrowerName: "Apex Logistics Infrastructure LLP",
      borrowerContact: "+91 98110 55432",
      principalAmount: 5000000,
      annualInterestRate: 14.5,
      interestType: "Simple",
      issueDate: "2024-01-15",
      maturityDate: "2026-01-15",
      collateralDetails: "First charge on 2 Commercial Trucks",
      accruedInterest: 725000,
      totalReceivable: 5725000,
    },
  ];

  const [goldHoldings, setGoldHoldings] = useState<PhysicalGoldHolding[]>(initialGold);
  const [properties, setProperties] = useState<RealEstateProperty[]>(initialProperties);
  const [privateNotes, setPrivateNotes] = useState<PrivateDebtNote[]>(initialDebt);

  // Form input state
  const [formGoldWeight, setFormGoldWeight] = useState("50");
  const [formGoldPurity, setFormGoldPurity] = useState<"24K" | "22K" | "18K">("24K");
  const [formGoldLocker, setFormGoldLocker] = useState("Bank Vault #301");
  const [formPropAddress, setFormPropAddress] = useState("Plot 42, Sector 15");
  const [formPropValue, setFormPropValue] = useState("50000000");
  const [formDebtBorrower, setFormDebtBorrower] = useState("Sunrise Trading Co.");
  const [formDebtPrincipal, setFormDebtPrincipal] = useState("2000000");

  // Load persisted assets for client
  useEffect(() => {
    const loadShadowWealth = async () => {
      try {
        const stored = await AsyncStorage.getItem(`ASSETARRAY_SHADOW_${currentClientId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.gold) setGoldHoldings(parsed.gold);
          if (parsed.properties) setProperties(parsed.properties);
          if (parsed.notes) setPrivateNotes(parsed.notes);
        } else {
          setGoldHoldings(initialGold);
          setProperties(initialProperties);
          setPrivateNotes(initialDebt);
        }
      } catch (err) {
        console.warn("Failed to load shadow wealth", err);
      }
    };
    loadShadowWealth();
  }, [currentClientId]);

  const saveShadowWealth = async (
    gold = goldHoldings,
    props = properties,
    notes = privateNotes
  ) => {
    try {
      await AsyncStorage.setItem(
        `ASSETARRAY_SHADOW_${currentClientId}`,
        JSON.stringify({ gold, properties: props, notes })
      );
    } catch (err) {
      console.warn("Failed to save shadow wealth", err);
    }
  };

  const handleAddGold = () => {
    const weight = parseFloat(formGoldWeight) || 0;
    if (weight <= 0) return;
    const newGold: PhysicalGoldHolding = {
      id: `g_${Date.now()}`,
      itemType: "Bar",
      purity: formGoldPurity,
      grossWeightGrams: weight,
      netWeightGrams: weight,
      purchaseDate: new Date().toISOString().split("T")[0],
      purchaseCostPerGram: 7000,
      currentSpotRatePerGram: 7250,
      lockerLocation: formGoldLocker,
    };
    const next = [...goldHoldings, newGold];
    setGoldHoldings(next);
    saveShadowWealth(next, properties, privateNotes);
    setShowAddForm(false);
    Alert.alert("✓ Asset Registered", `Added ${weight}g ${formGoldPurity} gold to vault ledger.`);
  };

  const handleAddProperty = () => {
    const val = parseFloat(formPropValue) || 0;
    if (val <= 0) return;
    const newProp: RealEstateProperty = {
      id: `p_${Date.now()}`,
      propertyType: "Residential",
      address: formPropAddress,
      city: "Mumbai",
      carpetAreaSqFt: 1500,
      circleRatePerSqFt: 25000,
      estimatedMarketValue: val,
      annualRentalYield: 4.0,
      propertyTaxDueDate: "2026-12-31",
    };
    const next = [...properties, newProp];
    setProperties(next);
    saveShadowWealth(goldHoldings, next, privateNotes);
    setShowAddForm(false);
    Alert.alert("✓ Property Deed Registered", `Logged deed for ${formPropAddress} (Est: ₹${(val / 10000000).toFixed(2)} Cr).`);
  };

  const handleAddDebtNote = () => {
    const principal = parseFloat(formDebtPrincipal) || 0;
    if (principal <= 0) return;
    const newNote: PrivateDebtNote = {
      id: `d_${Date.now()}`,
      borrowerName: formDebtBorrower,
      borrowerContact: "+91 99000 11223",
      principalAmount: principal,
      annualInterestRate: 12.0,
      interestType: "Simple",
      issueDate: new Date().toISOString().split("T")[0],
      maturityDate: "2027-03-31",
      accruedInterest: 0,
      totalReceivable: principal,
    };
    const next = [...privateNotes, newNote];
    setPrivateNotes(next);
    saveShadowWealth(goldHoldings, properties, next);
    setShowAddForm(false);
    Alert.alert("✓ Private Debt Registered", `Promissory note for ₹${(principal / 100000).toFixed(2)}L to ${formDebtBorrower} logged.`);
  };

  const summary = ShadowWealthService.computeShadowSummary({
    goldHoldings,
    properties,
    privateNotes,
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBadge, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="cube" size={22} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                  Shadow Wealth & Physical Assets
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                  Physical Gold Bullion, Real Estate Deeds & Private Debt
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

          {/* Aggregate Shadow Wealth Banner */}
          <View
            style={[
              styles.summaryBanner,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.brand },
            ]}
          >
            <View style={styles.summaryCol}>
              <Text style={[styles.summaryLabel, { color: colors.brand }]}>
                Total Shadow Wealth Net Worth
              </Text>
              <Text style={[styles.summaryBigVal, { color: colors.textPrimary }]}>
                ₹{(summary.totalShadowNetWorth / 10000000).toFixed(2)} Cr
              </Text>
            </View>
            <View style={styles.summaryStatsRow}>
              <Text style={[styles.statChip, { color: colors.textSecondary }]}>
                Gold: ₹{(summary.totalPhysicalGoldValue / 100000).toFixed(1)}L ({summary.goldHoldingsCount})
              </Text>
              <Text style={[styles.statChip, { color: colors.textSecondary }]}>
                • Real Estate: ₹{(summary.totalRealEstateValue / 10000000).toFixed(2)}Cr ({summary.propertiesCount})
              </Text>
              <Text style={[styles.statChip, { color: colors.textSecondary }]}>
                • Private Notes: ₹{(summary.totalPrivateDebtValue / 100000).toFixed(1)}L ({summary.privateNotesCount})
              </Text>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === "gold" && { borderBottomColor: colors.brand, borderBottomWidth: 2 },
              ]}
              onPress={() => { setActiveTab("gold"); setShowAddForm(false); }}
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
              onPress={() => { setActiveTab("realestate"); setShowAddForm(false); }}
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
              onPress={() => { setActiveTab("debt"); setShowAddForm(false); }}
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
            {/* Add Asset Toggle Header */}
            <View style={styles.addToggleRow}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {activeTab === "gold"
                  ? "Bullion & Vault Inventory"
                  : activeTab === "realestate"
                  ? "Property Title & Registry Ledger"
                  : "Private Loan Agreements & Promissory Notes"}
              </Text>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.brand }]}
                onPress={() => setShowAddForm(!showAddForm)}
              >
                <Ionicons
                  name={showAddForm ? "close" : "add"}
                  size={16}
                  color="#000000"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.addBtnText}>
                  {showAddForm ? "Cancel" : "+ Add Asset"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Inline Add Form */}
            {showAddForm && (
              <View style={[styles.formContainer, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                {activeTab === "gold" ? (
                  <>
                    <Text style={[styles.formTitle, { color: colors.textPrimary }]}>
                      Register Physical Bullion / Jewelry
                    </Text>
                    <View style={styles.formRow}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Net Weight (Grams)</Text>
                        <TextInput
                          style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                          value={formGoldWeight}
                          keyboardType="numeric"
                          onChangeText={setFormGoldWeight}
                        />
                      </View>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Purity</Text>
                        <TextInput
                          style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                          value={formGoldPurity}
                          onChangeText={(v: any) => setFormGoldPurity(v)}
                        />
                      </View>
                    </View>
                    <View style={[styles.inputGroup, { marginTop: 8 }]}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Locker / Vault Location</Text>
                      <TextInput
                        style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                        value={formGoldLocker}
                        onChangeText={setFormGoldLocker}
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.submitFormBtn, { backgroundColor: colors.brand, marginTop: 12 }]}
                      onPress={handleAddGold}
                    >
                      <Text style={styles.submitFormBtnText}>Save Gold Holding</Text>
                    </TouchableOpacity>
                  </>
                ) : activeTab === "realestate" ? (
                  <>
                    <Text style={[styles.formTitle, { color: colors.textPrimary }]}>
                      Register Real Estate Deed
                    </Text>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Property Address / Unit</Text>
                      <TextInput
                        style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                        value={formPropAddress}
                        onChangeText={setFormPropAddress}
                      />
                    </View>
                    <View style={[styles.inputGroup, { marginTop: 8 }]}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Estimated Market Value (₹)</Text>
                      <TextInput
                        style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                        value={formPropValue}
                        keyboardType="numeric"
                        onChangeText={setFormPropValue}
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.submitFormBtn, { backgroundColor: colors.brand, marginTop: 12 }]}
                      onPress={handleAddProperty}
                    >
                      <Text style={styles.submitFormBtnText}>Save Property Deed</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={[styles.formTitle, { color: colors.textPrimary }]}>
                      Register Private Debt / Promissory Note
                    </Text>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Borrower Name / Entity</Text>
                      <TextInput
                        style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                        value={formDebtBorrower}
                        onChangeText={setFormDebtBorrower}
                      />
                    </View>
                    <View style={[styles.inputGroup, { marginTop: 8 }]}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Principal Amount (₹)</Text>
                      <TextInput
                        style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                        value={formDebtPrincipal}
                        keyboardType="numeric"
                        onChangeText={setFormDebtPrincipal}
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.submitFormBtn, { backgroundColor: colors.brand, marginTop: 12 }]}
                      onPress={handleAddDebtNote}
                    >
                      <Text style={styles.submitFormBtnText}>Save Private Debt Note</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* List items */}
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
                      Rental Yield: {p.annualRentalYield}% p.a. • Deed Ref: {p.deedDocumentRef || "Verified"}
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
  addToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addBtnText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "700",
  },
  formContainer: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 8,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  formRow: {
    flexDirection: "row",
    gap: 10,
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
  submitFormBtn: {
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    borderRadius: 8,
  },
  submitFormBtnText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "700",
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
