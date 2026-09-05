import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HealthScoreResult } from "../types/wealth";
import { AppTheme } from "../theme";

interface HealthScoreCardProps {
  theme: AppTheme;
  healthResult: HealthScoreResult;
  onPressDetails?: () => void;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({
  theme,
  healthResult,
  onPressDetails,
}) => {
  const { colors } = theme;
  const { healthScore, grade, factors, recommendations } = healthResult;

  const getGradeColor = () => {
    switch (grade) {
      case "Institutional":
        return colors.accent;
      case "Balanced":
        return colors.brand;
      case "Moderate Risk":
        return colors.warning;
      case "High Fragility":
        return colors.danger;
      default:
        return colors.brand;
    }
  };

  const gradeColor = getGradeColor();

  const factorItems = [
    { label: "Data Completeness", score: factors.dataCompleteness },
    { label: "Diversification (HHI)", score: factors.assetDiversification },
    { label: "Concentration Defense", score: factors.concentrationRisk },
    { label: "Geo & Currency", score: factors.geographicAndCurrency },
    { label: "Liquidity & Debt", score: factors.liabilityManagement },
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="shield-checkmark" size={18} color={colors.brand} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Portfolio Health Diagnostic
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: gradeColor + "22", borderColor: gradeColor }]}>
          <Text style={[styles.badgeText, { color: gradeColor }]}>{grade}</Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <View style={[styles.circleGauge, { borderColor: gradeColor }]}>
          <Text style={[styles.scoreValue, { color: colors.textPrimary }]}>{healthScore}</Text>
          <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>/ 100</Text>
        </View>

        <View style={styles.factorsList}>
          {factorItems.map((item, idx) => (
            <View key={idx} style={styles.factorRow}>
              <Text style={[styles.factorLabel, { color: colors.textSecondary }]}>
                {item.label}
              </Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${item.score}%`,
                      backgroundColor:
                        item.score >= 80
                          ? colors.accent
                          : item.score >= 60
                          ? colors.brand
                          : colors.danger,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.factorScore, { color: colors.textPrimary }]}>
                {item.score}%
              </Text>
            </View>
          ))}
        </View>
      </View>

      {recommendations.length > 0 && (
        <View style={[styles.recommendationBox, { backgroundColor: colors.backgroundMuted, borderColor: colors.border }]}>
          <Ionicons name="bulb-outline" size={16} color={colors.brand} style={styles.recIcon} />
          <Text style={[styles.recommendationText, { color: colors.textSecondary }]}>
            {recommendations[0]}
          </Text>
        </View>
      )}

      {onPressDetails && (
        <Pressable
          onPress={onPressDetails}
          style={[styles.detailsBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.detailsBtnText, { color: colors.brand }]}>
            View Full Breakdown & Actions →
          </Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  circleGauge: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3.5,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 26,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  factorsList: {
    flex: 1,
    gap: 4,
  },
  factorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  factorLabel: {
    fontSize: 10.5,
    width: 115,
    fontWeight: "500",
  },
  barContainer: {
    flex: 1,
    height: 5,
    backgroundColor: "rgba(150, 150, 150, 0.2)",
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
  factorScore: {
    fontSize: 10,
    fontWeight: "700",
    width: 28,
    textAlign: "right",
  },
  recommendationBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  recIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  recommendationText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "500",
  },
  detailsBtn: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: "center",
    borderTopWidth: 1,
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
