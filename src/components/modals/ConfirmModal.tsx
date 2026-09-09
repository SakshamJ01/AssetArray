import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { AppTheme } from "../../theme";

export interface ConfirmModalProps {
  visible: boolean;
  isDesktop: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  theme: AppTheme;
}

/**
 * Shared destructive-action confirmation. RN Alert.alert buttons do not
 * render on web, so deletes gated behind Alert.alert silently never execute
 * there — every destructive confirm in the app must use this modal instead.
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  isDesktop,
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
  theme,
}) => {
  return (
    <Modal visible={visible} transparent animationType={isDesktop ? "fade" : "slide"}>
      <View style={[styles.backdrop, isDesktop && styles.backdropCenter]}>
        <View style={[styles.card, isDesktop && styles.cardCenter, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={[styles.cancelBtn, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}
            >
              <Text style={[styles.cancelText, { color: theme.colors.textPrimary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[styles.confirmBtn, { backgroundColor: "rgba(239, 68, 68, 0.15)", borderColor: "#EF4444" }]}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  backdropCenter: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    width: "100%",
  },
  cardCenter: {
    maxWidth: 440,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "700",
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#EF4444",
  },
});
