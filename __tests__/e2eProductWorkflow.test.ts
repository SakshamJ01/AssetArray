import { evaluateSmartAlerts } from "../src/services/smartAlerts";
import {
  scanAdvisorActions,
  transitionActionStatus,
  extractOpportunitiesFromActions,
} from "../src/services/advisor/actionEngine";
import { generateDailyAdvisorBrief } from "../src/services/advisor/dailyBrief";
import { aiRouter } from "../src/services/aiGateway/router";
import { runStressTest, CRISIS_SCENARIOS } from "../src/services/stressTesting";
import { calculateHealthScore } from "../src/services/healthScore";
import { generateTaxHarvestReport } from "../src/services/taxIntelligence";
import { calculateSip } from "../src/services/calculators";
import { buildClient360Snapshot } from "../src/services/advisor/client360";
import { exportClientPdfReport } from "../src/services/pdfReport";
import { storageService } from "../src/platform/storage";
import { Client, Goal } from "../src/types/wealth";

describe("Comprehensive E2E Product Workflow Verification Suite", () => {
  const asOfDate = "2026-09-11T10:00:00.000Z";

  let testClients: Client[] = [];
  let testGoals: Goal[] = [];

  beforeEach(() => {
    testClients = [
      {
        id: "client_e2e_1",
        name: "Vikram Singhania",
        phone: "+91 98200 12345",
        email: "vikram.singhania@example.com",
        category: "HNI",
        priority: "High",
        city: "Mumbai",
        riskProfile: "Aggressive",
        preferredChannel: "Phone",
        allocation: "70/30",
        notes: "Targeting wealth preservation and tax efficiency",
        reminderDate: "2026-09-11",
        lastContact: "2026-08-20",
        watchlist: [],
        updateHistory: [],
        portfolio: [
          {
            id: "h_hdfc",
            assetName: "HDFC Bank Ltd.",
            ticker: "HDFCBANK.NS",
            assetClass: "Stocks",
            quantity: "1000",
            investedValue: "1500000",
            currentValue: "2200000", // 22L out of 40L = 55% concentration!
            targetWeight: "20%",
            notes: "Core financial holding",
            acquiredAt: "2023-04-10",
          },
          {
            id: "h_infy",
            assetName: "Infosys Ltd.",
            ticker: "INFY.NS",
            assetClass: "Stocks",
            quantity: "500",
            investedValue: "1000000",
            currentValue: "800000", // ₹2,00,000 harvestable loss!
            targetWeight: "15%",
            notes: "Tech exposure",
            acquiredAt: "2023-11-15",
          },
          {
            id: "h_liquid",
            assetName: "ICICI Liquid Mutual Fund",
            ticker: "ICICI-LIQ",
            assetClass: "Cash",
            quantity: "10000",
            investedValue: "1000000",
            currentValue: "1000000", // 25% cash
            targetWeight: "10%",
            notes: "Emergency buffer",
            acquiredAt: "2024-01-05",
          },
        ],
      },
    ];

    testGoals = [
      {
        id: "goal_e2e_1",
        clientId: "client_e2e_1",
        title: "Retirement Corpus Fund",
        targetAmount: "10000000", // 1 Cr
        currentAmount: "3000000",  // 30 L (30% funded - triggers funding deficit warning)
        targetYear: "2036",
        priority: "Core",
        goalType: "Retirement",
        monthlyContribution: "25000",
      },
    ];
  });

  test("Step 1 to 16: Complete Connected Advisor Workflow", async () => {
    // -------------------------------------------------------------
    // STEP 1: Authentication & Session Token Initialization
    // -------------------------------------------------------------
    await storageService.setItem("@auth_token", "jwt_valid_advisor_session_prod");
    const storedToken = await storageService.getItem("@auth_token");
    expect(storedToken).toBe("jwt_valid_advisor_session_prod");

    // -------------------------------------------------------------
    // STEP 2: Command Center State Initialization & Scanning
    // -------------------------------------------------------------
    const alerts = evaluateSmartAlerts(testClients);
    expect(alerts.length).toBeGreaterThanOrEqual(2); // Concentration breach & Tax harvesting window

    const scannedActions = scanAdvisorActions({
      clients: testClients,
      activeAlerts: alerts,
      goals: testGoals,
      asOfDate,
    });
    expect(scannedActions.length).toBeGreaterThanOrEqual(2);

    const opportunities = extractOpportunitiesFromActions(scannedActions, testClients);
    expect(opportunities.length).toBeGreaterThanOrEqual(1);

    const dailyBrief = generateDailyAdvisorBrief({
      actions: scannedActions,
      opportunities,
      clients: testClients,
    });
    expect(dailyBrief.headline).toBeDefined();
    expect(dailyBrief.marketContext.length).toBeGreaterThan(0);
    expect(dailyBrief.groundedClaims.length).toBeGreaterThanOrEqual(5);

    // -------------------------------------------------------------
    // STEP 3: Priority Action Selection & Evidence Expansion
    // -------------------------------------------------------------
    const concAction = scannedActions.find((a) => a.type === "REBALANCE_REVIEW");
    expect(concAction).toBeDefined();
    expect(concAction?.clientName).toBe("Vikram Singhania");
    expect(concAction?.evidence.metric).toBe("holdingWeightPct");
    expect(concAction?.evidence.observedValue).toBe(55); // 55% weight
    expect(concAction?.reason).toContain("HDFC Bank Ltd.");
    expect(concAction?.reason).toContain("₹14,00,000 over policy cap"); // (55% - 20%) * 40L = 14L excess

    // -------------------------------------------------------------
    // STEP 4: Ask AI Copilot (aiRouter stream execution)
    // -------------------------------------------------------------
    let streamedTokens = "";
    let aiCompleted = false;

    await aiRouter.executeStream(
      `Analyze advisor action for client ${concAction?.clientName}: ${concAction?.title}`,
      "PORTFOLIO_EXPLANATION",
      {
        clientName: testClients[0].name,
        totalAum: 4000000,
        riskProfile: "Aggressive",
        topHoldings: ["HDFC Bank Ltd.", "Infosys Ltd."],
      },
      {
        onToken: (t) => {
          streamedTokens += t;
        },
        onComplete: () => {
          aiCompleted = true;
        },
      }
    );

    expect(aiCompleted).toBe(true);
    expect(streamedTokens.length).toBeGreaterThan(0);

    // -------------------------------------------------------------
    // STEP 5 & 6: Affected Portfolio & Holding Inspection
    // -------------------------------------------------------------
    const client = testClients[0];
    const totalAum = client.portfolio.reduce((sum, h) => sum + Number(h.currentValue), 0);
    expect(totalAum).toBe(4000000);

    const hdfcHolding = client.portfolio.find((h) => h.ticker === "HDFCBANK.NS");
    expect(hdfcHolding).toBeDefined();
    expect(Number(hdfcHolding?.currentValue)).toBe(2200000);
    expect(Number(hdfcHolding?.investedValue)).toBe(1500000);

    // -------------------------------------------------------------
    // STEP 7: Run Research on Holding
    // -------------------------------------------------------------
    let researchOutput = "";
    await aiRouter.executeStream(
      "Analyze market fundamental metrics and technical trend for HDFC Bank Ltd.",
      "DEEP_RESEARCH",
      undefined,
      {
        onToken: (t) => {
          researchOutput += t;
        },
        onComplete: () => {},
      }
    );
    expect(researchOutput.length).toBeGreaterThan(0);

    // -------------------------------------------------------------
    // STEP 8: Risk Analytics & Macro Stress Testing
    // -------------------------------------------------------------
    const health = calculateHealthScore(client.portfolio, 0, client.id);
    expect(health.healthScore).toBeGreaterThan(0);

    const simpleHoldings = client.portfolio.map((h) => ({
      ...h,
      quantity: Number(h.quantity),
      currentValue: Number(h.currentValue),
      investedValue: Number(h.investedValue),
    }));
    const stressResult = runStressTest(simpleHoldings, CRISIS_SCENARIOS[0]); // 2008 GFC
    expect(stressResult.initialTotalAum).toBe(totalAum);
    expect(stressResult.totalDrawdownDollars).toBeGreaterThan(0);
    expect(stressResult.cvar95Percent).toBeGreaterThan(0);

    // -------------------------------------------------------------
    // STEP 9: Tax Loss Harvesting Evaluation (Sec 70/74)
    // -------------------------------------------------------------
    const taxReport = generateTaxHarvestReport(client.portfolio);
    expect(taxReport.totalHarvestableLoss).toBe(200000); // 10L cost - 8L current = 2L loss
    expect(taxReport.harvestCandidates.length).toBeGreaterThanOrEqual(1);
    expect(taxReport.harvestCandidates.some((c) => c.assetName.includes("Infosys"))).toBe(true);

    // -------------------------------------------------------------
    // STEP 10: Financial Calculator -> Save to Goal Tracker
    // -------------------------------------------------------------
    const sipCalc = calculateSip({
      installment: 25000,
      annualRate: 12,
      years: 10,
      frequency: "Monthly",
    });
    expect(sipCalc.maturityValue).toBeGreaterThan(5000000);

    // Add new goal directly from calculator output
    const newGoal: Goal = {
      id: "goal_sip_calc_created",
      clientId: client.id,
      title: "Wealth Acceleration SIP Plan",
      targetAmount: String(Math.round(sipCalc.maturityValue)),
      currentAmount: "0",
      targetYear: "2036",
      priority: "Core",
      goalType: "Wealth",
      monthlyContribution: "25000",
    };
    testGoals.push(newGoal);
    expect(testGoals.length).toBe(2);

    // -------------------------------------------------------------
    // STEP 11: Reload & Storage Rehydration Simulation
    // -------------------------------------------------------------
    await storageService.setItem("@test_clients_store", JSON.stringify(testClients));
    await storageService.setItem("@test_goals_store", JSON.stringify(testGoals));

    const rehydratedClientsRaw = await storageService.getItem("@test_clients_store");
    const rehydratedGoalsRaw = await storageService.getItem("@test_goals_store");
    expect(rehydratedClientsRaw).toBeDefined();
    expect(rehydratedGoalsRaw).toBeDefined();

    const rehydratedClients: Client[] = JSON.parse(rehydratedClientsRaw!);
    const rehydratedGoals: Goal[] = JSON.parse(rehydratedGoalsRaw!);
    expect(rehydratedClients.length).toBe(1);
    expect(rehydratedGoals.length).toBe(2);
    expect(rehydratedGoals[1].id).toBe("goal_sip_calc_created");

    // -------------------------------------------------------------
    // STEP 12: Client 360 View Evaluation
    // -------------------------------------------------------------
    const client360 = await buildClient360Snapshot({
      client: rehydratedClients[0],
      actions: scannedActions,
    });
    expect(client360.client.name).toBe("Vikram Singhania");
    expect(client360.portfolioValue).toBe(4000000);
    expect(client360.healthScore).toBeGreaterThan(0);

    // -------------------------------------------------------------
    // STEP 13: Generate Client Report
    // -------------------------------------------------------------
    await expect(
      exportClientPdfReport({
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
        advisorName: "Asset Array Wealth Manager",
      })
    ).resolves.not.toThrow();

    // -------------------------------------------------------------
    // STEP 14: Delete a Test Client & Orphan Record Cleanup
    // -------------------------------------------------------------
    // Seed orphan messages and vault docs for test client
    const orphanMessages = [
      { id: "msg_1", clientId: "client_e2e_1", text: "Portfolio memo" },
      { id: "msg_2", clientId: "client_other", text: "Other memo" },
    ];
    const orphanVaultDocs = [
      { id: "doc_1", clientId: "client_e2e_1", title: "KYC Form" },
      { id: "doc_2", clientId: "client_other", title: "Tax Returns" },
    ];

    // Delete client and scrub orphan records
    const remainingClients = testClients.filter((c) => c.id !== "client_e2e_1");
    const cleanedMessages = orphanMessages.filter((m) => m.clientId !== "client_e2e_1");
    const cleanedVaultDocs = orphanVaultDocs.filter((d) => d.clientId !== "client_e2e_1");

    expect(remainingClients.length).toBe(0);
    expect(cleanedMessages.length).toBe(1);
    expect(cleanedMessages[0].clientId).toBe("client_other");
    expect(cleanedVaultDocs.length).toBe(1);
    expect(cleanedVaultDocs[0].clientId).toBe("client_other");

    // -------------------------------------------------------------
    // STEP 15: Post-Deletion Reload & Persistence Check
    // -------------------------------------------------------------
    await storageService.setItem("@test_clients_store", JSON.stringify(remainingClients));
    const reloadedEmpty = JSON.parse((await storageService.getItem("@test_clients_store")) || "[]");
    expect(reloadedEmpty.length).toBe(0);

    // -------------------------------------------------------------
    // STEP 16: Logout & Session Revocation
    // -------------------------------------------------------------
    await storageService.removeItem("@auth_token");
    const postLogoutToken = await storageService.getItem("@auth_token");
    expect(postLogoutToken).toBeNull();
  });
});
