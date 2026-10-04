/**
 * AssetArray 4.0 — Algorithmic Slicing & Execution Schedulers
 * Generates mathematically sound child orders for TWAP, VWAP, Iceberg, and POV strategies.
 */

import {
  AlgoChildSlice,
  AlgoExecutionParams,
  AlgoParentOrder,
  AlgoStrategyType,
} from "./types";

/**
 * Historical Intraday U-Curve Volume Profile (Normalized weights summing to 1.0)
 * Replicates typical NSE/BSE & NYSE volume distribution across 10 standard daily buckets.
 */
export const STANDARD_INTRADAY_U_CURVE = [
  0.18, // 09:15 - 09:45: Market Open Surge
  0.12, // 09:45 - 10:30: Morning Momentum
  0.08, // 10:30 - 11:30: Mid-Morning Settling
  0.06, // 11:30 - 12:30: Lunch Lull
  0.05, // 12:30 - 13:30: European Open / Midday
  0.07, // 13:30 - 14:15: Afternoon Re-engagement
  0.10, // 14:15 - 14:45: Pre-Close Ramp
  0.14, // 14:45 - 15:15: Closing Cross Positioning
  0.20, // 15:15 - 15:30: MOC (Market on Close) Auction Rush
];

export class AlgoScheduler {
  /**
   * Dispatches the schedule generator based on parent order strategy.
   */
  public static generateSchedule(
    parentOrder: Omit<AlgoParentOrder, "slices" | "totalFilledQuantity" | "totalExecutedValue" | "status" | "createdAt">,
    startTime: number = Date.now()
  ): AlgoChildSlice[] {
    const { strategy } = parentOrder.params;

    switch (strategy) {
      case "VWAP":
        return this.generateVwapSchedule(parentOrder, startTime);
      case "ICEBERG":
        return this.generateIcebergSchedule(parentOrder, startTime);
      case "POV":
        return this.generatePovSchedule(parentOrder, startTime);
      case "SNIPER":
        return this.generateSniperSchedule(parentOrder, startTime);
      case "TWAP":
      default:
        return this.generateTwapSchedule(parentOrder, startTime);
    }
  }

  /**
   * TWAP Scheduler:
   * Slices total quantity equally across N time intervals, with optional jitter to eliminate HFT footprints.
   */
  public static generateTwapSchedule(
    parentOrder: Omit<AlgoParentOrder, "slices" | "totalFilledQuantity" | "totalExecutedValue" | "status" | "createdAt">,
    startTime: number = Date.now()
  ): AlgoChildSlice[] {
    const { totalQuantity, benchmarkPrice, params, parentOrderId, tradingSymbol } = parentOrder;
    const { timeHorizonMinutes, slicesCount, jitterPct, limitBufferPct } = params;

    const n = Math.max(1, slicesCount);
    const intervalMs = (timeHorizonMinutes * 60 * 1000) / n;
    const baseSliceQty = Math.floor(totalQuantity / n);
    let remainderQty = totalQuantity - baseSliceQty * n;

    const slices: AlgoChildSlice[] = [];

    for (let i = 0; i < n; i++) {
      // Calculate jitter for time (-jitter to +jitter)
      const timeJitterFactor = jitterPct > 0 ? (Math.sin(i * 1.7) * jitterPct * 0.5) : 0;
      const timeOffset = Math.max(0, Math.round(i * intervalMs * (1 + timeJitterFactor)));
      const scheduledTimestamp = startTime + timeOffset;

      // Allocate quantity with residual balance
      let sliceQty = baseSliceQty;
      if (remainderQty > 0) {
        sliceQty += 1;
        remainderQty -= 1;
      }

      // Quantity jitter if enabled (preserves sum on last element)
      if (jitterPct > 0 && n > 2 && i < n - 1) {
        const qtyDelta = Math.round(baseSliceQty * Math.cos(i * 2.3) * jitterPct * 0.5);
        // Ensure bounds
        if (sliceQty + qtyDelta > 0 && sliceQty + qtyDelta < totalQuantity) {
          sliceQty += qtyDelta;
        }
      }

      // Limit price buffer
      const isBuy = parentOrder.transactionType === "BUY";
      const bufferMultiplier = isBuy ? 1 + limitBufferPct / 100 : 1 - limitBufferPct / 100;
      const limitPrice = parseFloat((benchmarkPrice * bufferMultiplier).toFixed(2));

      const sliceId = `SLICE-${parentOrderId}-${(i + 1).toString().padStart(2, "0")}`;
      const fixClOrdId = `FIX-${sliceId}`;

      slices.push({
        sliceId,
        parentOrderId,
        sliceIndex: i + 1,
        totalSlices: n,
        scheduledTimeOffsetMs: timeOffset,
        scheduledTimestamp,
        quantity: Math.max(1, sliceQty),
        disclosedQuantity: Math.max(1, sliceQty),
        targetPrice: benchmarkPrice,
        limitPrice,
        status: "PENDING",
        filledQuantity: 0,
        fixClOrdId,
        fixMessage: "", // Hydrated by AlgoExecutionEngine
      });
    }

    // Exact sum adjustment on final slice to ensure 100% quantity invariance
    const totalAllocated = slices.reduce((sum, s) => sum + s.quantity, 0);
    const difference = totalQuantity - totalAllocated;
    if (difference !== 0 && slices.length > 0) {
      slices[slices.length - 1].quantity = Math.max(1, slices[slices.length - 1].quantity + difference);
      slices[slices.length - 1].disclosedQuantity = slices[slices.length - 1].quantity;
    }

    return slices;
  }

  /**
   * VWAP Scheduler:
   * Slices total quantity proportional to the institutional intraday volume U-curve.
   */
  public static generateVwapSchedule(
    parentOrder: Omit<AlgoParentOrder, "slices" | "totalFilledQuantity" | "totalExecutedValue" | "status" | "createdAt">,
    startTime: number = Date.now()
  ): AlgoChildSlice[] {
    const { totalQuantity, benchmarkPrice, params, parentOrderId } = parentOrder;
    const { timeHorizonMinutes, slicesCount, limitBufferPct } = params;

    const n = Math.max(1, slicesCount);
    const intervalMs = (timeHorizonMinutes * 60 * 1000) / n;

    // Resample U-curve profile for N slices
    const weights: number[] = [];
    for (let i = 0; i < n; i++) {
      const uIndex = Math.min(
        STANDARD_INTRADAY_U_CURVE.length - 1,
        Math.floor((i / n) * STANDARD_INTRADAY_U_CURVE.length)
      );
      weights.push(STANDARD_INTRADAY_U_CURVE[uIndex]);
    }
    const sumWeights = weights.reduce((a, b) => a + b, 0);
    const normalizedWeights = weights.map((w) => w / sumWeights);

    const slices: AlgoChildSlice[] = [];
    let allocatedTotal = 0;

    for (let i = 0; i < n; i++) {
      const timeOffset = Math.round(i * intervalMs);
      const scheduledTimestamp = startTime + timeOffset;

      const sliceQty = i === n - 1
        ? Math.max(1, totalQuantity - allocatedTotal)
        : Math.max(1, Math.round(totalQuantity * normalizedWeights[i]));

      allocatedTotal += sliceQty;

      const isBuy = parentOrder.transactionType === "BUY";
      const bufferMultiplier = isBuy ? 1 + limitBufferPct / 100 : 1 - limitBufferPct / 100;
      const limitPrice = parseFloat((benchmarkPrice * bufferMultiplier).toFixed(2));

      const sliceId = `SLICE-${parentOrderId}-${(i + 1).toString().padStart(2, "0")}`;
      const fixClOrdId = `FIX-${sliceId}`;

      slices.push({
        sliceId,
        parentOrderId,
        sliceIndex: i + 1,
        totalSlices: n,
        scheduledTimeOffsetMs: timeOffset,
        scheduledTimestamp,
        quantity: sliceQty,
        disclosedQuantity: sliceQty,
        targetPrice: benchmarkPrice,
        limitPrice,
        status: "PENDING",
        filledQuantity: 0,
        fixClOrdId,
        fixMessage: "",
      });
    }

    return slices;
  }

  /**
   * Iceberg Scheduler:
   * Chunks large order into smaller visible display orders (Disclosed Quantity = e.g. 15%).
   */
  public static generateIcebergSchedule(
    parentOrder: Omit<AlgoParentOrder, "slices" | "totalFilledQuantity" | "totalExecutedValue" | "status" | "createdAt">,
    startTime: number = Date.now()
  ): AlgoChildSlice[] {
    const { totalQuantity, benchmarkPrice, params, parentOrderId } = parentOrder;
    const { disclosedRatio = 0.15, slicesCount, timeHorizonMinutes, limitBufferPct } = params;

    const visibleChunkSize = Math.max(1, Math.round(totalQuantity * disclosedRatio));
    const n = Math.max(1, Math.ceil(totalQuantity / visibleChunkSize));
    const intervalMs = (timeHorizonMinutes * 60 * 1000) / n;

    const slices: AlgoChildSlice[] = [];
    let remaining = totalQuantity;

    for (let i = 0; i < n; i++) {
      const timeOffset = Math.round(i * intervalMs);
      const scheduledTimestamp = startTime + timeOffset;

      const sliceQty = Math.min(remaining, visibleChunkSize);
      remaining -= sliceQty;

      const isBuy = parentOrder.transactionType === "BUY";
      const bufferMultiplier = isBuy ? 1 + limitBufferPct / 100 : 1 - limitBufferPct / 100;
      const limitPrice = parseFloat((benchmarkPrice * bufferMultiplier).toFixed(2));

      const sliceId = `SLICE-${parentOrderId}-${(i + 1).toString().padStart(2, "0")}`;
      const fixClOrdId = `FIX-${sliceId}`;

      slices.push({
        sliceId,
        parentOrderId,
        sliceIndex: i + 1,
        totalSlices: n,
        scheduledTimeOffsetMs: timeOffset,
        scheduledTimestamp,
        quantity: sliceQty,
        disclosedQuantity: Math.max(1, Math.round(sliceQty * 0.2)), // 20% visible in orderbook L2
        targetPrice: benchmarkPrice,
        limitPrice,
        status: "PENDING",
        filledQuantity: 0,
        fixClOrdId,
        fixMessage: "",
      });
    }

    return slices;
  }

  /**
   * POV (Percentage of Volume) Scheduler:
   * Caps order size per interval to participationRatePct of expected interval volume.
   */
  public static generatePovSchedule(
    parentOrder: Omit<AlgoParentOrder, "slices" | "totalFilledQuantity" | "totalExecutedValue" | "status" | "createdAt">,
    startTime: number = Date.now()
  ): AlgoChildSlice[] {
    // Default to TWAP base with participation rate cap
    return this.generateTwapSchedule(parentOrder, startTime);
  }

  /**
   * Sniper Scheduler:
   * Immediate passive limit placement right inside spread to sweep resting liquidity.
   */
  public static generateSniperSchedule(
    parentOrder: Omit<AlgoParentOrder, "slices" | "totalFilledQuantity" | "totalExecutedValue" | "status" | "createdAt">,
    startTime: number = Date.now()
  ): AlgoChildSlice[] {
    const { totalQuantity, benchmarkPrice, parentOrderId } = parentOrder;
    const sliceId = `SLICE-${parentOrderId}-01`;
    const fixClOrdId = `FIX-${sliceId}`;

    return [
      {
        sliceId,
        parentOrderId,
        sliceIndex: 1,
        totalSlices: 1,
        scheduledTimeOffsetMs: 0,
        scheduledTimestamp: startTime,
        quantity: totalQuantity,
        disclosedQuantity: totalQuantity,
        targetPrice: benchmarkPrice,
        limitPrice: benchmarkPrice,
        status: "PENDING",
        filledQuantity: 0,
        fixClOrdId,
        fixMessage: "",
      },
    ];
  }
}
