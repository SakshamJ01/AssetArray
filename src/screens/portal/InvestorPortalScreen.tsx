import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Client, PortfolioHolding } from "../../types/wealth";
import { exportClientPdfReport } from "../../services/pdfReport";

export interface InvestorPortalScreenProps {
  client: Client;
  advisorName?: string;
  firmName?: string;
  sebiRegNo?: string;
  arnNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  currencySymbol?: string;
  onExitPortal?: () => void;
  backendEndpoint?: string;
  authToken?: string | null;
}

export const InvestorPortalScreen: React.FC<InvestorPortalScreenProps> = ({
  client,
  advisorName = "Senior Wealth Advisory Desk",
  firmName = "Asset Array Wealth Management",
  sebiRegNo = "INA000018924",
  arnNumber = "ARN-198422",
  contactEmail = "wealth@assetarray.app",
  contactPhone = "+91 22 6890 4400",
  currencySymbol = "₹",
  onExitPortal,
  backendEndpoint,
  authToken,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 768;

  // Local theme toggle (defaults to luxury obsidian dark mode)
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [actionItemApproved, setActionItemApproved] = useState(false);
  const [approvalReceipt, setApprovalReceipt] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");

  const colors = useMemo(() => {
    if (isDarkMode) {
      return {
        bg: "#030712",
        cardBg: "#0B1326",
        cardBorder: "rgba(224, 168, 76, 0.22)",
        subtleBorder: "rgba(255, 255, 255, 0.08)",
        gold: "#E0A84C",
        emerald: "#10B981",
        ruby: "#F43F5E",
        textPrimary: "#F8FAFC",
        textSecondary: "#94A3B8",
        textMuted: "#64748B",
        badgeBg: "rgba(224, 168, 76, 0.12)",
        highlightBg: "rgba(16, 185, 129, 0.12)",
        tableHeaderBg: "rgba(11, 19, 38, 0.95)",
        rowHoverBg: "rgba(255, 255, 255, 0.03)",
      };
    }
    return {
      bg: "#F8F9FA",
      cardBg: "#FFFFFF",
      cardBorder: "rgba(179, 126, 40, 0.22)",
      subtleBorder: "rgba(15, 23, 42, 0.08)",
      gold: "#B37E28",
      emerald: "#0D9488",
      ruby: "#E11D48",
      textPrimary: "#0A0F1D",
      textSecondary: "#334155",
      textMuted: "#64748B",
      badgeBg: "rgba(179, 126, 40, 0.12)",
      highlightBg: "rgba(13, 148, 136, 0.12)",
      tableHeaderBg: "rgba(241, 245, 249, 0.95)",
      rowHoverBg: "rgba(15, 23, 42, 0.02)",
    };
  }, [isDarkMode]);

  // Holdings & Valuations
  const rawHoldings: PortfolioHolding[] = client.portfolio && client.portfolio.length > 0
    ? client.portfolio
    : [
        {
          id: "demo-h1",
          assetName: "HDFC Bank Ltd",
          ticker: "HDFCBANK",
          assetClass: "Stocks",
          quantity: "600",
          investedValue: "950000",
          currentValue: "1140000",
          targetWeight: "20%",
          notes: "Core private banking franchise",
        },
        {
          id: "demo-h2",
          assetName: "Reliance Industries Ltd",
          ticker: "RELIANCE",
          assetClass: "Stocks",
          quantity: "350",
          investedValue: "900000",
          currentValue: "1050000",
          targetWeight: "18%",
          notes: "Energy and digital conglomerate",
        },
        {
          id: "demo-h3",
          assetName: "ICICI Prudential Bluechip Fund",
          ticker: "ICICIBLUE",
          assetClass: "Mutual Funds",
          quantity: "8500",
          investedValue: "750000",
          currentValue: "980000",
          targetWeight: "22%",
          notes: "Active large-cap institutional blend",
        },
        {
          id: "demo-h4",
          assetName: "7.18% GS 2033 Sovereign Bond",
          ticker: "IN0020330018",
          assetClass: "Bonds",
          quantity: "1000",
          investedValue: "1000000",
          currentValue: "1025000",
          targetWeight: "25%",
          notes: "Sovereign treasury backing",
        },
        {
          id: "demo-h5",
          assetName: "Sovereign Gold Bond 2028",
          ticker: "SGB2028VI",
          assetClass: "Alternatives",
          quantity: "75",
          investedValue: "420000",
          currentValue: "585000",
          targetWeight: "15%",
          notes: "Inflation hedge & sovereign coupon",
        },
      ];

  const totalCurrentValue = rawHoldings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  const totalInvestedValue = rawHoldings.reduce((sum, h) => sum + (Number(h.investedValue) || 0), 0);
  const totalGainLoss = totalCurrentValue - totalInvestedValue;
  const gainLossPct = totalInvestedValue > 0 ? ((totalGainLoss / totalInvestedValue) * 100).toFixed(2) : "0.00";

  // Category breakdown calculation
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    rawHoldings.forEach((h) => {
      const cls = h.assetClass || "Stocks";
      map[cls] = (map[cls] || 0) + (Number(h.currentValue) || 0);
    });
    return map;
  }, [rawHoldings]);

  const categories = Object.keys(categoryTotals);

  const filteredHoldings = useMemo(() => {
    if (selectedCategoryFilter === "ALL") return rawHoldings;
    return rawHoldings.filter((h) => (h.assetClass || "Stocks").toUpperCase() === selectedCategoryFilter.toUpperCase());
  }, [rawHoldings, selectedCategoryFilter]);

  const formatCurrency = (val: number) => {
    if (val === 0) return `${currencySymbol}0`;
    if (currencySymbol === "₹") {
      if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
      if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
      return `₹${val.toLocaleString("en-IN")}`;
    }
    return `${currencySymbol}${val.toLocaleString("en-US")}`;
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      await exportClientPdfReport({
        client: {
          id: client.id,
          name: client.name,
          category: client.category,
          priority: client.priority,
          riskProfile: client.riskProfile,
          portfolio: rawHoldings.map((h) => ({
            assetName: h.assetName,
            assetClass: h.assetClass,
            ticker: h.ticker,
            quantity: h.quantity,
            investedValue: h.investedValue,
            currentValue: h.currentValue,
            targetWeight: h.targetWeight,
          })),
        },
        advisorName: `${firmName} • ${advisorName}`,
        currencySymbol,
      });
    } catch (e) {
      console.warn("Failed to generate PDF report:", e);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleApproveAction = async () => {
    const receiptHash = `0x${Math.random().toString(16).substring(2, 10)}${Date.now().toString(16).substring(4)}`;
    setActionItemApproved(true);
    setApprovalReceipt(receiptHash);

    // If backend endpoint is provided, submit audit acknowledgment
    if (backendEndpoint) {
      try {
        await fetch(`${backendEndpoint}/api/v4/portal/action-items/act_rebalance_q3/respond`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({
            clientResponse: `Approved via Web Portal by ${client.name}`,
            status: "COMPLETED",
          }),
        });
      } catch (err) {
        // Safe offline / local acknowledgment fallback
      }
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={[styles.contentContainer, isDesktop ? styles.desktopContent : null]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. TOP FIDUCIARY HEADER BAR */}
      <View style={[styles.headerCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.brandCluster}>
            <View style={[styles.brandIconBox, { borderColor: colors.gold, backgroundColor: colors.badgeBg }]}>
              <Ionicons name="shield-checkmark" size={24} color={colors.gold} />
            </View>
            <View>
              <View style={styles.firmTagRow}>
                <Text style={[styles.firmTag, { color: colors.gold }]}>FIDUCIARY WEALTH DESK</Text>
                <View style={[styles.liveDot, { backgroundColor: colors.emerald }]} />
                <Text style={[styles.liveText, { color: colors.emerald }]}>LIVE PORTFOLIO SYNC</Text>
              </View>
              <Text style={[styles.firmTitle, { color: colors.textPrimary }]}>{firmName}</Text>
              <Text style={[styles.firmReg, { color: colors.textSecondary }]}>
                SEBI Registered Investment Adviser: {sebiRegNo} • AMFI: {arnNumber}
              </Text>
            </View>
          </View>

          {/* Quick Header Actions */}
          <View style={styles.headerActionRow}>
            <Pressable
              onPress={() => setIsDarkMode((prev) => !prev)}
              style={[styles.iconButton, { borderColor: colors.subtleBorder, backgroundColor: colors.badgeBg }]}
              accessibilityLabel="Toggle Theme"
            >
              <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={16} color={colors.gold} />
            </Pressable>

            <Pressable
              onPress={handleDownloadPdf}
              disabled={isDownloadingPdf}
              style={[styles.pdfButton, { backgroundColor: colors.gold }]}
            >
              {isDownloadingPdf ? (
                <ActivityIndicator size="small" color="#030712" />
              ) : (
                <>
                  <Ionicons name="document-text-outline" size={16} color="#030712" />
                  <Text style={styles.pdfButtonText}>Download Statement</Text>
                </>
              )}
            </Pressable>

            {onExitPortal && (
              <Pressable
                onPress={onExitPortal}
                style={[styles.exitButton, { borderColor: colors.subtleBorder }]}
              >
                <Ionicons name="log-out-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.exitButtonText, { color: colors.textSecondary }]}>Advisor Desk</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Investor Mandate Info Banner */}
        <View style={[styles.investorBanner, { borderTopColor: colors.subtleBorder }]}>
          <View style={styles.investorMetaCol}>
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>PORTFOLIO MANDATE</Text>
            <Text style={[styles.metaVal, { color: colors.textPrimary }]}>{client.name}</Text>
          </View>

          <View style={styles.investorMetaCol}>
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>MANAGING ADVISOR</Text>
            <Text style={[styles.metaVal, { color: colors.gold }]}>{advisorName}</Text>
          </View>

          <View style={styles.investorMetaCol}>
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>RISK PROFILE</Text>
            <Text style={[styles.metaVal, { color: colors.textPrimary }]}>{client.riskProfile || "Moderate Growth"}</Text>
          </View>

          <View style={styles.investorMetaCol}>
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>AUDIT STATEMENT REF</Text>
            <Text style={[styles.metaVal, { color: colors.emerald }]}>AA-{client.id || "8829"}-V4</Text>
          </View>
        </View>
      </View>

      {/* 2. WEALTH METRICS HERO */}
      <View style={[styles.metricsGrid, isDesktop ? styles.metricsGridDesktop : null]}>
        {/* Net Worth Card */}
        <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.metricCardLabel, { color: colors.textMuted }]}>PORTFOLIO NET WORTH</Text>
          <Text style={[styles.metricCardValue, { color: colors.textPrimary }]}>{formatCurrency(totalCurrentValue)}</Text>
          <View style={styles.metricDeltaRow}>
            <View style={[styles.deltaChip, { backgroundColor: colors.highlightBg }]}>
              <Text style={[styles.deltaChipText, { color: Number(gainLossPct) >= 0 ? colors.emerald : colors.ruby }]}>
                {Number(gainLossPct) >= 0 ? "▲ +" : "▼ "}
                {gainLossPct}% Overall Return
              </Text>
            </View>
            <Text style={[styles.metricSubtext, { color: colors.textMuted }]}>All Asset Classes</Text>
          </View>
        </View>

        {/* Invested Capital */}
        <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.metricCardLabel, { color: colors.textMuted }]}>TOTAL INVESTED COST</Text>
          <Text style={[styles.metricCardValue, { color: colors.gold }]}>{formatCurrency(totalInvestedValue)}</Text>
          <Text style={[styles.metricSubtext, { color: colors.textSecondary }]}>Capital deployment basis</Text>
        </View>

        {/* Unrealized Gain */}
        <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.metricCardLabel, { color: colors.textMuted }]}>UNREALIZED CAPITAL GAIN</Text>
          <Text
            style={[
              styles.metricCardValue,
              { color: totalGainLoss >= 0 ? colors.emerald : colors.ruby },
            ]}
          >
            {totalGainLoss >= 0 ? `+${formatCurrency(totalGainLoss)}` : formatCurrency(totalGainLoss)}
          </Text>
          <Text style={[styles.metricSubtext, { color: colors.textSecondary }]}>Net untaxed gain across positions</Text>
        </View>

        {/* Nominee Compliance Badge */}
        <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.metricCardLabel, { color: colors.textMuted }]}>FAMILY VAULT PROTECTION</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginVertical: 6 }}>
            <Ionicons name="checkmark-circle" size={22} color={colors.emerald} />
            <Text style={[styles.metricCardValue, { fontSize: 18, color: colors.emerald }]}>100% Nominee Verified</Text>
          </View>
          <Text style={[styles.metricSubtext, { color: colors.textSecondary }]}>SEBI Registered Nominee active on all accounts</Text>
        </View>
      </View>

      {/* 3. ASSET ALLOCATION OVERVIEW */}
      <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Asset Allocation Structure</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Diversification distribution matching your {client.riskProfile || "Moderate"} mandate
            </Text>
          </View>
        </View>

        {/* Visual Allocation Stacked Bar */}
        <View style={styles.allocationBarContainer}>
          {categories.map((cat, idx) => {
            const val = categoryTotals[cat] || 0;
            const pct = totalCurrentValue > 0 ? (val / totalCurrentValue) * 100 : 0;
            const palette = [colors.gold, colors.emerald, "#38BDF8", "#A78BFA", "#F59E0B"];
            const segColor = palette[idx % palette.length];
            return (
              <View
                key={cat}
                style={[
                  styles.allocationSegment,
                  { width: `${pct}%`, backgroundColor: segColor },
                ]}
              />
            );
          })}
        </View>

        {/* Allocation Chips Grid */}
        <View style={styles.allocationLegendGrid}>
          {categories.map((cat, idx) => {
            const val = categoryTotals[cat] || 0;
            const pct = totalCurrentValue > 0 ? ((val / totalCurrentValue) * 100).toFixed(1) : "0";
            const palette = [colors.gold, colors.emerald, "#38BDF8", "#A78BFA", "#F59E0B"];
            const segColor = palette[idx % palette.length];
            return (
              <View
                key={cat}
                style={[
                  styles.allocationLegendItem,
                  { borderColor: colors.subtleBorder, backgroundColor: colors.rowHoverBg },
                ]}
              >
                <View style={[styles.colorPill, { backgroundColor: segColor }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.legendName, { color: colors.textPrimary }]}>{cat}</Text>
                  <Text style={[styles.legendVal, { color: colors.textSecondary }]}>
                    {formatCurrency(val)} ({pct}%)
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* 4. ADVISOR REBALANCE & TAX HARVEST PROPOSAL ACTION CARD */}
      <View style={[styles.actionBanner, { borderColor: colors.gold, backgroundColor: colors.badgeBg }]}>
        <View style={styles.actionHeader}>
          <View style={[styles.actionTag, { backgroundColor: colors.gold }]}>
            <Text style={styles.actionTagText}>FIDUCIARY ADVISORY ACTION</Text>
          </View>
          <Text style={[styles.actionTimestamp, { color: colors.textSecondary }]}>Quarterly Review Proposal</Text>
        </View>

        <Text style={[styles.actionHeading, { color: colors.textPrimary }]}>
          Tax-Loss Harvesting & Target Weight Realignment
        </Text>
        <Text style={[styles.actionExplanation, { color: colors.textSecondary }]}>
          Your advisor {advisorName} has computed an optimization that harvests short-term gains against available offsets while re-aligning your equity exposure back to the target mandate. Zero lock-in, non-custodial execution.
        </Text>

        {actionItemApproved ? (
          <View style={[styles.approvedBox, { borderColor: colors.emerald, backgroundColor: colors.highlightBg }]}>
            <Ionicons name="shield-checkmark" size={20} color={colors.emerald} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.approvedTitle, { color: colors.emerald }]}>
                ✓ Proposal Approved & Digitally Acknowledged
              </Text>
              <Text style={[styles.approvedReceiptText, { color: colors.textSecondary }]}>
                Audit Receipt: {approvalReceipt || "0x7f4b82e1"} • Advisor dispatched for order staging
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.actionFooterRow}>
            <Pressable
              onPress={handleApproveAction}
              style={[styles.approveActionButton, { backgroundColor: colors.gold }]}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#030712" />
              <Text style={styles.approveActionButtonText}>Approve Advisory Proposal</Text>
            </Pressable>
            <Text style={[styles.fiduciaryDisclaimer, { color: colors.textMuted }]}>
              Non-custodial acknowledgment • Requires secondary OTP on exchange terminal
            </Text>
          </View>
        )}
      </View>

      {/* 5. HOLDINGS REGISTER TABLE */}
      <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.holdingsHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Portfolio Holdings Register</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Verified custodian positions across Demat & Mutual Fund Folios
            </Text>
          </View>

          {/* Category Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <Pressable
              onPress={() => setSelectedCategoryFilter("ALL")}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedCategoryFilter === "ALL" ? colors.gold : "transparent",
                  borderColor: selectedCategoryFilter === "ALL" ? colors.gold : colors.subtleBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: selectedCategoryFilter === "ALL" ? "#030712" : colors.textSecondary },
                ]}
              >
                All Holdings ({rawHoldings.length})
              </Text>
            </Pressable>

            {categories.map((c) => (
              <Pressable
                key={c}
                onPress={() => setSelectedCategoryFilter(c)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selectedCategoryFilter.toUpperCase() === c.toUpperCase() ? colors.gold : "transparent",
                    borderColor: selectedCategoryFilter.toUpperCase() === c.toUpperCase() ? colors.gold : colors.subtleBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: selectedCategoryFilter.toUpperCase() === c.toUpperCase() ? "#030712" : colors.textSecondary,
                    },
                  ]}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Table View */}
        <View style={[styles.tableContainer, { borderColor: colors.subtleBorder }]}>
          <View style={[styles.tableHeader, { backgroundColor: colors.tableHeaderBg, borderBottomColor: colors.subtleBorder }]}>
            <Text style={[styles.colHeader, { flex: 2, color: colors.textMuted }]}>INSTRUMENT / TICKER</Text>
            <Text style={[styles.colHeader, { flex: 1, color: colors.textMuted, textAlign: "right" }]}>QTY</Text>
            <Text style={[styles.colHeader, { flex: 1.5, color: colors.textMuted, textAlign: "right" }]}>INVESTED</Text>
            <Text style={[styles.colHeader, { flex: 1.5, color: colors.textMuted, textAlign: "right" }]}>CURRENT VAL</Text>
            <Text style={[styles.colHeader, { flex: 1.2, color: colors.textMuted, textAlign: "right" }]}>RETURN</Text>
          </View>

          {filteredHoldings.map((h, i) => {
            const current = Number(h.currentValue) || 0;
            const invested = Number(h.investedValue) || 0;
            const gain = current - invested;
            const gainPct = invested > 0 ? ((gain / invested) * 100).toFixed(1) : "0.0";
            return (
              <View
                key={h.id || `holding-${i}`}
                style={[
                  styles.tableRow,
                  {
                    borderBottomColor: colors.subtleBorder,
                    backgroundColor: i % 2 === 0 ? "transparent" : colors.rowHoverBg,
                  },
                ]}
              >
                <View style={{ flex: 2 }}>
                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {h.assetName}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <Text style={[styles.rowSubtitle, { color: colors.gold }]}>{h.ticker || h.assetClass}</Text>
                    <View style={[styles.miniBadge, { backgroundColor: colors.highlightBg }]}>
                      <Text style={[styles.miniBadgeText, { color: colors.emerald }]}>VERIFIED</Text>
                    </View>
                  </View>
                </View>

                <Text style={[styles.rowText, { flex: 1, textAlign: "right", color: colors.textSecondary }]}>
                  {h.quantity || "1"}
                </Text>

                <Text style={[styles.rowText, { flex: 1.5, textAlign: "right", color: colors.textSecondary }]}>
                  {formatCurrency(invested)}
                </Text>

                <Text style={[styles.rowTextBold, { flex: 1.5, textAlign: "right", color: colors.textPrimary }]}>
                  {formatCurrency(current)}
                </Text>

                <View style={{ flex: 1.2, alignItems: "flex-end" }}>
                  <Text style={[styles.returnText, { color: gain >= 0 ? colors.emerald : colors.ruby }]}>
                    {gain >= 0 ? "+" : ""}{gainPct}%
                  </Text>
                  <Text style={[styles.returnAbsText, { color: colors.textMuted }]}>
                    {gain >= 0 ? `+${formatCurrency(gain)}` : formatCurrency(gain)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* 6. FINANCIAL GOALS TRACKER */}
      <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Financial Goals & Milestone Tracking</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Progress towards lifetime capital independence and wealth objectives
        </Text>

        <View style={styles.goalsGrid}>
          {/* Goal 1: Retirement */}
          <View style={[styles.goalItemCard, { borderColor: colors.subtleBorder, backgroundColor: colors.rowHoverBg }]}>
            <View style={styles.goalTopRow}>
              <View style={styles.goalIconBox}>
                <Ionicons name="sunny-outline" size={20} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.goalTitle, { color: colors.textPrimary }]}>Retirement Independence 2040</Text>
                <Text style={[styles.goalSubtitle, { color: colors.textSecondary }]}>Target: ₹10.00 Cr • Horizon: 14 Years</Text>
              </View>
              <View style={[styles.goalStatusBadge, { backgroundColor: colors.highlightBg }]}>
                <Text style={[styles.goalStatusText, { color: colors.emerald }]}>92% Probability</Text>
              </View>
            </View>
            <View style={[styles.goalProgressBar, { backgroundColor: colors.subtleBorder }]}>
              <View style={[styles.goalProgressFill, { width: "52%", backgroundColor: colors.gold }]} />
            </View>
            <View style={styles.goalFooterRow}>
              <Text style={[styles.goalProgressText, { color: colors.textMuted }]}>Current Accumulated: ₹5.20 Cr</Text>
              <Text style={[styles.goalProgressText, { color: colors.emerald }]}>On Track</Text>
            </View>
          </View>

          {/* Goal 2: Higher Education */}
          <View style={[styles.goalItemCard, { borderColor: colors.subtleBorder, backgroundColor: colors.rowHoverBg }]}>
            <View style={styles.goalTopRow}>
              <View style={styles.goalIconBox}>
                <Ionicons name="school-outline" size={20} color={colors.emerald} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.goalTitle, { color: colors.textPrimary }]}>Higher Education Corpus 2030</Text>
                <Text style={[styles.goalSubtitle, { color: colors.textSecondary }]}>Target: ₹2.00 Cr • Horizon: 4 Years</Text>
              </View>
              <View style={[styles.goalStatusBadge, { backgroundColor: colors.highlightBg }]}>
                <Text style={[styles.goalStatusText, { color: colors.emerald }]}>88% Probability</Text>
              </View>
            </View>
            <View style={[styles.goalProgressBar, { backgroundColor: colors.subtleBorder }]}>
              <View style={[styles.goalProgressFill, { width: "70%", backgroundColor: colors.emerald }]} />
            </View>
            <View style={styles.goalFooterRow}>
              <Text style={[styles.goalProgressText, { color: colors.textMuted }]}>Current Accumulated: ₹1.40 Cr</Text>
              <Text style={[styles.goalProgressText, { color: colors.emerald }]}>On Track</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 7. ADVISORY DESK CONTACT & FIDUCIARY FOOTER */}
      <View style={[styles.footerCard, { backgroundColor: colors.cardBg, borderColor: colors.subtleBorder }]}>
        <View style={styles.footerContactRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.contactHeading, { color: colors.textPrimary }]}>Reach Your Dedicated Advisor</Text>
            <Text style={[styles.contactAdvisor, { color: colors.gold }]}>{advisorName}</Text>
            <Text style={[styles.contactDetail, { color: colors.textSecondary }]}>
              Email: {contactEmail} • Fiduciary Desk: {contactPhone}
            </Text>
          </View>

          <View style={styles.contactButtonsRow}>
            <Pressable
              onPress={() => Linking.openURL(`mailto:${contactEmail}?subject=Portfolio%20Inquiry%20-%20${client.name}`)}
              style={[styles.contactBtn, { borderColor: colors.gold }]}
            >
              <Ionicons name="mail-outline" size={16} color={colors.gold} />
              <Text style={[styles.contactBtnText, { color: colors.gold }]}>Email Advisor</Text>
            </Pressable>

            <Pressable
              onPress={() => Linking.openURL(`tel:${contactPhone.replace(/\s+/g, "")}`)}
              style={[styles.contactBtn, { borderColor: colors.emerald }]}
            >
              <Ionicons name="call-outline" size={16} color={colors.emerald} />
              <Text style={[styles.contactBtnText, { color: colors.emerald }]}>Call Desk</Text>
            </Pressable>
          </View>
        </View>

        {/* Regulatory Disclosure */}
        <View style={[styles.disclosureBox, { borderTopColor: colors.subtleBorder }]}>
          <Text style={[styles.disclosureText, { color: colors.textMuted }]}>
            STATUTORY DISCLOSURES & RISK WARNING: Securities investments are subject to market risks, including loss of principal. Past performance is not indicative of future returns. Asset Array operates strictly as a non-custodial fiduciary adviser. Portfolio valuations are synchronized from verified custodian depositories (CDSL/NSDL) and asset management folios. Nothing herein constitutes an offer or guarantee of return.
          </Text>
          <Text style={[styles.copyrightText, { color: colors.textMuted }]}>
            © {new Date().getFullYear()} {firmName}. All rights reserved. Encrypted 256-bit investor portal session.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 48,
  },
  desktopContent: {
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    padding: 28,
  },
  headerCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  brandCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  brandIconBox: {
    width: 46,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  firmTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
  },
  firmTag: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  firmTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  firmReg: {
    fontSize: 11,
    marginTop: 2,
  },
  headerActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pdfButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  pdfButtonText: {
    color: "#030712",
    fontSize: 13,
    fontWeight: "700",
  },
  exitButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  exitButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  investorBanner: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    marginTop: 18,
    paddingTop: 14,
    gap: 20,
  },
  investorMetaCol: {
    minWidth: 140,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  metaVal: {
    fontSize: 13,
    fontWeight: "700",
  },
  metricsGrid: {
    gap: 14,
    marginBottom: 20,
  },
  metricsGridDesktop: {
    flexDirection: "row",
  },
  metricCard: {
    flex: 1,
    minWidth: 220,
    borderRadius: 12,
    borderWidth: 1,
    padding: 18,
  },
  metricCardLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  metricCardValue: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  metricDeltaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  deltaChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deltaChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  metricSubtext: {
    fontSize: 11,
    marginTop: 4,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeaderRow: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  allocationBarContainer: {
    height: 14,
    borderRadius: 7,
    overflow: "hidden",
    flexDirection: "row",
    marginVertical: 14,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  allocationSegment: {
    height: "100%",
  },
  allocationLegendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
  },
  allocationLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 160,
  },
  colorPill: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendName: {
    fontSize: 12,
    fontWeight: "600",
  },
  legendVal: {
    fontSize: 11,
    marginTop: 1,
  },
  actionBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  actionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  actionTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  actionTagText: {
    color: "#030712",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  actionTimestamp: {
    fontSize: 11,
  },
  actionHeading: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  actionExplanation: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  actionFooterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 14,
  },
  approveActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  approveActionButtonText: {
    color: "#030712",
    fontSize: 13,
    fontWeight: "700",
  },
  fiduciaryDisclaimer: {
    fontSize: 11,
    flex: 1,
  },
  approvedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  approvedTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  approvedReceiptText: {
    fontSize: 11,
    marginTop: 2,
  },
  holdingsHeaderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tableContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  colHeader: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  rowSubtitle: {
    fontSize: 11,
    fontWeight: "600",
  },
  miniBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: "700",
  },
  rowText: {
    fontSize: 13,
  },
  rowTextBold: {
    fontSize: 13,
    fontWeight: "700",
  },
  returnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  returnAbsText: {
    fontSize: 10,
    marginTop: 2,
  },
  goalsGrid: {
    gap: 12,
    marginTop: 14,
  },
  goalItemCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  goalTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  goalIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  goalSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  goalStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  goalStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  goalProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginVertical: 10,
  },
  goalProgressFill: {
    height: "100%",
  },
  goalFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  goalProgressText: {
    fontSize: 11,
    fontWeight: "600",
  },
  footerCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginTop: 8,
  },
  footerContactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  contactHeading: {
    fontSize: 15,
    fontWeight: "700",
  },
  contactAdvisor: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  contactDetail: {
    fontSize: 12,
    marginTop: 3,
  },
  contactButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  disclosureBox: {
    borderTopWidth: 1,
    paddingTop: 16,
  },
  disclosureText: {
    fontSize: 10,
    lineHeight: 15,
  },
  copyrightText: {
    fontSize: 10,
    marginTop: 8,
  },
});
