import React, { useState } from "react";
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
import { Client, PortfolioHolding } from "../../types/wealth";
import { FamilyVaultService } from "../../services/intelligence/familyVaultService";
import { NomineeRecord } from "../../types/intelligence";

interface FamilyVaultModalProps {
  visible: boolean;
  onClose: () => void;
  client?: Client;
  isDark: boolean;
  colors: any;
}

export const FamilyVaultModal: React.FC<FamilyVaultModalProps> = ({
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

  const audit = FamilyVaultService.auditNominees(holdings, nomineeOverrides);

  const toggleNominee = (item: NomineeRecord) => {
    setNomineeOverrides((prev) => ({
      ...prev,
      [item.holdingId]: {
        name: item.isRegistered ? "" : emergencyContact.name,
        relationship: item.isRegistered ? "" : emergencyContact.relationship,
        registered: !item.isRegistered,
      },
    }));
  };

  const handleExportPlaybook = () => {
    const playbook = FamilyVaultService.generateEmergencyPlaybook({
      clientId: client?.id || "cli_default",
      clientName: client?.name || "Private Wealth Principal",
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
                    : `⚠️ ${audit.unregisteredCount} asset(s) missing verified nominees.`}
                </Text>
              </View>
              <View style={styles.scoreCircle}>
                <Text
                  style={[
                    styles.scoreNumber,
                    { color: audit.completenessScore >= 80 ? colors.success : colors.brand },
                  ]}
                >
                  {audit.completenessScore}%
                </Text>
              </View>
            </View>

            {/* Emergency Contact Setup */}
            <View style={[styles.sectionBox, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Primary Emergency Contact (Executor / Spouse)
              </Text>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Full Name</Text>
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border }]}
                    value={emergencyContact.name}
                    onChangeText={(v) => setEmergencyContact((p) => ({ ...p, name: v }))}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Relationship</Text>
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border }]}
                    value={emergencyContact.relationship}
                    onChangeText={(v) => setEmergencyContact((p) => ({ ...p, relationship: v }))}
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Phone Hotline</Text>
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border }]}
                    value={emergencyContact.phone}
                    onChangeText={(v) => setEmergencyContact((p) => ({ ...p, phone: v }))}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Secure Email</Text>
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border }]}
                    value={emergencyContact.email}
                    onChangeText={(v) => setEmergencyContact((p) => ({ ...p, email: v }))}
                  />
                </View>
              </View>
            </View>

            {/* Assets Audit Checklist */}
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
              Folios & Demat Accounts Nominee Ledger
            </Text>
            {audit.nominees.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.nomineeCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: item.isRegistered ? colors.border : colors.danger,
                  },
                ]}
              >
                <View style={styles.nomineeLeft}>
                  <Text style={[styles.holdingName, { color: colors.textPrimary }]}>
                    {item.holdingName}
                  </Text>
                  <Text style={[styles.folioText, { color: colors.textMuted }]}>
                    {item.custodian} • Folio: {item.accountOrFolio}
                  </Text>
                  <Text style={[styles.claimInfo, { color: colors.textSecondary }]}>
                    Nominee: {item.isRegistered ? `${item.nomineeName} (${item.nomineeRelationship})` : "❌ UNREGISTERED"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor: item.isRegistered ? colors.successSoft : colors.dangerSoft,
                    },
                  ]}
                  onPress={() => toggleNominee(item)}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      { color: item.isRegistered ? colors.success : colors.danger },
                    ]}
                  >
                    {item.isRegistered ? "Registered" : "Fix / Add"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.brand }]}
              onPress={handleExportPlaybook}
            >
              <Ionicons name="document-text-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
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
    borderRadius: 26,
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
    borderRadius: 10,
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
    borderRadius: 10,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
