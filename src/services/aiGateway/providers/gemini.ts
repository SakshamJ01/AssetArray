/**
 * Institutional Gemini Provider
 * Genuine implementation routed strictly through authenticated backend streaming proxy.
 * Zero provider secrets exposed in frontend client bundle.
 */

import { AiProvider, AiStreamCallbacks, AiTaskType, ProviderStatus, StreamContextPayload } from "../types";
import { buildTaskPrompt } from "../schemas";

export class GeminiProvider implements AiProvider {
  readonly id = "gemini";
  readonly name = "Google Gemini (2.5 Flash / Pro)";
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

    callbacks.onStateChange?.("CONNECTING", "Establishing connection to Gemini model via secure backend proxy...");

    try {
      const prompt = buildTaskPrompt(query, taskType, context);
      const modelName = taskType === "DEEP_RESEARCH" ? "gemini-2.5-pro" : "gemini-2.5-flash";

      callbacks.onStateChange?.("STREAMING", `Streaming from ${modelName}...`);

      const response = await fetch(`${this.backendUrl}/api/ai/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "gemini",
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
        throw new Error(`Gemini proxy failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      const startTime = Date.now();

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
