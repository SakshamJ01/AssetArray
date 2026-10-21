/**
 * Institutional OpenRouter Provider
 * High-intelligence multi-model streaming provider supporting free-tier models:
 * - meta-llama/llama-3.3-70b-instruct:free
 * - google/gemini-2.0-flash-exp:free
 * - deepseek/deepseek-chat
 * Routed securely through backend proxy so zero API secrets are exposed to the browser.
 */

import { AiProvider, AiStreamCallbacks, AiTaskType, ProviderStatus, StreamContextPayload } from "../types";
import { buildTaskPrompt } from "../schemas";
import { fetchBackendStream } from "./backendStream";

export class OpenRouterProvider implements AiProvider {
  readonly id = "openrouter";
  readonly name = "OpenRouter (Llama 3.3 70B / Gemini 2.0 Flash)";
  private backendUrl: string;

  constructor(backendUrl?: string) {
    this.backendUrl =
      backendUrl ||
      (typeof process !== "undefined" && process.env && process.env.EXPO_PUBLIC_API_URL) ||
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
    options?: {
      timeoutMs?: number;
      signal?: AbortSignal;
      accessToken?: string | null;
      endpoint?: string;
      onUnauthorized?: () => Promise<string | null>;
      model?: string;
    }
  ): Promise<void> {
    const timeout = options?.timeoutMs || 25000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const modelName = options?.model || "openrouter/free";
    callbacks.onStateChange?.("CONNECTING", `Connecting to OpenRouter (${modelName})...`);

    const prompt = buildTaskPrompt(query, taskType, context);
    const startTime = Date.now();

    try {
      callbacks.onStateChange?.("STREAMING", `Streaming from ${modelName.split("/").pop() || modelName}...`);

      const response = await fetchBackendStream({
        backendUrl: this.backendUrl,
        accessToken: options?.accessToken,
        endpoint: options?.endpoint,
        onUnauthorized: options?.onUnauthorized,
        signal: options?.signal || controller.signal,
        body: {
          provider: "openrouter",
          model: modelName,
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
          rawContextPrompt: context?.rawContextPrompt,
        },
      });

      if (!response.ok || !response.body) {
        throw new Error(`OpenRouter proxy failed with status ${response.status}`);
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
