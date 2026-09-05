import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { AppTheme } from "../theme";
import { BillingPackage } from "../platform/billing";

interface PaywallScreenProps {
  theme: AppTheme;
  packages: BillingPackage[];
  isLoading: boolean;
  onPurchase: (pkg: BillingPackage) => void;
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
  // Default to the annual package or first available
  const [selectedId, setSelectedId] = useState<string>(() => {
    const annual = packages.find(
      (p) =>
        p.packageType === "ANNUAL" ||
        p.identifier.includes("annual") ||
        p.identifier.includes("year")
    );
    return annual ? annual.identifier : packages[0]?.identifier || "pro_annual";
  });

  const selectedPackage =
    packages.find((p) => p.identifier === selectedId) || packages[0];

  const isAnnualSelected =
    selectedPackage?.packageType === "ANNUAL" ||
    selectedPackage?.identifier.includes("annual") ||
    selectedPackage?.identifier.includes("year");

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: "rgba(224, 168, 76, 0.15)", borderColor: theme.colors.brand }]}>
          <Text style={[styles.badgeText, { color: theme.colors.brand }]}>
            👑 PRO ADVISOR TIER
          </Text>
        </View>
        <Pressable onPress={onClose} style={styles.closeButton} hitSlop={12}>
          <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Title */}
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Supercharge Your Advisory Practice
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Automate institutional portfolio analysis, generate executive client reports, and scale your relationship workflow.
        </Text>

        {/* Social Proof Banner */}
        <View style={[styles.socialProofCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.starsRow}>
            <Text style={styles.starText}>★★★★★</Text>
            <Text style={[styles.ratingNumber, { color: theme.colors.textPrimary }]}> 4.9/5</Text>
          </View>
          <Text style={[styles.socialProofText, { color: theme.colors.textSecondary }]}>
            Trusted by 2,400+ Independent Wealth Advisors & Family Offices
          </Text>
        </View>

        {/* Value Proposition Highlights */}
        <View style={styles.featureList}>
          <View style={[styles.featureItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={styles.featureIcon}>🤖</Text>
            <View style={styles.featureTextWrapper}>
              <Text style={[styles.featureTitle, { color: theme.colors.textPrimary }]}>
                Gemini AI Portfolio Co-Pilot
              </Text>
              <Text style={[styles.featureDesc, { color: theme.colors.textSecondary }]}>
                Instant asset rebalancing briefs, risk factor analysis, and 1-tap WhatsApp & Email drafts.
              </Text>
            </View>
          </View>

          <View style={[styles.featureItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={styles.featureIcon}>📄</Text>
            <View style={styles.featureTextWrapper}>
              <Text style={[styles.featureTitle, { color: theme.colors.textPrimary }]}>
                Unlimited Executive PDF Reports
              </Text>
              <Text style={[styles.featureDesc, { color: theme.colors.textSecondary }]}>
                Generate and share print-ready client reports with your custom advisor watermark & branding.
              </Text>
            </View>
          </View>

          <View style={[styles.featureItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={styles.featureIcon}>🔒</Text>
            <View style={styles.featureTextWrapper}>
              <Text style={[styles.featureTitle, { color: theme.colors.textPrimary }]}>
                Encrypted Cloud Sync
              </Text>
              <Text style={[styles.featureDesc, { color: theme.colors.textSecondary }]}>
                Continuous multi-device encrypted sync with automatic cloud backups.
              </Text>
            </View>
          </View>

          <View style={[styles.featureItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={styles.featureIcon}>⚡</Text>
            <View style={styles.featureTextWrapper}>
              <Text style={[styles.featureTitle, { color: theme.colors.textPrimary }]}>
                Real-Time Market Quote Stream
              </Text>
              <Text style={[styles.featureDesc, { color: theme.colors.textSecondary }]}>
                Live tick-level valuations for equities, ETFs, and indices with priority watchlist tracking.
              </Text>
            </View>
          </View>
        </View>

        {/* Subscription Plan Selector */}
        <Text style={[styles.sectionHeading, { color: theme.colors.textPrimary }]}>
          Select Your Membership Plan
        </Text>

        {isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.brand} style={{ marginVertical: 32 }} />
        ) : packages.length === 0 ? (
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>
            Unable to load packages. Please check your connection.
          </Text>
        ) : (
          <View style={styles.planSelectorWrapper}>
            {packages.map((pkg) => {
              const isSelected = (selectedPackage?.identifier === pkg.identifier);
              const isAnnual =
                pkg.packageType === "ANNUAL" ||
                pkg.identifier.includes("annual") ||
                pkg.identifier.includes("year");

              return (
                <Pressable
                  key={pkg.identifier}
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: isSelected
                        ? "rgba(224, 168, 76, 0.08)"
                        : theme.colors.surface,
                      borderColor: isSelected
                        ? theme.colors.brand
                        : theme.colors.border,
                    },
                  ]}
                  onPress={() => setSelectedId(pkg.identifier)}
                >
                  {isAnnual ? (
                    <View style={[styles.bestValueBadge, { backgroundColor: theme.colors.brand }]}>
                      <Text style={styles.bestValueText}>MOST POPULAR • SAVE 33%</Text>
                    </View>
                  ) : null}

                  <View style={styles.planCardHeader}>
                    <View style={styles.radioOuter}>
                      {isSelected ? (
                        <View style={[styles.radioInner, { backgroundColor: theme.colors.brand }]} />
                      ) : null}
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.planTitle, { color: theme.colors.textPrimary }]}>
                        {pkg.product.title || (isAnnual ? "Annual Membership" : "Monthly Membership")}
                      </Text>
                      <Text style={[styles.planSubtext, { color: theme.colors.textSecondary }]}>
                        {isAnnual
                          ? "7-Day Free Trial included • Cancel anytime"
                          : "Flexible monthly billing • Cancel anytime"}
                      </Text>
                    </View>

                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={[styles.planPrice, { color: isSelected ? theme.colors.brand : theme.colors.textPrimary }]}>
                        {pkg.product.priceString}
                      </Text>
                      {isAnnual ? (
                        <Text style={[styles.planPeriod, { color: theme.colors.textSecondary }]}>
                          ($6.66 / mo)
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Primary Action Button */}
        {selectedPackage ? (
          <Pressable
            style={[styles.primaryCta, { backgroundColor: theme.colors.brand }]}
            onPress={() => onPurchase(selectedPackage)}
          >
            <Text style={styles.primaryCtaText}>
              {isAnnualSelected ? "Start 7-Day Free Trial" : `Subscribe for ${selectedPackage.product.priceString}`}
            </Text>
          </Pressable>
        ) : null}

        {/* Guarantee subtext */}
        <Text style={[styles.guaranteeText, { color: theme.colors.textMuted }]}>
          ✓ Risk-Free 7-Day Trial • Instant Access • No Commitment
        </Text>

        {/* Restore Purchases */}
        <Pressable onPress={onRestore} style={styles.restoreBtn} hitSlop={8}>
          <Text style={[styles.restoreBtnText, { color: theme.colors.textSecondary }]}>
            Already subscribed? Restore Purchases
          </Text>
        </Pressable>

        {/* Footer Legal & Badges */}
        <View style={styles.footerLegal}>
          <Text style={[styles.legalDisclaimer, { color: theme.colors.textMuted }]}>
            Secured by RevenueCat. Recurring billing. Turn off auto-renewal at least 24 hours before period ends. By subscribing you agree to our Terms of Service & Privacy Policy.
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  socialProofCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 20,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  starText: {
    color: "#e0a84c",
    fontSize: 16,
    letterSpacing: 2,
  },
  ratingNumber: {
    fontSize: 14,
    fontWeight: "700",
  },
  socialProofText: {
    fontSize: 12,
    fontWeight: "500",
  },
  featureList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  featureIcon: {
    fontSize: 22,
    marginRight: 12,
    marginTop: 2,
  },
  featureTextWrapper: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  planSelectorWrapper: {
    marginBottom: 20,
  },
  planCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
    position: "relative",
  },
  bestValueBadge: {
    position: "absolute",
    top: -11,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  bestValueText: {
    color: "#000000",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  planCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e0a84c",
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  planSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: "800",
  },
  planPeriod: {
    fontSize: 11,
    marginTop: 2,
  },
  primaryCta: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#e0a84c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryCtaText: {
    color: "#050914",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  guaranteeText: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 10,
    fontWeight: "500",
  },
  restoreBtn: {
    alignItems: "center",
    marginTop: 18,
    paddingVertical: 6,
  },
  restoreBtnText: {
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  footerLegal: {
    marginTop: 20,
    paddingHorizontal: 8,
  },
  legalDisclaimer: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 15,
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
    marginVertical: 16,
  },
});
