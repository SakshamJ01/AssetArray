import { evaluateSmartAlerts } from "../src/services/smartAlerts";
import {
  scanAdvisorActions,
  transitionActionStatus,
} from "../src/services/advisor/actionEngine";
import { recordDecision, getDecisions } from "../src/services/advisor/decisionJournal";
import { getActivities, logActivity } from "../src/services/advisor/activityTimeline";
import { buildClient360Snapshot } from "../src/services/advisor/client360";
import { exportClientPdfReport } from "../src/services/pdfReport";
import { Client } from "../src/types/wealth";

describe("AssetArray V3.3 Golden Workflow End-to-End Test", () => {
  const asOfDate = "2026-09-05T10:00:00.000Z";

  test("deterministic fiduciary lifecycle chain from breach to resolution & timeline", async () => {
    // 1. Client & Portfolio Setup
    const client: Client = {
      id: "golden_c1",
      name: "Rahul Mehta",
      phone: "9876543210",
      email: "rahul.mehta@example.com",
      category: "HNI",
      riskProfile: "Aggressive",
      preferredChannel: "Phone",
      watchlist: [],
      notes: "Institutional mandate",
      city: "Mumbai",
      allocation: "80/20",
      reminderDate: "2026-09-05",
      priority: "High",
      lastContact: "2026-08-15",
      updateHistory: [],
      portfolio: [
        {
          id: "h_tcs",
          assetName: "Tata Consultancy Services",
          ticker: "TCS.NS",
          assetClass: "Stocks",
          quantity: "500",
          investedValue: "1200000",
          currentValue: "2000000", // 20 Lakhs out of 25 Lakhs = 80% concentration (Breaches 20% limit!)
          targetWeight: "15%",
          notes: "",
          acquiredAt: "2023-01-15",
        },
        {
          id: "h_cash",
          assetName: "Axis Liquid Fund",
          ticker: "AXIS-LIQ",
          assetClass: "Cash",
          quantity: "5000",
          investedValue: "500000",
          currentValue: "500000",
          targetWeight: "10%",
          notes: "",
          acquiredAt: "2024-01-10",
        },
      ],
    };

    // 2. Concentration Breach -> Smart Alert
    const alerts = evaluateSmartAlerts([client]);
    expect(alerts.length).toBeGreaterThanOrEqual(1);
    const concentrationAlert = alerts.find((a) => a.condition === "CONCENTRATION_BREACH");
    expect(concentrationAlert).toBeDefined();
    expect(concentrationAlert?.clientId).toBe("golden_c1");
    expect(concentrationAlert?.severity).toBe("critical"); // 80% > 35% threshold for critical
    expect(concentrationAlert?.observedValue).toBe(80);

    // 3. Smart Alert -> Advisor Action Generation & Prioritization
    const actions = scanAdvisorActions({
      clients: [client],
      activeAlerts: alerts,
      asOfDate,
    });
    expect(actions.length).toBeGreaterThanOrEqual(1);

    const rebalanceAction = actions.find(
      (a) => a.clientId === "golden_c1" && a.type === "REBALANCE_REVIEW"
    );
    expect(rebalanceAction).toBeDefined();
    expect(rebalanceAction?.priority).toBe("URGENT");
    expect(rebalanceAction?.priorityScore).toBeGreaterThanOrEqual(80);
    expect(rebalanceAction?.evidence.observedValue).toBe(80);
    expect(rebalanceAction?.deepLink.tab).toBe("Portfolios");

    // 4. Advisor Opens Portfolio Review -> In Progress
    const inProgressAction = transitionActionStatus(
      rebalanceAction!,
      "IN_PROGRESS",
      "Advisor opened scenario sandbox to test trimming TCS by 60%."
    );
    expect(inProgressAction.status).toBe("IN_PROGRESS");
    expect(inProgressAction.notes).toContain("Advisor opened scenario sandbox");

    // 5. Advisor Scenario Testing & Decision Journal Logging
    const recordedDecision = await recordDecision({
      date: "2026-09-05",
      clientId: client.id,
      clientName: client.name,
      portfolioId: `port_${client.id}`,
      issue: "Single-stock concentration: TCS constitutes 80% of mandate vs 20% limit",
      evidence: `Observed holding weight 80.0%, policy limit 20.0%. Fiduciary Risk Breached.`,
      decision: "Execute staged rebalance: Trim 60% of TCS position and reallocate to broad index fund",
      rationale: "Eliminate idiosyncratic company risk while retaining market exposure",
      advisorFollowUp: "Send trade confirmation statement to client",
      status: "RECORDED",
      actionId: rebalanceAction?.id,
    });
    expect(recordedDecision.id).toBeDefined();
    expect(recordedDecision.decision).toContain("Trim 60% of TCS position");

    // 6. Action Resolution / Completion
    const completedAction = transitionActionStatus(
      inProgressAction,
      "DONE",
      "Decision executed and committed to audit log."
    );
    expect(completedAction.status).toBe("DONE");
    expect(completedAction.completedAt).toBeDefined();

    // 7. Client Report Generation Workflow
    const reportOptions = {
      client: {
        id: client.id,
        name: client.name,
        category: client.category,
        riskProfile: client.riskProfile,
        priority: client.priority,
        portfolio: client.portfolio.map((h) => ({
          assetName: h.assetName,
          assetClass: h.assetClass,
          ticker: h.ticker,
          quantity: h.quantity,
          investedValue: h.investedValue,
          currentValue: h.currentValue,
          targetWeight: h.targetWeight,
        })),
      },
      advisorName: "Asset Array Senior Advisor",
    };

    await expect(exportClientPdfReport(reportOptions)).resolves.not.toThrow();

    // 8. Client Communication Logged
    const commActivity = await logActivity({
      clientId: client.id,
      clientName: client.name,
      type: "CLIENT_MESSAGE",
      title: "Rebalance Memo Dispatched",
      description: "Shared updated asset allocation memorandum via client preferred channel (Phone).",
      actor: "Senior Advisor",
      metadata: { channel: "Phone", reportShared: true },
    });
    expect(commActivity.type).toBe("CLIENT_MESSAGE");

    // 9. Verify Activity Timeline & Client 360 Reflections
    const clientActivities = await getActivities(client.id);
    expect(clientActivities.length).toBeGreaterThanOrEqual(2);

    // Verify DECISION_LOGGED event was automatically created
    const decisionEvent = clientActivities.find((a) => a.type === "DECISION_LOGGED");
    expect(decisionEvent).toBeDefined();
    expect(decisionEvent?.description).toContain("Trim 60% of TCS");

    // Verify Client 360 snapshot
    const snapshot = await buildClient360Snapshot({
      client,
      actions: [completedAction],
    });

    expect(snapshot.client.id).toBe("golden_c1");
    expect(snapshot.portfolioValue).toBe(2500000);
    expect(snapshot.healthScore).toBeGreaterThan(0);
    expect(snapshot.recentActivities.length).toBeGreaterThanOrEqual(2);
  });
});
