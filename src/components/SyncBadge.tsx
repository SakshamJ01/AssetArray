import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNetworkStatus } from "../services/network";

interface SyncBadgeProps {
  isSyncing?: boolean;
  syncState?: string;
  hasError?: boolean;
}

export const SyncBadge: React.FC<SyncBadgeProps> = ({
  isSyncing = false,
  syncState = "",
  hasError = false,
}) => {
  const { isOnline } = useNetworkStatus();

  let badgeColor = "#11c49b"; // Accent green
  let statusText = "Synced";
  let iconName: keyof typeof Ionicons.glyphMap = "cloud-done";

  const isFailed =
    hasError ||
    (Boolean(syncState) &&
      (syncState.toLowerCase().includes("failed") || syncState.toLowerCase().includes("error")));

  if (isSyncing) {
    badgeColor = "#3b82f6"; // Brand blue
    statusText = "Syncing...";
  } else if (!isOnline) {
    badgeColor = "#f0b44d"; // Warning yellow
    statusText = "Offline";
    iconName = "cloud-offline";
  } else if (isFailed) {
    badgeColor = "#ef4444"; // Danger red
    statusText = "Sync Error";
    iconName = "alert-circle";
  }

  return (
    <View style={[styles.container, { borderColor: badgeColor }]}>
      {isSyncing ? (
        <ActivityIndicator size="small" color={badgeColor} style={styles.spinner} />
      ) : (
        <Ionicons name={iconName} size={14} color={badgeColor} style={styles.icon} />
      )}
      <Text style={[styles.text, { color: badgeColor }]}>{statusText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  spinner: {
    marginRight: 4,
    transform: [{ scale: 0.7 }],
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
  },
});
