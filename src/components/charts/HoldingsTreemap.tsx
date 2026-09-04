import React, { useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppTheme } from "../../theme";

export interface TreemapHolding {
  id?: string;
  name?: string;
  assetName?: string;
  symbol?: string;
  ticker?: string;
  currentValue: number;
  investedValue?: number;
  assetClass?: string;
  returnPct?: number;
}

export interface HoldingsTreemapProps {
  holdings: TreemapHolding[];
  theme: AppTheme;
  height?: number;
  currencyPrefix?: string;
  onSelectHolding?: (holding: TreemapHolding) => void;
}

interface TileItem extends TreemapHolding {
  computedName: string;
  computedSymbol: string;
  weight: number; // percentage (0 - 100)
  perfPct: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const HoldingsTreemap: React.FC<HoldingsTreemapProps> = ({
  holdings,
  theme,
  height = 240,
  currencyPrefix = "₹",
  onSelectHolding,
}) => {
  const isDark =
    theme.colors.background === "#030712" ||
    theme.colors.textPrimary === "#ffffff" ||
    theme.colors.textPrimary === "#FFFFFF";

  const brandColor = theme.colors.brand || "#E0A84C";
  const [containerWidth, setContainerWidth] = useState(600);
  const [selectedTile, setSelectedTile] = useState<TileItem | null>(null);

  const totalValue = useMemo(() => {
    return holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0) || 1;
  }, [holdings]);

  // Compute color based on return %
  const getTileColor = (perf: number) => {
    if (perf >= 15) return isDark ? "#065F46" : "#047857"; // Deep Emerald
    if (perf >= 5) return isDark ? "#047857" : "#059669";
    if (perf >= 0) return isDark ? "#0D9488" : "#0D9488"; // Soft Teal
    if (perf >= -5) return isDark ? "#B91C1C" : "#DC2626"; // Muted Red
    return isDark ? "#991B1B" : "#B91C1C"; // Deep Crimson
  };

  // Squarified/Slice layout calculation
  const tiles: TileItem[] = useMemo(() => {
    if (!holdings || holdings.length === 0) return [];

    // Sort descending by value
    const sorted = [...holdings]
      .filter((h) => h.currentValue > 0)
      .sort((a, b) => b.currentValue - a.currentValue);

    if (sorted.length === 0) return [];

    const usableW = Math.max(120, containerWidth);
    const usableH = height;

    // Binary / Slicing recursive tree layout
    interface Box {
      x: number;
      y: number;
      w: number;
      h: number;
    }

    const result: TileItem[] = [];

    const sliceRecursive = (items: TreemapHolding[], box: Box) => {
      if (items.length === 0) return;
      if (items.length === 1) {
        const item = items[0];
        const computedName = item.name || item.assetName || "Asset";
        const computedSymbol =
          item.symbol || item.ticker || computedName.substring(0, 4).toUpperCase();
        const cost = item.investedValue || item.currentValue;
        const perfPct =
          item.returnPct !== undefined
            ? item.returnPct
            : cost > 0
            ? ((item.currentValue - cost) / cost) * 100
            : 0;

        result.push({
          ...item,
          computedName,
          computedSymbol,
          weight: (item.currentValue / totalValue) * 100,
          perfPct,
          x: Math.round(box.x),
          y: Math.round(box.y),
          w: Math.max(2, Math.round(box.w)),
          h: Math.max(2, Math.round(box.h)),
        });
        return;
      }

      // Split into two balanced halves
      const halfTotal = items.reduce((sum, it) => sum + it.currentValue, 0) / 2;
      let acc = 0;
      let splitIdx = 1;

      for (let i = 0; i < items.length - 1; i++) {
        acc += items[i].currentValue;
        if (acc >= halfTotal) {
          splitIdx = i + 1;
          break;
        }
      }

      const leftItems = items.slice(0, splitIdx);
      const rightItems = items.slice(splitIdx);

      const leftSum = leftItems.reduce((s, it) => s + it.currentValue, 0);
      const totalSum = leftSum + rightItems.reduce((s, it) => s + it.currentValue, 0);
      const leftRatio = totalSum > 0 ? leftSum / totalSum : 0.5;

      if (box.w >= box.h) {
        // Split vertically
        const leftW = box.w * leftRatio;
        sliceRecursive(leftItems, { x: box.x, y: box.y, w: leftW, h: box.h });
        sliceRecursive(rightItems, {
          x: box.x + leftW,
          y: box.y,
          w: box.w - leftW,
          h: box.h,
        });
      } else {
        // Split horizontally
        const leftH = box.h * leftRatio;
        sliceRecursive(leftItems, { x: box.x, y: box.y, w: box.w, h: leftH });
        sliceRecursive(rightItems, {
          x: box.x,
          y: box.y + leftH,
          w: box.w,
          h: box.h - leftH,
        });
      }
    };

    sliceRecursive(sorted, { x: 0, y: 0, w: usableW, h: usableH });
    return result;
  }, [containerWidth, height, holdings, totalValue]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 50 && w !== containerWidth) {
      setContainerWidth(w);
    }
  };

  const formatVal = (v: number) => {
    if (v >= 10000000) return `${currencyPrefix}${(v / 10000000).toFixed(2)} Cr`;
    if (v >= 100000) return `${currencyPrefix}${(v / 100000).toFixed(1)} L`;
    return `${currencyPrefix}${v.toLocaleString("en-IN")}`;
  };

  if (!holdings || holdings.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={{ color: "#94A3B8", fontSize: 12 }}>
          No holdings available for heatmap visualization.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: isDark ? "rgba(11, 19, 38, 0.75)" : "#FFFFFF",
          borderColor: isDark
            ? "rgba(224, 168, 76, 0.22)"
            : "rgba(179, 126, 40, 0.25)",
        },
      ]}
    >
      {/* Treemap Header & Inspector */}
      <View style={styles.headerRow}>
        <View>
          <Text
            style={[
              styles.headerTitle,
              { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
            ]}
          >
            Holdings Allocation & Performance Heatmap
          </Text>
          <Text style={styles.headerSubtitle}>
            Tile size indicates weight • Color indicates P&L performance
          </Text>
        </View>

        {/* Legend */}
        <View style={styles.legendWrap}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: "#047857" }]} />
            <Text style={styles.legendText}>+5% & Above</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: "#0D9488" }]} />
            <Text style={styles.legendText}>0% to +5%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: "#DC2626" }]} />
            <Text style={styles.legendText}>Negative</Text>
          </View>
        </View>
      </View>

      {/* Selected Tile Inspector Callout */}
      {selectedTile && (
        <View
          style={[
            styles.inspectorBanner,
            {
              backgroundColor: isDark
                ? "rgba(224, 168, 76, 0.12)"
                : "rgba(179, 126, 40, 0.12)",
              borderColor: brandColor,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.inspectName, { color: isDark ? "#F8FAFC" : theme.colors.textPrimary }]}>
              {selectedTile.computedName} ({selectedTile.computedSymbol})
            </Text>
            <Text style={styles.inspectSub}>
              {selectedTile.assetClass || "Equity"} • Weight: {selectedTile.weight.toFixed(1)}%
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.inspectVal, { color: isDark ? "#F8FAFC" : theme.colors.textPrimary }]}>
              {formatVal(selectedTile.currentValue)}
            </Text>
            <Text
              style={[
                styles.inspectPerf,
                {
                  color: selectedTile.perfPct >= 0 ? "#10B981" : "#EF4444",
                },
              ]}
            >
              {selectedTile.perfPct >= 0 ? "+" : ""}
              {selectedTile.perfPct.toFixed(1)}% Return
            </Text>
          </View>
        </View>
      )}

      {/* Interactive Tile Canvas */}
      <View
        style={[styles.canvas, { height }]}
        onLayout={handleLayout}
      >
        {tiles.map((tile, idx) => {
          const isSelected = selectedTile?.computedSymbol === tile.computedSymbol;
          const showFullText = tile.w >= 65 && tile.h >= 45;
          const showSymbolOnly = tile.w >= 36 && tile.h >= 24;

          return (
            <Pressable
              key={`${tile.computedSymbol}-${idx}`}
              onPress={() => {
                setSelectedTile(tile);
                if (onSelectHolding) onSelectHolding(tile);
              }}
              style={[
                styles.tile,
                {
                  left: tile.x,
                  top: tile.y,
                  width: tile.w - 2, // 2px gap
                  height: tile.h - 2,
                  backgroundColor: getTileColor(tile.perfPct),
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected
                    ? brandColor
                    : "rgba(255, 255, 255, 0.18)",
                },
              ]}
            >
              {showFullText ? (
                <>
                  <Text style={styles.tileSymbol} numberOfLines={1}>
                    {tile.computedSymbol}
                  </Text>
                  <Text style={styles.tileWeight}>
                    {tile.weight.toFixed(1)}%
                  </Text>
                  <Text style={styles.tilePerf}>
                    {tile.perfPct >= 0 ? "+" : ""}
                    {tile.perfPct.toFixed(1)}%
                  </Text>
                </>
              ) : showSymbolOnly ? (
                <Text style={styles.tileSymbolCompact} numberOfLines={1}>
                  {tile.computedSymbol}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  legendWrap: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
  },
  inspectorBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  inspectName: {
    fontSize: 13,
    fontWeight: "800",
  },
  inspectSub: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  inspectVal: {
    fontSize: 13,
    fontWeight: "800",
  },
  inspectPerf: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  canvas: {
    position: "relative",
    width: "100%",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  tile: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    padding: 4,
    overflow: "hidden",
  },
  tileSymbol: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  tileWeight: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 1,
  },
  tilePerf: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 1,
  },
  tileSymbolCompact: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
});
