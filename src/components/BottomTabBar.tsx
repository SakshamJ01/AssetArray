import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
    case "Portfolios":
      return "Portfolio";
    case "Workspace":
      return "More";
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
    case "Tools":
      return "calculator";
    case "Workspace":
      return "ellipsis-horizontal-circle";
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
              onPress={() => onChange(tab.key)}
              style={[styles.item, active ? styles.itemActive : null]}
            >
              <Ionicons
                color={active ? theme.colors.textOnBrand : theme.colors.textMuted}
                name={iconName}
                size={22}
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
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: theme.spacing[1],
      padding: theme.spacing[1],
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 14,
      elevation: 8,
    },
    item: {
      alignItems: "center",
      backgroundColor: "transparent",
      borderRadius: theme.radius.md,
      flex: 1,
      gap: 4,
      justifyContent: "center",
      minHeight: 56,
      minWidth: 0,
      opacity: 0.92,
      paddingHorizontal: theme.spacing[1],
      paddingVertical: theme.spacing[2],
    },
    itemActive: {
      backgroundColor: theme.colors.brand,
      shadowColor: theme.colors.brand,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 10,
      elevation: 5,
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
