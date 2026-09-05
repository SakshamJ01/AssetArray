/**
 * Institutional Anthropic Provider
 * Direct streaming using Anthropic Messages API with Server-Sent Events (SSE).
 */

import { AiProvider, AiStreamCallbacks, AiTaskType, ProviderStatus, StreamContextPayload } from "../types";
import { buildTaskPrompt } from "../schemas";

export class AnthropicProvider implements AiProvider {
  readonly id = "anthropic";
  readonly name = "Anthropic (Claude 3.5 Sonnet / Haiku)";
  private apiKey: string | null;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl = "https://api.anthropic.com/v1") {
    this.apiKey =
      apiKey ||
      (typeof process !== "undefined"
        ? (process.env?.EXPO_PUBLIC_ANTHROPIC_API_KEY || process.env?.ANTHROPIC_API_KEY || null)
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
      const err = new Error("Anthropic provider is NOT_CONFIGURED: Missing ANTHROPIC_API_KEY.");
      callbacks.onStateChange?.("UNAVAILABLE", err.message);
      callbacks.onError?.(err);
      throw err;
    }

    const timeout = options?.timeoutMs || 15000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    callbacks.onStateChange?.("CONNECTING", "Connecting to Anthropic endpoint...");

    const modelName = taskType === "DEEP_RESEARCH" ? "claude-3-5-sonnet-20241022" : "claude-3-5-haiku-20241022";
    const prompt = buildTaskPrompt(query, taskType, context);
    const startTime = Date.now();

    try {
      callbacks.onStateChange?.("STREAMING", `Streaming from ${modelName}...`);

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: modelName,
          max_tokens: 2048,
          messages: [{ role: "user", content: prompt }],
          stream: true,
        }),
        signal: options?.signal || controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Anthropic HTTP ${response.status}: Stream initiation failed.`);
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
              if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                callbacks.onToken(parsed.delta.text);
              }
              if (parsed.type === "message_stop") {
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
