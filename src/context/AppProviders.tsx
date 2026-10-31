import React, { ReactNode } from "react";
import { AuthSecurityProvider } from "./AuthSecurityContext";
import { MarketProvider } from "./MarketContext";
import { WealthProvider } from "./WealthContext";
import { ModalProvider } from "./ModalContext";
import { AuthSession, Client, Goal } from "../types/wealth";

export interface AppProvidersProps {
  children?: ReactNode;
  initialSession?: AuthSession | null;
  initialClients?: Client[];
  initialGoals?: Goal[];
  onRequestConfirm?: (confirm: {
    title: string;
    message: string;
    confirmLabel: string;
    action: () => void;
  }) => void;
  onClientsValuationUpdate?: (updater: (prevClients: Client[]) => Client[]) => void;
}

export const AppProviders: React.FC<AppProvidersProps> = ({
  children,
  initialSession,
  initialClients,
  initialGoals,
  onRequestConfirm,
  onClientsValuationUpdate,
}) => {
  return (
    <AuthSecurityProvider initialSession={initialSession}>
      <MarketProvider onClientsValuationUpdate={onClientsValuationUpdate}>
        <WealthProvider
          initialClients={initialClients}
          initialGoals={initialGoals}
          onRequestConfirm={onRequestConfirm}
        >
          <ModalProvider>{children}</ModalProvider>
        </WealthProvider>
      </MarketProvider>
    </AuthSecurityProvider>
  );
};
