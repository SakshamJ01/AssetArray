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
import { HoldingDraft, ASSET_CLASS_OPTIONS } from "../../types/wealth";

export interface HoldingEditorModalProps {
  visible: boolean;
  isDesktop: boolean;
  portfolioMode: "add" | "edit";
  holdingDraft: HoldingDraft;
  updateHoldingDraft: <K extends keyof HoldingDraft>(key: K, value: HoldingDraft[K]) => void;
  onClose: () => void;
  onSave: () => void;
  theme: AppTheme;
}

export const HoldingEditorModal: React.FC<HoldingEditorModalProps> = ({
  visible,
  isDesktop,
  portfolioMode,
  holdingDraft,
  updateHoldingDraft,
  onClose,
  onSave,
  theme,
}) => {
  return (
    <Modal visible={visible} transparent animationType={isDesktop ? "fade" : "slide"}>
      <View style={[styles.modalBackdrop, isDesktop && styles.modalBackdropCenter]}>
        <View style={[styles.modalCard, isDesktop && styles.modalCardCenter]}>
          <Text style={styles.modalTitle}>
            {portfolioMode === "add" ? "Add portfolio item" : "Edit portfolio item"}
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TextInput
              value={holdingDraft.assetName}
              onChangeText={(value) => updateHoldingDraft("assetName", value)}
              placeholder="Asset name"
              placeholderTextColor="#7f90a8"
              style={styles.input}
            />
            <Text style={styles.inputLabel}>Asset class</Text>
            <View style={styles.optionRow}>
              {ASSET_CLASS_OPTIONS.map((option) => {
                const active = holdingDraft.assetClass === option;
                return (
                  <Pressable
                    key={option}
                    style={[styles.optionChip, active ? styles.optionChipActive : null]}
                    onPress={() => updateHoldingDraft("assetClass", option)}
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
              value={holdingDraft.ticker}
              onChangeText={(value) => updateHoldingDraft("ticker", value)}
              placeholder="Ticker or label"
              placeholderTextColor="#7f90a8"
              style={styles.input}
            />
            <TextInput
              value={holdingDraft.quantity}
              onChangeText={(value) => updateHoldingDraft("quantity", value)}
              placeholder="Quantity"
              placeholderTextColor="#7f90a8"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              value={holdingDraft.investedValue}
              onChangeText={(value) => updateHoldingDraft("investedValue", value)}
              placeholder="Invested value"
              placeholderTextColor="#7f90a8"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              value={holdingDraft.currentValue}
              onChangeText={(value) => updateHoldingDraft("currentValue", value)}
              placeholder="Current value"
              placeholderTextColor="#7f90a8"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              value={holdingDraft.targetWeight}
              onChangeText={(value) => updateHoldingDraft("targetWeight", value)}
              placeholder="Target weight, e.g. 15%"
              placeholderTextColor="#7f90a8"
              style={styles.input}
            />
            <TextInput
              value={holdingDraft.notes}
              onChangeText={(value) => updateHoldingDraft("notes", value)}
              placeholder="Holding notes"
              placeholderTextColor="#7f90a8"
              multiline
              style={[styles.input, styles.notesInput]}
            />
          </ScrollView>
          <View style={styles.modalActions}>
            <Pressable style={styles.modalSecondary} onPress={onClose}>
              <Text style={styles.modalSecondaryText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.primaryButton, { backgroundColor: theme.colors.brand }]} onPress={onSave}>
              <Text style={[styles.primaryButtonText, { color: "#030712" }]}>Save Holding</Text>
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
