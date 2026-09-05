/**
 * Institutional AI Gateway Router
 * Task-based model routing, fallback escalation, observable decisions,
 * timeout enforcement, prompt injection defense, and numerical claim grounding.
 */

import { AiProvider, AiStreamCallbacks, AiTaskType, ProviderStatus, StreamContextPayload } from "./types";
import { GeminiProvider } from "./providers/gemini";
import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";
import { generateDeterministicSummary } from "./fallback";
import { aiTelemetry } from "./telemetry";
import { extractNumericClaims, validateClaimsAgainstContext, sanitizeUntrustedInput, GroundingValidationReport } from "./grounding";

export interface RoutingDecision {
  taskType: AiTaskType;
  selectedProvider: string;
  candidateOrder: string[];
  reason: string;
  timestamp: string;
}

const TASK_TIMEOUT_POLICY: Record<AiTaskType, number> = {
  FAST_SUMMARY: 8000,
  ADVISOR_BRIEF: 15000,
  PORTFOLIO_EXPLANATION: 15000,
  TAX_EXPLANATION: 15000,
  DOCUMENT_EXTRACTION: 20000,
  DEEP_RESEARCH: 30000,
};

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

  public getProviderStatuses(): Record<string, { name: string; status: ProviderStatus; isConfigured: boolean }> {
    const result: Record<string, { name: string; status: ProviderStatus; isConfigured: boolean }> = {};
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
    const timeoutMs = TASK_TIMEOUT_POLICY[taskType] || 15000;

    // Prompt injection defense: sanitize untrusted input
    const { sanitizedText, injectionDetected } = sanitizeUntrustedInput(query);
    const effectiveQuery = injectionDetected ? sanitizedText : query;

    this.lastRoutingDecision = {
      taskType,
      selectedProvider: chain[0]?.id || "none",
      candidateOrder: chain.map((p) => p.id),
      reason: `Task ${taskType} routed to ${chain[0]?.name || "deterministic fallback"} (timeout: ${timeoutMs}ms)`,
      timestamp: new Date().toISOString(),
    };

    let attempt = 0;
    let success = false;
    let accumulatedText = "";

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

        accumulatedText = "";

        await provider.streamResponse(effectiveQuery, taskType, context, {
          onStateChange: callbacks.onStateChange,
          onToken: (token) => {
            accumulatedText += token;
            callbacks.onToken(token);
          },
          onComplete: (meta) => {
            // Numerical claim grounding check
            const claims = extractNumericClaims(accumulatedText);
            const groundingReport = validateClaimsAgainstContext(claims, context);

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

            callbacks.onComplete?.({
              ...meta,
              groundingReport,
            } as any);
          },
          onError: callbacks.onError,
        }, { timeoutMs });

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
      // Standard: explicitly label rule-based deterministic summary
      callbacks.onStateChange?.("UNAVAILABLE", "AI unavailable · Rule-based summary");
      const fallbackText = generateDeterministicSummary(query, taskType, context);
      
      const tokens = fallbackText.split(/(\s+)/);
      for (const token of tokens) {
        if (token) callbacks.onToken(token);
      }

      const claims = extractNumericClaims(fallbackText);
      const groundingReport = validateClaimsAgainstContext(claims, context);

      callbacks.onStateChange?.("COMPLETED");
      callbacks.onComplete?.({
        provider: "deterministic-local",
        model: "verified-rule-engine",
        durationMs: Date.now() - startTime,
        groundedAt: new Date().toISOString(),
        taskType,
        isFallback: true,
        fallbackLabel: "AI unavailable · Rule-based summary",
        groundingReport,
      } as any);

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
