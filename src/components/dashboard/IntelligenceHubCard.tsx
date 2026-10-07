import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface IntelligenceHubCardProps {
  onOpenFamilyVault: () => void;
  onOpenFundXray: () => void;
  onOpenConstitution: () => void;
  onOpenShadowWealth: () => void;
  colors: any;
}

export const IntelligenceHubCard: React.FC<IntelligenceHubCardProps> = ({
  onOpenFamilyVault,
  onOpenFundXray,
  onOpenConstitution,
  onOpenShadowWealth,
  colors,
}) => {
  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header with Luxury Brand Accent */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <View style={[styles.glowBadge, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="sparkles" size={16} color={colors.accent} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Intelligence & Continuity Hub
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              1-Click Institutional Vault, Fund X-Ray, Behavioral Guardrails & Shadow Wealth
            </Text>
          </View>
        </View>
      </View>

      {/* 4 Interactive 1-Click Pillars Grid */}
      <View style={styles.gridRow}>
        {/* Pillar 1: Family Vault */}
        <TouchableOpacity
          style={[styles.tile, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
          onPress={onOpenFamilyVault}
          activeOpacity={0.8}
        >
          <View style={styles.tileHeader}>
            <View style={[styles.tileIconCircle, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="shield-checkmark" size={16} color={colors.accent} />
            </View>
            <Text style={[styles.badge, { backgroundColor: colors.successSoft, color: colors.success }]}>
              Audited
            </Text>
          </View>
          <Text style={[styles.tileTitle, { color: colors.textPrimary }]}>
            Family Vault
          </Text>
          <Text style={[styles.tileDesc, { color: colors.textMuted }]} numberOfLines={2}>
            Nominee audit & 1-click encrypted emergency playbook.
          </Text>
        </TouchableOpacity>

        {/* Pillar 2: Fund X-Ray */}
        <TouchableOpacity
          style={[styles.tile, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
          onPress={onOpenFundXray}
          activeOpacity={0.8}
        >
          <View style={styles.tileHeader}>
            <View style={[styles.tileIconCircle, { backgroundColor: colors.warningSoft }]}>
              <Ionicons name="scan" size={16} color={colors.brand} />
            </View>
            <Text style={[styles.badge, { backgroundColor: colors.warningSoft, color: colors.brand }]}>
              Look-Through
            </Text>
          </View>
          <Text style={[styles.tileTitle, { color: colors.textPrimary }]}>
            Fund X-Ray
          </Text>
          <Text style={[styles.tileDesc, { color: colors.textMuted }]} numberOfLines={2}>
            Deconstruct stock overlap & eliminate fee drag.
          </Text>
        </TouchableOpacity>

        {/* Pillar 3: Constitution */}
        <TouchableOpacity
          style={[styles.tile, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
          onPress={onOpenConstitution}
          activeOpacity={0.8}
        >
          <View style={styles.tileHeader}>
            <View style={[styles.tileIconCircle, { backgroundColor: colors.dangerSoft }]}>
              <Ionicons name="scale-outline" size={16} color={colors.danger} />
            </View>
            <Text style={[styles.badge, { backgroundColor: colors.successSoft, color: colors.success }]}>
              100% IPS
            </Text>
          </View>
          <Text style={[styles.tileTitle, { color: colors.textPrimary }]}>
            Constitution
          </Text>
          <Text style={[styles.tileDesc, { color: colors.textMuted }]} numberOfLines={2}>
            Anti-impulse guardrails & stress crash simulations.
          </Text>
        </TouchableOpacity>

        {/* Pillar 4: Shadow Wealth */}
        <TouchableOpacity
          style={[styles.tile, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
          onPress={onOpenShadowWealth}
          activeOpacity={0.8}
        >
          <View style={styles.tileHeader}>
            <View style={[styles.tileIconCircle, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="cube-outline" size={16} color={colors.accent} />
            </View>
            <Text style={[styles.badge, { backgroundColor: colors.neutralSoft, color: colors.textSecondary }]}>
              Physical
            </Text>
          </View>
          <Text style={[styles.tileTitle, { color: colors.textPrimary }]}>
            Shadow Wealth
          </Text>
          <Text style={[styles.tileDesc, { color: colors.textMuted }]} numberOfLines={2}>
            Gold lockers, real estate deeds & private debt notes.
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 12,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  glowBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tile: {
    flex: 1,
    minWidth: 150,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  tileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tileIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  tileTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  tileDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
});
