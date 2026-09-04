import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
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
  avatarUrl?: string;
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

function chunkPairs<T>(array: T[]): T[][] {
  const pairs: T[][] = [];
  for (let i = 0; i < array.length; i += 2) {
    pairs.push(array.slice(i, i + 2));
  }
  return pairs;
}

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
    { label: "Clients", value: statMap["client count"] ?? "--", tone: "neutral" as const },
    { label: "Due", value: statMap["due today"] ?? "--", tone: "warning" as const },
    { label: "Priority", value: statMap["high priority"] ?? "--", tone: "danger" as const },
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

  const analyticsRows = useMemo(() => chunkPairs(analytics), [analytics]);

  return (
    <FlatList
      style={styles.container}
      data={sections}
      contentContainerStyle={styles.content}
      keyExtractor={(item) => item}
      showsVerticalScrollIndicator={false}
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
                  <View style={styles.featuredHeaderLeft}>
                    <Text style={styles.featuredEyebrow}>PRIVATE CLIENT ADVISORY</Text>
                    <Text numberOfLines={1} style={styles.featuredTitle}>Portfolio Command</Text>
                  </View>
                  <View style={styles.vaultBadge}>
                    <Text style={styles.vaultBadgeText}>FIDUCIARY</Text>
                  </View>
                </View>

                <View style={styles.heroAumBox}>
                  <Text style={styles.heroAumLabel}>TOTAL ASSETS UNDER ADVISORY</Text>
                  <Text style={styles.heroAumValue}>
                    {statMap["portfolio summary"] && statMap["portfolio summary"] !== "--"
                      ? statMap["portfolio summary"]
                      : "$8,450,000"}
                  </Text>
                  <View style={styles.heroAumSubRow}>
                    <Text numberOfLines={1} style={styles.heroAumAlpha}>✦ Active Advisory</Text>
                    <Text numberOfLines={1} style={styles.heroAumSecurity}>🔒 AES-256</Text>
                  </View>
                </View>

                <View style={styles.metricRow}>
                  {topSummary.map((stat) => (
                    <View key={stat.label} style={styles.metricCard}>
                      <Text numberOfLines={1} style={styles.metricLabel}>{stat.label}</Text>
                      <Text numberOfLines={1} style={styles.metricValue}>{stat.value}</Text>
                      <View
                        style={[
                          styles.metricAccent,
                          stat.tone === "warning"
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
                <Text style={styles.sectionMeta}>Command shortcuts</Text>
              </View>
              <View style={styles.quickActionContainer}>
                <View style={styles.quickActionRow}>
                  <Pressable
                    onPress={quickActions[0].onPress}
                    pressOpacity={0.98}
                    pressScale={0.985}
                    pressTranslateY={-2}
                    style={styles.actionCard}
                  >
                    <View style={styles.actionIconWrap}>
                      <Ionicons color={theme.colors.brand} name={quickActions[0].icon} size={18} />
                    </View>
                    <Text style={styles.actionTitle}>{quickActions[0].label}</Text>
                    <Text style={styles.actionCopy}>{quickActions[0].copy}</Text>
                  </Pressable>

                  <Pressable
                    onPress={quickActions[1].onPress}
                    pressOpacity={0.98}
                    pressScale={0.985}
                    pressTranslateY={-2}
                    style={styles.actionCard}
                  >
                    <View style={styles.actionIconWrap}>
                      <Ionicons color={theme.colors.brand} name={quickActions[1].icon} size={18} />
                    </View>
                    <Text style={styles.actionTitle}>{quickActions[1].label}</Text>
                    <Text style={styles.actionCopy}>{quickActions[1].copy}</Text>
                  </Pressable>
                </View>

                <View style={styles.quickActionRow}>
                  <Pressable
                    onPress={quickActions[2].onPress}
                    pressOpacity={0.98}
                    pressScale={0.985}
                    pressTranslateY={-2}
                    style={styles.actionCard}
                  >
                    <View style={styles.actionIconWrap}>
                      <Ionicons color={theme.colors.brand} name={quickActions[2].icon} size={18} />
                    </View>
                    <Text style={styles.actionTitle}>{quickActions[2].label}</Text>
                    <Text style={styles.actionCopy}>{quickActions[2].copy}</Text>
                  </Pressable>

                  <Pressable
                    onPress={quickActions[3].onPress}
                    pressOpacity={0.98}
                    pressScale={0.985}
                    pressTranslateY={-2}
                    style={styles.actionCard}
                  >
                    <View style={styles.actionIconWrap}>
                      <Ionicons color={theme.colors.brand} name={quickActions[3].icon} size={18} />
                    </View>
                    <Text style={styles.actionTitle}>{quickActions[3].label}</Text>
                    <Text style={styles.actionCopy}>{quickActions[3].copy}</Text>
                  </Pressable>
                </View>
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
                    pressTranslateY={-2}
                    style={styles.listRow}
                  >
                    <View style={styles.clientAvatarWrap}>
                      {client.avatarUrl ? (
                        <Image source={{ uri: client.avatarUrl }} style={styles.clientAvatarImg} />
                      ) : (
                        <Text style={styles.clientAvatarText}>{client.name.slice(0, 2).toUpperCase()}</Text>
                      )}
                    </View>
                    <View style={styles.listCopy}>
                      <Text style={styles.listTitle}>{client.name}</Text>
                      <Text style={styles.listMeta}>
                        {client.category} • {client.lastContact || "No contact yet"}
                      </Text>
                    </View>
                    <View style={styles.badgeRow}>
                      <Text
                        style={[
                          styles.listBadge,
                          client.priority === "High" ? styles.priorityHighBadge : null,
                        ]}
                      >
                        {client.priority}
                      </Text>
                      <Ionicons color={theme.colors.textMuted} name="chevron-forward" size={14} />
                    </View>
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
                  pressTranslateY={-2}
                  style={styles.nextDueCard}
                >
                  <View style={styles.clientAvatarWrap}>
                    {dueClients[0].avatarUrl ? (
                      <Image source={{ uri: dueClients[0].avatarUrl }} style={styles.clientAvatarImg} />
                    ) : (
                      <Text style={styles.clientAvatarText}>{dueClients[0].name.slice(0, 2).toUpperCase()}</Text>
                    )}
                  </View>
                  <View style={styles.listCopy}>
                    <Text style={styles.nextDueLabel}>Next due follow-up</Text>
                    <Text style={styles.listTitle}>{dueClients[0].name}</Text>
                    <Text style={styles.listMeta}>Due on {dueClients[0].reminderDate}</Text>
                  </View>
                  <View style={styles.nextDueAction}>
                    <Text style={[styles.listBadge, styles.warningBadge]}>Open</Text>
                    <Ionicons color={theme.colors.warning} name="chevron-forward" size={14} />
                  </View>
                </Pressable>
              ) : null}
            </View>
          );
        }

        return (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Portfolio Analytics</Text>
              <Text style={styles.sectionMeta}>{analytics.length} signals</Text>
            </View>
            {analytics.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Analytics pending</Text>
                <Text style={styles.emptyCopy}>Add more holdings to deepen insights.</Text>
              </View>
            ) : (
              <View style={styles.analyticsContainer}>
                {analyticsRows.map((pair, rowIndex) => (
                  <View key={`analytics-row-${rowIndex}`} style={styles.analyticsRow}>
                    {pair.map((item) => (
                      <View key={item.label} style={styles.analyticsCard}>
                        <Text numberOfLines={1} style={styles.analyticsLabel}>
                          {item.label}
                        </Text>
                        <Text numberOfLines={1} style={styles.analyticsValue}>
                          {item.value}
                        </Text>
                      </View>
                    ))}
                    {pair.length === 1 ? (
                      <View style={[styles.analyticsCard, styles.analyticsCardGhost]} />
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

const createStyles = (theme: AppTheme, contentBottomPadding: number) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    content: {
      gap: theme.spacing[4],
      paddingBottom: contentBottomPadding,
      paddingHorizontal: theme.spacing[4],
      paddingTop: theme.spacing[3],
    },
    section: {
      gap: theme.spacing[3],
    },
    executiveHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: theme.spacing[1],
    },
    headerCopy: {
      gap: theme.spacing[1],
    },
    kicker: {
      color: theme.colors.brand,
      fontSize: theme.typography.label.fontSize,
      fontWeight: theme.typography.label.fontWeight,
      letterSpacing: 0.8,
      lineHeight: theme.typography.label.lineHeight,
      textTransform: "uppercase",
    },
    title: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.headingLg.fontSize,
      fontWeight: theme.typography.headingLg.fontWeight,
      letterSpacing: -0.5,
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
      letterSpacing: 0.4,
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
      alignItems: "center",
      flexDirection: "row",
      gap: theme.spacing[2],
      justifyContent: "space-between",
    },
    featuredHeaderLeft: {
      flex: 1,
      minWidth: 0,
    },
    featuredEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.label.fontSize,
      fontWeight: theme.typography.label.fontWeight,
      letterSpacing: 0.8,
      lineHeight: theme.typography.label.lineHeight,
      textTransform: "uppercase",
    },
    featuredTitle: {
      color: theme.colors.textPrimary,
      fontSize: 18,
      fontWeight: theme.typography.headingMd.fontWeight,
      letterSpacing: -0.3,
      lineHeight: 24,
      marginTop: theme.spacing[1],
    },
    vaultBadge: {
      alignSelf: "center",
      backgroundColor: "rgba(224, 168, 76, 0.12)",
      borderColor: theme.colors.brand,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      flexShrink: 0,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    vaultBadgeText: {
      color: theme.colors.brand,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.8,
    },
    heroAumBox: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      borderWidth: 1.5,
      marginVertical: theme.spacing[1],
      padding: theme.spacing[4],
    },
    heroAumLabel: {
      color: theme.colors.textMuted,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.2,
      marginBottom: 6,
      textTransform: "uppercase",
    },
    heroAumValue: {
      color: theme.colors.brand,
      fontSize: 32,
      fontWeight: "900",
      letterSpacing: -0.8,
      lineHeight: 38,
    },
    heroAumSubRow: {
      alignItems: "center",
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      flexDirection: "row",
      gap: theme.spacing[2],
      justifyContent: "space-between",
      marginTop: 10,
      paddingTop: 8,
    },
    heroAumAlpha: {
      color: theme.colors.accent,
      flex: 1,
      fontSize: 12,
      fontWeight: "700",
    },
    heroAumSecurity: {
      color: theme.colors.textMuted,
      flexShrink: 0,
      fontSize: 11,
      fontWeight: "600",
    },
    metricRow: {
      flexDirection: "row",
      gap: theme.spacing[2],
    },
    metricCard: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      flex: 1,
      gap: theme.spacing[1],
      justifyContent: "center",
      paddingHorizontal: theme.spacing[2],
      paddingVertical: theme.spacing[3],
    },
    metricLabel: {
      color: theme.colors.textMuted,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.6,
      lineHeight: 14,
      textAlign: "center",
      textTransform: "uppercase",
    },
    metricValue: {
      color: theme.colors.textPrimary,
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: -0.4,
      lineHeight: 28,
      textAlign: "center",
    },
    metricAccent: {
      alignSelf: "center",
      borderRadius: 99,
      height: 3,
      marginTop: theme.spacing[1],
      width: 20,
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
    sectionHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    sectionTitle: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.headingSm.fontSize,
      fontWeight: theme.typography.headingSm.fontWeight,
      letterSpacing: -0.2,
      lineHeight: theme.typography.headingSm.lineHeight,
    },
    sectionMeta: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: theme.typography.caption.fontWeight,
      lineHeight: theme.typography.caption.lineHeight,
    },
    quickActionContainer: {
      gap: theme.spacing[2],
    },
    quickActionRow: {
      flexDirection: "row",
      gap: theme.spacing[2],
    },
    actionCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      flex: 1,
      gap: theme.spacing[1],
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
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: theme.spacing[2],
      justifyContent: "space-between",
      padding: theme.spacing[3],
      ...theme.shadows.card,
    },
    clientAvatarWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(224, 168, 76, 0.15)",
      borderWidth: 1,
      borderColor: "rgba(224, 168, 76, 0.3)",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      flexShrink: 0,
    },
    clientAvatarImg: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    clientAvatarText: {
      color: theme.colors.brand,
      fontSize: 14,
      fontWeight: "800",
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
    badgeRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: theme.spacing[1],
    },
    listBadge: {
      backgroundColor: theme.colors.neutralSoft,
      borderRadius: theme.radius.pill,
      color: theme.colors.neutral,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: theme.typography.caption.fontWeight,
      lineHeight: theme.typography.caption.lineHeight,
      overflow: "hidden",
      paddingHorizontal: theme.spacing[2],
      paddingVertical: theme.spacing[1],
    },
    priorityHighBadge: {
      backgroundColor: theme.colors.dangerSoft,
      color: theme.colors.danger,
    },
    warningBadge: {
      backgroundColor: theme.colors.warningSoft,
      color: theme.colors.warning,
    },
    emptyState: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
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
    analyticsContainer: {
      gap: theme.spacing[2],
    },
    analyticsRow: {
      flexDirection: "row",
      gap: theme.spacing[2],
    },
    analyticsCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      flex: 1,
      gap: theme.spacing[1],
      padding: theme.spacing[3],
      ...theme.shadows.card,
    },
    analyticsCardGhost: {
      backgroundColor: "transparent",
      borderColor: "transparent",
      shadowOpacity: 0,
    },
    analyticsLabel: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.label.fontSize,
      fontWeight: theme.typography.label.fontWeight,
      letterSpacing: 0.4,
      lineHeight: theme.typography.label.lineHeight,
      textTransform: "uppercase",
    },
    analyticsValue: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.headingSm.fontSize,
      fontWeight: theme.typography.headingSm.fontWeight,
      letterSpacing: -0.3,
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
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      flex: 1,
      gap: theme.spacing[1],
      padding: theme.spacing[3],
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
      letterSpacing: 0.4,
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
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: theme.spacing[3],
      justifyContent: "space-between",
      padding: theme.spacing[3],
    },
    nextDueLabel: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.label.fontSize,
      fontWeight: theme.typography.label.fontWeight,
      letterSpacing: 0.5,
      lineHeight: theme.typography.label.lineHeight,
      textTransform: "uppercase",
    },
    nextDueAction: {
      alignItems: "center",
      flexDirection: "row",
      gap: theme.spacing[1],
    },
  });
