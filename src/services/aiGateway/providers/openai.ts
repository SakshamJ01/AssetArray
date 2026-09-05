/**
 * Institutional OpenAI Provider
 * Streaming Chat Completions via OpenAI REST SSE endpoint with timeout and error handling.
 */

import { AiProvider, AiStreamCallbacks, AiTaskType, ProviderStatus, StreamContextPayload } from "../types";
import { buildTaskPrompt } from "../schemas";

export class OpenAIProvider implements AiProvider {
  readonly id = "openai";
  readonly name = "OpenAI (GPT-4o / GPT-4o-mini)";
  private apiKey: string | null;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl = "https://api.openai.com/v1") {
    this.apiKey =
      apiKey ||
      (typeof process !== "undefined"
        ? (process.env?.EXPO_PUBLIC_OPENAI_API_KEY || process.env?.OPENAI_API_KEY || null)
        : null);
    this.baseUrl = baseUrl;
  }

  public getStatus(): ProviderStatus {
    return this.apiKey ? "ONLINE" : "NOT_CONFIGURED";
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  public async streamResponse(
    query: string,
    taskType: AiTaskType,
    context: StreamContextPayload | undefined,
    callbacks: AiStreamCallbacks,
    options?: { timeoutMs?: number; signal?: AbortSignal }
  ): Promise<void> {
    if (!this.apiKey) {
      const err = new Error("OpenAI provider is NOT_CONFIGURED: Missing OPENAI_API_KEY.");
      callbacks.onStateChange?.("UNAVAILABLE", err.message);
      callbacks.onError?.(err);
      throw err;
    }

    const timeout = options?.timeoutMs || 15000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    callbacks.onStateChange?.("CONNECTING", "Connecting to OpenAI endpoint...");

    const modelName = taskType === "DEEP_RESEARCH" ? "gpt-4o" : "gpt-4o-mini";
    const prompt = buildTaskPrompt(query, taskType, context);
    const startTime = Date.now();

    try {
      callbacks.onStateChange?.("STREAMING", `Streaming from ${modelName}...`);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: "user", content: prompt }],
          stream: true,
          temperature: 0.2,
        }),
        signal: options?.signal || controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`OpenAI HTTP ${response.status}: Stream initiation failed.`);
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
          if (trimmed === "data: [DONE]") {
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
          if (trimmed.startsWith("data:")) {
            const jsonStr = trimmed.replace(/^data:\s*/, "");
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                callbacks.onToken(delta);
              }
            } catch {
              // Ignore partial JSON
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
