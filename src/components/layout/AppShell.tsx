import React, { ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AppTheme } from "../../theme";
import { AppTab, Client } from "../../types/wealth";
import { CurrencyCode } from "../../services/currency";
import { DesktopSidebar, SidebarTabItem } from "../DesktopSidebar";
import { BottomTabBar } from "../BottomTabBar";
import { LiveMarketTicker } from "../LiveMarketTicker";
import { GlobalStatusBar } from "../GlobalStatusBar";
import { ScreenTransition } from "../ScreenTransition";

export interface AppShellProps {
  isDesktop: boolean;
  theme: AppTheme;
  darkModeEnabled: boolean;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  visibleTabs: SidebarTabItem[];
  mobileTabs: Array<{ key: AppTab; label: string }>;
  selectedClient: Client | null;
  advisorName: string;
  dueClientsCount: number;
  isPro: boolean;
  syncStatus: string;
  marketStatus: "LIVE" | "SIMULATED";
  dataQualityPct: number;
  dataQualityTier?: "PARTIAL" | "STALE" | "COMPLETE" | "MISSING";
  activeCurrency: CurrencyCode;
  isMarketRefreshing: boolean;
  onRefreshMarket: () => void;
  onCycleCurrency: () => void;
  onLockDesk: () => void;
  onOpenProModal: () => void;
  onQuickAddClient: () => void;
  onQuickBroadcast: () => void;
  onQuickImportStatement: () => void;
  onQuickExportRoster: () => void;
  onClearSelectedClient: () => void;
  onNavigateTab: (tab: string, params?: any) => void;
  insetsBottom?: number;
  contentBottomPadding?: number;
  children?: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  isDesktop,
  theme,
  darkModeEnabled,
  activeTab,
  setActiveTab,
  visibleTabs,
  mobileTabs,
  selectedClient,
  advisorName,
  dueClientsCount,
  isPro,
  syncStatus,
  marketStatus,
  dataQualityPct,
  dataQualityTier,
  activeCurrency,
  isMarketRefreshing,
  onRefreshMarket,
  onCycleCurrency,
  onLockDesk,
  onOpenProModal,
  onQuickAddClient,
  onQuickBroadcast,
  onQuickImportStatement,
  onQuickExportRoster,
  onClearSelectedClient,
  onNavigateTab,
  insetsBottom = 0,
  contentBottomPadding = 80,
  children,
}) => {
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={darkModeEnabled ? "light" : "dark"} />
      <View
        style={{
          flex: 1,
          flexDirection: isDesktop ? "row" : "column",
          width: "100%",
          height: "100%",
        }}
      >
        {isDesktop && (
          <DesktopSidebar
            activeTab={visibleTabs.some((tab) => tab.key === activeTab) ? activeTab : "Dashboard"}
            advisorName={advisorName}
            dueClientsCount={dueClientsCount}
            isPro={isPro}
            onChange={setActiveTab}
            onLockDesk={onLockDesk}
            onOpenProModal={onOpenProModal}
            onQuickAddClient={onQuickAddClient}
            onQuickBroadcast={onQuickBroadcast}
            onQuickImportStatement={onQuickImportStatement}
            onQuickExportRoster={onQuickExportRoster}
            syncStatus={syncStatus}
            tabs={visibleTabs}
            theme={theme}
          />
        )}
        <View style={{ flex: 1, height: "100%", overflow: "hidden" }}>
          <LiveMarketTicker
            theme={theme}
            onRefresh={onRefreshMarket}
            isRefreshing={isMarketRefreshing}
            activeCurrency={activeCurrency}
            onCycleCurrency={onCycleCurrency}
          />
          {(isDesktop || selectedClient) && (
            <GlobalStatusBar
              selectedClient={selectedClient}
              activeTab={activeTab}
              onNavigateTab={onNavigateTab}
              theme={theme}
              marketStatus={marketStatus}
              dataQualityPct={dataQualityPct}
              dataQualityTier={dataQualityTier}
              onClearClient={onClearSelectedClient}
            />
          )}
          <ScreenTransition triggerKey={activeTab} style={{ flex: 1, height: "100%" }}>
            {children}
          </ScreenTransition>
        </View>
      </View>
      {!isDesktop && (
        <BottomTabBar
          tabs={mobileTabs}
          activeTab={mobileTabs.some((tab) => tab.key === activeTab) ? activeTab : "Workspace"}
          onChange={setActiveTab}
          theme={theme}
          bottomInset={insetsBottom || 0}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});
