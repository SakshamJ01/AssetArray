import React from "react";
import { Alert, Modal } from "react-native";
import { AppTheme } from "../../theme";
import {
  AboutSheet,
  AuthSession,
  BroadcastChannel,
  Client,
  ClientDraft,
  CloudSettings,
  HoldingDraft,
} from "../../types/wealth";
import { BillingPackage } from "../../platform/billing";
import { purchasePackage, restorePurchases } from "../../services/revenueCat";
import { triggerSuccessHaptic } from "../../services/haptics";
import { ClientEditorModal } from "./ClientEditorModal";
import { HoldingEditorModal } from "./HoldingEditorModal";
import { ConfirmModal } from "./ConfirmModal";
import { SyncConfigModal } from "./SyncConfigModal";
import { BroadcastModal } from "./BroadcastModal";
import { AboutLegalModal } from "./AboutLegalModal";
import { PaywallScreen } from "../../screens/PaywallScreen";

export interface PendingConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  action: () => void;
}

export interface AppModalsHostProps {
  theme: AppTheme;
  isDesktop: boolean;
  insetsBottom: number;

  // Client Editor Modal
  isEditorOpen: boolean;
  editorMode: "add" | "edit";
  draft: ClientDraft;
  updateDraft: (field: keyof ClientDraft, value: any) => void;
  closeEditor: () => void;
  submitDraft: () => void;

  // Holding Editor Modal
  isPortfolioModalOpen: boolean;
  portfolioMode: "add" | "edit";
  holdingDraft: HoldingDraft;
  updateHoldingDraft: (field: keyof HoldingDraft, value: any) => void;
  closeHoldingModal: () => void;
  saveHolding: () => void;

  // Confirm Modal
  pendingConfirm: PendingConfirmState | null;
  setPendingConfirm: React.Dispatch<React.SetStateAction<PendingConfirmState | null>>;

  // Sync Config Modal
  isSyncModalOpen: boolean;
  setIsSyncModalOpen: (open: boolean) => void;
  cloudSettings: CloudSettings;
  setCloudSettings: React.Dispatch<React.SetStateAction<CloudSettings>>;
  defaultBackendEndpoint: string;
  authState: string;
  authSession: AuthSession | null;
  logoutFromBackend: () => Promise<void>;
  saveCloudSettingsAction: () => Promise<void>;

  // Broadcast Modal
  isBroadcastModalOpen: boolean;
  setIsBroadcastModalOpen: (open: boolean) => void;
  runBroadcastCampaign: () => Promise<void>;
  broadcastChannel: BroadcastChannel;
  setBroadcastChannel: (channel: BroadcastChannel) => void;
  broadcastMessage: string;
  setBroadcastMessage: (msg: string) => void;
  clients: Client[];
  selectedClientIds: string[];
  setSelectedClientIds: (ids: string[]) => void;
  toggleSelectedClient: (id: string) => void;
  broadcastPreview: { eligible: Client[]; skipped: Array<{ name: string; reason: string }> };
  broadcastTargets: Client[];
  resolveBroadcastContact: (client: Client, channel: BroadcastChannel) => string;

  // About Legal Modal
  aboutSheet: AboutSheet | null;
  setAboutSheet: (sheet: AboutSheet | null) => void;

  // Paywall Modal
  isPaywallVisible: boolean;
  setIsPaywallVisible: (visible: boolean) => void;
  revenueCatPackages: BillingPackage[];
  isPaywallLoading: boolean;
  setIsPaywallLoading: (loading: boolean) => void;
  setIsPro: (pro: boolean) => void;
}

export const AppModalsHost: React.FC<AppModalsHostProps> = ({
  theme,
  isDesktop,
  insetsBottom,
  isEditorOpen,
  editorMode,
  draft,
  updateDraft,
  closeEditor,
  submitDraft,
  isPortfolioModalOpen,
  portfolioMode,
  holdingDraft,
  updateHoldingDraft,
  closeHoldingModal,
  saveHolding,
  pendingConfirm,
  setPendingConfirm,
  isSyncModalOpen,
  setIsSyncModalOpen,
  cloudSettings,
  setCloudSettings,
  defaultBackendEndpoint,
  authState,
  authSession,
  logoutFromBackend,
  saveCloudSettingsAction,
  isBroadcastModalOpen,
  setIsBroadcastModalOpen,
  runBroadcastCampaign,
  broadcastChannel,
  setBroadcastChannel,
  broadcastMessage,
  setBroadcastMessage,
  clients,
  selectedClientIds,
  setSelectedClientIds,
  toggleSelectedClient,
  broadcastPreview,
  broadcastTargets,
  resolveBroadcastContact,
  aboutSheet,
  setAboutSheet,
  isPaywallVisible,
  setIsPaywallVisible,
  revenueCatPackages,
  isPaywallLoading,
  setIsPaywallLoading,
  setIsPro,
}) => {
  return (
    <>
      <ClientEditorModal
        visible={isEditorOpen}
        isDesktop={isDesktop}
        editorMode={editorMode}
        draft={draft}
        updateDraft={updateDraft}
        onClose={closeEditor}
        onSubmit={submitDraft}
        theme={theme}
      />

      <HoldingEditorModal
        visible={isPortfolioModalOpen}
        isDesktop={isDesktop}
        portfolioMode={portfolioMode}
        holdingDraft={holdingDraft}
        updateHoldingDraft={updateHoldingDraft}
        onClose={closeHoldingModal}
        onSave={saveHolding}
        theme={theme}
      />

      <ConfirmModal
        visible={pendingConfirm !== null}
        isDesktop={isDesktop}
        title={pendingConfirm?.title ?? ""}
        message={pendingConfirm?.message ?? ""}
        confirmLabel={pendingConfirm?.confirmLabel ?? "Delete"}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => {
          pendingConfirm?.action();
          setPendingConfirm(null);
        }}
        theme={theme}
      />

      <SyncConfigModal
        visible={isSyncModalOpen}
        isDesktop={isDesktop}
        cloudSettings={cloudSettings}
        setCloudSettings={setCloudSettings}
        defaultBackendEndpoint={defaultBackendEndpoint}
        authState={authState}
        authSession={authSession}
        onLogout={() => void logoutFromBackend()}
        onClose={() => setIsSyncModalOpen(false)}
        onSave={() => void saveCloudSettingsAction()}
        theme={theme}
      />

      <BroadcastModal
        visible={isBroadcastModalOpen}
        isDesktop={isDesktop}
        insetsBottom={insetsBottom}
        onClose={() => setIsBroadcastModalOpen(false)}
        onSend={() => void runBroadcastCampaign()}
        broadcastChannel={broadcastChannel}
        setBroadcastChannel={setBroadcastChannel}
        broadcastMessage={broadcastMessage}
        setBroadcastMessage={setBroadcastMessage}
        clients={clients}
        selectedClientIds={selectedClientIds}
        setSelectedClientIds={setSelectedClientIds}
        toggleSelectedClient={toggleSelectedClient}
        broadcastPreview={broadcastPreview}
        broadcastTargets={broadcastTargets}
        resolveBroadcastContact={resolveBroadcastContact}
        authSession={authSession}
        cloudSettings={cloudSettings}
        theme={theme}
      />

      <AboutLegalModal
        visible={Boolean(aboutSheet)}
        isDesktop={isDesktop}
        aboutSheet={aboutSheet}
        onClose={() => setAboutSheet(null)}
        theme={theme}
      />

      {isPaywallVisible && (
        <Modal
          visible={isPaywallVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsPaywallVisible(false)}
        >
          <PaywallScreen
            theme={theme}
            packages={revenueCatPackages}
            isLoading={isPaywallLoading}
            onPurchase={async (pkg) => {
              setIsPaywallLoading(true);
              const success = await purchasePackage(pkg);
              if (success) {
                setIsPro(true);
                setIsPaywallVisible(false);
                await triggerSuccessHaptic();
                Alert.alert("Welcome to Pro", "Thank you for subscribing to Pro Advisor!");
              }
              setIsPaywallLoading(false);
            }}
            onRestore={async () => {
              setIsPaywallLoading(true);
              const success = await restorePurchases();
              if (success) {
                setIsPro(true);
                setIsPaywallVisible(false);
                await triggerSuccessHaptic();
                Alert.alert("Purchases Restored", "Your Pro Advisor subscription has been restored.");
              } else {
                Alert.alert("Restore Failed", "No active subscription found.");
              }
              setIsPaywallLoading(false);
            }}
            onClose={() => setIsPaywallVisible(false)}
          />
        </Modal>
      )}
    </>
  );
};
