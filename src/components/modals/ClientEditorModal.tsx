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
import { AppTheme } from "../../theme";
import {
  ClientDraft,
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
  CHANNEL_OPTIONS,
} from "../../types/wealth";

export interface ClientEditorModalProps {
  visible: boolean;
  isDesktop: boolean;
  editorMode: "add" | "edit";
  draft: ClientDraft;
  updateDraft: <K extends keyof ClientDraft>(key: K, value: ClientDraft[K]) => void;
  onClose: () => void;
  onSubmit: () => void;
  theme: AppTheme;
}

export const ClientEditorModal: React.FC<ClientEditorModalProps> = ({
  visible,
  isDesktop,
  editorMode,
  draft,
  updateDraft,
  onClose,
  onSubmit,
  theme,
}) => {
  return (
    <Modal visible={visible} transparent animationType={isDesktop ? "fade" : "slide"}>
      <View style={[styles.modalBackdrop, isDesktop && styles.modalBackdropCenter]}>
        <View style={[styles.modalCard, isDesktop && styles.modalCardCenter]}>
          <Text style={styles.modalTitle}>
            {editorMode === "add" ? "Add client" : "Edit client"}
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TextInput
              value={draft.name}
              onChangeText={(value) => updateDraft("name", value)}
              placeholder="Client name"
              placeholderTextColor="#7f90a8"
              style={styles.input}
            />
            <TextInput
              value={draft.phone}
              onChangeText={(value) => updateDraft("phone", value)}
              placeholder="Phone number"
              placeholderTextColor="#7f90a8"
              keyboardType="phone-pad"
              style={styles.input}
            />
            <TextInput
              value={draft.email}
              onChangeText={(value) => updateDraft("email", value)}
              placeholder="Email address"
              placeholderTextColor="#7f90a8"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
            <TextInput
              value={draft.city}
              onChangeText={(value) => updateDraft("city", value)}
              placeholder="City"
              placeholderTextColor="#7f90a8"
              style={styles.input}
            />
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.optionRow}>
              {CATEGORY_OPTIONS.map((option) => {
                const active = draft.category === option;
                return (
                  <Pressable
                    key={option}
                    style={[styles.optionChip, active ? styles.optionChipActive : null]}
                    onPress={() => updateDraft("category", option)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        active ? styles.optionChipTextActive : null,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              value={draft.riskProfile}
              onChangeText={(value) => updateDraft("riskProfile", value)}
              placeholder="Risk profile"
              placeholderTextColor="#7f90a8"
              style={styles.input}
            />
            <TextInput
              value={draft.allocation}
              onChangeText={(value) => updateDraft("allocation", value)}
              placeholder="Allocation summary"
              placeholderTextColor="#7f90a8"
              style={styles.input}
            />
            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.optionRow}>
              {PRIORITY_OPTIONS.map((option) => {
                const active = draft.priority === option;
                return (
                  <Pressable
                    key={option}
                    style={[styles.optionChip, active ? styles.optionChipActive : null]}
                    onPress={() => updateDraft("priority", option)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        active ? styles.optionChipTextActive : null,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.inputLabel}>Preferred contact channel</Text>
            <View style={styles.optionRow}>
              {CHANNEL_OPTIONS.map((option) => {
                const active = draft.preferredChannel === option;
                return (
                  <Pressable
                    key={option}
                    style={[styles.optionChip, active ? styles.optionChipActive : null]}
                    onPress={() => updateDraft("preferredChannel", option)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        active ? styles.optionChipTextActive : null,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              value={draft.watchlist}
              onChangeText={(value) => updateDraft("watchlist", value)}
              placeholder="Watchlist, comma separated"
              placeholderTextColor="#7f90a8"
              style={styles.input}
            />
            <TextInput
              value={draft.reminderDate}
              onChangeText={(value) => updateDraft("reminderDate", value)}
              placeholder="Next reminder date (YYYY-MM-DD)"
              placeholderTextColor="#7f90a8"
              style={styles.input}
            />
            <TextInput
              value={draft.notes}
              onChangeText={(value) => updateDraft("notes", value)}
              placeholder="Private notes"
              placeholderTextColor="#7f90a8"
              multiline
              style={[styles.input, styles.notesInput]}
            />
          </ScrollView>
          <View style={styles.modalActions}>
            <Pressable style={styles.modalSecondary} onPress={onClose}>
              <Text style={styles.modalSecondaryText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.primaryButton, { backgroundColor: theme.colors.brand }]} onPress={onSubmit}>
              <Text style={[styles.primaryButtonText, { color: "#030712" }]}>Save Client</Text>
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
    maxHeight: "90%",
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
    maxHeight: "85%",
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderColor: "rgba(224, 168, 76, 0.18)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.55,
    shadowRadius: 40,
    elevation: 20,
  },
  modalTitle: {
    color: "#eaf3ff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
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
    flex: 1,
    backgroundColor: "#E0A84C",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#030712",
    fontWeight: "700",
    fontSize: 14,
  },
  input: {
    backgroundColor: "#0d1527",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#f8fafc",
    fontSize: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1a263e",
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  inputLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
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
});
