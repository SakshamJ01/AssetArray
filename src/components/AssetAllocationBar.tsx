import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { AppTheme } from "../theme";

interface AssetAllocationBarProps {
  allocationString?: string;
  theme: AppTheme;
}

interface AllocationSegment {
  name: string;
  percent: number;
  color: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  stocks: "#10b981", // Emerald
  equity: "#10b981",
  bonds: "#3b82f6", // Royal Blue
  debt: "#3b82f6",
  "mutual funds": "#8b5cf6", // Violet
  funds: "#8b5cf6",
  alternatives: "#f59e0b", // Gold
  gold: "#f59e0b",
  cash: "#06b6d4", // Cyan
};

function parseAllocation(raw?: string): AllocationSegment[] {
  if (!raw || !raw.trim()) {
    return [
      { name: "Stocks", percent: 50, color: "#10b981" },
      { name: "Bonds", percent: 30, color: "#3b82f6" },
      { name: "Cash", percent: 20, color: "#06b6d4" },
    ];
  }

  // Matches patterns like "Stocks 60%, Bonds 30%" or "Stocks: 60"
  const parts = raw.split(/[,;\n]/).map((p) => p.trim()).filter(Boolean);
  const segments: AllocationSegment[] = [];

  for (const part of parts) {
    const match = part.match(/([a-zA-Z\s]+)[:\s]+(\d+(?:\.\d+)?)\s*%/i) ||
                  part.match(/([a-zA-Z\s]+)\s+(\d+(?:\.\d+)?)/i);

    if (match) {
      const name = match[1].trim();
      const percent = parseFloat(match[2]);
      const lower = name.toLowerCase();
      const color =
        CATEGORY_COLORS[lower] ||
        (lower.includes("stock") ? "#10b981" :
         lower.includes("bond") ? "#3b82f6" :
         lower.includes("alt") || lower.includes("gold") ? "#f59e0b" :
         lower.includes("fund") ? "#8b5cf6" :
         "#06b6d4");

      if (!isNaN(percent) && percent > 0) {
        segments.push({ name, percent, color });
      }
    }
  }

  if (segments.length === 0) {
    return [
      { name: "Equities", percent: 60, color: "#10b981" },
      { name: "Fixed Income", percent: 25, color: "#3b82f6" },
      { name: "Reserves", percent: 15, color: "#06b6d4" },
    ];
  }

  // Normalize to 100%
  const total = segments.reduce((sum, s) => sum + s.percent, 0);
  if (total > 0 && Math.abs(total - 100) > 1) {
    return segments.map((s) => ({
      ...s,
      percent: Math.round((s.percent / total) * 100),
    }));
  }

  return segments;
}

export const AssetAllocationBar: React.FC<AssetAllocationBarProps> = ({
  allocationString,
  theme,
}) => {
  const segments = parseAllocation(allocationString);
  const animProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animProgress.setValue(0);
    Animated.timing(animProgress, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [allocationString, animProgress]);

  return (
    <View style={styles.container}>
      {/* Segmented Progress Bar */}
      <View style={[styles.barContainer, { backgroundColor: "rgba(255, 255, 255, 0.06)" }]}>
        {segments.map((seg, idx) => (
          <Animated.View
            key={`${seg.name}-${idx}`}
            style={[
              styles.segment,
              {
                width: animProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", `${seg.percent}%`],
                }),
                backgroundColor: seg.color,
                borderTopLeftRadius: idx === 0 ? 6 : 0,
                borderBottomLeftRadius: idx === 0 ? 6 : 0,
                borderTopRightRadius: idx === segments.length - 1 ? 6 : 0,
                borderBottomRightRadius: idx === segments.length - 1 ? 6 : 0,
              },
            ]}
          />
        ))}
      </View>

      {/* Legend Dots */}
      <View style={styles.legendRow}>
        {segments.map((seg, idx) => (
          <View key={`legend-${seg.name}-${idx}`} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: seg.color }]} />
            <Text style={[styles.legendName, { color: theme.colors.textSecondary }]}>
              {seg.name}{" "}
              <Text style={[styles.legendPercent, { color: theme.colors.textPrimary }]}>
                {seg.percent}%
              </Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  barContainer: {
    height: 10,
    borderRadius: 6,
    flexDirection: "row",
    overflow: "hidden",
    width: "100%",
  },
  segment: {
    height: "100%",
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendName: {
    fontSize: 12,
    fontWeight: "500",
  },
  legendPercent: {
    fontWeight: "700",
  },
});
