import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import { AppTheme } from "../../theme";
import { PortfolioHolding } from "../../types/wealth";
import { radiusTokens, typographyTokens, semanticStatusColors } from "../../theme/tokens";
import { StatusBadge } from "../ui/WorkstationPrimitives";

export interface HoldingsTableWorkstationProps {
  holdings: PortfolioHolding[];
  totalValue: number;
  totalInvested: number;
  theme: AppTheme;
  clientName?: string;
  portfolioName?: string;
  formatCurrency: (val: number, compact?: boolean) => string;
  onSelectHolding?: (holding: PortfolioHolding) => void;
  onResearchHolding?: (tickerOrName: string) => void;
  onRebalanceHolding?: (holding: PortfolioHolding) => void;
  isDesktop?: boolean;
}

type SortField = "assetName" | "value" | "weight" | "pl" | "drift";
type SortOrder = "asc" | "desc";
type FilterGainLoss = "ALL" | "GAINS" | "LOSSES" | "DRIFT";

export const HoldingsTableWorkstation: React.FC<HoldingsTableWorkstationProps> = React.memo(({
  holdings,
  totalValue,
  totalInvested,
  theme,
  clientName,
  portfolioName,
  formatCurrency,
  onSelectHolding,
  onResearchHolding,
  onRebalanceHolding,
  isDesktop: propIsDesktop,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = propIsDesktop !== undefined ? propIsDesktop : width >= 768;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssetClass, setSelectedAssetClass] = useState<string>("ALL");
  const [gainLossFilter, setGainLossFilter] = useState<FilterGainLoss>("ALL");
  const [groupByAssetClass, setGroupByAssetClass] = useState(false);
  const [sortField, setSortField] = useState<SortField>("value");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [expandedHoldingId, setExpandedHoldingId] = useState<string | null>(null);

  // Available asset classes
  const assetClasses = useMemo(() => {
    const classes = new Set<string>();
    holdings.forEach((h) => {
      if (h.assetClass) classes.add(h.assetClass);
    });
    return ["ALL", ...Array.from(classes)];
  }, [holdings]);

  // Handle Sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Filtered and Sorted Holdings
  const processedHoldings = useMemo(() => {
    return holdings
      .filter((h) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = (h.assetName || "").toLowerCase().includes(q);
          const matchesTicker = (h.ticker || "").toLowerCase().includes(q);
          const matchesClass = (h.assetClass || "").toLowerCase().includes(q);
          if (!matchesName && !matchesTicker && !matchesClass) return false;
        }

        // Asset class filter
        if (selectedAssetClass !== "ALL" && h.assetClass !== selectedAssetClass) {
          return false;
        }

        const curVal = parseFloat(h.currentValue) || 0;
        const invVal = parseFloat(h.investedValue) || 0;
        const pl = curVal - invVal;
        const weight = totalValue > 0 ? (curVal / totalValue) * 100 : 0;
        const targetW = parseFloat(h.targetWeight) || weight;
        const drift = weight - targetW;

        // Gain/Loss filter
        if (gainLossFilter === "GAINS" && pl < 0) return false;
        if (gainLossFilter === "LOSSES" && pl >= 0) return false;
        if (gainLossFilter === "DRIFT" && Math.abs(drift) < 3) return false;

        return true;
      })
      .sort((a, b) => {
        const valA = parseFloat(a.currentValue) || 0;
        const valB = parseFloat(b.currentValue) || 0;
        const invA = parseFloat(a.investedValue) || 0;
        const invB = parseFloat(b.investedValue) || 0;
        const plA = valA - invA;
        const plB = valB - invB;
        const weightA = totalValue > 0 ? (valA / totalValue) * 100 : 0;
        const weightB = totalValue > 0 ? (valB / totalValue) * 100 : 0;
        const targetA = parseFloat(a.targetWeight) || weightA;
        const targetB = parseFloat(b.targetWeight) || weightB;
        const driftA = weightA - targetA;
        const driftB = weightB - targetB;

        let diff = 0;
        if (sortField === "assetName") {
          diff = (a.assetName || "").localeCompare(b.assetName || "");
        } else if (sortField === "value") {
          diff = valA - valB;
        } else if (sortField === "weight") {
          diff = weightA - weightB;
        } else if (sortField === "pl") {
          diff = plA - plB;
        } else if (sortField === "drift") {
          diff = driftA - driftB;
        }

        return sortOrder === "desc" ? -diff : diff;
      });
  }, [holdings, searchQuery, selectedAssetClass, gainLossFilter, sortField, sortOrder, totalValue]);

  // KPI calculations
  const totalPL = totalValue - totalInvested;
  const totalPLPct = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* 1. DENSE WORKSTATION HEADER & CONTROLS */}
      <View style={styles.workstationHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Text style={styles.portfolioTitle}>
              {portfolioName || "Portfolio Holdings Workstation"}
            </Text>
            <StatusBadge type="LIVE" label="LIVE PRICES" />
          </View>
          <Text style={styles.headerMeta}>
            {clientName ? `Client: ${clientName} · ` : ""}
            {holdings.length} Total Positions · Tabular Execution
          </Text>
        </View>

        <View style={styles.headerSummaryRow}>
          <View style={styles.miniKpi}>
            <Text style={styles.miniKpiLabel}>PORTFOLIO VALUE</Text>
            <Text style={styles.miniKpiVal}>{formatCurrency(totalValue)}</Text>
          </View>
          <View style={styles.miniKpiDivider} />
          <View style={styles.miniKpi}>
            <Text style={styles.miniKpiLabel}>NET P&L</Text>
            <Text
              style={[
                styles.miniKpiVal,
                { color: totalPL >= 0 ? semanticStatusColors.positive : semanticStatusColors.negative },
              ]}
            >
              {totalPL >= 0 ? "+" : ""}{formatCurrency(totalPL)} ({totalPLPct.toFixed(1)}%)
            </Text>
          </View>
        </View>
      </View>

      {/* 2. FILTER & SEARCH TOOLBAR */}
      <View style={styles.toolbar}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Filter holdings by name, ticker, or sector…"
          placeholderTextColor="#64748B"
          style={styles.searchInput}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipScroll}>
          {assetClasses.map((cls) => (
            <Pressable
              key={cls}
              onPress={() => setSelectedAssetClass(cls)}
              style={[styles.filterChip, selectedAssetClass === cls && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, selectedAssetClass === cls && styles.filterChipTextActive]}>
                {cls}
              </Text>
            </Pressable>
          ))}

          <View style={styles.chipDivider} />

          <Pressable
            onPress={() => setGainLossFilter("ALL")}
            style={[styles.filterChip, gainLossFilter === "ALL" && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, gainLossFilter === "ALL" && styles.filterChipTextActive]}>
              All P&L
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setGainLossFilter("GAINS")}
            style={[styles.filterChip, gainLossFilter === "GAINS" && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, gainLossFilter === "GAINS" && styles.filterChipTextActive]}>
              Gains
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setGainLossFilter("LOSSES")}
            style={[styles.filterChip, gainLossFilter === "LOSSES" && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, gainLossFilter === "LOSSES" && styles.filterChipTextActive]}>
              Losses
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setGainLossFilter("DRIFT")}
            style={[styles.filterChip, gainLossFilter === "DRIFT" && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, gainLossFilter === "DRIFT" && styles.filterChipTextActive]}>
              Drift &gt;3%
            </Text>
          </Pressable>

          {isDesktop && (
            <Pressable
              onPress={() => setGroupByAssetClass((prev) => !prev)}
              style={[styles.filterChip, groupByAssetClass && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, groupByAssetClass && styles.filterChipTextActive]}>
                {groupByAssetClass ? "Ungroup" : "Group by Class"}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </View>

      {/* 3. WORKSTATION TABLE: ADAPTIVE DESKTOP OR MOBILE EXPANDABLE */}
      {isDesktop ? (
        // DESKTOP WORKSTATION TABLE
        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={{ minWidth: 860, width: "100%" }}>
              <View style={styles.tableHeaderRow}>
                <Pressable onPress={() => handleSort("assetName")} style={{ flex: 2.2, flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.tableHeaderLabel}>ASSET {sortField === "assetName" ? (sortOrder === "asc" ? "▲" : "▼") : ""}</Text>
                </Pressable>
                <Text style={[styles.tableHeaderLabel, { flex: 1, textAlign: "right" }]}>QTY</Text>
                <Text style={[styles.tableHeaderLabel, { flex: 1.2, textAlign: "right" }]}>AVG COST</Text>
                <Text style={[styles.tableHeaderLabel, { flex: 1.2, textAlign: "right" }]}>PRICE</Text>
                <Pressable onPress={() => handleSort("value")} style={{ flex: 1.5, flexDirection: "row", justifyContent: "flex-end" }}>
                  <Text style={styles.tableHeaderLabel}>VALUE {sortField === "value" ? (sortOrder === "asc" ? "▲" : "▼") : ""}</Text>
                </Pressable>
                <Pressable onPress={() => handleSort("weight")} style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end" }}>
                  <Text style={styles.tableHeaderLabel}>WEIGHT {sortField === "weight" ? (sortOrder === "asc" ? "▲" : "▼") : ""}</Text>
                </Pressable>
                <Pressable onPress={() => handleSort("pl")} style={{ flex: 1.4, flexDirection: "row", justifyContent: "flex-end" }}>
                  <Text style={styles.tableHeaderLabel}>UNREALIZED P&L {sortField === "pl" ? (sortOrder === "asc" ? "▲" : "▼") : ""}</Text>
                </Pressable>
                <Pressable onPress={() => handleSort("drift")} style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end" }}>
                  <Text style={styles.tableHeaderLabel}>DRIFT {sortField === "drift" ? (sortOrder === "asc" ? "▲" : "▼") : ""}</Text>
                </Pressable>
                <Text style={[styles.tableHeaderLabel, { flex: 1.2, textAlign: "center" }]}>ACTION</Text>
              </View>

              {processedHoldings.length === 0 ? (
                <View style={styles.emptyTable}>
                  <Text style={styles.emptyTableText}>No holdings match your search and filter criteria.</Text>
                </View>
              ) : (
                processedHoldings.map((h, idx) => {
                  const curVal = parseFloat(h.currentValue) || 0;
                  const invVal = parseFloat(h.investedValue) || 0;
                  const weight = totalValue > 0 ? (curVal / totalValue) * 100 : 0;
                  const targetW = parseFloat(h.targetWeight) || weight;
                  const drift = weight - targetW;
                  const pl = curVal - invVal;
                  const plPct = invVal > 0 ? (pl / invVal) * 100 : 0;
                  const qty = parseFloat(h.quantity) || 1;
                  const price = qty > 0 ? curVal / qty : 0;
                  const avgCost = qty > 0 ? invVal / qty : 0;

                  return (
                    <View key={h.id || idx} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                      <View style={{ flex: 2.2 }}>
                        <Text style={styles.assetName} numberOfLines={1}>{h.assetName}</Text>
                        <Text style={styles.assetMeta}>
                          {h.ticker || h.assetClass} · {h.assetClass}
                        </Text>
                      </View>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>
                        {qty.toLocaleString()}
                      </Text>
                      <Text style={[styles.tableCell, { flex: 1.2, textAlign: "right" }]}>
                        {formatCurrency(avgCost, false)}
                      </Text>
                      <Text style={[styles.tableCell, { flex: 1.2, textAlign: "right" }]}>
                        {formatCurrency(price, false)}
                      </Text>
                      <Text style={[styles.tableCellPrimary, { flex: 1.5, textAlign: "right" }]}>
                        {formatCurrency(curVal)}
                      </Text>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>
                        {weight.toFixed(1)}%
                      </Text>
                      <View style={{ flex: 1.4, alignItems: "flex-end" }}>
                        <Text
                          style={[
                            styles.tableCellPrimary,
                            { color: pl >= 0 ? semanticStatusColors.positive : semanticStatusColors.negative },
                          ]}
                        >
                          {pl >= 0 ? "+" : ""}{formatCurrency(pl)}
                        </Text>
                        <Text
                          style={[
                            styles.assetMeta,
                            { color: plPct >= 0 ? semanticStatusColors.positive : semanticStatusColors.negative },
                          ]}
                        >
                          {plPct >= 0 ? "+" : ""}{plPct.toFixed(1)}%
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.tableCell,
                          {
                            flex: 1,
                            textAlign: "right",
                            color: Math.abs(drift) > 3 ? semanticStatusColors.warning : "#94A3B8",
                            fontWeight: Math.abs(drift) > 3 ? "700" : "400",
                          },
                        ]}
                      >
                        {drift > 0 ? "+" : ""}{drift.toFixed(1)}%
                      </Text>
                      <View style={{ flex: 1.2, flexDirection: "row", justifyContent: "center", gap: 6 }}>
                        {onResearchHolding && (
                          <Pressable
                            onPress={() => onResearchHolding(h.ticker || h.assetName)}
                            style={styles.tableActionBtn}
                          >
                            <Text style={styles.tableActionBtnText}>Research</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        </View>
      ) : (
        // MOBILE WORKSTATION: PRIORITY COLUMNS WITH EXPANDABLE ROW
        <View style={styles.mobileList}>
          {processedHoldings.length === 0 ? (
            <View style={styles.emptyTable}>
              <Text style={styles.emptyTableText}>No holdings match criteria.</Text>
            </View>
          ) : (
            processedHoldings.map((h, idx) => {
              const curVal = parseFloat(h.currentValue) || 0;
              const invVal = parseFloat(h.investedValue) || 0;
              const weight = totalValue > 0 ? (curVal / totalValue) * 100 : 0;
              const targetW = parseFloat(h.targetWeight) || weight;
              const drift = weight - targetW;
              const pl = curVal - invVal;
              const plPct = invVal > 0 ? (pl / invVal) * 100 : 0;
              const qty = parseFloat(h.quantity) || 1;
              const price = qty > 0 ? curVal / qty : 0;
              const avgCost = qty > 0 ? invVal / qty : 0;
              const isExpanded = expandedHoldingId === (h.id || `${idx}`);

              return (
                <View key={h.id || idx} style={styles.mobileCard}>
                  {/* Tap header to toggle expansion */}
                  <Pressable
                    onPress={() =>
                      setExpandedHoldingId((prev) =>
                        prev === (h.id || `${idx}`) ? null : (h.id || `${idx}`)
                      )
                    }
                    style={styles.mobileCardHeader}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.assetName} numberOfLines={1}>{h.assetName}</Text>
                      <Text style={styles.assetMeta}>
                        {h.ticker || h.assetClass} · Weight: {weight.toFixed(1)}%
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.tableCellPrimary}>{formatCurrency(curVal)}</Text>
                      <Text
                        style={[
                          styles.assetMeta,
                          { color: pl >= 0 ? semanticStatusColors.positive : semanticStatusColors.negative },
                        ]}
                      >
                        {pl >= 0 ? "+" : ""}{formatCurrency(pl)} ({plPct.toFixed(1)}%)
                      </Text>
                    </View>
                    <Text style={styles.expandChevron}>{isExpanded ? "▲" : "▼"}</Text>
                  </Pressable>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <View style={styles.mobileDetailPanel}>
                      <View style={styles.detailGrid}>
                        <View style={styles.detailCell}>
                          <Text style={styles.detailLabel}>QUANTITY</Text>
                          <Text style={styles.detailValue}>{qty.toLocaleString()}</Text>
                        </View>
                        <View style={styles.detailCell}>
                          <Text style={styles.detailLabel}>AVG COST</Text>
                          <Text style={styles.detailValue}>{formatCurrency(avgCost, false)}</Text>
                        </View>
                        <View style={styles.detailCell}>
                          <Text style={styles.detailLabel}>PRICE</Text>
                          <Text style={styles.detailValue}>{formatCurrency(price, false)}</Text>
                        </View>
                        <View style={styles.detailCell}>
                          <Text style={styles.detailLabel}>DRIFT</Text>
                          <Text
                            style={[
                              styles.detailValue,
                              { color: Math.abs(drift) > 3 ? semanticStatusColors.warning : "#94A3B8" },
                            ]}
                          >
                            {drift > 0 ? "+" : ""}{drift.toFixed(1)}%
                          </Text>
                        </View>
                      </View>

                      {/* Action Handoffs */}
                      <View style={styles.mobileActionRow}>
                        {onResearchHolding && (
                          <Pressable
                            onPress={() => onResearchHolding(h.ticker || h.assetName)}
                            style={styles.mobileActionBtn}
                          >
                            <Text style={styles.mobileActionBtnText}>Research Asset</Text>
                          </Pressable>
                        )}
                        {onRebalanceHolding && (
                          <Pressable
                            onPress={() => onRebalanceHolding(h)}
                            style={[styles.mobileActionBtn, styles.mobileActionBtnGold]}
                          >
                            <Text style={[styles.mobileActionBtnText, { color: "#E0A84C" }]}>
                              Rebalance
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 10,
    width: "100%",
  },
  workstationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#0B1222",
    borderRadius: radiusTokens.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    flexWrap: "wrap",
    gap: 10,
  },
  headerLeft: {
    flex: 1,
    minWidth: 240,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  portfolioTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  headerMeta: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  headerSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  miniKpi: {
    alignItems: "flex-end",
  },
  miniKpiLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  miniKpiVal: {
    fontSize: 15,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    color: "#F8FAFC",
    marginTop: 2,
  },
  miniKpiDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  toolbar: {
    gap: 8,
  },
  searchInput: {
    backgroundColor: "#0F172A",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderRadius: radiusTokens.input,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#F8FAFC",
    fontSize: 13,
  },
  filterChipScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radiusTokens.badge,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  filterChipActive: {
    backgroundColor: "rgba(224, 168, 76, 0.15)",
    borderColor: "rgba(224, 168, 76, 0.35)",
  },
  filterChipText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#E0A84C",
    fontWeight: "700",
  },
  chipDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 4,
  },
  tableCard: {
    backgroundColor: "#0B1222",
    borderRadius: radiusTokens.none,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#101826",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  tableHeaderLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
    backgroundColor: "#0B1222",
  },
  tableRowAlt: {
    backgroundColor: "#0D1629",
  },
  assetName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  assetMeta: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },
  tableCell: {
    fontSize: 12,
    color: "#CBD5E1",
    fontVariant: ["tabular-nums"],
  },
  tableCellPrimary: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F8FAFC",
    fontVariant: ["tabular-nums"],
  },
  tableActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radiusTokens.button,
    backgroundColor: "rgba(224, 168, 76, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(224, 168, 76, 0.3)",
  },
  tableActionBtnText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#E0A84C",
  },
  emptyTable: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTableText: {
    fontSize: 12,
    color: "#64748B",
  },
  mobileList: {
    gap: 8,
  },
  mobileCard: {
    backgroundColor: "#0B1222",
    borderRadius: radiusTokens.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  mobileCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  expandChevron: {
    fontSize: 10,
    color: "#64748B",
    marginLeft: 4,
  },
  mobileDetailPanel: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    backgroundColor: "#080E1B",
    padding: 12,
    gap: 10,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  detailCell: {
    flex: 1,
    minWidth: "45%",
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F8FAFC",
    fontVariant: ["tabular-nums"],
    marginTop: 2,
  },
  mobileActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  mobileActionBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radiusTokens.button,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
  },
  mobileActionBtnGold: {
    backgroundColor: "rgba(224, 168, 76, 0.12)",
    borderColor: "rgba(224, 168, 76, 0.3)",
  },
  mobileActionBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#38BDF8",
  },
});
