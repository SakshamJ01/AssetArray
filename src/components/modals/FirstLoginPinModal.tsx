import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppTheme } from "../../theme";
import { triggerSuccessHaptic } from "../../services/haptics";

export interface FirstLoginPinModalProps {
  visible: boolean;
  isDesktop: boolean;
  advisorName?: string;
  theme: AppTheme;
  onSavePin: (pin: string) => Promise<void> | void;
  onSkip: () => void;
}

export const FirstLoginPinModal: React.FC<FirstLoginPinModalProps> = ({
  visible,
  isDesktop,
  advisorName,
  theme,
  onSavePin,
  onSkip,
}) => {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!visible) return null;

  const handleSubmit = async () => {
    setErrorMsg(null);
    const cleanPin = pin.trim();
    const cleanConfirm = confirmPin.trim();

    if (cleanPin.length < 4 || cleanPin.length > 6) {
      setErrorMsg("PIN must be 4 to 6 digits.");
      return;
    }
    if (!/^\d+$/.test(cleanPin)) {
      setErrorMsg("PIN must contain only numbers.");
      return;
    }
    if (cleanPin !== cleanConfirm) {
      setErrorMsg("PINs do not match. Please re-enter.");
      return;
    }

    try {
      setIsSaving(true);
      await onSavePin(cleanPin);
      await triggerSuccessHaptic();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save PIN.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType={isDesktop ? "fade" : "slide"}>
      <View style={[styles.backdrop, isDesktop && styles.backdropCenter]}>
        <View
          style={[
            styles.card,
            isDesktop && styles.cardCenter,
            {
              backgroundColor: theme.colors.surface,
              borderColor: "rgba(224, 168, 76, 0.35)",
            },
          ]}
        >
          {/* Header Icon */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="key" size={24} color="#E0A84C" />
            </View>
            <Text style={[styles.eyebrow, { color: theme.colors.brand }]}>
              DESK SECURITY ONBOARDING
            </Text>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              {advisorName ? `Welcome, ${advisorName}` : "Create Your Desk PIN"}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Choose a personal 4-6 digit numeric PIN to lock your workstation and protect confidential client wealth records.
            </Text>
          </View>

          {/* Error Message */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#F87171" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              New Desk PIN (4-6 Digits)
            </Text>
            <TextInput
              value={pin}
              onChangeText={(val) => {
                setPin(val);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Enter 4-6 digit PIN"
              placeholderTextColor="#64748B"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surfaceStrong,
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                },
              ]}
            />

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Confirm Desk PIN
            </Text>
            <TextInput
              value={confirmPin}
              onChangeText={(val) => {
                setConfirmPin(val);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Re-enter your PIN"
              placeholderTextColor="#64748B"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surfaceStrong,
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                },
              ]}
              onSubmitEditing={() => void handleSubmit()}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              onPress={() => void handleSubmit()}
              disabled={isSaving}
              style={[
                styles.primaryBtn,
                { backgroundColor: theme.colors.brand },
                isSaving && styles.btnDisabled,
              ]}
            >
              <Text style={styles.primaryBtnText}>
                {isSaving ? "Saving..." : "Set Desk PIN & Enter"}
              </Text>
            </Pressable>

            <Pressable onPress={onSkip} style={styles.skipBtn}>
              <Text style={[styles.skipBtnText, { color: theme.colors.textSecondary }]}>
                Keep default PIN (0000) for now
              </Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  backdropCenter: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    width: "100%",
  },
  cardCenter: {
    maxWidth: 440,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(224, 168, 76, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(224, 168, 76, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  form: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 14,
  },
  actions: {
    gap: 10,
  },
  primaryBtn: {
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#030712",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  skipBtn: {
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  skipBtnText: {
    fontSize: 12,
    textDecorationLine: "underline",
  },
});
