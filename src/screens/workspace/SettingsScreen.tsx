import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { AnimatedPressable as Pressable } from "../../components/AnimatedPressable";

interface SettingsScreenProps {
  biometricEnabled: boolean;
  broadcastSummary: string;
  broadcastState: string;
  darkModeEnabled: boolean;
  hapticsEnabled: boolean;
  onBack: () => void;
  onConfigureSync: () => void;
  onOpenBroadcast: () => void;
  onPushBackup: () => void;
  onResetLock: () => void;
  onRestoreBackup: () => void;
  onToggleBiometric: (value: boolean) => void;
  onToggleDarkMode: (value: boolean) => void;
  onToggleHaptics: (value: boolean) => void;
  styles: ReturnType<typeof StyleSheet.create>;
  syncState: string;
}

export function SettingsScreen({
  biometricEnabled,
  broadcastSummary,
  broadcastState,
  darkModeEnabled,
  hapticsEnabled,
  onBack,
  onConfigureSync,
  onOpenBroadcast,
  onPushBackup,
  onResetLock,
  onRestoreBackup,
  onToggleBiometric,
  onToggleDarkMode,
  onToggleHaptics,
  styles,
  syncState,
}: SettingsScreenProps) {
  return (
    <View style={styles.panel}>
      <View style={styles.sectionHeader}>
        <Text style={styles.panelTitle}>Security and sync</Text>
        <Pressable onPress={onBack} style={styles.linkButton}>
          <Text style={styles.linkButtonText}>Back</Text>
        </Pressable>
      </View>
      <Text style={styles.panelSubtitle}>
        Core lock, backup, and campaign controls for the advisor workspace.
      </Text>
      <View style={styles.toggleRow}>
        <View style={styles.toggleCopy}>
          <Text style={styles.toggleTitle}>Biometric unlock</Text>
          <Text style={styles.toggleText}>
            Use fingerprint or face authentication after PIN unlock.
          </Text>
        </View>
        <Switch value={biometricEnabled} onValueChange={onToggleBiometric} />
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleCopy}>
          <Text style={styles.toggleTitle}>Dark mode</Text>
          <Text style={styles.toggleText}>Enable the darker workspace shell.</Text>
        </View>
        <Switch value={darkModeEnabled} onValueChange={onToggleDarkMode} />
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleCopy}>
          <Text style={styles.toggleTitle}>Haptics</Text>
          <Text style={styles.toggleText}>
            Turn tactile feedback on or off for tabs, saves, campaigns, and alerts.
          </Text>
        </View>
        <Switch value={hapticsEnabled} onValueChange={onToggleHaptics} />
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleCopy}>
          <Text style={styles.toggleTitle}>Encrypted cloud backup</Text>
          <Text style={styles.toggleText}>
            Backend stores ciphertext only. Sync state: {syncState}
          </Text>
        </View>
        <Pressable style={styles.secondaryButton} onPress={onConfigureSync}>
          <Text style={styles.secondaryButtonText}>Configure</Text>
        </Pressable>
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleCopy}>
          <Text style={styles.toggleTitle}>Bulk notification campaigns</Text>
          <Text style={styles.toggleText}>
            Run one campaign for selected clients. {broadcastSummary}. Status: {broadcastState}
          </Text>
        </View>
        <Pressable style={styles.secondaryButton} onPress={onOpenBroadcast}>
          <Text style={styles.secondaryButtonText}>Open</Text>
        </Pressable>
      </View>

      <View style={styles.optionRow}>
        <Pressable style={styles.darkChip} onPress={onPushBackup}>
          <Text style={styles.darkChipText}>Push Backup</Text>
        </Pressable>
        <Pressable style={styles.darkChip} onPress={onRestoreBackup}>
          <Text style={styles.darkChipText}>Restore Backup</Text>
        </Pressable>
        <Pressable style={styles.lightChip} onPress={onResetLock}>
          <Text style={styles.lightChipText}>Reset App Lock</Text>
        </Pressable>
      </View>
    </View>
  );
}
