import React from "react";
import {
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppTheme } from "../theme";
import {
  Category,
  CATEGORY_FILTER_OPTIONS,
  CHANNEL_OPTIONS,
  Client,
  FilterMode,
} from "../types/wealth";
import { AssetAllocationBar } from "../components/AssetAllocationBar";
import { StatementImportModal, ClientPortalModal } from "../components/modals";

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
    styles,
  }) => {
    return (
      <View style={styles.clientRowShell}>
        <Pressable
          style={[styles.selectorPill, selected ? styles.selectorPillActive : null]}
          onPress={() => onToggleSelected(client.id)}
        >
          <Text
            style={[
              styles.selectorPillText,
              selected ? styles.selectorPillTextActive : null,
            ]}
          >
            {selected ? "Selected" : "Select"}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.clientRow, active ? styles.clientRowActive : null]}
          onPress={() => onSelectClient(client.id)}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
            <Image
              source={{ uri: avatarUri }}
              style={styles.clientListAvatar}
            />
            <View style={styles.clientRowMain}>
              <Text style={styles.clientName}>{client.name}</Text>
              <Text style={styles.clientMeta}>
                {client.category} | {client.priority} | {client.preferredChannel}
              </Text>
              <Text style={styles.clientSubMeta}>
                Follow-up: {formattedDate}
              </Text>
            </View>
          </View>
          {isDue ? (
            <View style={styles.dueBadge}>
              <Text style={styles.dueBadgeText}>Due</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    );
  }
);

export const ClientsScreen: React.FC<ClientsScreenProps> = ({
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
  styles,
}) => {
  const [localSearch, setLocalSearch] = React.useState(searchQuery);
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

  return (
    <>
      {/* Search and Filters */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Search and filters</Text>
        <TextInput
          value={localSearch}
          onChangeText={setLocalSearch}
          placeholder="Search by name, email, phone, city, or risk profile"
          placeholderTextColor="#7f90a8"
          style={styles.input}
        />
        <Text style={styles.inputLabel}>Client category</Text>
        <View style={styles.optionRow}>
          {CATEGORY_FILTER_OPTIONS.map((category) => {
            const active = categoryFilter === category;
            return (
              <Pressable
                key={category}
                style={[styles.optionChip, active ? styles.optionChipActive : null]}
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
        <Text style={styles.inputLabel}>Focus mode</Text>
        <View style={styles.optionRow}>
          {(["All", "Due", "High Priority"] as const).map((mode) => {
            const active = filterMode === mode;
            return (
              <Pressable
                key={mode}
                style={[styles.optionChip, active ? styles.optionChipActive : null]}
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

      {/* Broadcast Strip */}
      <View style={styles.broadcastStrip}>
        <Text style={styles.broadcastStripText}>
          {selectedClientIds.length} client{selectedClientIds.length === 1 ? "" : "s"} selected for bulk campaign.
        </Text>
        <View style={styles.inlineActions}>
          <Pressable style={styles.linkButton} onPress={selectAllVisibleClients}>
            <Text style={styles.linkButtonText}>Select Visible</Text>
          </Pressable>
          <Pressable style={styles.linkButton} onPress={clearSelectedClients}>
            <Text style={styles.linkButtonText}>Clear</Text>
          </Pressable>
          <Pressable
            style={styles.linkButton}
            onPress={() => setIsBroadcastModalOpen(true)}
          >
            <Text style={styles.linkButtonText}>Send Bulk Update</Text>
          </Pressable>
        </View>
      </View>

      {/* Main Dual Column: Roster & Details */}
      <View style={[styles.dualColumn, isDesktop && { flexDirection: "row", alignItems: "flex-start" }]}>
        {/* Left Column: Client List */}
        <View style={styles.column}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Client list</Text>
            <Text style={styles.panelSubtitle}>
              {filteredClients.length} visible client{filteredClients.length === 1 ? "" : "s"} in this view.
            </Text>
            {filteredClients.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No matching clients</Text>
                <Text style={styles.emptyText}>
                  Adjust your filters, add a client, or load the institutional showcase portfolio.
                </Text>
                <Pressable
                  style={[styles.primaryButton, { marginTop: 14, backgroundColor: theme.colors.brand }]}
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
                  styles={styles}
                />
              ))
            )}
          </View>
        </View>

        {/* Right Column: Client Details */}
        <View style={styles.column}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Client details</Text>
            {selectedClient ? (
              <>
                <View style={styles.clientDetailHeader}>
                  <Image
                    source={{ uri: getClientAvatar(selectedClient) }}
                    style={styles.clientDetailAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailName}>{selectedClient.name}</Text>
                    <Text style={styles.detailLine}>{selectedClient.phone}</Text>
                    <Text style={styles.detailLine}>
                      {selectedClient.email || "No email saved"}
                    </Text>
                    <Text style={styles.detailLine}>
                      {selectedClient.city || "Location not saved"}
                    </Text>
                  </View>
                </View>

                <View style={styles.tagRow}>
                  {[selectedClient.category, selectedClient.priority, selectedClient.preferredChannel].map(
                    (tag, index) => (
                      <View key={`${tag}-${index}`} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    )
                  )}
                </View>

                <Text style={styles.sectionLabel}>Risk profile</Text>
                <Text style={styles.detailBlock}>
                  {selectedClient.riskProfile || "Not assigned"}
                </Text>

                <Text style={styles.sectionLabel}>Portfolio allocation</Text>
                <AssetAllocationBar allocationString={selectedClient.allocation} theme={theme} />
                <Text style={[styles.detailBlock, { marginTop: 6 }]}>
                  {selectedClient.allocation || "Not saved"}
                </Text>

                <Text style={styles.sectionLabel}>Watchlist</Text>
                <Text style={styles.detailBlock}>
                  {selectedClient.watchlist.join(", ") || "No watchlist saved"}
                </Text>

                <Text style={styles.sectionLabel}>Private notes</Text>
                <Text style={styles.detailBlock}>
                  {selectedClient.notes || "No notes added yet"}
                </Text>

                <Text style={styles.sectionLabel}>Next reminder</Text>
                <Text style={styles.detailBlock}>
                  {formatReminderDate(selectedClient.reminderDate)}
                </Text>

                <Text style={styles.sectionLabel}>Quick contact</Text>
                <View style={styles.optionRow}>
                  {CHANNEL_OPTIONS.map((channel) => (
                    <Pressable
                      key={channel}
                      style={styles.darkChip}
                      onPress={() => void contactClient(selectedClient, channel)}
                    >
                      <Text style={styles.darkChipText}>{channel}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.inlineActions}>
                  <Pressable
                    style={styles.linkButton}
                    onPress={() => setShowImportModal(true)}
                  >
                    <Text style={[styles.linkButtonText, { color: theme.colors.brand }]}>
                      📊 Import Statement
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.linkButton}
                    onPress={() => setShowPortalModal(true)}
                  >
                    <Text style={[styles.linkButtonText, { color: theme.colors.brand }]}>
                      🌐 Client Portal
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.linkButton}
                    onPress={() => {
                      if (!isPro) {
                        setIsPaywallVisible(true);
                        return;
                      }
                      void exportClientPdfReport({
                        client: selectedClient,
                        advisorName,
                      });
                    }}
                  >
                    <Text style={[styles.linkButtonText, { color: theme.colors.warning }]}>
                      📄 Export PDF Report
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.linkButton}
                    onPress={() => openEditModal(selectedClient)}
                  >
                    <Text style={styles.linkButtonText}>Edit Client</Text>
                  </Pressable>
                  <Pressable
                    style={styles.linkButton}
                    onPress={() => deleteClient(selectedClient)}
                  >
                    <Text style={[styles.linkButtonText, styles.linkDanger]}>Delete</Text>
                  </Pressable>
                </View>
                <Text style={styles.sectionLabel}>Recent update history</Text>
                {selectedClient.updateHistory.length === 0 ? (
                  <Text style={styles.detailBlock}>No updates shared yet.</Text>
                ) : (
                  (selectedClient.updateHistory || []).map((item, index) => (
                    <Text key={`history-${selectedClient.id}-${index}`} style={styles.historyItem}>
                      {item}
                    </Text>
                  ))
                )}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Select a client</Text>
                <Text style={styles.emptyText}>
                  Review profile details, reminders, and communication history here.
                </Text>
              </View>
            )}
          </View>
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
};
