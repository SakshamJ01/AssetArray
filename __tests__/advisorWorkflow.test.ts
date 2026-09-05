import {
  buildCanonicalKey,
  scanAdvisorActions,
  snoozeAction,
  transitionActionStatus,
} from "../src/services/advisor/actionEngine";
import { AdvisorAction } from "../src/types/advisor";
import { Client, SmartAlert } from "../src/types/wealth";

describe("Advisor OS Workflow Engine & Deduplication", () => {
  const asOfDate = "2026-09-05T10:00:00.000Z";

  const mockClients: Client[] = [
    {
      id: "c1",
      name: "Rahul Mehta",
      phone: "9876543210",
      email: "rahul@example.com",
      category: "HNI",
      riskProfile: "Aggressive",
      preferredChannel: "Phone",
      watchlist: [],
      notes: "Quarterly review pending",
      city: "Mumbai",
      allocation: "70/30",
      reminderDate: "2026-09-05",
      priority: "High",
      lastContact: "2026-08-01",
      updateHistory: [],
      portfolio: [
        {
          id: "h1",
          assetName: "Tata Consultancy Services",
          ticker: "TCS.NS",
          assetClass: "Stocks",
          quantity: "200",
          investedValue: "600000",
          currentValue: "850000",
          targetWeight: "15%",
          notes: "",
        },
      ],
    },
  ];

  const mockAlerts: SmartAlert[] = [
    {
      id: "alert_conc_c1_h1",
      clientId: "c1",
      clientName: "Rahul Mehta",
      condition: "CONCENTRATION_BREACH",
      title: "Concentration Limit Exceeded",
      message: "TCS constitutes 100% of Rahul Mehta's portfolio",
      severity: "critical",
      timestamp: asOfDate,
      acknowledged: false,
    },
  ];

  test("buildCanonicalKey generates deterministic composite key", () => {
    const key = buildCanonicalKey("c1", "smart_alert", "alert_conc_c1_h1", "REBALANCE_REVIEW");
    expect(key).toBe("c1:smart_alert:alert_conc_c1_h1:REBALANCE_REVIEW");
  });

  test("scanAdvisorActions deduplicates actions across runs", () => {
    const actionsRun1 = scanAdvisorActions({
      clients: mockClients,
      activeAlerts: mockAlerts,
      asOfDate,
    });

    const actionsRun2 = scanAdvisorActions({
      clients: mockClients,
      activeAlerts: mockAlerts,
      persistedActions: actionsRun1,
      asOfDate,
    });

    // Should not produce duplicate actions for the same alert
    const alertActions = actionsRun2.filter((a) => a.canonicalKey.includes("alert_conc_c1_h1"));
    expect(alertActions.length).toBe(1);
  });

  test("transitionActionStatus updates status and records timestamp on completion", () => {
    const actions = scanAdvisorActions({
      clients: mockClients,
      activeAlerts: mockAlerts,
      asOfDate,
    });
    const initial = actions[0];
    expect(initial.status).toBe("OPEN");

    const inProgress = transitionActionStatus(initial, "IN_PROGRESS", "Advisor opened sandbox");
    expect(inProgress.status).toBe("IN_PROGRESS");
    expect(inProgress.notes).toContain("Advisor opened sandbox");
    expect(inProgress.completedAt).toBeUndefined();

    const done = transitionActionStatus(inProgress, "DONE", "Rebalance order approved");
    expect(done.status).toBe("DONE");
    expect(done.completedAt).toBeDefined();
  });

  test("snoozeAction sets SNOOZED status and snoozedUntil window", () => {
    const actions = scanAdvisorActions({
      clients: mockClients,
      activeAlerts: mockAlerts,
      asOfDate,
    });
    const snoozed = snoozeAction(actions[0], 24);

    expect(snoozed.status).toBe("SNOOZED");
    expect(snoozed.snoozedUntil).toBeDefined();
    expect(new Date(snoozed.snoozedUntil!).getTime()).toBeGreaterThan(Date.now());
  });

  test("persisted status is preserved when re-scanning active alerts", () => {
    const actions = scanAdvisorActions({
      clients: mockClients,
      activeAlerts: mockAlerts,
      asOfDate,
    });

    // Mark as in-progress with notes
    const updated = transitionActionStatus(actions[0], "IN_PROGRESS", "Working on allocation");

    // Re-scan with persisted actions passed in
    const reScanned = scanAdvisorActions({
      clients: mockClients,
      activeAlerts: mockAlerts,
      persistedActions: [updated],
      asOfDate,
    });

    const matching = reScanned.find((a) => a.canonicalKey === updated.canonicalKey);
    expect(matching).toBeDefined();
    expect(matching?.status).toBe("IN_PROGRESS");
    expect(matching?.notes).toContain("Working on allocation");
  });
});
