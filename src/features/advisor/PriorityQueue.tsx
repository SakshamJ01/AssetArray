import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AdvisorAction, AdvisorActionStatus } from "../../types/advisor";
import { AppTheme } from "../../theme";
import { PriorityActionCard } from "./PriorityActionCard";

export type QueueFilterTab = "ALL" | "URGENT" | "TODAY" | "UPCOMING" | "COMPLETED";

export interface PriorityQueueProps {
  actions: AdvisorAction[];
  theme: AppTheme;
  onExecuteDeepLink: (action: AdvisorAction) => void;
  onStatusChange: (action: AdvisorAction, status: AdvisorActionStatus) => void;
  onSnooze: (action: AdvisorAction) => void;
  onOpenClient360: (clientId: string) => void;
}

export const PriorityQueue: React.FC<PriorityQueueProps> = ({
  actions,
  theme,
  onExecuteDeepLink,
  onStatusChange,
  onSnooze,
  onOpenClient360,
}) => {
  const [activeFilter, setActiveFilter] = useState<QueueFilterTab>("TODAY");
  const [searchQuery, setSearchQuery] = useState("");
  const [engineFilter, setEngineFilter] = useState<string>("ALL");

  const todayStr = new Date().toISOString().split("T")[0];

  const counts = useMemo(() => {
    const urgent = actions.filter(
      (a) =>
        (a.severity === "critical" || a.priority === "URGENT") &&
        a.status !== "DONE" &&
        a.status !== "CANCELLED"
    ).length;

    const today = actions.filter(
      (a) =>
        (a.dueAt === todayStr || !a.dueAt || a.priority === "URGENT" || a.priority === "HIGH") &&
        a.status !== "DONE" &&
        a.status !== "CANCELLED"
    ).length;

    const upcoming = actions.filter(
      (a) => a.dueAt && a.dueAt > todayStr && a.status !== "DONE" && a.status !== "CANCELLED"
    ).length;

    const completed = actions.filter((a) => a.status === "DONE").length;

    const all = actions.filter((a) => a.status !== "DONE" && a.status !== "CANCELLED").length;

    return { all, urgent, today, upcoming, completed };
  }, [actions, todayStr]);

  const filteredActions = useMemo(() => {
    return actions.filter((a) => {
      // 1. Tab filter
      if (activeFilter === "URGENT") {
        if (
          (a.severity !== "critical" && a.priority !== "URGENT") ||
          a.status === "DONE" ||
          a.status === "CANCELLED"
        ) {
          return false;
        }
      } else if (activeFilter === "TODAY") {
        if (a.status === "DONE" || a.status === "CANCELLED") return false;
        const isToday =
          a.dueAt === todayStr || !a.dueAt || a.priority === "URGENT" || a.priority === "HIGH";
        if (!isToday) return false;
      } else if (activeFilter === "UPCOMING") {
        if (a.status === "DONE" || a.status === "CANCELLED") return false;
        if (!a.dueAt || a.dueAt <= todayStr) return false;
      } else if (activeFilter === "COMPLETED") {
        if (a.status !== "DONE") return false;
      } else if (activeFilter === "ALL") {
        if (a.status === "DONE" || a.status === "CANCELLED") return false;
      }

      // 2. Engine filter
      if (engineFilter !== "ALL" && a.sourceEngine !== engineFilter) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesClient = a.clientName.toLowerCase().includes(q);
        const matchesTitle = a.title.toLowerCase().includes(q);
        const matchesDesc = (a.description || "").toLowerCase().includes(q);
        if (!matchesClient && !matchesTitle && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [actions, activeFilter, engineFilter, searchQuery, todayStr]);

  const tabs: { key: QueueFilterTab; label: string; count: number }[] = [
    { key: "TODAY", label: "Today", count: counts.today },
    { key: "URGENT", label: "Urgent", count: counts.urgent },
    { key: "ALL", label: "All Active", count: counts.all },
    { key: "UPCOMING", label: "Upcoming", count: counts.upcoming },
    { key: "COMPLETED", label: "Completed", count: counts.completed },
  ];

  return (
    <View style={styles.container}>
      {/* Search & Engine Filters Bar */}
      <View style={styles.searchBarRow}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Ionicons name="search-outline" size={14} color={theme.colors.textMuted} />
          <TextInput
            placeholder="Search actions by client, issue, or metric..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={14} color={theme.colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Engine Dropdown Pills */}
        <View style={styles.engineFilters}>
          {["ALL", "risk", "tax", "goals", "reminders"].map((eng) => (
            <Pressable
              key={eng}
              onPress={() => setEngineFilter(eng)}
              style={[
                styles.enginePill,
                {
                  backgroundColor:
                    engineFilter === eng ? theme.colors.brand : theme.colors.surfaceMuted,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.enginePillText,
                  {
                    color: engineFilter === eng ? "#000000" : theme.colors.textSecondary,
                    fontWeight: engineFilter === eng ? "800" : "600",
                  },
                ]}
              >
                {eng.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Horizon Tabs Row */}
      <View style={[styles.tabsRow, { borderBottomColor: theme.colors.border }]}>
        {tabs.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveFilter(tab.key)}
              style={[
                styles.tabButton,
                isActive && [
                  styles.tabButtonActive,
                  { borderBottomColor: theme.colors.brand },
                ],
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isActive ? theme.colors.textPrimary : theme.colors.textMuted,
                    fontWeight: isActive ? "800" : "600",
                  },
                ]}
              >
                {tab.label}
              </Text>
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: isActive
                      ? theme.colors.brand
                      : theme.colors.surfaceMuted,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    { color: isActive ? "#000000" : theme.colors.textMuted },
                  ]}
                >
                  {tab.count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Action Cards List */}
      <View style={styles.listArea}>
        {filteredActions.length === 0 ? (
          <View
            style={[
              styles.emptyStateBox,
              { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
            ]}
          >
            <Ionicons name="shield-checkmark" size={32} color={theme.colors.accent} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
              All Mandates Within Tolerance
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
              {activeFilter === "URGENT"
                ? "No critical portfolio or policy breaches currently pending review."
                : "No active actions matching your current filters."}
            </Text>
          </View>
        ) : (
          filteredActions.map((action) => (
            <PriorityActionCard
              key={action.id}
              action={action}
              theme={theme}
              onExecuteDeepLink={onExecuteDeepLink}
              onStatusChange={onStatusChange}
              onSnooze={onSnooze}
              onOpenClient360={onOpenClient360}
            />
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  searchBarRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    minWidth: 200,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    padding: 0,
  },
  engineFilters: {
    flexDirection: "row",
    gap: 4,
  },
  enginePill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  enginePillText: {
    fontSize: 9,
    letterSpacing: 0.4,
  },
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginBottom: 14,
    gap: 4,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 12,
  },
  countBadge: {
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  countText: {
    fontSize: 10,
    fontWeight: "800",
  },
  listArea: {
    marginTop: 4,
  },
  emptyStateBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: "center",
    maxWidth: 320,
  },
});
