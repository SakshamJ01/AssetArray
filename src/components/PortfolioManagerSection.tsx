import React from "react";
import { Pressable, Text, View } from "react-native";
import { Client, PortfolioHolding } from "../types/wealth";

export interface PortfolioManagerSectionProps {
  selectedClient: Client | null;
  portfolioStats: {
    holdings: number;
    invested: number;
    current: number;
  };
  currencyDisplay: (value: string) => string;
  openAddHoldingModal: () => void;
  openEditHoldingModal: (holding: PortfolioHolding) => void;
  deleteHolding: (holding: PortfolioHolding) => void;
  dueClients: Client[];
  formatReminderDate: (dateString: string) => string;
  setSelectedClientId: (id: string | null) => void;
  categorySummary: { label: string; value: string }[];
  isDesktop: boolean;
  styles: any;
}

export const PortfolioManagerSection: React.FC<PortfolioManagerSectionProps> = ({
  selectedClient,
  portfolioStats,
  currencyDisplay,
  openAddHoldingModal,
  openEditHoldingModal,
  deleteHolding,
  dueClients,
  formatReminderDate,
  setSelectedClientId,
  categorySummary,
  isDesktop,
  styles,
}) => {
  return (
    <View style={[styles.dualColumn, isDesktop && { flexDirection: "row", alignItems: "flex-start" }]}>
      {/* Left Column: Portfolio Manager */}
      <View style={styles.column}>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Portfolio manager</Text>
          {selectedClient ? (
            <>
              <Text style={styles.panelSubtitle}>
                Add, rename, edit, or remove any holding in {selectedClient.name}'s
                current portfolio.
              </Text>
              <View style={styles.statRow}>
                <View style={styles.miniStat}>
                  <Text style={styles.miniStatValue}>{portfolioStats.holdings}</Text>
                  <Text style={styles.miniStatLabel}>Holdings</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={styles.miniStatValue}>
                    {currencyDisplay(`${portfolioStats.invested}`)}
                  </Text>
                  <Text style={styles.miniStatLabel}>Invested</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={styles.miniStatValue}>
                    {currencyDisplay(`${portfolioStats.current}`)}
                  </Text>
                  <Text style={styles.miniStatLabel}>Current</Text>
                </View>
              </View>
              <Pressable style={styles.goldButton} onPress={openAddHoldingModal}>
                <Text style={styles.goldButtonText}>+ Add Holding</Text>
              </Pressable>
              {selectedClient.portfolio.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No holdings yet</Text>
                  <Text style={styles.emptyText}>
                    Add stocks, funds, or any asset names you want to track and rename later.
                  </Text>
                </View>
              ) : (
                selectedClient.portfolio.map((holding) => (
                  <View key={holding.id} style={styles.holdingCard}>
                    <Text style={styles.holdingTitle}>
                      {holding.assetName}
                      {holding.ticker ? ` (${holding.ticker})` : ""}
                    </Text>
                    <Text style={styles.holdingMeta}>
                      Class: {holding.assetClass ?? "Stocks"}
                    </Text>
                    <Text style={styles.holdingMeta}>
                      Qty: {holding.quantity || "-"} | Target: {holding.targetWeight || "-"}
                    </Text>
                    <Text style={styles.holdingMeta}>
                      Invested: {holding.investedValue ? currencyDisplay(holding.investedValue) : "-"}
                    </Text>
                    <Text style={styles.holdingMeta}>
                      Current: {holding.currentValue ? currencyDisplay(holding.currentValue) : "-"}
                    </Text>
                    {holding.notes ? (
                      <Text style={styles.holdingNote}>{holding.notes}</Text>
                    ) : null}
                    <View style={styles.inlineActions}>
                      <Pressable
                        style={styles.linkButton}
                        onPress={() => openEditHoldingModal(holding)}
                      >
                        <Text style={styles.linkButtonText}>Edit / Rename</Text>
                      </Pressable>
                      <Pressable
                        style={styles.linkButton}
                        onPress={() => deleteHolding(holding)}
                      >
                        <Text style={[styles.linkButtonText, styles.linkDanger]}>
                          Remove
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Select a client first</Text>
              <Text style={styles.emptyText}>
                The portfolio manager opens for the client you are currently viewing.
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Right Column: Follow-up Reminders & Categories */}
      <View style={styles.column}>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Follow-up reminders</Text>
          {dueClients.length === 0 ? (
            <Text style={styles.detailBlock}>
              No client follow-ups are due today.
            </Text>
          ) : (
            dueClients.map((client) => (
              <View key={client.id} style={styles.reminderRow}>
                <View style={styles.clientRowMain}>
                  <Text style={styles.clientName}>{client.name}</Text>
                  <Text style={styles.clientSubMeta}>
                    Due on {formatReminderDate(client.reminderDate)}
                  </Text>
                </View>
                <Pressable
                  style={styles.slimButton}
                  onPress={() => setSelectedClientId(client.id)}
                >
                  <Text style={styles.slimButtonText}>Open</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Client categories</Text>
          <View style={styles.categoryGrid}>
            {categorySummary.map((item) => (
              <View key={item.label} style={styles.categoryCard}>
                <Text style={styles.categoryValue}>{item.value}</Text>
                <Text style={styles.categoryLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};
