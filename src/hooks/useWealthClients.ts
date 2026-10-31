import { useState, useMemo, useCallback } from "react";
import { Platform, Alert } from "react-native";
import {
  Category,
  Channel,
  Client,
  ClientDraft,
  FilterMode,
  Goal,
  emptyDraft,
} from "../types/wealth";
import {
  buildClientFromDraft,
  buildDraftFromClient,
  isReminderDue,
} from "../services/wealthHelpers";

export interface UseWealthClientsOptions {
  initialClients?: Client[];
  marketMessage?: string;
  onRequestConfirm?: (confirm: {
    title: string;
    message: string;
    confirmLabel: string;
    action: () => void;
  }) => void;
  onGoalCreated?: (goal: Goal) => void;
}

export function useWealthClients({
  initialClients = [],
  marketMessage = "Markets remain selective and risk-managed positioning is preferred.",
  onRequestConfirm,
  onGoalCreated,
}: UseWealthClientsOptions = {}) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"add" | "edit">("add");
  const [draft, setDraft] = useState<ClientDraft>(emptyDraft);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | Category>("All");
  const [filterMode, setFilterMode] = useState<FilterMode>("All");

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        !searchQuery.trim() ||
        [client.name, client.email, client.phone, client.city, client.riskProfile]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase());

      const matchesCategory =
        categoryFilter === "All" || client.category === categoryFilter;

      const matchesMode =
        filterMode === "All" ||
        (filterMode === "Due" && isReminderDue(client.reminderDate)) ||
        (filterMode === "High Priority" && client.priority === "High");

      return matchesSearch && matchesCategory && matchesMode;
    });
  }, [categoryFilter, clients, filterMode, searchQuery]);

  const dueClients = useMemo(
    () => clients.filter((client) => isReminderDue(client.reminderDate)),
    [clients]
  );

  const highPriorityClients = useMemo(
    () => clients.filter((client) => client.priority === "High"),
    [clients]
  );

  const openAddModal = useCallback(() => {
    setEditorMode("add");
    setDraft(emptyDraft);
    setIsEditorOpen(true);
  }, []);

  const openEditModal = useCallback((client: Client) => {
    setEditorMode("edit");
    setDraft(buildDraftFromClient(client));
    setSelectedClientId(client.id);
    setIsEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setIsEditorOpen(false);
    setDraft(emptyDraft);
  }, []);

  const updateDraft = useCallback(<K extends keyof ClientDraft>(key: K, value: ClientDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  const submitDraft = useCallback(() => {
    if (!draft.name.trim() || !draft.phone.trim()) {
      Alert.alert("Missing details", "Client name and phone number are required.");
      return;
    }

    if (editorMode === "add") {
      const next = buildClientFromDraft(draft);
      setClients((current) => [next, ...current]);
      setSelectedClientId(next.id);
    } else if (selectedClient) {
      const updated = buildClientFromDraft(draft, selectedClient);
      setClients((current) =>
        current.map((client) => (client.id === updated.id ? updated : client))
      );
      setSelectedClientId(updated.id);
    }

    closeEditor();
  }, [draft, editorMode, selectedClient, closeEditor]);

  const deleteClient = useCallback(
    (client: Client) => {
      const executeDelete = () => {
        setClients((current) => current.filter((item) => item.id !== client.id));
        setSelectedClientIds((current) =>
          current.filter((clientId) => clientId !== client.id)
        );
        if (selectedClientId === client.id) {
          setSelectedClientId(null);
        }
      };

      if (onRequestConfirm) {
        onRequestConfirm({
          title: "Delete client",
          message: `Remove ${client.name} and all linked notes from Asset Array?`,
          confirmLabel: "Delete",
          action: executeDelete,
        });
      } else {
        executeDelete();
      }
    },
    [onRequestConfirm, selectedClientId]
  );

  const toggleSelectedClient = useCallback((clientId: string) => {
    setSelectedClientIds((current) =>
      current.includes(clientId)
        ? current.filter((id) => id !== clientId)
        : [...current, clientId]
    );
  }, []);

  const selectAllVisibleClients = useCallback(() => {
    setSelectedClientIds(filteredClients.map((client) => client.id));
  }, [filteredClients]);

  const clearSelectedClients = useCallback(() => {
    setSelectedClientIds([]);
  }, []);

  const handleCompleteOnboarding = useCallback(
    (newClient: Client, optionalGoal?: Goal) => {
      setClients((prev) => [newClient, ...prev]);
      setSelectedClientId(newClient.id);
      setSelectedClientIds([newClient.id]);
      if (optionalGoal && onGoalCreated) {
        onGoalCreated(optionalGoal);
      }
    },
    [onGoalCreated]
  );

  const exportAllClientsCsv = useCallback(() => {
    if (!clients || clients.length === 0) {
      if (Platform.OS === "web") {
        window.alert("No client records available to export.");
      } else {
        Alert.alert("No Clients", "No client records available to export.");
      }
      return;
    }

    const headers = [
      "Client ID",
      "Name",
      "Category",
      "Risk Profile",
      "Total Portfolio Value",
      "Target Allocation",
      "City",
      "Phone",
      "Email",
      "Preferred Channel",
      "Reminder Date",
      "Priority",
    ];

    const rows = clients.map((c) => {
      const totalVal = (c.portfolio || []).reduce(
        (sum: number, h) => sum + (parseFloat(h.currentValue) || 0),
        0
      );
      return [
        `"${c.id}"`,
        `"${c.name}"`,
        `"${c.category}"`,
        `"${c.riskProfile}"`,
        totalVal,
        `"${c.allocation || ""}"`,
        `"${c.city || ""}"`,
        `"${c.phone || ""}"`,
        `"${c.email || ""}"`,
        `"${c.preferredChannel || "Email"}"`,
        `"${c.reminderDate || ""}"`,
        `"${c.priority || "Normal"}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    if (Platform.OS === "web" && typeof document !== "undefined") {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `AssetArray_Client_Roster_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [clients]);

  const contactClient = useCallback(
    async (client: Client, channel: Channel) => {
      const encodedMessage = encodeURIComponent(
        `Hello ${client.name}, ${marketMessage}`
      );

      const targets: Record<Channel, string> = {
        Phone: `tel:${client.phone}`,
        SMS: `sms:${client.phone}?body=${encodedMessage}`,
        Email: `mailto:${client.email}?subject=Asset Array Market Update&body=${encodedMessage}`,
        WhatsApp: `https://wa.me/${client.phone.replace(/[^\d]/g, "")}?text=${encodedMessage}`,
      };

      const url = targets[channel];
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.open(url, "_blank");
      }
    },
    [marketMessage]
  );

  return {
    clients,
    setClients,
    selectedClientId,
    setSelectedClientId,
    selectedClient,
    selectedClientIds,
    setSelectedClientIds,
    toggleSelectedClient,
    selectAllVisibleClients,
    clearSelectedClients,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    filterMode,
    setFilterMode,
    filteredClients,
    dueClients,
    highPriorityClients,
    isEditorOpen,
    setIsEditorOpen,
    editorMode,
    setEditorMode,
    draft,
    setDraft,
    updateDraft,
    openAddModal,
    openEditModal,
    closeEditor,
    submitDraft,
    deleteClient,
    handleCompleteOnboarding,
    exportAllClientsCsv,
    contactClient,
  };
}
