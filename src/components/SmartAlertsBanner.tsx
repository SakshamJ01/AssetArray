import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SmartAlert } from "../types/wealth";
import { AppTheme } from "../theme";

interface SmartAlertsBannerProps {
  theme: AppTheme;
  alerts: SmartAlert[];
  onDismissAlert?: (id: string) => void;
  onPressAlert?: (alert: SmartAlert) => void;
}

export const SmartAlertsBanner: React.FC<SmartAlertsBannerProps> = ({
  theme,
  alerts,
  onDismissAlert,
  onPressAlert,
}) => {
  const { colors } = theme;

  if (!alerts || alerts.length === 0) return null;

  return (
    <View style={styles.container}>
      {alerts.slice(0, 3).map((alert) => {
        const isCritical = alert.severity === "critical";
        const isWarning = alert.severity === "warning";
        const alertColor = isCritical
          ? colors.danger
          : isWarning
          ? colors.warning
          : colors.accent;
        const alertBg = isCritical
          ? colors.dangerSoft
          : isWarning
          ? colors.warningSoft
          : colors.accentSoft;

        return (
          <Pressable
            key={alert.id}
            onPress={() => onPressAlert?.(alert)}
            style={[
              styles.alertCard,
              { backgroundColor: alertBg, borderColor: alertColor },
            ]}
          >
            <Ionicons
              name={
                isCritical
                  ? "alert-circle"
                  : isWarning
                  ? "warning-outline"
                  : "information-circle-outline"
              }
              size={18}
              color={alertColor}
              style={styles.icon}
            />

            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: alertColor }]}>
                {alert.title} • {alert.clientName}
              </Text>
              <Text style={[styles.message, { color: colors.textPrimary }]}>
                {alert.message}
              </Text>
            </View>

            {onDismissAlert && (
              <Pressable
                onPress={() => onDismissAlert(alert.id)}
                style={styles.dismissBtn}
              >
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </Pressable>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    gap: 8,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  icon: {
    marginRight: 10,
    marginTop: 1,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "500",
  },
  dismissBtn: {
    padding: 4,
    marginLeft: 6,
  },
});
