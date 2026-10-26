import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppTheme } from "../../theme";
import { SimpleHolding } from "../../services/rebalancer";
import {
  accountAggregatorService,
  AaConsentHandle,
  AaConsolidatedPortfolio,
  AaFipType,
} from "../../services/accountAggregator";

export interface AccountAggregatorModalProps {
  visible: boolean;
  onClose: () => void;
  theme: AppTheme;
  clientName?: string;
  clientId?: string;
  onImportHoldings?: (holdings: SimpleHolding[], mode: "merge" | "replace") => void;
}

export const AccountAggregatorModal: React.FC<AccountAggregatorModalProps> = (props) => {
  if (!props.visible) return null;
  return <AccountAggregatorModalContent {...props} />;
};

const AccountAggregatorModalContent: React.FC<AccountAggregatorModalProps> = ({
  visible,
  onClose,
  theme,
  clientName = "Client Portfolio",
  clientId = "CLIENT-AA-001",
  onImportHoldings,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 768;

  const isDark =
    theme.colors.background === "#030712" ||
    theme.colors.textPrimary === "#ffffff" ||
    theme.colors.textPrimary === "#FFFFFF";

  const brandColor = theme.colors.brand || "#E0A84C";

  // Step state: 1 = Request, 2 = OTP, 3 = Aggregated Preview
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedFips, setSelectedFips] = useState<AaFipType[]>([
    "EQUITIES",
    "MUTUAL_FUNDS",
    "DEPOSIT",
    "BONDS",
  ]);
  const [consentHandle, setConsentHandle] = useState<AaConsentHandle | null>(null);
  const [otpInput, setOtpInput] = useState<string>("123456");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [aggregatedData, setAggregatedData] = useState<AaConsolidatedPortfolio | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [successStatus, setSuccessStatus] = useState<string | null>(null);

  const toggleFip = (fip: AaFipType) => {
    setSelectedFips((prev) =>
      prev.includes(fip) ? prev.filter((item) => item !== fip) : [...prev, fip]
    );
  };

  const handleRequestConsent = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const consent = await accountAggregatorService.requestConsent(
        `AA-${clientId}-${Date.now().toString(36)}`,
        selectedFips
      );
      setConsentHandle(consent);
      setStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to initiate Account Aggregator consent");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!consentHandle) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);
      await accountAggregatorService.verifyConsentOtp(consentHandle.consentId, otpInput);
      const data = await accountAggregatorService.fetchConsolidatedData(consentHandle.consentId);
      setAggregatedData(data);
      setStep(3);
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid OTP code. Please enter 6-digit code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyImport = () => {
    if (!aggregatedData || aggregatedData.holdings.length === 0) {
      setErrorMessage("No valid holdings to import.");
      return;
    }

    if (onImportHoldings) {
      onImportHoldings(aggregatedData.holdings, importMode);
      setSuccessStatus(`Successfully imported ${aggregatedData.holdings.length} positions via Account Aggregator!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString("en-IN")}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, isMobile && { padding: 8 }]}>
        <View
          style={[
            styles.dialog,
            isMobile && { maxWidth: "100%", maxHeight: "96%", borderRadius: 8 },
            {
              backgroundColor: isDark ? "#070D1B" : "#FFFFFF",
              borderColor: isDark ? "rgba(224, 168, 76, 0.35)" : "rgba(179, 126, 40, 0.35)",
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              { borderBottomColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)" },
            ]}
          >
            <View style={{ flex: 1 }}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isDark ? "rgba(224, 168, 76, 0.15)" : "rgba(179, 126, 40, 0.15)",
                    borderColor: isDark ? "rgba(224, 168, 76, 0.3)" : "rgba(179, 126, 40, 0.3)",
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: brandColor }]}>
                  RBI / SAHAMATI COMPLIANT ACCOUNT AGGREGATOR
                </Text>
              </View>
              <Text style={[styles.title, { color: isDark ? "#F8FAFC" : theme.colors.textPrimary }]}>
                Account Aggregator (AA) Auto-Sync
              </Text>
              <Text style={[styles.subtitle, { color: isDark ? "#94A3B8" : theme.colors.textSecondary }]}>
                {clientName} • Non-custodial consent-based direct ingestion
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(15, 23, 42, 0.06)" },
              ]}
            >
              <Text style={[styles.closeBtnText, { color: isDark ? "#94A3B8" : theme.colors.textSecondary }]}>
                ✕
              </Text>
            </Pressable>
          </View>

          {/* Stepper Progress */}
          <View style={styles.stepperRow}>
            <View style={[styles.stepDot, step >= 1 ? { backgroundColor: brandColor } : styles.stepDotInactive]}>
              <Text style={styles.stepNum}>1</Text>
            </View>
            <Text style={[styles.stepLabel, { color: step >= 1 ? brandColor : "#64748B" }]}>Consent</Text>
            <View style={[styles.stepLine, step >= 2 ? { backgroundColor: brandColor } : null]} />

            <View style={[styles.stepDot, step >= 2 ? { backgroundColor: brandColor } : styles.stepDotInactive]}>
              <Text style={styles.stepNum}>2</Text>
            </View>
            <Text style={[styles.stepLabel, { color: step >= 2 ? brandColor : "#64748B" }]}>Verify OTP</Text>
            <View style={[styles.stepLine, step >= 3 ? { backgroundColor: brandColor } : null]} />

            <View style={[styles.stepDot, step >= 3 ? { backgroundColor: brandColor } : styles.stepDotInactive]}>
              <Text style={styles.stepNum}>3</Text>
            </View>
            <Text style={[styles.stepLabel, { color: step >= 3 ? brandColor : "#64748B" }]}>Reconcile</Text>
          </View>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {successStatus && (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.successText}>{successStatus}</Text>
            </View>
          )}

          <ScrollView style={styles.body} contentContainerStyle={{ padding: 20 }}>
            {/* STEP 1: REQUEST CONSENT */}
            {step === 1 && (
              <View>
                <Text style={[styles.stepHeading, { color: isDark ? "#F8FAFC" : theme.colors.textPrimary }]}>
                  Select Financial Information Providers (FIPs)
                </Text>
                <Text style={[styles.stepSubheading, { color: isDark ? "#94A3B8" : theme.colors.textSecondary }]}>
                  Client will receive an encrypted authorization request conforming to Sahamati AA standards.
                </Text>

                <View style={styles.fipList}>
                  {[
                    { key: "EQUITIES" as AaFipType, title: "CDSL / NSDL Demat Depositories", desc: "Listed Stocks, ETFs & SGBs" },
                    { key: "MUTUAL_FUNDS" as AaFipType, title: "CAMS / KFintech RTAs", desc: "All Registrar Mutual Fund Folios" },
                    { key: "DEPOSIT" as AaFipType, title: "Scheduled Commercial Banks", desc: "Savings Balances & Term Deposits" },
                    { key: "BONDS" as AaFipType, title: "RBI Retail Direct & Corporate Bonds", desc: "Sovereign Treasuries & AAA Paper" },
                  ].map((fip) => {
                    const isSelected = selectedFips.includes(fip.key);
                    return (
                      <Pressable
                        key={fip.key}
                        onPress={() => toggleFip(fip.key)}
                        style={[
                          styles.fipItem,
                          {
                            backgroundColor: isDark ? "rgba(11, 19, 38, 0.75)" : "#F8FAFC",
                            borderColor: isSelected ? brandColor : isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
                          },
                        ]}
                      >
                        <View style={[styles.checkbox, isSelected ? { backgroundColor: brandColor, borderColor: brandColor } : null]}>
                          {isSelected && <Ionicons name="checkmark" size={14} color="#030712" />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.fipTitle, { color: isDark ? "#F8FAFC" : theme.colors.textPrimary }]}>
                            {fip.title}
                          </Text>
                          <Text style={[styles.fipDesc, { color: isDark ? "#94A3B8" : theme.colors.textSecondary }]}>
                            {fip.desc}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={[styles.fiduciaryNotice, { borderColor: isDark ? "rgba(224, 168, 76, 0.25)" : "rgba(179, 126, 40, 0.25)" }]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={brandColor} />
                  <Text style={[styles.fiduciaryNoticeText, { color: isDark ? "#94A3B8" : theme.colors.textSecondary }]}>
                    Zero-credential architecture: Asset Array never receives or stores investor netbanking or broker passwords. Consent is cryptographically signed and revocable at any time.
                  </Text>
                </View>

                <Pressable
                  onPress={handleRequestConsent}
                  disabled={isLoading || selectedFips.length === 0}
                  style={[styles.primaryBtn, { backgroundColor: brandColor, opacity: isLoading ? 0.7 : 1 }]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#030712" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Send Consent Request to Investor</Text>
                      <Ionicons name="arrow-forward" size={16} color="#030712" />
                    </>
                  )}
                </Pressable>
              </View>
            )}

            {/* STEP 2: VERIFY OTP */}
            {step === 2 && consentHandle && (
              <View>
                <Text style={[styles.stepHeading, { color: isDark ? "#F8FAFC" : theme.colors.textPrimary }]}>
                  Verify Investor Authorization Code
                </Text>
                <Text style={[styles.stepSubheading, { color: isDark ? "#94A3B8" : theme.colors.textSecondary }]}>
                  Consent Handle <Text style={{ color: brandColor, fontWeight: "700" }}>{consentHandle.consentId}</Text> generated. Enter 6-digit OTP received by investor.
                </Text>

                <View style={styles.otpCard}>
                  <Text style={[styles.otpLabel, { color: isDark ? "#94A3B8" : theme.colors.textSecondary }]}>
                    6-DIGIT VERIFICATION OTP
                  </Text>
                  <TextInput
                    value={otpInput}
                    onChangeText={setOtpInput}
                    maxLength={6}
                    keyboardType="number-pad"
                    style={[
                      styles.otpInput,
                      {
                        color: isDark ? "#F8FAFC" : theme.colors.textPrimary,
                        backgroundColor: isDark ? "rgba(0, 0, 0, 0.4)" : "#F1F5F9",
                        borderColor: brandColor,
                      },
                    ]}
                  />
                  <Text style={[styles.otpHint, { color: isDark ? "#64748B" : "#94A3B8" }]}>
                    Simulation test code: 123456 or any 6-digit OTP
                  </Text>
                </View>

                <View style={styles.btnRow}>
                  <Pressable
                    onPress={() => setStep(1)}
                    style={[styles.secondaryBtn, { borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(15, 23, 42, 0.15)" }]}
                  >
                    <Text style={[styles.secondaryBtnText, { color: isDark ? "#94A3B8" : theme.colors.textSecondary }]}>
                      Back
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleVerifyOtp}
                    disabled={isLoading || otpInput.trim().length !== 6}
                    style={[styles.primaryBtn, { flex: 1, backgroundColor: brandColor, opacity: isLoading ? 0.7 : 1 }]}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#030712" />
                    ) : (
                      <>
                        <Text style={styles.primaryBtnText}>Verify & Fetch Data</Text>
                        <Ionicons name="cloud-download-outline" size={16} color="#030712" />
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            {/* STEP 3: RECONCILE & IMPORT */}
            {step === 3 && aggregatedData && (
              <View>
                <View style={[styles.summaryCard, { borderColor: brandColor, backgroundColor: isDark ? "rgba(224, 168, 76, 0.08)" : "rgba(179, 126, 40, 0.08)" }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={[styles.summaryLabel, { color: brandColor }]}>CONSOLIDATED NET WORTH</Text>
                    <View style={styles.signatureBadge}>
                      <Ionicons name="checkmark-done" size={12} color="#10B981" />
                      <Text style={styles.signatureText}>SIGNATURE VERIFIED</Text>
                    </View>
                  </View>
                  <Text style={[styles.summaryVal, { color: isDark ? "#F8FAFC" : theme.colors.textPrimary }]}>
                    {formatCurrency(aggregatedData.totalNetWorth)}
                  </Text>
                  <Text style={[styles.summarySub, { color: isDark ? "#94A3B8" : theme.colors.textSecondary }]}>
                    Aggregated across {aggregatedData.fipCount} institutions • Hash: {aggregatedData.signatureHash.substring(0, 18)}...
                  </Text>
                </View>

                {/* Import Mode Selector */}
                <View style={styles.modeContainer}>
                  <Text style={[styles.modeTitle, { color: isDark ? "#F8FAFC" : theme.colors.textPrimary }]}>
                    Ingestion Mode
                  </Text>
                  <View style={styles.modeRow}>
                    <Pressable
                      onPress={() => setImportMode("merge")}
                      style={[
                        styles.modeBtn,
                        {
                          borderColor: importMode === "merge" ? brandColor : "transparent",
                          backgroundColor: importMode === "merge" ? (isDark ? "rgba(224, 168, 76, 0.15)" : "rgba(179, 126, 40, 0.15)") : "transparent",
                        },
                      ]}
                    >
                      <Ionicons name="git-merge-outline" size={16} color={importMode === "merge" ? brandColor : "#64748B"} />
                      <Text style={[styles.modeBtnText, { color: importMode === "merge" ? brandColor : "#64748B" }]}>
                        Merge with Existing
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setImportMode("replace")}
                      style={[
                        styles.modeBtn,
                        {
                          borderColor: importMode === "replace" ? "#EF4444" : "transparent",
                          backgroundColor: importMode === "replace" ? "rgba(239, 68, 68, 0.15)" : "transparent",
                        },
                      ]}
                    >
                      <Ionicons name="refresh-outline" size={16} color={importMode === "replace" ? "#EF4444" : "#64748B"} />
                      <Text style={[styles.modeBtnText, { color: importMode === "replace" ? "#EF4444" : "#64748B" }]}>
                        Replace Portfolio
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Extracted Holdings Preview */}
                <Text style={[styles.holdingsPreviewTitle, { color: isDark ? "#F8FAFC" : theme.colors.textPrimary }]}>
                  Extracted Positions ({aggregatedData.holdings.length})
                </Text>
                <View style={[styles.previewList, { borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)" }]}>
                  {aggregatedData.holdings.map((h, i) => (
                    <View
                      key={h.id || i}
                      style={[
                        styles.previewItem,
                        {
                          borderBottomColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(15, 23, 42, 0.05)",
                          backgroundColor: i % 2 === 0 ? "transparent" : (isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(15, 23, 42, 0.02)"),
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.previewName, { color: isDark ? "#F8FAFC" : theme.colors.textPrimary }]} numberOfLines={1}>
                          {h.assetName}
                        </Text>
                        <Text style={[styles.previewMeta, { color: brandColor }]}>
                          {h.assetClass} • {h.quantity} units
                        </Text>
                      </View>
                      <Text style={[styles.previewVal, { color: isDark ? "#F8FAFC" : theme.colors.textPrimary }]}>
                        {formatCurrency(h.currentValue)}
                      </Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  onPress={handleApplyImport}
                  style={[styles.primaryBtn, { backgroundColor: brandColor, marginTop: 16 }]}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#030712" />
                  <Text style={styles.primaryBtnText}>
                    Confirm & Ingest Into Client Roster
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(3, 7, 18, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  dialog: {
    width: "100%",
    maxWidth: 620,
    maxHeight: "90%",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    gap: 8,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  stepNum: {
    color: "#030712",
    fontSize: 11,
    fontWeight: "800",
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  stepLine: {
    width: 24,
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  body: {
    maxHeight: 480,
  },
  stepHeading: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  stepSubheading: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  fipList: {
    gap: 10,
    marginBottom: 16,
  },
  fipItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#64748B",
    alignItems: "center",
    justifyContent: "center",
  },
  fipTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  fipDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  fiduciaryNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 18,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  fiduciaryNoticeText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  primaryBtnText: {
    color: "#030712",
    fontSize: 13,
    fontWeight: "700",
  },
  otpCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    marginBottom: 20,
  },
  otpLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  otpInput: {
    width: 180,
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  otpHint: {
    fontSize: 11,
    marginTop: 10,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  signatureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  signatureText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#10B981",
  },
  summaryVal: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  summarySub: {
    fontSize: 11,
  },
  modeContainer: {
    marginBottom: 16,
  },
  modeTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  holdingsPreviewTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  previewList: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    maxHeight: 180,
  },
  previewItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  previewName: {
    fontSize: 12,
    fontWeight: "600",
  },
  previewMeta: {
    fontSize: 10,
    marginTop: 1,
  },
  previewVal: {
    fontSize: 12,
    fontWeight: "700",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    padding: 10,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 8,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    flex: 1,
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    padding: 10,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 8,
  },
  successText: {
    color: "#10B981",
    fontSize: 12,
    flex: 1,
  },
});
