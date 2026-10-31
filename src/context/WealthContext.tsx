import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  Category,
  Channel,
  Client,
  ClientDraft,
  FilterMode,
  Goal,
} from "../types/wealth";
import { useWealthClients } from "../hooks/useWealthClients";

export interface WealthContextValue {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  selectedClientId: string | null;
  setSelectedClientId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedClient: Client | null;
  selectedClientIds: string[];
  setSelectedClientIds: React.Dispatch<React.SetStateAction<string[]>>;
  toggleSelectedClient: (id: string) => void;
  selectAllVisibleClients: () => void;
  clearSelectedClients: () => void;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  categoryFilter: "All" | Category;
  setCategoryFilter: React.Dispatch<React.SetStateAction<"All" | Category>>;
  filterMode: FilterMode;
  setFilterMode: React.Dispatch<React.SetStateAction<FilterMode>>;
  filteredClients: Client[];
  dueClients: Client[];
  highPriorityClients: Client[];
  isEditorOpen: boolean;
  setIsEditorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editorMode: "add" | "edit";
  setEditorMode: React.Dispatch<React.SetStateAction<"add" | "edit">>;
  draft: ClientDraft;
  setDraft: React.Dispatch<React.SetStateAction<ClientDraft>>;
  updateDraft: <K extends keyof ClientDraft>(key: K, value: ClientDraft[K]) => void;
  openAddModal: () => void;
  openEditModal: (client: Client) => void;
  closeEditor: () => void;
  submitDraft: () => void;
  deleteClient: (client: Client) => void;
  handleCompleteOnboarding: (newClient: Client, optionalGoal?: Goal) => void;
  exportAllClientsCsv: () => void;
  contactClient: (client: Client, channel: Channel) => Promise<void>;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
}

const WealthContext = createContext<WealthContextValue | null>(null);

export interface WealthProviderProps {
  children?: ReactNode;
  initialClients?: Client[];
  initialGoals?: Goal[];
  onRequestConfirm?: (confirm: {
    title: string;
    message: string;
    confirmLabel: string;
    action: () => void;
  }) => void;
}

export const WealthProvider: React.FC<WealthProviderProps> = ({
  children,
  initialClients = [],
  initialGoals = [],
  onRequestConfirm,
}) => {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);

  const clientHook = useWealthClients({
    initialClients,
    onRequestConfirm,
    onGoalCreated: (goal) => setGoals((prev) => [goal, ...prev]),
  });

  const value: WealthContextValue = {
    ...clientHook,
    goals,
    setGoals,
  };

  return (
    <WealthContext.Provider value={value}>
      {children}
    </WealthContext.Provider>
  );
};

export function useWealthContext(): WealthContextValue {
  const ctx = useContext(WealthContext);
  if (!ctx) {
    throw new Error("useWealthContext must be used within a WealthProvider");
  }
  return ctx;
}
