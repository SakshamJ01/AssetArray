import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkflowKpis } from "../../types/advisor";
import { AppTheme } from "../../theme";

export interface WorkflowStatsProps {
  kpis: WorkflowKpis;
  theme: AppTheme;
}

export const WorkflowStats: React.FC<WorkflowStatsProps> = ({ kpis, theme }) => {
  const cards: Array<{
    label: string;
    value: string | number;
    sub: string;
    icon: keyof typeof Ionicons.glyphMap;
    tone: "neutral" | "warning" | "danger" | "accent";
  }> = [
    {
      label: "TASKS COMPLETED",
      value: kpis.tasksCompletedToday,
      sub: "Today's Operational Progress",
      icon: "checkbox-outline",
      tone: "accent",
    },
    {
      label: "OVERDUE TASKS",
      value: kpis.overdueTasksCount,
      sub: kpis.overdueTasksCount > 0 ? "Requires Catch-Up" : "All Tasks Current",
      icon: "alert-circle-outline",
      tone: kpis.overdueTasksCount > 0 ? "danger" : "accent",
    },
    {
      label: "REVIEWS COMPLETED",
      value: kpis.clientReviewsCompletedThisMonth,
      sub: "This Month's Mandates",
      icon: "calendar-outline",
      tone: "neutral",
    },
    {
      label: "REPORTS SENT",
      value: kpis.reportsSentThisMonth,
      sub: "Approved Wealth Statements",
      icon: "document-text-outline",
      tone: "neutral",
    },
    {
      label: "OPEN ALERTS",
      value: kpis.openAlertsCount,
      sub: "Active Governance Triggers",
      icon: "notifications-outline",
      tone: kpis.openAlertsCount > 5 ? "warning" : "neutral",
    },
    {
      label: "AVG RESOLUTION",
      value: `${kpis.avgResolutionTimeHours}h`,
      sub: "Resolution Velocity",
      icon: "timer-outline",
      tone: "accent",
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
        OPERATIONAL WORKFLOW & GOVERNANCE KPIS
      </Text>
      <View style={styles.grid}>
        {cards.map((card, idx) => {
          const color =
            card.tone === "danger"
              ? theme.colors.danger
              : card.tone === "warning"
              ? theme.colors.warning
              : card.tone === "accent"
              ? theme.colors.accent
              : theme.colors.brand;

          return (
            <View
              key={idx}
              style={[
                styles.card,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <View style={styles.headerRow}>
                <Text style={[styles.label, { color: theme.colors.textMuted }]}>
                  {card.label}
                </Text>
                <Ionicons name={card.icon} size={14} color={color} />
              </View>
              <Text style={[styles.value, { color }]}>{card.value}</Text>
              <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>
                {card.sub}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    flex: 1,
    minWidth: 140,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  label: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 16,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  sub: {
    fontSize: 9,
    marginTop: 2,
  },
});
