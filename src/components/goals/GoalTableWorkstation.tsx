import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Platform,
} from "react-native";
import { AnimatedPressable as Pressable } from "../AnimatedPressable";
import { radiusTokens, surfaceTokens, semanticStatusColors } from "../../theme/tokens";

export interface GoalItemData {
  id: string;
  title: string;
  goalType?: string;
  priority?: string;
  targetAmount: string | number;
  currentAmount: string | number;
  targetYear?: string | number;
  progress?: number;
  gap?: number;
  probability?: number;
  nextAction?: string;
}

interface GoalTableWorkstationProps {
  goals: GoalItemData[];
  currencyDisplay?: (val: string) => string;
  onGoalAction?: (goal: GoalItemData) => void;
  onSelectGoal?: (goal: GoalItemData) => void;
}

export const GoalTableWorkstation: React.FC<GoalTableWorkstationProps> = ({
  goals,
  currencyDisplay = (val) => {
    const num = Number(val);
    if (isNaN(num)) return `₹${val}`;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    return `₹${num.toLocaleString("en-IN")}`;
  },
  onGoalAction,
  onSelectGoal,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (goals.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Financial Goals Recorded</Text>
        <Text style={styles.emptyText}>
          Establish target-based goals to initiate Monte Carlo tracking and funding gap analysis.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Desktop Table Header */}
      {!isMobile && (
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, { flex: 3 }]}>GOAL</Text>
          <Text style={[styles.headerCell, styles.alignRight, { flex: 2 }]}>TARGET</Text>
          <Text style={[styles.headerCell, styles.alignRight, { flex: 2 }]}>CURRENT</Text>
          <Text style={[styles.headerCell, styles.alignRight, { flex: 2 }]}>GAP</Text>
          <Text style={[styles.headerCell, styles.alignCenter, { flex: 1.5 }]}>TIME REMAINING</Text>
          <Text style={[styles.headerCell, styles.alignCenter, { flex: 1.5 }]}>PROBABILITY</Text>
          <Text style={[styles.headerCell, styles.alignRight, { flex: 2 }]}>NEXT ACTION</Text>
        </View>
      )}

      {/* Goal Rows */}
      {goals.map((goal) => {
        const target = Number(goal.targetAmount) || 0;
        const current = Number(goal.currentAmount) || 0;
        const gap = goal.gap !== undefined ? goal.gap : Math.max(0, target - current);
        const progress = goal.progress !== undefined 
          ? goal.progress 
          : target > 0 ? (current / target) * 100 : 0;
        
        const currentYear = new Date().getFullYear();
        const tYear = Number(goal.targetYear) || (currentYear + 5);
        const yearsRemaining = Math.max(0, tYear - currentYear);
        const timeRemainingText = yearsRemaining === 0 ? "< 1 yr" : `${yearsRemaining} yrs`;

        // Success probability estimation
        let probability = goal.probability;
        if (probability === undefined) {
          if (progress >= 100) probability = 99;
          else if (progress >= 80) probability = 88;
          else if (progress >= 60) probability = 74;
          else if (progress >= 40) probability = 58;
          else probability = 42;
        }

        let nextAction = goal.nextAction;
        if (!nextAction) {
          if (gap <= 0) nextAction = "Target Achieved";
          else if (progress < 40) nextAction = "Increase SIP";
          else if (progress < 70) nextAction = "Rebalance Equity";
          else nextAction = "Maintain Plan";
        }

        const isExpanded = expandedId === goal.id;

        if (isMobile) {
          return (
            <Pressable
              key={goal.id}
              onPress={() => setExpandedId(isExpanded ? null : goal.id)}
              style={[styles.mobileRow, isExpanded && styles.mobileRowExpanded]}
            >
              <View style={styles.mobileMainRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleWithBadge}>
                    <Text style={styles.goalTitle} numberOfLines={1}>
                      {goal.title}
                    </Text>
                    {goal.priority && (
                      <View style={styles.priorityBadge}>
                        <Text style={styles.priorityBadgeText}>{goal.priority}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.mobileMeta}>
                    {goal.goalType || "Wealth"} · Target {goal.targetYear || tYear}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.tabularMetric}>
                    {currencyDisplay(String(current))}
                  </Text>
                  <Text style={styles.mobileSubText}>
                    of {currencyDisplay(String(target))} ({progress.toFixed(0)}%)
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, Math.max(0, progress))}%`,
                      backgroundColor: progress >= 80 ? semanticStatusColors.positive : semanticStatusColors.warning,
                    },
                  ]}
                />
              </View>

              {/* Expanded Mobile Details */}
              {isExpanded && (
                <View style={styles.expandedMobileBox}>
                  <View style={styles.expandedGrid}>
                    <View style={styles.expandedGridItem}>
                      <Text style={styles.expandedLabel}>FUNDING GAP</Text>
                      <Text style={[styles.expandedValue, { color: gap > 0 ? semanticStatusColors.negative : semanticStatusColors.positive }]}>
                        {gap > 0 ? currencyDisplay(String(gap)) : "Fully Funded"}
                      </Text>
                    </View>
                    <View style={styles.expandedGridItem}>
                      <Text style={styles.expandedLabel}>HORIZON</Text>
                      <Text style={styles.expandedValue}>{timeRemainingText}</Text>
                    </View>
                    <View style={styles.expandedGridItem}>
                      <Text style={styles.expandedLabel}>PROBABILITY</Text>
                      <Text style={[styles.expandedValue, { color: probability >= 75 ? semanticStatusColors.positive : semanticStatusColors.warning }]}>
                        {probability}%
                      </Text>
                    </View>
                    <View style={styles.expandedGridItem}>
                      <Text style={styles.expandedLabel}>NEXT ACTION</Text>
                      <Pressable
                        style={styles.actionBtnSmall}
                        onPress={() => onGoalAction?.(goal)}
                      >
                        <Text style={styles.actionBtnTextSmall}>{nextAction}</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}
            </Pressable>
          );
        }

        // Desktop Row
        return (
          <View key={goal.id} style={styles.tableRow}>
            {/* Goal Info */}
            <View style={[{ flex: 3 }, styles.titleCol]}>
              <View style={styles.titleWithBadge}>
                <Text style={styles.goalTitle} numberOfLines={1}>
                  {goal.title}
                </Text>
                {goal.priority && (
                  <View style={styles.priorityBadge}>
                    <Text style={styles.priorityBadgeText}>{goal.priority}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.subMeta}>
                {goal.goalType || "Wealth"} · Target Yr {goal.targetYear || tYear}
              </Text>
            </View>

            {/* Target Amount */}
            <Text style={[styles.tableCell, styles.alignRight, styles.tabularNumber, { flex: 2 }]}>
              {currencyDisplay(String(target))}
            </Text>

            {/* Current Amount */}
            <View style={[{ flex: 2, alignItems: "flex-end" }]}>
              <Text style={[styles.tableCell, styles.tabularNumber]}>
                {currencyDisplay(String(current))}
              </Text>
              <Text style={styles.progressPercent}>{progress.toFixed(1)}% funded</Text>
            </View>

            {/* Gap */}
            <Text
              style={[
                styles.tableCell,
                styles.alignRight,
                styles.tabularNumber,
                { flex: 2, color: gap > 0 ? semanticStatusColors.negative : semanticStatusColors.positive },
              ]}
            >
              {gap > 0 ? currencyDisplay(String(gap)) : "Funded"}
            </Text>

            {/* Time Remaining */}
            <Text style={[styles.tableCell, styles.alignCenter, { flex: 1.5, color: "#94A3B8" }]}>
              {timeRemainingText}
            </Text>

            {/* Probability */}
            <View style={[{ flex: 1.5, alignItems: "center" }]}>
              <View
                style={[
                  styles.probBadge,
                  {
                    backgroundColor:
                      probability >= 75
                        ? "rgba(16, 185, 129, 0.12)"
                        : probability >= 50
                        ? "rgba(245, 158, 11, 0.12)"
                        : "rgba(239, 68, 68, 0.12)",
                    borderColor:
                      probability >= 75
                        ? "rgba(16, 185, 129, 0.3)"
                        : probability >= 50
                        ? "rgba(245, 158, 11, 0.3)"
                        : "rgba(239, 68, 68, 0.3)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.probBadgeText,
                    {
                      color:
                        probability >= 75
                          ? semanticStatusColors.positive
                          : probability >= 50
                          ? semanticStatusColors.warning
                          : semanticStatusColors.negative,
                    },
                  ]}
                >
                  {probability}%
                </Text>
              </View>
            </View>

            {/* Next Action */}
            <View style={[{ flex: 2, alignItems: "flex-end" }]}>
              <Pressable
                style={styles.actionButton}
                onPress={() => onGoalAction?.(goal)}
              >
                <Text style={styles.actionButtonText}>{nextAction}</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: surfaceTokens.surface,
    borderRadius: radiusTokens.sm, // 4
    borderWidth: 1,
    borderColor: surfaceTokens.borderDefault,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: surfaceTokens.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: surfaceTokens.borderDefault,
  },
  headerCell: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: surfaceTokens.borderHairline,
  },
  titleCol: {
    justifyContent: "center",
  },
  titleWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  goalTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#F9FAFB",
  },
  priorityBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radiusTokens.none, // 0
    backgroundColor: "rgba(217, 119, 6, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.3)",
  },
  priorityBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: semanticStatusColors.stale,
    textTransform: "uppercase",
  },
  subMeta: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  tableCell: {
    fontSize: 13,
    color: "#F9FAFB",
  },
  alignRight: {
    textAlign: "right",
  },
  alignCenter: {
    textAlign: "center",
  },
  tabularNumber: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
  },
  progressPercent: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 1,
    fontVariant: ["tabular-nums"],
  },
  probBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radiusTokens.sm, // 4
    borderWidth: 1,
  },
  probBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radiusTokens.sm, // 4
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderWidth: 1,
    borderColor: surfaceTokens.borderDefault,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#F9FAFB",
  },
  // Mobile styles
  mobileRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: surfaceTokens.borderHairline,
  },
  mobileRowExpanded: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
  },
  mobileMainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  mobileMeta: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  tabularMetric: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F9FAFB",
    fontVariant: ["tabular-nums"],
  },
  mobileSubText: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1,
    fontVariant: ["tabular-nums"],
  },
  progressBarBg: {
    height: 3,
    backgroundColor: "rgba(51, 65, 85, 0.5)",
    borderRadius: radiusTokens.none,
    marginTop: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: radiusTokens.none,
  },
  expandedMobileBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: surfaceTokens.borderHairline,
  },
  expandedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  expandedGridItem: {
    width: "48%",
    marginBottom: 4,
  },
  expandedLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 2,
  },
  expandedValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F9FAFB",
    fontVariant: ["tabular-nums"],
  },
  actionBtnSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radiusTokens.sm,
    backgroundColor: "rgba(30, 41, 59, 0.9)",
    borderWidth: 1,
    borderColor: surfaceTokens.borderDefault,
    alignSelf: "flex-start",
  },
  actionBtnTextSmall: {
    fontSize: 10,
    fontWeight: "600",
    color: "#F9FAFB",
  },
  // Empty
  emptyContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: surfaceTokens.borderDefault,
    borderRadius: radiusTokens.sm,
    backgroundColor: surfaceTokens.surface,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F9FAFB",
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    maxWidth: 400,
  },
});
