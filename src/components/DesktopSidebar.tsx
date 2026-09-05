import React from "react";
import { View, Text, StyleSheet, Pressable, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppTheme } from "../theme";

export interface SidebarTabItem {
  key: string;
  label: string;
}

export interface DesktopSidebarProps {
  theme: AppTheme;
  activeTab: string;
  tabs: SidebarTabItem[];
  onChange: (tab: any) => void;
  onQuickAddClient: () => void;
  onQuickBroadcast: () => void;
  onLockDesk: () => void;
  dueClientsCount?: number;
  advisorName?: string;
  syncStatus?: string;
  isPro?: boolean;
  onOpenProModal?: () => void;
}

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Dashboard: "grid-outline",
  Clients: "people-outline",
  Portfolios: "pie-chart-outline",
  Tools: "calculator-outline",
  Workspace: "briefcase-outline",
  Settings: "shield-checkmark-outline",
  "AI Research": "sparkles-outline",
};

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  theme,
  activeTab,
  tabs,
  onChange,
  onQuickAddClient,
  onQuickBroadcast,
  onLockDesk,
  dueClientsCount = 0,
  advisorName = "Senior Wealth Advisor",
  syncStatus = "Vault Synced",
  isPro = true,
  onOpenProModal,
}) => {
  const isDark =
    theme.colors.background === "#030712" ||
    theme.colors.textPrimary === "#ffffff" ||
    theme.colors.textPrimary === "#FFFFFF";

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: isDark ? "#070D1B" : "#F4F6F9",
          borderRightColor: theme.colors.border,
        },
      ]}
    >
      {/* Brand & Monogram Header */}
      <View style={styles.brandContainer}>
        <View style={styles.brandIconWrap}>
          <Ionicons name="diamond" size={20} color={theme.colors.brand} />
        </View>
        <View style={styles.brandTextWrap}>
          <Text style={[styles.brandTitle, { color: theme.colors.textPrimary }]}>ASSET ARRAY</Text>
          <Text style={[styles.brandSubtitle, { color: theme.colors.brand }]}>PRIVATE WEALTH</Text>
        </View>
      </View>

      {/* Vault Sync Status Pill */}
      <View style={styles.syncStatusPill}>
        <View style={styles.syncDot} />
        <Text style={styles.syncStatusText}>{syncStatus.toUpperCase()}</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation List */}
        <View style={styles.navSection}>
          <Text style={styles.sectionHeader}>WORKSPACE MODULES</Text>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const iconName = TAB_ICONS[tab.key] || "folder-outline";
          const showDueBadge = tab.key === "Clients" && dueClientsCount > 0;

          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              style={({ pressed }) => [
                styles.navItem,
                isActive && styles.navItemActive,
                pressed && styles.navItemPressed,
              ]}
            >
              <View style={styles.navItemContent}>
                <Ionicons
                  name={iconName}
                  size={18}
                  color={isActive ? "#E0A84C" : "#94A3B8"}
                />
                <Text
                  style={[
                    styles.navItemText,
                    isActive && styles.navItemTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </View>

              {showDueBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{dueClientsCount} due</Text>
                </View>
              )}

              {isActive && <View style={styles.activeIndicator} />}
            </Pressable>
          );
        })}
      </View>

      {/* Quick Fiduciary Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionHeader}>DESK ACTIONS</Text>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.actionPrimary,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={onQuickAddClient}
        >
          <Ionicons name="person-add-outline" size={16} color="#030712" />
          <Text style={styles.actionPrimaryText}>New Client Dossier</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.actionSecondary,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={onQuickBroadcast}
        >
          <Ionicons name="megaphone-outline" size={16} color="#E0A84C" />
          <Text style={styles.actionSecondaryText}>Broadcast Center</Text>
        </Pressable>
      </View>

      {/* Keyboard Shortcut Legend */}
      <View style={styles.shortcutLegend}>
        <Text style={styles.shortcutLegendHeader}>KEYBOARD SHORTCUTS</Text>
        {([
          ["⌘ K", "Clients"],
          ["⌘ B", "Broadcast"],
          ["⌘ L", "Lock Desk"],
          ["Esc", "Close Panel"],
        ] as const).map(([key, desc]) => (
          <View key={key} style={styles.shortcutRow}>
            <View style={styles.kbdBadge}>
              <Text style={styles.kbdText}>{key}</Text>
            </View>
            <Text style={styles.shortcutDesc}>{desc}</Text>
          </View>
        ))}
      </View>

      {/* Pro Membership Banner */}
      <Pressable
        style={styles.proBanner}
        onPress={onOpenProModal}
      >
        <View style={styles.proHeader}>
          <Ionicons name="shield-half-outline" size={16} color="#E0A84C" />
          <Text style={styles.proBadge}>PRO TIER</Text>
        </View>
        <Text style={styles.proDescription}>
          Encrypted Cloud Sync • AI Co-Pilot
        </Text>
      </Pressable>
      </ScrollView>

      {/* Advisor Profile Footer with Lock Button */}
      <View style={styles.advisorFooter}>
        <View style={styles.advisorAvatar}>
          <Text style={styles.advisorInitials}>
            {advisorName.slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.advisorInfo}>
          <Text style={[styles.advisorNameText, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {advisorName}
          </Text>
          <Text style={styles.advisorRoleText}>Managing Director</Text>
        </View>
        <Pressable
          onPress={onLockDesk}
          style={styles.lockButton}
          accessibilityLabel="Lock advisory desk"
        >
          <Ionicons name="lock-closed-outline" size={17} color="#94A3B8" />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 270,
    backgroundColor: "#070D1B",
    borderRightWidth: 1,
    borderRightColor: "rgba(224, 168, 76, 0.15)",
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
    gap: 16,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  brandIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(224, 168, 76, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(224, 168, 76, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E0A84C",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  brandTextWrap: {
    flexDirection: "column",
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#F8FAFC",
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: "700",
    color: "#E0A84C",
    letterSpacing: 2.2,
    marginTop: 1,
  },
  syncStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 24,
    alignSelf: "flex-start",
    marginLeft: 8,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  syncStatusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#34D399",
    letterSpacing: 0.8,
  },
  navSection: {
    gap: 4,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 1.5,
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    position: "relative",
  },
  navItemActive: {
    backgroundColor: "rgba(224, 168, 76, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(224, 168, 76, 0.3)",
  },
  navItemPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  navItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  navItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
  },
  navItemTextActive: {
    color: "#F8FAFC",
    fontWeight: "700",
  },
  activeIndicator: {
    position: "absolute",
    right: 0,
    top: 6,
    bottom: 6,
    width: 3.5,
    borderRadius: 2,
    backgroundColor: "#E0A84C",
    shadowColor: "#E0A84C",
    shadowOpacity: 0.85,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  badge: {
    backgroundColor: "rgba(239, 68, 68, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#F87171",
  },
  quickActionsSection: {
    gap: 8,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  actionPrimary: {
    backgroundColor: "#E0A84C",
  },
  actionPrimaryText: {
    color: "#030712",
    fontWeight: "700",
    fontSize: 13,
  },
  actionSecondary: {
    backgroundColor: "rgba(224, 168, 76, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(224, 168, 76, 0.25)",
  },
  actionSecondaryText: {
    color: "#E0A84C",
    fontWeight: "600",
    fontSize: 13,
  },
  actionButtonPressed: {
    opacity: 0.8,
  },
  proBanner: {
    backgroundColor: "rgba(11, 19, 43, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(224, 168, 76, 0.25)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  proHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  proBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#E0A84C",
    letterSpacing: 1,
  },
  proDescription: {
    fontSize: 11,
    color: "#94A3B8",
    lineHeight: 15,
  },
  advisorFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  advisorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "rgba(224, 168, 76, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  advisorInitials: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E0A84C",
  },
  advisorInfo: {
    flex: 1,
  },
  advisorNameText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F1F5F9",
  },
  advisorRoleText: {
    fontSize: 10,
    color: "#64748B",
  },
  lockButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  shortcutLegend: {
    paddingTop: 14,
    paddingHorizontal: 4,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    gap: 7,
  },
  shortcutLegendHeader: {
    fontSize: 9,
    fontWeight: "800" as const,
    color: "#334155",
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  shortcutRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
  },
  kbdBadge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 5,
    backgroundColor: "rgba(224, 168, 76, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(224, 168, 76, 0.22)",
    minWidth: 44,
    alignItems: "center" as const,
  },
  kbdText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#E0A84C",
    fontFamily: Platform.select({ ios: "Courier New", android: "monospace", default: "monospace" }),
  },
  shortcutDesc: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "500" as const,
  },
});
