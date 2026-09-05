import { useState, useMemo, useCallback } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Client,
  ClientDraft,
  PortfolioHolding,
  HoldingDraft,
  Category,
  FilterMode,
  emptyDraft,
  emptyHoldingDraft,
  CATEGORY_OPTIONS,
} from "../types/wealth";
import { DEMO_CLIENTS } from "../services/demoData";

const CLIENTS_KEY = "asset_array_clients";

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isReminderDue(value: string): boolean {
  return Boolean(value) && value <= todayISO();
}

export function formatReminderDate(value: string): string {
  if (!value) {
    return "Not scheduled";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function buildClientFromDraft(draft: ClientDraft, existing?: Client): Client {
  return {
    id: existing?.id ?? `${Date.now()}`,
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    email: draft.email.trim(),
    category: draft.category,
    riskProfile: draft.riskProfile.trim(),
    preferredChannel: draft.preferredChannel,
    watchlist: draft.watchlist
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    notes: draft.notes.trim(),
    city: draft.city.trim(),
    allocation: draft.allocation.trim(),
    reminderDate: draft.reminderDate,
    priority: draft.priority,
    lastContact: existing?.lastContact ?? "Not contacted yet",
    updateHistory: existing?.updateHistory ?? [],
    portfolio: existing?.portfolio ?? [],
  };
}

export function buildDraftFromClient(client: Client): ClientDraft {
  return {
    name: client.name,
    phone: client.phone,
    email: client.email,
    category: client.category,
    riskProfile: client.riskProfile,
    preferredChannel: client.preferredChannel,
    watchlist: client.watchlist.join(", "),
    notes: client.notes,
    city: client.city,
    allocation: client.allocation,
    reminderDate: client.reminderDate,
    priority: client.priority,
  };
}

export function buildHoldingFromDraft(
  draft: HoldingDraft,
  existing?: PortfolioHolding
): PortfolioHolding {
  return {
    id: existing?.id ?? `${Date.now()}`,
    assetName: draft.assetName.trim(),
    assetClass: draft.assetClass,
    ticker: draft.ticker.trim(),
    quantity: draft.quantity.trim(),
    investedValue: draft.investedValue.trim(),
    currentValue: draft.currentValue.trim(),
    targetWeight: draft.targetWeight.trim(),
    notes: draft.notes.trim(),
  };
}

export function buildHoldingDraftFromHolding(holding: PortfolioHolding): HoldingDraft {
  return {
    assetName: holding.assetName,
    assetClass: holding.assetClass ?? "Stocks",
    ticker: holding.ticker,
    quantity: holding.quantity,
    investedValue: holding.investedValue,
    currentValue: holding.currentValue,
    targetWeight: holding.targetWeight,
    notes: holding.notes,
  };
}

export async function persistClients(clients: Client[]): Promise<void> {
  await AsyncStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

export function useClients(initialClients: Client[] = []) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | Category>("All");
  const [filterMode, setFilterMode] = useState<FilterMode>("All");

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"add" | "edit">("add");
  const [draft, setDraft] = useState<ClientDraft>(emptyDraft);

  const [isHoldingEditorOpen, setIsHoldingEditorOpen] = useState(false);
  const [holdingEditorMode, setHoldingEditorMode] = useState<"add" | "edit">("add");
  const [holdingDraft, setHoldingDraft] = useState<HoldingDraft>(emptyHoldingDraft);
  const [activeHoldingId, setActiveHoldingId] = useState<string | null>(null);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) ?? null,
    [clients, selectedClientId]
  );

  const dueClients = useMemo(
    () => clients.filter((c) => isReminderDue(c.reminderDate)),
    [clients]
  );

  const highPriorityClients = useMemo(
    () => clients.filter((c) => c.priority === "High"),
    [clients]
  );

  const filteredClients = useMemo(() => {
    const normalized = searchQuery.toLowerCase().trim();
    return clients.filter((client) => {
      const matchCategory =
        categoryFilter === "All" || client.category === categoryFilter;
      const matchMode =
        filterMode === "All"
          ? true
          : filterMode === "Due"
          ? isReminderDue(client.reminderDate)
          : client.priority === "High";

      const matchSearch =
        !normalized ||
        client.name.toLowerCase().includes(normalized) ||
        client.email.toLowerCase().includes(normalized) ||
        client.phone.toLowerCase().includes(normalized) ||
        client.city.toLowerCase().includes(normalized) ||
        client.riskProfile.toLowerCase().includes(normalized);

      return matchCategory && matchMode && matchSearch;
    });
  }, [categoryFilter, clients, filterMode, searchQuery]);

  const categorySummary = useMemo(
    () =>
      CATEGORY_OPTIONS.map((category) => ({
        label: category,
        value: `${clients.filter((client) => client.category === category).length}`,
      })),
    [clients]
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

  const updateDraft = useCallback(
    <K extends keyof ClientDraft>(key: K, value: ClientDraft[K]) => {
      setDraft((current) => ({ ...current, [key]: value }));
    },
    []
  );

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
  }, [closeEditor, draft, editorMode, selectedClient]);

  const deleteClient = useCallback(
    (client: Client) => {
      Alert.alert(
        "Delete client",
        `Remove ${client.name} and all linked notes from Asset Array?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              setClients((current) =>
                current.filter((item) => item.id !== client.id)
              );
              setSelectedClientIds((current) =>
                current.filter((clientId) => clientId !== client.id)
              );
              if (selectedClientId === client.id) {
                setSelectedClientId(null);
              }
            },
          },
        ]
      );
    },
    [selectedClientId]
  );

  const seedDemoClients = useCallback(async (hapticCallback?: () => Promise<void>) => {
    const nonDemo = clients.filter((c) => !c.id.startsWith("demo-client-"));
    const updated = [...(DEMO_CLIENTS as unknown as Client[]), ...nonDemo];
    setClients(updated);
    await persistClients(updated);
    setSelectedClientId(updated[0].id);
    if (hapticCallback) {
      await hapticCallback();
    }
    Alert.alert(
      "Demo Roster Loaded",
      "Loaded 3 institutional client portfolios with holdings for judge evaluation!"
    );
  }, [clients]);

  return {
    clients,
    setClients,
    selectedClientId,
    setSelectedClientId,
    selectedClientIds,
    setSelectedClientIds,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    filterMode,
    setFilterMode,
    filteredClients,
    selectedClient,
    dueClients,
    highPriorityClients,
    categorySummary,
    toggleSelectedClient,
    selectAllVisibleClients,
    clearSelectedClients,
    // Editor modal state
    isEditorOpen,
    setIsEditorOpen,
    editorMode,
    draft,
    openAddModal,
    openEditModal,
    closeEditor,
    updateDraft,
    submitDraft,
    deleteClient,
    seedDemoClients,
    // Holding editor modal state
    isHoldingEditorOpen,
    setIsHoldingEditorOpen,
    holdingEditorMode,
    setHoldingEditorMode,
    holdingDraft,
    setHoldingDraft,
    activeHoldingId,
    setActiveHoldingId,
  };
}
