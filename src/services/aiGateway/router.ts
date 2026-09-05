/**
 * Institutional AI Gateway Router
 * Task-based model routing, fallback escalation, and observable routing decisions.
 */

import { AiProvider, AiStreamCallbacks, AiStreamState, AiTaskType, StreamContextPayload } from "./types";
import { GeminiProvider } from "./providers/gemini";
import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";
import { generateDeterministicSummary } from "./fallback";
import { aiTelemetry } from "./telemetry";

export interface RoutingDecision {
  taskType: AiTaskType;
  selectedProvider: string;
  candidateOrder: string[];
  reason: string;
  timestamp: string;
}

export class AiRouter {
  private providers: Map<string, AiProvider> = new Map();
  private lastRoutingDecision: RoutingDecision | null = null;

  constructor() {
    this.registerProvider(new GeminiProvider());
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new AnthropicProvider());
  }

  public registerProvider(provider: AiProvider): void {
    this.providers.set(provider.id, provider);
  }

  public getProvider(id: string): AiProvider | undefined {
    return this.providers.get(id);
  }

  public getAllProviders(): AiProvider[] {
    return Array.from(this.providers.values());
  }

  public getProviderStatuses(): Record<string, { name: string; status: string; isConfigured: boolean }> {
    const result: Record<string, { name: string; status: string; isConfigured: boolean }> = {};
    for (const [id, provider] of this.providers.entries()) {
      result[id] = {
        name: provider.name,
        status: provider.getStatus(),
        isConfigured: provider.isConfigured(),
      };
    }
    return result;
  }

  public getLastRoutingDecision(): RoutingDecision | null {
    return this.lastRoutingDecision;
  }

  public routeTask(taskType: AiTaskType): {
    taskType: AiTaskType;
    candidates: string[];
    fallbackStrategy: string;
  } {
    const chain = this.resolveProviderChain(taskType);
    return {
      taskType,
      candidates: chain.map((p) => p.id),
      fallbackStrategy: "DETERMINISTIC_SUMMARY",
    };
  }

  /**
   * Determine optimal provider order based on task requirements and provider availability.
   */
  public resolveProviderChain(taskType: AiTaskType): AiProvider[] {
    let order: string[] = [];

    switch (taskType) {
      case "FAST_SUMMARY":
      case "ADVISOR_BRIEF":
        order = ["gemini", "openai", "anthropic"];
        break;
      case "DEEP_RESEARCH":
        order = ["anthropic", "gemini", "openai"];
        break;
      case "TAX_EXPLANATION":
      case "PORTFOLIO_EXPLANATION":
        order = ["gemini", "openai", "anthropic"];
        break;
      case "DOCUMENT_EXTRACTION":
      default:
        order = ["gemini", "anthropic", "openai"];
        break;
    }

    const available: AiProvider[] = [];
    for (const id of order) {
      const p = this.providers.get(id);
      if (p && p.isConfigured()) {
        available.push(p);
      }
    }

    // If none are configured, return all registered in order so fallback chain can attempt or report status
    return available.length > 0
      ? available
      : order.map((id) => this.providers.get(id)!).filter(Boolean);
  }

  /**
   * Execute task across provider chain with automatic timeout fallback
   * and final escalation to local deterministic summary (never fabricated numbers).
   */
  public async executeStream(
    query: string,
    taskType: AiTaskType,
    context: StreamContextPayload | undefined,
    callbacks: AiStreamCallbacks
  ): Promise<void> {
    const chain = this.resolveProviderChain(taskType);
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const startTime = Date.now();

    this.lastRoutingDecision = {
      taskType,
      selectedProvider: chain[0]?.id || "none",
      candidateOrder: chain.map((p) => p.id),
      reason: `Task ${taskType} routed to ${chain[0]?.name || "deterministic fallback"}`,
      timestamp: new Date().toISOString(),
    };

    let attempt = 0;
    let success = false;

    for (const provider of chain) {
      attempt++;
      if (!provider.isConfigured()) {
        continue;
      }

      try {
        callbacks.onStateChange?.(
          attempt === 1 ? "CONNECTING" : "RETRYING",
          `Routing to ${provider.name}...`
        );

        await provider.streamResponse(query, taskType, context, {
          onStateChange: callbacks.onStateChange,
          onToken: callbacks.onToken,
          onComplete: (meta) => {
            aiTelemetry.log({
              requestId,
              provider: provider.id,
              model: meta.model,
              taskType,
              durationMs: meta.durationMs,
              status: "SUCCESS",
              fallbackUsed: attempt > 1,
              estimatedCost: 0.0005,
              timestamp: new Date().toISOString(),
            });
            callbacks.onComplete?.(meta);
          },
          onError: callbacks.onError,
        }, { timeoutMs: 12000 });

        success = true;
        break;
      } catch (err: any) {
        console.warn(`[AiRouter] Provider ${provider.id} failed or timed out:`, err.message);
        aiTelemetry.log({
          requestId,
          provider: provider.id,
          model: provider.id,
          taskType,
          durationMs: Date.now() - startTime,
          status: "FAILED",
          fallbackUsed: false,
          estimatedCost: 0,
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (!success) {
      // Deterministic local summary (never fabricates financial data)
      callbacks.onStateChange?.("UNAVAILABLE", "Live AI offline. Presenting verified deterministic advisory data.");
      const fallbackText = generateDeterministicSummary(query, taskType, context);
      
      const tokens = fallbackText.split(/(\s+)/);
      for (const token of tokens) {
        if (token) callbacks.onToken(token);
      }

      callbacks.onStateChange?.("COMPLETED");
      callbacks.onComplete?.({
        provider: "deterministic-local",
        model: "verified-rule-engine",
        durationMs: Date.now() - startTime,
        groundedAt: new Date().toISOString(),
        taskType,
      });

      aiTelemetry.log({
        requestId,
        provider: "deterministic-local",
        model: "verified-rule-engine",
        taskType,
        durationMs: Date.now() - startTime,
        status: "FALLBACK",
        fallbackUsed: true,
        estimatedCost: 0,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export const aiRouter = new AiRouter();
