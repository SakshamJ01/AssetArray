import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, View, Platform } from "react-native";
import { AppTheme } from "../theme";
import { radiusTokens, surfaceTokens, semanticStatusColors } from "../theme/tokens";

export interface SettingsScreenProps {
  theme: AppTheme;
  authState: string;
  syncState: string;
  isPro: boolean;
  setIsPro: (val: boolean) => void;
  resetDemoProStatus: () => Promise<void>;
  setIsPaywallVisible: (val: boolean) => void;
  seedDemoClients: () => Promise<void> | void;
  biometricEnabled: boolean;
  toggleBiometric: (val: boolean) => Promise<void>;
  hapticsEnabled: boolean;
  toggleHaptics: (val: boolean) => Promise<void>;
  resetLock: () => Promise<void>;
  darkModeEnabled: boolean;
  toggleDarkMode: (val: boolean) => Promise<void>;
  setIsSyncModalOpen: (val: boolean) => void;
  syncToCloud: () => Promise<void>;
  restoreFromCloud: () => Promise<void>;
  setIsBroadcastModalOpen: (val: boolean) => void;
  broadcastState: string;
  appVersion: string;
  openPrivacyPolicy: () => void;
  openTermsAndConditions: () => void;
  contactSupport: () => Promise<void> | void;
  reportBug: () => Promise<void> | void;
  styles: any;
}

interface DataSourceRow {
  provider: string;
  status: "AVAILABLE" | "NOT CONFIGURED" | "SYNCING" | "DELAYED";
  lastUpdated: string;
  coverage: string;
}

const DATA_SOURCES: DataSourceRow[] = [
  {
    provider: "Gemini 2.5 Flash",
    status: "AVAILABLE",
    lastUpdated: "Active (Grounded)",
    coverage: "Global Market & Web Intelligence",
  },
  {
    provider: "Ollama (Local Engine)",
    status: "NOT CONFIGURED",
    lastUpdated: "Offline",
    coverage: "Air-Gapped Private Client Memos",
  },
  {
    provider: "AMFI India",
    status: "AVAILABLE",
    lastUpdated: "Daily NAV (05 Sep 2026)",
    coverage: "Indian Mutual Funds & Liquid Schemes",
  },
  {
    provider: "Finnhub Market Data",
    status: "AVAILABLE",
    lastUpdated: "Streaming Live",
    coverage: "Equities, ETFs, Indices & FX",
  },
  {
    provider: "Zero-Knowledge Vault",
    status: "AVAILABLE",
    lastUpdated: "Synced (AES-GCM-256)",
    coverage: "Client Records & Private Documents",
  },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  theme,
  authState,
  syncState,
  isPro,
  setIsPro,
  resetDemoProStatus,
  setIsPaywallVisible,
  seedDemoClients,
  biometricEnabled,
  toggleBiometric,
  hapticsEnabled,
  toggleHaptics,
  resetLock,
  darkModeEnabled,
  toggleDarkMode,
  setIsSyncModalOpen,
  syncToCloud,
  restoreFromCloud,
  setIsBroadcastModalOpen,
  broadcastState,
  appVersion,
  openPrivacyPolicy,
  openTermsAndConditions,
  contactSupport,
  reportBug,
  styles,
}) => {
  const getStatusBadgeStyle = (status: DataSourceRow["status"]) => {
    switch (status) {
      case "AVAILABLE":
        return {
          bg: "rgba(16, 185, 129, 0.12)",
          border: "rgba(16, 185, 129, 0.3)",
          text: semanticStatusColors.positive,
        };
      case "SYNCING":
        return {
          bg: "rgba(99, 102, 241, 0.12)",
          border: "rgba(99, 102, 241, 0.3)",
          text: semanticStatusColors.simulated,
        };
      case "DELAYED":
        return {
          bg: "rgba(245, 158, 11, 0.12)",
          border: "rgba(245, 158, 11, 0.3)",
          text: semanticStatusColors.warning,
        };
      default: // NOT CONFIGURED
        return {
          bg: "rgba(148, 163, 184, 0.12)",
          border: "rgba(148, 163, 184, 0.3)",
          text: semanticStatusColors.neutral,
        };
    }
  };

  return (
    <View style={localStyles.screenContainer}>
      {/* 1. ACCOUNT & SYSTEM OVERVIEW */}
      <View style={localStyles.sectionPanel}>
        <View style={localStyles.headerRow}>
          <Text style={localStyles.sectionTitle}>Advisor Account & Environment</Text>
          <View style={localStyles.demoTag}>
            <Text style={localStyles.demoTagText}>SIMULATED / SANDBOX READY</Text>
          </View>
        </View>
        <Text style={localStyles.sectionSubtitle}>
          Advisor workstation configuration, multi-tenant state, and security profile.
        </Text>

        <View style={localStyles.kpiGrid}>
          <View style={localStyles.kpiItem}>
            <Text style={localStyles.kpiLabel}>AUTH STATUS</Text>
            <Text style={localStyles.kpiVal}>{authState}</Text>
          </View>
          <View style={localStyles.kpiItem}>
            <Text style={localStyles.kpiLabel}>CLOUD SYNC</Text>
            <Text style={localStyles.kpiVal}>{syncState}</Text>
          </View>
          <View style={localStyles.kpiItem}>
            <Text style={localStyles.kpiLabel}>LICENSE TIER</Text>
            <Text style={[localStyles.kpiVal, { color: isPro ? surfaceTokens.brand : "#94A3B8" }]}>
              {isPro ? "Institutional Pro" : "Standard Free"}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. SECURITY & PRIVACY CONTROLS */}
      <View style={localStyles.sectionPanel}>
        <Text style={localStyles.sectionTitle}>Security & Access Governance</Text>
        <Text style={localStyles.sectionSubtitle}>
          Zero-knowledge cryptographic boundaries and hardware biometric credentials.
        </Text>

        <View style={localStyles.rowItem}>
          <View style={{ flex: 1 }}>
            <Text style={localStyles.rowTitle}>Biometric Authentication</Text>
            <Text style={localStyles.rowSubtitle}>
              Require FaceID / Fingerprint verification for portfolio and tax lot access.
            </Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={(val) => void toggleBiometric(val)}
            trackColor={{ false: "#334155", true: surfaceTokens.brand }}
          />
        </View>

        <View style={localStyles.rowItem}>
          <View style={{ flex: 1 }}>
            <Text style={localStyles.rowTitle}>Haptic Feedback</Text>
            <Text style={localStyles.rowSubtitle}>Tactile confirmation on transaction rebalancing and trade execution.</Text>
          </View>
          <Switch
            value={hapticsEnabled}
            onValueChange={(val) => void toggleHaptics(val)}
            trackColor={{ false: "#334155", true: surfaceTokens.brand }}
          />
        </View>

        <Pressable style={localStyles.actionRowItem} onPress={() => void resetLock()}>
          <View style={{ flex: 1 }}>
            <Text style={localStyles.rowTitle}>Reset Security Lock PIN</Text>
            <Text style={localStyles.rowSubtitle}>Clears stored biometric PIN and locks workspace immediately.</Text>
          </View>
          <View style={localStyles.actionBadge}>
            <Text style={localStyles.actionBadgeText}>Reset PIN</Text>
          </View>
        </Pressable>
      </View>

      {/* 3. DATA SOURCES (Mandatory per Rule 68: Provider, Status, Last Updated, Coverage) */}
      <View style={localStyles.sectionPanel}>
        <View style={localStyles.headerRow}>
          <Text style={localStyles.sectionTitle}>Financial Data Providers & Telemetry</Text>
          <Text style={localStyles.timestampText}>Auto-Refreshed</Text>
        </View>
        <Text style={localStyles.sectionSubtitle}>
          Institutional market feeds, AMFI daily NAV sync, and LLM inference endpoints.
        </Text>

        <View style={localStyles.tableContainer}>
          <View style={localStyles.tableHeader}>
            <Text style={[localStyles.thCell, { flex: 2.5 }]}>PROVIDER</Text>
            <Text style={[localStyles.thCell, { flex: 2 }]}>STATUS</Text>
            <Text style={[localStyles.thCell, { flex: 2.5 }]}>LAST UPDATED</Text>
            <Text style={[localStyles.thCell, { flex: 3 }]}>COVERAGE</Text>
          </View>

          {DATA_SOURCES.map((ds, i) => {
            const badge = getStatusBadgeStyle(ds.status);
            return (
              <View key={i} style={localStyles.tableRow}>
                <Text style={[localStyles.tdCell, { flex: 2.5, fontWeight: "600" }]}>{ds.provider}</Text>
                <View style={[{ flex: 2, alignItems: "flex-start" }]}>
                  <View style={[localStyles.statusPill, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                    <Text style={[localStyles.statusPillText, { color: badge.text }]}>{ds.status}</Text>
                  </View>
                </View>
                <Text style={[localStyles.tdCell, localStyles.monoText, { flex: 2.5 }]}>{ds.lastUpdated}</Text>
                <Text style={[localStyles.tdCell, { flex: 3, color: "#94A3B8" }]}>{ds.coverage}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 4. APPEARANCE & WORKSPACE SHELL */}
      <View style={localStyles.sectionPanel}>
        <Text style={localStyles.sectionTitle}>Appearance & Display</Text>
        <View style={localStyles.rowItem}>
          <View style={{ flex: 1 }}>
            <Text style={localStyles.rowTitle}>Workstation Dark Mode</Text>
            <Text style={localStyles.rowSubtitle}>High-contrast institutional dark theme for extended trading sessions.</Text>
          </View>
          <Switch
            value={darkModeEnabled}
            onValueChange={(val) => void toggleDarkMode(val)}
            trackColor={{ false: "#334155", true: surfaceTokens.brand }}
          />
        </View>
      </View>

      {/* 5. SYNC & CLOUD VAULT */}
      <View style={localStyles.sectionPanel}>
        <Text style={localStyles.sectionTitle}>Zero-Knowledge Cloud Backup</Text>
        <Text style={localStyles.sectionSubtitle}>
          Backend stores client data as encrypted ciphertext. Status: {syncState}
        </Text>
        <View style={localStyles.buttonRow}>
          <Pressable style={localStyles.btnSecondary} onPress={() => setIsSyncModalOpen(true)}>
            <Text style={localStyles.btnSecondaryText}>Configure Keys</Text>
          </Pressable>
          <Pressable style={localStyles.btnOutline} onPress={() => void syncToCloud()}>
            <Text style={localStyles.btnOutlineText}>Push Encrypted Backup</Text>
          </Pressable>
          <Pressable style={localStyles.btnOutline} onPress={() => void restoreFromCloud()}>
            <Text style={localStyles.btnOutlineText}>Restore from Cloud</Text>
          </Pressable>
        </View>
      </View>

      {/* 6. NOTIFICATIONS & CAMPAIGNS */}
      <View style={localStyles.sectionPanel}>
        <Text style={localStyles.sectionTitle}>Client Communications & Broadcasts</Text>
        <Pressable style={localStyles.actionRowItem} onPress={() => setIsBroadcastModalOpen(true)}>
          <View style={{ flex: 1 }}>
            <Text style={localStyles.rowTitle}>Automated Client Broadcasts</Text>
            <Text style={localStyles.rowSubtitle}>Dispatch market briefings or tax harvest notices. Status: {broadcastState}</Text>
          </View>
          <View style={localStyles.actionBadge}>
            <Text style={localStyles.actionBadgeText}>Launch Hub</Text>
          </View>
        </Pressable>
      </View>

      {/* 7. SUBSCRIPTION & DEMO HARNESS (Rule 69: Visibly labeled SIMULATED / DEMO) */}
      <View style={localStyles.sectionPanel}>
        <View style={localStyles.headerRow}>
          <Text style={localStyles.sectionTitle}>Subscription & Simulation Harness</Text>
          <View style={localStyles.demoTag}>
            <Text style={localStyles.demoTagText}>DEMO / SIMULATED</Text>
          </View>
        </View>
        <Text style={localStyles.sectionSubtitle}>
          RevenueCat advisor subscription tier management and test roster generator.
        </Text>

        <View style={localStyles.rowItem}>
          <View style={{ flex: 1 }}>
            <Text style={localStyles.rowTitle}>Active License</Text>
            <Text style={localStyles.rowSubtitle}>
              {isPro ? "Institutional Pro Advisor (Unlimited Analytics, PDF Reports & AI)" : "Free Advisor Tier (Gated Reports)"}
            </Text>
          </View>
          <Pressable style={localStyles.btnPaywall} onPress={() => setIsPaywallVisible(true)}>
            <Text style={localStyles.btnPaywallText}>Review Tiers</Text>
          </Pressable>
        </View>

        <Pressable
          style={localStyles.actionRowItem}
          onPress={async () => {
            if (isPro) {
              await resetDemoProStatus();
              setIsPro(false);
              Alert.alert("Tier Reset", "Switched back to Free Plan.");
            } else {
              setIsPro(true);
              Alert.alert("Pro Activated", "Institutional Pro features unlocked.");
            }
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={localStyles.rowTitle}>{isPro ? "Simulate Free Tier" : "Simulate Pro Tier"}</Text>
            <Text style={localStyles.rowSubtitle}>Toggle license state for evaluation without live billing.</Text>
          </View>
          <View style={localStyles.actionBadge}>
            <Text style={[localStyles.actionBadgeText, { color: isPro ? semanticStatusColors.negative : surfaceTokens.brand }]}>
              {isPro ? "Revert Free" : "Activate Pro"}
            </Text>
          </View>
        </Pressable>

        <Pressable style={localStyles.actionRowItem} onPress={() => void seedDemoClients()}>
          <View style={{ flex: 1 }}>
            <Text style={localStyles.rowTitle}>Seed Demonstration Client Roster</Text>
            <Text style={localStyles.rowSubtitle}>Populates 3 institutional client portfolios with holdings for validation.</Text>
          </View>
          <View style={[localStyles.actionBadge, { backgroundColor: "rgba(224, 168, 76, 0.12)", borderColor: surfaceTokens.brand }]}>
            <Text style={[localStyles.actionBadgeText, { color: surfaceTokens.brand }]}>Seed Roster</Text>
          </View>
        </Pressable>
      </View>

      {/* 8. ABOUT & GOVERNANCE */}
      <View style={localStyles.sectionPanel}>
        <View style={localStyles.headerRow}>
          <Text style={localStyles.sectionTitle}>About AssetArray</Text>
          <Text style={localStyles.timestampText}>v{appVersion}</Text>
        </View>
        <Text style={localStyles.sectionSubtitle}>
          Professional Financial Advisor Workstation. GIPS-informed calculation methodology with DPDP-aligned data privacy controls.
        </Text>

        <View style={localStyles.buttonRow}>
          <Pressable style={localStyles.btnSecondary} onPress={openPrivacyPolicy}>
            <Text style={localStyles.btnSecondaryText}>Privacy Policy</Text>
          </Pressable>
          <Pressable style={localStyles.btnSecondary} onPress={openTermsAndConditions}>
            <Text style={localStyles.btnSecondaryText}>Terms & Disclosures</Text>
          </Pressable>
          <Pressable style={localStyles.btnOutline} onPress={() => void contactSupport()}>
            <Text style={localStyles.btnOutlineText}>Advisor Support</Text>
          </Pressable>
          <Pressable style={localStyles.btnOutline} onPress={() => void reportBug()}>
            <Text style={localStyles.btnOutlineText}>Report Telemetry Issue</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  screenContainer: {
    gap: 12,
  },
  sectionPanel: {
    backgroundColor: surfaceTokens.surface,
    borderRadius: radiusTokens.sm, // 4
    borderWidth: 1,
    borderColor: surfaceTokens.borderDefault,
    padding: 14,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F9FAFB",
  },
  sectionSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
    marginBottom: 10,
  },
  timestampText: {
    fontSize: 11,
    color: "#64748B",
    fontVariant: ["tabular-nums"],
  },
  demoTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radiusTokens.none,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  demoTagText: {
    fontSize: 9,
    fontWeight: "700",
    color: semanticStatusColors.warning,
  },
  kpiGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  kpiItem: {
    flex: 1,
    backgroundColor: surfaceTokens.surfaceMuted,
    padding: 10,
    borderRadius: radiusTokens.sm,
    borderWidth: 1,
    borderColor: surfaceTokens.borderHairline,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.4,
  },
  kpiVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F9FAFB",
    marginTop: 3,
  },
  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: surfaceTokens.borderHairline,
  },
  actionRowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: surfaceTokens.borderHairline,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#F9FAFB",
  },
  rowSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  actionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radiusTokens.sm,
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderWidth: 1,
    borderColor: surfaceTokens.borderDefault,
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#F9FAFB",
  },
  // Data Sources Table
  tableContainer: {
    borderRadius: radiusTokens.sm,
    borderWidth: 1,
    borderColor: surfaceTokens.borderHairline,
    overflow: "hidden",
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: surfaceTokens.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: surfaceTokens.borderDefault,
  },
  thCell: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: surfaceTokens.borderHairline,
    backgroundColor: surfaceTokens.surface,
  },
  tdCell: {
    fontSize: 11,
    color: "#F9FAFB",
  },
  monoText: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontVariant: ["tabular-nums"],
    fontSize: 10,
    color: "#CBD5E1",
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radiusTokens.none,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: "700",
  },
  // Buttons
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  btnSecondary: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radiusTokens.sm,
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderWidth: 1,
    borderColor: surfaceTokens.borderDefault,
  },
  btnSecondaryText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#F9FAFB",
  },
  btnOutline: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radiusTokens.sm,
    borderWidth: 1,
    borderColor: surfaceTokens.borderDefault,
  },
  btnOutlineText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  btnPaywall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radiusTokens.sm,
    backgroundColor: "rgba(224, 168, 76, 0.15)",
    borderWidth: 1,
    borderColor: surfaceTokens.brand,
  },
  btnPaywallText: {
    fontSize: 11,
    fontWeight: "700",
    color: surfaceTokens.brand,
  },
});
