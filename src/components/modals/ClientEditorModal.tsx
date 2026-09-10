import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
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
  const isDark = theme.colors.background === "#030712" || theme.colors.textPrimary === "#ffffff" || theme.colors.textPrimary === "#FFFFFF";

  return (
    <Modal visible={visible} transparent animationType={isDesktop ? "fade" : "slide"}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={[styles.modalBackdrop, isDesktop && styles.modalBackdropCenter]}>
          <View style={[styles.modalCard, isDesktop && styles.modalCardCenter, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
              {editorMode === "add" ? "Add client" : "Edit client"}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput
                value={draft.name}
                onChangeText={(value) => updateDraft("name", value)}
                placeholder="Client name"
                placeholderTextColor={isDark ? "#7f90a8" : "#64748b"}
                style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]}
              />
              <TextInput
                value={draft.phone}
                onChangeText={(value) => updateDraft("phone", value)}
                placeholder="Phone number"
                placeholderTextColor={isDark ? "#7f90a8" : "#64748b"}
                keyboardType="phone-pad"
                style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]}
              />
              <TextInput
                value={draft.email}
                onChangeText={(value) => updateDraft("email", value)}
                placeholder="Email address"
                placeholderTextColor={isDark ? "#7f90a8" : "#64748b"}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]}
              />
              <TextInput
                value={draft.city}
                onChangeText={(value) => updateDraft("city", value)}
                placeholder="City"
                placeholderTextColor={isDark ? "#7f90a8" : "#64748b"}
                style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]}
              />
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Category</Text>
              <View style={styles.optionRow}>
                {CATEGORY_OPTIONS.map((option) => {
                  const active = draft.category === option;
                  return (
                    <Pressable
                      key={option}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
                placeholderTextColor={isDark ? "#7f90a8" : "#64748b"}
                style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]}
              />
              <TextInput
                value={draft.allocation}
                onChangeText={(value) => updateDraft("allocation", value)}
                placeholder="Allocation summary"
                placeholderTextColor={isDark ? "#7f90a8" : "#64748b"}
                style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]}
              />
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Priority</Text>
              <View style={styles.optionRow}>
                {PRIORITY_OPTIONS.map((option) => {
                  const active = draft.priority === option;
                  return (
                    <Pressable
                      key={option}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Preferred contact channel</Text>
              <View style={styles.optionRow}>
                {CHANNEL_OPTIONS.map((option) => {
                  const active = draft.preferredChannel === option;
                  return (
                    <Pressable
                      key={option}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
                placeholderTextColor={isDark ? "#7f90a8" : "#64748b"}
                style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]}
              />
              <TextInput
                value={draft.reminderDate}
                onChangeText={(value) => updateDraft("reminderDate", value)}
                placeholder="Next reminder date (YYYY-MM-DD)"
                placeholderTextColor={isDark ? "#7f90a8" : "#64748b"}
                style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]}
              />
              <TextInput
                value={draft.notes}
                onChangeText={(value) => updateDraft("notes", value)}
                placeholder="Private notes"
                placeholderTextColor={isDark ? "#7f90a8" : "#64748b"}
                multiline
                style={[styles.input, styles.notesInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]}
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.modalSecondary}
                onPress={onClose}
              >
                <Text style={[styles.modalSecondaryText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={[styles.primaryButton, { backgroundColor: theme.colors.brand }]}
                onPress={onSubmit}
              >
                <Text style={[styles.primaryButtonText, { color: "#030712" }]}>Save Client</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1c2842",
  },
  modalCardCenter: {
    width: "100%",
    maxWidth: 580,
    maxHeight: "85%",
    borderRadius: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
    borderRadius: 8,
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
    borderRadius: 8,
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
    borderRadius: 8,
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
    borderRadius: 8,
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
