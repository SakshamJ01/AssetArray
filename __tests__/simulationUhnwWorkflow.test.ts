import { runStressTest, CRISIS_SCENARIOS } from "../src/services/stressTesting";
import { calculateRebalance, TARGET_MODELS, SimpleHolding } from "../src/services/rebalancer";
import { calculateHealthScore } from "../src/services/healthScore";
import { calculateAttribution, STANDARD_BENCHMARKS } from "../src/services/attribution";
import { generateTaxHarvestReport } from "../src/services/taxIntelligence";
import { runMonteCarloSimulation, MonteCarloConfig } from "../src/services/monteCarlo";
import { PortfolioHolding } from "../src/types/wealth";

describe("Institutional UHNW Client End-to-End Simulation Workflow", () => {
  // Model a ₹12.60 Cr Private Wealth Family Office Portfolio
  const uhnwHoldings: PortfolioHolding[] = [
    {
      id: "h-hdfc",
      assetName: "HDFC Bank Ltd",
      ticker: "HDFCBANK.NS",
      assetClass: "Stocks",
      quantity: "20000",
      investedValue: "28000000",
      currentValue: "34500000",
      targetWeight: "25",
      acquisitionDate: "2023-03-15",
      notes: "Core Tier-1 Banking Compounder",
    },
    {
      id: "h-ril",
      assetName: "Reliance Industries Ltd",
      ticker: "RELIANCE.NS",
      assetClass: "Stocks",
      quantity: "10000",
      investedValue: "22000000",
      currentValue: "29000000",
      targetWeight: "20",
      acquisitionDate: "2023-06-20",
      notes: "Energy & Retail Conglomerate",
    },
    {
      id: "h-infy",
      assetName: "Infosys Ltd",
      ticker: "INFY.NS",
      assetClass: "Stocks",
      quantity: "11000",
      investedValue: "18000000",
      currentValue: "15500000", // ₹25L unrealized loss candidate
      targetWeight: "15",
      acquisitionDate: "2026-03-01", // Recent acquisition (< 12 months = STCG 20% shield)
      notes: "IT Services — section 70 tax harvesting candidate",
    },
    {
      id: "h-tcs",
      assetName: "Tata Consultancy Services",
      ticker: "TCS.NS",
      assetClass: "Stocks",
      quantity: "4000",
      investedValue: "12000000",
      currentValue: "14500000",
      targetWeight: "10",
      acquisitionDate: "2023-01-10",
      notes: "High ROE Software Pureplay",
    },
    {
      id: "h-gold",
      assetName: "Sovereign Gold Bonds 2031",
      ticker: "SGB2031",
      assetClass: "Alternatives",
      quantity: "2000",
      investedValue: "11000000",
      currentValue: "13500000",
      targetWeight: "10",
      acquisitionDate: "2023-11-05",
      notes: "Sovereign hedge against inflation & FX depreciation",
    },
    {
      id: "h-bharat-bond",
      assetName: "Bharat Bond ETF April 2030",
      ticker: "BHARATBOND30",
      assetClass: "Bonds",
      quantity: "100000",
      investedValue: "10000000",
      currentValue: "10800000",
      targetWeight: "10",
      acquisitionDate: "2023-04-18",
      notes: "AAA-rated Central Public Sector Enterprise Debt",
    },
    {
      id: "h-icici-corp",
      assetName: "ICICI Prudential Corporate Bond Fund",
      ticker: "ICICICORPBOND",
      assetClass: "Bonds",
      quantity: "35000",
      investedValue: "8000000",
      currentValue: "8200000",
      targetWeight: "10",
      acquisitionDate: "2024-02-12",
      notes: "High Liquidity Short-Duration Yield",
    },
  ];

  const simpleHoldings: SimpleHolding[] = uhnwHoldings.map((h) => ({
    id: h.id,
    assetName: h.assetName,
    assetClass: h.assetClass === "Stocks" ? "Equity" : h.assetClass === "Bonds" ? "Debt" : "Alternative",
    investedValue: Number(h.investedValue),
    currentValue: Number(h.currentValue),
    ticker: h.ticker,
  }));

  const totalAum = simpleHoldings.reduce((sum, h) => sum + h.currentValue, 0);

  test("1. Portfolio Initialization & AUM Verification", () => {
    // Total AUM: 3.45 + 2.90 + 1.55 + 1.45 + 1.35 + 1.08 + 0.82 = 12.60 Cr (126,000,000)
    expect(totalAum).toBe(126000000);
    expect(simpleHoldings.length).toBe(7);
  });

  test("2. Macro Stress-Testing & Crisis Resilience", () => {
    const gfcScenario = CRISIS_SCENARIOS.find((s) => s.id === "gfc_2008")!;
    const stressResult = runStressTest(simpleHoldings, gfcScenario);

    expect(stressResult.initialTotalAum).toBe(126000000);
    expect(stressResult.projectedTotalAum).toBeLessThan(126000000);
    expect(stressResult.totalDrawdownDollars).toBeGreaterThan(0);
    expect(typeof stressResult.resilienceRating).toBe("string");
    expect(stressResult.breakdown.length).toBeGreaterThanOrEqual(3);
  });

  test("3. Fiduciary Rebalancing & Target Model Allocation", () => {
    // Balanced Fiduciary Model: 50% Equity / 30% Debt / 20% Alternative
    const balancedModel = TARGET_MODELS.find((m) => m.id === "balanced_wealth")!;
    const rebalance = calculateRebalance(simpleHoldings, balancedModel, 2.0);

    expect(rebalance.totalPortfolioValue).toBe(126000000);
    expect(rebalance.isRebalanceRecommended).toBe(true); // Equity is currently ~74%, target is 50%

    const equityItem = rebalance.items.find((i) => i.assetClass === "Equity");
    expect(equityItem?.action).toBe("SELL");
    expect(equityItem?.drift).toBeGreaterThan(0);

    const debtItem = rebalance.items.find((i) => i.assetClass === "Debt");
    expect(debtItem?.action).toBe("BUY");
  });

  test("4. Section 70 / 74 Tax Loss Harvesting Intelligence", () => {
    const taxReport = generateTaxHarvestReport(
      uhnwHoldings,
      { shortTerm: 5000000, longTerm: 12000000 },
      "uhnw-client-001"
    );

    expect(taxReport.totalHarvestableLoss).toBe(2500000); // Infosys: 1.80 Cr invested - 1.55 Cr current = 25 Lakh loss
    expect(taxReport.estimatedImmediateTaxSavings).toBe(520000); // 20% STCG + 4% cess (20.8%) of ₹25L = ₹5,20,000 statutory tax savings
    expect(taxReport.harvestCandidates.length).toBe(7);

    const infyCandidate = taxReport.harvestCandidates.find((c) => c.holdingId === "h-infy");
    expect(infyCandidate?.unrealizedGainLoss).toBe(-2500000);
  });

  test("5. Brinson Attribution & Institutional Multi-Asset Health Score", () => {
    const health = calculateHealthScore(uhnwHoldings, 0, "uhnw-client-001");
    expect(health.healthScore).toBeGreaterThan(50);
    expect(health.detailedFactors).toBeDefined();

    const attribution = calculateAttribution(
      uhnwHoldings,
      STANDARD_BENCHMARKS.BALANCED_HYBRID,
      "uhnw-client-001"
    );
    expect(attribution.portfolioReturn).toBeDefined();
    expect(attribution.benchmarkReturn).toBeDefined();
    expect(attribution.totalActiveReturn).toBeDefined();
    expect(attribution.summary.allocationEffect).toBeDefined();
  });

  test("6. Monte Carlo 1,000-Trial Wealth Compounding Simulation", () => {
    const config: MonteCarloConfig = {
      initialCapital: totalAum,
      monthlyContribution: 500000, // ₹5 Lakhs monthly SIP
      years: 15,
      targetCorpus: 500000000, // ₹50 Cr target
      expectedAnnualReturn: 0.125,
      annualVolatility: 0.14,
      inflationRate: 0.055,
      numSimulations: 1000,
      seed: 42,
    };

    const mcResult = runMonteCarloSimulation(config);

    expect(mcResult.percentiles.p50).toBeGreaterThan(totalAum);
    expect(mcResult.percentiles.p90).toBeGreaterThan(mcResult.percentiles.p50);
    expect(mcResult.percentiles.p10).toBeGreaterThan(0);
    expect(mcResult.probabilityOfSuccess).toBeGreaterThanOrEqual(0);
    expect(mcResult.simulations).toBe(1000);
  });
});
