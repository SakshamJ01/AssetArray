import React from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ViewStyle, TextStyle } from "react-native";
import { AppTheme } from "../../theme";
import { radiusTokens, typographyTokens, semanticStatusColors, borderTokens } from "../../theme/tokens";

// 1. FinancialMetric: Dominant tabular numerals, secondary label
export interface FinancialMetricProps {
  label: string;
  value: string;
  delta?: string;
  isPositive?: boolean;
  theme: AppTheme;
  size?: "large" | "medium" | "small";
  style?: ViewStyle;
}

export const FinancialMetric: React.FC<FinancialMetricProps> = React.memo(({
  label,
  value,
  delta,
  isPositive,
  theme,
  size = "medium",
  style,
}) => {
  return (
    <View style={[styles.metricContainer, style]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text
        style={[
          styles.metricValue,
          size === "large" && styles.metricValueLarge,
          size === "small" && styles.metricValueSmall,
        ]}
      >
        {value}
      </Text>
      {delta !== undefined && (
        <Text
          style={[
            styles.metricDelta,
            { color: isPositive ? semanticStatusColors.positive : semanticStatusColors.negative },
          ]}
        >
          {isPositive ? "↑ " : "↓ "}{delta}
        </Text>
      )}
    </View>
  );
});

// 2. SectionHeader: Clean hierarchy with title and action button
export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  meta?: string;
  actionText?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = React.memo(({
  title,
  subtitle,
  meta,
  actionText,
  onActionPress,
  style,
}) => {
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={styles.sectionHeaderLeft}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.sectionHeaderRight}>
        {meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}
        {actionText && onActionPress ? (
          <Pressable onPress={onActionPress} style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>{actionText}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

// 3. StatusBadge: Standardized financial status pill
export type StatusBadgeType =
  | "LIVE"
  | "DELAYED"
  | "STALE"
  | "OFFLINE"
  | "SIMULATED"
  | "DEMO"
  | "UNAVAILABLE"
  | "SYNCING"
  | "SYNCED"
  | "POSITIVE"
  | "NEGATIVE"
  | "WARNING"
  | "CRITICAL";

export interface StatusBadgeProps {
  type: StatusBadgeType;
  label?: string;
  style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = React.memo(({ type, label, style }) => {
  let bg = "rgba(148, 163, 184, 0.12)";
  let border = "rgba(148, 163, 184, 0.25)";
  let dotColor: string = semanticStatusColors.neutral;
  let text = label || type;

  switch (type) {
    case "LIVE":
    case "POSITIVE":
    case "SYNCED":
      bg = semanticStatusColors.positiveMuted;
      border = "rgba(16, 185, 129, 0.35)";
      dotColor = semanticStatusColors.positive;
      break;
    case "NEGATIVE":
    case "CRITICAL":
    case "OFFLINE":
    case "UNAVAILABLE":
      bg = semanticStatusColors.negativeMuted;
      border = "rgba(239, 68, 68, 0.35)";
      dotColor = semanticStatusColors.negative;
      break;
    case "WARNING":
    case "DELAYED":
    case "STALE":
      bg = semanticStatusColors.warningMuted;
      border = "rgba(245, 158, 11, 0.35)";
      dotColor = semanticStatusColors.warning;
      break;
    case "SIMULATED":
    case "DEMO":
      bg = semanticStatusColors.simulatedMuted;
      border = "rgba(99, 102, 241, 0.35)";
      dotColor = semanticStatusColors.simulated;
      break;
    case "SYNCING":
      bg = semanticStatusColors.infoMuted;
      border = "rgba(6, 182, 212, 0.35)";
      dotColor = semanticStatusColors.info;
      break;
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor: bg, borderColor: border }, style]}>
      <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
      <Text style={[styles.statusText, { color: dotColor }]}>{text}</Text>
    </View>
  );
});

// 4. EmptyState: Explain what is missing, why it matters, what action to take
export interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = React.memo(({
  title,
  description,
  actionText,
  onActionPress,
  style,
}) => {
  return (
    <View style={[styles.emptyContainer, style]}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDesc}>{description}</Text>
      {actionText && onActionPress ? (
        <Pressable onPress={onActionPress} style={styles.emptyActionBtn}>
          <Text style={styles.emptyActionText}>{actionText}</Text>
        </Pressable>
      ) : null}
    </View>
  );
});

// 5. LoadingState: Contextual financial loading spinner
export interface LoadingStateProps {
  message?: string;
  style?: ViewStyle;
}

export const LoadingState: React.FC<LoadingStateProps> = React.memo(({
  message = "Loading verified market data…",
  style,
}) => {
  return (
    <View style={[styles.loadingContainer, style]}>
      <ActivityIndicator size="small" color="#E0A84C" />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
});

// 6. ActionRow: Triage work item row with clear CTA
export interface ActionRowProps {
  title: string;
  subtitle?: string;
  badgeText?: string;
  badgeType?: StatusBadgeType;
  ctaText: string;
  onPressCta: () => void;
  style?: ViewStyle;
}

export const ActionRow: React.FC<ActionRowProps> = React.memo(({
  title,
  subtitle,
  badgeText,
  badgeType = "WARNING",
  ctaText,
  onPressCta,
  style,
}) => {
  return (
    <View style={[styles.actionRow, style]}>
      <View style={styles.actionRowContent}>
        <View style={styles.actionRowTop}>
          <Text style={styles.actionRowTitle} numberOfLines={1}>
            {title}
          </Text>
          {badgeText ? <StatusBadge type={badgeType} label={badgeText} /> : null}
        </View>
        {subtitle ? (
          <Text style={styles.actionRowSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Pressable onPress={onPressCta} style={styles.actionRowCta}>
        <Text style={styles.actionRowCtaText}>{ctaText}</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  metricContainer: {
    padding: 10,
    backgroundColor: "#0B1222",
    borderRadius: radiusTokens.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  metricLabel: {
    ...typographyTokens.label,
    color: "#64748B",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: typographyTokens.metric.fontSize,
    lineHeight: typographyTokens.metric.lineHeight,
    fontWeight: typographyTokens.metric.fontWeight,
    fontVariant: ["tabular-nums"],
    letterSpacing: typographyTokens.metric.letterSpacing,
    color: "#F8FAFC",
  },
  metricValueLarge: {
    fontSize: typographyTokens.metricLarge.fontSize,
    lineHeight: typographyTokens.metricLarge.lineHeight,
    fontWeight: typographyTokens.metricLarge.fontWeight,
    fontVariant: ["tabular-nums"],
    letterSpacing: typographyTokens.metricLarge.letterSpacing,
  },
  metricValueSmall: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  metricDelta: {
    fontSize: 11,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    marginTop: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
    marginBottom: 8,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionTitle: {
    ...typographyTokens.sectionTitle,
    color: "#F8FAFC",
  },
  sectionSubtitle: {
    ...typographyTokens.caption,
    color: "#64748B",
    marginTop: 2,
  },
  sectionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionMeta: {
    ...typographyTokens.caption,
    color: "#94A3B8",
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radiusTokens.button,
    backgroundColor: "rgba(224, 168, 76, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(224, 168, 76, 0.3)",
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#E0A84C",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radiusTokens.badge,
    borderWidth: 1,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B1222",
    borderRadius: radiusTokens.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  emptyTitle: {
    ...typographyTokens.sectionTitle,
    color: "#F8FAFC",
    marginBottom: 4,
  },
  emptyDesc: {
    ...typographyTokens.bodySmall,
    color: "#64748B",
    textAlign: "center",
    maxWidth: 420,
    lineHeight: 18,
  },
  emptyActionBtn: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "rgba(224, 168, 76, 0.15)",
    borderColor: "rgba(224, 168, 76, 0.35)",
    borderWidth: 1,
    borderRadius: radiusTokens.button,
  },
  emptyActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E0A84C",
  },
  loadingContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  loadingText: {
    ...typographyTokens.bodySmall,
    color: "#94A3B8",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#0B1222",
    borderRadius: radiusTokens.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 6,
    gap: 12,
  },
  actionRowContent: {
    flex: 1,
    minWidth: 0,
  },
  actionRowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  actionRowTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F8FAFC",
    flexShrink: 1,
  },
  actionRowSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    lineHeight: 15,
  },
  actionRowCta: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(224, 168, 76, 0.15)",
    borderColor: "rgba(224, 168, 76, 0.35)",
    borderWidth: 1,
    borderRadius: radiusTokens.button,
    flexShrink: 0,
  },
  actionRowCtaText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#E0A84C",
  },
});
