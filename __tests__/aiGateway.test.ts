import {
  aiRouter,
  aiTelemetryLogger,
  generateDeterministicSummary,
  AiTaskType,
} from "../src/services/aiGateway";

describe("AI Gateway & Task Router", () => {
  it("routes tasks appropriately and returns provider statuses", () => {
    const statuses = aiRouter.getProviderStatuses();
    expect(statuses).toHaveProperty("gemini");
    expect(statuses).toHaveProperty("openai");
    expect(statuses).toHaveProperty("anthropic");
    // Provider statuses reflect genuine configuration
    expect(["ONLINE", "CONFIGURED", "NOT_CONFIGURED"]).toContain(statuses.gemini.status);
    expect(["ONLINE", "CONFIGURED", "NOT_CONFIGURED"]).toContain(statuses.openai.status);
    expect(["ONLINE", "CONFIGURED", "NOT_CONFIGURED"]).toContain(statuses.anthropic.status);
  });

  it("selects appropriate candidate models based on task type", () => {
    const briefRouter = aiRouter.routeTask("ADVISOR_BRIEF");
    expect(briefRouter.taskType).toBe("ADVISOR_BRIEF");
    expect(briefRouter.fallbackStrategy).toBe("DETERMINISTIC_SUMMARY");

    const researchRouter = aiRouter.routeTask("DEEP_RESEARCH");
    expect(researchRouter.taskType).toBe("DEEP_RESEARCH");
    expect(researchRouter.candidates.length).toBeGreaterThan(0);
  });

  it("produces deterministic summaries without inventing numbers", () => {
    const summary = generateDeterministicSummary("ADVISOR_BRIEF", {
      clientName: "Rahul Mehta",
      totalAum: 48500000,
      healthScore: 78,
      riskProfile: "Aggressive",
      criticalAlertsCount: 1,
      taxLossAvailable: 150000,
      topHoldings: ["HDFCBANK", "RELIANCE"],
    });

    expect(summary).toContain("Rahul Mehta");
    expect(summary).toMatch(/4,85,00,000|48,500,000/);
    expect(summary).toContain("78/100");
    expect(summary).toContain("Rahul Mehta");
    // Must NOT contain hallucinated values
    expect(summary).not.toContain("2450000");
    expect(summary).not.toContain("18450");
  });

  it("records telemetry with zero PII", () => {
    aiTelemetryLogger.log({
      requestId: "req_test_1",
      provider: "gemini",
      model: "gemini-2.5-flash",
      taskType: "FAST_SUMMARY",
      durationMs: 450,
      status: "SUCCESS",
      fallbackUsed: false,
      estimatedCost: 0.0001,
      timestamp: new Date().toISOString(),
    });

    const entries = aiTelemetryLogger.getEntries();
    expect(entries.length).toBeGreaterThan(0);
    const last = entries[0];
    expect(last.requestId).toBe("req_test_1");
    expect(last.provider).toBe("gemini");
    expect(last.durationMs).toBe(450);

    // Verify zero PII logged in telemetry entries
    const serialized = JSON.stringify(last);
    expect(serialized).not.toContain("Rahul Mehta");
    expect(serialized).not.toContain("email");
    expect(serialized).not.toContain("phone");
  });
});
