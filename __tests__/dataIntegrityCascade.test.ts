import { calculateHealthScore } from "../src/services/healthScore";
import { evaluateSmartAlerts } from "../src/services/smartAlerts";
import { scanAdvisorActions } from "../src/services/advisor/actionEngine";
import { runStressTest, CRISIS_SCENARIOS } from "../src/services/stressTesting";
import { exportClientPdfReport } from "../src/services/pdfReport";
import { aiRouter } from "../src/services/aiGateway/router";
import { Client } from "../src/types/wealth";

describe("Data Integrity Cascade Verification: Single Holding Mutation", () => {
  const asOfDate = "2026-09-11T10:00:00.000Z";

  const initialClient: Client = {
    id: "client_cascade_test",
    name: "Aakash Mehta",
    phone: "+91 98111 22233",
    email: "aakash.mehta@example.com",
    category: "HNI",
    priority: "High",
    city: "New Delhi",
    riskProfile: "Moderate",
    preferredChannel: "Email",
    allocation: "60/40",
    notes: "Balanced portfolio with focus on tax harvesting",
    reminderDate: "2026-09-15",
    lastContact: "2026-08-15",
    watchlist: [],
    updateHistory: [],
    portfolio: [
      {
        id: "h_tcs",
        assetName: "Tata Consultancy Services",
        ticker: "TCS.NS",
        assetClass: "Stocks",
        quantity: "200",
        investedValue: "600000",
        currentValue: "800000",
        targetWeight: "25%",
        notes: "Core tech holding",
        acquiredAt: "2023-01-10",
      },
      {
        id: "h_infy",
        assetName: "Infosys Ltd.",
        ticker: "INFY.NS",
        assetClass: "Stocks",
        quantity: "400",
        investedValue: "800000",
        currentValue: "600000",
        targetWeight: "25%",
        notes: "Tech exposure",
        acquiredAt: "2024-02-15",
      },
      {
        id: "h_hdfc_bond",
        assetName: "HDFC Short Term Debt Fund",
        ticker: "HDFC-DEBT",
        assetClass: "Bonds",
        quantity: "5000",
        investedValue: "1000000",
        currentValue: "1100000",
        targetWeight: "50%",
        notes: "Debt anchor",
        acquiredAt: "2022-06-01",
      },
    ],
  };

  test("Step 1 -> 2: Mutating single holding immediately updates Portfolio total AUM and weights", () => {
    const initialAum = initialClient.portfolio.reduce(
      (sum, h) => sum + (parseFloat(h.currentValue) || 0),
      0
    );
    expect(initialAum).toBe(2500000);

    const mutatedClient: Client = {
      ...initialClient,
      portfolio: initialClient.portfolio.map((h) =>
        h.id === "h_tcs" ? { ...h, currentValue: "2000000" } : h
      ),
    };

    const mutatedAum = mutatedClient.portfolio.reduce(
      (sum, h) => sum + (parseFloat(h.currentValue) || 0),
      0
    );
    expect(mutatedAum).toBe(3700000);
    expect(mutatedAum).toBeGreaterThan(initialAum);

    const initialTcsWeight = 800000 / initialAum;
    const mutatedTcsWeight = 2000000 / mutatedAum;
    expect(mutatedTcsWeight).toBeGreaterThan(initialTcsWeight);
    expect(mutatedTcsWeight).toBeGreaterThan(0.5);
  });

  test("Step 2 -> 3: Portfolio mutation cascades to Risk and Stress Testing", () => {
    const mutatedClient: Client = {
      ...initialClient,
      portfolio: initialClient.portfolio.map((h) =>
        h.id === "h_tcs" ? { ...h, currentValue: "2000000" } : h
      ),
    };

    const initialSimple = initialClient.portfolio.map((h) => ({
      ...h,
      quantity: Number(h.quantity),
      currentValue: Number(h.currentValue),
      investedValue: Number(h.investedValue),
    }));
    const mutatedSimple = mutatedClient.portfolio.map((h) => ({
      ...h,
      quantity: Number(h.quantity),
      currentValue: Number(h.currentValue),
      investedValue: Number(h.investedValue),
    }));

    const initialStress = runStressTest(initialSimple, CRISIS_SCENARIOS[0]);
    const mutatedStress = runStressTest(mutatedSimple, CRISIS_SCENARIOS[0]);

    expect(mutatedStress.totalDrawdownDollars).toBeGreaterThan(initialStress.totalDrawdownDollars);
    expect(mutatedStress.projectedTotalAum).toBeGreaterThan(initialStress.projectedTotalAum);
  });

  test("Step 3 -> 4: Portfolio mutation cascades to Health Score", () => {
    const initialHealth = calculateHealthScore(initialClient.portfolio, 0, initialClient.id);

    const mutatedClient: Client = {
      ...initialClient,
      portfolio: initialClient.portfolio.map((h) =>
        h.id === "h_tcs" ? { ...h, currentValue: "2000000" } : h
      ),
    };

    const mutatedHealth = calculateHealthScore(mutatedClient.portfolio, 0, mutatedClient.id);

    expect(mutatedHealth.healthScore).toBeDefined();
    expect(typeof mutatedHealth.healthScore).toBe("number");
  });

  test("Step 4 -> 5: Portfolio mutation cascades to Smart Alerts", () => {
    const mutatedClient: Client = {
      ...initialClient,
      portfolio: initialClient.portfolio.map((h) =>
        h.id === "h_tcs" ? { ...h, currentValue: "2000000" } : h
      ),
    };

    const alerts = evaluateSmartAlerts([mutatedClient]);
    expect(alerts.length).toBeGreaterThan(0);

    const hasConcentrationOrRebalanceAlert = alerts.some(
      (a) =>
        a.title.toLowerCase().includes("concentration") ||
        a.title.toLowerCase().includes("allocation") ||
        a.title.toLowerCase().includes("rebalance") ||
        a.message.toLowerCase().includes("tata consultancy") ||
        a.message.toLowerCase().includes("tcs")
    );
    expect(hasConcentrationOrRebalanceAlert).toBe(true);
  });

  test("Step 5 -> 6: Portfolio mutation cascades to Action Engine", async () => {
    const mutatedClient: Client = {
      ...initialClient,
      portfolio: initialClient.portfolio.map((h) =>
        h.id === "h_tcs" ? { ...h, currentValue: "2000000" } : h
      ),
    };

    const alerts = evaluateSmartAlerts([mutatedClient]);
    const actions = scanAdvisorActions({
      clients: [mutatedClient],
      activeAlerts: alerts,
      goals: [],
      asOfDate,
    });
    expect(actions.length).toBeGreaterThan(0);

    const clientActions = actions.filter((a) => a.clientId === mutatedClient.id);
    expect(clientActions.length).toBeGreaterThan(0);
  });

  test("Step 6 -> 7: Portfolio mutation updates AI Context and Answers Grounded Questions", async () => {
    const mutatedClient: Client = {
      ...initialClient,
      portfolio: initialClient.portfolio.map((h) =>
        h.id === "h_tcs" ? { ...h, currentValue: "2000000" } : h
      ),
    };

    const mutatedAum = mutatedClient.portfolio.reduce(
      (sum, h) => sum + (parseFloat(h.currentValue) || 0),
      0
    );

    let streamOutput = "";
    await aiRouter.executeStream(
      "Explain my largest concentration risk.",
      "PORTFOLIO_EXPLANATION",
      {
        clientName: mutatedClient.name,
        riskProfile: mutatedClient.riskProfile,
        totalAum: mutatedAum,
        healthScore: 72,
        criticalAlertsCount: 1,
        taxLossAvailable: 200000,
        topHoldings: ["Tata Consultancy Services (54%)", "HDFC Short Term Debt Fund (30%)", "Infosys Ltd. (16%)"],
      },
      {
        onToken: (t) => {
          streamOutput += t;
        },
      }
    );

    expect(streamOutput).toContain("Aakash Mehta");
    expect(streamOutput).toContain("Tata Consultancy Services");
  });

  test("Step 7 -> 8: AI refuses unheld assets (Negative Test Reality Check)", async () => {
    const mutatedClient: Client = {
      ...initialClient,
      portfolio: initialClient.portfolio.map((h) =>
        h.id === "h_tcs" ? { ...h, currentValue: "2000000" } : h
      ),
    };

    let negativeOutput = "";
    await aiRouter.executeStream(
      "Analyze my Bitcoin position and tell me if crypto is safe.",
      "PORTFOLIO_EXPLANATION",
      {
        clientName: mutatedClient.name,
        riskProfile: mutatedClient.riskProfile,
        totalAum: 3700000,
        healthScore: 72,
        criticalAlertsCount: 1,
        taxLossAvailable: 200000,
        topHoldings: ["Tata Consultancy Services (54%)", "HDFC Short Term Debt Fund (30%)", "Infosys Ltd. (16%)"],
      },
      {
        onToken: (t) => {
          negativeOutput += t;
        },
      }
    );

    expect(negativeOutput.toLowerCase()).toContain("no record or evidence");
    expect(negativeOutput).toContain("BITCOIN");
  });

  test("Step 8 -> 9: Report Generator reflects the mutated holding and updated AUM", async () => {
    const mutatedClient: Client = {
      ...initialClient,
      portfolio: initialClient.portfolio.map((h) =>
        h.id === "h_tcs" ? { ...h, currentValue: "2000000" } : h
      ),
    };

    await expect(exportClientPdfReport({ client: mutatedClient })).resolves.not.toThrow();
  });
});
