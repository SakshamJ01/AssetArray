import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppTheme } from "../../theme";
import {
  LiveInstrument,
  realTimeMarket,
} from "../../services/realTimeMarket";

export interface LiveMarketDepthModalProps {
  visible: boolean;
  onClose: () => void;
  theme: AppTheme;
  symbol: string | null;
  onExecuteTrade?: (order: {
    symbol: string;
    side: "BUY" | "SELL";
    price: number;
    quantity: number;
  }) => void;
}

export const LiveMarketDepthModal: React.FC<LiveMarketDepthModalProps> = ({
  visible,
  onClose,
  theme,
  symbol,
  onExecuteTrade,
}) => {
  const isDark =
    theme.colors.background === "#030712" ||
    theme.colors.textPrimary === "#ffffff" ||
    theme.colors.textPrimary === "#FFFFFF";

  const brandColor = theme.colors.brand || "#E0A84C";

  const [instrument, setInstrument] = useState<LiveInstrument | null>(null);
  const [orderQty, setOrderQty] = useState<string>("50");
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);
  const [priceFlash, setPriceFlash] = useState<"up" | "down" | null>(null);
  const flashTimerRef = useRef<any>(null);
  const orderTimerRef = useRef<any>(null);

  // Subscribe to live market updates for this symbol
  useEffect(() => {
    if (!visible || !symbol) return;

    const initial = realTimeMarket.getInstrument(symbol);
    if (initial) setInstrument(initial);

    const unsubscribe = realTimeMarket.subscribe((quotes) => {
      const updated = quotes[symbol];
      if (updated) {
        setInstrument((prev) => {
          if (prev && prev.price !== updated.price) {
            setPriceFlash(updated.price > prev.price ? "up" : "down");
            if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
            flashTimerRef.current = setTimeout(() => setPriceFlash(null), 800);
          }
          return updated;
        });
      }
    });

    return () => {
      unsubscribe();
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      if (orderTimerRef.current) clearTimeout(orderTimerRef.current);
    };
  }, [visible, symbol]);

  if (!visible || !symbol || !instrument) return null;

  const isPositive = instrument.change >= 0;
  const currencySymbol = instrument.currency === "INR" ? "₹" : "$";

  // Calculate day range percentage
  const dayRangeSpread = instrument.dayHigh - instrument.dayLow || 1;
  const dayRangePct = Math.min(
    100,
    Math.max(
      0,
      ((instrument.price - instrument.dayLow) / dayRangeSpread) * 100
    )
  );

  // Buy/Sell ratio
  const totalVolumeInDepth =
    instrument.depth.totalBidQty + instrument.depth.totalAskQty || 1;
  const buyRatio = Math.round(
    (instrument.depth.totalBidQty / totalVolumeInDepth) * 100
  );
  const sellRatio = 100 - buyRatio;

  const handleOrder = (side: "BUY" | "SELL") => {
    const qty = parseInt(orderQty, 10) || 1;
    if (onExecuteTrade) {
      onExecuteTrade({
        symbol: instrument.symbol,
        side,
        price: instrument.price,
        quantity: qty,
      });
    }

    const totalVal = (qty * instrument.price).toFixed(2);
    setOrderSuccessMsg(
      `✓ Executed ${side} ${qty} shares of ${instrument.symbol} @ ${currencySymbol}${instrument.price.toFixed(
        2
      )} (Total: ${currencySymbol}${totalVal})`
    );

    if (orderTimerRef.current) clearTimeout(orderTimerRef.current);
    orderTimerRef.current = setTimeout(() => {
      setOrderSuccessMsg(null);
    }, 3000);
  };

  // Sparkline tick points
  const ticks = instrument.tickHistory;
  const minTick = Math.min(...ticks);
  const maxTick = Math.max(...ticks);
  const tickRange = maxTick - minTick || 1;
  const chartW = 340;
  const chartH = 60;
  const stepX = chartW / Math.max(1, ticks.length - 1);

  const sparklinePath = ticks.reduce((acc, t, idx) => {
    const x = idx * stepX;
    const y = chartH - 4 - ((t - minTick) / tickRange) * (chartH - 8);
    return idx === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
  }, "");

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
              <View style={styles.titleRow}>
                <View
                  style={[
                    styles.exchangeBadge,
                    {
                      backgroundColor: isDark
                        ? "rgba(224, 168, 76, 0.15)"
                        : "rgba(179, 126, 40, 0.15)",
                    },
                  ]}
                >
                  <Text style={[styles.exchangeText, { color: brandColor }]}>
                    {instrument.exchange} • SIMULATED
                  </Text>
                </View>
                <View style={styles.livePulseDot} />
                <Text style={styles.liveStatusText}>SIM TICKS</Text>
              </View>

              <Text
                style={[
                  styles.title,
                  { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                ]}
              >
                {instrument.name} ({instrument.symbol})
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
            {/* Live LTP & Flash Banner */}
            <View
              style={[
                styles.ltpCard,
                {
                  backgroundColor:
                    priceFlash === "up"
                      ? "rgba(16, 185, 129, 0.22)"
                      : priceFlash === "down"
                      ? "rgba(239, 68, 68, 0.22)"
                      : isDark
                      ? "rgba(11, 19, 38, 0.85)"
                      : "rgba(248, 250, 252, 0.95)",
                  borderColor:
                    priceFlash === "up"
                      ? "#10B981"
                      : priceFlash === "down"
                      ? "#EF4444"
                      : isDark
                      ? "rgba(224, 168, 76, 0.25)"
                      : "rgba(179, 126, 40, 0.25)",
                },
              ]}
            >
              <View>
                <Text style={styles.ltpLabel}>LAST TRADED PRICE (LTP)</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.currencyPrefix, { color: brandColor }]}>
                    {currencySymbol}
                  </Text>
                  <Text
                    style={[
                      styles.priceValue,
                      { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                    ]}
                  >
                    {instrument.price.toFixed(2)}
                  </Text>
                  <View
                    style={[
                      styles.deltaPill,
                      isPositive ? styles.deltaPillPos : styles.deltaPillNeg,
                    ]}
                  >
                    <Text
                      style={[
                        styles.deltaPillText,
                        isPositive ? styles.deltaTextPos : styles.deltaTextNeg,
                      ]}
                    >
                      {isPositive ? "▲ +" : "▼ "}
                      {instrument.change.toFixed(2)} ({isPositive ? "+" : ""}
                      {instrument.changePercent.toFixed(2)}%)
                    </Text>
                  </View>
                </View>
              </View>

              {/* Intraday Live Micro-Tick Sparkline */}
              <View style={styles.chartCol}>
                <Text style={styles.chartColLabel}>INTRADAY TICKS (REAL-TIME)</Text>
                {Platform.OS === "web" ? (
                  // @ts-ignore
                  <svg width={chartW} height={chartH} style={{ display: "block" }}>
                    {/* @ts-ignore */}
                    <path
                      d={sparklinePath}
                      fill="none"
                      stroke={isPositive ? "#10B981" : "#EF4444"}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <Text style={{ color: "#94A3B8", fontSize: 11 }}>
                    Ticks: {ticks.slice(-5).join(" → ")}
                  </Text>
                )}
              </View>
            </View>

            {/* Day Range & Metrics */}
            <View
              style={[
                styles.metricsBar,
                {
                  backgroundColor: isDark
                    ? "rgba(11, 19, 38, 0.6)"
                    : "rgba(15, 23, 42, 0.03)",
                },
              ]}
            >
              <View style={styles.metricItem}>
                <Text style={styles.metricItemLabel}>OPEN</Text>
                <Text
                  style={[
                    styles.metricItemVal,
                    { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                  ]}
                >
                  {currencySymbol}
                  {instrument.open.toFixed(2)}
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricItemLabel}>PREV CLOSE</Text>
                <Text
                  style={[
                    styles.metricItemVal,
                    { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                  ]}
                >
                  {currencySymbol}
                  {instrument.previousClose.toFixed(2)}
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricItemLabel}>DAY HIGH</Text>
                <Text style={[styles.metricItemVal, { color: "#10B981" }]}>
                  {currencySymbol}
                  {instrument.dayHigh.toFixed(2)}
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricItemLabel}>DAY LOW</Text>
                <Text style={[styles.metricItemVal, { color: "#EF4444" }]}>
                  {currencySymbol}
                  {instrument.dayLow.toFixed(2)}
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricItemLabel}>VOLUME</Text>
                <Text
                  style={[
                    styles.metricItemVal,
                    { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                  ]}
                >
                  {(instrument.volume / 1000).toFixed(0)}k
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricItemLabel}>VWAP</Text>
                <Text
                  style={[
                    styles.metricItemVal,
                    { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                  ]}
                >
                  {currencySymbol}
                  {instrument.vwap.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Day Range Progress Slider */}
            <View style={styles.dayRangeWrap}>
              <View style={styles.dayRangeLabels}>
                <Text style={styles.dayRangeLow}>
                  Low: {currencySymbol}
                  {instrument.dayLow.toFixed(2)}
                </Text>
                <Text style={styles.dayRangeHigh}>
                  High: {currencySymbol}
                  {instrument.dayHigh.toFixed(2)}
                </Text>
              </View>
              <View style={styles.dayRangeTrack}>
                <View
                  style={[
                    styles.dayRangeFill,
                    { width: `${dayRangePct}%`, backgroundColor: brandColor },
                  ]}
                />
                <View
                  style={[
                    styles.dayRangeThumb,
                    { left: `${dayRangePct}%`, borderColor: brandColor },
                  ]}
                />
              </View>
            </View>

            {/* 5-Level Market Depth Table */}
            <View
              style={[
                styles.depthCard,
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
              <View style={styles.depthHeaderRow}>
                <Text
                  style={[
                    styles.depthTitle,
                    { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                  ]}
                >
                  Level 2 Market Depth (Live Orders)
                </Text>
                <View style={styles.depthRatioWrap}>
                  <Text style={[styles.ratioBuyText, { color: "#10B981" }]}>
                    Buy: {buyRatio}%
                  </Text>
                  <Text style={styles.ratioSep}>|</Text>
                  <Text style={[styles.ratioSellText, { color: "#EF4444" }]}>
                    Sell: {sellRatio}%
                  </Text>
                </View>
              </View>

              {/* Volume pressure meter */}
              <View style={styles.depthMeter}>
                <View
                  style={[
                    styles.depthMeterBuy,
                    { width: `${buyRatio}%`, backgroundColor: "#10B981" },
                  ]}
                />
                <View
                  style={[
                    styles.depthMeterSell,
                    { width: `${sellRatio}%`, backgroundColor: "#EF4444" },
                  ]}
                />
              </View>

              <View style={styles.depthColumns}>
                {/* Bids Column */}
                <View style={styles.depthSideCol}>
                  <View style={styles.depthTableHeader}>
                    <Text style={styles.depthTh}>BID ORDERS</Text>
                    <Text style={styles.depthTh}>BID QTY</Text>
                    <Text style={[styles.depthTh, { color: "#10B981" }]}>
                      BID PRICE
                    </Text>
                  </View>
                  {instrument.depth.bids.map((b, idx) => (
                    <View key={`bid-${idx}`} style={styles.depthTableRow}>
                      <Text style={styles.depthTdMuted}>{b.orders}</Text>
                      <Text style={styles.depthTd}>{b.quantity.toLocaleString()}</Text>
                      <Text style={[styles.depthTd, { color: "#10B981", fontWeight: "700" }]}>
                        {currencySymbol}
                        {b.price.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.depthTotalRow}>
                    <Text style={styles.depthTotalLabel}>Total Bid Qty</Text>
                    <Text style={[styles.depthTotalVal, { color: "#10B981" }]}>
                      {instrument.depth.totalBidQty.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Asks Column */}
                <View style={styles.depthSideCol}>
                  <View style={styles.depthTableHeader}>
                    <Text style={[styles.depthTh, { color: "#EF4444" }]}>
                      ASK PRICE
                    </Text>
                    <Text style={styles.depthTh}>ASK QTY</Text>
                    <Text style={styles.depthTh}>ASK ORDERS</Text>
                  </View>
                  {instrument.depth.asks.map((a, idx) => (
                    <View key={`ask-${idx}`} style={styles.depthTableRow}>
                      <Text style={[styles.depthTd, { color: "#EF4444", fontWeight: "700" }]}>
                        {currencySymbol}
                        {a.price.toFixed(2)}
                      </Text>
                      <Text style={styles.depthTd}>{a.quantity.toLocaleString()}</Text>
                      <Text style={styles.depthTdMuted}>{a.orders}</Text>
                    </View>
                  ))}
                  <View style={styles.depthTotalRow}>
                    <Text style={styles.depthTotalLabel}>Total Ask Qty</Text>
                    <Text style={[styles.depthTotalVal, { color: "#EF4444" }]}>
                      {instrument.depth.totalAskQty.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Trade / Execution Terminal */}
            <View
              style={[
                styles.tradeCard,
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
                  styles.tradeTitle,
                  { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                ]}
              >
                Fiduciary Order Execution Desk
              </Text>

              <View style={styles.tradeInputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tradeInputLabel}>Quantity (Shares)</Text>
                  <TextInput
                    style={[
                      styles.tradeInput,
                      {
                        color: isDark ? "#F8FAFC" : theme.colors.textPrimary,
                        backgroundColor: isDark
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(15, 23, 42, 0.04)",
                        borderColor: isDark
                          ? "rgba(255, 255, 255, 0.12)"
                          : "rgba(15, 23, 42, 0.12)",
                      },
                    ]}
                    keyboardType="numeric"
                    value={orderQty}
                    onChangeText={setOrderQty}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.tradeInputLabel}>Order Type</Text>
                  <View
                    style={[
                      styles.orderTypeBadge,
                      {
                        backgroundColor: isDark
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(15, 23, 42, 0.04)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.orderTypeText,
                        { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                      ]}
                    >
                      MARKET (LTP {currencySymbol}
                      {instrument.price.toFixed(2)})
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionBtnRow}>
                <Pressable
                  onPress={() => handleOrder("BUY")}
                  style={[styles.tradeBtn, { backgroundColor: "#10B981" }]}
                >
                  <Text style={styles.tradeBtnText}>
                    BUY {instrument.symbol}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleOrder("SELL")}
                  style={[styles.tradeBtn, { backgroundColor: "#EF4444" }]}
                >
                  <Text style={styles.tradeBtnText}>
                    SELL {instrument.symbol}
                  </Text>
                </Pressable>
              </View>

              {orderSuccessMsg && (
                <View style={styles.successToast}>
                  <Text style={styles.successToastText}>{orderSuccessMsg}</Text>
                </View>
              )}
            </View>
          </ScrollView>
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
    maxWidth: 820,
    maxHeight: "92%",
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 8 },
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 18,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  exchangeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  exchangeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  liveStatusText: {
    fontSize: 9,
    color: "#10B981",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  scrollArea: {
    flex: 1,
  },
  ltpCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  ltpLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: 4,
  },
  currencyPrefix: {
    fontSize: 22,
    fontWeight: "800",
  },
  priceValue: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  deltaPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginLeft: 6,
  },
  deltaPillPos: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  deltaPillNeg: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  deltaPillText: {
    fontSize: 12,
    fontWeight: "800",
  },
  deltaTextPos: {
    color: "#10B981",
  },
  deltaTextNeg: {
    color: "#EF4444",
  },
  chartCol: {
    alignItems: "flex-end",
  },
  chartColLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  metricsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  metricItem: {
    minWidth: 80,
  },
  metricItemLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94A3B8",
  },
  metricItemVal: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  dayRangeWrap: {
    marginBottom: 14,
  },
  dayRangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  dayRangeLow: {
    fontSize: 10,
    color: "#EF4444",
    fontWeight: "700",
  },
  dayRangeHigh: {
    fontSize: 10,
    color: "#10B981",
    fontWeight: "700",
  },
  dayRangeTrack: {
    position: "relative",
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  dayRangeFill: {
    height: "100%",
    borderRadius: 3,
  },
  dayRangeThumb: {
    position: "absolute",
    top: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    marginLeft: -6,
  },
  depthCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  depthHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  depthTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  depthRatioWrap: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  ratioBuyText: {
    fontSize: 11,
    fontWeight: "800",
  },
  ratioSep: {
    color: "#64748B",
  },
  ratioSellText: {
    fontSize: 11,
    fontWeight: "800",
  },
  depthMeter: {
    flexDirection: "row",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 12,
  },
  depthMeterBuy: {
    height: "100%",
  },
  depthMeterSell: {
    height: "100%",
  },
  depthColumns: {
    flexDirection: "row",
    gap: 16,
  },
  depthSideCol: {
    flex: 1,
  },
  depthTableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  depthTh: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  depthTableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.03)",
  },
  depthTd: {
    fontSize: 11,
    fontWeight: "600",
    color: "#CBD5E1",
  },
  depthTdMuted: {
    fontSize: 10,
    color: "#64748B",
  },
  depthTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  depthTotalLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
  },
  depthTotalVal: {
    fontSize: 11,
    fontWeight: "800",
  },
  tradeCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  tradeTitle: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 12,
  },
  tradeInputRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  tradeInputLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 4,
  },
  tradeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: "700",
  },
  orderTypeBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center",
  },
  orderTypeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  actionBtnRow: {
    flexDirection: "row",
    gap: 12,
  },
  tradeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  tradeBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  successToast: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.35)",
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  successToastText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
});
