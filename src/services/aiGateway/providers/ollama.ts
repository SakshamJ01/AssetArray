/**
 * Institutional Ollama Local AI Provider
 * Zero-cost, zero-PII local inference for desktop/local development.
 * Connects via backend streaming proxy or direct local Ollama daemon (localhost:11434).
 */

import { AiProvider, AiStreamCallbacks, AiTaskType, ProviderStatus, StreamContextPayload } from "../types";
import { buildTaskPrompt } from "../schemas";

export class OllamaProvider implements AiProvider {
  readonly id = "ollama";
  readonly name = "Ollama Local (llama3.2 / mistral)";
  private backendUrl: string;
  private localBaseUrl: string;
  private defaultModel: string;

  constructor(backendUrl?: string, localBaseUrl?: string, defaultModel?: string) {
    this.backendUrl =
      backendUrl ||
      (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) ||
      "https://assetarray.onrender.com";
    this.localBaseUrl =
      localBaseUrl ||
      (typeof process !== "undefined" && (process.env?.OLLAMA_BASE_URL || process.env?.EXPO_PUBLIC_OLLAMA_URL)) ||
      "http://localhost:11434";
    this.defaultModel =
      defaultModel ||
      (typeof process !== "undefined" && (process.env?.OLLAMA_MODEL || process.env?.EXPO_PUBLIC_OLLAMA_MODEL)) ||
      "llama3.2";
  }

  public getStatus(): ProviderStatus {
    return "AVAILABLE";
  }

  public isConfigured(): boolean {
    return true; // Local Ollama is always considered configured as zero-cost local tier
  }

  public async streamResponse(
    query: string,
    taskType: AiTaskType,
    context: StreamContextPayload | undefined,
    callbacks: AiStreamCallbacks,
    options?: { timeoutMs?: number; signal?: AbortSignal }
  ): Promise<void> {
    const timeout = options?.timeoutMs || 20000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    callbacks.onStateChange?.("CONNECTING", `Connecting to local Ollama model (${this.defaultModel})...`);

    const prompt = buildTaskPrompt(query, taskType, context);
    const startTime = Date.now();

    // 1. First attempt through backend proxy
    try {
      callbacks.onStateChange?.("STREAMING", `Streaming from Ollama (${this.defaultModel})...`);
      const response = await fetch(`${this.backendUrl}/api/ai/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "ollama",
          model: this.defaultModel,
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

      if (response.ok && response.body) {
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
                if (parsed.error && parsed.notConfigured) {
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
                    model: this.defaultModel,
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
          model: this.defaultModel,
          durationMs: Date.now() - startTime,
          groundedAt: new Date().toISOString(),
          taskType,
        });
        return;
      }
    } catch (proxyErr: any) {
      // Backend proxy failed or Ollama not reachable via proxy; attempt direct local daemon
    }

    // 2. Direct local daemon fallback (http://localhost:11434/api/generate)
    try {
      const localRes = await fetch(`${this.localBaseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.defaultModel,
          prompt,
          stream: true,
        }),
        signal: options?.signal || controller.signal,
      });

      if (!localRes.ok || !localRes.body) {
        throw new Error(`Local Ollama daemon returned HTTP ${localRes.status}`);
      }

      const reader = localRes.body.getReader();
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
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed.response) {
              callbacks.onToken(parsed.response);
            }
            if (parsed.done) {
              clearTimeout(timer);
              callbacks.onStateChange?.("COMPLETED");
              callbacks.onComplete?.({
                provider: this.id,
                model: this.defaultModel,
                durationMs: Date.now() - startTime,
                groundedAt: new Date().toISOString(),
                taskType,
              });
              return;
            }
          } catch {}
        }
      }

      clearTimeout(timer);
      callbacks.onStateChange?.("COMPLETED");
      callbacks.onComplete?.({
        provider: this.id,
        model: this.defaultModel,
        durationMs: Date.now() - startTime,
        groundedAt: new Date().toISOString(),
        taskType,
      });
    } catch (directErr: any) {
      clearTimeout(timer);
      callbacks.onStateChange?.("FAILED", `Ollama local inference failed: ${directErr.message}`);
      callbacks.onError?.(directErr);
      throw directErr;
    }
  }
}
