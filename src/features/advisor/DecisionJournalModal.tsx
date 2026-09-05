import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AdvisorDecision } from "../../types/advisor";
import { Client } from "../../types/wealth";
import { AppTheme } from "../../theme";
import { getDecisions, recordDecision } from "../../services/advisor/decisionJournal";

export interface DecisionJournalModalProps {
  visible: boolean;
  preselectedClientId?: string | null;
  clients: Client[];
  theme: AppTheme;
  onClose: () => void;
  onDecisionLogged?: (decision: AdvisorDecision) => void;
}

export const DecisionJournalModal: React.FC<DecisionJournalModalProps> = ({
  visible,
  preselectedClientId,
  clients,
  theme,
  onClose,
  onDecisionLogged,
}) => {
  const [decisions, setDecisions] = useState<AdvisorDecision[]>([]);
  const [activeTab, setActiveTab] = useState<"NEW" | "HISTORY">("NEW");

  // Form State
  const [selectedClient, setSelectedClient] = useState<string>(preselectedClientId || "");
  const [issue, setIssue] = useState("");
  const [evidence, setEvidence] = useState("");
  const [decisionText, setDecisionText] = useState("");
  const [rationale, setRationale] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (preselectedClientId) {
        setSelectedClient(preselectedClientId);
      } else if (clients.length > 0 && !selectedClient) {
        setSelectedClient(clients[0].id);
      }
      loadHistory();
    }
  }, [visible, preselectedClientId, clients]);

  const loadHistory = async () => {
    const list = await getDecisions();
    setDecisions(list);
  };

  const handleSubmit = async () => {
    if (!selectedClient || !issue.trim() || !decisionText.trim()) {
      Alert.alert("Required Fields", "Please select a client and fill in the Issue and Decision.");
      return;
    }

    const clientObj = clients.find((c) => c.id === selectedClient);
    const clientName = clientObj?.name || "Client Mandate";

    setIsSubmitting(true);
    try {
      const rec = await recordDecision({
        date: new Date().toISOString().split("T")[0],
        clientId: selectedClient,
        clientName,
        portfolioId: `port_${selectedClient}`,
        issue: issue.trim(),
        evidence: evidence.trim() || "Fiduciary portfolio audit",
        decision: decisionText.trim(),
        rationale: rationale.trim() || "Preserve fiduciary mandate risk guidelines",
        advisorFollowUp: followUp.trim() || "Review upon next scheduled touchpoint",
        status: "RECORDED",
      });

      if (onDecisionLogged) {
        onDecisionLogged(rec);
      }

      // Reset form
      setIssue("");
      setEvidence("");
      setDecisionText("");
      setRationale("");
      setFollowUp("");
      setActiveTab("HISTORY");
      await loadHistory();
    } catch (err) {
      console.warn("Error logging decision:", err);
      Alert.alert("Error", "Could not record decision into audit log.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <View
          style={[
            styles.container,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          {/* Header */}
          <View style={[styles.topBar, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconWrap, { backgroundColor: theme.colors.surfaceMuted }]}>
                <Ionicons name="journal" size={16} color={theme.colors.brand} />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                  FIDUCIARY DECISION JOURNAL
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.brand }]}>
                  AUDITABLE ADVISOR RATIONALE & GOVERNANCE
                </Text>
              </View>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={theme.colors.textPrimary} />
            </Pressable>
          </View>

          {/* Sub Navigation */}
          <View style={[styles.tabBar, { borderBottomColor: theme.colors.border }]}>
            <Pressable
              onPress={() => setActiveTab("NEW")}
              style={[
                styles.tabItem,
                activeTab === "NEW" && [
                  styles.tabItemActive,
                  { borderBottomColor: theme.colors.brand },
                ],
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "NEW" ? theme.colors.textPrimary : theme.colors.textMuted,
                    fontWeight: activeTab === "NEW" ? "800" : "600",
                  },
                ]}
              >
                Log New Decision
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab("HISTORY")}
              style={[
                styles.tabItem,
                activeTab === "HISTORY" && [
                  styles.tabItemActive,
                  { borderBottomColor: theme.colors.brand },
                ],
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "HISTORY" ? theme.colors.textPrimary : theme.colors.textMuted,
                    fontWeight: activeTab === "HISTORY" ? "800" : "600",
                  },
                ]}
              >
                Audit Log History ({decisions.length})
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {activeTab === "NEW" ? (
              <View style={styles.formContainer}>
                {/* Client Picker */}
                <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>
                  TARGET CLIENT MANDATE *
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clientPickerScroll}>
                  {clients.map((c) => {
                    const isSelected = selectedClient === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => setSelectedClient(c.id)}
                        style={[
                          styles.clientChip,
                          {
                            backgroundColor: isSelected
                              ? theme.colors.brand
                              : theme.colors.surfaceMuted,
                            borderColor: theme.colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.clientChipText,
                            {
                              color: isSelected ? "#000000" : theme.colors.textSecondary,
                              fontWeight: isSelected ? "800" : "600",
                            },
                          ]}
                        >
                          {c.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Issue Field */}
                <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>
                  ISSUE OR STRATEGIC TRIGGER *
                </Text>
                <TextInput
                  placeholder="e.g. Technology exposure concentration 27.4% vs 20% limit"
                  placeholderTextColor={theme.colors.textMuted}
                  value={issue}
                  onChangeText={setIssue}
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: theme.colors.surfaceMuted,
                      borderColor: theme.colors.border,
                      color: theme.colors.textPrimary,
                    },
                  ]}
                />

                {/* Evidence Field */}
                <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>
                  DETERMINISTIC EVIDENCE / METRIC
                </Text>
                <TextInput
                  placeholder="e.g. Risk Engine concentration metric: TCS holding = 27.4%"
                  placeholderTextColor={theme.colors.textMuted}
                  value={evidence}
                  onChangeText={setEvidence}
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: theme.colors.surfaceMuted,
                      borderColor: theme.colors.border,
                      color: theme.colors.textPrimary,
                    },
                  ]}
                />

                {/* Decision Field */}
                <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>
                  ADVISOR DECISION *
                </Text>
                <TextInput
                  placeholder="e.g. Approve rebalancing to trim TCS by 7.4% and deploy into broad index"
                  placeholderTextColor={theme.colors.textMuted}
                  value={decisionText}
                  onChangeText={setDecisionText}
                  multiline
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: theme.colors.surfaceMuted,
                      borderColor: theme.colors.border,
                      color: theme.colors.textPrimary,
                    },
                  ]}
                />

                {/* Rationale Field */}
                <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>
                  FIDUCIARY RATIONALE
                </Text>
                <TextInput
                  placeholder="e.g. Mitigate single-stock drawdown risk while preserving equity beta"
                  placeholderTextColor={theme.colors.textMuted}
                  value={rationale}
                  onChangeText={setRationale}
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: theme.colors.surfaceMuted,
                      borderColor: theme.colors.border,
                      color: theme.colors.textPrimary,
                    },
                  ]}
                />

                {/* Follow-up Field */}
                <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>
                  FOLLOW-UP ACTION & DATE
                </Text>
                <TextInput
                  placeholder="e.g. Client review scheduled on September 15"
                  placeholderTextColor={theme.colors.textMuted}
                  value={followUp}
                  onChangeText={setFollowUp}
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: theme.colors.surfaceMuted,
                      borderColor: theme.colors.border,
                      color: theme.colors.textPrimary,
                    },
                  ]}
                />

                {/* Submit Button */}
                <Pressable
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  style={[styles.submitBtn, { backgroundColor: theme.colors.brand }]}
                >
                  <Ionicons name="shield-checkmark" size={15} color="#000000" />
                  <Text style={styles.submitBtnText}>
                    {isSubmitting ? "RECORDING..." : "COMMIT TO AUDIT LOG"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.historyContainer}>
                {decisions.length === 0 ? (
                  <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                    No decisions recorded in journal yet.
                  </Text>
                ) : (
                  decisions.map((dec) => (
                    <View
                      key={dec.id}
                      style={[
                        styles.decisionCard,
                        {
                          backgroundColor: theme.colors.surfaceMuted,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <View style={styles.decisionCardHeader}>
                        <Text style={[styles.decClientName, { color: theme.colors.brand }]}>
                          {dec.clientName}
                        </Text>
                        <Text style={[styles.decDate, { color: theme.colors.textMuted }]}>
                          {dec.date}
                        </Text>
                      </View>

                      <Text style={[styles.decIssue, { color: theme.colors.textPrimary }]}>
                        Issue: {dec.issue}
                      </Text>
                      <Text style={[styles.decEvidence, { color: theme.colors.textSecondary }]}>
                        Evidence: {dec.evidence}
                      </Text>

                      <View
                        style={[
                          styles.decDecisionBox,
                          {
                            backgroundColor: theme.colors.surfaceStrong,
                            borderColor: theme.colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.decDecisionText, { color: theme.colors.textPrimary }]}>
                          <Text style={{ fontWeight: "800", color: theme.colors.accent }}>
                            Decision:{" "}
                          </Text>
                          {dec.decision}
                        </Text>
                        <Text style={[styles.decRationaleText, { color: theme.colors.textSecondary }]}>
                          <Text style={{ fontWeight: "700" }}>Rationale: </Text>
                          {dec.rationale}
                        </Text>
                      </View>

                      {dec.advisorFollowUp && (
                        <Text style={[styles.decFollowUp, { color: theme.colors.textMuted }]}>
                          Follow-up: {dec.advisorFollowUp}
                        </Text>
                      )}
                    </View>
                  ))
                )}
              </View>
            )}
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
  container: {
    width: "100%",
    maxWidth: 620,
    maxHeight: "90%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 6,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    gap: 8,
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 12,
  },
  scrollArea: {
    padding: 16,
  },
  formContainer: {
    paddingBottom: 20,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 4,
  },
  clientPickerScroll: {
    flexDirection: "row",
    marginBottom: 6,
  },
  clientChip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
  },
  clientChipText: {
    fontSize: 11,
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    marginBottom: 4,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    minHeight: 50,
    marginBottom: 4,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 16,
  },
  submitBtnText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  historyContainer: {
    paddingBottom: 20,
  },
  emptyText: {
    fontSize: 12,
    textAlign: "center",
    marginVertical: 20,
    fontStyle: "italic",
  },
  decisionCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  decisionCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  decClientName: {
    fontSize: 12,
    fontWeight: "800",
  },
  decDate: {
    fontSize: 10,
  },
  decIssue: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  decEvidence: {
    fontSize: 11,
    fontStyle: "italic",
    marginBottom: 8,
  },
  decDecisionBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  decDecisionText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  decRationaleText: {
    fontSize: 11,
    lineHeight: 15,
  },
  decFollowUp: {
    fontSize: 10,
    marginTop: 2,
  },
});
