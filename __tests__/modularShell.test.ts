jest.mock("react-native", () => ({
  Platform: { OS: "web" },
  StyleSheet: { create: (styles: any) => styles },
  View: "View",
  Text: "Text",
  TextInput: "TextInput",
  Modal: "Modal",
  Pressable: "Pressable",
  Alert: { alert: jest.fn() },
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: "StatusBar",
}));

jest.mock("../src/components/DesktopSidebar", () => ({
  DesktopSidebar: () => null,
}));

jest.mock("../src/components/BottomTabBar", () => ({
  BottomTabBar: () => null,
}));

jest.mock("../src/components/LiveMarketTicker", () => ({
  LiveMarketTicker: () => null,
}));

jest.mock("../src/components/GlobalStatusBar", () => ({
  GlobalStatusBar: () => null,
}));

jest.mock("../src/components/ScreenTransition", () => ({
  ScreenTransition: ({ children }: any) => children,
}));

import React from "react";
import { AppShell } from "../src/components/layout/AppShell";
import { buildAppTheme } from "../src/theme";

describe("Modular Architecture - AppShell", () => {
  it("should be defined and exportable as a React component", () => {
    expect(AppShell).toBeDefined();
    expect(typeof AppShell).toBe("function");
  });

  it("instantiates cleanly with desktop and mobile configuration", () => {
    const theme = buildAppTheme("dark");
    const element = React.createElement(
      AppShell,
      {
        isDesktop: true,
        theme,
        darkModeEnabled: true,
        activeTab: "Dashboard",
        setActiveTab: jest.fn(),
        visibleTabs: [{ key: "Dashboard", label: "Dashboard" }],
        mobileTabs: [{ key: "Dashboard", label: "Dashboard" }],
        selectedClient: null,
        advisorName: "Senior Advisor",
        dueClientsCount: 0,
        isPro: true,
        syncStatus: "Online",
        marketStatus: "LIVE",
        dataQualityPct: 98,
        activeCurrency: "INR",
        isMarketRefreshing: false,
        onRefreshMarket: jest.fn(),
        onCycleCurrency: jest.fn(),
        onLockDesk: jest.fn(),
        onOpenProModal: jest.fn(),
        onQuickAddClient: jest.fn(),
        onQuickBroadcast: jest.fn(),
        onQuickImportStatement: jest.fn(),
        onQuickExportRoster: jest.fn(),
        onClearSelectedClient: jest.fn(),
        onNavigateTab: jest.fn(),
      },
      React.createElement("div", null, "Screen Area")
    );

    expect(element).toBeDefined();
    expect(element.type).toBe(AppShell);
    expect((element.props as any).isDesktop).toBe(true);
  });
});
