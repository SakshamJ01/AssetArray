import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppTheme } from "../../theme";
import {
  Client,
  BroadcastChannel,
  CloudSettings,
  AuthSession,
  BROADCAST_CHANNEL_OPTIONS,
} from "../../types/wealth";

export interface BroadcastModalProps {
  visible: boolean;
  isDesktop: boolean;
  insetsBottom: number;
  onClose: () => void;
  onSend: () => void;
  broadcastChannel: BroadcastChannel;
  setBroadcastChannel: (channel: BroadcastChannel) => void;
  broadcastMessage: string;
  setBroadcastMessage: (msg: string) => void;
  clients: Client[];
  selectedClientIds: string[];
  setSelectedClientIds: (ids: string[]) => void;
  toggleSelectedClient: (id: string) => void;
  broadcastPreview: { eligible: Client[]; skipped: Array<{ name: string; reason: string }> };
  broadcastTargets: Client[];
  resolveBroadcastContact: (client: Client, channel: BroadcastChannel) => string;
  authSession: AuthSession | null;
  cloudSettings: CloudSettings;
  theme: AppTheme;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  visible,
  isDesktop,
  insetsBottom,
  onClose,
  onSend,
  broadcastChannel,
  setBroadcastChannel,
  broadcastMessage,
  setBroadcastMessage,
  clients,
  selectedClientIds,
  setSelectedClientIds,
  toggleSelectedClient,
  broadcastPreview,
  broadcastTargets,
  resolveBroadcastContact,
  authSession,
  cloudSettings,
  theme,
}) => {
  return (
    <Modal visible={visible} transparent animationType={isDesktop ? "fade" : "slide"}>
      <View style={[styles.modalBackdrop, isDesktop && styles.modalBackdropCenter]}>
        <View
          style={[
            styles.modalCard,
            isDesktop && styles.modalCardCenter,
            { height: "84%", paddingBottom: Math.max(insetsBottom, 16) },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.modalTitle}>Broadcast Center</Text>
              <Text style={styles.panelSubtitle}>
                One-tap mass outreach to selected high-net-worth clients.
              </Text>
            </View>
            <Pressable onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={26} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1, minHeight: 320 }}
            contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={styles.inputLabel}>Dispatch Channel</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor:
                      authSession && cloudSettings.endpoint.trim() ? theme.colors.accent : theme.colors.brand,
                  }}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color:
                      authSession && cloudSettings.endpoint.trim() ? theme.colors.accent : theme.colors.brand,
                  }}
                >
                  {authSession && cloudSettings.endpoint.trim() ? "Cloud Sync Active" : "Direct Device Dispatch"}
                </Text>
              </View>
            </View>

            <View style={styles.optionRow}>
              {BROADCAST_CHANNEL_OPTIONS.map((option) => {
                const active = broadcastChannel === option;
                return (
                  <Pressable
                    key={option}
                    style={[styles.optionChip, active ? styles.optionChipActive : null]}
                    onPress={() => setBroadcastChannel(option)}
                  >
                    <Text style={[styles.optionChipText, active ? styles.optionChipTextActive : null]}>
                      {option === "WhatsApp"
                        ? "💬 WhatsApp"
                        : option === "SMS"
                          ? "📱 SMS"
                          : option === "Email"
                            ? "✉️ Email"
                            : "✦ Preferred"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Advisory Brief</Text>
            <TextInput
              value={broadcastMessage}
              onChangeText={setBroadcastMessage}
              placeholder="Enter advisory brief for selected clients..."
              placeholderTextColor="#7f90a8"
              multiline
              style={[styles.input, styles.messageInput]}
            />

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.detailBlock}>
                Ready: {broadcastPreview.eligible.length} | Skipped: {broadcastPreview.skipped.length}
              </Text>
              {clients.length > 0 ? (
                <Pressable
                  onPress={() => {
                    if (selectedClientIds.length === clients.length) {
                      setSelectedClientIds([]);
                    } else {
                      setSelectedClientIds(clients.map((c) => c.id));
                    }
                  }}
                  style={styles.selectToggleBtn}
                >
                  <Text style={{ color: theme.colors.brand, fontSize: 11, fontWeight: "700" }}>
                    {selectedClientIds.length === clients.length ? "Deselect All" : "Select All"}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <Text style={styles.sectionLabel}>
              Targeted Clients ({broadcastTargets.length}/{clients.length})
            </Text>

            {clients.length === 0 ? (
              <Text style={styles.detailBlock}>No clients found. Add clients in the Clients tab.</Text>
            ) : (
              <View style={{ gap: 8 }}>
                {clients.map((client) => {
                  const isSelected = selectedClientIds.includes(client.id);
                  const contact = resolveBroadcastContact(client, broadcastChannel);
                  return (
                    <Pressable
                      key={client.id}
                      onPress={() => toggleSelectedClient(client.id)}
                      style={[
                        styles.historyItem,
                        {
                          backgroundColor: isSelected ? "rgba(224, 168, 76, 0.08)" : "rgba(255, 255, 255, 0.02)",
                          borderColor: isSelected ? theme.colors.brand : theme.colors.border,
                        },
                      ]}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                        <Ionicons
                          name={isSelected ? "checkbox" : "square-outline"}
                          size={20}
                          color={isSelected ? theme.colors.brand : theme.colors.textMuted}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: theme.colors.textPrimary, fontWeight: "700", fontSize: 14 }}>
                            {client.name}
                          </Text>
                          <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 2 }}>
                            {client.category} • Preferred: {client.preferredChannel}
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text
                          style={{
                            color: contact ? theme.colors.textSecondary : theme.colors.danger,
                            fontSize: 12,
                            fontWeight: contact ? "500" : "700",
                          }}
                        >
                          {contact || "Missing contact"}
                        </Text>
                        {isSelected && contact ? (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.accent }} />
                            <Text style={{ color: theme.colors.accent, fontSize: 10, fontWeight: "700" }}>Ready</Text>
                          </View>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {broadcastPreview.skipped.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>Needs attention</Text>
                {broadcastPreview.skipped.map((skipItem, idx) => (
                  <Text key={`skip-${idx}`} style={styles.analyticsAlert}>
                    {skipItem.name}: {skipItem.reason}
                  </Text>
                ))}
              </>
            ) : null}
          </ScrollView>

          <View style={[styles.modalActions, { borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
            <Pressable style={styles.modalSecondary} onPress={onClose}>
              <Text style={styles.modalSecondaryText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.primaryButton, { flex: 2, backgroundColor: theme.colors.brand }]} onPress={onSend}>
              <Text style={[styles.primaryButtonText, { color: "#030712" }]}>
                {authSession && cloudSettings.endpoint.trim() ? "🚀 Dispatch Campaign" : "📱 Send via App"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  modalBackdropCenter: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: "#111a2e",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1c2842",
  },
  modalCardCenter: {
    width: "100%",
    maxWidth: 580,
    borderRadius: 20,
    borderColor: "rgba(224, 168, 76, 0.18)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.55,
    shadowRadius: 40,
    elevation: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  modalTitle: {
    color: "#eaf3ff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  panelSubtitle: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 18,
  },
  inputLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  optionChip: {
    backgroundColor: "#0d1527",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#1a263e",
  },
  optionChipActive: {
    backgroundColor: "rgba(224, 168, 76, 0.15)",
    borderColor: "#E0A84C",
  },
  optionChipText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  optionChipTextActive: {
    color: "#E0A84C",
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#0d1527",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#f8fafc",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#1a263e",
  },
  messageInput: {
    minHeight: 70,
    maxHeight: 110,
    textAlignVertical: "top",
  },
  detailBlock: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 8,
    borderRadius: 8,
    color: "#94a3b8",
    fontSize: 12,
  },
  selectToggleBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "rgba(224, 168, 76, 0.12)",
    borderRadius: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 8,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  analyticsAlert: {
    backgroundColor: "rgba(244, 63, 94, 0.1)",
    borderColor: "rgba(244, 63, 94, 0.25)",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    color: "#f43f5e",
    fontSize: 12,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 12,
    marginTop: 8,
  },
  modalSecondary: {
    flex: 1,
    backgroundColor: "#102240",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalSecondaryText: {
    color: "#bfd3ef",
    fontWeight: "700",
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontWeight: "700",
    fontSize: 14,
  },
});
