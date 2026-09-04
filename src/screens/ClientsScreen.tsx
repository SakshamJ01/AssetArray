import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AppTheme } from "../theme";

interface ClientsScreenProps {
  theme: AppTheme;
  clientCount: number;
}

export const ClientsScreen: React.FC<ClientsScreenProps> = ({ theme, clientCount }) => {
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Client Directory</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Managing {clientCount} active wealth management clients.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
});
