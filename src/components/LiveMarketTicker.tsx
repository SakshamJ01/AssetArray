import React, { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppTheme } from "../theme";
import { CurrencyCode, CURRENCY_REGISTRY } from "../services/currency";
import {
  LiveInstrument,
  realTimeMarket,
} from "../services/realTimeMarket";
import { LiveMarketDepthModal } from "./modals/LiveMarketDepthModal";

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

  const [instruments, setInstruments] = useState<Record<string, LiveInstrument>>(() =>
    realTimeMarket.getInstruments()
  );
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [flashMap, setFlashMap] = useState<Record<string, "up" | "down">>({});
  const prevPricesRef = useRef<Record<string, number>>({});
  const flashTimersRef = useRef<Record<string, any>>({});

  useEffect(() => {
    // Initial prices record
    const current = realTimeMarket.getInstruments();
    const initialPrices: Record<string, number> = {};
    Object.values(current).forEach((inst) => {
      initialPrices[inst.symbol] = inst.price;
    });
    prevPricesRef.current = initialPrices;

    // Subscribe to live tick engine
    const unsubscribe = realTimeMarket.subscribe((updatedInstruments) => {
      const newFlash: Record<string, "up" | "down"> = {};

      Object.values(updatedInstruments).forEach((inst) => {
        const oldPrice = prevPricesRef.current[inst.symbol];
        if (oldPrice !== undefined && oldPrice !== inst.price) {
          const dir = inst.price > oldPrice ? "up" : "down";
          newFlash[inst.symbol] = dir;

          // Clear timer if exists
          if (flashTimersRef.current[inst.symbol]) {
            clearTimeout(flashTimersRef.current[inst.symbol]);
          }

          // Reset flash after 850ms
          flashTimersRef.current[inst.symbol] = setTimeout(() => {
            setFlashMap((prev) => {
              const copy = { ...prev };
              delete copy[inst.symbol];
              return copy;
            });
          }, 850);
        }
        prevPricesRef.current[inst.symbol] = inst.price;
      });

      if (Object.keys(newFlash).length > 0) {
        setFlashMap((prev) => ({ ...prev, ...newFlash }));
      }
      setInstruments({ ...updatedInstruments });
    });

    return () => {
      unsubscribe();
      Object.values(flashTimersRef.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const instrumentList = Object.values(instruments);

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? "rgba(11, 19, 38, 0.85)" : "rgba(248, 250, 252, 0.96)",
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Pressable
          style={styles.liveIndicatorRow}
          onPress={() => {
            // Manual sync tick on clicking live indicator
            realTimeMarket.triggerManualSync();
          }}
        >
          <View style={styles.liveDotWrapper}>
            <View style={styles.liveDotPulse} />
            <View style={styles.liveDot} />
          </View>
          <Text style={styles.liveLabel}>LIVE TICK</Text>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {instrumentList.map((item) => {
            const isPositive = item.change >= 0;
            const flash = flashMap[item.symbol];
            const currSymbol = item.currency === "INR" ? "₹" : "$";
            const formattedPrice = `${currSymbol}${item.price.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
            const changeStr = `${isPositive ? "+" : ""}${item.changePercent.toFixed(2)}%`;

            return (
              <Pressable
                key={item.symbol}
                onPress={() => setSelectedSymbol(item.symbol)}
                style={[
                  styles.tickerItem,
                  flash === "up" && styles.tickerItemFlashUp,
                  flash === "down" && styles.tickerItemFlashDown,
                ]}
              >
                <Text
                  style={[
                    styles.symbolText,
                    { color: theme.colors.textPrimary },
                    flash === "up" && styles.flashTextUp,
                    flash === "down" && styles.flashTextDown,
                  ]}
                >
                  {item.symbol}
                </Text>
                <Text
                  style={[
                    styles.priceText,
                    { color: theme.colors.textSecondary },
                    flash === "up" && styles.flashPriceUp,
                    flash === "down" && styles.flashPriceDown,
                  ]}
                >
                  {formattedPrice}
                </Text>
                <View
                  style={[
                    styles.changeBadge,
                    isPositive ? styles.changeBadgePositive : styles.changeBadgeNegative,
                  ]}
                >
                  <Text
                    style={[
                      styles.changeText,
                      isPositive ? styles.changeTextPositive : styles.changeTextNegative,
                    ]}
                  >
                    {changeStr}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {onCycleCurrency ? (
          <Pressable style={styles.currencyChip} onPress={onCycleCurrency}>
            <Text style={styles.currencyChipText}>
              {CURRENCY_REGISTRY[activeCurrency || "INR"]?.flag || "🇮🇳"}{" "}
              {CURRENCY_REGISTRY[activeCurrency || "INR"]?.symbol || "₹"}{" "}
              {activeCurrency || "INR"} ▾
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          style={[styles.refreshChip, isRefreshing && styles.refreshChipActive]}
          onPress={() => {
            realTimeMarket.triggerManualSync();
            if (onRefresh) onRefresh();
          }}
          disabled={isRefreshing}
        >
          <Text style={styles.refreshChipText}>
            {isRefreshing ? "Syncing..." : "⚡ Sync"}
          </Text>
        </Pressable>
      </View>

      {/* Level 2 Market Depth Terminal Modal */}
      <LiveMarketDepthModal
        visible={Boolean(selectedSymbol)}
        symbol={selectedSymbol}
        theme={theme}
        onClose={() => setSelectedSymbol(null)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    height: 44,
    zIndex: 10,
  },
  liveIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.1)",
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
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(34, 197, 94, 0.4)",
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
    gap: 12,
  },
  tickerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  tickerItemFlashUp: {
    backgroundColor: "rgba(34, 197, 94, 0.16)",
    borderColor: "rgba(34, 197, 94, 0.4)",
  },
  tickerItemFlashDown: {
    backgroundColor: "rgba(239, 68, 68, 0.16)",
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  flashTextUp: {
    color: "#4ade80",
  },
  flashTextDown: {
    color: "#f87171",
  },
  flashPriceUp: {
    color: "#4ade80",
    fontWeight: "700",
  },
  flashPriceDown: {
    color: "#f87171",
    fontWeight: "700",
  },
  symbolText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  priceText: {
    fontSize: 11,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
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
    fontVariant: ["tabular-nums"],
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
