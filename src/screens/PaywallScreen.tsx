import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { AppTheme } from "../theme";
import { PurchasesPackage } from "react-native-purchases";

interface PaywallScreenProps {
  theme: AppTheme;
  packages: PurchasesPackage[];
  isLoading: boolean;
  onPurchase: (pkg: PurchasesPackage) => void;
  onRestore: () => void;
  onClose: () => void;
}

export const PaywallScreen: React.FC<PaywallScreenProps> = ({
  theme,
  packages,
  isLoading,
  onPurchase,
  onRestore,
  onClose,
}) => {
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>Close</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Upgrade to Pro Advisor</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Unlock the full power of Asset Array to scale your wealth management practice.
        </Text>

        <View style={[styles.featureCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.featureTitle, { color: theme.colors.brand }]}>🤖 AI Portfolio Analysis</Text>
          <Text style={[styles.featureDesc, { color: theme.colors.textSecondary }]}>
            Instantly generate actionable portfolio rebalancing advice and client messaging drafts powered by Gemini AI.
          </Text>
        </View>

        <View style={[styles.featureCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.featureTitle, { color: theme.colors.brand }]}>📄 Unlimited PDF Exports</Text>
          <Text style={[styles.featureDesc, { color: theme.colors.textSecondary }]}>
            Export unlimited, beautifully formatted PDF portfolio reports to share with your clients.
          </Text>
        </View>

        <View style={[styles.featureCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.featureTitle, { color: theme.colors.brand }]}>☁️ Cloud Sync & Backup</Text>
          <Text style={[styles.featureDesc, { color: theme.colors.textSecondary }]}>
            Securely back up your entire client roster and CRM data to the cloud.
          </Text>
        </View>

        <View style={styles.packagesContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.brand} />
          ) : packages.length === 0 ? (
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>
              No subscription packages available. Please check your connection.
            </Text>
          ) : (
            packages.map((pkg) => (
              <Pressable
                key={pkg.identifier}
                style={[styles.purchaseButton, { backgroundColor: theme.colors.brand }]}
                onPress={() => onPurchase(pkg)}
              >
                <Text style={styles.purchaseButtonText}>
                  Subscribe for {pkg.product.priceString}
                </Text>
              </Pressable>
            ))
          )}
        </View>

        <Pressable onPress={onRestore} style={styles.restoreButton}>
          <Text style={[styles.restoreText, { color: theme.colors.textSecondary }]}>Restore Purchases</Text>
        </Pressable>
        
        <View style={styles.legalFooter}>
          <Text style={[styles.legalText, { color: theme.colors.textMuted }]}>
            Payment will be charged to your account at confirmation of purchase. Subscription automatically renews unless auto-renew is turned off at least 24-hours before the end of the current period.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    paddingTop: 48,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  featureCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  packagesContainer: {
    marginTop: 24,
    marginBottom: 24,
    alignItems: "center",
  },
  purchaseButton: {
    width: "100%",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 8,
  },
  purchaseButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  restoreButton: {
    alignItems: "center",
    padding: 12,
  },
  restoreText: {
    fontSize: 14,
    textDecorationLine: "underline",
  },
  legalFooter: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  legalText: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});
