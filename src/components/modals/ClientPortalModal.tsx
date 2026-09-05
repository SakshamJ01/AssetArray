import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppTheme } from "../../theme";
import { Client } from "../../types/wealth";

export interface ClientPortalModalProps {
  visible: boolean;
  onClose: () => void;
  theme: AppTheme;
  client: Client | null;
  advisorName?: string;
}

export const ClientPortalModal: React.FC<ClientPortalModalProps> = ({
  visible,
  onClose,
  theme,
  client,
  advisorName = "Senior Private Wealth Advisor",
}) => {
  const isDark =
    theme.colors.background === "#030712" ||
    theme.colors.textPrimary === "#ffffff" ||
    theme.colors.textPrimary === "#FFFFFF";

  const brandColor = theme.colors.brand || "#E0A84C";

  const [copiedLink, setCopiedLink] = useState(false);
  const [rebalanceApproved, setRebalanceApproved] = useState(false);

  if (!client) return null;

  const portalUrl = `https://asset-array.web.app/portal/investor-${client.id || "8829"}?auth=fiduciary_token_${Date.now().toString(36)}`;

  const handleCopyLink = () => {
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(portalUrl);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleApproveRebalance = () => {
    setRebalanceApproved(true);
  };

  const holdings = client.portfolio || [];
  const totalAum = holdings.reduce(
    (sum, h) => sum + (Number(h.currentValue) || 0),
    0
  );
  const totalCost = holdings.reduce(
    (sum, h) => sum + (Number(h.investedValue) || 0),
    0
  );
  const unrealizedGainLoss = totalAum - totalCost;
  const unrealizedGainLossPct =
    totalCost > 0 ? ((unrealizedGainLoss / totalCost) * 100).toFixed(1) : null;

  // Calculate actual category breakdown
  const categoryTotals: Record<string, number> = {};
  holdings.forEach((h) => {
    const cls = (h.assetClass || "Stocks").trim();
    categoryTotals[cls] = (categoryTotals[cls] || 0) + (Number(h.currentValue) || 0);
  });
  const categoryKeys = Object.keys(categoryTotals);

  const formatAum = (val: number) => {
    if (val === 0) return "₹0";
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString("en-IN")}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: isDark ? "#070D1B" : "#FFFFFF",
              borderColor: isDark
                ? "rgba(224, 168, 76, 0.35)"
                : "rgba(179, 126, 40, 0.35)",
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              {
                borderBottomColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(15, 23, 42, 0.08)",
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <View
                style={[
                  styles.tagBadge,
                  {
                    backgroundColor: isDark
                      ? "rgba(224, 168, 76, 0.15)"
                      : "rgba(179, 126, 40, 0.15)",
                    borderColor: isDark
                      ? "rgba(224, 168, 76, 0.3)"
                      : "rgba(179, 126, 40, 0.3)",
                  },
                ]}
              >
                <Text style={[styles.tagText, { color: brandColor }]}>
                  INVESTOR CLIENT PORTAL • READ-ONLY PREVIEW
                </Text>
              </View>
              <Text
                style={[
                  styles.title,
                  { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                ]}
              >
                {client.name} — Private Wealth Dashboard
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: isDark ? "#94A3B8" : theme.colors.textSecondary },
                ]}
              >
                Managing Advisor: {advisorName} • Tier: {client.category} Mandate
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.06)"
                    : "rgba(15, 23, 42, 0.06)",
                },
              ]}
            >
              <Text
                style={[
                  styles.closeBtnText,
                  { color: isDark ? "#94A3B8" : theme.colors.textSecondary },
                ]}
              >
                ✕
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Shareable Link Banner */}
            <View
              style={[
                styles.shareCard,
                {
                  backgroundColor: isDark
                    ? "rgba(11, 19, 38, 0.85)"
                    : "rgba(248, 250, 252, 0.95)",
                  borderColor: isDark
                    ? "rgba(224, 168, 76, 0.25)"
                    : "rgba(179, 126, 40, 0.25)",
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.shareLabel}>ENCRYPTED CLIENT PORTAL LINK</Text>
                <Text
                  style={[
                    styles.shareUrl,
                    { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {portalUrl}
                </Text>
              </View>
              <Pressable
                onPress={handleCopyLink}
                style={[
                  styles.copyBtn,
                  { backgroundColor: copiedLink ? "#10B981" : brandColor },
                ]}
              >
                <Text style={styles.copyBtnText}>
                  {copiedLink ? "✓ Link Copied!" : "🔗 Copy Share Link"}
                </Text>
              </Pressable>
            </View>

            {/* Client Portfolio Hero */}
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: isDark
                    ? "rgba(11, 19, 38, 0.75)"
                    : "#FFFFFF",
                  borderColor: isDark
                    ? "rgba(224, 168, 76, 0.22)"
                    : "rgba(179, 126, 40, 0.25)",
                },
              ]}
            >
              <Text style={styles.heroEyebrow}>PORTFOLIO VALUATION</Text>
              <View style={styles.valRow}>
                <Text
                  style={[
                    styles.heroVal,
                    { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                  ]}
                >
                  {totalAum > 0 ? formatAum(totalAum) : "--"}
                </Text>
                {unrealizedGainLossPct !== null && (
                  <View style={styles.deltaBadge}>
                    <Text style={styles.deltaText}>
                      {Number(unrealizedGainLossPct) >= 0 ? "▲ +" : "▼ "}
                      {unrealizedGainLossPct}% Overall
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.kpiRow}>
                <View style={styles.kpiItem}>
                  <Text style={styles.kpiLabel}>TOTAL INVESTED COST</Text>
                  <Text style={[styles.kpiValue, { color: brandColor }]}>
                    {totalCost > 0 ? formatAum(totalCost) : "--"}
                  </Text>
                </View>
                <View style={styles.kpiItem}>
                  <Text style={styles.kpiLabel}>UNREALIZED P&L</Text>
                  <Text
                    style={[
                      styles.kpiValue,
                      { color: unrealizedGainLoss >= 0 ? "#10B981" : "#EF4444" },
                    ]}
                  >
                    {totalAum > 0 ? formatAum(unrealizedGainLoss) : "--"}
                  </Text>
                </View>
                <View style={styles.kpiItem}>
                  <Text style={styles.kpiLabel}>RISK MANDATE</Text>
                  <Text style={[styles.kpiValue, { color: "#3B82F6" }]}>
                    {client.riskProfile || "Balanced Growth"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Asset Allocation Breakdown */}
            <View
              style={[
                styles.allocCard,
                {
                  backgroundColor: isDark
                    ? "rgba(11, 19, 38, 0.75)"
                    : "#FFFFFF",
                  borderColor: isDark
                    ? "rgba(224, 168, 76, 0.22)"
                    : "rgba(179, 126, 40, 0.25)",
                },
              ]}
            >
              <Text
                style={[
                  styles.cardTitle,
                  { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                ]}
              >
                Portfolio Allocation Breakdown
              </Text>

              {categoryKeys.length > 0 && totalAum > 0 ? (
                <View style={styles.allocRow}>
                  {categoryKeys.map((catKey) => {
                    const catVal = categoryTotals[catKey] || 0;
                    const catPct = ((catVal / totalAum) * 100).toFixed(1);
                    return (
                      <View key={catKey} style={styles.allocItem}>
                        <Text style={styles.allocClass}>{catKey}</Text>
                        <Text style={[styles.allocWeight, { color: brandColor }]}>
                          {catPct}%
                        </Text>
                        <Text style={styles.allocVal}>{formatAum(catVal)}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text
                  style={{
                    color: isDark ? "#94A3B8" : theme.colors.textSecondary,
                    fontSize: 13,
                    paddingVertical: 12,
                  }}
                >
                  No portfolio holdings recorded for this client.
                </Text>
              )}
            </View>

            {/* Advisor Rebalancing Status */}
            <View
              style={[
                styles.actionCard,
                {
                  backgroundColor: isDark
                    ? "rgba(224, 168, 76, 0.06)"
                    : "rgba(179, 126, 40, 0.06)",
                  borderColor: isDark
                    ? "rgba(224, 168, 76, 0.3)"
                    : "rgba(179, 126, 40, 0.3)",
                },
              ]}
            >
              <View style={styles.actionHeader}>
                <View
                  style={[
                    styles.pendingBadge,
                    {
                      backgroundColor: rebalanceApproved
                        ? "rgba(16, 185, 129, 0.2)"
                        : "rgba(224, 168, 76, 0.2)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pendingBadgeText,
                      { color: rebalanceApproved ? "#10B981" : brandColor },
                    ]}
                  >
                    {rebalanceApproved ? "✓ REVIEWED BY CLIENT" : "⚡ ADVISORY STATUS"}
                  </Text>
                </View>
                <Text style={styles.actionDate}>Mandate Status</Text>
              </View>

              <Text
                style={[
                  styles.actionTitle,
                  { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                ]}
              >
                {holdings.length > 0
                  ? `Portfolio Monitored Across ${holdings.length} Positions`
                  : "Mandate Setup in Progress"}
              </Text>
              <Text
                style={[
                  styles.actionBody,
                  { color: isDark ? "#94A3B8" : theme.colors.textSecondary },
                ]}
              >
                {holdings.length > 0
                  ? `Asset allocations are tracked in accordance with ${client.name}'s ${client.riskProfile || "Balanced"} investment mandate. Review periodic performance reports and contact your advisor for customized rebalancing.`
                  : `This client account is registered under ${client.category} tier. Custodian statement import or manual position entry is required to activate live performance reporting.`}
              </Text>

              {rebalanceApproved ? (
                <View style={styles.approvalSuccess}>
                  <Text style={styles.approvalSuccessText}>
                    ✓ Approved by {client.name} • Audit Hash: 0x7a8e...f21d • Advisor Dispatched
                  </Text>
                </View>
              ) : (
                <Pressable
                  onPress={handleApproveRebalance}
                  style={[styles.approveBtn, { backgroundColor: brandColor }]}
                >
                  <Text style={styles.approveBtnText}>
                    Approve Fiduciary Rebalancing Execution
                  </Text>
                </Pressable>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(15, 23, 42, 0.08)",
              },
            ]}
          >
            <Pressable
              onPress={onClose}
              style={[
                styles.doneBtn,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(15, 23, 42, 0.08)",
                },
              ]}
            >
              <Text
                style={[
                  styles.doneBtnText,
                  { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                ]}
              >
                Close Portal Preview
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(3, 7, 18, 0.82)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  dialog: {
    width: "100%",
    maxWidth: 860,
    maxHeight: "92%",
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
  },
  tagBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  scrollArea: {
    flex: 1,
  },
  shareCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  shareLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
  },
  shareUrl: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  copyBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  copyBtnText: {
    color: "#030712",
    fontSize: 12,
    fontWeight: "800",
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1.2,
  },
  valRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
    marginVertical: 8,
  },
  heroVal: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  deltaBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.35)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  deltaText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "800",
  },
  kpiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  kpiItem: {
    minWidth: 130,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94A3B8",
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 3,
  },
  allocCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12,
  },
  allocRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  allocItem: {
    flex: 1,
    minWidth: 120,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 10,
    borderRadius: 8,
  },
  allocClass: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
  },
  allocWeight: {
    fontSize: 16,
    fontWeight: "800",
    marginVertical: 2,
  },
  allocVal: {
    fontSize: 11,
    color: "#64748B",
  },
  actionCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 18,
  },
  actionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pendingBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  actionDate: {
    fontSize: 11,
    color: "#94A3B8",
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  actionBody: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  approveBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  approveBtnText: {
    color: "#030712",
    fontSize: 13,
    fontWeight: "800",
  },
  approvalSuccess: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.35)",
    padding: 12,
    borderRadius: 8,
  },
  approvalSuccessText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  doneBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
