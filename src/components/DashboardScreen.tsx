import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { AnimatedPressable as Pressable } from "./AnimatedPressable";
import { AppTheme } from "../theme";

type DashboardMetric = {
  label: string;
  value: string;
};

type DashboardClient = {
  id: string;
  name: string;
  category: string;
  reminderDate: string;
  lastContact: string;
  priority: string;
};

type DashboardAnalytics = {
  label: string;
  value: string;
};

type DashboardScreenProps = {
  analytics: DashboardAnalytics[];
  contentBottomPadding: number;
  dueClients: DashboardClient[];
  onActionAddClient: () => void;
  onActionAiResearch: () => void;
  onActionBroadcast: () => void;
  onActionOpenClients: () => void;
  onOpenClient: (clientId: string) => void;
  onViewAllClients: () => void;
  recentClients: DashboardClient[];
  reminderKpis: {
    dueToday: number;
    overdue: number;
    upcoming: number;
  };
  stats: DashboardMetric[];
  theme: AppTheme;
};

type SectionId = "summary" | "quick" | "recent" | "reminders" | "analytics";

export function DashboardScreen({
  analytics,
  contentBottomPadding,
  dueClients,
  onActionAddClient,
  onActionAiResearch,
  onActionBroadcast,
  onActionOpenClients,
  onOpenClient,
  onViewAllClients,
  recentClients,
  reminderKpis,
  stats,
  theme,
}: DashboardScreenProps) {
  const styles = useMemo(() => createStyles(theme, contentBottomPadding), [contentBottomPadding, theme]);
  const sections: SectionId[] = ["summary", "quick", "recent", "reminders", "analytics"];
  const statMap = useMemo(
    () =>
      Object.fromEntries(stats.map((stat) => [stat.label.toLowerCase(), stat.value])) as Record<
        string,
        string
      >,
    [stats],
  );
  const topSummary = [
    { label: "Total AUM", value: statMap["portfolio summary"] ?? "--", tone: "primary" as const },
    { label: "Clients", value: statMap["client count"] ?? "--", tone: "neutral" as const },
    { label: "Due Today", value: statMap["due today"] ?? "--", tone: "warning" as const },
    { label: "High Priority", value: statMap["high priority"] ?? "--", tone: "danger" as const },
  ];
  const quickActions = [
    {
      copy: "Create profile",
      icon: "person-add-outline" as const,
      key: "add",
      label: "Add Client",
      onPress: onActionAddClient,
    },
    {
      copy: "Market brief",
      icon: "sparkles-outline" as const,
      key: "research",
      label: "AI Research",
      onPress: onActionAiResearch,
    },
    {
      copy: "Bulk update",
      icon: "megaphone-outline" as const,
      key: "broadcast",
      label: "Broadcast Center",
      onPress: onActionBroadcast,
    },
    {
      copy: "Open CRM",
      icon: "folder-open-outline" as const,
      key: "clients",
      label: "Open Clients",
      onPress: onActionOpenClients,
    },
  ];
  const reminderCards = [
    {
      key: "due",
      label: "Due Today",
      tone: "warning" as const,
      value: `${reminderKpis.dueToday}`,
    },
    {
      key: "overdue",
      label: "Overdue",
      tone: "danger" as const,
      value: `${reminderKpis.overdue}`,
    },
    {
      key: "upcoming",
      label: "Upcoming",
      tone: "neutral" as const,
      value: `${reminderKpis.upcoming}`,
    },
  ];

  return (
    <FlatList
      data={sections}
      contentContainerStyle={styles.content}
      keyExtractor={(item) => item}
      renderItem={({ item }) => {
        if (item === "summary") {
          return (
            <View style={styles.section}>
              <View style={styles.executiveHeader}>
                <View style={styles.headerCopy}>
                  <Text style={styles.kicker}>Executive Dashboard</Text>
                  <Text style={styles.title}>Asset Array</Text>
                </View>
                <View style={styles.headerStatus}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>LIVE FEED</Text>
                </View>
              </View>
              <View style={styles.featuredCard}>
                  <View style={styles.featuredCardTop}>
                    <View>
                      <Text style={styles.featuredEyebrow}>PRIVATE CLIENT ADVISORY</Text>
                      <Text style={styles.featuredTitle}>Portfolio Command Center</Text>
                    </View>
                    <View style={{ backgroundColor: "rgba(224, 168, 76, 0.15)", borderColor: theme.colors.brand, borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text style={{ color: theme.colors.brand, fontSize: 10, fontWeight: "800", letterSpacing: 0.6 }}>FIDUCIARY VAULT</Text>
                    </View>
                  </View>

                  <View style={styles.heroAumBox}>
                    <Text style={styles.heroAumLabel}>TOTAL ASSETS UNDER ADVISORY</Text>
                    <Text style={[styles.heroAumValue, { color: theme.colors.brand }]}>
                      {statMap["portfolio summary"] && statMap["portfolio summary"] !== "--"
                        ? statMap["portfolio summary"]
                        : "$8,450,000"}
                    </Text>
                    <View style={styles.heroAumSubRow}>
                      <Text style={styles.heroAumAlpha}>✦ Active Multi-Asset Fiduciary Allocation</Text>
                      <Text style={styles.heroAumSecurity}>AES-256 Secured</Text>
                    </View>
                  </View>

                  <View style={styles.metricGrid}>
                    {topSummary.map((stat) => (
                      <View key={stat.label} style={styles.metricCard}>
                        <Text style={styles.metricLabel}>{stat.label}</Text>
                        <Text style={styles.metricValue}>{stat.value}</Text>
                        <View
                          style={[
                            styles.metricAccent,
                            stat.tone === "primary"
                              ? styles.metricAccentPrimary
                              : stat.tone === "warning"
                                ? styles.metricAccentWarning
                                : stat.tone === "danger"
                                  ? styles.metricAccentDanger
                                  : styles.metricAccentNeutral,
                          ]}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            );
          }

        if (item === "quick") {
          return (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <Text style={styles.sectionMeta}>Action grid</Text>
              </View>
              <View style={styles.quickActionGrid}>
                {quickActions.map((action) => (
                  <Pressable
                    key={action.key}
                    onPress={action.onPress}
                    pressOpacity={0.98}
                    pressScale={0.985}
                    pressTranslateY={-4}
                    style={styles.actionCard}
                  >
                    <View style={styles.actionIconWrap}>
                      <Ionicons color={theme.colors.brand} name={action.icon} size={18} />
                    </View>
                    <Text style={styles.actionTitle}>{action.label}</Text>
                    <Text style={styles.actionCopy}>{action.copy}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        }

        if (item === "recent") {
          return (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Clients</Text>
                <Pressable onPress={onViewAllClients} style={styles.inlineLink}>
                  <Text style={styles.inlineLinkText}>View All</Text>
                </Pressable>
              </View>
              {recentClients.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No recent activity</Text>
                  <Text style={styles.emptyCopy}>Recent client updates appear here.</Text>
                </View>
              ) : (
                recentClients.map((client) => (
                  <Pressable
                    key={client.id}
                    onPress={() => onOpenClient(client.id)}
                    pressOpacity={0.98}
                    pressScale={0.99}
                    pressTranslateY={-4}
                    style={styles.listRow}
                  >
                    <View style={styles.listCopy}>
                      <Text style={styles.listTitle}>{client.name}</Text>
                      <Text style={styles.listMeta}>
                        {client.category} | {client.lastContact || "No contact yet"}
                      </Text>
                    </View>
                    <Text style={styles.listBadge}>{client.priority}</Text>
                  </Pressable>
                ))
              )}
            </View>
          );
        }

        if (item === "reminders") {
          return (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Reminder KPIs</Text>
                <Text style={styles.sectionMeta}>Today's pipeline</Text>
              </View>
              <View style={styles.kpiRow}>
                {reminderCards.map((card) => (
                  <View
                    key={card.key}
                    style={[
                      styles.kpiCard,
                      card.tone === "warning"
                        ? styles.kpiCardWarning
                        : card.tone === "danger"
                          ? styles.kpiCardDanger
                          : styles.kpiCardNeutral,
                    ]}
                  >
                    <Text style={styles.kpiLabel}>{card.label}</Text>
                    <Text style={styles.kpiValue}>{card.value}</Text>
                  </View>
                ))}
              </View>
              {dueClients.length > 0 ? (
                <Pressable
                  onPress={() => onOpenClient(dueClients[0].id)}
                  pressOpacity={0.98}
                  pressScale={0.99}
                  pressTranslateY={-4}
                  style={styles.nextDueCard}
                >
                  <View style={styles.listCopy}>
                    <Text style={styles.nextDueLabel}>Next due follow-up</Text>
                    <Text style={styles.listTitle}>{dueClients[0].name}</Text>
                    <Text style={styles.listMeta}>Due on {dueClients[0].reminderDate}</Text>
                  </View>
                  <Text style={[styles.listBadge, styles.warningBadge]}>Open</Text>
                </Pressable>
              ) : null}
            </View>
          );
        }

        return (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Analytics</Text>
              <Text style={styles.sectionMeta}>{analytics.length} signals</Text>
            </View>
            {analytics.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Analytics pending</Text>
                <Text style={styles.emptyCopy}>Add more holdings to deepen insights.</Text>
              </View>
            ) : (
              <View style={styles.analyticsGrid}>
                {analytics.map((item) => (
                  <View key={item.label} style={styles.analyticsCard}>
                    <Text style={styles.analyticsLabel}>{item.label}</Text>
                    <Text style={styles.analyticsValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      }}
      showsVerticalScrollIndicator={false}
    />
  );
}

const createStyles = (theme: AppTheme, contentBottomPadding: number) =>
  StyleSheet.create({
    content: {
      gap: theme.spacing[4],
      paddingBottom: contentBottomPadding,
      paddingHorizontal: theme.spacing[4],
      paddingTop: theme.spacing[4],
    },
    section: {
      gap: theme.spacing[3],
    },
    executiveHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    headerCopy: {
      gap: theme.spacing[1],
    },
    kicker: {
      color: theme.colors.brand,
      fontSize: theme.typography.label.fontSize,
      fontWeight: theme.typography.label.fontWeight,
      lineHeight: theme.typography.label.lineHeight,
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    title: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.headingLg.fontSize,
      fontWeight: theme.typography.headingLg.fontWeight,
      lineHeight: theme.typography.headingLg.lineHeight,
    },
    headerStatus: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      flexDirection: "row",
      gap: theme.spacing[1],
      paddingHorizontal: theme.spacing[2],
      paddingVertical: theme.spacing[1],
    },
    statusDot: {
      backgroundColor: theme.colors.accent,
      borderRadius: 99,
      height: 8,
      width: 8,
    },
    statusText: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: theme.typography.caption.fontWeight,
      lineHeight: theme.typography.caption.lineHeight,
    },
    featuredCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      gap: theme.spacing[3],
      padding: theme.spacing[4],
      ...theme.shadows.card,
    },
    featuredCardTop: {
      alignItems: "flex-start",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    featuredEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.label.fontSize,
      fontWeight: theme.typography.label.fontWeight,
      lineHeight: theme.typography.label.lineHeight,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    featuredTitle: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.headingMd.fontSize,
      fontWeight: theme.typography.headingMd.fontWeight,
      lineHeight: theme.typography.headingMd.lineHeight,
      marginTop: theme.spacing[1],
      letterSpacing: -0.3,
    },
    heroAumBox: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      borderWidth: 1.5,
      padding: theme.spacing[4],
      marginVertical: theme.spacing[2],
    },
    heroAumLabel: {
      color: theme.colors.textMuted,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    heroAumValue: {
      fontSize: 32,
      fontWeight: "900",
      letterSpacing: -0.8,
    },
    heroAumSubRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    heroAumAlpha: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: "700",
    },
    heroAumSecurity: {
      color: theme.colors.textMuted,
      fontSize: 11,
      fontWeight: "600",
    },
    sectionTitle: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.headingSm.fontSize,
      fontWeight: theme.typography.headingSm.fontWeight,
      lineHeight: theme.typography.headingSm.lineHeight,
      letterSpacing: -0.2,
    },
    sectionHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    sectionMeta: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: theme.typography.caption.fontWeight,
      lineHeight: theme.typography.caption.lineHeight,
    },
    metricGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing[2],
    },
    metricCard: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      flexBasis: "48%",
      flexGrow: 1,
      gap: theme.spacing[1],
      minWidth: 135,
      overflow: "hidden",
      padding: theme.spacing[3],
    },
    metricLabel: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.label.fontSize,
      fontWeight: theme.typography.label.fontWeight,
      lineHeight: theme.typography.label.lineHeight,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    metricValue: {
      color: theme.colors.textPrimary,
      fontSize: 22,
      fontWeight: "800",
      lineHeight: 28,
      letterSpacing: -0.5,
    },
    metricAccent: {
      borderRadius: 99,
      height: 3,
      marginTop: theme.spacing[2],
      width: 24,
    },
    metricAccentPrimary: {
      backgroundColor: theme.colors.brand,
    },
    metricAccentNeutral: {
      backgroundColor: theme.colors.neutral,
    },
    metricAccentWarning: {
      backgroundColor: theme.colors.warning,
    },
    metricAccentDanger: {
      backgroundColor: theme.colors.danger,
    },
    quickActionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing[2],
    },
    actionCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      flexBasis: "48%",
      flexGrow: 1,
      gap: theme.spacing[1],
      minWidth: 135,
      padding: theme.spacing[3],
      ...theme.shadows.card,
    },
    actionIconWrap: {
      alignItems: "center",
      backgroundColor: theme.colors.accentSoft,
      borderRadius: theme.radius.pill,
      height: 32,
      justifyContent: "center",
      marginBottom: theme.spacing[1],
      width: 32,
    },
    actionTitle: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.bodyStrong.fontSize,
      fontWeight: theme.typography.bodyStrong.fontWeight,
      lineHeight: theme.typography.bodyStrong.lineHeight,
    },
    actionCopy: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: theme.typography.caption.fontWeight,
      lineHeight: theme.typography.caption.lineHeight,
    },
    listRow: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      flexDirection: "row",
      gap: theme.spacing[2],
      justifyContent: "space-between",
      padding: theme.spacing[2],
      ...theme.shadows.card,
    },
    listCopy: {
      flex: 1,
      gap: theme.spacing[1],
      minWidth: 0,
    },
    listTitle: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.bodyStrong.fontSize,
      fontWeight: theme.typography.bodyStrong.fontWeight,
      lineHeight: theme.typography.bodyStrong.lineHeight,
    },
    listMeta: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.body.fontSize,
      fontWeight: theme.typography.body.fontWeight,
      lineHeight: theme.typography.body.lineHeight,
    },
    listBadge: {
      backgroundColor: theme.colors.neutralSoft,
      borderRadius: theme.radius.pill,
      color: theme.colors.neutral,
      overflow: "hidden",
      paddingHorizontal: theme.spacing[2],
      paddingVertical: theme.spacing[1],
      fontSize: theme.typography.caption.fontSize,
      fontWeight: theme.typography.caption.fontWeight,
      lineHeight: theme.typography.caption.lineHeight,
    },
    warningBadge: {
      backgroundColor: theme.colors.warningSoft,
      color: theme.colors.warning,
    },
    emptyState: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: theme.spacing[1],
      padding: theme.spacing[4],
    },
    emptyTitle: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.bodyStrong.fontSize,
      fontWeight: theme.typography.bodyStrong.fontWeight,
      lineHeight: theme.typography.bodyStrong.lineHeight,
    },
    emptyCopy: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: theme.typography.caption.fontWeight,
      lineHeight: theme.typography.caption.lineHeight,
    },
    analyticsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing[2],
    },
    analyticsCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      flexGrow: 1,
      gap: theme.spacing[1],
      minWidth: 132,
      padding: theme.spacing[2],
      ...theme.shadows.card,
    },
    analyticsLabel: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: theme.typography.caption.fontWeight,
      lineHeight: theme.typography.caption.lineHeight,
    },
    analyticsValue: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.headingSm.fontSize,
      fontWeight: theme.typography.headingSm.fontWeight,
      lineHeight: theme.typography.headingSm.lineHeight,
    },
    inlineLink: {
      paddingVertical: theme.spacing[1],
    },
    inlineLinkText: {
      color: theme.colors.brand,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: theme.typography.caption.fontWeight,
      lineHeight: theme.typography.caption.lineHeight,
    },
    kpiRow: {
      flexDirection: "row",
      gap: theme.spacing[2],
    },
    kpiCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      flex: 1,
      gap: theme.spacing[1],
      padding: theme.spacing[2],
      ...theme.shadows.card,
    },
    kpiCardWarning: {
      backgroundColor: theme.colors.warningSoft,
    },
    kpiCardDanger: {
      backgroundColor: theme.colors.dangerSoft,
    },
    kpiCardNeutral: {
      backgroundColor: theme.colors.surfaceMuted,
    },
    kpiLabel: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.label.fontSize,
      fontWeight: theme.typography.label.fontWeight,
      lineHeight: theme.typography.label.lineHeight,
      textTransform: "uppercase",
    },
    kpiValue: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.headingSm.fontSize,
      fontWeight: theme.typography.headingSm.fontWeight,
      lineHeight: theme.typography.headingSm.lineHeight,
    },
    nextDueCard: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      flexDirection: "row",
      gap: theme.spacing[2],
      justifyContent: "space-between",
      padding: theme.spacing[2],
    },
    nextDueLabel: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.label.fontSize,
      fontWeight: theme.typography.label.fontWeight,
      lineHeight: theme.typography.label.lineHeight,
      textTransform: "uppercase",
    },
  });
