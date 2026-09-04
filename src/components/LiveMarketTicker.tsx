import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppTheme } from "../theme";
import { CurrencyCode, CURRENCY_REGISTRY } from "../services/currency";

interface TickerItem {
  symbol: string;
  name: string;
  price: string;
  change: string;
  isPositive: boolean;
}

const DEFAULT_TICKERS: TickerItem[] = [
  { symbol: "NIFTY 50", name: "Nifty", price: "24,852.15", change: "+0.45%", isPositive: true },
  { symbol: "S&P 500", name: "S&P", price: "5,648.40", change: "+0.82%", isPositive: true },
  { symbol: "NASDAQ", name: "Nasdaq", price: "17,910.20", change: "+1.25%", isPositive: true },
  { symbol: "GOLD", name: "Gold (oz)", price: "$2,504.60", change: "+0.32%", isPositive: true },
  { symbol: "BTC/USD", name: "Bitcoin", price: "$64,250.00", change: "+2.10%", isPositive: true },
  { symbol: "ETH/USD", name: "Ethereum", price: "$3,480.00", change: "-0.85%", isPositive: false },
  { symbol: "RELIANCE", name: "RIL", price: "₹3,015.00", change: "-0.35%", isPositive: false },
  { symbol: "INFY", name: "Infosys", price: "₹1,850.20", change: "+1.15%", isPositive: true },
];

export interface LiveMarketTickerProps {
  theme: AppTheme;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  activeCurrency?: CurrencyCode;
  onCycleCurrency?: () => void;
}

export const LiveMarketTicker: React.FC<LiveMarketTickerProps> = ({
  theme,
  onRefresh,
  isRefreshing = false,
  activeCurrency = "INR",
  onCycleCurrency,
}) => {
  const isDark =
    theme.colors.background === "#030712" ||
    theme.colors.textPrimary === "#ffffff" ||
    theme.colors.textPrimary === "#FFFFFF";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "rgba(11, 19, 38, 0.75)" : "rgba(248, 250, 252, 0.95)",
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.liveIndicatorRow}>
        <View style={styles.liveDotWrapper}>
          <View style={styles.liveDotPulse} />
          <View style={styles.liveDot} />
        </View>
        <Text style={styles.liveLabel}>LIVE DESK</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {DEFAULT_TICKERS.map((item, index) => (
          <View key={`${item.symbol}-${index}`} style={styles.tickerItem}>
            <Text style={[styles.symbolText, { color: theme.colors.textPrimary }]}>
              {item.symbol}
            </Text>
            <Text style={[styles.priceText, { color: theme.colors.textSecondary }]}>
              {item.price}
            </Text>
            <View
              style={[
                styles.changeBadge,
                item.isPositive ? styles.changeBadgePositive : styles.changeBadgeNegative,
              ]}
            >
              <Text
                style={[
                  styles.changeText,
                  item.isPositive ? styles.changeTextPositive : styles.changeTextNegative,
                ]}
              >
                {item.change}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {onCycleCurrency ? (
        <Pressable
          style={styles.currencyChip}
          onPress={onCycleCurrency}
        >
          <Text style={styles.currencyChipText}>
            {CURRENCY_REGISTRY[activeCurrency || "INR"]?.flag || "🇮🇳"}{" "}
            {CURRENCY_REGISTRY[activeCurrency || "INR"]?.symbol || "₹"}{" "}
            {activeCurrency || "INR"} ▾
          </Text>
        </Pressable>
      ) : null}

      {onRefresh ? (
        <Pressable
          style={[styles.refreshChip, isRefreshing && styles.refreshChipActive]}
          onPress={onRefresh}
          disabled={isRefreshing}
        >
          <Text style={styles.refreshChipText}>
            {isRefreshing ? "Syncing..." : "⚡ Sync"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    height: 42,
    zIndex: 10,
  },
  liveIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.08)",
  },
  liveDotWrapper: {
    position: "relative",
    width: 10,
    height: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22c55e",
  },
  liveDotPulse: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(34, 197, 94, 0.35)",
  },
  liveLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#22c55e",
    letterSpacing: 0.8,
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 16,
  },
  tickerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  symbolText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  priceText: {
    fontSize: 11,
    fontWeight: "500",
  },
  changeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  changeBadgePositive: {
    backgroundColor: "rgba(34, 197, 94, 0.14)",
  },
  changeBadgeNegative: {
    backgroundColor: "rgba(239, 68, 68, 0.14)",
  },
  changeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  changeTextPositive: {
    color: "#4ade80",
  },
  changeTextNegative: {
    color: "#f87171",
  },
  refreshChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(224, 168, 76, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(224, 168, 76, 0.25)",
    marginLeft: 6,
  },
  refreshChipActive: {
    opacity: 0.6,
  },
  refreshChipText: {
    color: "#E0A84C",
    fontSize: 11,
    fontWeight: "700",
  },
  currencyChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    marginLeft: 6,
  },
  currencyChipText: {
    color: "#F8FAFC",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
