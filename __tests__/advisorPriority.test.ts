import {
  calculatePriorityScore,
  sortActionsByPriority,
} from "../src/services/advisor/prioritization";
import { AdvisorAction } from "../src/types/advisor";

describe("Advisor OS Prioritization Engine", () => {
  const asOfDate = "2026-09-05T10:00:00.000Z";

  test("critical severity gets maximum severity weight (5/5)", () => {
    const result = calculatePriorityScore({
      severity: "critical",
      clientCategory: "Retail",
      clientPriority: "Low",
      asOfDate,
    });

    expect(result.factors.severity).toBe(5);
    expect(result.priority).toBe("URGENT");
    expect(result.score).toBeGreaterThanOrEqual(50);
  });

  test("HNI / Tier-1 client importance scales up factor to 5/5", () => {
    const hniResult = calculatePriorityScore({
      severity: "warning",
      clientCategory: "HNI",
      clientPriority: "High",
      asOfDate,
    });

    const retailResult = calculatePriorityScore({
      severity: "warning",
      clientCategory: "Retail",
      clientPriority: "Low",
      asOfDate,
    });

    expect(hniResult.factors.clientImportance).toBe(5);
    expect(retailResult.factors.clientImportance).toBe(2);
    expect(hniResult.score).toBeGreaterThan(retailResult.score);
  });

  test("overdue actions get maximum urgency factor (5/5)", () => {
    const overdueResult = calculatePriorityScore({
      severity: "warning",
      dueDate: "2026-09-01", // Past date relative to 2026-09-05
      asOfDate,
    });

    const dueTodayResult = calculatePriorityScore({
      severity: "warning",
      dueDate: "2026-09-05", // Today
      asOfDate,
    });

    const futureResult = calculatePriorityScore({
      severity: "warning",
      dueDate: "2026-09-20", // Far in future
      asOfDate,
    });

    expect(overdueResult.factors.urgency).toBe(5);
    expect(dueTodayResult.factors.urgency).toBe(4);
    expect(futureResult.factors.urgency).toBe(1);
    expect(overdueResult.score).toBeGreaterThan(dueTodayResult.score);
    expect(dueTodayResult.score).toBeGreaterThan(futureResult.score);
  });

  test("financial impact scales appropriately with AUM and drift", () => {
    const largeAum = calculatePriorityScore({
      severity: "warning",
      portfolioValue: 20000000, // 2 Cr
      asOfDate,
    });

    const smallAum = calculatePriorityScore({
      severity: "warning",
      portfolioValue: 50000, // 50k
      asOfDate,
    });

    expect(largeAum.factors.financialImpact).toBe(5);
    expect(smallAum.factors.financialImpact).toBe(1);
  });

  test("percentage drift metric scales to maximum on large drift", () => {
    const bigDrift = calculatePriorityScore({
      severity: "warning",
      financialImpactValue: 25.4,
      financialImpactMetric: "PERCENT",
      asOfDate,
    });

    expect(bigDrift.factors.financialImpact).toBe(5);
  });

  test("unverified data reduces data confidence factor", () => {
    const verified = calculatePriorityScore({
      severity: "warning",
      hasVerifiedData: true,
      asOfDate,
    });

    const unverified = calculatePriorityScore({
      severity: "warning",
      hasVerifiedData: false,
      asOfDate,
    });

    expect(verified.factors.dataConfidence).toBe(5);
    expect(unverified.factors.dataConfidence).toBe(2);
    expect(verified.score).toBeGreaterThan(unverified.score);
  });

  test("score is bounded between 10 and 100 with inspectable explanation", () => {
    const res = calculatePriorityScore({
      severity: "critical",
      clientCategory: "HNI",
      clientPriority: "High",
      portfolioValue: 50000000,
      dueDate: "2026-09-01",
      hasVerifiedData: true,
      asOfDate,
    });

    expect(res.score).toBeLessThanOrEqual(100);
    expect(res.score).toBeGreaterThanOrEqual(90);
    expect(res.factors.explanation).toContain("Severity:");
    expect(res.factors.explanation).toContain("Financial Impact:");
    expect(res.factors.explanation).toContain("Urgency:");
    expect(res.factors.explanation).toContain("Client Importance:");
    expect(res.factors.explanation).toContain("Data Confidence:");
  });

  test("sortActionsByPriority orders deterministically by priorityScore descending", () => {
    const actions: Partial<AdvisorAction>[] = [
      { id: "1", priorityScore: 45, dueAt: "2026-09-05", createdAt: "2026-09-01" },
      { id: "2", priorityScore: 92, dueAt: "2026-09-05", createdAt: "2026-09-01" },
      { id: "3", priorityScore: 78, dueAt: "2026-09-05", createdAt: "2026-09-01" },
    ];

    const sorted = sortActionsByPriority(actions as AdvisorAction[]);
    expect(sorted.map((a) => a.id)).toEqual(["2", "3", "1"]);
  });
});
