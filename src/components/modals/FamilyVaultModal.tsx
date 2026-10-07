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
import { FamilyVaultService } from "../../services/intelligence/familyVaultService";
import { NomineeRecord } from "../../types/intelligence";

interface FamilyVaultModalProps {
  visible: boolean;
  onClose: () => void;
  client?: Client;
  clients?: Client[];
  selectedClientId?: string;
  onSelectClient?: (clientId: string) => void;
  isDark: boolean;
  colors: any;
}

export const FamilyVaultModal: React.FC<FamilyVaultModalProps> = ({
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
            assetName: "Reliance Industries Ltd.",
            assetClass: "Stocks",
            ticker: "RELIANCE",
            quantity: "100",
            investedValue: "220000",
            currentValue: "290000",
            targetWeight: "50",
            notes: "",
          },
        ];

  const [nomineeOverrides, setNomineeOverrides] = useState<
    Record<string, { name: string; relationship: string; registered: boolean }>
  >({});
  const [emergencyContact, setEmergencyContact] = useState({
    name: "Dr. Ananya Sharma",
    relationship: "Spouse",
    phone: "+91 98200 44119",
    email: "ananya.sharma@family.in",
  });
  const [playbookGenerated, setPlaybookGenerated] = useState(false);

  // Load persisted vault data on client change
  useEffect(() => {
    const loadVaultData = async () => {
      try {
        const stored = await AsyncStorage.getItem(`ASSETARRAY_VAULT_${currentClientId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.nomineeOverrides) setNomineeOverrides(parsed.nomineeOverrides);
          if (parsed.emergencyContact) setEmergencyContact(parsed.emergencyContact);
        }
      } catch (err) {
        console.warn("Failed to load vault data", err);
      }
    };
    loadVaultData();
  }, [currentClientId]);

  const saveVaultData = async (
    newOverrides: Record<string, { name: string; relationship: string; registered: boolean }>,
    contact = emergencyContact
  ) => {
    try {
      await AsyncStorage.setItem(
        `ASSETARRAY_VAULT_${currentClientId}`,
        JSON.stringify({ nomineeOverrides: newOverrides, emergencyContact: contact })
      );
    } catch (err) {
      console.warn("Failed to save vault data", err);
    }
  };

  const audit = FamilyVaultService.auditNominees(holdings, nomineeOverrides);

  const toggleNominee = (item: NomineeRecord) => {
    const next = {
      ...nomineeOverrides,
      [item.holdingId]: {
        name: item.isRegistered ? "" : emergencyContact.name,
        relationship: item.isRegistered ? "" : emergencyContact.relationship,
        registered: !item.isRegistered,
      },
    };
    setNomineeOverrides(next);
    saveVaultData(next);
  };

  const handleExportPlaybook = () => {
    const playbook = FamilyVaultService.generateEmergencyPlaybook({
      clientId: activeClient?.id || "cli_default",
      clientName: activeClient?.name || "Private Wealth Principal",
      emergencyContact,
      holdings,
      nominees: audit.nominees,
    });
    setPlaybookGenerated(true);
    Alert.alert(
      "🛡️ Emergency Playbook Generated",
      `Encrypted Family Continuity Dossier successfully generated for ${playbook.clientName} covering ${playbook.totalAssetsCovered} assets worth ₹${(playbook.totalEstimatedValue / 100000).toFixed(2)} Lakhs.`,
      [{ text: "OK" }]
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
                <Ionicons name="shield-checkmark" size={22} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                  Family Continuity Vault
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                  Nominee Completeness Audit & Emergency Handover Dossier
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
            {/* Score Banner */}
            <View
              style={[
                styles.scoreBanner,
                {
                  backgroundColor:
                    audit.completenessScore >= 80 ? colors.successSoft : colors.warningSoft,
                  borderColor:
                    audit.completenessScore >= 80 ? colors.success : colors.brand,
                },
              ]}
            >
              <View>
                <Text style={[styles.scoreLabel, { color: colors.textPrimary }]}>
                  Nominee Completeness Health
                </Text>
                <Text style={[styles.scoreSub, { color: colors.textSecondary }]}>
                  {audit.unregisteredCount === 0
                    ? "All folios have registered legal heirs."
                    : `${audit.unregisteredCount} accounts currently lack documented nominees.`}
                </Text>
              </View>
              <View
                style={[
                  styles.scoreCircle,
                  {
                    backgroundColor:
                      audit.completenessScore >= 80 ? colors.success : colors.brand,
                  },
                ]}
              >
                <Text style={[styles.scoreNumber, { color: "#FFFFFF" }]}>
                  {audit.completenessScore}%
                </Text>
              </View>
            </View>

            {/* Emergency Contact Dossier Config */}
            <View style={[styles.sectionBox, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Designated Primary Legal Heir / Contact
              </Text>
              <View style={[styles.row, { gap: 10 }]}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Name</Text>
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                    value={emergencyContact.name}
                    onChangeText={(val) => {
                      const next = { ...emergencyContact, name: val };
                      setEmergencyContact(next);
                      saveVaultData(nomineeOverrides, next);
                    }}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Relationship</Text>
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                    value={emergencyContact.relationship}
                    onChangeText={(val) => {
                      const next = { ...emergencyContact, relationship: val };
                      setEmergencyContact(next);
                      saveVaultData(nomineeOverrides, next);
                    }}
                  />
                </View>
              </View>
              <View style={[styles.row, { gap: 10, marginTop: 8 }]}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Emergency Phone</Text>
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                    value={emergencyContact.phone}
                    onChangeText={(val) => {
                      const next = { ...emergencyContact, phone: val };
                      setEmergencyContact(next);
                      saveVaultData(nomineeOverrides, next);
                    }}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Secure Email</Text>
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                    value={emergencyContact.email}
                    onChangeText={(val) => {
                      const next = { ...emergencyContact, email: val };
                      setEmergencyContact(next);
                      saveVaultData(nomineeOverrides, next);
                    }}
                  />
                </View>
              </View>
            </View>

            {/* Nominee Audit Items */}
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
              Asset Custody & Nominee Audit Ledger ({audit.nominees.length} Assets)
            </Text>

            {audit.nominees.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.nomineeCard,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: item.isRegistered ? colors.border : colors.warningSoft,
                  },
                ]}
              >
                <View style={styles.nomineeLeft}>
                  <Text style={[styles.holdingName, { color: colors.textPrimary }]}>
                    {item.holdingName}
                  </Text>
                  <Text style={[styles.folioText, { color: colors.textMuted }]}>
                    Folio: {item.accountOrFolio} • {item.custodian}
                  </Text>
                  <Text
                    style={[
                      styles.claimInfo,
                      { color: item.isRegistered ? colors.success : colors.danger },
                    ]}
                  >
                    {item.isRegistered
                      ? `✓ Nominee: ${item.nomineeName} (${item.nomineeRelationship})`
                      : "⚠️ NO NOMINEE REGISTERED - ASSET AT TRANSMISSION RISK"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor: item.isRegistered ? colors.surface : colors.brand,
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => toggleNominee(item)}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      { color: item.isRegistered ? colors.textPrimary : "#000000" },
                    ]}
                  >
                    {item.isRegistered ? "Edit" : "+ Designate"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* Footer Action */}
          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.brand }]}
              onPress={handleExportPlaybook}
            >
              <Ionicons name="document-text-outline" size={18} color="#000000" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>
                {playbookGenerated ? "Re-Generate Playbook" : "1-Click Generate Family Emergency Playbook"}
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
    gap: 16,
  },
  scoreBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  scoreLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  scoreSub: {
    fontSize: 12,
    marginTop: 4,
  },
  scoreCircle: {
    width: 52,
    height: 52,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  scoreNumber: {
    fontSize: 16,
    fontWeight: "800",
  },
  sectionBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
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
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
  },
  nomineeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  nomineeLeft: {
    flex: 1,
    marginRight: 10,
  },
  holdingName: {
    fontSize: 14,
    fontWeight: "600",
  },
  folioText: {
    fontSize: 11,
    marginTop: 2,
  },
  claimInfo: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: "700",
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
