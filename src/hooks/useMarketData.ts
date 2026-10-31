import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import {
  CurrencyCode,
  loadCurrencyPreference,
  saveCurrencyPreference,
} from "../services/currency";
import { realTimeMarket } from "../services/realTimeMarket";
import { marketHealthMonitor } from "../services/market";
import { fetchLiveMarketQuotes, getQuoteForSymbol } from "../services/marketData";
import { Client } from "../types/wealth";

export interface UseMarketDataOptions {
  onClientsValuationUpdate?: (updater: (prevClients: Client[]) => Client[]) => void;
}

export function useMarketData({ onClientsValuationUpdate }: UseMarketDataOptions = {}) {
  const [activeCurrency, setActiveCurrency] = useState<CurrencyCode>("INR");
  const [isMarketRefreshing, setIsMarketRefreshing] = useState(false);

  useEffect(() => {
    void loadCurrencyPreference().then((c) => setActiveCurrency(c));
  }, []);

  const cycleCurrency = useCallback(() => {
    const list: CurrencyCode[] = ["INR", "USD", "EUR", "GBP", "AED", "SGD"];
    const nextIdx = (list.indexOf(activeCurrency) + 1) % list.length;
    const nextCurr = list[nextIdx];
    setActiveCurrency(nextCurr);
    void saveCurrencyPreference(nextCurr);
  }, [activeCurrency]);

  // Throttled real-time continuous portfolio sync
  useEffect(() => {
    if (marketHealthMonitor.getOverallHealth().activeProviders === 0) return;
    if (!onClientsValuationUpdate) return;

    let lastSyncTime = 0;
    const THROTTLE_MS = 5000;

    const unsubscribe = realTimeMarket.subscribe((instruments) => {
      const now = Date.now();
      if (now - lastSyncTime < THROTTLE_MS) return;
      if (typeof document !== "undefined" && document.hidden) return;
      const tickKeys = new Set(Object.keys(instruments || {}).map((k) => k.toUpperCase().trim()));
      if (tickKeys.size === 0) return;
      lastSyncTime = now;

      onClientsValuationUpdate((prevClients) => {
        if (!prevClients || prevClients.length === 0) return prevClients;
        let anyHoldingChanged = false;

        const nextClients = prevClients.map((client) => {
          if (!client.portfolio || client.portfolio.length === 0) return client;
          let clientChanged = false;

          const nextPortfolio = client.portfolio.map((holding) => {
            const symbolKey = (holding.ticker || holding.assetName).toUpperCase().trim();
            if (!tickKeys.has(symbolKey) && !realTimeMarket.getInstrument(symbolKey)) return holding;
            const inst = instruments[symbolKey] || realTimeMarket.getInstrument(symbolKey);
            if (inst) {
              const qty = Number(holding.quantity) || 1;
              const nextVal = (inst.price * qty).toFixed(2);
              if (nextVal !== holding.currentValue) {
                clientChanged = true;
                anyHoldingChanged = true;
                return { ...holding, currentValue: nextVal };
              }
            }
            return holding;
          });

          return clientChanged ? { ...client, portfolio: nextPortfolio } : client;
        });

        return anyHoldingChanged ? nextClients : prevClients;
      });
    });

    return () => unsubscribe();
  }, [onClientsValuationUpdate]);

  const refreshLiveMarketPrices = useCallback(
    async (updateClients?: (updater: (prevClients: Client[]) => Client[]) => void) => {
      const clientUpdater = updateClients || onClientsValuationUpdate;
      if (marketHealthMonitor.getOverallHealth().activeProviders === 0) {
        Alert.alert(
          "Live market data not configured",
          "Add a FINNHUB_API_KEY to pull real-time quotes. Without it, prices are not fetched and stored portfolio values stay unchanged."
        );
        return;
      }
      try {
        setIsMarketRefreshing(true);
        const quotes = await fetchLiveMarketQuotes();

        if (clientUpdater) {
          clientUpdater((prevClients) =>
            prevClients.map((client) => {
              if (!client.portfolio || client.portfolio.length === 0) return client;
              const updatedPortfolio = client.portfolio.map((holding) => {
                const symbolKey = (holding.ticker || holding.assetName).toUpperCase().trim();
                const quote = quotes[symbolKey] || getQuoteForSymbol(symbolKey);
                if (quote) {
                  const qty = Number(holding.quantity) || 1;
                  return {
                    ...holding,
                    currentValue: (quote.price * qty).toFixed(2),
                  };
                }
                return holding;
              });
              return { ...client, portfolio: updatedPortfolio };
            })
          );
        }
      } catch (e: any) {
        console.warn("Market refresh failed:", e);
      } finally {
        setIsMarketRefreshing(false);
      }
    },
    [onClientsValuationUpdate]
  );

  const marketStatus: "LIVE" | "SIMULATED" =
    marketHealthMonitor.getOverallHealth().activeProviders > 0 ? "LIVE" : "SIMULATED";

  return {
    activeCurrency,
    setActiveCurrency,
    cycleCurrency,
    isMarketRefreshing,
    refreshLiveMarketPrices,
    marketStatus,
  };
}
