import { calculateXIRR, calculateTWR } from "../src/services/performance";
import { calculateDrawdown } from "../src/services/risk/drawdown";
import { calculateBenchmarkAnalytics } from "../src/services/risk/benchmarkAnalytics";
import { calculateAttribution, STANDARD_BENCHMARKS } from "../src/services/attribution";
import { evaluateTaxLots } from "../src/services/tax/taxLots";
import { generateInstitutionalTaxReport } from "../src/services/tax/taxHarvesting";
import { calculateUnifiedNetWorth } from "../src/services/netWorth";
import { evaluateGoal } from "../src/services/goals/goalEngine";
import {
  suppressDuplicateAlerts,
  resolveAlert,
  snoozeAlert,
  InstitutionalSmartAlert,
} from "../src/services/smartAlerts";
import { sanitizeForAI, scrubPiiFromText } from "../src/services/ai/aiSanitizer";
import { PortfolioHolding, Goal, Client } from "../src/types/wealth";
import { DailyReturnPoint } from "../src/services/performance/types";

describe("ASSETARRAY V3.2 — RED-TEAM INSTITUTIONAL ADVERSARIAL AUDIT", () => {
  // --------------------------------------------------------------------------
  // 1. XIRR / MWR ADVERSARIAL SUITE
  // --------------------------------------------------------------------------
  describe("1. XIRR / MWR Adversarial Engine", () => {
    it("handles total catastrophic loss (endingValue = 0) without infinite loop or NaN", () => {
      const flows = [{ date: "2024-01-01", amount: 100000 }];
      const result = calculateXIRR(flows, 0, "2024-12-31");
      expect(result.converged).toBe(true);
      expect(result.xirr).toBe(-1.0); // Exactly -100% loss
      expect(result.quality).toBe("HIGH");
      expect(result.warnings.some((w) => w.toLowerCase().includes("loss"))).toBe(true);
    });

    it("handles single deposit with 0% net return", () => {
      const flows = [{ date: "2024-01-01", amount: 100000 }];
      const result = calculateXIRR(flows, 100000, "2025-01-01");
      expect(result.converged).toBe(true);
      expect(result.xirr).toBeCloseTo(0.0, 4);
    });

    it("handles 10x massive growth in 1 leap year", () => {
      const flows = [{ date: "2024-01-01", amount: 100000 }];
      const result = calculateXIRR(flows, 1000000, "2025-01-01");
      expect(result.converged).toBe(true);
      // 366 days in 2024 -> (1+r)^(366/365.25) = 10 -> r ≈ 8.95
      expect(result.xirr).toBeCloseTo(8.95, 1);
    });

    it("flags multiple sign changes with warnings", () => {
      const flows = [
        { date: "2024-01-01", amount: 100000 },
        { date: "2024-03-01", amount: -50000 },
        { date: "2024-06-01", amount: 80000 },
        { date: "2024-09-01", amount: -60000 },
      ];
      const result = calculateXIRR(flows, 90000, "2024-12-31");
      expect(result.converged).toBe(true);
      expect(result.warnings.some((w) => w.includes("sign changes"))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 2. TWR ADVERSARIAL SUITE & GIPS 2020 DISCLOSURES
  // --------------------------------------------------------------------------
  describe("2. TWR Adversarial Engine & GIPS Timing Standards", () => {
    it("rejects non-positive starting NAV and marks INSUFFICIENT_DATA", () => {
      const valuations = [
        { date: "2024-01-01", nav: 0 },
        { date: "2024-06-01", nav: 50000 },
      ];
      const result = calculateTWR(valuations);
      expect(result.quality).toBe("INSUFFICIENT_DATA");
      expect(result.twr).toBe(0);
      expect(result.warnings.some((w) => w.toLowerCase().includes("non-positive"))).toBe(true);
    });

    it("exposes explicit GIPS 2020 daily subperiod approximation and methodology version", () => {
      const valuations = [
        { date: "2024-01-01", nav: 100000 },
        { date: "2024-06-01", nav: 120000, cashFlow: 20000 },
        { date: "2024-12-31", nav: 150000 },
      ];
      const result = calculateTWR(valuations);
      expect(result.twrMethod).toBe("DAILY_SUBPERIOD_APPROXIMATION");
      expect(result.methodologyVersion).toBe("twr-gips-2020-v3.2");
      expect(result.dataSource).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 3. DRAWDOWN & UNRECOVERED HIGH-WATER MARK SUITE
  // --------------------------------------------------------------------------
  describe("3. Drawdown Engine — Deterministic Series & Unrecovered HWM", () => {
    it("correctly identifies unrecovered drawdown episode as NOT_RECOVERED with underwater duration", () => {
      const series = [
        { date: "2024-01-01", nav: 100 },
        { date: "2024-01-15", nav: 50 },
        { date: "2024-01-31", nav: 40 },
      ];
      const result = calculateDrawdown(series);
      expect(result.maxDrawdownPercent).toBe(-60.0);
      expect(result.currentDrawdownPercent).toBe(-60.0);
      expect(result.episodes.length).toBe(1);

      const ep = result.episodes[0];
      expect(ep.recoveryStatus).toBe("NOT_RECOVERED");
      expect(ep.isRecovered).toBe(false);
      expect(ep.recoveryDate).toBeNull();
      expect(ep.underwaterDurationDays).toBe(30);
    });

    it("accurately computes recovery date and duration when drawdown is fully recovered", () => {
      const series = [
        { date: "2024-01-01", nav: 100 },
        { date: "2024-01-10", nav: 110 }, // Peak
        { date: "2024-01-15", nav: 80 },  // Trough (-27.27%)
        { date: "2024-01-25", nav: 120 }, // New Peak / Recovery
      ];
      const result = calculateDrawdown(series);
      expect(result.episodes.length).toBe(1);
      const ep = result.episodes[0];
      expect(ep.recoveryDate).toBe("2024-01-25");
      expect(ep.recoveryStatus).toBe("RECOVERED");
      expect(ep.isRecovered).toBe(true);
      expect(ep.recoveryDurationDays).toBe(10);
    });
  });

  // --------------------------------------------------------------------------
  // 4. RISK & BENCHMARK ANALYTICS ZERO-VOLATILITY SAFEGUARDS
  // --------------------------------------------------------------------------
  describe("4. Risk Metrics — Zero-Volatility Undefined Guardrails", () => {
    it("returns null for Sharpe and Sortino ratios when return volatility is 0 (prevents Infinity or 0)", () => {
      const dates = Array.from({ length: 15 }, (_, i) => `2024-01-${(i + 1).toString().padStart(2, "0")}`);
      // Perfectly flat portfolio returns (0 variance)
      const flatPReturns: DailyReturnPoint[] = dates.map((d) => ({
        date: d,
        nav: 100000,
        dailyReturn: 0.05,
        netCashFlow: 0,
      }));
      const bReturns: DailyReturnPoint[] = dates.map((d, i) => ({
        date: d,
        nav: 20000 + i * 50,
        dailyReturn: i % 2 === 0 ? 0.01 : 0.005,
        netCashFlow: 0,
      }));

      const result = calculateBenchmarkAnalytics(flatPReturns, bReturns);
      expect(result.portfolioVolatility).toBe(0);
      expect(result.sharpeRatio).toBeNull();
      expect(result.sortinoRatio).toBeNull();
      expect(result.warnings.some((w) => w.includes("volatility is zero"))).toBe(true);
    });

    it("returns null for Beta and Information Ratio under zero benchmark variance or tracking error", () => {
      const dates = Array.from({ length: 15 }, (_, i) => `2024-01-${(i + 1).toString().padStart(2, "0")}`);
      const pReturns: DailyReturnPoint[] = dates.map((d, i) => ({
        date: d,
        nav: 100000 + i * 100,
        dailyReturn: i % 2 === 0 ? 0.01 : -0.005,
        netCashFlow: 0,
      }));
      // Flat benchmark returns (0 variance)
      const flatBReturns: DailyReturnPoint[] = dates.map((d) => ({
        date: d,
        nav: 20000,
        dailyReturn: 0.03,
        netCashFlow: 0,
      }));

      const result = calculateBenchmarkAnalytics(pReturns, flatBReturns);
      expect(result.benchmarkVolatility).toBe(0);
      expect(result.beta).toBeNull();
      expect(result.warnings.some((w) => w.includes("Benchmark variance is zero"))).toBe(true);

      // Zero tracking error case (matching returns)
      const matchingPReturns: DailyReturnPoint[] = flatBReturns.map((b) => ({ ...b }));
      const zeroTeResult = calculateBenchmarkAnalytics(matchingPReturns, flatBReturns);
      expect(zeroTeResult.trackingError).toBe(0);
      expect(zeroTeResult.informationRatio).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // 5. BRINSON-FACHLER ATTRIBUTION PROVENANCE & CROSS-CURRENCY AUDIT
  // --------------------------------------------------------------------------
  describe("5. Brinson-Fachler Attribution Provenance", () => {
    it("generates cross-currency warnings when comparing INR portfolio to USD benchmark", () => {
      const holdings: PortfolioHolding[] = [
        {
          id: "h1",
          assetName: "Infosys Ltd",
          ticker: "INFY",
          assetClass: "Stocks",
          quantity: "100",
          currentValue: "100000",
          investedValue: "80000",
          targetWeight: "100",
          notes: "",
        },
      ];

      const usdBenchmark = {
        ...STANDARD_BENCHMARKS.SPY_500,
        currency: "USD",
        name: "S&P 500 Total Return Index (USD)",
      };

      const result = calculateAttribution(holdings, usdBenchmark, "p1", { portfolioCurrency: "INR" });
      expect(result.quality).toBe("MEDIUM");
      expect(result.benchmarkCurrency).toBe("USD");
      expect(result.portfolioCurrency).toBe("INR");
      expect(result.fxTreatment).toBe("UNHEDGED_BASE");
      expect(result.isReconciled).toBe(true);
      expect(result.warnings?.some((w) => w.includes("Currency mismatch"))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 6. STATUTORY TAX LOTS & LOSS HARVESTING — ZERO SYNTHETIC INFERENCE
  // --------------------------------------------------------------------------
  describe("6. Statutory Indian Tax Engine — Zero Synthetic Data", () => {
    it("marks holding as DATE_MISSING and isLongTerm = null when acquiredAt and dates are absent", () => {
      const holding: PortfolioHolding = {
        id: "lot_unknown",
        assetName: "Legacy Holding",
        ticker: "LEGACY",
        assetClass: "Stocks",
        quantity: "100",
        currentValue: "90000",
        investedValue: "100000",
        targetWeight: "100",
        notes: "",
      };

      const lots = evaluateTaxLots(holding);
      expect(lots[0].dateVerificationStatus).toBe("DATE_MISSING");
      expect(lots[0].isLongTerm).toBeNull();
      expect(lots[0].quality).toBe("INSUFFICIENT_DATA");
    });

    it("labels holdings with legacy text notes as LEGACY_ESTIMATE with LOW quality", () => {
      const holding: PortfolioHolding = {
        id: "lot_legacy_notes",
        assetName: "Legacy Notes Holding",
        ticker: "LEGACY_NOTE",
        assetClass: "Stocks",
        quantity: "100",
        currentValue: "90000",
        investedValue: "100000",
        targetWeight: "100",
        notes: "Long term investment",
      };

      const lots = evaluateTaxLots(holding);
      expect(lots[0].dateVerificationStatus).toBe("LEGACY_ESTIMATE");
      expect(lots[0].isLongTerm).toBe(true);
      expect(lots[0].quality).toBe("LOW");
    });

    it("prevents tax harvest plan from claiming an immediate short-term tax shield on unverified lots", () => {
      const holdings: PortfolioHolding[] = [
        {
          id: "lot_no_date",
          assetName: "Unverified Loss Lot",
          ticker: "UNVERIFIED",
          assetClass: "Stocks",
          quantity: "50",
          currentValue: "50000",
          investedValue: "100000", // ₹50,000 unrealized loss
          targetWeight: "100",
          notes: "",
        },
      ];

      const harvestReport = generateInstitutionalTaxReport(holdings, { shortTerm: 50000, longTerm: 50000 });
      expect(harvestReport.harvestCandidates.length).toBe(1);
      const candidate = harvestReport.harvestCandidates[0];

      expect(candidate.isLongTerm).toBe(false); // In legacy IndianTaxLot type, long-term is false if not verified
      expect(candidate.suggestedAction).toBe("VERIFY_DATE");
      expect(candidate.potentialTaxShield).toBe(0); // MUST be 0 shield
      expect(harvestReport.estimatedImmediateTaxSavings).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 7. NET WORTH DESK — IMMUTABILITY & ANTI-DOUBLE-COUNTING
  // --------------------------------------------------------------------------
  describe("7. Net Worth Desk — Immutability & Anti-Double-Counting", () => {
    it("preserves caller's liabilities array and prevents in-place mutation", () => {
      const initialLiabilities = [
        { id: "l1", name: "Home Loan", category: "Mortgage" as const, value: 4000000 },
        { id: "l2", name: "Auto Loan", category: "Loan" as const, value: 800000 },
      ];
      const frozenLiabilities = Object.freeze([...initialLiabilities.map((l) => ({ ...l }))]);

      const holdings: PortfolioHolding[] = [
        {
          id: "h1",
          assetName: "Primary Residence",
          ticker: "PROPERTY",
          assetClass: "Alternatives",
          quantity: "1",
          currentValue: "8000000",
          investedValue: "6000000",
          targetWeight: "100",
          notes: "Real estate property",
        },
      ];

      const snapshot = calculateUnifiedNetWorth({
        clientId: "c1",
        holdings,
        liabilities: frozenLiabilities as any,
      });

      expect(snapshot.netWorth).toBe(8000000 - 4800000);
      expect(frozenLiabilities.length).toBe(2);
    });
  });

  // --------------------------------------------------------------------------
  // 8. GOAL ENGINE — PAST TARGET DATES & EXPIRATION SAFEGUARDS
  // --------------------------------------------------------------------------
  describe("8. Goal Planning Engine — Past Dates & Horizon Boundaries", () => {
    it("flags goals with target dates in the past as EXPIRED_OR_DUE with zero years remaining", () => {
      const pastGoal: Goal = {
        id: "g_past",
        title: "Historical Milestone",
        goalType: "Wealth",
        targetAmount: "500000",
        currentAmount: "300000",
        targetYear: "2020", // in the past
        priority: "Core",
        monthlyContribution: "5000",
      };

      const result = evaluateGoal(pastGoal, [], 2026);
      expect(result.yearsRemaining).toBe(0);
      expect(result.status).toBe("EXPIRED_OR_DUE");
      expect(result.monteCarloSuccessProbability).toBe(0);
      expect(result.confidence).toBe("LOW");
    });
  });

  // --------------------------------------------------------------------------
  // 9. SMART ALERTS LIFECYCLE & DEDUPLICATION COOLDOWN
  // --------------------------------------------------------------------------
  describe("9. Smart Alerts Engine — Lifecycle & Duplicate Storm Prevention", () => {
    it("suppresses alerts when active snoozed or within 24h of resolution", () => {
      const baseAlert: InstitutionalSmartAlert = {
        id: "alert_conc_1",
        clientId: "c1",
        clientName: "Test Client",
        portfolioId: "p1",
        condition: "CONCENTRATION_BREACH",
        severity: "WARNING",
        title: "High Tech Concentration",
        message: "Tech allocation exceeds 25%",
        status: "ACTIVE",
        timestamp: "2026-09-01T10:00:00Z",
        acknowledged: false,
        createdAt: "2026-09-01T10:00:00Z",
      };

      // 1. Snooze alert for 4 hours
      const snoozedAlert = snoozeAlert(baseAlert, 4);
      expect(snoozedAlert.status).toBe("SNOOZED");
      expect(snoozedAlert.snoozedUntil).toBeDefined();

      // Duplicate alert arriving during active snooze must be suppressed
      const candidateAlert: InstitutionalSmartAlert = { ...baseAlert, createdAt: new Date().toISOString() };
      const suppressed = suppressDuplicateAlerts([snoozedAlert], [candidateAlert]);
      expect(suppressed.length).toBe(0);

      // 2. Resolve alert
      const resolvedAlert = resolveAlert(baseAlert, "Rebalanced portfolio to 20%");
      expect(resolvedAlert.status).toBe("RESOLVED");
      expect(resolvedAlert.resolvedAt).toBeDefined();

      // Duplicate alert arriving within 24 hours of resolution must be suppressed
      const afterResolveSuppressed = suppressDuplicateAlerts([resolvedAlert], [candidateAlert]);
      expect(afterResolveSuppressed.length).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 10. PRIVACY / DPDP AI SANITIZER ADVERSARIAL SUITE
  // --------------------------------------------------------------------------
  describe("10. DPDP Privacy Sanitizer — Financial Data Leakage Shield", () => {
    it("scrubs 12-digit Indian Aadhaar numbers, 11-digit IFSC codes, PAN, and entity names", () => {
      const sensitiveNotes = [
        "Client Rajesh Kumar (Aadhaar: 4532 9876 1234, PAN: ABCDE1234F).",
        "Transfer proceeds to HDFC Bank IFSC HDFC0001234 Account 50100234567891.",
        "Email: rajesh.kumar@example.com, Phone: +91 9876543210.",
      ];

      const scrubbed = scrubPiiFromText(sensitiveNotes.join(" "), ["Rajesh Kumar"]);

      // Verify all sensitive PII is redacted
      expect(scrubbed).not.toContain("4532 9876 1234");
      expect(scrubbed).not.toContain("ABCDE1234F");
      expect(scrubbed).not.toContain("HDFC0001234");
      expect(scrubbed).not.toContain("50100234567891");
      expect(scrubbed).not.toContain("rajesh.kumar@example.com");
      expect(scrubbed).not.toContain("9876543210");
      expect(scrubbed).not.toContain("Rajesh Kumar");
      expect(scrubbed).toContain("[AADHAAR_REDACTED]");
      expect(scrubbed).toContain("[PAN_REDACTED]");
      expect(scrubbed).toContain("[IFSC_REDACTED]");
      expect(scrubbed).toContain("[ENTITY_REDACTED]");
    });

    it("sanitizes client portfolio context into anonymous reference with zero synthetic data", () => {
      const client: Client = {
        id: "c_client_99",
        name: "Rajesh Sharma",
        email: "rajesh@example.com",
        phone: "+91 9988776655",
        category: "HNI",
        riskProfile: "Aggressive",
        preferredChannel: "Email",
        watchlist: [],
        notes: "",
        city: "Mumbai",
        allocation: "100%",
        reminderDate: "2026-10-01",
        priority: "High",
        lastContact: "2026-09-01",
        updateHistory: [],
        portfolio: [
          {
            id: "h1",
            assetName: "TCS Ltd",
            ticker: "TCS",
            assetClass: "Stocks",
            quantity: "100",
            currentValue: "400000",
            investedValue: "300000",
            targetWeight: "100",
            notes: "",
          },
        ],
      };

      const sanitized = sanitizeForAI(client);
      expect(sanitized.anonymizedRef).toMatch(/^Client Ref #AA-\d{3}$/);
      expect(sanitized.totalPortfolioValue).toBe(400000);
      expect(sanitized.holdings[0].country).toBe("UNKNOWN");
      expect(sanitized.holdings[0].currency).toBe("UNKNOWN");
    });
  });
});
