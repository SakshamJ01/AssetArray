import { getActivities, logActivity } from "../src/services/advisor/activityTimeline";
import { getDecisions, recordDecision } from "../src/services/advisor/decisionJournal";

describe("Client Fiduciary Timeline & Decision Journal", () => {
  test("logActivity appends events with actor and metadata", async () => {
    const act = await logActivity({
      clientId: "test_c1",
      clientName: "Test Client",
      type: "PORTFOLIO_REVIEW",
      title: "Quarterly Asset Allocation Audit",
      description: "Reviewed risk exposure against IPS guidelines.",
      actor: "Senior Advisor",
      metadata: { reviewedHoldings: 8 },
    });

    expect(act.id).toBeDefined();
    expect(act.type).toBe("PORTFOLIO_REVIEW");
    expect(act.actor).toBe("Senior Advisor");

    const list = await getActivities("test_c1");
    const found = list.find((a) => a.id === act.id);
    expect(found).toBeDefined();
    expect(found?.metadata?.reviewedHoldings).toBe(8);
  });

  test("recordDecision logs fiduciary decision and automatically appends to timeline", async () => {
    const dec = await recordDecision({
      date: "2026-09-05",
      clientId: "test_c2",
      clientName: "Vikram Singhania",
      portfolioId: "port_test_c2",
      issue: "High equity beta (1.35) during volatile interest rate cycle",
      evidence: "Attribution and benchmark analytics report",
      decision: "Rotate 15% equity into sovereign green bonds",
      rationale: "Lock in yields and lower portfolio downside beta to 0.95",
      advisorFollowUp: "Review execution status on September 20",
    });

    expect(dec.id).toBeDefined();
    expect(dec.status).toBe("RECORDED");

    // Check that it appears in getDecisions
    const allDecisions = await getDecisions("test_c2");
    const foundDec = allDecisions.find((d) => d.id === dec.id);
    expect(foundDec).toBeDefined();
    expect(foundDec?.decision).toContain("Rotate 15% equity");

    // Check that a DECISION_LOGGED event was automatically added to the activity timeline
    const clientActivities = await getActivities("test_c2");
    const autoLoggedEvent = clientActivities.find(
      (a) => a.type === "DECISION_LOGGED" && a.metadata?.decisionId === dec.id
    );
    expect(autoLoggedEvent).toBeDefined();
    expect(autoLoggedEvent?.description).toContain("Rotate 15% equity");
  });
});
