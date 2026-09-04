import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppTheme } from "../../theme";
import {
  parseStatement,
  SAMPLE_STATEMENTS,
} from "../../services/statementParser";
import { SimpleHolding } from "../../services/rebalancer";

export interface StatementImportModalProps {
  visible: boolean;
  onClose: () => void;
  theme: AppTheme;
  clientName?: string;
  onImportHoldings?: (holdings: SimpleHolding[], mode: "merge" | "replace") => void;
}

export const StatementImportModal: React.FC<StatementImportModalProps> = ({
  visible,
  onClose,
  theme,
  clientName = "Client Portfolio",
  onImportHoldings,
}) => {
  const isDark =
    theme.colors.background === "#030712" ||
    theme.colors.textPrimary === "#ffffff" ||
    theme.colors.textPrimary === "#FFFFFF";

  const brandColor = theme.colors.brand || "#E0A84C";

  const [csvText, setCsvText] = useState<string>(SAMPLE_STATEMENTS.zerodha);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const parseResult = useMemo(() => {
    return parseStatement(csvText);
  }, [csvText]);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString("en-IN")}`;
  };

  const getAssetClassBadgeStyle = (ac: string) => {
    switch (ac) {
      case "Equity":
        return { bg: "rgba(16, 185, 129, 0.15)", text: "#10B981" };
      case "Fixed Income":
      case "Debt":
        return { bg: "rgba(59, 130, 246, 0.15)", text: "#3B82F6" };
      case "Commodities":
        return { bg: "rgba(224, 168, 76, 0.15)", text: brandColor };
      case "Mutual Fund":
        return { bg: "rgba(168, 85, 247, 0.15)", text: "#A855F7" };
      default:
        return { bg: "rgba(148, 163, 184, 0.15)", text: "#94A3B8" };
    }
  };

  const handleFileUpload = (event: any) => {
    if (Platform.OS === "web") {
      const file = event.target?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (content) setCsvText(content);
        };
        reader.readAsText(file);
      }
    }
  };

  const handleApplyImport = () => {
    if (!parseResult.success || parseResult.holdings.length === 0) {
      if (Platform.OS === "web") {
        window.alert("Please provide valid statement CSV data before importing.");
      } else {
        Alert.alert("Validation Error", "Please provide valid statement CSV data before importing.");
      }
      return;
    }

    if (onImportHoldings) {
      onImportHoldings(parseResult.holdings, importMode);
    }

    setSuccessMessage(
      `Successfully imported ${parseResult.holdings.length} holdings totaling ${formatCurrency(
        parseResult.totalValue
      )} to ${clientName}!`
    );

    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1800);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: isDark ? "#070D1B" : "#FFFFFF",
              borderColor: isDark
                ? "rgba(224, 168, 76, 0.35)"
                : "rgba(179, 126, 40, 0.35)",
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              {
                borderBottomColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(15, 23, 42, 0.08)",
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <View
                style={[
                  styles.tagBadge,
                  {
                    backgroundColor: isDark
                      ? "rgba(224, 168, 76, 0.15)"
                      : "rgba(179, 126, 40, 0.15)",
                    borderColor: isDark
                      ? "rgba(224, 168, 76, 0.3)"
                      : "rgba(179, 126, 40, 0.3)",
                  },
                ]}
              >
                <Text style={[styles.tagText, { color: brandColor }]}>
                  INSTITUTIONAL INGESTION
                </Text>
              </View>
              <Text
                style={[
                  styles.title,
                  { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                ]}
              >
                1-Click Broker Statement & CSV Importer
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: isDark ? "#94A3B8" : theme.colors.textSecondary },
                ]}
              >
                Ingest Zerodha, CAMS / KFintech CAS, ICICI Direct, or custodian CSVs for {clientName}.
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.06)"
                    : "rgba(15, 23, 42, 0.06)",
                },
              ]}
            >
              <Text
                style={[
                  styles.closeBtnText,
                  { color: isDark ? "#94A3B8" : theme.colors.textSecondary },
                ]}
              >
                ✕
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Demo Templates */}
            <View style={styles.presetsBar}>
              <Text
                style={[
                  styles.presetsLabel,
                  { color: isDark ? "#94A3B8" : theme.colors.textSecondary },
                ]}
              >
                Load Sample Broker Statement:
              </Text>
              <View style={styles.presetsList}>
                <Pressable
                  style={[
                    styles.presetChip,
                    {
                      borderColor: brandColor,
                      backgroundColor: isDark
                        ? "rgba(224, 168, 76, 0.12)"
                        : "rgba(179, 126, 40, 0.12)",
                    },
                  ]}
                  onPress={() => setCsvText(SAMPLE_STATEMENTS.zerodha)}
                >
                  <Text style={[styles.presetText, { color: brandColor }]}>
                    Zerodha Kite CSV
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.presetChip,
                    {
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.15)"
                        : "rgba(15, 23, 42, 0.15)",
                    },
                  ]}
                  onPress={() => setCsvText(SAMPLE_STATEMENTS.camsCas)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                    ]}
                  >
                    CAMS / KFintech CAS
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.presetChip,
                    {
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.15)"
                        : "rgba(15, 23, 42, 0.15)",
                    },
                  ]}
                  onPress={() => setCsvText(SAMPLE_STATEMENTS.familyOffice)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                    ]}
                  >
                    Family Office Multi-Asset
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* CSV Input Area */}
            <View
              style={[
                styles.inputCard,
                {
                  backgroundColor: isDark
                    ? "rgba(11, 19, 38, 0.75)"
                    : "#FFFFFF",
                  borderColor: isDark
                    ? "rgba(224, 168, 76, 0.22)"
                    : "rgba(179, 126, 40, 0.25)",
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <Text
                  style={[
                    styles.cardHeaderTitle,
                    { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                  ]}
                >
                  Statement CSV Data (Paste or Upload)
                </Text>
                {Platform.OS === "web" && (
                  <label style={{ cursor: "pointer" }}>
                    <input
                      type="file"
                      accept=".csv,.txt,.tsv"
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                    <View
                      style={[
                        styles.uploadBtn,
                        {
                          borderColor: brandColor,
                          backgroundColor: isDark
                            ? "rgba(224, 168, 76, 0.1)"
                            : "rgba(179, 126, 40, 0.1)",
                        },
                      ]}
                    >
                      <Text style={[styles.uploadBtnText, { color: brandColor }]}>
                        📁 Browse CSV File
                      </Text>
                    </View>
                  </label>
                )}
              </View>

              <TextInput
                style={[
                  styles.csvTextArea,
                  {
                    color: isDark ? "#F8FAFC" : theme.colors.textPrimary,
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.03)"
                      : "rgba(15, 23, 42, 0.03)",
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.12)"
                      : "rgba(15, 23, 42, 0.12)",
                  },
                ]}
                multiline
                numberOfLines={6}
                value={csvText}
                onChangeText={setCsvText}
                placeholder="Paste CSV text here (e.g. Symbol, Name, Quantity, Buy Price, Current Price, Current Value)..."
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              />
            </View>

            {/* Parsing Metrics Banner */}
            {parseResult.success ? (
              <View
                style={[
                  styles.metricsRow,
                  {
                    backgroundColor: isDark
                      ? "rgba(11, 19, 38, 0.85)"
                      : "rgba(248, 250, 252, 0.95)",
                    borderColor: brandColor,
                  },
                ]}
              >
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>DETECTED BROKER</Text>
                  <Text style={[styles.metricVal, { color: brandColor }]}>
                    {parseResult.detectedBroker || "Standard CSV"}
                  </Text>
                </View>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>POSITIONS RECOGNIZED</Text>
                  <Text
                    style={[
                      styles.metricVal,
                      { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                    ]}
                  >
                    {parseResult.holdings.length} Securities
                  </Text>
                </View>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>TOTAL PORTFOLIO VALUE</Text>
                  <Text style={[styles.metricVal, { color: "#10B981" }]}>
                    {formatCurrency(parseResult.totalValue)}
                  </Text>
                </View>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>TOTAL UNREALIZED GAIN</Text>
                  <Text
                    style={[
                      styles.metricVal,
                      {
                        color:
                          parseResult.totalGainLoss >= 0
                            ? "#10B981"
                            : "#EF4444",
                      },
                    ]}
                  >
                    {parseResult.totalGainLoss >= 0 ? "+" : ""}
                    {formatCurrency(parseResult.totalGainLoss)}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.errorBanner}>
                <Text style={styles.errorTitle}>Parsing Issue Detected</Text>
                {parseResult.errors.map((err, idx) => (
                  <Text key={idx} style={styles.errorText}>
                    • {err}
                  </Text>
                ))}
              </View>
            )}

            {/* Parsed Holdings Table */}
            {parseResult.success && (
              <View
                style={[
                  styles.tableCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(11, 19, 38, 0.75)"
                      : "#FFFFFF",
                    borderColor: isDark
                      ? "rgba(224, 168, 76, 0.22)"
                      : "rgba(179, 126, 40, 0.25)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tableTitle,
                    { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                  ]}
                >
                  Validated Holdings Preview ({parseResult.holdings.length})
                </Text>

                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { flex: 1.5 }]}>SECURITY / SYMBOL</Text>
                  <Text style={[styles.th, { flex: 1 }]}>ASSET CLASS</Text>
                  <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>VALUE</Text>
                </View>

                {parseResult.holdings.map((h, i) => {
                  const badge = getAssetClassBadgeStyle(h.assetClass);
                  return (
                    <View
                      key={h.id || i}
                      style={[
                        styles.tableRow,
                        {
                          borderBottomColor: isDark
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(15, 23, 42, 0.05)",
                        },
                      ]}
                    >
                      <View style={{ flex: 1.5 }}>
                        <Text
                          style={[
                            styles.holdingName,
                            { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                          ]}
                          numberOfLines={1}
                        >
                          {h.assetName}
                        </Text>
                        <Text style={styles.holdingSymbol}>{h.symbol || h.ticker}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <View
                          style={[
                            styles.classBadge,
                            { backgroundColor: badge.bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.classBadgeText,
                              { color: badge.text },
                            ]}
                          >
                            {h.assetClass}
                          </Text>
                        </View>
                      </View>

                      <View style={{ flex: 1, alignItems: "flex-end" }}>
                        <Text
                          style={[
                            styles.holdingVal,
                            { color: isDark ? "#F8FAFC" : theme.colors.textPrimary },
                          ]}
                        >
                          {formatCurrency(h.currentValue)}
                        </Text>
                        <Text style={styles.holdingWeight}>
                          {(
                            (h.currentValue / (parseResult.totalValue || 1)) *
                            100
                          ).toFixed(1)}
                          %
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Import Mode Selection */}
            {parseResult.success && (
              <View style={styles.modeRow}>
                <Text
                  style={[
                    styles.modeLabel,
                    { color: isDark ? "#94A3B8" : theme.colors.textSecondary },
                  ]}
                >
                  Portfolio Action:
                </Text>
                <View style={styles.modeButtons}>
                  <Pressable
                    style={[
                      styles.modeBtn,
                      importMode === "merge" && {
                        borderColor: brandColor,
                        backgroundColor: isDark
                          ? "rgba(224, 168, 76, 0.15)"
                          : "rgba(179, 126, 40, 0.15)",
                      },
                    ]}
                    onPress={() => setImportMode("merge")}
                  >
                    <Text
                      style={[
                        styles.modeBtnText,
                        importMode === "merge" && {
                          color: brandColor,
                          fontWeight: "800",
                        },
                      ]}
                    >
                      ✓ Merge with Existing
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.modeBtn,
                      importMode === "replace" && {
                        borderColor: "#EF4444",
                        backgroundColor: "rgba(239, 68, 68, 0.15)",
                      },
                    ]}
                    onPress={() => setImportMode("replace")}
                  >
                    <Text
                      style={[
                        styles.modeBtnText,
                        importMode === "replace" && {
                          color: "#EF4444",
                          fontWeight: "800",
                        },
                      ]}
                    >
                      Replace Entire Portfolio
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {successMessage && (
              <View style={styles.successBox}>
                <Text style={styles.successText}>✓ {successMessage}</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(15, 23, 42, 0.08)",
              },
            ]}
          >
            <Pressable
              onPress={handleApplyImport}
              disabled={!parseResult.success}
              style={[
                styles.applyBtn,
                {
                  backgroundColor: parseResult.success
                    ? brandColor
                    : "rgba(148, 163, 184, 0.3)",
                },
              ]}
            >
              <Text style={styles.applyBtnText}>
                {parseResult.success
                  ? `Execute Import (${parseResult.holdings.length} Securities • ${formatCurrency(
                      parseResult.totalValue
                    )})`
                  : "Enter Valid Statement Data"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(3, 7, 18, 0.82)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  dialog: {
    width: "100%",
    maxWidth: 860,
    maxHeight: "92%",
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
  },
  tagBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  scrollArea: {
    flex: 1,
  },
  presetsBar: {
    marginBottom: 14,
  },
  presetsLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
  },
  presetsList: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 11,
    fontWeight: "700",
  },
  inputCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  uploadBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  uploadBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
  csvTextArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    fontFamily: Platform.OS === "web" ? "monospace" : undefined,
    minHeight: 110,
    textAlignVertical: "top",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  metricCol: {
    minWidth: 140,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.8,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: "800",
    marginTop: 3,
  },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#EF4444",
    marginBottom: 4,
  },
  errorText: {
    fontSize: 11,
    color: "#FCA5A5",
    lineHeight: 16,
  },
  tableCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  tableTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  th: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  holdingName: {
    fontSize: 12,
    fontWeight: "700",
  },
  holdingSymbol: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 1,
  },
  classBadge: {
    alignSelf: "flex-start",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  classBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  holdingVal: {
    fontSize: 12,
    fontWeight: "800",
  },
  holdingWeight: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 1,
  },
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    flexWrap: "wrap",
    gap: 10,
  },
  modeLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  modeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  modeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  modeBtnText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  successBox: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "rgba(16, 185, 129, 0.4)",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  successText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  applyBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  applyBtnText: {
    color: "#030712",
    fontSize: 14,
    fontWeight: "800",
  },
});
