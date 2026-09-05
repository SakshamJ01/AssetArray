import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AdvisorAction, AdvisorActionStatus } from "../../types/advisor";
import { AppTheme } from "../../theme";

export interface PriorityActionCardProps {
  action: AdvisorAction;
  theme: AppTheme;
  onExecuteDeepLink: (action: AdvisorAction) => void;
  onStatusChange: (action: AdvisorAction, status: AdvisorActionStatus) => void;
  onSnooze: (action: AdvisorAction) => void;
  onOpenClient360: (clientId: string) => void;
}

export const PriorityActionCard: React.FC<PriorityActionCardProps> = ({
  action,
  theme,
  onExecuteDeepLink,
  onStatusChange,
  onSnooze,
  onOpenClient360,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isCritical = action.severity === "critical" || action.priority === "URGENT";
  const isDone = action.status === "DONE";
  const isInProgress = action.status === "IN_PROGRESS";
  const isSnoozed = action.status === "SNOOZED";

  const severityColor = isCritical
    ? theme.colors.danger
    : action.severity === "warning"
    ? theme.colors.warning
    : theme.colors.accent;

  const severityBg = isCritical
    ? theme.colors.dangerSoft
    : action.severity === "warning"
    ? theme.colors.warningSoft
    : theme.colors.accentSoft;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isCritical ? theme.colors.danger : theme.colors.border,
          opacity: isDone ? 0.65 : 1,
        },
      ]}
    >
      {/* Header Bar: Client, Tier, Priority Score */}
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => onOpenClient360(action.clientId)}
          style={styles.clientIdentity}
        >
          <View style={[styles.avatarBadge, { backgroundColor: theme.colors.surfaceMuted }]}>
            <Ionicons name="person" size={13} color={theme.colors.brand} />
          </View>
          <View>
            <Text style={[styles.clientName, { color: theme.colors.textPrimary }]}>
              {action.clientName}
            </Text>
            <Text style={[styles.sourceEngine, { color: theme.colors.textMuted }]}>
              {action.sourceEngine.toUpperCase()} ENGINE
            </Text>
          </View>
        </Pressable>

        <View style={styles.headerRight}>
          {/* Severity Badge */}
          <View style={[styles.pill, { backgroundColor: severityBg }]}>
            <Text style={[styles.pillText, { color: severityColor }]}>
              {action.severity?.toUpperCase() || action.priority}
            </Text>
          </View>

          {/* Priority Score Badge */}
          <View style={[styles.scoreBadge, { borderColor: theme.colors.brand }]}>
            <Text style={[styles.scoreLabel, { color: theme.colors.textMuted }]}>SCORE</Text>
            <Text style={[styles.scoreValue, { color: theme.colors.brand }]}>
              {action.priorityScore}
            </Text>
          </View>
        </View>
      </View>

      {/* Main Issue Title */}
      <Text style={[styles.actionTitle, { color: theme.colors.textPrimary }]}>
        {action.title}
      </Text>

      {/* Description Snippet */}
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        {action.description}
      </Text>

      {/* Collapsible 'Why This Matters' + Deterministic Evidence */}
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        style={[
          styles.expandToggle,
          { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
        ]}
      >
        <View style={styles.expandToggleLeft}>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={14}
            color={theme.colors.brand}
          />
          <Text style={[styles.expandToggleText, { color: theme.colors.brand }]}>
            {isExpanded ? "HIDE FIDUCIARY EVIDENCE" : "WHY THIS MATTERS (EVIDENCE)"}
          </Text>
        </View>
        <Text style={[styles.evidenceSnippet, { color: theme.colors.textMuted }]}>
          {action.evidence.metric}: {String(action.evidence.observedValue)}
          {action.evidence.threshold !== undefined ? ` / Lim: ${action.evidence.threshold}` : ""}
        </Text>
      </Pressable>

      {isExpanded && (
        <View
          style={[
            styles.evidenceBox,
            { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.evidenceSectionTitle, { color: theme.colors.brand }]}>
            RATIONALE & IMPACT
          </Text>
          <Text style={[styles.reasonText, { color: theme.colors.textPrimary }]}>
            {action.reason}
          </Text>

          <View style={styles.evidenceGrid}>
            <View style={styles.evidenceItem}>
              <Text style={[styles.evidenceKey, { color: theme.colors.textMuted }]}>
                SOURCE METRIC
              </Text>
              <Text style={[styles.evidenceVal, { color: theme.colors.textPrimary }]}>
                {action.evidence.metric}
              </Text>
            </View>

            <View style={styles.evidenceItem}>
              <Text style={[styles.evidenceKey, { color: theme.colors.textMuted }]}>
                OBSERVED VALUE
              </Text>
              <Text style={[styles.evidenceVal, { color: severityColor }]}>
                {String(action.evidence.observedValue)}
                {action.evidence.unit || ""}
              </Text>
            </View>

            {action.evidence.threshold !== undefined && (
              <View style={styles.evidenceItem}>
                <Text style={[styles.evidenceKey, { color: theme.colors.textMuted }]}>
                  POLICY THRESHOLD
                </Text>
                <Text style={[styles.evidenceVal, { color: theme.colors.textSecondary }]}>
                  {String(action.evidence.threshold)}
                  {action.evidence.unit || ""}
                </Text>
              </View>
            )}
          </View>

          {/* Factor Breakdown */}
          <Text style={[styles.factorsText, { color: theme.colors.textMuted }]}>
            {action.priorityFactors.explanation}
          </Text>
        </View>
      )}

      {/* Recommended Next Step Box */}
      {action.recommendedNextStep && (
        <View style={styles.recommendedStepRow}>
          <Ionicons name="arrow-forward-circle" size={16} color={theme.colors.accent} />
          <Text style={[styles.recommendedStepText, { color: theme.colors.textSecondary }]}>
            <Text style={{ fontWeight: "700", color: theme.colors.accent }}>Next Step: </Text>
            {action.recommendedNextStep}
          </Text>
        </View>
      )}

      {/* Action Buttons Bar */}
      <View style={[styles.actionBar, { borderTopColor: theme.colors.border }]}>
        {/* Deep-Link Button */}
        <Pressable
          onPress={() => onExecuteDeepLink(action)}
          style={[styles.primaryButton, { backgroundColor: theme.colors.brand }]}
        >
          <Ionicons name="flash-outline" size={14} color="#000000" />
          <Text style={styles.primaryButtonText}>
            {action.deepLink.actionLabel || "Review Action"}
          </Text>
        </Pressable>

        {/* Client 360 Quick Button */}
        <Pressable
          onPress={() => onOpenClient360(action.clientId)}
          style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
        >
          <Ionicons name="eye-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>
            Client 360
          </Text>
        </Pressable>

        {/* Lifecycle Transitions */}
        <View style={styles.lifecycleActions}>
          {!isDone && (
            <Pressable
              onPress={() =>
                onStatusChange(action, isInProgress ? "WAITING" : "IN_PROGRESS")
              }
              style={[
                styles.iconAction,
                isInProgress && { backgroundColor: theme.colors.warningSoft },
              ]}
              accessibilityLabel="Toggle in progress"
            >
              <Ionicons
                name={isInProgress ? "time" : "play-outline"}
                size={16}
                color={isInProgress ? theme.colors.warning : theme.colors.textMuted}
              />
            </Pressable>
          )}

          {!isDone && (
            <Pressable
              onPress={() => onSnooze(action)}
              style={styles.iconAction}
              accessibilityLabel="Snooze 24 hours"
            >
              <Ionicons name="alarm-outline" size={16} color={theme.colors.textMuted} />
            </Pressable>
          )}

          <Pressable
            onPress={() =>
              onStatusChange(action, isDone ? "OPEN" : "DONE")
            }
            style={[
              styles.iconAction,
              isDone && { backgroundColor: theme.colors.accentSoft },
            ]}
            accessibilityLabel={isDone ? "Reopen task" : "Mark completed"}
          >
            <Ionicons
              name={isDone ? "checkmark-circle" : "checkmark-circle-outline"}
              size={18}
              color={isDone ? theme.colors.accent : theme.colors.textMuted}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  clientIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  clientName: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  sourceEngine: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  scoreLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  scoreValue: {
    fontSize: 11,
    fontWeight: "900",
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  expandToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  expandToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  expandToggleText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  evidenceSnippet: {
    fontSize: 10,
    fontFamily: "monospace",
  },
  evidenceBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  evidenceSectionTitle: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  evidenceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  evidenceItem: {
    minWidth: 100,
  },
  evidenceKey: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  evidenceVal: {
    fontSize: 12,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  factorsText: {
    fontSize: 10,
    fontStyle: "italic",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 4,
  },
  recommendedStepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  recommendedStepText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    gap: 8,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: "#000000",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  secondaryButtonText: {
    fontSize: 11,
    fontWeight: "600",
  },
  lifecycleActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: "auto",
  },
  iconAction: {
    padding: 6,
    borderRadius: 6,
  },
});
