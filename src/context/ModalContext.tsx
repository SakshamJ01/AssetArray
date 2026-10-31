import React, { createContext, useContext, ReactNode } from "react";
import { AboutSheet, HoldingDraft } from "../types/wealth";
import { useModalManager, PendingConfirm } from "../hooks/useModalManager";

export interface ModalContextValue {
  isSyncModalOpen: boolean;
  setIsSyncModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBroadcastModalOpen: boolean;
  setIsBroadcastModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isPaywallVisible: boolean;
  setIsPaywallVisible: React.Dispatch<React.SetStateAction<boolean>>;
  isOnboardingWizardOpen: boolean;
  setIsOnboardingWizardOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAiCopilotOpen: boolean;
  setIsAiCopilotOpen: React.Dispatch<React.SetStateAction<boolean>>;
  aboutSheet: AboutSheet | null;
  setAboutSheet: React.Dispatch<React.SetStateAction<AboutSheet | null>>;
  isPortfolioModalOpen: boolean;
  setIsPortfolioModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  portfolioMode: "add" | "edit";
  setPortfolioMode: React.Dispatch<React.SetStateAction<"add" | "edit">>;
  holdingDraft: HoldingDraft;
  setHoldingDraft: React.Dispatch<React.SetStateAction<HoldingDraft>>;
  editingHoldingId: string | null;
  setEditingHoldingId: React.Dispatch<React.SetStateAction<string | null>>;
  portfolioActiveModal: string | null;
  setPortfolioActiveModal: React.Dispatch<React.SetStateAction<string | null>>;
  pendingConfirm: PendingConfirm | null;
  setPendingConfirm: React.Dispatch<React.SetStateAction<PendingConfirm | null>>;
  requestConfirm: (confirm: PendingConfirm) => void;
  closeConfirm: () => void;
  openHoldingModal: (mode?: "add" | "edit", draft?: HoldingDraft, id?: string) => void;
  closeHoldingModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export interface ModalProviderProps {
  children?: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const modalHook = useModalManager();

  return (
    <ModalContext.Provider value={modalHook}>
      {children}
    </ModalContext.Provider>
  );
};

export function useModalContext(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error("useModalContext must be used within a ModalProvider");
  }
  return ctx;
}
