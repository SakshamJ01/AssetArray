import React from "react";
import { Alert, Pressable, Switch, Text, View } from "react-native";
import { AppTheme } from "../theme";

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
  return (
    <>
      <View style={[styles.panel, styles.settingsOverviewPanel]}>
        <Text style={styles.panelTitle}>Settings</Text>
        <Text style={styles.panelSubtitle}>
          Manage security, sync, campaign controls, and app preferences from one place.
        </Text>
        <View style={styles.settingsStatusGrid}>
          <View style={styles.settingsStatusItem}>
            <Text style={styles.settingsStatusLabel}>Backend</Text>
            <Text style={styles.settingsStatusValue}>{authState}</Text>
          </View>
          <View style={styles.settingsStatusItem}>
            <Text style={styles.settingsStatusLabel}>Cloud sync</Text>
            <Text style={styles.settingsStatusValue}>{syncState}</Text>
          </View>
          <View style={styles.settingsStatusItem}>
            <Text style={styles.settingsStatusLabel}>Plan</Text>
            <Text
              style={[
                styles.settingsStatusValue,
                { color: isPro ? theme.colors.brand : theme.colors.textSecondary },
              ]}
            >
              {isPro ? "Pro ⭐" : "Free"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.settingsSectionTitle}>Subscription (RevenueCat)</Text>
        <View style={styles.settingsRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>Current Plan</Text>
            <Text style={styles.toggleText}>
              {isPro
                ? "Pro Advisor (Active with AI & Unlimited Reports)"
                : "Free Plan (Gated AI & Reports)"}
            </Text>
          </View>
          <Pressable
            style={styles.darkChip}
            onPress={() => setIsPaywallVisible(true)}
          >
            <Text style={styles.darkChipText}>View Paywall</Text>
          </Pressable>
        </View>
        <Pressable
          style={styles.settingsActionRow}
          onPress={async () => {
            if (isPro) {
              await resetDemoProStatus();
              setIsPro(false);
              Alert.alert(
                "Subscription Reset",
                "Switched back to Free Plan! You can now test the paywall triggers again."
              );
            } else {
              setIsPro(true);
              Alert.alert("Pro Activated", "Pro Advisor plan activated!");
            }
          }}
        >
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>
              {isPro ? "Reset to Free Plan" : "Quick Activate Pro"}
            </Text>
            <Text style={styles.toggleText}>
              {isPro
                ? "Switch back to Free tier to test the paywall trigger again."
                : "Instantly activate Pro tier for testing."}
            </Text>
          </View>
          <Text
            style={[
              styles.settingsActionText,
              { color: isPro ? theme.colors.danger : theme.colors.brand },
            ]}
          >
            {isPro ? "Reset" : "Activate"}
          </Text>
        </Pressable>
        <Pressable
          style={styles.settingsActionRow}
          onPress={() => void seedDemoClients()}
        >
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>⚡ Load Demo Roster (Judge Mode)</Text>
            <Text style={styles.toggleText}>
              Populate 3 institutional client portfolios with holdings for judging evaluation.
            </Text>
          </View>
          <Text style={[styles.settingsActionText, { color: theme.colors.brand }]}>
            Load
          </Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.settingsSectionTitle}>Security</Text>
        <View style={styles.settingsRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>Biometric unlock</Text>
            <Text style={styles.toggleText}>
              Use fingerprint or face authentication after PIN unlock.
            </Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={(value) => void toggleBiometric(value)}
          />
        </View>
        <View style={styles.settingsRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>Vibration feedback</Text>
            <Text style={styles.toggleText}>
              Turn tap vibration on or off for tabs and app actions.
            </Text>
          </View>
          <Switch
            value={hapticsEnabled}
            onValueChange={(value) => void toggleHaptics(value)}
          />
        </View>
        <Pressable style={styles.settingsActionRow} onPress={() => void resetLock()}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>Reset app lock</Text>
            <Text style={styles.toggleText}>Remove the saved PIN and lock the workspace.</Text>
          </View>
          <Text style={styles.settingsActionText}>Reset</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.settingsSectionTitle}>Appearance</Text>
        <View style={styles.settingsRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>Dark mode</Text>
            <Text style={styles.toggleText}>Enable the darker workspace shell.</Text>
          </View>
          <Switch
            value={darkModeEnabled}
            onValueChange={(value) => void toggleDarkMode(value)}
          />
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.settingsSectionTitle}>Cloud sync</Text>
        <Text style={styles.panelSubtitle}>
          Backend stores ciphertext only. Current status: {syncState}
        </Text>
        <View style={styles.settingsButtonRow}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => setIsSyncModalOpen(true)}
          >
            <Text style={styles.secondaryButtonText}>Configure</Text>
          </Pressable>
          <Pressable style={styles.darkChip} onPress={() => void syncToCloud()}>
            <Text style={styles.darkChipText}>Push Backup</Text>
          </Pressable>
          <Pressable style={styles.darkChip} onPress={() => void restoreFromCloud()}>
            <Text style={styles.darkChipText}>Restore Backup</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.settingsSectionTitle}>Campaigns</Text>
        <Pressable
          style={styles.settingsActionRow}
          onPress={() => setIsBroadcastModalOpen(true)}
        >
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>Bulk notification campaigns</Text>
            <Text style={styles.toggleText}>
              Run one campaign for selected clients. Status: {broadcastState}
            </Text>
          </View>
          <Text style={styles.settingsActionText}>Open</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.settingsSectionTitle}>About and support</Text>
        <Text style={styles.panelSubtitle}>Asset Array version {appVersion}</Text>
        <View style={styles.settingsButtonRow}>
          <Pressable style={styles.secondaryButton} onPress={openPrivacyPolicy}>
            <Text style={styles.secondaryButtonText}>Privacy Policy</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={openTermsAndConditions}>
            <Text style={styles.secondaryButtonText}>Terms & Conditions</Text>
          </Pressable>
          <Pressable style={styles.darkChip} onPress={() => void contactSupport()}>
            <Text style={styles.darkChipText}>Contact Support</Text>
          </Pressable>
          <Pressable style={styles.darkChip} onPress={() => void reportBug()}>
            <Text style={styles.darkChipText}>Report Bug</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
};
