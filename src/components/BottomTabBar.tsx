import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressable as Pressable } from "./AnimatedPressable";
import { triggerSelectionHaptic } from "../services/haptics";
import { AppTheme } from "../theme";

type BottomTabBarProps<T extends string> = {
  activeTab: T;
  bottomInset: number;
  onChange: (tab: T) => void;
  tabs: Array<{ key: T; label: string }>;
  theme: AppTheme;
};

function getTabLabel(label: string) {
  switch (label) {
    case "Dashboard":
      return "Home";
    case "Clients":
      return "Clients";
    case "Portfolios":
      return "Portfolio";
    case "AI Research":
      return "Research";
    case "Workspace":
      return "More";
    case "Tools":
      return "Tools";
    case "Settings":
      return "Settings";
    default:
      return label;
  }
}

function getTabIcon(label: string) {
  switch (label) {
    case "Dashboard":
      return "grid";
    case "Clients":
      return "people";
    case "Portfolios":
      return "pie-chart";
    case "AI Research":
      return "search";
    case "Workspace":
      return "ellipsis-horizontal";
    case "Tools":
      return "calculator";
    case "Settings":
      return "settings";
    default:
      return "ellipse";
  }
}

export function BottomTabBar<T extends string>({
  activeTab,
  bottomInset,
  onChange,
  tabs,
  theme,
}: BottomTabBarProps<T>) {
  const styles = createStyles(theme, bottomInset);

  return (
    <View style={styles.wrapper}>
      <View style={styles.innerShell}>
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          const visibleLabel = getTabLabel(tab.label);
          const iconName = getTabIcon(tab.label);

          return (
            <Pressable
              key={tab.key}
              onPress={() => {
                if (!active) {
                  void triggerSelectionHaptic();
                }
                onChange(tab.key);
              }}
              style={[styles.item, active ? styles.itemActive : null]}
            >
              {active && <View style={styles.activeIndicator} />}
              <Ionicons
                color={active ? theme.colors.brand : theme.colors.textMuted}
                name={iconName}
                size={19}
              />
              <Text
                numberOfLines={1}
                style={[styles.label, active ? styles.labelActive : null]}
              >
                {visibleLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme, bottomInset: number) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: "rgba(3, 7, 18, 0.96)",
      borderTopColor: "rgba(255, 255, 255, 0.08)",
      borderTopWidth: 1,
      bottom: 0,
      left: 0,
      paddingBottom: Math.max(bottomInset, 6),
      paddingHorizontal: 8,
      paddingTop: 4,
      position: "absolute",
      right: 0,
      zIndex: 40,
    },
    innerShell: {
      backgroundColor: "transparent",
      flexDirection: "row",
      gap: 4,
      paddingVertical: 2,
    },
    item: {
      alignItems: "center",
      backgroundColor: "transparent",
      borderRadius: 8,
      flex: 1,
      gap: 2,
      justifyContent: "center",
      minHeight: 46,
      minWidth: 0,
      opacity: 0.88,
      paddingHorizontal: 2,
      paddingVertical: 4,
      position: "relative",
    },
    itemActive: {
      backgroundColor: "rgba(224, 168, 76, 0.12)",
      opacity: 1,
    },
    activeIndicator: {
      backgroundColor: theme.colors.brand,
      borderRadius: 2,
      height: 2,
      position: "absolute",
      top: 2,
      width: 16,
    },
    label: {
      color: theme.colors.textMuted,
      fontSize: 10,
      fontWeight: "500",
      lineHeight: 12,
      textAlign: "center",
    },
    labelActive: {
      color: theme.colors.brand,
      fontWeight: "700",
    },
  });
