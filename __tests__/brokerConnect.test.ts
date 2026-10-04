import { brokerGateway, TradeOrder } from "../src/services/brokerConnect";
import { calculateRebalance } from "../src/services/rebalancer";

describe("BrokerGateway & Execution Routing Engine", () => {
  const sampleHoldings = [
    {
      id: "h-1",
      assetName: "Reliance Industries",
      assetClass: "Equity",
      ticker: "RELIANCE",
      currentValue: 750000,
      investedValue: 600000,
      quantity: 250,
    },
    {
      id: "h-2",
      assetName: "Government 10Y G-Sec",
      assetClass: "Debt",
      ticker: "IN_10Y_GSEC",
      currentValue: 100000,
      investedValue: 100000,
      quantity: 100,
    },
    {
      id: "h-3",
      assetName: "Physical Gold ETF",
      assetClass: "Alternative",
      ticker: "GOLDBEES",
      currentValue: 150000,
      investedValue: 120000,
      quantity: 2500,
    },
  ];

  it("translates portfolio rebalancing results into actionable trade orders", () => {
    // Model expects 50% Equity, 30% Debt, 20% Alternative
    // Total is 1,000,000. Current is 75% Eq, 10% Debt, 15% Alt.
    const rebal = calculateRebalance(sampleHoldings);
    const orders = brokerGateway.generateOrdersFromRebalance(rebal, sampleHoldings, "CLIENT-TEST-001");

    expect(orders.length).toBeGreaterThanOrEqual(2);
    const equitySell = orders.find((o) => o.transactionType === "SELL");
    const debtBuy = orders.find((o) => o.transactionType === "BUY");

    expect(equitySell).toBeDefined();
    expect(debtBuy).toBeDefined();
    expect(equitySell?.symbol).toBe("RELIANCE");
    expect(debtBuy?.symbol).toBe("IN_10Y_GSEC");
  });

  it("formats Zerodha Kite Connect JSON payload properly", () => {
    const order: TradeOrder = {
      orderId: "ORD-123",
      clientRefToken: "CLIENT-881",
      symbol: "TCS",
      tradingSymbol: "TCS",
      exchange: "NSE",
      transactionType: "BUY",
      orderType: "LIMIT",
      product: "CNC",
      quantity: 50,
      price: 4200.5,
      estimatedValue: 210025,
      status: "VALIDATED",
    };

    const payload = brokerGateway.formatZerodhaPayload(order);
    expect(payload.tradingsymbol).toBe("TCS");
    expect(payload.transaction_type).toBe("BUY");
    expect(payload.order_type).toBe("LIMIT");
    expect(payload.quantity).toBe(50);
    expect(payload.price).toBe(4200.5);
    expect(payload.product).toBe("CNC");
  });

  it("formats standard FIX 4.4 NewOrderSingle message", () => {
    const order: TradeOrder = {
      orderId: "ORD-999",
      clientRefToken: "CLIENT-881",
      symbol: "INFY",
      tradingSymbol: "INFY",
      exchange: "NSE",
      transactionType: "SELL",
      orderType: "LIMIT",
      product: "CNC",
      quantity: 100,
      price: 1850.0,
      estimatedValue: 185000,
      status: "VALIDATED",
    };

    const fixMsg = brokerGateway.formatFix44Message(order, "ASSETARRAY");
    expect(fixMsg.startsWith("8=FIX.4.4")).toBe(true);
    expect(fixMsg.includes("35=D")).toBe(true);
    expect(fixMsg.includes("55=INFY")).toBe(true);
    expect(fixMsg.includes("54=2")).toBe(true); // 2 = Sell
    expect(fixMsg.includes("38=100")).toBe(true);
    expect(fixMsg.includes("10=")).toBe(true); // Checksum present
  });

  it("executes a batch of orders and produces cryptographic execution receipts", async () => {
    const order1: TradeOrder = {
      orderId: "ORD-B1",
      clientRefToken: "CLIENT-881",
      symbol: "HDFCBANK",
      tradingSymbol: "HDFCBANK",
      exchange: "NSE",
      transactionType: "BUY",
      orderType: "LIMIT",
      product: "CNC",
      quantity: 20,
      price: 1650.0,
      estimatedValue: 33000,
      status: "VALIDATED",
    };

    const order2: TradeOrder = {
      orderId: "ORD-B2",
      clientRefToken: "CLIENT-881",
      symbol: "ITC",
      tradingSymbol: "ITC",
      exchange: "NSE",
      transactionType: "BUY",
      orderType: "LIMIT",
      product: "CNC",
      quantity: 100,
      price: 460.0,
      estimatedValue: 46000,
      status: "VALIDATED",
    };

    const batchResult = await brokerGateway.executeBatch({
      batchId: "BATCH-TEST-001",
      brokerId: "zerodha_kite",
      orders: [order1, order2],
    });

    expect(batchResult.status).toBe("SUCCESS");
    expect(batchResult.executedCount).toBe(2);
    expect(batchResult.totalExecutedValue).toBe(79000);
    expect(batchResult.batchReceiptHash).toMatch(/^AA-SIG-/);
    expect(batchResult.orders[0].executionReceiptHash).toBeDefined();
    expect(batchResult.auditLog.length).toBeGreaterThan(0);
  });
});
