import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { AppTheme } from "../theme";
import { Client } from "../types/wealth";
import { marketHealthMonitor } from "../services/market";

export interface GlobalStatusBarProps {
  selectedClient: Client | null;
  activeTab: string;
  onNavigateTab: (tab: string, params?: any) => void;
  theme: AppTheme;
  marketStatus?: "LIVE" | "SIMULATED" | "OFFLINE";
  dataQualityPct?: number;
  onClearClient?: () => void;
}

export const GlobalStatusBar: React.FC<GlobalStatusBarProps> = ({
  selectedClient,
  activeTab,
  onNavigateTab,
  theme,
  marketStatus = "LIVE",
  dataQualityPct = 98,
  onClearClient,
}) => {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const timePart = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      setCurrentTime(`${datePart} · ${timePart} IST`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const clientName = selectedClient ? selectedClient.name : "All Clients (Consolidated)";
  const portfolioName = selectedClient ? `${selectedClient.name} Growth Portfolio` : "Firm-wide Assets";

  return (
    <View style={barStyles.container}>
      {/* Left side: Context details */}
      <View style={barStyles.leftSide}>
        <View style={barStyles.contextItem}>
          <Text style={barStyles.label}>CLIENT:</Text>
          <Text style={barStyles.valuePrimary} numberOfLines={1}>
            {clientName}
          </Text>
          {selectedClient && onClearClient && (
            <Pressable onPress={onClearClient} style={barStyles.clearBtn}>
              <Text style={barStyles.clearBtnText}>✕</Text>
            </Pressable>
          )}
        </View>

        <View style={barStyles.divider} />

        <View style={barStyles.contextItem}>
          <Text style={barStyles.label}>PORTFOLIO:</Text>
          <Text style={barStyles.value} numberOfLines={1}>
            {portfolioName}
          </Text>
        </View>

        <View style={barStyles.divider} />

        <View style={barStyles.contextItem}>
          <Text style={barStyles.label}>AS OF:</Text>
          <Text style={barStyles.value}>{currentTime}</Text>
        </View>
      </View>

      {/* Right side: Market status, data quality, contextual shortcuts */}
      <View style={barStyles.rightSide}>
        {/* Contextual Navigation (Item 34) */}
        {selectedClient && (
          <View style={barStyles.shortcutGroup}>
            <Pressable
              style={[
                barStyles.shortcutBtn,
                activeTab === "Clients" && barStyles.shortcutBtnActive,
              ]}
              onPress={() => onNavigateTab("Clients")}
            >
              <Text
                style={[
                  barStyles.shortcutText,
                  activeTab === "Clients" && barStyles.shortcutTextActive,
                ]}
              >
                Client 360
              </Text>
            </Pressable>
            <Pressable
              style={[
                barStyles.shortcutBtn,
                activeTab === "Portfolios" && barStyles.shortcutBtnActive,
              ]}
              onPress={() => onNavigateTab("Portfolios")}
            >
              <Text
                style={[
                  barStyles.shortcutText,
                  activeTab === "Portfolios" && barStyles.shortcutTextActive,
                ]}
              >
                Portfolio
              </Text>
            </Pressable>
            <Pressable
              style={barStyles.shortcutBtn}
              onPress={() => onNavigateTab("Portfolios", { view: "tax-harvest" })}
            >
              <Text style={barStyles.shortcutText}>Tax</Text>
            </Pressable>
            <Pressable
              style={barStyles.shortcutBtn}
              onPress={() => onNavigateTab("Portfolios", { view: "stress" })}
            >
              <Text style={barStyles.shortcutText}>Scenario</Text>
            </Pressable>
          </View>
        )}

        <View style={barStyles.statusPill}>
          <View
            style={[
              barStyles.statusDot,
              {
                backgroundColor:
                  marketStatus === "LIVE"
                    ? "#10B981"
                    : marketStatus === "SIMULATED"
                    ? "#F59E0B"
                    : "#64748B",
              },
            ]}
          />
          <Text style={barStyles.statusText}>
            Market: <Text style={{ fontWeight: "700" }}>{marketStatus}</Text>
          </Text>
        </View>

        <View style={barStyles.dataQualityPill}>
          <Text style={barStyles.dataQualityText}>
            Data: <Text style={{ color: "#38BDF8", fontWeight: "700" }}>{dataQualityPct}% complete</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const barStyles = StyleSheet.create({
  container: {
    height: 34,
    backgroundColor: "#080D18",
    borderBottomWidth: 1,
    borderBottomColor: "#172234",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    zIndex: 10,
  },
  leftSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    overflow: "hidden",
  },
  rightSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contextItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  valuePrimary: {
    fontSize: 11,
    color: "#F8FAFC",
    fontWeight: "700",
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: "#1E293B",
  },
  clearBtn: {
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: "#1E293B",
    marginLeft: 2,
  },
  clearBtnText: {
    fontSize: 9,
    color: "#94A3B8",
    fontWeight: "700",
  },
  shortcutGroup: {
    flexDirection: "row",
    gap: 4,
    marginRight: 6,
  },
  shortcutBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  shortcutBtnActive: {
    backgroundColor: "rgba(224, 168, 76, 0.2)",
    borderColor: "#E0A84C",
  },
  shortcutText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94A3B8",
  },
  shortcutTextActive: {
    color: "#E0A84C",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    color: "#CBD5E1",
  },
  dataQualityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  dataQualityText: {
    fontSize: 10,
    color: "#94A3B8",
  },
});
