/**
 * Institutional OpenRouter Provider
 * High-intelligence multi-model streaming provider supporting free-tier models:
 * - openrouter/free
 * - meta-llama/llama-3.3-70b-instruct:free
 * - google/gemini-2.0-flash-exp:free
 * Routed securely through backend proxy with automatic direct-browser fallback resilience.
 */

import { AiProvider, AiStreamCallbacks, AiTaskType, ProviderStatus, StreamContextPayload } from "../types";
import { buildTaskPrompt } from "../schemas";
import { fetchBackendStream } from "./backendStream";

function getClientOpenRouterKey(): string {
  try {
    if (typeof process !== "undefined" && process.env && (process.env as any).EXPO_PUBLIC_OPENROUTER_API_KEY) {
      return (process.env as any).EXPO_PUBLIC_OPENROUTER_API_KEY;
    }
  } catch {}
  return "";
}

export class OpenRouterProvider implements AiProvider {
  readonly id = "openrouter";
  readonly name = "OpenRouter (Free Tier Models)";
  private backendUrl: string;

  constructor(backendUrl?: string) {
    this.backendUrl =
      backendUrl ||
      (typeof process !== "undefined" && process.env && process.env.EXPO_PUBLIC_API_URL) ||
      "https://assetarray.onrender.com";
  }

  public getStatus(): ProviderStatus {
    return this.backendUrl || getClientOpenRouterKey() ? "AVAILABLE" : "NOT_CONFIGURED";
  }

  public isConfigured(): boolean {
    return Boolean(this.backendUrl || getClientOpenRouterKey());
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

    // 1. Try Backend Proxy First
    let backendError: Error | null = null;

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
        throw new Error(`OpenRouter proxy HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let receivedTokens = 0;

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
                receivedTokens++;
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

      if (receivedTokens > 0) {
        clearTimeout(timer);
        callbacks.onStateChange?.("COMPLETED");
        callbacks.onComplete?.({
          provider: this.id,
          model: modelName,
          durationMs: Date.now() - startTime,
          groundedAt: new Date().toISOString(),
          taskType,
        });
        return;
      }
    } catch (err: any) {
      backendError = err;
      console.warn("[OpenRouterProvider] Backend proxy attempt failed, falling back to direct stream:", err.message);
    }

    // 2. Direct OpenRouter Client-Side Fallback (Seamless Resilience)
    const directKey = getClientOpenRouterKey();
    if (directKey) {
      try {
        callbacks.onStateChange?.("STREAMING", `Streaming from ${modelName.split("/").pop() || modelName}...`);
        await this.streamDirect(prompt, modelName, taskType, startTime, directKey, callbacks, options?.signal || controller.signal);
        clearTimeout(timer);
        return;
      } catch (directErr: any) {
        console.warn("[OpenRouterProvider] Direct stream also failed:", directErr.message);
      }
    }

    clearTimeout(timer);
    const finalErr = backendError || new Error("OpenRouter unavailable");
    callbacks.onStateChange?.("FAILED", finalErr.message);
    throw finalErr;
  }

  private async streamDirect(
    prompt: string,
    modelName: string,
    taskType: AiTaskType,
    startTime: number,
    apiKey: string,
    callbacks: AiStreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://assetarray.com",
        "X-Title": "AssetArray Wealth Engine",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "system",
            content:
              "You are AssetArray Wealth Copilot, an elite AI assistant for wealth advisors. Be helpful, concise, and direct. When the user greets you or makes small talk, respond warmly and briefly in 1-2 short sentences without memorandum headers, dates, disclaimers, or 'OBSERVED FACTS'. When answering portfolio or financial questions, answer the inquiry directly and cite verified data accurately.",
          },
          { role: "user", content: prompt },
        ],
        stream: true,
        temperature: 0.35,
      }),
      signal,
    });

    if (!res.ok) {
      throw new Error(`OpenRouter Direct HTTP ${res.status}`);
    }

    if (res.body && typeof (res.body as any).getReader === "function") {
      const reader = (res.body as any).getReader();
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
          if (trimmed === "data: [DONE]") {
            callbacks.onStateChange?.("COMPLETED");
            callbacks.onComplete?.({
              provider: this.id,
              model: modelName,
              durationMs: Date.now() - startTime,
              groundedAt: new Date().toISOString(),
              taskType,
            });
            return;
          }
          if (trimmed.startsWith("data:")) {
            try {
              const parsed = JSON.parse(trimmed.replace(/^data:\s*/, ""));
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                callbacks.onToken(token);
              }
            } catch {}
          }
        }
      }
    } else {
      // Fallback for environments where body.getReader is unavailable
      const data = await res.json();
      const fullText = data.choices?.[0]?.message?.content || "";
      if (fullText) {
        callbacks.onToken(fullText);
      }
    }

    callbacks.onStateChange?.("COMPLETED");
    callbacks.onComplete?.({
      provider: this.id,
      model: modelName,
      durationMs: Date.now() - startTime,
      groundedAt: new Date().toISOString(),
      taskType,
    });
  }
}
