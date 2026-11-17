import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  useWindowDimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppTheme } from "../../theme";
import { Client, DocumentCategory, PortfolioHolding } from "../../types/wealth";
import { useDocumentVault } from "../../hooks/useDocumentVault";
import { parseStatement, SAMPLE_STATEMENTS } from "../../services/statementParser";
import { formatWealthAmount } from "../../services/currency";

export interface DocumentVaultModalProps {
  visible: boolean;
  onClose: () => void;
  theme: AppTheme;
  client: Client | null;
  clients?: Client[];
  onSelectClient?: (clientId: string) => void;
  onUpdateClientHoldings?: (clientId: string, updatedHoldings: PortfolioHolding[]) => void;
  isDesktop?: boolean;
}

export const DocumentVaultModal: React.FC<DocumentVaultModalProps> = (props) => {
  if (!props.visible) return null;
  return <DocumentVaultModalContent {...props} />;
};

const DocumentVaultModalContent: React.FC<DocumentVaultModalProps> = ({
  onClose,
  theme,
  client,
  clients = [],
  onSelectClient,
  onUpdateClientHoldings,
  isDesktop: propIsDesktop,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = propIsDesktop ?? width >= 1024;
  const isMobile = width < 768;

  const isDark =
    theme.colors.background === "#030712" ||
    theme.colors.textPrimary === "#ffffff" ||
    theme.colors.textPrimary === "#FFFFFF";

  const brandColor = theme.colors.brand || "#E0A84C";
  const bgCard = isDark ? "#0D1424" : "#FFFFFF";
  const borderCard = isDark ? "rgba(224, 168, 76, 0.25)" : "rgba(179, 126, 40, 0.25)";

  const {
    documents,
    isLoading,
    addDocument,
    removeDocument,
    activeReport,
    selectedTickers,
    toggleTickerSelection,
    selectAllTickers,
    clearTickerSelection,
    runReconciliation,
    commitReconciliation,
    dismissReconciliation,
    sampleDataEnabled,
  } = useDocumentVault(client?.id);

  // Local state
  const [activeCategory, setActiveCategory] = useState<"all" | DocumentCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocCategory, setNewDocCategory] = useState<DocumentCategory>("kyc");
  const [newDocNotes, setNewDocNotes] = useState("");
  const [isManualPasteOpen, setIsManualPasteOpen] = useState(false);
  const [manualStatementText, setManualStatementText] = useState("");
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchCat = activeCategory === "all" || doc.category === activeCategory;
      const matchQuery =
        !searchQuery.trim() ||
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.notes && doc.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [documents, activeCategory, searchQuery]);

  // Client portfolio valuation summary
  const totalPortfolioVal = useMemo(() => {
    if (!client || !client.portfolio) return 0;
    return client.portfolio.reduce((sum, h) => sum + (parseFloat(h.currentValue) || 0), 0);
  }, [client]);

  // Handle sample statement ingestion
  const handleIngestSample = (key: keyof typeof SAMPLE_STATEMENTS, sourceLabel: string) => {
    if (!client) {
      Alert.alert("No Client Selected", "Please select a client before reconciling statements.");
      return;
    }
    const raw = SAMPLE_STATEMENTS[key];
    const parseRes = parseStatement(raw);
    if (!parseRes.success || parseRes.holdings.length === 0) {
      Alert.alert("Ingestion Error", "Failed to parse sample statement.");
      return;
    }
    runReconciliation(parseRes.holdings, client.portfolio || [], sourceLabel);
    showToast(`Parsed ${parseRes.holdings.length} statement holdings. Reviewing reconciliation diff...`);
  };

  // Handle manual statement submission
  const handleExecuteManualReconcile = () => {
    if (!client) return;
    if (!manualStatementText.trim()) {
      Alert.alert("Empty Statement", "Please paste CSV or CAS statement text.");
      return;
    }
    const parseRes = parseStatement(manualStatementText);
    if (!parseRes.success || parseRes.holdings.length === 0) {
      Alert.alert("Parsing Failed", "Could not detect valid broker holdings in statement text.");
      return;
    }
    runReconciliation(parseRes.holdings, client.portfolio || [], "Manual Ingested Statement");
    setIsManualPasteOpen(false);
    setManualStatementText("");
    showToast(`Loaded ${parseRes.holdings.length} positions. Ready for reconciliation.`);
  };

  // Handle committing reconciliation diff to client portfolio
  const handleCommitReconciliation = async () => {
    if (!client || !activeReport) return;
    if (selectedTickers.length === 0) {
      Alert.alert("No Holdings Selected", "Please check at least one holding to merge.");
      return;
    }

    await commitReconciliation(
      client.portfolio || [],
      (updatedHoldings) => {
        if (onUpdateClientHoldings && client.id) {
          onUpdateClientHoldings(client.id, updatedHoldings);
        }
      },
      `Reconciled ${activeReport.statementSource || "Statement"} (${new Date().toLocaleDateString("en-IN")})`
    );

    showToast(`Successfully merged ${selectedTickers.length} reconciled holdings into ${client.name}'s portfolio!`);
  };

  // Handle creating a new document entry
  const handleSaveUploadDoc = async () => {
    if (!newDocName.trim()) {
      Alert.alert("Document Title Required", "Please enter a valid document title.");
      return;
    }
    await addDocument(newDocName.trim(), newDocCategory, "1.2 MB", undefined, newDocNotes.trim() || undefined);
    setNewDocName("");
    setNewDocNotes("");
    setIsUploadFormOpen(false);
    showToast("Document saved to fiduciary vault.");
  };

  const getCategoryBadge = (cat: DocumentCategory) => {
    switch (cat) {
      case "statement":
        return { label: "CAS Statement", color: "#3B82F6", bg: "rgba(59, 130, 246, 0.12)" };
      case "kyc":
        return { label: "CKYC / Identity", color: "#10B981", bg: "rgba(16, 185, 129, 0.12)" };
      case "tax":
        return { label: "Tax Return", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)" };
      case "legal":
        return { label: "Legal & Will", color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.12)" };
      case "ips":
        return { label: "IPS Mandate", color: brandColor, bg: "rgba(224, 168, 76, 0.12)" };
      default:
        return { label: "General", color: "#94A3B8", bg: "rgba(148, 163, 184, 0.12)" };
    }
  };

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.container, { backgroundColor: isDark ? "#060A12" : "#F8F9FA", borderColor: borderCard }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)" }]}>
            <View style={{ flex: 1 }}>
              <View style={[styles.badge, { backgroundColor: isDark ? "rgba(224, 168, 76, 0.12)" : "rgba(179, 126, 40, 0.12)", borderColor: borderCard }]}>
                <Ionicons name="folder-open-outline" size={12} color={brandColor} style={{ marginRight: 4 }} />
                <Text style={[styles.badgeText, { color: brandColor }]}>FIDUCIARY DOCUMENT VAULT & RECONCILIATION</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
                <Text style={[styles.title, { color: isDark ? "#F8FAFC" : theme.colors.textPrimary }]}>
                  Client Document Vault
                </Text>
                {client && (
                  <View style={[styles.clientPill, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#E2E8F0" }]}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: brandColor }}>{client.name}</Text>
                    <Text style={{ fontSize: 10, color: isDark ? "#94A3B8" : "#64748B", marginLeft: 4 }}>
                      ({formatWealthAmount(totalPortfolioVal)})
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.subtitle, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                Client-scoped encrypted legal vault, CAS statements, and 1-click portfolio holding reconciliation desk.
              </Text>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
            </Pressable>
          </View>

          {/* Toast Notification */}
          {feedbackToast && (
            <View style={[styles.toast, { backgroundColor: brandColor }]}>
              <Ionicons name="checkmark-circle" size={16} color="#030712" style={{ marginRight: 6 }} />
              <Text style={styles.toastText}>{feedbackToast}</Text>
            </View>
          )}

          {/* KPI Summary Bar */}
          <View style={[styles.kpiBar, { backgroundColor: isDark ? "#0A0F1D" : "#EDF2F7", borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)" }]}>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiLabel}>STORED DOCUMENTS</Text>
              <Text style={[styles.kpiValue, { color: isDark ? "#F8FAFC" : theme.colors.textPrimary }]}>
                {documents.length} Records
              </Text>
            </View>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiLabel}>CKYC / IDENTITY</Text>
              <Text style={[styles.kpiValue, { color: "#10B981" }]}>
                {documents.some((d) => d.category === "kyc") ? "✓ Verified" : "Pending"}
              </Text>
            </View>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiLabel}>PORTFOLIO VALUATION</Text>
              <Text style={[styles.kpiValue, { color: brandColor }]}>
                {formatWealthAmount(totalPortfolioVal)}
              </Text>
            </View>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiLabel}>RECONCILIATION STATE</Text>
              <Text style={[styles.kpiValue, { color: activeReport ? "#F59E0B" : "#10B981" }]}>
                {activeReport ? `⚠️ ${activeReport.items.length} Diff Items` : "100% In-Sync"}
              </Text>
            </View>
          </View>

          {/* Main Body */}
          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            {/* 1. RECONCILIATION DIFF DESK (when active) */}
            {activeReport && (
              <View style={[styles.diffDeskCard, { backgroundColor: isDark ? "#0F172A" : "#FFFFFF", borderColor: "#F59E0B" }]}>
                <View style={styles.diffDeskHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Ionicons name="git-compare" size={16} color="#F59E0B" />
                      <Text style={[styles.diffDeskTitle, { color: isDark ? "#F8FAFC" : "#0F172A" }]}>
                        Statement Reconciliation Review Desk
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: "rgba(245, 158, 11, 0.15)", borderColor: "rgba(245, 158, 11, 0.3)" }]}>
                        <Text style={{ fontSize: 10, fontWeight: "700", color: "#F59E0B" }}>
                          {activeReport.auditSignature}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: isDark ? "#94A3B8" : "#64748B", marginTop: 2 }}>
                      Source: {activeReport.statementSource} · {activeReport.items.length} holdings evaluated against live portfolio.
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <Pressable
                      onPress={selectAllTickers}
                      style={[styles.smallBtn, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0" }]}
                    >
                      <Text style={{ fontSize: 11, color: isDark ? "#F8FAFC" : "#0F172A", fontWeight: "600" }}>Select All</Text>
                    </Pressable>
                    <Pressable
                      onPress={clearTickerSelection}
                      style={[styles.smallBtn, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0" }]}
                    >
                      <Text style={{ fontSize: 11, color: isDark ? "#F8FAFC" : "#0F172A", fontWeight: "600" }}>Clear</Text>
                    </Pressable>
                    <Pressable
                      onPress={dismissReconciliation}
                      style={[styles.smallBtn, { backgroundColor: "rgba(239, 68, 68, 0.15)" }]}
                    >
                      <Text style={{ fontSize: 11, color: "#EF4444", fontWeight: "600" }}>Dismiss</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Diff Items Table */}
                <View style={styles.diffTable}>
                  <View style={[styles.diffTableHeader, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)" }]}>
                    <Text style={[styles.thCell, { flex: 0.5, textAlign: "center" }]}>✓</Text>
                    <Text style={[styles.thCell, { flex: 2.2 }]}>SECURITY / TICKER</Text>
                    <Text style={[styles.thCell, { flex: 1.2 }]}>STATUS</Text>
                    <Text style={[styles.thCell, { flex: 1.2, textAlign: "right" }]}>PORTFOLIO QTY</Text>
                    <Text style={[styles.thCell, { flex: 1.2, textAlign: "right" }]}>STATEMENT QTY</Text>
                    <Text style={[styles.thCell, { flex: 1.5, textAlign: "right" }]}>DELTA VALUE</Text>
                  </View>

                  {activeReport.items.map((item) => {
                    const isSelected = selectedTickers.includes(item.ticker);
                    const isNew = item.diffType === "new";
                    const isModified = item.diffType === "modified";
                    const isRemoved = item.diffType === "removed";

                    const badgeColor = isNew ? "#10B981" : isModified ? "#F59E0B" : isRemoved ? "#EF4444" : "#94A3B8";
                    const badgeBg = isNew
                      ? "rgba(16, 185, 129, 0.15)"
                      : isModified
                      ? "rgba(245, 158, 11, 0.15)"
                      : isRemoved
                      ? "rgba(239, 68, 68, 0.15)"
                      : "rgba(148, 163, 184, 0.15)";

                    return (
                      <Pressable
                        key={item.ticker}
                        onPress={() => toggleTickerSelection(item.ticker)}
                        style={[
                          styles.diffTableRow,
                          isSelected && { backgroundColor: isDark ? "rgba(224, 168, 76, 0.05)" : "rgba(179, 126, 40, 0.05)" },
                        ]}
                      >
                        <View style={{ flex: 0.5, alignItems: "center" }}>
                          <Ionicons
                            name={isSelected ? "checkbox" : "square-outline"}
                            size={18}
                            color={isSelected ? brandColor : isDark ? "#475569" : "#CBD5E1"}
                          />
                        </View>
                        <View style={{ flex: 2.2 }}>
                          <Text style={{ fontSize: 12, fontWeight: "700", color: isDark ? "#F8FAFC" : "#0F172A" }}>
                            {item.ticker}
                          </Text>
                          <Text style={{ fontSize: 10, color: isDark ? "#94A3B8" : "#64748B" }} numberOfLines={1}>
                            {item.assetName} · {item.assetClass}
                          </Text>
                        </View>
                        <View style={{ flex: 1.2, alignItems: "flex-start" }}>
                          <View style={[styles.statusBadge, { backgroundColor: badgeBg, borderColor: badgeColor }]}>
                            <Text style={{ fontSize: 9, fontWeight: "700", color: badgeColor }}>
                              {item.diffType.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.tdCell, { flex: 1.2, textAlign: "right" }]}>{item.existingQuantity}</Text>
                        <Text style={[styles.tdCell, { flex: 1.2, textAlign: "right", fontWeight: "700", color: isDark ? "#F8FAFC" : "#0F172A" }]}>
                          {item.statementQuantity}
                        </Text>
                        <Text
                          style={[
                            styles.tdCell,
                            {
                              flex: 1.5,
                              textAlign: "right",
                              fontWeight: "700",
                              color: item.deltaValue > 0 ? "#10B981" : item.deltaValue < 0 ? "#EF4444" : "#94A3B8",
                            },
                          ]}
                        >
                          {item.deltaValue >= 0 ? "+" : ""}
                          {formatWealthAmount(item.deltaValue)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Commit Action Footer */}
                <View style={styles.diffDeskFooter}>
                  <Text style={{ fontSize: 11, color: isDark ? "#94A3B8" : "#64748B" }}>
                    Selected {selectedTickers.length} of {activeReport.items.length} changes to commit.
                  </Text>
                  <Pressable
                    onPress={handleCommitReconciliation}
                    style={[styles.primaryActionBtn, { backgroundColor: brandColor }]}
                  >
                    <Ionicons name="checkmark-done" size={16} color="#030712" style={{ marginRight: 6 }} />
                    <Text style={[styles.primaryActionBtnText, { color: "#030712" }]}>
                      Merge Approved Changes into Client Portfolio
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* 2. ACTION CONTROLS & INGESTION PRESETS */}
            <View style={[styles.actionCard, { backgroundColor: bgCard, borderColor: borderCard }]}>
              <View style={{ flexDirection: isDesktop ? "row" : "column", justifyContent: "space-between", alignItems: isDesktop ? "center" : "flex-start", gap: 10 }}>
                <View>
                  <Text style={[styles.sectionTitle, { color: isDark ? "#F8FAFC" : theme.colors.textPrimary }]}>
                    Fiduciary Ingestion & Actions
                  </Text>
                  <Text style={{ fontSize: 11, color: isDark ? "#94A3B8" : "#64748B" }}>
                    Upload physical deeds/KYC or ingest consolidated account statements (CAS).
                  </Text>
                </View>

                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  <Pressable
                    onPress={() => setIsUploadFormOpen((prev) => !prev)}
                    style={[styles.smallBtn, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0" }]}
                  >
                    <Ionicons name="add-circle-outline" size={14} color={brandColor} style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 11, fontWeight: "600", color: isDark ? "#F8FAFC" : "#0F172A" }}>
                      + New Document
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setIsManualPasteOpen((prev) => !prev)}
                    style={[styles.smallBtn, { backgroundColor: isDark ? "rgba(224, 168, 76, 0.15)" : "rgba(179, 126, 40, 0.15)", borderColor: borderCard, borderWidth: 1 }]}
                  >
                    <Ionicons name="document-text-outline" size={14} color={brandColor} style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 11, fontWeight: "700", color: brandColor }}>
                      Paste CAS / CSV
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Sample Data Testing Chips (Gated by sampleDataEnabled setting) */}
              {sampleDataEnabled && (
                <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Ionicons name="flask-outline" size={13} color="#F59E0B" />
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#F59E0B" }}>
                      Testing Mode: 1-Click Institutional Reconciliation Presets
                    </Text>
                    <Text style={{ fontSize: 10, color: isDark ? "#64748B" : "#94A3B8" }}>
                      (Turn off in Settings)
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    <Pressable
                      onPress={() => handleIngestSample("zerodha", "Zerodha CAS Demo")}
                      style={[styles.presetChip, { borderColor: borderCard, backgroundColor: isDark ? "rgba(224, 168, 76, 0.08)" : "rgba(179, 126, 40, 0.08)" }]}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "700", color: brandColor }}>⚡ Zerodha CAS (₹85L)</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleIngestSample("camsCas", "CAMS CAS Demo")}
                      style={[styles.presetChip, { borderColor: borderCard, backgroundColor: isDark ? "rgba(224, 168, 76, 0.08)" : "rgba(179, 126, 40, 0.08)" }]}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "700", color: brandColor }}>⚡ CAMS Mutual Fund CAS (₹1.8 Cr)</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleIngestSample("upstox", "Upstox Demat Demo")}
                      style={[styles.presetChip, { borderColor: borderCard, backgroundColor: isDark ? "rgba(224, 168, 76, 0.08)" : "rgba(179, 126, 40, 0.08)" }]}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "700", color: brandColor }}>⚡ Upstox Demat</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Upload Document Inline Form */}
              {isUploadFormOpen && (
                <View style={[styles.inlineForm, { backgroundColor: isDark ? "#070D1B" : "#F1F5F9", borderColor: borderCard }]}>
                  <Text style={[styles.formTitle, { color: isDark ? "#F8FAFC" : "#0F172A" }]}>Upload Fiduciary Record</Text>
                  <View style={{ gap: 8, marginTop: 8 }}>
                    <TextInput
                      style={[styles.input, { color: isDark ? "#F8FAFC" : "#0F172A", backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "#FFFFFF", borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#CBD5E1" }]}
                      placeholder="Document Title (e.g., Client KYC Pan & Passport)"
                      placeholderTextColor="#64748B"
                      value={newDocName}
                      onChangeText={setNewDocName}
                    />

                    <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                      {(["kyc", "statement", "tax", "legal", "ips", "general"] as DocumentCategory[]).map((cat) => (
                        <Pressable
                          key={cat}
                          onPress={() => setNewDocCategory(cat)}
                          style={[
                            styles.categoryPill,
                            newDocCategory === cat && { backgroundColor: brandColor, borderColor: brandColor },
                          ]}
                        >
                          <Text style={{ fontSize: 10, fontWeight: "700", color: newDocCategory === cat ? "#030712" : isDark ? "#94A3B8" : "#64748B" }}>
                            {cat.toUpperCase()}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    <TextInput
                      style={[styles.input, { color: isDark ? "#F8FAFC" : "#0F172A", backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "#FFFFFF", borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#CBD5E1" }]}
                      placeholder="Fiduciary Notes & DPDP Verification Stamping"
                      placeholderTextColor="#64748B"
                      value={newDocNotes}
                      onChangeText={setNewDocNotes}
                    />

                    <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
                      <Pressable onPress={() => setIsUploadFormOpen(false)} style={styles.smallBtn}>
                        <Text style={{ fontSize: 11, color: isDark ? "#94A3B8" : "#64748B" }}>Cancel</Text>
                      </Pressable>
                      <Pressable onPress={handleSaveUploadDoc} style={[styles.smallBtn, { backgroundColor: brandColor }]}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#030712" }}>Save Document</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}

              {/* Manual Statement Paste Form */}
              {isManualPasteOpen && (
                <View style={[styles.inlineForm, { backgroundColor: isDark ? "#070D1B" : "#F1F5F9", borderColor: borderCard }]}>
                  <Text style={[styles.formTitle, { color: isDark ? "#F8FAFC" : "#0F172A" }]}>
                    Paste CAS or Broker CSV Statement
                  </Text>
                  <TextInput
                    style={[
                      styles.textArea,
                      { color: isDark ? "#F8FAFC" : "#0F172A", backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "#FFFFFF", borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#CBD5E1" },
                    ]}
                    placeholder="Paste raw CSV statement text (e.g. Symbol, Qty, Price, Value...)"
                    placeholderTextColor="#64748B"
                    value={manualStatementText}
                    onChangeText={setManualStatementText}
                    multiline
                    numberOfLines={4}
                  />
                  <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                    <Pressable onPress={() => setIsManualPasteOpen(false)} style={styles.smallBtn}>
                      <Text style={{ fontSize: 11, color: isDark ? "#94A3B8" : "#64748B" }}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={handleExecuteManualReconcile} style={[styles.smallBtn, { backgroundColor: brandColor }]}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#030712" }}>Run Reconciliation</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            {/* 3. CATEGORY TABS & SEARCH */}
            <View style={styles.filterRow}>
              <View style={styles.tabsContainer}>
                {[
                  { key: "all", label: "All Records" },
                  { key: "statement", label: "Statements (CAS)" },
                  { key: "kyc", label: "CKYC & ID" },
                  { key: "tax", label: "Tax Filings" },
                  { key: "legal", label: "Legal & Wills" },
                  { key: "ips", label: "IPS Mandates" },
                ].map((tab) => (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveCategory(tab.key as any)}
                    style={[
                      styles.filterTab,
                      activeCategory === tab.key && {
                        backgroundColor: isDark ? "rgba(224, 168, 76, 0.15)" : "rgba(179, 126, 40, 0.15)",
                        borderColor: brandColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        { color: activeCategory === tab.key ? brandColor : isDark ? "#94A3B8" : "#64748B" },
                        activeCategory === tab.key && { fontWeight: "700" },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.searchBox}>
                <Ionicons name="search" size={14} color="#64748B" style={{ marginRight: 6 }} />
                <TextInput
                  style={[styles.searchInput, { color: isDark ? "#F8FAFC" : "#0F172A" }]}
                  placeholder="Filter records..."
                  placeholderTextColor="#64748B"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {/* 4. DOCUMENTS ARCHIVE CARDS */}
            {filteredDocuments.length === 0 ? (
              <View style={[styles.emptyStateCard, { backgroundColor: bgCard, borderColor: borderCard }]}>
                <Ionicons name="document-text-outline" size={36} color={brandColor} style={{ opacity: 0.6 }} />
                <Text style={[styles.emptyStateTitle, { color: isDark ? "#F8FAFC" : theme.colors.textPrimary }]}>
                  No Documents Found
                </Text>
                <Text style={{ fontSize: 11, color: isDark ? "#94A3B8" : "#64748B", textAlign: "center", marginTop: 4, maxWidth: 360 }}>
                  {searchQuery ? "No records match your search filter." : "This client has no stored fiduciary records in this category. Upload a document or ingest a statement to begin."}
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {filteredDocuments.map((doc) => {
                  const badge = getCategoryBadge(doc.category);
                  const isStatement = doc.category === "statement";

                  return (
                    <View
                      key={doc.id}
                      style={[
                        styles.docCard,
                        {
                          backgroundColor: bgCard,
                          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
                        },
                      ]}
                    >
                      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, flex: 1 }}>
                        <View style={[styles.docIconBox, { backgroundColor: badge.bg }]}>
                          <Ionicons
                            name={
                              isStatement
                                ? "receipt-outline"
                                : doc.category === "kyc"
                                ? "shield-checkmark-outline"
                                : doc.category === "legal"
                                ? "business-outline"
                                : "document-text-outline"
                            }
                            size={20}
                            color={badge.color}
                          />
                        </View>

                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <Text style={[styles.docTitle, { color: isDark ? "#F8FAFC" : theme.colors.textPrimary }]}>
                              {doc.name}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.color }]}>
                              <Text style={{ fontSize: 9, fontWeight: "700", color: badge.color }}>
                                {badge.label}
                              </Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: "rgba(16, 185, 129, 0.12)", borderColor: "#10B981" }]}>
                              <Text style={{ fontSize: 9, fontWeight: "700", color: "#10B981" }}>
                                {doc.status.toUpperCase()}
                              </Text>
                            </View>
                          </View>

                          {doc.notes && (
                            <Text style={{ fontSize: 11, color: isDark ? "#94A3B8" : "#64748B", marginTop: 3 }}>
                              {doc.notes}
                            </Text>
                          )}

                          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 }}>
                            <Text style={{ fontSize: 10, color: "#64748B" }}>
                              Uploaded: {new Date(doc.uploadedAt).toLocaleDateString("en-IN")}
                            </Text>
                            <Text style={{ fontSize: 10, color: "#64748B" }}>
                              Size: {doc.fileSizeFormatted}
                            </Text>
                            {doc.extractedHoldingsCount !== undefined && (
                              <Text style={{ fontSize: 10, color: brandColor, fontWeight: "600" }}>
                                {doc.extractedHoldingsCount} Extracted Holdings
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* Card Action Icons */}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Pressable
                          onPress={() => removeDocument(doc.id)}
                          style={[styles.iconActionBtn, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}
                          hitSlop={8}
                        >
                          <Ionicons name="trash-outline" size={14} color="#EF4444" />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Fiduciary Footer */}
          <View style={[styles.footer, { borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="lock-closed" size={12} color="#10B981" />
              <Text style={{ fontSize: 10, color: isDark ? "#94A3B8" : "#64748B" }}>
                DPDP Act 2023 Compliant · Zero-PII Boundary · Encrypted Local Vault
              </Text>
            </View>
            <Pressable onPress={onClose} style={[styles.smallBtn, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0" }]}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: isDark ? "#F8FAFC" : "#0F172A" }}>Close</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  container: {
    width: "100%",
    maxWidth: 960,
    maxHeight: "92%",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  clientPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toastText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#030712",
  },
  kpiBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 16,
    flexWrap: "wrap",
  },
  kpiItem: {
    flex: 1,
    minWidth: 130,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  diffDeskCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  diffDeskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  diffDeskTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  diffTable: {
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  diffTableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  thCell: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  diffTableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  tdCell: {
    fontSize: 11,
    color: "#94A3B8",
  },
  diffDeskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  primaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  primaryActionBtnText: {
    fontSize: 12,
    fontWeight: "800",
  },
  actionCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  inlineForm: {
    marginTop: 12,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  formTitle: {
    fontSize: 12,
    fontWeight: "800",
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    minHeight: 80,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  tabsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterTabText: {
    fontSize: 11,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    minWidth: 160,
  },
  searchInput: {
    fontSize: 11,
    padding: 0,
    flex: 1,
  },
  emptyStateCard: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  docIconBox: {
    width: 38,
    height: 38,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  docTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  iconActionBtn: {
    padding: 6,
    borderRadius: 6,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
});
