import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeColors } from "../../theme/colors";

export interface ExecutiveLaunchpadProps {
  onOpenTaxHarvest: () => void;
  onOpenRebalance: () => void;
  onOpenStressTest: () => void;
  onOpenMonteCarlo: () => void;
  onOpenWhatIf: () => void;
  onOpenFamilyVault: () => void;
  onOpenFundXray: () => void;
  onOpenConstitution: () => void;
  onOpenShadowWealth: () => void;
  onOpenAiCopilot?: () => void;
  onOpenBroadcast?: () => void;
  colors: ThemeColors;
}

export const ExecutiveLaunchpad: React.FC<ExecutiveLaunchpadProps> = ({
  onOpenTaxHarvest,
  onOpenRebalance,
  onOpenStressTest,
  onOpenMonteCarlo,
  onOpenWhatIf,
  onOpenFamilyVault,
  onOpenFundXray,
  onOpenConstitution,
  onOpenShadowWealth,
  onOpenAiCopilot,
  onOpenBroadcast,
  colors,
}) => {
  const tools = [
    {
      id: "tax",
      title: "Tax Loss Harvest",
      badge: "§70/74 Alpha",
      badgeColor: "#10b981",
      icon: "receipt-outline" as const,
      color: "#10b981",
      onPress: onOpenTaxHarvest,
    },
    {
      id: "rebalance",
      title: "Rebalance Desk",
      badge: "Drift Control",
      badgeColor: colors.brand,
      icon: "git-compare-outline" as const,
      color: colors.brand,
      onPress: onOpenRebalance,
    },
    {
      id: "stress",
      title: "Crisis Stress Test",
      badge: "2008 & Covid",
      badgeColor: "#f43f5e",
      icon: "trending-down-outline" as const,
      color: "#f43f5e",
      onPress: onOpenStressTest,
    },
    {
      id: "monte_carlo",
      title: "Monte Carlo Sim",
      badge: "1,000 Paths",
      badgeColor: "#8b5cf6",
      icon: "stats-chart-outline" as const,
      color: "#8b5cf6",
      onPress: onOpenMonteCarlo,
    },
    {
      id: "what_if",
      title: "What-If Sandbox",
      badge: "Rate Shocks",
      badgeColor: "#38bdf8",
      icon: "flash-outline" as const,
      color: "#38bdf8",
      onPress: onOpenWhatIf,
    },
    {
      id: "vault",
      title: "Family Continuity",
      badge: "Nominee Audit",
      badgeColor: "#f59e0b",
      icon: "shield-checkmark-outline" as const,
      color: "#f59e0b",
      onPress: onOpenFamilyVault,
    },
    {
      id: "xray",
      title: "Fund X-Ray",
      badge: "Look-Through",
      badgeColor: "#38bdf8",
      icon: "scan-outline" as const,
      color: "#38bdf8",
      onPress: onOpenFundXray,
    },
    {
      id: "constitution",
      title: "IPS Constitution",
      badge: "Anti-Impulse",
      badgeColor: "#8b5cf6",
      icon: "lock-closed-outline" as const,
      color: "#8b5cf6",
      onPress: onOpenConstitution,
    },
    {
      id: "shadow",
      title: "Shadow Wealth",
      badge: "Physical Desk",
      badgeColor: "#f59e0b",
      icon: "cube-outline" as const,
      color: "#f59e0b",
      onPress: onOpenShadowWealth,
    },
    ...(onOpenAiCopilot
      ? [
          {
            id: "copilot",
            title: "AI Co-Pilot",
            badge: "Instant Intel",
            badgeColor: colors.brand,
            icon: "sparkles" as const,
            color: colors.brand,
            onPress: onOpenAiCopilot,
          },
        ]
      : []),
    ...(onOpenBroadcast
      ? [
          {
            id: "broadcast",
            title: "Client Broadcast",
            badge: "1-Click Send",
            badgeColor: "#06b6d4",
            icon: "megaphone-outline" as const,
            color: "#06b6d4",
            onPress: onOpenBroadcast,
          },
        ]
      : []),
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.indicatorDot, { backgroundColor: colors.brand }]} />
          <Text style={[styles.heading, { color: colors.textPrimary }]}>EXECUTIVE QUICK-LAUNCH DOCK</Text>
          <View style={[styles.liveTag, { backgroundColor: colors.accentSoft }]}>
            <Text style={[styles.liveTagText, { color: colors.accent }]}>ZERO-CLICK ACCESS</Text>
          </View>
        </View>
        <Text style={[styles.subcaption, { color: colors.textMuted }]}>
          Launch any workstation engine directly without digging through submenus
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tools.map((tool) => (
          <Pressable
            key={tool.id}
            onPress={tool.onPress}
            style={({ pressed }) => [
              styles.toolChip,
              {
                backgroundColor: colors.surfaceMuted,
                borderColor: colors.borderSubtle,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: `${tool.color}18` }]}>
              <Ionicons name={tool.icon} size={15} color={tool.color} />
            </View>
            <View style={styles.textStack}>
              <Text style={[styles.chipTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {tool.title}
              </Text>
              <View style={[styles.badgePill, { backgroundColor: `${tool.badgeColor}15` }]}>
                <Text style={[styles.badgeText, { color: tool.badgeColor }]}>{tool.badge}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  headerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heading: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  liveTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  subcaption: {
    fontSize: 11,
    fontWeight: "500",
  },
  scrollContent: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 2,
  },
  toolChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 165,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  textStack: {
    flex: 1,
    gap: 2,
  },
  chipTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  badgePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
