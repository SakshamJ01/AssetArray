/**
 * Institutional Gemini Provider
 * Genuine implementation using Google GenAI / backend SSE streaming proxy.
 */

import { AiProvider, AiStreamCallbacks, AiTaskType, ProviderStatus, StreamContextPayload } from "../types";
import { buildTaskPrompt } from "../schemas";

export class GeminiProvider implements AiProvider {
  readonly id = "gemini";
  readonly name = "Google Gemini (2.5 Flash / Pro)";
  private apiKey: string | null;
  private backendUrl: string;

  constructor(apiKey?: string, backendUrl?: string) {
    this.apiKey =
      apiKey ||
      (typeof process !== "undefined"
        ? (process.env?.EXPO_PUBLIC_GEMINI_API_KEY || process.env?.GEMINI_API_KEY || null)
        : null);
    this.backendUrl =
      backendUrl ||
      (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) ||
      "https://assetarray.onrender.com";
  }

  public getStatus(): ProviderStatus {
    return (this.apiKey || this.backendUrl) ? "ONLINE" : "NOT_CONFIGURED";
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey || this.backendUrl);
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

    callbacks.onStateChange?.("CONNECTING", "Establishing connection to Gemini model...");

    try {
      const prompt = buildTaskPrompt(query, taskType, context);
      const modelName = taskType === "DEEP_RESEARCH" ? "gemini-2.5-pro" : "gemini-2.5-flash";

      callbacks.onStateChange?.("STREAMING", `Streaming from ${modelName}...`);

      const response = await fetch(`${this.backendUrl}/api/ai/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        throw new Error(`Gemini stream failed with status ${response.status}`);
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
            } catch {
              // Ignore partial chunk parsing
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
