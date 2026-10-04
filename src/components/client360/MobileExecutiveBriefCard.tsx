import React, { useMemo } from "react";
import {
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppTheme } from "../../theme";
import { Client } from "../../types/wealth";
import { exportClientPdfReport } from "../../services/pdfReport";
import { triggerSelectionHaptic } from "../../services/haptics";

export interface MobileExecutiveBriefCardProps {
  client: Client;
  theme: AppTheme;
  currencyDisplay?: string;
  onOpenFullClient?: (clientId: string) => void;
  onLaunchAlgoRebalance?: (client: Client) => void;
}

export const MobileExecutiveBriefCard: React.FC<MobileExecutiveBriefCardProps> = ({
  client,
  theme,
  currencyDisplay = "INR",
  onOpenFullClient,
  onLaunchAlgoRebalance,
}) => {
  const isDark =
    theme.colors.background === "#030712" ||
    theme.colors.textPrimary === "#ffffff" ||
    theme.colors.textPrimary === "#FFFFFF";

  const brandColor = theme.colors.brand || "#E0A84C";

  // Calculations
  const totalValue = useMemo(() => {
    return (client.portfolio || []).reduce(
      (sum: number, h) => sum + (parseFloat(h.currentValue) || (parseFloat(h.quantity) || 0) * 250),
      0
    );
  }, [client]);

  const totalCost = useMemo(() => {
    return (client.portfolio || []).reduce(
      (sum: number, h) => sum + (parseFloat(h.investedValue) || (parseFloat(h.quantity) || 0) * 200),
      0
    );
  }, [client]);

  const totalUnrealizedGain = totalValue - totalCost;
  const gainPct = totalCost > 0 ? (totalUnrealizedGain / totalCost) * 100 : 0;
  const isPositive = totalUnrealizedGain >= 0;

  // Asset allocation breakdown
  const allocation = useMemo(() => {
    const map: Record<string, number> = { Equity: 0, Debt: 0, Gold: 0, Cash: 0 };
    (client.portfolio || []).forEach((h) => {
      const cls = h.assetClass === "Bonds" ? "Debt" : h.assetClass === "Cash" ? "Cash" : "Equity";
      const val = parseFloat(h.currentValue) || 0;
      map[cls] = (map[cls] || 0) + val;
    });
    const total = Math.max(1, totalValue);
    return {
      equityPct: Math.round(((map.Equity || 0) / total) * 100),
      debtPct: Math.round(((map.Debt || 0) / total) * 100),
      goldPct: Math.round(((map.Gold || 0) / total) * 100),
      cashPct: Math.round(((map.Cash || 0) / total) * 100),
    };
  }, [client, totalValue]);

  // Format currency
  const formatCurrency = (val: number) => {
    if (val >= 10_000_000) {
      return `₹${(val / 10_000_000).toFixed(2)} Cr`;
    }
    if (val >= 100_000) {
      return `₹${(val / 100_000).toFixed(2)} L`;
    }
    return `₹${Math.round(val).toLocaleString("en-IN")}`;
  };

  // Actions
  const handleCall = () => {
    if (client.phone) {
      void triggerSelectionHaptic();
      Linking.openURL(`tel:${client.phone}`);
    }
  };

  const handleWhatsApp = () => {
    void triggerSelectionHaptic();
    const phoneClean = (client.phone || "").replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(
      `Hello ${client.name}, here is your latest portfolio summary from AssetArray: Total AUM: ${formatCurrency(
        totalValue
      )} (Unrealized Return: ${isPositive ? "+" : ""}${gainPct.toFixed(1)}%). Let me know if you would like to schedule a review.`
    );
    const url = phoneClean
      ? `https://wa.me/${phoneClean}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    Linking.openURL(url);
  };

  const handleShareReport = async () => {
    void triggerSelectionHaptic();
    try {
      await exportClientPdfReport({ client, advisorName: "Senior Wealth Advisor" });
    } catch (err: any) {
      console.warn("Share report error:", err?.message);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "rgba(15, 23, 42, 0.7)" : "#FFFFFF",
          borderColor: isDark ? "rgba(224, 168, 76, 0.2)" : "rgba(224, 168, 76, 0.3)",
        },
      ]}
    >
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View style={[styles.briefTag, { backgroundColor: "rgba(224, 168, 76, 0.15)" }]}>
              <Text style={[styles.briefTagText, { color: brandColor }]}>30s MEETING SHEET</Text>
            </View>
            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor:
                    client.category === "Family Office"
                      ? "rgba(168, 85, 247, 0.15)"
                      : "rgba(59, 130, 246, 0.15)",
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: client.category === "Family Office" ? "#C084FC" : "#60A5FA",
                  },
                ]}
              >
                {client.category || "HNI"}
              </Text>
            </View>
          </View>
          <Text style={[styles.clientName, { color: isDark ? "#F8FAFC" : theme.colors.textPrimary }]}>
            {client.name}
          </Text>
          <Text style={[styles.clientSubtext, { color: theme.colors.textMuted }]}>
            {client.city ? `Location: ${client.city}` : "High Net Worth Individual"}
          </Text>
        </View>

        {/* 1-Tap Call & WhatsApp Thumb Actions */}
        <View style={styles.actionPillRow}>
          {client.phone && (
            <Pressable style={styles.iconBtn} onPress={handleCall}>
              <Ionicons name="call" size={16} color="#38BDF8" />
            </Pressable>
          )}
          <Pressable style={[styles.iconBtn, styles.waBtn]} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={16} color="#22C55E" />
          </Pressable>
        </View>
      </View>

      {/* Glanceable Numbers Grid */}
      <View style={styles.metricGrid}>
        <View style={styles.metricBox}>
          <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>TOTAL PORTFOLIO</Text>
          <Text style={[styles.metricHeroVal, { color: isDark ? "#F8FAFC" : theme.colors.textPrimary }]}>
            {formatCurrency(totalValue)}
          </Text>
          <Text style={[styles.gainBadgeText, { color: isPositive ? "#10B981" : "#EF4444" }]}>
            {isPositive ? "▲" : "▼"} {isPositive ? "+" : ""}
            {formatCurrency(totalUnrealizedGain)} ({gainPct.toFixed(1)}%)
          </Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>ASSET SPREAD</Text>
          <View style={styles.miniBarWrap}>
            <View style={[styles.barSlice, { flex: Math.max(1, allocation.equityPct), backgroundColor: "#3B82F6" }]} />
            <View style={[styles.barSlice, { flex: Math.max(1, allocation.debtPct), backgroundColor: "#10B981" }]} />
            <View style={[styles.barSlice, { flex: Math.max(1, allocation.goldPct), backgroundColor: "#E0A84C" }]} />
          </View>
          <Text style={[styles.allocationLegend, { color: theme.colors.textSecondary }]}>
            Eq {allocation.equityPct}% · Debt {allocation.debtPct}% · Gold {allocation.goldPct}%
          </Text>
        </View>
      </View>

      {/* Bottom 1-Thumb CTAs */}
      <View style={styles.footerRow}>
        <Pressable
          style={[styles.actionBtn, styles.pdfBtn]}
          onPress={handleShareReport}
        >
          <Ionicons name="document-text-outline" size={14} color="#F8FAFC" />
          <Text style={styles.btnText}>Share PDF Brief</Text>
        </Pressable>

        {onLaunchAlgoRebalance && (
          <Pressable
            style={[styles.actionBtn, styles.algoBtn]}
            onPress={() => onLaunchAlgoRebalance(client)}
          >
            <Ionicons name="flash-outline" size={14} color="#E0A84C" />
            <Text style={[styles.btnText, { color: "#E0A84C" }]}>Algo Slicer</Text>
          </Pressable>
        )}

        {onOpenFullClient && (
          <Pressable
            style={[styles.actionBtn, styles.detailsBtn]}
            onPress={() => onOpenFullClient(client.id)}
          >
            <Text style={styles.detailsBtnText}>Full 360°</Text>
            <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    marginBottom: 4,
  },
  briefTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  briefTagText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: "700",
  },
  clientName: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  clientSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  actionPillRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  waBtn: {
    backgroundColor: "rgba(34, 197, 94, 0.12)",
  },
  metricGrid: {
    flexDirection: "row",
    backgroundColor: "rgba(30, 41, 59, 0.3)",
    borderRadius: 8,
    padding: 12,
    gap: 12,
    marginBottom: 14,
  },
  metricBox: {
    flex: 1,
    justifyContent: "center",
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  metricHeroVal: {
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  gainBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  miniBarWrap: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 4,
    marginBottom: 6,
  },
  barSlice: {
    height: "100%",
  },
  allocationLegend: {
    fontSize: 10,
    fontWeight: "600",
  },
  footerRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 5,
  },
  pdfBtn: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  algoBtn: {
    backgroundColor: "rgba(224, 168, 76, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(224, 168, 76, 0.3)",
  },
  detailsBtn: {
    paddingHorizontal: 8,
  },
  btnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  detailsBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
  },
});
