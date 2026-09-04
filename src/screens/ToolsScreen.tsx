import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AppTheme } from "../theme";

interface ToolsScreenProps {
  theme: AppTheme;
}

export const ToolsScreen: React.FC<ToolsScreenProps> = ({ theme }) => {
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Financial Planning Calculators</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Access SIP, Cash Flow, Goal Planner, and Retirement Calculators.
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
