/**
 * AssetArray 4.0 — Institutional Algorithmic Execution Engine
 * Manages parent order lifecycle, market impact analysis, child slice scheduling,
 * FIX 4.4 tag formatting, and simulation telemetry with cryptographic verification.
 */

import CryptoJS from "crypto-js";
import {
  AlgoChildSlice,
  AlgoExecutionParams,
  AlgoParentOrder,
  AlgoSimulationUpdate,
  AlgoStrategyType,
  MarketImpactEstimate,
} from "./types";
import { MarketImpactModel } from "./marketImpactModel";
import { AlgoScheduler } from "./algoScheduler";
import { TradeOrder } from "../brokerConnect/types";
import { SimpleHolding, RebalanceResult } from "../rebalancer";

export class AlgoExecutionEngine {
  private static instance: AlgoExecutionEngine;
  private activeOrders: Map<string, AlgoParentOrder> = new Map();

  private constructor() {}

  public static getInstance(): AlgoExecutionEngine {
    if (!AlgoExecutionEngine.instance) {
      AlgoExecutionEngine.instance = new AlgoExecutionEngine();
    }
    return AlgoExecutionEngine.instance;
  }

  /**
   * Initializes and stages an Algorithmic Parent Order with scheduled child slices.
   */
  public createParentOrder(input: {
    clientRefToken?: string;
    symbol: string;
    tradingSymbol?: string;
    exchange?: "NSE" | "BSE" | "NASDAQ" | "NYSE" | "NFO" | "MCX";
    transactionType: "BUY" | "SELL";
    totalQuantity: number;
    benchmarkPrice: number;
    dailyVolume?: number;
    params?: Partial<AlgoExecutionParams>;
  }): AlgoParentOrder {
    const parentOrderId = `ALGO-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    const clientRefToken = input.clientRefToken || "CLIENT-DESK";
    const tradingSymbol = (input.tradingSymbol || input.symbol).toUpperCase();
    const exchange = input.exchange || "NSE";
    const totalQuantity = Math.max(1, input.totalQuantity);
    const benchmarkPrice = Math.max(0.01, input.benchmarkPrice);
    const totalEstimatedValue = parseFloat((totalQuantity * benchmarkPrice).toFixed(2));

    const defaultParams: AlgoExecutionParams = {
      strategy: "TWAP",
      timeHorizonMinutes: 60,
      slicesCount: 8,
      maxParticipationRatePct: 10,
      limitBufferPct: 0.25,
      jitterPct: 0.10,
      disclosedRatio: 0.20,
      urgency: "MEDIUM",
    };

    const params: AlgoExecutionParams = {
      ...defaultParams,
      ...input.params,
    };

    // Calculate Market Impact (Almgren-Chriss)
    const marketImpact = MarketImpactModel.calculateEstimate({
      quantity: totalQuantity,
      price: benchmarkPrice,
      dailyVolume: input.dailyVolume,
      slicesCount: params.slicesCount,
      timeHorizonMinutes: params.timeHorizonMinutes,
    });

    // Schedule child slices
    const partialOrder = {
      parentOrderId,
      clientRefToken,
      symbol: input.symbol,
      tradingSymbol,
      exchange,
      transactionType: input.transactionType,
      totalQuantity,
      benchmarkPrice,
      totalEstimatedValue,
      params,
      marketImpact,
    };

    const scheduledSlices = AlgoScheduler.generateSchedule(partialOrder);

    // Hydrate FIX 4.4 messages for all slices
    const slices = scheduledSlices.map((slice) => {
      const fixMessage = this.formatFix44AlgoMessage(slice, partialOrder);
      return {
        ...slice,
        fixMessage,
      };
    });

    const parentOrder: AlgoParentOrder = {
      ...partialOrder,
      status: "PLANNING",
      createdAt: Date.now(),
      slices,
      totalFilledQuantity: 0,
      totalExecutedValue: 0,
    };

    this.activeOrders.set(parentOrderId, parentOrder);
    return parentOrder;
  }

  /**
   * Translates rebalance drift into an array of Algorithmic Parent Orders.
   */
  public generateAlgoOrdersFromRebalance(
    rebalanceResult: RebalanceResult,
    holdings: SimpleHolding[],
    strategy: AlgoStrategyType = "TWAP",
    clientRefToken: string = "CLIENT-DESK"
  ): AlgoParentOrder[] {
    const parentOrders: AlgoParentOrder[] = [];

    const holdingsByClass: Record<string, SimpleHolding[]> = {};
    holdings.forEach((h) => {
      const cls = h.assetClass || "Equity";
      if (!holdingsByClass[cls]) holdingsByClass[cls] = [];
      holdingsByClass[cls].push(h);
    });

    rebalanceResult.items.forEach((item) => {
      if (item.action === "BALANCED" || item.amount <= 0) return;

      const candidates = holdingsByClass[item.assetClass] || [];
      const primary = candidates[0];
      const ticker =
        primary?.ticker ||
        primary?.symbol ||
        (item.assetClass === "Equity"
          ? "NIFTYBEES"
          : item.assetClass === "Debt"
          ? "LIQUIDBEES"
          : "GOLDBEES");

      const estimatedPrice =
        primary && primary.quantity && primary.quantity > 0
          ? primary.currentValue / primary.quantity
          : 250.0;

      const qty = Math.max(1, Math.round(item.amount / estimatedPrice));

      const parent = this.createParentOrder({
        clientRefToken,
        symbol: ticker,
        tradingSymbol: ticker.toUpperCase(),
        exchange: "NSE",
        transactionType: item.action,
        totalQuantity: qty,
        benchmarkPrice: estimatedPrice,
        params: {
          strategy,
          timeHorizonMinutes: 45,
          slicesCount: 6,
          limitBufferPct: 0.20,
        },
      });

      parentOrders.push(parent);
    });

    return parentOrders;
  }

  /**
   * Formats a child slice into a FIX 4.4 NewOrderSingle with algorithmic execution tags.
   * FIX Tag 847: TargetStrategy (1=TWAP, 2=VWAP, 3=Iceberg, 4=POV, 5=Sniper)
   * FIX Tag 848: TargetStrategyParameters
   */
  public formatFix44AlgoMessage(
    slice: AlgoChildSlice,
    parent: {
      parentOrderId: string;
      tradingSymbol: string;
      exchange: string;
      transactionType: "BUY" | "SELL";
      params: AlgoExecutionParams;
    },
    senderCompId: string = "ASSETARRAY_ALGO"
  ): string {
    const timestamp = new Date(slice.scheduledTimestamp || Date.now())
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);

    const side = parent.transactionType === "BUY" ? "1" : "2";

    // Tag 847: TargetStrategy mapping
    let strategyCode = "1"; // Default TWAP
    switch (parent.params.strategy) {
      case "VWAP":
        strategyCode = "2";
        break;
      case "ICEBERG":
        strategyCode = "3";
        break;
      case "POV":
        strategyCode = "4";
        break;
      case "SNIPER":
        strategyCode = "5";
        break;
    }

    const strategyParams = `Horizon=${parent.params.timeHorizonMinutes};Slice=${slice.sliceIndex}/${slice.totalSlices};Jitter=${parent.params.jitterPct}`;

    const fields = [
      "8=FIX.4.4",
      "9=000",
      "35=D", // NewOrderSingle
      `49=${senderCompId}`,
      "56=PRIME_BROKER_EXEC",
      `34=${slice.sliceIndex}`,
      `52=${timestamp}`,
      `11=${slice.fixClOrdId}`,
      `55=${parent.tradingSymbol}`,
      `48=${parent.tradingSymbol}`,
      "22=8", // Exchange Symbol Source
      `54=${side}`,
      `60=${timestamp}`,
      `38=${slice.quantity}`,
      "40=2", // Limit Order
      `44=${slice.limitPrice}`,
      `113=${slice.disclosedQuantity}`, // Disclosed Quantity (Iceberg)
      "59=0", // Day Order
      `847=${strategyCode}`, // TargetStrategy
      `848=${strategyParams}`, // TargetStrategyParameters
    ];

    const body = fields.slice(2).join("\x01") + "\x01";
    fields[1] = `9=${body.length}`;
    const fullMsg = fields.join("\x01") + "\x01";

    let checksum = 0;
    for (let i = 0; i < fullMsg.length; i++) {
      checksum = (checksum + fullMsg.charCodeAt(i)) % 256;
    }
    const checksumStr = checksum.toString().padStart(3, "0");

    return `${fullMsg}10=${checksumStr}\x01`;
  }

  /**
   * Executes a high-fidelity simulation of an Algo Parent Order.
   * Simulates spread crossing, slippage capture, and cryptographic receipt hashing.
   */
  public async simulateExecution(
    parentOrderId: string,
    onProgress?: (update: AlgoSimulationUpdate) => void,
    stepDelayMs: number = 200
  ): Promise<AlgoParentOrder> {
    const order = this.activeOrders.get(parentOrderId);
    if (!order) {
      throw new Error(`Order ${parentOrderId} not found.`);
    }

    order.status = "ACTIVE";
    order.startedAt = Date.now();

    let cumulativeFilledQty = 0;
    let cumulativeExecutedVal = 0;

    for (let i = 0; i < order.slices.length; i++) {
      const slice = order.slices[i];
      slice.status = "TRANSMITTED";

      // Small async delay for realistic UI streaming
      if (stepDelayMs > 0) {
        await new Promise((r) => setTimeout(r, stepDelayMs));
      }

      // Simulate micro-market fill price with realistic variance around limit
      const isBuy = order.transactionType === "BUY";
      const microVariance = (Math.sin(i * 1.3) * 0.0008); // +/- 8 bps micro variance
      const fillPrice = parseFloat((order.benchmarkPrice * (1 + microVariance)).toFixed(2));
      const fillQty = slice.quantity;
      const fillVal = parseFloat((fillQty * fillPrice).toFixed(2));

      // Calculate slice slippage vs arrival price in basis points
      const sliceSlippage = isBuy
        ? ((fillPrice - order.benchmarkPrice) / order.benchmarkPrice) * 10000
        : ((order.benchmarkPrice - fillPrice) / order.benchmarkPrice) * 10000;

      // Generate cryptographic slice receipt
      const receiptRaw = `${slice.fixClOrdId}:${fillQty}@${fillPrice}:${Date.now()}`;
      const receiptHash = CryptoJS.SHA256(receiptRaw).toString().slice(0, 32);

      slice.status = "FILLED";
      slice.filledQuantity = fillQty;
      slice.avgFillPrice = fillPrice;
      slice.executedValue = fillVal;
      slice.executionTimestamp = Date.now();
      slice.slippageBps = parseFloat(sliceSlippage.toFixed(2));
      slice.receiptHash = receiptHash;
      slice.brokerOrderId = `BRK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      cumulativeFilledQty += fillQty;
      cumulativeExecutedVal += fillVal;

      const currentVwap = parseFloat((cumulativeExecutedVal / cumulativeFilledQty).toFixed(2));
      const currentSlippage = isBuy
        ? ((currentVwap - order.benchmarkPrice) / order.benchmarkPrice) * 10000
        : ((order.benchmarkPrice - currentVwap) / order.benchmarkPrice) * 10000;

      if (onProgress) {
        onProgress({
          parentOrderId: order.parentOrderId,
          slice,
          completedSlicesCount: i + 1,
          totalSlicesCount: order.slices.length,
          progressPct: Math.round(((i + 1) / order.slices.length) * 100),
          currentVwap,
          currentSlippageBps: parseFloat(currentSlippage.toFixed(2)),
          isComplete: i === order.slices.length - 1,
        });
      }
    }

    order.status = "COMPLETED";
    order.completedAt = Date.now();
    order.totalFilledQuantity = cumulativeFilledQty;
    order.totalExecutedValue = parseFloat(cumulativeExecutedVal.toFixed(2));
    order.vwapAchieved = parseFloat((cumulativeExecutedVal / cumulativeFilledQty).toFixed(2));

    const isBuy = order.transactionType === "BUY";
    const overallSlippage = isBuy
      ? ((order.vwapAchieved - order.benchmarkPrice) / order.benchmarkPrice) * 10000
      : ((order.benchmarkPrice - order.vwapAchieved) / order.benchmarkPrice) * 10000;
    order.overallSlippageBps = parseFloat(overallSlippage.toFixed(2));

    // Sign complete parent order batch with cryptographic proof
    const batchProofRaw = `${order.parentOrderId}:${order.vwapAchieved}:${order.totalFilledQuantity}:${order.completedAt}`;
    order.executionReceiptHash = CryptoJS.SHA256(batchProofRaw).toString();

    return order;
  }

  public getOrder(parentOrderId: string): AlgoParentOrder | undefined {
    return this.activeOrders.get(parentOrderId);
  }

  public getAllOrders(): AlgoParentOrder[] {
    return Array.from(this.activeOrders.values());
  }
}

export const algoExecutionEngine = AlgoExecutionEngine.getInstance();
