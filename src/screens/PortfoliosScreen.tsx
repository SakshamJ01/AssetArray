import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AppTheme } from "../theme";

interface PortfoliosScreenProps {
  theme: AppTheme;
  totalAssetsValue: number;
}

export const PortfoliosScreen: React.FC<PortfoliosScreenProps> = ({ theme, totalAssetsValue }) => {
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Portfolio Overview</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Total Tracked Assets under Advisory: ${totalAssetsValue.toLocaleString()}
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
