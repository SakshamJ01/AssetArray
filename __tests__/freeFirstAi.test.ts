/**
 * Free-First AI Architecture & Zero-Subscription Tests
 * Verifies that AI works with Google Gemini Free tier, Ollama local daemon,
 * and deterministic offline rule engine without requiring any paid subscriptions.
 */

import { AiRouter } from "../src/services/aiGateway/router";
import { OllamaProvider } from "../src/services/aiGateway/providers/ollama";
import { GeminiProvider } from "../src/services/aiGateway/providers/gemini";
import { aiTelemetry } from "../src/services/aiGateway/telemetry";

describe("Free-First AI Architecture", () => {
  let router: AiRouter;

  beforeEach(() => {
    router = new AiRouter();
    aiTelemetry.clear();
  });

  test("enforces Free-First provider chain: Gemini Free -> Ollama Local -> Optional Paid", () => {
    const briefChain = router.resolveProviderChain("ADVISOR_BRIEF");
    const chainIds = briefChain.map((p) => p.id);

    // Gemini and Ollama must always take priority over optional paid providers
    expect(chainIds[0]).toBe("gemini");
    expect(chainIds[1]).toBe("ollama");
  });

  test("supports all required institutional task types including CLIENT_INSIGHT and GOAL_EXPLANATION", () => {
    const taskTypes = [
      "FAST_SUMMARY",
      "ADVISOR_BRIEF",
      "PORTFOLIO_EXPLANATION",
      "TAX_EXPLANATION",
      "CLIENT_INSIGHT",
      "GOAL_EXPLANATION",
      "DOCUMENT_EXTRACTION",
      "DEEP_RESEARCH",
    ] as const;

    for (const task of taskTypes) {
      const decision = router.routeTask(task);
      expect(decision.candidates).toBeDefined();
      expect(decision.candidates.length).toBeGreaterThan(0);
      expect(decision.fallbackStrategy).toBe("DETERMINISTIC_SUMMARY");
    }
  });

  test("OllamaProvider reports configured and available as zero-cost local tier", () => {
    const ollama = new OllamaProvider();
    expect(ollama.id).toBe("ollama");
    expect(ollama.isConfigured()).toBe(true);
    expect(ollama.getStatus()).toBe("AVAILABLE");
  });

  test("falls back cleanly to verified-rule-engine when network is offline", async () => {
    // Mock global fetch to simulate complete network isolation
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error("Network offline"));

    let stateMessage = "";
    let receivedTokens = "";
    let finalMeta: any = null;

    await router.executeStream(
      "Summarize client portfolio risk",
      "ADVISOR_BRIEF",
      {
        clientName: "Sunita Rao",
        totalAum: 48000000,
        riskProfile: "Aggressive",
        healthScore: 84,
        criticalAlertsCount: 0,
      },
      {
        onStateChange: (state, msg) => {
          if (state === "UNAVAILABLE") stateMessage = msg || "";
        },
        onToken: (t) => {
          receivedTokens += t;
        },
        onComplete: (meta) => {
          finalMeta = meta;
        },
      }
    );

    global.fetch = originalFetch;

    expect(stateMessage).toContain("AI unavailable · Rule-based summary");
    expect(receivedTokens).toContain("Verified Local Advisory Summary");
    expect(finalMeta).toBeDefined();
    expect(finalMeta.model).toBe("verified-rule-engine");
  });

  test("records zero estimated cost in telemetry for free-tier and deterministic runs", () => {
    aiTelemetry.log({
      requestId: "test_free_req",
      provider: "gemini",
      model: "gemini-2.5-flash",
      taskType: "FAST_SUMMARY",
      durationMs: 450,
      status: "SUCCESS",
      fallbackUsed: false,
      estimatedCost: 0.0,
      timestamp: new Date().toISOString(),
    });

    const summary = aiTelemetry.getSummary();
    expect(summary.totalEstimatedCost).toBe(0);
    expect(summary.successRatePct).toBe(100);
  });
});
