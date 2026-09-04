import React from "react";
import { Platform, StyleSheet, View } from "react-native";

export interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color,
  width = 64,
  height = 24,
}) => {
  if (!data || data.length < 2) {
    return <View style={{ width, height }} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const usableHeight = height - padding * 2;
  const stepX = (width - padding * 2) / (data.length - 1);

  // Auto-color: green if ending higher than start, else red
  const strokeColor =
    color || (data[data.length - 1] >= data[0] ? "#10B981" : "#EF4444");

  const points = data.map((val, idx) => {
    const x = padding + idx * stepX;
    const y = padding + usableHeight - ((val - min) / range) * usableHeight;
    return { x, y };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, "");

  const fillD = `${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

  if (Platform.OS === "web") {
    return (
      <View style={{ width, height, overflow: "hidden" }}>
        {/* @ts-ignore Web SVG support */}
        <svg width={width} height={height} style={{ display: "block" }}>
          <defs>
            {/* @ts-ignore */}
            <linearGradient id={`spark-${strokeColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              {/* @ts-ignore */}
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
              {/* @ts-ignore */}
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {/* @ts-ignore */}
          <path d={fillD} fill={`url(#spark-${strokeColor.replace('#', '')})`} />
          {/* @ts-ignore */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </View>
    );
  }

  // Cross-platform mobile fallback bar visualization
  return (
    <View style={[styles.fallbackContainer, { width, height }]}>
      {data.map((val, idx) => {
        const barHeight = Math.max(3, ((val - min) / range) * height);
        return (
          <View
            key={idx}
            style={[
              styles.fallbackBar,
              {
                height: barHeight,
                backgroundColor: strokeColor,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  fallbackBar: {
    width: 2,
    borderRadius: 1,
    opacity: 0.85,
  },
});
