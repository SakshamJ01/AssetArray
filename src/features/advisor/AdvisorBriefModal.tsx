import React from "react";
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AdvisorBrief } from "../../types/advisor";
import { AppTheme } from "../../theme";

export interface AdvisorBriefModalProps {
  visible: boolean;
  brief: AdvisorBrief | null;
  theme: AppTheme;
  onClose: () => void;
}

export const AdvisorBriefModal: React.FC<AdvisorBriefModalProps> = ({
  visible,
  brief,
  theme,
  onClose,
}) => {
  if (!visible || !brief) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <View
          style={[
            styles.container,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          {/* Top Bar */}
          <View style={[styles.topBar, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconWrap, { backgroundColor: theme.colors.brandStrong + "22" }]}>
                <Ionicons name="sparkles" size={16} color={theme.colors.brand} />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                  GROUNDED ADVISOR BRIEF
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.brand }]}>
                  DETERMINISTIC DECISION SUPPORT SYNTHESIS • {brief.date}
                </Text>
              </View>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={theme.colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Headline Card */}
            <View
              style={[
                styles.headlineCard,
                { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.headlineText, { color: theme.colors.textPrimary }]}>
                "{brief.headline}"
              </Text>
              <Text style={[styles.summaryText, { color: theme.colors.textSecondary }]}>
                {brief.summary}
              </Text>
            </View>

            {/* Grounded Metric Claims Section */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="shield-checkmark" size={14} color={theme.colors.accent} />
                <Text style={[styles.sectionTitle, { color: theme.colors.accent }]}>
                  DETERMINISTIC NUMERICAL GROUNDING
                </Text>
              </View>
              <Text style={[styles.groundingNote, { color: theme.colors.textMuted }]}>
                All numerical claims map strictly to verified source metrics under methodology{" "}
                {brief.methodologyVersion}.
              </Text>

              <View style={styles.claimsGrid}>
                {brief.groundedClaims.map((c, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.claimCard,
                      {
                        backgroundColor: theme.colors.surfaceStrong,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.claimMetric, { color: theme.colors.textMuted }]}>
                      {c.sourceMetric}
                    </Text>
                    <Text style={[styles.claimVal, { color: theme.colors.brand }]}>
                      {String(c.value)} {c.unit || ""}
                    </Text>
                    <Text style={[styles.claimAsOf, { color: theme.colors.textMuted }]}>
                      As-of: {new Date(c.asOf).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Market Context Pills */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                MARKET PULSE OVERVIEW
              </Text>
              <View style={styles.marketRow}>
                {brief.marketContext.map((m, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.marketCard,
                      {
                        backgroundColor: theme.colors.surfaceMuted,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.marketSym, { color: theme.colors.textPrimary }]}>
                      {m.symbol}
                    </Text>
                    <Text
                      style={[
                        styles.marketChange,
                        {
                          color:
                            m.changePct >= 0 ? theme.colors.accent : theme.colors.danger,
                        },
                      ]}
                    >
                      {m.changePct >= 0 ? "+" : ""}
                      {m.changePct.toFixed(2)}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Trends, Risks & Opportunities Columns */}
            <View style={styles.dualGrid}>
              <View
                style={[
                  styles.boxCard,
                  { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.boxHeader, { color: theme.colors.danger }]}>
                  KEY MANDATE RISKS
                </Text>
                {brief.risks.length === 0 ? (
                  <Text style={[styles.itemText, { color: theme.colors.textMuted }]}>
                    No critical portfolio risks detected.
                  </Text>
                ) : (
                  brief.risks.map((r, i) => (
                    <Text key={i} style={[styles.itemText, { color: theme.colors.textPrimary }]}>
                      • {r}
                    </Text>
                  ))
                )}
              </View>

              <View
                style={[
                  styles.boxCard,
                  { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.boxHeader, { color: theme.colors.accent }]}>
                  ACTIVE OPPORTUNITIES
                </Text>
                {brief.opportunities.length === 0 ? (
                  <Text style={[styles.itemText, { color: theme.colors.textMuted }]}>
                    No immediate opportunities detected.
                  </Text>
                ) : (
                  brief.opportunities.map((o, i) => (
                    <Text key={i} style={[styles.itemText, { color: theme.colors.textPrimary }]}>
                      • {o}
                    </Text>
                  ))
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  container: {
    width: "100%",
    maxWidth: 640,
    maxHeight: "90%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 6,
  },
  scrollArea: {
    padding: 16,
  },
  headlineCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  headlineText: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 12,
    lineHeight: 18,
  },
  sectionWrap: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  groundingNote: {
    fontSize: 10,
    marginBottom: 8,
  },
  claimsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  claimCard: {
    flex: 1,
    minWidth: 110,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  claimMetric: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  claimVal: {
    fontSize: 14,
    fontWeight: "900",
    fontFamily: "monospace",
    marginTop: 2,
  },
  claimAsOf: {
    fontSize: 8,
    marginTop: 2,
  },
  marketRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  marketCard: {
    flex: 1,
    minWidth: 90,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  marketSym: {
    fontSize: 10,
    fontWeight: "800",
  },
  marketChange: {
    fontSize: 12,
    fontWeight: "900",
    fontFamily: "monospace",
    marginTop: 2,
  },
  dualGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  boxCard: {
    flex: 1,
    minWidth: 260,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  boxHeader: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  itemText: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 4,
  },
});
