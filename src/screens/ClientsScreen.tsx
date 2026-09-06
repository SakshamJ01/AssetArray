import React, { useMemo } from "react";
import {
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppTheme } from "../theme";
import {
  Category,
  CATEGORY_FILTER_OPTIONS,
  CHANNEL_OPTIONS,
  Client,
  FilterMode,
  Goal,
} from "../types/wealth";
import { AssetAllocationBar } from "../components/AssetAllocationBar";
import { StatementImportModal, ClientPortalModal } from "../components/modals";
import { SimpleHolding } from "../services/rebalancer";
import { Client360Workspace } from "../components/client360";

export interface ClientsScreenProps {
  theme: AppTheme;
  isDesktop: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: "All" | Category;
  setCategoryFilter: (category: "All" | Category) => void;
  filterMode: FilterMode;
  setFilterMode: (mode: FilterMode) => void;
  selectedClientIds: string[];
  selectAllVisibleClients: () => void;
  clearSelectedClients: () => void;
  setIsBroadcastModalOpen: (open: boolean) => void;
  filteredClients: Client[];
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  toggleSelectedClient: (id: string) => void;
  selectedClient: Client | null;
  getClientAvatar: (client: Client) => string;
  formatReminderDate: (dateString: string) => string;
  isReminderDue: (dateString: string) => boolean;
  contactClient: (client: Client, channel: any) => void;
  isPro: boolean;
  setIsPaywallVisible: (visible: boolean) => void;
  exportClientPdfReport: (params: { client: Client; advisorName: string }) => Promise<void>;
  advisorName: string;
  openEditModal: (client: Client) => void;
  deleteClient: (client: Client) => void;
  seedDemoClients: () => void | Promise<void>;
  selectedClientInsights: string[];
  selectedClientMessageDraft: string;
  selectedClientReportDraft: string;
  onImportHoldings?: (holdings: SimpleHolding[], mode: "merge" | "replace") => void;
  goals?: Goal[];
  onNavigateTab?: (tab: string, params?: any) => void;
  styles: any;
}

interface ClientRowItemProps {
  client: Client;
  active: boolean;
  selected: boolean;
  avatarUri: string;
  isDue: boolean;
  formattedDate: string;
  onToggleSelected: (id: string) => void;
  onSelectClient: (id: string) => void;
  theme: AppTheme;
  styles: any;
}

const ClientRowItem = React.memo<ClientRowItemProps>(
  ({
    client,
    active,
    selected,
    avatarUri,
    isDue,
    formattedDate,
    onToggleSelected,
    onSelectClient,
    theme,
    styles,
  }) => {
    const aum = useMemo(() => {
      return (client.portfolio || []).reduce(
        (acc, h) => acc + (parseFloat(h.currentValue) || 0),
        0
      );
    }, [client.portfolio]);

    const formattedAum = useMemo(() => {
      if (aum >= 10_000_000) return `₹${(aum / 10_000_000).toFixed(2)} Cr`;
      if (aum >= 100_000) return `₹${(aum / 100_000).toFixed(2)} L`;
      if (aum > 0) return `₹${Math.round(aum).toLocaleString("en-IN")}`;
      return "₹0";
    }, [aum]);

    const healthScore = useMemo(() => {
      const base = 78;
      const countBonus = Math.min(10, (client.portfolio?.length || 0) * 2);
      const duePenalty = isDue ? 14 : 0;
      return Math.min(96, Math.max(52, base + countBonus - duePenalty));
    }, [client.portfolio, isDue]);

    return (
      <View style={[styles.clientRowShell, { marginBottom: 6 }]}>
        <Pressable
          style={[styles.selectorPill, selected ? styles.selectorPillActive : null, { borderRadius: 4 }]}
          onPress={() => onToggleSelected(client.id)}
        >
          <Text
            style={[
              styles.selectorPillText,
              selected ? styles.selectorPillTextActive : null,
            ]}
          >
            {selected ? "✓" : "○"}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.clientRow,
            active ? styles.clientRowActive : null,
            {
              borderRadius: 4,
              borderWidth: 1,
              borderColor: active ? theme.colors.brand : theme.colors.border,
              paddingVertical: 10,
              paddingHorizontal: 12,
            },
          ]}
          onPress={() => onSelectClient(client.id)}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
            <Image
              source={{ uri: avatarUri }}
              style={[styles.clientListAvatar, { borderRadius: 4, width: 34, height: 34 }]}
            />
            <View style={[styles.clientRowMain, { flex: 1 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
                <Text style={[styles.clientName, { fontSize: 13, fontWeight: "700", color: theme.colors.textPrimary }]}>
                  {client.name}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: "800", color: theme.colors.brand, fontVariant: ["tabular-nums"] }}>
                  {formattedAum}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                <View style={{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: theme.colors.surfaceStrong, borderWidth: 1, borderColor: theme.colors.border }}>
                  <Text style={{ fontSize: 9, fontWeight: "700", color: theme.colors.textSecondary }}>
                    {client.category || "HNI"}
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: theme.colors.surfaceStrong, borderWidth: 1, borderColor: theme.colors.border }}>
                  <Text style={{ fontSize: 9, fontWeight: "700", color: theme.colors.textMuted }}>
                    {client.riskProfile || "Moderate"}
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: healthScore >= 75 ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)", borderWidth: 1, borderColor: healthScore >= 75 ? "#10B981" : "#F59E0B" }}>
                  <Text style={{ fontSize: 9, fontWeight: "800", color: healthScore >= 75 ? "#10B981" : "#F59E0B", fontVariant: ["tabular-nums"] }}>
                    H:{healthScore}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, color: theme.colors.textMuted, marginLeft: "auto" }}>
                  Review: {formattedDate}
                </Text>
              </View>
            </View>
          </View>
          {isDue ? (
            <View style={[styles.dueBadge, { borderRadius: 4, backgroundColor: "rgba(239, 68, 68, 0.15)", borderWidth: 1, borderColor: "#EF4444" }]}>
              <Text style={[styles.dueBadgeText, { color: "#EF4444", fontWeight: "800", fontSize: 10 }]}>Due</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    );
  }
);

export const ClientsScreen: React.FC<ClientsScreenProps> = React.memo(({
  theme,
  isDesktop,
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,

  filterMode,
  setFilterMode,
  selectedClientIds,
  selectAllVisibleClients,
  clearSelectedClients,
  setIsBroadcastModalOpen,
  filteredClients,
  selectedClientId,
  setSelectedClientId,
  toggleSelectedClient,
  selectedClient,
  getClientAvatar,
  formatReminderDate,
  isReminderDue,
  contactClient,
  isPro,
  setIsPaywallVisible,
  exportClientPdfReport,
  advisorName,
  openEditModal,
  deleteClient,
  seedDemoClients,
  selectedClientInsights,
  selectedClientMessageDraft,
  selectedClientReportDraft,
  onImportHoldings,
  goals = [],
  onNavigateTab,
  styles,
}) => {
  const [localSearch, setLocalSearch] = React.useState(searchQuery);
  const [isFilterExpanded, setIsFilterExpanded] = React.useState(false);
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [showPortalModal, setShowPortalModal] = React.useState(false);

  React.useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        setSearchQuery(localSearch);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, setSearchQuery]);

  const hasActiveFilters = categoryFilter !== "All" || filterMode !== "All";

  return (
    <>
      {/* Search and Compact Filters Bar */}
      <View style={[styles.panel, { borderRadius: 4, borderWidth: 1, padding: 12, marginBottom: 10 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <TextInput
              value={localSearch}
              onChangeText={setLocalSearch}
              placeholder="Search name, email, phone, city, risk, category..."
              placeholderTextColor="#7f90a8"
              style={[styles.input, { borderRadius: 4, height: 38, marginBottom: 0 }]}
            />
          </View>
          <Pressable
            onPress={() => setIsFilterExpanded(!isFilterExpanded)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 12,
              paddingVertical: 9,
              borderRadius: 4,
              backgroundColor: hasActiveFilters ? theme.colors.brand : theme.colors.surfaceMuted,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Ionicons
              name="filter-outline"
              size={14}
              color={hasActiveFilters ? "#050914" : theme.colors.textPrimary}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: hasActiveFilters ? "#050914" : theme.colors.textPrimary,
              }}
            >
              Filter{hasActiveFilters ? " (Active)" : ""}
            </Text>
            <Ionicons
              name={isFilterExpanded ? "chevron-up" : "chevron-down"}
              size={13}
              color={hasActiveFilters ? "#050914" : theme.colors.textMuted}
            />
          </Pressable>
        </View>

        {/* Active Filters Summary Indicators */}
        {hasActiveFilters && !isFilterExpanded && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <Text style={{ fontSize: 11, color: theme.colors.textMuted }}>Active filters:</Text>
            {categoryFilter !== "All" && (
              <Pressable
                onPress={() => setCategoryFilter("All")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: theme.colors.surfaceStrong,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <Text style={{ fontSize: 11, color: theme.colors.textPrimary }}>Category: {categoryFilter}</Text>
                <Ionicons name="close" size={12} color={theme.colors.textMuted} />
              </Pressable>
            )}
            {filterMode !== "All" && (
              <Pressable
                onPress={() => setFilterMode("All")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: theme.colors.surfaceStrong,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <Text style={{ fontSize: 11, color: theme.colors.textPrimary }}>Focus: {filterMode}</Text>
                <Ionicons name="close" size={12} color={theme.colors.textMuted} />
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                setCategoryFilter("All");
                setFilterMode("All");
              }}
            >
              <Text style={{ fontSize: 11, color: theme.colors.brand, fontWeight: "600", marginLeft: 4 }}>Reset All</Text>
            </Pressable>
          </View>
        )}

        {/* Collapsible Filter Drawer */}
        {isFilterExpanded && (
          <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
            <Text style={[styles.inputLabel, { marginBottom: 6, fontSize: 10, fontWeight: "700", color: theme.colors.textMuted }]}>
              CLIENT CATEGORY
            </Text>
            <View style={[styles.optionRow, { marginBottom: 8 }]}>
              {CATEGORY_FILTER_OPTIONS.map((category) => {
                const active = categoryFilter === category;
                return (
                  <Pressable
                    key={category}
                    style={[styles.optionChip, active ? styles.optionChipActive : null, { borderRadius: 4 }]}
                    onPress={() => setCategoryFilter(category)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        active ? styles.optionChipTextActive : null,
                      ]}
                    >
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.inputLabel, { marginBottom: 6, fontSize: 10, fontWeight: "700", color: theme.colors.textMuted }]}>
              FOCUS MODE
            </Text>
            <View style={styles.optionRow}>
              {(["All", "Due", "High Priority"] as const).map((mode) => {
                const active = filterMode === mode;
                return (
                  <Pressable
                    key={mode}
                    style={[styles.optionChip, active ? styles.optionChipActive : null, { borderRadius: 4 }]}
                    onPress={() => setFilterMode(mode)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        active ? styles.optionChipTextActive : null,
                      ]}
                    >
                      {mode}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* Contextual Action Bar (Only occupies space when clients are selected) */}
      {selectedClientIds.length > 0 && (
        <View
          style={[
            styles.broadcastStrip,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.brand,
              borderWidth: 1,
              borderRadius: 4,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.brand }} />
            <Text style={[styles.broadcastStripText, { color: theme.colors.textPrimary, fontWeight: "700", fontSize: 12 }]}>
              {selectedClientIds.length} client{selectedClientIds.length === 1 ? "" : "s"} selected
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Pressable
              style={[styles.linkButton, { backgroundColor: theme.colors.brand, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }]}
              onPress={() => setIsBroadcastModalOpen(true)}
            >
              <Text style={[styles.linkButtonText, { color: "#050914", fontWeight: "800", fontSize: 11 }]}>
                ✉ Message
              </Text>
            </Pressable>
            <Pressable
              style={[styles.linkButton, { backgroundColor: theme.colors.surfaceMuted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: theme.colors.border }]}
              onPress={selectAllVisibleClients}
            >
              <Text style={[styles.linkButtonText, { color: theme.colors.textPrimary, fontSize: 11 }]}>Select Visible</Text>
            </Pressable>
            <Pressable
              style={[styles.linkButton, { backgroundColor: theme.colors.surfaceMuted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: theme.colors.border }]}
              onPress={clearSelectedClients}
            >
              <Text style={[styles.linkButtonText, { color: theme.colors.textMuted, fontSize: 11 }]}>Clear</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Main Dual Column: Roster & Details */}
      <View style={[styles.dualColumn, isDesktop && { flexDirection: "row", alignItems: "flex-start" }]}>
        {/* Left Column: Client List */}
        <View style={styles.column}>
          <View style={[styles.panel, { borderRadius: 4, borderWidth: 1 }]}>
            <Text style={styles.panelTitle}>Client roster</Text>
            <Text style={[styles.panelSubtitle, { marginBottom: 10 }]}>
              {filteredClients.length} visible client{filteredClients.length === 1 ? "" : "s"} in this view.
            </Text>
            {filteredClients.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No matching clients</Text>
                <Text style={styles.emptyText}>
                  Adjust your filters, add a client, or load the institutional showcase portfolio.
                </Text>
                <Pressable
                  style={[styles.primaryButton, { marginTop: 14, backgroundColor: theme.colors.brand, borderRadius: 4 }]}
                  onPress={() => void seedDemoClients()}
                >
                  <Text style={[styles.primaryButtonText, { color: "#050914", fontWeight: "800" }]}>
                    ⚡ Load Demo Roster & Holdings (Judge Showcase)
                  </Text>
                </Pressable>
              </View>
            ) : (
              filteredClients.map((client) => (
                <ClientRowItem
                  key={client.id}
                  client={client}
                  active={selectedClientId === client.id}
                  selected={selectedClientIds.includes(client.id)}
                  avatarUri={getClientAvatar(client)}
                  isDue={isReminderDue(client.reminderDate)}
                  formattedDate={formatReminderDate(client.reminderDate)}
                  onToggleSelected={toggleSelectedClient}
                  onSelectClient={setSelectedClientId}
                  theme={theme}
                  styles={styles}
                />
              ))
            )}
          </View>
        </View>

        {/* Right Column: Client 360 Workspace */}
        <View style={[styles.column, { flex: isDesktop ? 2 : 1 }]}>
          {selectedClient ? (
            <Client360Workspace
              client={selectedClient}
              goals={goals}
              theme={theme}
              advisorName={advisorName}
              isPro={isPro}
              onNavigateTab={onNavigateTab}
              onExportReport={(cl) => {
                if (!isPro) {
                  setIsPaywallVisible(true);
                  return;
                }
                void exportClientPdfReport({
                  client: cl,
                  advisorName,
                });
              }}
              onOpenImport={() => setShowImportModal(true)}
              onOpenPortal={() => setShowPortalModal(true)}
              onEditClient={openEditModal}
              onDeleteClient={deleteClient}
              onContactClient={contactClient}
            />
          ) : (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Client 360 Workspace</Text>
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Select a client</Text>
                <Text style={styles.emptyText}>
                  Select a client from the roster to open their real-time Client 360 workspace, portfolio holdings, change detection insights, and follow-up plans.
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Client Insights & Report Studio */}
      <View style={styles.dualColumn}>
        <View style={styles.column}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Client insight engine</Text>
            <Text style={styles.panelSubtitle}>
              Quick advisory insights and a personalized message draft for the selected client.
            </Text>
            {selectedClient ? (
              <>
                {selectedClientInsights.map((item) => (
                  <Text key={item} style={styles.historyItem}>
                    {item}
                  </Text>
                ))}
                <Text style={styles.sectionLabel}>Personalised client message</Text>
                <Text style={styles.historyItem}>{selectedClientMessageDraft}</Text>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Select a client first</Text>
                <Text style={styles.emptyText}>
                  The insight engine summarizes the selected client using profile and portfolio data.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.column}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Report studio</Text>
            <Text style={styles.panelSubtitle}>
              PDF-ready report draft content that can be moved into an export workflow.
            </Text>
            {selectedClient ? (
              <Text style={styles.reportBlock}>{selectedClientReportDraft}</Text>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No report target selected</Text>
                <Text style={styles.emptyText}>
                  Select a client first to generate a report draft.
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <StatementImportModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        theme={theme}
        clientName={selectedClient ? selectedClient.name : "Client Portfolio"}
        onImportHoldings={onImportHoldings}
      />

      <ClientPortalModal
        visible={showPortalModal}
        onClose={() => setShowPortalModal(false)}
        theme={theme}
        client={selectedClient}
        advisorName={advisorName}
      />
    </>
  );
});

