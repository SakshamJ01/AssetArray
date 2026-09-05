import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DataQualityReport, MissingDataItem } from "../../types/advisor";
import { AppTheme } from "../../theme";

export interface DataQualityCenterProps {
  report: DataQualityReport;
  theme: AppTheme;
  onResolveItem: (item: MissingDataItem) => void;
}

export const DataQualityCenter: React.FC<DataQualityCenterProps> = ({
  report,
  theme,
  onResolveItem,
}) => {
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
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.warningSoft }]}>
            <Ionicons name="shield-outline" size={18} color={theme.colors.brand} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              DATA QUALITY & FIDUCIARY HYGIENE
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.brand }]}>
              DETERMINISTIC COMPLIANCE AUDIT
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.scorePill,
            {
              backgroundColor:
                report.overallScore >= 80 ? theme.colors.accentSoft : theme.colors.warningSoft,
            },
          ]}
        >
          <Text
            style={[
              styles.scorePillText,
              {
                color:
                  report.overallScore >= 80 ? theme.colors.accent : theme.colors.brand,
              },
            ]}
          >
            {report.overallScore}% FIDELITY
          </Text>
        </View>
      </View>

      {/* Coverage KPI Grid */}
      <View style={styles.kpiGrid}>
        <View
          style={[
            styles.kpiCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.kpiLabel, { color: theme.colors.textMuted }]}>
            PORTFOLIO DATA
          </Text>
          <Text style={[styles.kpiVal, { color: theme.colors.brand }]}>
            {report.portfolioDataCompletenessPct}%
          </Text>
          <Text style={[styles.kpiSub, { color: theme.colors.textSecondary }]}>
            Cost Basis Coverage
          </Text>
        </View>

        <View
          style={[
            styles.kpiCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.kpiLabel, { color: theme.colors.textMuted }]}>
            TAX LOT COVERAGE
          </Text>
          <Text style={[styles.kpiVal, { color: theme.colors.textPrimary }]}>
            {report.taxLotAcquisitionDateCoveragePct}%
          </Text>
          <Text style={[styles.kpiSub, { color: theme.colors.textSecondary }]}>
            Verified Dates
          </Text>
        </View>

        <View
          style={[
            styles.kpiCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.kpiLabel, { color: theme.colors.textMuted }]}>
            HISTORICAL NAV
          </Text>
          <Text style={[styles.kpiVal, { color: theme.colors.textPrimary }]}>
            {report.historicalNavCoveragePct}%
          </Text>
          <Text style={[styles.kpiSub, { color: theme.colors.textSecondary }]}>
            Price Series Depth
          </Text>
        </View>

        <View
          style={[
            styles.kpiCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.kpiLabel, { color: theme.colors.textMuted }]}>
            BENCHMARK MAP
          </Text>
          <Text style={[styles.kpiVal, { color: theme.colors.accent }]}>
            {report.benchmarkCoveragePct}%
          </Text>
          <Text style={[styles.kpiSub, { color: theme.colors.textSecondary }]}>
            Attribution Standard
          </Text>
        </View>
      </View>

      {/* Missing Information Items List */}
      <View
        style={[
          styles.missingSection,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <View style={styles.missingHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            ACTIONABLE DATA REMEDIATION ({report.missingItemsCount} ITEMS)
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textMuted }]}>
            Missing inputs prevent fabrication of ungrounded calculations
          </Text>
        </View>

        {report.missingItems.length === 0 ? (
          <View style={styles.allCleanBox}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.accent} />
            <Text style={[styles.allCleanText, { color: theme.colors.textPrimary }]}>
              All client portfolios and tax lots have complete verified metadata.
            </Text>
          </View>
        ) : (
          report.missingItems.map((item) => {
            const isCritical = item.severity === "CRITICAL";
            return (
              <View
                key={item.id}
                style={[
                  styles.missingItemRow,
                  {
                    borderBottomColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceMuted,
                  },
                ]}
              >
                <View style={styles.itemInfo}>
                  <View style={styles.itemTagRow}>
                    <Text style={[styles.clientTag, { color: theme.colors.brand }]}>
                      {item.clientName}
                    </Text>
                    {item.holdingName && (
                      <Text style={[styles.holdingTag, { color: theme.colors.textMuted }]}>
                        • {item.holdingName}
                      </Text>
                    )}
                    <View
                      style={[
                        styles.severityPill,
                        {
                          backgroundColor: isCritical
                            ? theme.colors.dangerSoft
                            : theme.colors.warningSoft,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.severityPillText,
                          {
                            color: isCritical ? theme.colors.danger : theme.colors.brand,
                          },
                        ]}
                      >
                        {item.missingField.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.itemDesc, { color: theme.colors.textPrimary }]}>
                    {item.issueDescription}
                  </Text>
                  <Text style={[styles.itemActionText, { color: theme.colors.textSecondary }]}>
                    Next: {item.recommendedAction}
                  </Text>
                </View>

                <Pressable
                  onPress={() => onResolveItem(item)}
                  style={[styles.resolveBtn, { borderColor: theme.colors.brand }]}
                >
                  <Text style={[styles.resolveBtnText, { color: theme.colors.brand }]}>
                    Remediate
                  </Text>
                </Pressable>
              </View>
            );
          })
        )}
      </View>
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
  scorePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scorePillText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: 120,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  kpiLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  kpiVal: {
    fontSize: 16,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  kpiSub: {
    fontSize: 9,
    marginTop: 2,
  },
  missingSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  missingHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  allCleanBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
  },
  allCleanText: {
    fontSize: 12,
  },
  missingItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    gap: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  clientTag: {
    fontSize: 11,
    fontWeight: "800",
  },
  holdingTag: {
    fontSize: 10,
  },
  severityPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  severityPillText: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  itemDesc: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  itemActionText: {
    fontSize: 10,
    marginTop: 2,
  },
  resolveBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  resolveBtnText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
