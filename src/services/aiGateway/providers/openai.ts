/**
 * Institutional OpenAI Provider
 * Genuine implementation routed strictly through authenticated backend streaming proxy.
 * Zero provider secrets exposed in frontend client bundle.
 */

import { AiProvider, AiStreamCallbacks, AiTaskType, ProviderStatus, StreamContextPayload } from "../types";
import { buildTaskPrompt } from "../schemas";

export class OpenAIProvider implements AiProvider {
  readonly id = "openai";
  readonly name = "OpenAI (GPT-4o / GPT-4o-mini)";
  private backendUrl: string;

  constructor(backendUrl?: string) {
    this.backendUrl =
      backendUrl ||
      (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) ||
      "https://assetarray.onrender.com";
  }

  public getStatus(): ProviderStatus {
    return this.backendUrl ? "AVAILABLE" : "NOT_CONFIGURED";
  }

  public isConfigured(): boolean {
    return Boolean(this.backendUrl);
  }

  public async streamResponse(
    query: string,
    taskType: AiTaskType,
    context: StreamContextPayload | undefined,
    callbacks: AiStreamCallbacks,
    options?: { timeoutMs?: number; signal?: AbortSignal }
  ): Promise<void> {
    const timeout = options?.timeoutMs || 15000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    callbacks.onStateChange?.("CONNECTING", "Connecting to OpenAI via secure backend proxy...");

    const modelName = taskType === "DEEP_RESEARCH" ? "gpt-4o" : "gpt-4o-mini";
    const prompt = buildTaskPrompt(query, taskType, context);
    const startTime = Date.now();

    try {
      callbacks.onStateChange?.("STREAMING", `Streaming from ${modelName}...`);

      const response = await fetch(`${this.backendUrl}/api/ai/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "openai",
          query: prompt,
          taskType,
          portfolioContext: {
            totalAum: context?.totalAum,
            healthScore: context?.healthScore,
            criticalAlertsCount: context?.criticalAlertsCount,
            taxLossAvailable: context?.taxLossAvailable,
            topHoldings: context?.topHoldings,
          },
          clientContext: {
            name: context?.clientName,
            riskProfile: context?.riskProfile,
          },
          macroContext: context?.macroContext,
        }),
        signal: options?.signal || controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`OpenAI proxy failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data:")) {
            const jsonStr = trimmed.replace(/^data:\s*/, "");
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.token) {
                callbacks.onToken(parsed.token);
              }
              if (parsed.done) {
                clearTimeout(timer);
                callbacks.onStateChange?.("COMPLETED");
                callbacks.onComplete?.({
                  provider: this.id,
                  model: parsed.model || modelName,
                  durationMs: Date.now() - startTime,
                  groundedAt: new Date().toISOString(),
                  taskType,
                });
                return;
              }
            } catch (parseErr: any) {
              if (parseErr.message && !parseErr.message.includes("JSON")) {
                throw parseErr;
              }
            }
          }
        }
      }

      clearTimeout(timer);
      callbacks.onStateChange?.("COMPLETED");
      callbacks.onComplete?.({
        provider: this.id,
        model: modelName,
        durationMs: Date.now() - startTime,
        groundedAt: new Date().toISOString(),
        taskType,
      });
    } catch (err: any) {
      clearTimeout(timer);
      callbacks.onStateChange?.("FAILED", err.message);
      callbacks.onError?.(err);
      throw err;
    }
  }
}
