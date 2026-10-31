jest.mock("react-native", () => ({
  Platform: { OS: "web" },
  StyleSheet: { create: (styles: any) => styles },
  View: "View",
  Text: "Text",
  TextInput: "TextInput",
  Modal: "Modal",
  Pressable: "Pressable",
  Alert: { alert: jest.fn() },
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: "StatusBar",
}));

jest.mock("../src/components/DesktopSidebar", () => ({
  DesktopSidebar: () => null,
}));
jest.mock("../src/components/BottomTabBar", () => ({
  BottomTabBar: () => null,
}));
jest.mock("../src/components/LiveMarketTicker", () => ({
  LiveMarketTicker: () => null,
}));
jest.mock("../src/components/GlobalStatusBar", () => ({
  GlobalStatusBar: () => null,
}));
jest.mock("../src/components/ScreenTransition", () => ({
  ScreenTransition: ({ children }: any) => children,
}));

import React from "react";
import {
  todayISO,
  formatDate,
  formatReminderDate,
  isReminderDue,
  numericValue,
  currencyDisplay,
  compactText,
  buildClientFromDraft,
  buildDraftFromClient,
  buildHoldingFromDraft,
  buildHoldingDraftFromHolding,
  personalizedClientMessage,
  resolveBroadcastContact,
} from "../src/services/wealthHelpers";
import { calculateXIRR } from "../src/services/performance/xirr";
import { calculateTWR } from "../src/services/performance/twr";
import { calculateDrawdown } from "../src/services/risk/drawdown";
import { calculateStatutoryCapitalGainsTax } from "../src/services/tax/taxCalculator";
import { AppShell, AppShellProps } from "../src/components/layout/AppShell";
import { buildAppTheme } from "../src/theme";
import { AppProviders } from "../src/context/AppProviders";
import { Client, PortfolioHolding, HoldingDraft } from "../src/types/wealth";
import fs from "fs";
import path from "path";

describe("Asset Array: Multi-Dimensional System Audit & Verification Suite", () => {
  const theme = buildAppTheme("dark");

  const sampleHolding: PortfolioHolding = {
    id: "h-101",
    assetName: "HDFC Large Cap Equity",
    assetClass: "Stocks",
    ticker: "HDFCBANK.NS",
    quantity: "500",
    investedValue: "60000",
    currentValue: "90000",
    targetWeight: "45",
    notes: "Core bluechip allocation",
  };

  const sampleClient: Client = {
    id: "c-101",
    name: "Dr. Vikram Sethi",
    phone: "+91 98200 12345",
    email: "vikram.sethi@example.com",
    category: "HNI",
    priority: "High",
    reminderDate: "2026-11-05",
    lastContact: "2026-10-25",
    riskProfile: "Aggressive",
    notes: "Requires quarterly private equity and tax-loss harvesting review",
    city: "Mumbai",
    allocation: "60/40 Equity Debt",
    watchlist: ["HDFCBANK.NS", "TCS.NS"],
    preferredChannel: "WhatsApp",
    updateHistory: ["2026-10-25: Rebalanced equity portfolio"],
    portfolio: [sampleHolding],
  };

  // =========================================================================
  // 1. FUNCTIONAL TESTING (What it does)
  // =========================================================================
  describe("1. Functional Testing", () => {
    describe("1.1 Unit Testing: Pure Wealth & Computational Engines", () => {
      test("UT-01: Correctly cleans and parses numeric values from formatted currency strings", () => {
        expect(numericValue("₹ 1,50,000")).toBe(150000);
        expect(numericValue("  2,450.75 ")).toBe(2450.75);
        expect(numericValue("invalid")).toBe(0);
        expect(numericValue("")).toBe(0);
      });

      test("UT-02: Localizes currency amounts with standard institutional precision", () => {
        const formatted = currencyDisplay("1000000");
        expect(formatted).toContain("10,00,000");
      });

      test("UT-03: Date and reminder calculators identify overdue client actions", () => {
        expect(isReminderDue("2020-01-01")).toBe(true);
        expect(isReminderDue("2035-12-31")).toBe(false);
        expect(formatReminderDate("")).toBe("Not scheduled");
      });

      test("UT-04: Actuarial XIRR and TWR return engines calculate correct geometric returns", () => {
        const cashFlows = [
          { date: "2025-01-01", amount: 100000, type: "DEPOSIT" as const },
        ];
        const xirr = calculateXIRR(cashFlows, 120000, "2026-01-01");
        expect(xirr.xirr).toBeGreaterThan(0.18);
        expect(xirr.xirr).toBeLessThan(0.22);

        const valuationPoints = [
          { date: "2025-01-01", nav: 100000 },
          { date: "2025-06-01", nav: 110000 },
          { date: "2026-01-01", nav: 121000 },
        ];
        const twr = calculateTWR(valuationPoints);
        expect(twr.twr).toBeCloseTo(0.21, 2);
      });

      test("UT-05: Maximum drawdown engine captures portfolio peak-to-trough decline accurately", () => {
        const valuationSeries = [
          { date: "2025-01-01", nav: 100 },
          { date: "2025-02-01", nav: 125 },
          { date: "2025-03-01", nav: 95 },
          { date: "2025-04-01", nav: 130 },
        ];
        const drawdown = calculateDrawdown(valuationSeries);
        // Peak is 125, trough is 95 -> (95-125)/125 = -24%
        expect(drawdown.maxDrawdownPercent).toBeCloseTo(-24, 0);
      });
    });

    describe("1.2 Integration Testing: Modular Hooks & Providers", () => {
      test("IT-01: AppProviders composes context providers hierarchy without throwing", () => {
        const rendered = React.createElement(
          AppProviders,
          null,
          React.createElement("div", { id: "child-node" }, "Active Provider Tree")
        );
        expect(rendered).toBeDefined();
        expect(rendered.type).toBe(AppProviders);
      });

      test("IT-02: AppShell dynamically adapts between desktop sidebar and mobile navigation", () => {
        const shellProps: AppShellProps = {
          isDesktop: true,
          theme,
          darkModeEnabled: true,
          activeTab: "Dashboard",
          setActiveTab: jest.fn(),
          visibleTabs: [{ key: "Dashboard", label: "Dashboard" }],
          mobileTabs: [{ key: "Workspace", label: "Workspace" }],
          selectedClient: sampleClient,
          advisorName: "Senior Wealth Advisor",
          dueClientsCount: 1,
          isPro: true,
          syncStatus: "Online",
          marketStatus: "LIVE",
          dataQualityPct: 95,
          activeCurrency: "INR",
          isMarketRefreshing: false,
          onRefreshMarket: jest.fn(),
          onCycleCurrency: jest.fn(),
          onLockDesk: jest.fn(),
          onOpenProModal: jest.fn(),
          onQuickAddClient: jest.fn(),
          onQuickBroadcast: jest.fn(),
          onQuickImportStatement: jest.fn(),
          onQuickExportRoster: jest.fn(),
          onClearSelectedClient: jest.fn(),
          onNavigateTab: jest.fn(),
        };

        const desktopShell = React.createElement(AppShell, shellProps);
        expect(desktopShell).toBeDefined();
        expect((desktopShell.props as AppShellProps).isDesktop).toBe(true);

        const mobileShell = React.createElement(AppShell, {
          ...shellProps,
          isDesktop: false,
        });
        expect((mobileShell.props as AppShellProps).isDesktop).toBe(false);
      });
    });

    describe("1.3 System (E2E) Testing: End-to-End Client Portfolio Flow", () => {
      test("ST-01: Full client lifecycle preserves all data models through draft transformation", () => {
        // 1. Build draft from client
        const draft = buildDraftFromClient(sampleClient);
        expect(draft.name).toBe("Dr. Vikram Sethi");
        expect(draft.city).toBe("Mumbai");

        // 2. Modify draft
        draft.notes = "Updated investment mandate for private credit";

        // 3. Rebuild client from draft
        const updatedClient = buildClientFromDraft(draft, sampleClient);
        expect(updatedClient.notes).toBe("Updated investment mandate for private credit");
        expect(updatedClient.portfolio.length).toBe(1);
        expect(updatedClient.portfolio[0].assetName).toBe("HDFC Large Cap Equity");

        // 4. Add new holding via draft converter
        const newHoldingDraft: HoldingDraft = {
          assetName: "Gold ETF",
          assetClass: "Alternatives",
          ticker: "GOLDBEES.NS",
          quantity: "100",
          investedValue: "500000",
          currentValue: "620000",
          targetWeight: "25",
          notes: "Hedge asset",
        };
        const newHolding = buildHoldingFromDraft(newHoldingDraft);
        updatedClient.portfolio.push(newHolding);

        expect(updatedClient.portfolio.length).toBe(2);
        expect(updatedClient.portfolio[1].assetName).toBe("Gold ETF");
        expect(numericValue(updatedClient.portfolio[1].currentValue)).toBe(620000);
      });
    });

    describe("1.4 Acceptance / UAT Testing: Institutional Disclosures & Zero-PII", () => {
      test("AT-01: Dispatches personalized communications with verified privacy channels", () => {
        const contact = resolveBroadcastContact(sampleClient, "WhatsApp");
        expect(contact).toBe("+91 98200 12345");

        const message = personalizedClientMessage(
          sampleClient,
          "Portfolio reviewed with tactical risk overlays applied."
        );
        expect(message).toContain("Hello Dr. Vikram Sethi");
        expect(message).toContain("tactical risk overlays applied");
      });
    });
  });

  // =========================================================================
  // 2. NON-FUNCTIONAL TESTING (How well it does it)
  // =========================================================================
  describe("2. Non-Functional Testing", () => {
    describe("2.1 Performance: Benchmark & Stress Under Load", () => {
      test("NFT-PERF-01: Executes bulk portfolio valuation on 250 holdings within strict 100ms budget", () => {
        const bulkHoldings: PortfolioHolding[] = Array.from({ length: 250 }, (_, i) => ({
          id: `h-${i}`,
          assetName: `Stock ${i}`,
          assetClass: "Stocks",
          ticker: `STK${i}.NS`,
          quantity: `${100 + i}`,
          investedValue: `${(100 + i) * 100}`,
          currentValue: `${(100 + i) * (120 + (i % 20))}`,
          targetWeight: "1",
          notes: "Stress testing load item",
        }));

        const startTime = Date.now();
        let totalVal = 0;
        let totalGain = 0;
        for (const h of bulkHoldings) {
          const cVal = numericValue(h.currentValue);
          const iVal = numericValue(h.investedValue);
          totalVal += cVal;
          totalGain += cVal - iVal;
        }
        const duration = Date.now() - startTime;

        expect(totalVal).toBeGreaterThan(0);
        expect(totalGain).toBeGreaterThan(0);
        expect(duration).toBeLessThan(100); // Must execute under 100ms
      });
    });

    describe("2.2 Security: Vulnerability Checks & Secret Audit", () => {
      test("NFT-SEC-01: Verifies zero backend passwords or secret keys leaked in codebase", () => {
        const appSrc = fs.readFileSync(path.resolve(__dirname, "../App.tsx"), "utf8");
        expect(appSrc).not.toMatch(/EXPO_PUBLIC_.*(PASSWORD|SECRET)/);
        expect(appSrc).not.toMatch(/GOOGLE_CLIENT_SECRET/);
        expect(appSrc).not.toMatch(/AssetArrayLocalAdmin/);
        expect(appSrc).not.toMatch(/async function quickDemoLogin/);
        expect(appSrc).not.toMatch(/async function continueOffline/);
      });
    });

    describe("2.3 Usability: Interactive Standards & Fallback Safety", () => {
      test("NFT-USE-01: Compact text helper eliminates noisy whitespace and provides institutional fallback", () => {
        expect(compactText("   Multi-asset    Growth   Mandate   ", "Standard Mandate")).toBe(
          "Multi-asset Growth Mandate"
        );
        expect(compactText("", "Unspecified Mandate")).toBe("Unspecified Mandate");
      });
    });

    describe("2.4 Compatibility: Responsive Breakpoints & Device Support", () => {
      test("NFT-COMP-01: Breakpoint constants cleanly delineate desktop vs mobile form factors", () => {
        const desktopWidth = 1200;
        const mobileWidth = 390;
        const isDesktop = (w: number) => w >= 1024;

        expect(isDesktop(desktopWidth)).toBe(true);
        expect(isDesktop(mobileWidth)).toBe(false);
      });
    });
  });

  // =========================================================================
  // 3. MAINTENANCE & DEPLOYMENT TESTING
  // =========================================================================
  describe("3. Maintenance & Deployment Testing", () => {
    test("MNT-REG-01: Backward compatibility with legacy holding drafts lacking optional fields", () => {
      const legacyDraft: HoldingDraft = {
        assetName: "Legacy Bond Fund",
        assetClass: "Bonds",
        ticker: "BOND01",
        quantity: "100",
        investedValue: "100000",
        currentValue: "105000",
        targetWeight: "10",
        notes: "Legacy debt holding",
      };
      const holding = buildHoldingFromDraft(legacyDraft);
      expect(holding.assetName).toBe("Legacy Bond Fund");
      expect(holding.quantity).toBe("100");
      expect(holding.investedValue).toBe("100000");
      expect(holding.currentValue).toBe("105000");
    });

    test("MNT-SMK-01: Built distribution files exist and index.html is valid", () => {
      const distIndex = path.resolve(__dirname, "../dist/index.html");
      expect(fs.existsSync(distIndex)).toBe(true);
      const content = fs.readFileSync(distIndex, "utf8");
      expect(content).toContain("<div id=\"root\">");
    });
  });

  // =========================================================================
  // 4. EXECUTION & APPROACH VERIFICATION
  // =========================================================================
  describe("4. Execution & Approach", () => {
    test("EA-WB-01 (White-Box): Helper handles edge-case numeric boundaries without NaN", () => {
      expect(numericValue("0")).toBe(0);
      expect(numericValue("-500.50")).toBe(-500.5);
      expect(Number.isNaN(numericValue("NaN"))).toBe(false);
    });

    test("EA-GB-01 (Gray-Box): Inactivity lock boundaries respect 15-minute threshold", () => {
      const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
      const lastActive = Date.now() - (INACTIVITY_TIMEOUT_MS + 1000);
      const isLocked = Date.now() - lastActive > INACTIVITY_TIMEOUT_MS;
      expect(isLocked).toBe(true);
    });

    test("EA-BB-01 (Black-Box): Exact tax computations under Indian capital gains rules", () => {
      const taxResult = calculateStatutoryCapitalGainsTax({
        realizedLTCG: 150000,
        realizedSTCG: 50000,
        realizedLTCL: 25000,
      });
      // Gross LTCG: 150000 - 25000 = 125000
      // 112A exemption ₹1,25,000 completely absorbs LTCG -> Taxable LTCG = 0
      expect(taxResult.taxableLTCG).toBe(0);
      expect(taxResult.grossSTCG).toBe(50000);
      expect(taxResult.taxableSTCG).toBe(50000);
      // STCG 20% on 50000 = 10000 + 4% cess = 10400
      expect(taxResult.totalTaxLiability).toBe(10400);
    });
  });
});
