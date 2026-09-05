import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AdvisorOpportunity, OpportunityType } from "../../types/advisor";
import { AppTheme } from "../../theme";

export interface OpportunityCenterProps {
  opportunities: AdvisorOpportunity[];
  theme: AppTheme;
  onExecuteOpportunity: (opportunity: AdvisorOpportunity) => void;
  onOpenClient360: (clientId: string) => void;
}

export const OpportunityCenter: React.FC<OpportunityCenterProps> = ({
  opportunities,
  theme,
  onExecuteOpportunity,
  onOpenClient360,
}) => {
  const [selectedType, setSelectedType] = useState<string>("ALL");

  const filtered = opportunities.filter((o) => {
    if (selectedType !== "ALL" && o.type !== selectedType) return false;
    return true;
  });

  const typeTabs: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "ALL", label: "All Opportunities", icon: "sparkles-outline" },
    { key: "TAX_HARVESTING", label: "Tax Harvesting", icon: "receipt-outline" },
    { key: "REBALANCING_DRIFT", label: "Rebalancing", icon: "pie-chart-outline" },
    { key: "GOAL_CATCH_UP", label: "Goal Catch-Up", icon: "flag-outline" },
    { key: "IDLE_CASH_DRAG", label: "Idle Cash", icon: "cash-outline" },
  ];

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View
        style={[
          styles.headerBanner,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.accentSoft }]}>
            <Ionicons name="trending-up" size={18} color={theme.colors.accent} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              OPPORTUNITY ENGINE
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.accent }]}>
              PROACTIVE WEALTH CREATION & TAX EFFICIENCY
            </Text>
          </View>
        </View>
        <View style={[styles.oppBadge, { backgroundColor: theme.colors.surfaceMuted }]}>
          <Text style={[styles.oppBadgeText, { color: theme.colors.textPrimary }]}>
            {opportunities.length} ACTIVE
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.typeTabsRow}>
        {typeTabs.map((tab) => {
          const isActive = selectedType === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setSelectedType(tab.key)}
              style={[
                styles.typeTab,
                {
                  backgroundColor: isActive ? theme.colors.brand : theme.colors.surfaceMuted,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Ionicons
                name={tab.icon}
                size={12}
                color={isActive ? "#000000" : theme.colors.textMuted}
              />
              <Text
                style={[
                  styles.typeTabText,
                  {
                    color: isActive ? "#000000" : theme.colors.textSecondary,
                    fontWeight: isActive ? "800" : "600",
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Opportunity Cards List */}
      {filtered.length === 0 ? (
        <View
          style={[
            styles.emptyBox,
            { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
          ]}
        >
          <Ionicons name="checkmark-done-circle" size={32} color={theme.colors.accent} />
          <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
            No Pending Opportunities
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
            Portfolios are currently optimized. Re-evaluate as market movements occur.
          </Text>
        </View>
      ) : (
        filtered.map((opp) => (
          <View
            key={opp.id}
            style={[
              styles.oppCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <Pressable
                onPress={() => onOpenClient360(opp.clientId)}
                style={styles.clientPressable}
              >
                <Ionicons name="person-outline" size={13} color={theme.colors.brand} />
                <Text style={[styles.clientName, { color: theme.colors.textPrimary }]}>
                  {opp.clientName}
                </Text>
              </Pressable>

              <View style={[styles.pill, { backgroundColor: theme.colors.accentSoft }]}>
                <Text style={[styles.pillText, { color: theme.colors.accent }]}>
                  {opp.type.replace(/_/g, " ")}
                </Text>
              </View>
            </View>

            <Text style={[styles.oppTitle, { color: theme.colors.textPrimary }]}>
              {opp.title}
            </Text>
            <Text style={[styles.oppDesc, { color: theme.colors.textSecondary }]}>
              {opp.description}
            </Text>

            {/* Potential Value & Benefit */}
            <View
              style={[
                styles.benefitBox,
                { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border },
              ]}
            >
              <View style={styles.benefitRow}>
                <Ionicons name="gift-outline" size={14} color={theme.colors.accent} />
                <Text style={[styles.benefitLabel, { color: theme.colors.accent }]}>
                  POTENTIAL VALUE & BENEFIT
                </Text>
              </View>
              <Text style={[styles.benefitText, { color: theme.colors.textPrimary }]}>
                {opp.potentialBenefit}
              </Text>
              {opp.estimatedFinancialValue !== undefined && (
                <Text style={[styles.financialValue, { color: theme.colors.brand }]}>
                  Est. Impact: ₹{opp.estimatedFinancialValue.toLocaleString("en-IN")}
                </Text>
              )}
            </View>

            {/* Action Bar */}
            <View style={[styles.cardFooter, { borderTopColor: theme.colors.border }]}>
              <View style={styles.actionPromptWrap}>
                <Ionicons name="arrow-forward" size={12} color={theme.colors.textMuted} />
                <Text style={[styles.actionPrompt, { color: theme.colors.textMuted }]}>
                  {opp.recommendedAction}
                </Text>
              </View>

              <Pressable
                onPress={() => onExecuteOpportunity(opp)}
                style={[styles.executeBtn, { backgroundColor: theme.colors.brand }]}
              >
                <Ionicons name="flash-outline" size={13} color="#000000" />
                <Text style={styles.executeBtnText}>
                  {opp.deepLink.actionLabel || "Seize Opportunity"}
                </Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  oppBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  oppBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },
  typeTabsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  typeTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  typeTabText: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  oppCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  clientPressable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  clientName: {
    fontSize: 12,
    fontWeight: "700",
  },
  pill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  oppTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  oppDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  benefitBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 3,
  },
  benefitLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  benefitText: {
    fontSize: 11,
    lineHeight: 15,
  },
  financialValue: {
    fontSize: 11,
    fontWeight: "800",
    fontFamily: "monospace",
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    gap: 10,
  },
  actionPromptWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  actionPrompt: {
    fontSize: 11,
    flex: 1,
  },
  executeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  executeBtnText: {
    color: "#000000",
    fontSize: 11,
    fontWeight: "800",
  },
  emptyBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 2,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: "center",
  },
});
