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
              <Ionicons
                color={active ? theme.colors.textOnBrand : theme.colors.textMuted}
                name={iconName}
                size={20}
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
      backgroundColor: theme.colors.background,
      bottom: 0,
      left: 0,
      paddingBottom: Math.max(bottomInset, theme.spacing[2]),
      paddingHorizontal: theme.spacing[2],
      paddingTop: theme.spacing[2],
      position: "absolute",
      right: 0,
    },
    innerShell: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: theme.spacing[1],
      padding: 4,
    },
    item: {
      alignItems: "center",
      backgroundColor: "transparent",
      borderRadius: 4,
      flex: 1,
      gap: 3,
      justifyContent: "center",
      minHeight: 52,
      minWidth: 0,
      opacity: 0.92,
      paddingHorizontal: 2,
      paddingVertical: 6,
    },
    itemActive: {
      backgroundColor: theme.colors.brand,
      opacity: 1,
    },
    label: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.label.fontSize,
      fontWeight: theme.typography.label.fontWeight,
      lineHeight: theme.typography.label.lineHeight,
      textAlign: "center",
    },
    labelActive: {
      color: theme.colors.textOnBrand,
    },
  });
