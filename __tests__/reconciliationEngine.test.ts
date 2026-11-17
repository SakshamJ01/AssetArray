import {
  generateReconciliationDiff,
  applyReconciliation,
  normalizeTicker,
} from "../src/services/reconciliationEngine";
import { PortfolioHolding } from "../src/types/wealth";
import { SimpleHolding } from "../src/services/rebalancer";

describe("ReconciliationEngine", () => {
  const existingHoldings: PortfolioHolding[] = [
    {
      id: "h1",
      ticker: "RELIANCE",
      assetName: "Reliance Industries",
      assetClass: "Stocks",
      quantity: "100",
      investedValue: "200000",
      currentValue: "250000",
      targetWeight: "15",
      notes: "Core bluechip",
    },
    {
      id: "h2",
      ticker: "INFY",
      assetName: "Infosys Ltd",
      assetClass: "Stocks",
      quantity: "200",
      investedValue: "280000",
      currentValue: "300000",
      targetWeight: "10",
      notes: "Tech",
    },
    {
      id: "h3",
      ticker: "TCS",
      assetName: "Tata Consultancy Services",
      assetClass: "Stocks",
      quantity: "50",
      investedValue: "150000",
      currentValue: "160000",
      targetWeight: "10",
      notes: "Tech",
    },
  ];

  test("normalizes ticker prefixes cleanly", () => {
    expect(normalizeTicker("NSE:RELIANCE")).toBe("RELIANCE");
    expect(normalizeTicker("BSE:TCS")).toBe("TCS");
    expect(normalizeTicker("  infy  ")).toBe("INFY");
  });

  test("identifies new, modified, removed, and unchanged positions accurately", () => {
    const statementHoldings: SimpleHolding[] = [
      // Modified: RELIANCE quantity increased from 100 -> 150
      {
        id: "s1",
        ticker: "RELIANCE",
        assetName: "Reliance Industries",
        assetClass: "Stocks",
        quantity: 150,
        investedValue: 300000,
        currentValue: 375000,
      },
      // Unchanged: INFY quantity 200, value 300000
      {
        id: "s2",
        ticker: "INFY",
        assetName: "Infosys Ltd",
        assetClass: "Stocks",
        quantity: 200,
        investedValue: 280000,
        currentValue: 300000,
      },
      // New: HDFCBANK 200 shares
      {
        id: "s3",
        ticker: "HDFCBANK",
        assetName: "HDFC Bank",
        assetClass: "Stocks",
        quantity: 200,
        investedValue: 290000,
        currentValue: 320000,
      },
      // Note: TCS is missing from statement -> should be flagged as "removed"
    ];

    const report = generateReconciliationDiff(existingHoldings, statementHoldings, "c-101", "Zerodha CAS");

    expect(report.clientId).toBe("c-101");
    expect(report.auditSignature).toMatch(/^AA-REC-[0-9A-F]{8}$/);
    expect(report.items.length).toBe(4);

    const rel = report.items.find((i) => i.ticker === "RELIANCE");
    expect(rel?.diffType).toBe("modified");
    expect(rel?.deltaQuantity).toBe(50);
    expect(rel?.deltaValue).toBe(125000);

    const infy = report.items.find((i) => i.ticker === "INFY");
    expect(infy?.diffType).toBe("unchanged");
    expect(infy?.deltaQuantity).toBe(0);

    const hdfc = report.items.find((i) => i.ticker === "HDFCBANK");
    expect(hdfc?.diffType).toBe("new");
    expect(hdfc?.statementQuantity).toBe(200);
    expect(hdfc?.existingQuantity).toBe(0);

    const tcs = report.items.find((i) => i.ticker === "TCS");
    expect(tcs?.diffType).toBe("removed");
    expect(tcs?.deltaQuantity).toBe(-50);
    expect(tcs?.existingQuantity).toBe(50);
  });

  test("applies approved reconciliation changes while preserving unapproved positions", () => {
    const statementHoldings: SimpleHolding[] = [
      { id: "s1", ticker: "RELIANCE", assetName: "Reliance Industries", assetClass: "Stocks", quantity: 150, investedValue: 300000, currentValue: 375000 },
      { id: "s2", ticker: "HDFCBANK", assetName: "HDFC Bank", assetClass: "Stocks", quantity: 200, investedValue: 290000, currentValue: 320000 },
    ];

    const report = generateReconciliationDiff(existingHoldings, statementHoldings, "c-101");

    // Advisor only approves HDFCBANK (new) and RELIANCE (modified), but does NOT approve removing TCS
    const approved = ["HDFCBANK", "RELIANCE"];
    const merged = applyReconciliation(existingHoldings, report.items, approved);

    // Should have RELIANCE (updated), INFY (untouched), TCS (preserved!), HDFCBANK (added)
    expect(merged.length).toBe(4);

    const mergedRel = merged.find((h) => h.ticker === "RELIANCE");
    expect(mergedRel?.quantity).toBe("150");
    expect(mergedRel?.currentValue).toBe("375000");

    const mergedHdfc = merged.find((h) => h.ticker === "HDFCBANK");
    expect(mergedHdfc?.quantity).toBe("200");
    expect(mergedHdfc?.currentValue).toBe("320000");

    const mergedTcs = merged.find((h) => h.ticker === "TCS");
    expect(mergedTcs).toBeDefined();
    expect(mergedTcs?.quantity).toBe("50");
  });

  test("removes positions when removal is explicitly approved", () => {
    const statementHoldings: SimpleHolding[] = [
      { id: "s1", ticker: "RELIANCE", assetName: "Reliance Industries", assetClass: "Stocks", quantity: 100, investedValue: 200000, currentValue: 250000 },
      { id: "s2", ticker: "INFY", assetName: "Infosys Ltd", assetClass: "Stocks", quantity: 200, investedValue: 280000, currentValue: 300000 },
    ];

    const report = generateReconciliationDiff(existingHoldings, statementHoldings, "c-101");
    // TCS is missing, and advisor approves removing TCS
    const approved = ["TCS"];
    const merged = applyReconciliation(existingHoldings, report.items, approved);

    expect(merged.length).toBe(2);
    expect(merged.find((h) => h.ticker === "TCS")).toBeUndefined();
  });
});
