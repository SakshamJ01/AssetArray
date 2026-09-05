import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Client } from "../../types/wealth";
import { AppTheme } from "../../theme";

export interface CommandItem {
  id: string;
  category: "ACTION" | "CLIENT" | "NAVIGATION";
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  shortcut?: string;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  visible: boolean;
  clients: Client[];
  theme: AppTheme;
  onClose: () => void;
  onOpenClient: (clientId: string) => void;
  onOpenPortfolios: () => void;
  onOpenTaxHarvesting: () => void;
  onOpenGoals: () => void;
  onOpenAiBrief: () => void;
  onOpenDecisionJournal: () => void;
  onOpenDataQuality: () => void;
  onOpenBroadcast: () => void;
  onOpenAiCopilot?: () => void;
  onOpenAiResearch?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  visible,
  clients,
  theme,
  onClose,
  onOpenClient,
  onOpenPortfolios,
  onOpenTaxHarvesting,
  onOpenGoals,
  onOpenAiBrief,
  onOpenDecisionJournal,
  onOpenDataQuality,
  onOpenBroadcast,
  onOpenAiCopilot,
  onOpenAiResearch,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Web keyboard event listener for Ctrl+K / Cmd+K and Esc
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        // Toggle palette if controlled from root, or open
      }
      if (visible && e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  const allCommands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      {
        id: "cmd_ask_wealth_ai",
        category: "ACTION",
        title: "Ask Wealth AI Copilot",
        subtitle: "Launch conversational fiduciary copilot & portfolio diagnostics",
        icon: "chatbubbles-outline",
        shortcut: "A",
        onSelect: () => {
          onClose();
          onOpenAiCopilot?.();
        },
      },
      {
        id: "cmd_ai_brief",
        category: "ACTION",
        title: "Run Daily AI Advisor Brief",
        subtitle: "Deterministic fiduciary briefing for today's market session",
        icon: "sparkles",
        shortcut: "B",
        onSelect: () => {
          onClose();
          onOpenAiBrief();
        },
      },
      {
        id: "cmd_ai_research",
        category: "ACTION",
        title: "Launch AI Market Research",
        subtitle: "Gemini-powered deep stock, sector & client research",
        icon: "telescope-outline",
        shortcut: "R",
        onSelect: () => {
          onClose();
          onOpenAiResearch?.();
        },
      },
      {
        id: "cmd_decision",
        category: "ACTION",
        title: "Log Advisor Decision in Journal",
        subtitle: "Record auditable rationale and follow-up in fiduciary log",
        icon: "journal-outline",
        shortcut: "D",
        onSelect: () => {
          onClose();
          onOpenDecisionJournal();
        },
      },
      {
        id: "cmd_portfolios",
        category: "NAVIGATION",
        title: "Open Portfolio Command Center",
        subtitle: "Asset allocation, concentration, and performance attribution",
        icon: "pie-chart-outline",
        shortcut: "P",
        onSelect: () => {
          onClose();
          onOpenPortfolios();
        },
      },
      {
        id: "cmd_tax",
        category: "ACTION",
        title: "Tax Loss Harvesting Center",
        subtitle: "Section 70/74 statutory capital gain offset opportunities",
        icon: "receipt-outline",
        shortcut: "T",
        onSelect: () => {
          onClose();
          onOpenTaxHarvesting();
        },
      },
      {
        id: "cmd_goals",
        category: "NAVIGATION",
        title: "Open Milestone & Goal Planner",
        subtitle: "Track retirement, wealth creation, and education targets",
        icon: "flag-outline",
        shortcut: "G",
        onSelect: () => {
          onClose();
          onOpenGoals();
        },
      },
      {
        id: "cmd_dq",
        category: "ACTION",
        title: "Open Data Quality & Hygiene Center",
        subtitle: "Audit portfolio completeness and missing acquisition dates",
        icon: "shield-checkmark-outline",
        onSelect: () => {
          onClose();
          onOpenDataQuality();
        },
      },
      {
        id: "cmd_broadcast",
        category: "ACTION",
        title: "Launch Client Broadcast Campaign",
        subtitle: "Secure multi-channel advisory outreach",
        icon: "megaphone-outline",
        onSelect: () => {
          onClose();
          onOpenBroadcast();
        },
      },
    ];

    // Add Clients to searchable commands
    clients.forEach((c) => {
      list.push({
        id: `cmd_client_${c.id}`,
        category: "CLIENT",
        title: c.name,
        subtitle: `${c.category || "Client"} • ${c.priority || "Standard"} Priority`,
        icon: "person-outline",
        onSelect: () => {
          onClose();
          onOpenClient(c.id);
        },
      });
    });

    return list;
  }, [
    clients,
    onClose,
    onOpenAiBrief,
    onOpenDecisionJournal,
    onOpenPortfolios,
    onOpenTaxHarvesting,
    onOpenGoals,
    onOpenDataQuality,
    onOpenBroadcast,
    onOpenClient,
  ]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return allCommands;
    const q = query.toLowerCase();
    return allCommands.filter(
      (c) => c.title.toLowerCase().includes(q) || (c.subtitle && c.subtitle.toLowerCase().includes(q))
    );
  }, [allCommands, query]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <View
          style={[
            styles.paletteContainer,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          {/* Search Input Bar */}
          <View style={[styles.inputRow, { borderBottomColor: theme.colors.border }]}>
            <Ionicons name="search" size={18} color={theme.colors.brand} />
            <TextInput
              autoFocus
              placeholder="Search commands, clients, portfolios (Ctrl+K)..."
              placeholderTextColor={theme.colors.textMuted}
              value={query}
              onChangeText={setQuery}
              style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            />
            <Pressable onPress={onClose} style={styles.escBadge}>
              <Text style={[styles.escText, { color: theme.colors.textMuted }]}>ESC</Text>
            </Pressable>
          </View>

          {/* Commands List */}
          <ScrollView style={styles.resultsArea} showsVerticalScrollIndicator={false}>
            {filteredCommands.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                  No commands or clients matching "{query}"
                </Text>
              </View>
            ) : (
              filteredCommands.map((cmd, idx) => (
                <Pressable
                  key={cmd.id}
                  onPress={cmd.onSelect}
                  style={({ pressed }) => [
                    styles.commandRow,
                    pressed && { backgroundColor: theme.colors.surfaceMuted },
                  ]}
                >
                  <View style={[styles.iconBox, { backgroundColor: theme.colors.surfaceMuted }]}>
                    <Ionicons name={cmd.icon} size={16} color={theme.colors.brand} />
                  </View>
                  <View style={styles.textWrap}>
                    <Text style={[styles.cmdTitle, { color: theme.colors.textPrimary }]}>
                      {cmd.title}
                    </Text>
                    {cmd.subtitle && (
                      <Text style={[styles.cmdSubtitle, { color: theme.colors.textMuted }]}>
                        {cmd.subtitle}
                      </Text>
                    )}
                  </View>
                  {cmd.shortcut && (
                    <View
                      style={[
                        styles.shortcutPill,
                        { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong },
                      ]}
                    >
                      <Text style={[styles.shortcutText, { color: theme.colors.textMuted }]}>
                        {cmd.shortcut}
                      </Text>
                    </View>
                  )}
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 16,
  },
  paletteContainer: {
    width: "100%",
    maxWidth: 580,
    maxHeight: 460,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  escBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  escText: {
    fontSize: 9,
    fontWeight: "800",
  },
  resultsArea: {
    paddingVertical: 6,
  },
  emptyWrap: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  commandRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  textWrap: {
    flex: 1,
  },
  cmdTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  cmdSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  shortcutPill: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  shortcutText: {
    fontSize: 10,
    fontWeight: "800",
  },
});
