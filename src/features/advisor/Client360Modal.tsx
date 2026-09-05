import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AdvisorAction, Client360Snapshot } from "../../types/advisor";
import { Client, Goal } from "../../types/wealth";
import { AppTheme } from "../../theme";
import { buildClient360Snapshot } from "../../services/advisor/client360";

export interface Client360ModalProps {
  visible: boolean;
  clientId: string | null;
  clients: Client[];
  goals?: Goal[];
  actions?: AdvisorAction[];
  theme: AppTheme;
  onClose: () => void;
  onOpenPortfolio: (clientId: string) => void;
  onGenerateReport: (clientId: string) => void;
  onContactClient: (client: Client) => void;
  onOpenDecisionJournal: (clientId: string) => void;
}

export const Client360Modal: React.FC<Client360ModalProps> = ({
  visible,
  clientId,
  clients,
  goals = [],
  actions = [],
  theme,
  onClose,
  onOpenPortfolio,
  onGenerateReport,
  onContactClient,
  onOpenDecisionJournal,
}) => {
  const [snapshot, setSnapshot] = useState<Client360Snapshot | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !clientId) {
      setSnapshot(null);
      return;
    }

    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    setLoading(true);
    buildClient360Snapshot({ client, goals, actions })
      .then((res) => {
        setSnapshot(res);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Error building client 360 snapshot:", err);
        setLoading(false);
      });
  }, [visible, clientId, clients, goals, actions]);

  if (!visible || !clientId || !snapshot) return null;

  const { client } = snapshot;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Top Title Bar */}
          <View style={[styles.topBar, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.topBarLeft}>
              <View style={[styles.avatarBox, { backgroundColor: theme.colors.surfaceMuted }]}>
                <Ionicons name="shield-checkmark" size={16} color={theme.colors.brand} />
              </View>
              <View>
                <Text style={[styles.modalHeaderTitle, { color: theme.colors.textPrimary }]}>
                  CLIENT 360 WORKSPACE
                </Text>
                <Text style={[styles.modalHeaderSubtitle, { color: theme.colors.brand }]}>
                  HOLISTIC CLIENT INTELLIGENCE
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={theme.colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Identity Card */}
            <View
              style={[
                styles.identityCard,
                { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
              ]}
            >
              <View style={styles.identityRow}>
                <View>
                  <Text style={[styles.clientNameBig, { color: theme.colors.textPrimary }]}>
                    {client.name}
                  </Text>
                  <Text style={[styles.clientCategory, { color: theme.colors.textMuted }]}>
                    {client.category || "Private Client"} • {snapshot.riskProfile} Risk Profile
                  </Text>
                </View>
                <View style={[styles.tierPill, { backgroundColor: theme.colors.brand }]}>
                  <Text style={styles.tierPillText}>
                    {client.priority === "High" ? "TIER 1 HNI" : "STANDARD"}
                  </Text>
                </View>
              </View>

              <View style={styles.contactRow}>
                <Text style={[styles.contactSnippet, { color: theme.colors.textSecondary }]}>
                  Preferred Channel: {snapshot.preferredChannel}
                </Text>
                <Text style={[styles.contactSnippet, { color: theme.colors.textSecondary }]}>
                  Next Review: {snapshot.nextReviewDate}
                </Text>
              </View>
            </View>

            {/* Core Metrics Matrix (2x3 Grid) */}
            <View style={styles.metricGrid}>
              {/* Portfolio AUM */}
              <View
                style={[
                  styles.metricCard,
                  { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
                  PORTFOLIO VALUE
                </Text>
                <Text style={[styles.metricValue, { color: theme.colors.brand }]}>
                  ₹{(snapshot.portfolioValue / 100000).toFixed(2)} Lakh
                </Text>
                <Text
                  style={[
                    styles.metricSub,
                    {
                      color:
                        snapshot.unrealizedGainLoss >= 0
                          ? theme.colors.accent
                          : theme.colors.danger,
                    },
                  ]}
                >
                  {snapshot.unrealizedGainLoss >= 0 ? "+" : ""}
                  {snapshot.unrealizedGainLossPct.toFixed(1)}% Unrealized
                </Text>
              </View>

              {/* Health Score */}
              <View
                style={[
                  styles.metricCard,
                  { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
                  HEALTH SCORE
                </Text>
                <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>
                  {snapshot.healthScore} / 100
                </Text>
                <Text style={[styles.metricSub, { color: theme.colors.accent }]}>
                  Grade: {snapshot.healthGrade}
                </Text>
              </View>

              {/* Goals */}
              <View
                style={[
                  styles.metricCard,
                  { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
                  ACTIVE GOALS
                </Text>
                <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>
                  {snapshot.goalsCount} Active
                </Text>
                <Text style={[styles.metricSub, { color: theme.colors.textSecondary }]}>
                  {snapshot.goalsOnTrack} On Track • {snapshot.goalsAtRisk} At Risk
                </Text>
              </View>

              {/* Risk / Drawdown */}
              <View
                style={[
                  styles.metricCard,
                  { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
                  CURRENT DRAWDOWN
                </Text>
                <Text
                  style={[
                    styles.metricValue,
                    {
                      color:
                        snapshot.currentDrawdownPct > 10
                          ? theme.colors.danger
                          : theme.colors.textPrimary,
                    },
                  ]}
                >
                  -{snapshot.currentDrawdownPct}%
                </Text>
                <Text style={[styles.metricSub, { color: theme.colors.textMuted }]}>
                  From Cost Basis
                </Text>
              </View>

              {/* Tax Loss Harvesting Potential */}
              <View
                style={[
                  styles.metricCard,
                  { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
                  TAX HARVEST OPPORTUNITY
                </Text>
                <Text style={[styles.metricValue, { color: theme.colors.accent }]}>
                  ₹{(snapshot.taxHarvestPotential / 1000).toFixed(1)}k
                </Text>
                <Text style={[styles.metricSub, { color: theme.colors.textMuted }]}>
                  Section 70/74 Shield
                </Text>
              </View>

              {/* Open Alerts & Tasks */}
              <View
                style={[
                  styles.metricCard,
                  { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
                  OPEN ALERTS & TASKS
                </Text>
                <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>
                  {snapshot.openTasksCount} Tasks
                </Text>
                <Text
                  style={[
                    styles.metricSub,
                    {
                      color:
                        snapshot.criticalAlertsCount > 0
                          ? theme.colors.danger
                          : theme.colors.warning,
                    },
                  ]}
                >
                  {snapshot.openAlertsCount} Alerts ({snapshot.criticalAlertsCount} Critical)
                </Text>
              </View>
            </View>

            {/* Next Recommended Action Banner */}
            {snapshot.nextAction && (
              <View
                style={[
                  styles.nextActionBanner,
                  {
                    backgroundColor: theme.colors.brandStrong + "22",
                    borderColor: theme.colors.brand,
                  },
                ]}
              >
                <View style={styles.nextActionHeader}>
                  <Ionicons name="sparkles" size={15} color={theme.colors.brand} />
                  <Text style={[styles.nextActionLabel, { color: theme.colors.brand }]}>
                    RECOMMENDED NEXT ADVISOR ACTION
                  </Text>
                </View>
                <Text style={[styles.nextActionTitle, { color: theme.colors.textPrimary }]}>
                  {snapshot.nextAction.title}
                </Text>
                <Text style={[styles.nextActionDesc, { color: theme.colors.textSecondary }]}>
                  {snapshot.nextAction.recommendedNextStep || snapshot.nextAction.reason}
                </Text>
              </View>
            )}

            {/* Recent Activity Timeline */}
            <View style={styles.timelineSection}>
              <Text style={[styles.sectionHeading, { color: theme.colors.textPrimary }]}>
                RECENT GOVERNANCE & ACTIVITY TIMELINE
              </Text>
              {snapshot.recentActivities.length === 0 ? (
                <Text style={[styles.emptyTimeline, { color: theme.colors.textMuted }]}>
                  No recent activities recorded for this client mandate.
                </Text>
              ) : (
                snapshot.recentActivities.slice(0, 5).map((act, idx) => (
                  <View key={act.id} style={styles.timelineItem}>
                    <View style={styles.timelineDotWrap}>
                      <View style={[styles.timelineDot, { backgroundColor: theme.colors.brand }]} />
                      {idx < 4 && (
                        <View
                          style={[styles.timelineLine, { backgroundColor: theme.colors.border }]}
                        />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={[styles.timelineTitle, { color: theme.colors.textPrimary }]}>
                        {act.title}
                      </Text>
                      <Text style={[styles.timelineDesc, { color: theme.colors.textSecondary }]}>
                        {act.description}
                      </Text>
                      <Text style={[styles.timelineTime, { color: theme.colors.textMuted }]}>
                        {new Date(act.timestamp).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Action Buttons Toolbar */}
            <View style={[styles.buttonToolbar, { borderTopColor: theme.colors.border }]}>
              <Pressable
                onPress={() => {
                  onClose();
                  onOpenPortfolio(client.id);
                }}
                style={[styles.toolBtn, { backgroundColor: theme.colors.brand }]}
              >
                <Ionicons name="pie-chart-outline" size={14} color="#000000" />
                <Text style={styles.toolBtnTextDark}>Open Portfolio</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  onClose();
                  onGenerateReport(client.id);
                }}
                style={[styles.toolBtnSecondary, { borderColor: theme.colors.border }]}
              >
                <Ionicons name="document-text-outline" size={14} color={theme.colors.textPrimary} />
                <Text style={[styles.toolBtnText, { color: theme.colors.textPrimary }]}>
                  Generate Report
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  onClose();
                  onContactClient(client);
                }}
                style={[styles.toolBtnSecondary, { borderColor: theme.colors.border }]}
              >
                <Ionicons name="chatbubble-outline" size={14} color={theme.colors.textPrimary} />
                <Text style={[styles.toolBtnText, { color: theme.colors.textPrimary }]}>
                  Contact
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  onClose();
                  onOpenDecisionJournal(client.id);
                }}
                style={[styles.toolBtnSecondary, { borderColor: theme.colors.brand }]}
              >
                <Ionicons name="journal-outline" size={14} color={theme.colors.brand} />
                <Text style={[styles.toolBtnText, { color: theme.colors.brand }]}>
                  Log Decision
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 680,
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
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeaderTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  modalHeaderSubtitle: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
  },
  scrollArea: {
    padding: 16,
  },
  identityCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  identityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  clientNameBig: {
    fontSize: 18,
    fontWeight: "800",
  },
  clientCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  tierPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tierPillText: {
    color: "#000000",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  contactRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  contactSnippet: {
    fontSize: 11,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    minWidth: "30%",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  metricSub: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: "600",
  },
  nextActionBanner: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  nextActionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  nextActionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  nextActionTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  nextActionDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  timelineSection: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  emptyTimeline: {
    fontSize: 11,
    fontStyle: "italic",
  },
  timelineItem: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  timelineDotWrap: {
    alignItems: "center",
    width: 14,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  timelineDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
  timelineTime: {
    fontSize: 9,
    marginTop: 2,
  },
  buttonToolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
    paddingBottom: 4,
  },
  toolBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toolBtnTextDark: {
    color: "#000000",
    fontSize: 11,
    fontWeight: "800",
  },
  toolBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  toolBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
