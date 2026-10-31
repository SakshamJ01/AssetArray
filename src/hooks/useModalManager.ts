import { useState, useCallback } from "react";
import { AboutSheet, HoldingDraft, emptyHoldingDraft } from "../types/wealth";

export interface PendingConfirm {
  title: string;
  message: string;
  confirmLabel: string;
  action: () => void;
}

export function useModalManager() {
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);
  const [isOnboardingWizardOpen, setIsOnboardingWizardOpen] = useState(false);
  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState(false);
  const [aboutSheet, setAboutSheet] = useState<AboutSheet | null>(null);

  // Portfolio modal
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [portfolioMode, setPortfolioMode] = useState<"add" | "edit">("add");
  const [holdingDraft, setHoldingDraft] = useState<HoldingDraft>(emptyHoldingDraft);
  const [editingHoldingId, setEditingHoldingId] = useState<string | null>(null);

  // Submodals in portfolios screen
  const [portfolioActiveModal, setPortfolioActiveModal] = useState<string | null>(null);

  // In-app confirm modal
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

  const requestConfirm = useCallback((confirm: PendingConfirm) => {
    setPendingConfirm(confirm);
  }, []);

  const closeConfirm = useCallback(() => {
    setPendingConfirm(null);
  }, []);

  const openHoldingModal = useCallback((mode: "add" | "edit" = "add", draft?: HoldingDraft, id?: string) => {
    setPortfolioMode(mode);
    setHoldingDraft(draft || emptyHoldingDraft);
    setEditingHoldingId(id || null);
    setIsPortfolioModalOpen(true);
  }, []);

  const closeHoldingModal = useCallback(() => {
    setIsPortfolioModalOpen(false);
    setHoldingDraft(emptyHoldingDraft);
    setEditingHoldingId(null);
  }, []);

  return {
    isSyncModalOpen,
    setIsSyncModalOpen,
    isBroadcastModalOpen,
    setIsBroadcastModalOpen,
    isPaywallVisible,
    setIsPaywallVisible,
    isOnboardingWizardOpen,
    setIsOnboardingWizardOpen,
    isAiCopilotOpen,
    setIsAiCopilotOpen,
    aboutSheet,
    setAboutSheet,
    isPortfolioModalOpen,
    setIsPortfolioModalOpen,
    portfolioMode,
    setPortfolioMode,
    holdingDraft,
    setHoldingDraft,
    editingHoldingId,
    setEditingHoldingId,
    portfolioActiveModal,
    setPortfolioActiveModal,
    pendingConfirm,
    setPendingConfirm,
    requestConfirm,
    closeConfirm,
    openHoldingModal,
    closeHoldingModal,
  };
}
