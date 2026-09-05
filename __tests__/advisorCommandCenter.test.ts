import {
  extractOpportunitiesFromActions,
  scanAdvisorActions,
} from "../src/services/advisor/actionEngine";
import { Client, Goal, SmartAlert } from "../src/types/wealth";

describe("Advisor Command Center Aggregation & Scanning", () => {
  const asOfDate = "2026-09-05T10:00:00.000Z";

  const clients: Client[] = [
    {
      id: "c1",
      name: "Rahul Mehta",
      phone: "9876543210",
      email: "rahul@example.com",
      category: "HNI",
      riskProfile: "Aggressive",
      preferredChannel: "Phone",
      watchlist: [],
      notes: "High net worth mandate",
      city: "Mumbai",
      allocation: "70/30",
      reminderDate: "2026-09-05",
      priority: "High",
      lastContact: "2026-08-01",
      updateHistory: [],
      portfolio: [
        {
          id: "h1",
          assetName: "TCS",
          ticker: "TCS.NS",
          assetClass: "Stocks",
          quantity: "100",
          investedValue: "300000",
          currentValue: "400000",
          targetWeight: "10%",
          notes: "",
        },
        {
          id: "h2",
          assetName: "HDFC Liquid Fund",
          ticker: "HDFC-LIQ",
          assetClass: "Cash",
          quantity: "500",
          investedValue: "300000",
          currentValue: "300000",
          targetWeight: "10%",
          notes: "",
        },
      ],
    },
    {
      id: "c2",
      name: "Ananya Sharma",
      phone: "9876543211",
      email: "ananya@example.com",
      category: "Retail",
      riskProfile: "Moderate",
      preferredChannel: "Email",
      watchlist: [],
      notes: "",
      city: "Delhi",
      allocation: "50/50",
      reminderDate: "2026-09-01", // Overdue
      priority: "Medium",
      lastContact: "2026-07-15",
      updateHistory: [],
      portfolio: [
        {
          id: "h3",
          assetName: "Infosys",
          ticker: "INFY.NS",
          assetClass: "Stocks",
          quantity: "50",
          investedValue: "100000",
          currentValue: "80000", // Capital loss
          targetWeight: "20%",
          notes: "",
        },
      ],
    },
  ];

  const alerts: SmartAlert[] = [
    {
      id: "alert_tax_c2",
      clientId: "c2",
      clientName: "Ananya Sharma",
      condition: "TAX_HARVEST_WINDOW",
      title: "Tax Harvesting Opportunity",
      message: "₹20,000 in harvestable capital losses available",
      severity: "info",
      timestamp: asOfDate,
      acknowledged: false,
    },
  ];

  const goals: Goal[] = [
    {
      id: "g1",
      clientId: "c2",
      title: "Retirement Milestone",
      goalType: "Retirement",
      targetAmount: "10000000",
      currentAmount: "1500000", // 15% funded (< 40%)
      targetYear: "2040",
      monthlyContribution: "25000",
      priority: "Core",
    },
  ];

  test("scanAdvisorActions captures smart alerts, overdue reminders, and goal deficits", () => {
    const actions = scanAdvisorActions({
      clients,
      activeAlerts: alerts,
      goals,
      asOfDate,
    });

    expect(actions.length).toBeGreaterThanOrEqual(4);

    // Verify tax review action
    const taxAction = actions.find((a) => a.type === "TAX_REVIEW");
    expect(taxAction).toBeDefined();
    expect(taxAction?.clientId).toBe("c2");
    expect(taxAction?.deepLink.tab).toBe("Portfolios");

    // Verify overdue follow-up action
    const followupAction = actions.find((a) => a.type === "CLIENT_FOLLOWUP");
    expect(followupAction).toBeDefined();
    expect(followupAction?.clientId).toBe("c2");
    expect(followupAction?.reason).toContain("overdue");

    // Verify goal deficit action
    const goalAction = actions.find((a) => a.type === "GOAL_REVIEW");
    expect(goalAction).toBeDefined();
    expect(goalAction?.clientId).toBe("c2");
    expect(goalAction?.deepLink.tab).toBe("Tools");

    // Verify HNI mandate review
    const mandateAction = actions.find(
      (a) => a.type === "PORTFOLIO_REVIEW" && a.clientId === "c1"
    );
    expect(mandateAction).toBeDefined();
  });

  test("extractOpportunitiesFromActions identifies positive wealth opportunities", () => {
    const actions = scanAdvisorActions({
      clients,
      activeAlerts: alerts,
      goals,
      asOfDate,
    });

    const opps = extractOpportunitiesFromActions(actions, clients);

    expect(opps.length).toBeGreaterThanOrEqual(2);

    // 1. Tax harvesting
    const taxOpp = opps.find((o) => o.type === "TAX_HARVESTING");
    expect(taxOpp).toBeDefined();

    // 2. Idle cash drag (Rahul Mehta has ₹3L cash out of ₹7L = 42.8% > 25%)
    const cashOpp = opps.find((o) => o.type === "IDLE_CASH_DRAG");
    expect(cashOpp).toBeDefined();
    expect(cashOpp?.clientId).toBe("c1");
    expect(cashOpp?.description).toContain("held in cash");
  });
});
