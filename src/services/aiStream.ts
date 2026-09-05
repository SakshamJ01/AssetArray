/**
 * Institutional AI Streaming Client
 * Connects to the institutional aiRouter gateway for multi-provider routing,
 * explicit streaming state transitions, verified portfolio context, and zero-fabrication fallbacks.
 */

import { aiRouter, AiStreamState, AiTaskType, StreamContextPayload } from "./aiGateway";
import { marketNewsService } from "./market/newsFeed";

export interface StreamContext {
  clientName?: string;
  totalAum?: number;
  riskProfile?: string;
  healthScore?: number;
  criticalAlertsCount?: number;
  taxLossAvailable?: number;
  topHoldings?: string[];
  evidence?: Record<string, any>;
}

export interface StreamOptions {
  query: string;
  taskType?: "briefing" | "tax_analytics" | "portfolio_attribution" | "scenario_stress" | AiTaskType;
  context?: StreamContext;
  accessToken?: string | null;
  onStateChange?: (state: AiStreamState, message?: string) => void;
  onToken: (token: string) => void;
  onComplete?: (metadata: { model: string; groundedAt: string; provider?: string }) => void;
  onError?: (err: Error) => void;
}

export async function streamAiResponse(options: StreamOptions): Promise<void> {
  const { query, taskType = "briefing", context, onStateChange, onToken, onComplete, onError } = options;

  let mappedTask: AiTaskType = "ADVISOR_BRIEF";
  if (taskType === "tax_analytics" || taskType === "TAX_EXPLANATION") {
    mappedTask = "TAX_EXPLANATION";
  } else if (taskType === "portfolio_attribution" || taskType === "PORTFOLIO_EXPLANATION") {
    mappedTask = "PORTFOLIO_EXPLANATION";
  } else if (taskType === "scenario_stress") {
    mappedTask = "PORTFOLIO_EXPLANATION";
  } else if (taskType === "DEEP_RESEARCH") {
    mappedTask = "DEEP_RESEARCH";
  } else if (taskType === "FAST_SUMMARY") {
    mappedTask = "FAST_SUMMARY";
  }

  const macroContext = marketNewsService.getGroundingContextForAI(
    context?.topHoldings?.map((h) => h.split(" ")[0]) || []
  );

  const payloadContext: StreamContextPayload = {
    clientName: context?.clientName,
    totalAum: context?.totalAum,
    riskProfile: context?.riskProfile,
    healthScore: context?.healthScore,
    criticalAlertsCount: context?.criticalAlertsCount,
    taxLossAvailable: context?.taxLossAvailable,
    topHoldings: context?.topHoldings,
    macroContext,
    evidence: context?.evidence,
  };

  try {
    await aiRouter.executeStream(query, mappedTask, payloadContext, {
      onStateChange,
      onToken,
      onComplete: (meta) => {
        onComplete?.({
          model: meta.model,
          groundedAt: meta.groundedAt,
          provider: meta.provider,
        });
      },
      onError,
    });
  } catch (err: any) {
    onError?.(err);
  }
}

