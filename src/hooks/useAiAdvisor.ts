import { useState, useCallback } from "react";
import { Alert } from "react-native";
import {
  AiProviderState,
  AiResearchResult,
  requestAiResearch,
} from "../services/secureSync";
import { Client } from "../types/wealth";
import { ClientAiRecommendation } from "../services/aiAdvisor";

export function useAiAdvisor() {
  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState(false);
  const [aiProviderStatus, setAiProviderStatus] = useState<Record<string, AiProviderState> | null>(null);
  const [aiResearchQuery, setAiResearchQuery] = useState("");
  const [aiResearchResult, setAiResearchResult] = useState<AiResearchResult | null>(null);
  const [aiResearchState, setAiResearchState] = useState("Ready");
  const [isAiResearchLoading, setIsAiResearchLoading] = useState(false);
  const [selectedAiClient, setSelectedAiClient] = useState<Client | null>(null);
  const [clientAiRecommendation, setClientAiRecommendation] = useState<ClientAiRecommendation | null>(null);
  const [isClientAiLoading, setIsClientAiLoading] = useState(false);

  const runAiResearchForQuery = useCallback(
    async (
      query: string,
      endpoint: string,
      getAccessToken: () => Promise<string | null>
    ) => {
      if (!query.trim()) {
        Alert.alert(
          "Research topic needed",
          "Enter a stock, company, fund, ETF, sector, or market topic."
        );
        return;
      }

      if (!endpoint.trim()) {
        Alert.alert("Backend URL needed", "Configure your backend URL before using AI Research.");
        return;
      }

      try {
        setIsAiResearchLoading(true);
        setAiResearchState("Researching...");
        const accessToken = await getAccessToken();
        if (!accessToken) {
          setAiResearchState("Backend login required");
          Alert.alert(
            "Backend login required",
            "Sign in to the backend before generating AI research."
          );
          return;
        }
        const result = await requestAiResearch({
          endpoint,
          query: query.trim(),
          accessToken,
          onUnauthorized: getAccessToken,
        });
        setAiResearchQuery(query.trim());
        setAiResearchResult(result);
        setAiResearchState(`Research complete for ${query.trim()}`);
      } catch (error) {
        setAiResearchState("Research failed");
        Alert.alert(
          "AI research failed",
          error instanceof Error ? error.message : "Unable to complete AI research."
        );
      } finally {
        setIsAiResearchLoading(false);
      }
    },
    []
  );

  return {
    isAiCopilotOpen,
    setIsAiCopilotOpen,
    aiProviderStatus,
    setAiProviderStatus,
    aiResearchQuery,
    setAiResearchQuery,
    aiResearchResult,
    setAiResearchResult,
    aiResearchState,
    setAiResearchState,
    isAiResearchLoading,
    setIsAiResearchLoading,
    selectedAiClient,
    setSelectedAiClient,
    clientAiRecommendation,
    setClientAiRecommendation,
    isClientAiLoading,
    setIsClientAiLoading,
    runAiResearchForQuery,
  };
}
