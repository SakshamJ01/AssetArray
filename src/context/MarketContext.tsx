import React, { createContext, useContext, ReactNode } from "react";
import { CurrencyCode } from "../services/currency";
import { useMarketData } from "../hooks/useMarketData";
import { Client } from "../types/wealth";

export interface MarketContextValue {
  activeCurrency: CurrencyCode;
  setActiveCurrency: React.Dispatch<React.SetStateAction<CurrencyCode>>;
  cycleCurrency: () => void;
  isMarketRefreshing: boolean;
  refreshLiveMarketPrices: (
    updateClients?: (updater: (prevClients: Client[]) => Client[]) => void
  ) => Promise<void>;
  marketStatus: "LIVE" | "SIMULATED";
}

const MarketContext = createContext<MarketContextValue | null>(null);

export interface MarketProviderProps {
  children?: ReactNode;
  onClientsValuationUpdate?: (updater: (prevClients: Client[]) => Client[]) => void;
}

export const MarketProvider: React.FC<MarketProviderProps> = ({
  children,
  onClientsValuationUpdate,
}) => {
  const marketHook = useMarketData({ onClientsValuationUpdate });

  return (
    <MarketContext.Provider value={marketHook}>
      {children}
    </MarketContext.Provider>
  );
};

export function useMarketContext(): MarketContextValue {
  const ctx = useContext(MarketContext);
  if (!ctx) {
    throw new Error("useMarketContext must be used within a MarketProvider");
  }
  return ctx;
}
