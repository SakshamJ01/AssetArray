import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { AppTheme } from "../../theme";
import { AboutSheet } from "../../types/wealth";

export interface AboutLegalModalProps {
  visible: boolean;
  isDesktop: boolean;
  aboutSheet: AboutSheet | null;
  onClose: () => void;
  theme: AppTheme;
}

export const AboutLegalModal: React.FC<AboutLegalModalProps> = ({
  visible,
  isDesktop,
  aboutSheet,
  onClose,
  theme,
}) => {
  return (
    <Modal visible={visible} transparent animationType={isDesktop ? "fade" : "slide"}>
      <View style={[styles.modalBackdrop, isDesktop && styles.modalBackdropCenter]}>
        <View style={[styles.modalCard, isDesktop && styles.modalCardCenter]}>
          <Text style={styles.modalTitle}>{aboutSheet || "About Asset Array"}</Text>
          {aboutSheet === "Privacy Policy" ? (
            <Text style={styles.detailBlock}>
              Asset Array stores advisor and client records locally on-device and only sends encrypted
              cloud backups or authenticated service requests when you explicitly trigger them. Sensitive
              data such as PIN lock settings, login tokens, and privacy controls remain protected with
              secure local storage. Before public launch, replace this in-app policy summary with your
              final legal privacy policy URL and approved compliance text.
            </Text>
          ) : aboutSheet === "Terms & Conditions" ? (
            <Text style={styles.detailBlock}>
              Asset Array is an advisor workspace tool for client tracking, portfolio visibility,
              communication workflows, and research support. You are responsible for validating any
              market content, campaign output, or portfolio commentary before sharing it with clients.
              Before store submission, replace this in-app summary with your final legal terms and
              regulated business disclosures.
            </Text>
          ) : null}
          <View style={styles.modalActions}>
            <Pressable
              style={[styles.primaryButton, { backgroundColor: theme.colors.brand }]}
              onPress={onClose}
            >
              <Text style={[styles.primaryButtonText, { color: "#030712" }]}>Close</Text>
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
  detailBlock: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 12,
    borderRadius: 12,
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  primaryButton: {
    flex: 1,
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
