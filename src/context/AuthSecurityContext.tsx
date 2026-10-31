import React, { createContext, useContext, useState, ReactNode } from "react";
import { AuthSession } from "../types/wealth";
import { useInactivityLock } from "../hooks/useInactivityLock";

export interface AuthSecurityContextValue {
  authSession: AuthSession | null;
  setAuthSession: React.Dispatch<React.SetStateAction<AuthSession | null>>;
  isUnlocked: boolean;
  setIsUnlocked: React.Dispatch<React.SetStateAction<boolean>>;
  lockedDueToInactivity: boolean;
  setLockedDueToInactivity: React.Dispatch<React.SetStateAction<boolean>>;
  storedPin: string | null;
  setStoredPin: React.Dispatch<React.SetStateAction<string | null>>;
  pinInput: string;
  setPinInput: React.Dispatch<React.SetStateAction<string>>;
  pinSetup: string;
  setPinSetup: React.Dispatch<React.SetStateAction<string>>;
  isFirstLoginPinSetupOpen: boolean;
  setIsFirstLoginPinSetupOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleSaveNewDeskPin: (newPin: string) => Promise<void>;
  setupPinAction: () => Promise<void>;
  unlockAction: () => void;
  resetLock: () => void;
}

const AuthSecurityContext = createContext<AuthSecurityContextValue | null>(null);

export interface AuthSecurityProviderProps {
  children?: ReactNode;
  initialSession?: AuthSession | null;
}

export const AuthSecurityProvider: React.FC<AuthSecurityProviderProps> = ({
  children,
  initialSession = null,
}) => {
  const [authSession, setAuthSession] = useState<AuthSession | null>(initialSession);

  const lockHook = useInactivityLock({
    authSession,
  });

  const value: AuthSecurityContextValue = {
    authSession,
    setAuthSession,
    ...lockHook,
  };

  return (
    <AuthSecurityContext.Provider value={value}>
      {children}
    </AuthSecurityContext.Provider>
  );
};

export function useAuthSecurityContext(): AuthSecurityContextValue {
  const ctx = useContext(AuthSecurityContext);
  if (!ctx) {
    throw new Error("useAuthSecurityContext must be used within an AuthSecurityProvider");
  }
  return ctx;
}
