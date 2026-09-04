import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";
import { AppTheme } from "../../theme";
import { CloudSettings, AuthSession } from "../../types/wealth";

export interface SyncConfigModalProps {
  visible: boolean;
  isDesktop: boolean;
  cloudSettings: CloudSettings;
  setCloudSettings: React.Dispatch<React.SetStateAction<CloudSettings>>;
  defaultBackendEndpoint: string;
  authState: string;
  authSession: AuthSession | null;
  onLogout: () => void;
  onClose: () => void;
  onSave: () => void;
  theme: AppTheme;
}

export const SyncConfigModal: React.FC<SyncConfigModalProps> = ({
  visible,
  isDesktop,
  cloudSettings,
  setCloudSettings,
  defaultBackendEndpoint,
  authState,
  authSession,
  onLogout,
  onClose,
  onSave,
  theme,
}) => {
  return (
    <Modal visible={visible} transparent animationType={isDesktop ? "fade" : "slide"}>
      <View style={[styles.modalBackdrop, isDesktop && styles.modalBackdropCenter]}>
        <View style={[styles.modalCard, isDesktop && styles.modalCardCenter]}>
          <Text style={styles.modalTitle}>Encrypted cloud sync</Text>
          <Text style={styles.panelSubtitle}>
            Asset Array encrypts data on-device before it leaves your phone.
          </Text>
          <TextInput
            value={cloudSettings.ownerName}
            onChangeText={(value) =>
              setCloudSettings((current) => ({ ...current, ownerName: value }))
            }
            placeholder="Owner name"
            placeholderTextColor="#7f90a8"
            style={styles.input}
          />
          <TextInput
            value={cloudSettings.endpoint}
            onChangeText={(value) =>
              setCloudSettings((current) => ({ ...current, endpoint: value }))
            }
            placeholder="Backend URL (https://assetarray.onrender.com)"
            placeholderTextColor="#7f90a8"
            autoCapitalize="none"
            style={styles.input}
          />
          {!cloudSettings.endpoint.trim() ? (
            <Pressable
              style={{ alignSelf: "flex-start", marginTop: 4, marginBottom: 8 }}
              onPress={() =>
                setCloudSettings((current) => ({
                  ...current,
                  endpoint: defaultBackendEndpoint,
                  authUsername: current.authUsername || "admin",
                }))
              }
            >
              <Text style={{ color: theme.colors.brand, fontSize: 12, fontWeight: "700" }}>
                ✦ Auto-fill Cloud Backend ({defaultBackendEndpoint})
              </Text>
            </Pressable>
          ) : null}
          <Text style={styles.detailBlock}>Auth status: {authState}</Text>
          {authSession ? (
            <Pressable style={styles.linkButton} onPress={onLogout}>
              <Text style={styles.linkButtonText}>Sign Out</Text>
            </Pressable>
          ) : null}
          <View style={styles.modalActions}>
            <Pressable style={styles.modalSecondary} onPress={onClose}>
              <Text style={styles.modalSecondaryText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.primaryButton, { backgroundColor: theme.colors.brand }]} onPress={onSave}>
              <Text style={[styles.primaryButtonText, { color: "#030712" }]}>Save Sync Settings</Text>
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
    marginBottom: 6,
  },
  panelSubtitle: {
    color: "#94a3b8",
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
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
  detailBlock: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 10,
    borderRadius: 10,
    color: "#94a3b8",
    fontSize: 13,
    marginVertical: 6,
  },
  linkButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  linkButtonText: {
    color: "#f43f5e",
    fontWeight: "700",
    fontSize: 13,
  },
});
